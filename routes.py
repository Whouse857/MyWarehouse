# --- [فایل تعریف تمام APIها] ---
import os
import time
import json
import shutil
import sqlite3
import threading
from datetime import datetime
from flask import jsonify, request, Response, send_file
from config import DATABASE_FILE, INDEX_FILE, BACKUP_FOLDER, DEFAULT_COMPONENT_CONFIG
from database import get_db_connection
from auth_utils import hash_password, parse_permissions_recursive
from services import fetch_daily_usd_price, USD_CACHE

# متغیر کش برای ایندکس
GLOBAL_INDEX_CACHE = None

def register_routes(app, server_state):
    
    @app.route('/')
    def serve_index() -> Response:
        global GLOBAL_INDEX_CACHE
        if GLOBAL_INDEX_CACHE: return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, 'rb') as f: GLOBAL_INDEX_CACHE = f.read()
            return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        return "Error: index.html not found.", 404

    @app.route('/api/heartbeat', methods=['POST'])
    def heartbeat() -> Response:
        server_state["last_heartbeat"] = time.time(); server_state["shutdown_trigger"] = False
        return jsonify({"status": "alive"})

    @app.route('/api/client_closed', methods=['POST'])
    def client_closed() -> Response:
        server_state["shutdown_trigger"] = True
        return jsonify({"status": "closing_soon"})

    @app.route('/api/exit_app', methods=['POST'])
    def exit_app() -> Response:
        def shutdown(): time.sleep(0.5); os._exit(0)
        threading.Thread(target=shutdown).start()
        return jsonify({"status": "exiting"}), 200

    # --- بخش بک‌آپ ---
    # --- بخش بک‌آپ (نسخه جدید با انتخاب پوشه ویندوز) ---
    @app.route('/api/backup/create', methods=['POST'])
    def create_backup():
        try:
            # ۱. باز کردن پنجره انتخاب پوشه ویندوز
            from tkinter import filedialog, Tk
            root = Tk()
            root.withdraw() # مخفی کردن پنجره اصلی tkinter
            root.attributes("-topmost", True) # آوردن پنجره به روی بقیه برنامه‌ها
            
            # ۲. دریافت مسیر از کاربر
            dest_folder = filedialog.askdirectory(title="محل ذخیره فایل بک‌آپ را انتخاب کنید")
            root.destroy()
            
            # اگر کاربر کنسل کرد
            if not dest_folder:
                return jsonify({"error": "عملیات توسط کاربر لغو شد"}), 400

            data = request.json or {}
            username = data.get('username', 'System')
            safe_username = "".join([c for c in username if c.isalnum() or c in ('-','_')])
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"nexus_backup_{safe_username}_{timestamp}.db"
            
            # ۳. تهیه بک‌آپ و کپی در مسیر انتخابی
            with get_db_connection() as conn: conn.execute("PRAGMA wal_checkpoint(FULL);")
            time.sleep(0.1)
            
            dest_path = os.path.join(dest_folder, filename)
            shutil.copy2(DATABASE_FILE, dest_path)
            
            # ۴. یک کپی هم برای لیست شدن در خود برنامه در پوشه backups می‌گذاریم
            internal_dest = os.path.join(BACKUP_FOLDER, filename)
            shutil.copy2(DATABASE_FILE, internal_dest)
            
            return jsonify({"success": True, "filename": filename, "full_path": dest_path})
        except Exception as e: 
            return jsonify({"error": str(e)}), 500
        
    @app.route('/api/backup/list', methods=['GET'])
    def list_backups():
        try:
            files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.db')]
            files.sort(reverse=True)
            backups = []
            for f in files:
                path = os.path.join(BACKUP_FOLDER, f)
                size = os.path.getsize(path) / 1024
                name_part = f.replace("nexus_backup_", "").replace(".db", "")
                creator = "سیستم/قدیمی"
                readable_date = f
                if len(name_part) >= 19:
                    ts_str = name_part[-19:]
                    if len(name_part) > 20: creator = name_part[:-20]
                    elif len(name_part) == 19: creator = "System"
                    try: 
                        dt = datetime.strptime(ts_str, "%Y-%m-%d_%H-%M-%S")
                        readable_date = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except: readable_date = f
                backups.append({"name": f, "size": round(size, 2), "date": readable_date, "creator": creator})
            return jsonify(backups)
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/backup/restore/<filename>', methods=['POST'])
    def restore_backup(filename: str):
        try:
            src = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(src): return jsonify({"error": "File not found"}), 404
            temp_backup = DATABASE_FILE + ".tmp"
            if os.path.exists(DATABASE_FILE): shutil.copy2(DATABASE_FILE, temp_backup)
            try:
                shutil.copy2(src, DATABASE_FILE)
                if os.path.exists(temp_backup): os.remove(temp_backup)
                return jsonify({"success": True})
            except Exception as e:
                if os.path.exists(temp_backup): shutil.copy2(temp_backup, DATABASE_FILE)
                raise e
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/backup/delete/<filename>', methods=['DELETE'])
    def delete_backup(filename: str):
        try:
            src = os.path.join(BACKUP_FOLDER, filename); 
            if not os.path.exists(src): return jsonify({"error": "File not found"}), 404
            os.remove(src); return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    # --- بخش احراز هویت ---
    @app.route('/api/login', methods=['POST'])
    def login():
        try:
            data = request.json
            if not data: return jsonify({"error": "No data"}), 400
            username = data.get('username')
            password = data.get('password')
            if not username or not password: return jsonify({"success": False, "message": "نام کاربری و رمز عبور الزامی است"}), 400
            with get_db_connection() as conn:
                user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, hash_password(password))).fetchone()
                if user:
                    perms = parse_permissions_recursive(user['permissions'])
                    return jsonify({ "success": True, "role": user['role'], "username": user['username'], "permissions": perms, "full_name": user['full_name'] })
                return jsonify({"success": False, "message": "نام کاربری یا رمز عبور اشتباه است"}), 401
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/users', methods=['GET'])
    def get_users():
        with get_db_connection() as conn:
            users = conn.execute("SELECT id, username, role, full_name, mobile, permissions FROM users").fetchall()
            result = []
            for u in users:
                d = dict(u)
                d['permissions'] = parse_permissions_recursive(d['permissions'])
                result.append(d)
            return jsonify(result)

    @app.route('/api/users/save', methods=['POST'])
    def save_user():
        try:
            d = request.json
            user_id = d.get('id'); username = d.get('username'); password = d.get('password')
            role = d.get('role', 'operator'); full_name = d.get('full_name', ''); mobile = d.get('mobile', '')
            perms_input = d.get('permissions', {})
            if isinstance(perms_input, str): perms_input = parse_permissions_recursive(perms_input)
            perms_json = json.dumps(perms_input)
            if not username: return jsonify({"error": "Username required"}), 400
            with get_db_connection() as conn:
                if user_id:
                    if password and password.strip():
                        conn.execute("UPDATE users SET username=?, password=?, role=?, full_name=?, mobile=?, permissions=? WHERE id=?", 
                                    (username, hash_password(password), role, full_name, mobile, perms_json, user_id))
                    else:
                        conn.execute("UPDATE users SET username=?, role=?, full_name=?, mobile=?, permissions=? WHERE id=?", 
                                    (username, role, full_name, mobile, perms_json, user_id))
                else:
                    if not password: return jsonify({"error": "Password required for new user"}), 400
                    conn.execute("INSERT INTO users (username, password, role, full_name, mobile, permissions) VALUES (?, ?, ?, ?, ?, ?)", 
                                (username, hash_password(password), role, full_name, mobile, perms_json))
                conn.commit()
                return jsonify({"success": True})
        except sqlite3.IntegrityError: return jsonify({"error": "Duplicate username"}), 400
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/users/delete/<int:id>', methods=['DELETE'])
    def delete_user(id: int):
        with get_db_connection() as conn:
            target = conn.execute("SELECT username FROM users WHERE id=?", (id,)).fetchone()
            if target and target['username'] == 'admin': return jsonify({"error": "Cannot delete admin"}), 403
            conn.execute("DELETE FROM users WHERE id=?", (id,))
            conn.commit()
            return jsonify({"success": True})

    @app.route('/api/user/change_password', methods=['POST'])
    def change_password_api():
        try:
            d = request.json
            username = d.get('username'); old_pass = d.get('old_password'); new_pass = d.get('new_password')
            if not username or not old_pass or not new_pass: return jsonify({"success": False, "message": "اطلاعات ناقص است"}), 400
            with get_db_connection() as conn:
                user = conn.execute("SELECT id FROM users WHERE username = ? AND password = ?", (username, hash_password(old_pass))).fetchone()
                if not user: return jsonify({"success": False, "message": "رمز عبور فعلی اشتباه است"}), 401
                conn.execute("UPDATE users SET password = ? WHERE id = ?", (hash_password(new_pass), user['id']))
                conn.commit()
                return jsonify({"success": True})
        except Exception as e: return jsonify({"success": False, "error": str(e)}), 500

    # --- بخش تنظیمات ---
    @app.route('/api/settings/config', methods=['GET'])
    def get_config():
        with get_db_connection() as conn:
            row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
            if row: 
                stored_config = json.loads(row['value'])
                for key, val in DEFAULT_COMPONENT_CONFIG.items():
                    if key not in stored_config: stored_config[key] = val
                return jsonify(stored_config)
            return jsonify(DEFAULT_COMPONENT_CONFIG)

    @app.route('/api/settings/config', methods=['POST'])
    def save_config():
        try:
            new_config = request.json
            with get_db_connection() as conn:
                conn.execute("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)", ('component_config', json.dumps(new_config)))
                conn.commit()
                return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/settings/rename', methods=['POST'])
    def rename_item_api():
        try:
            d = request.json
            mode = d.get('mode'); old_val = d.get('oldVal'); new_val = d.get('newVal'); category = d.get('category'); list_name = d.get('listName')
            if not old_val or not new_val: return jsonify({"error": "Empty values"}), 400
            with get_db_connection() as conn:
                row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
                if not row: return jsonify({"error": "Config error"}), 500
                config = json.loads(row['value'])
                if mode == 'category':
                    if old_val not in config: return jsonify({"error": "Category not found"}), 404
                    if new_val in config: return jsonify({"error": "Category exists"}), 400
                    config[new_val] = config.pop(old_val); config[new_val]['label'] = new_val 
                    conn.execute("UPDATE parts SET type = ? WHERE type = ?", (new_val, old_val))
                elif mode == 'item':
                    if category not in config: return jsonify({"error": "Category not found"}), 404
                    target_list = config[category].get(list_name)
                    if target_list is None or old_val not in target_list: return jsonify({"error": "Item not found"}), 404
                    idx = target_list.index(old_val); target_list[idx] = new_val
                    col_map = {'packages': 'package', 'techs': 'tech', 'locations': 'storage_location', 'paramOptions': 'watt'}
                    if list_name in col_map:
                        db_col = col_map[list_name]
                        if category == 'General' and list_name == 'locations': conn.execute(f"UPDATE parts SET {db_col} = ? WHERE {db_col} = ?", (new_val, old_val))
                        else: conn.execute(f"UPDATE parts SET {db_col} = ? WHERE {db_col} = ? AND type = ?", (new_val, old_val, category))
                conn.execute("UPDATE app_config SET value = ? WHERE key = 'component_config'", (json.dumps(config),))
                conn.commit()
                return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    # --- بخش قطعات ---
    @app.route('/api/parts', methods=['GET'])
    def get_parts():
        with get_db_connection() as conn:
            parts = conn.execute('SELECT * FROM parts ORDER BY id DESC').fetchall()
            return jsonify([dict(p) for p in parts])

    @app.route('/api/save', methods=['POST'])
    
    def save_part():
        try:
            d = request.json
            part_id = d.get('id'); username = d.get('username', 'unknown')
            raw_price = str(d.get("price", "")).replace(',', ''); price = float(raw_price) if raw_price and raw_price.replace('.', '', 1).isdigit() else 0.0
            raw_usd = str(d.get("usd_rate", "")).replace(',', '')
            usd_rate = float(raw_usd) if raw_usd and raw_usd.replace('.', '', 1).isdigit() else 0.0
            
            inv_num = d.get("invoice_number", "")
            current_entry_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            with get_db_connection() as conn:
                # --- اضافه کردن این بخش برای مدیریت قطعات حذف شده ---
                if part_id:
                    exists = conn.execute("SELECT id FROM parts WHERE id = ?", (part_id,)).fetchone()
                    if not exists:
                        part_id = None  # اگر قطعه حذف شده، آن را به عنوان قطعه جدید ثبت کن
                # ---------------------------------------------------
                row_cfg = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
                config = json.loads(row_cfg['value']) if row_cfg else {}
                prefix = config.get(d.get("type"), {}).get("prefix", "PRT")

               # --- بخش اصلاح شده برای تولید کد انبار صعودی و یکتا ---
                part_code = d.get("part_code", "")
                if not part_id and not part_code:
                    # پیدا کردن آخرین کد ثبت شده برای این نوع قطعه
                    last_row = conn.execute(
                        "SELECT part_code FROM parts WHERE type = ? AND part_code LIKE ? ORDER BY part_code DESC LIMIT 1",
                        (d.get("type"), f"{prefix}%")
                    ).fetchone()
                    
                    if last_row and last_row['part_code']:
                        try:
                            # استخراج عدد از انتهای کد و اضافه کردن یک واحد به آن
                            last_num_str = last_row['part_code'][len(prefix):]
                            next_num = int(last_num_str) + 1
                        except:
                            next_num = 1
                    else:
                        next_num = 1
                    
                    part_code = f"{prefix}{str(next_num).zfill(9)}"
                # -------------------------------------------------------

                links = d.get("purchase_links", []); links_json = json.dumps(links[:5]) if isinstance(links, list) else "[]"
                
                # --- تغییر: دریافت مقادیر فیلدهای جدید ---
                payload = {
                    "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""), "package": d.get("pkg", ""), "type": d.get("type", ""), "buy_date": d.get("date", ""),
                    "quantity": int(d.get("qty") or 0), "toman_price": price, "reason": d.get("reason", ""), "min_quantity": int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
                    "last_modified_by": username, "storage_location": d.get("location", ""), "tech": d.get("tech", ""), "usd_rate": usd_rate, "purchase_links": links_json,
                    "invoice_number": inv_num, "entry_date": current_entry_date , "part_code": part_code,
                    # اضافه شدن فیلدها به دیکشنری
                    "list5": d.get("list5", ""), "list6": d.get("list6", ""), "list7": d.get("list7", ""), 
                    "list8": d.get("list8", ""), "list9": d.get("list9", ""), "list10": d.get("list10", "")
                }
                
                op = 'ENTRY (New)'; qty_change = payload['quantity']
                dup_sql = "SELECT id, quantity FROM parts WHERE val=? AND watt=? AND tolerance=? AND package=? AND type=? AND tech=? AND storage_location=?"
                dup_params = (payload['val'], payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['tech'], payload['storage_location'])
                
                if part_id:
                    existing = conn.execute(dup_sql + " AND id != ?", (*dup_params, part_id)).fetchone()
                    if existing: return jsonify({"error": "Duplicate part"}), 400
                    old = conn.execute('SELECT quantity FROM parts WHERE id = ?', (part_id,)).fetchone()
                    old_q = old['quantity'] if old else 0
                    if payload['quantity'] > old_q: op = 'ENTRY (Refill)'
                    elif payload['quantity'] < old_q: op = 'UPDATE (Decrease)'
                    else: op = 'UPDATE (Edit)'
                    qty_change = payload['quantity'] - old_q
                    
                    # --- آپدیت دستور SQL برای ذخیره فیلدهای جدید ---
                    conn.execute("""UPDATE parts SET val=?, watt=?, tolerance=?, package=?, type=?, buy_date=?, quantity=?, toman_price=?, reason=?, min_quantity=?, vendor_name=?, last_modified_by=?, storage_location=?, tech=?, usd_rate=?, purchase_links=?, invoice_number=?, entry_date=?, part_code=?, list5=?, list6=?, list7=?, list8=?, list9=?, list10=? WHERE id=?""", (*payload.values(), part_id))
                    rid = part_id
                else:
                    existing = conn.execute(dup_sql, dup_params).fetchone()
                    if existing:
                        rid = existing['id']
                        old_p = conn.execute("SELECT part_code FROM parts WHERE id = ?", (rid,)).fetchone()
                        if old_p and old_p['part_code']:
                            payload['part_code'] = old_p['part_code']
                        
                        new_qty = existing['quantity'] + qty_change; op = 'ENTRY (Refill - Merge)'
                        # توجه: در حالت ادغام (Merge)، معمولاً مشخصات فنی تغییر نمی‌کند، پس لیست‌ها را آپدیت نمی‌کنیم یا اگر بخواهید می‌توانید اضافه کنید.
                        # اینجا فقط موارد اصلی آپدیت می‌شوند.
                        conn.execute("UPDATE parts SET quantity=?, toman_price=?, buy_date=?, vendor_name=?, last_modified_by=?, reason=?, usd_rate=?, purchase_links=?, invoice_number=?, entry_date=?, part_code=? WHERE id=?", (new_qty, payload['toman_price'], payload['buy_date'], payload['vendor_name'], username, payload['reason'], payload['usd_rate'], payload['purchase_links'], payload['invoice_number'], payload['entry_date'], payload['part_code'], rid))
                    else:
                        # --- آپدیت دستور INSERT ---
                        cur = conn.execute("INSERT INTO parts (val, watt, tolerance, package, type, buy_date, quantity, toman_price, reason, min_quantity, vendor_name, last_modified_by, storage_location, tech, usd_rate, purchase_links, invoice_number, entry_date, part_code, list5, list6, list7, list8, list9, list10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", tuple(payload.values())); rid = cur.lastrowid
                
                # --- آپدیت لاگ برای شامل شدن فیلدهای جدید ---
                conn.execute("INSERT INTO purchase_log (part_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username, watt, tolerance, package, type, storage_location, tech, usd_rate, invoice_number, part_code, list5, list6, list7, list8, list9, list10) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                            (rid, payload['val'], qty_change, payload['toman_price'], payload['vendor_name'], payload['buy_date'], payload['reason'], op, username, payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['storage_location'], payload['tech'], payload['usd_rate'], inv_num, payload['part_code'], payload['list5'], payload['list6'], payload['list7'], payload['list8'], payload['list9'], payload['list10']))
                conn.commit()
            return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500
        
    @app.route('/api/withdraw', methods=['POST'])
    def withdraw_parts():
        try:
            data = request.json; items = data.get('items', []); project_name = data.get('project', 'General Usage'); username = data.get('username', 'unknown')
            if not items: return jsonify({"error": "No items selected"}), 400
            with get_db_connection() as conn:
                for item in items:
                    part_id = item['id']; qty_to_remove = int(item['qty'])
                    row = conn.execute("SELECT quantity, val FROM parts WHERE id = ?", (part_id,)).fetchone()
                    if not row: return jsonify({"error": f"Part ID {part_id} not found."}), 404
                    if row['quantity'] < qty_to_remove: return jsonify({"error": f"موجودی ناکافی برای قطعه {row['val']}. (موجودی: {row['quantity']})"}), 400
                for item in items:
                    part_id = item['id']; qty_to_remove = int(item['qty'])
                    row = conn.execute("SELECT * FROM parts WHERE id = ?", (part_id,)).fetchone()
                    new_qty = row['quantity'] - qty_to_remove
                    conn.execute("UPDATE parts SET quantity = ?, last_modified_by = ? WHERE id = ?", (new_qty, username, part_id))
                    conn.execute("""INSERT INTO purchase_log (part_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username, watt, tolerance, package, type, storage_location, tech, usd_rate, part_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", 
                            (part_id, row['val'], -qty_to_remove, row['toman_price'], row['vendor_name'], datetime.now().strftime("%Y-%m-%d"), project_name, 'EXIT (Project)', username, row['watt'], row['tolerance'], row['package'], row['type'], row['storage_location'], row['tech'], row['usd_rate'], row['part_code']))
                conn.commit()
            return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/delete/<int:id>', methods=['DELETE'])
    def delete_part(id: int):
        with get_db_connection() as conn:
            try:
                part = conn.execute("SELECT * FROM parts WHERE id=?", (id,)).fetchone()
                if part: 
                    conn.execute("""INSERT INTO purchase_log (part_id, val, quantity_added, operation_type, reason, watt, tolerance, package, type, storage_location, tech, part_code) 
                                 VALUES (?, ?, 0, 'DELETE', 'Deleted by user', ?, ?, ?, ?, ?, ?, ?)""", 
                                 (id, part['val'], part['watt'], part['tolerance'], part['package'], part['type'], part['storage_location'], part['tech'], part['part_code']))
            except: pass
            conn.execute('DELETE FROM parts WHERE id = ?', (id,))
            conn.commit()
            return jsonify({"success": True})

    @app.route('/api/contacts', methods=['GET'])
    def get_contacts():
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM contacts ORDER BY name ASC').fetchall()
            return jsonify([dict(r) for r in rows])

    @app.route('/api/contacts/save', methods=['POST'])
    def save_contact():
        try:
            d = request.json
            params = (d.get("name"), d.get("phone"), d.get("mobile"), d.get("fax"), d.get("website"), d.get("email"), d.get("address"), d.get("notes"))
            with get_db_connection() as conn:
                if d.get('id'): conn.execute("UPDATE contacts SET name=?, phone=?, mobile=?, fax=?, website=?, email=?, address=?, notes=? WHERE id=?", (*params, d['id']))
                else: conn.execute("INSERT INTO contacts (name, phone, mobile, fax, website, email, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", params)
                conn.commit()
                return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/contacts/delete/<int:id>', methods=['DELETE'])
    def delete_contact(id: int):
        with get_db_connection() as conn: conn.execute('DELETE FROM contacts WHERE id = ?', (id,)); conn.commit()
        return jsonify({"success": True})

    @app.route('/api/log', methods=['GET'])
    def get_log():
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC').fetchall()
            return jsonify([dict(r) for r in rows])

    @app.route('/api/inventory/stats', methods=['GET'])
    def get_inventory_stats():
        try:
            daily_usd_price = fetch_daily_usd_price()
            usd_date = USD_CACHE.get("date_str", "")
            with get_db_connection() as conn:
                # اضافه شدن ستون‌های جدید به کوئری
                rows = conn.execute("SELECT id, val, quantity, toman_price, usd_rate, min_quantity, type, package, storage_location, watt, tolerance, tech, vendor_name, purchase_links, invoice_number, part_code FROM parts").fetchall()
                total_items = len(rows); total_quantity = 0; total_value_toman_calculated = 0.0; total_value_usd_live = 0.0; shortages = []; categories = {}
                for row in rows:
                    q = row['quantity'] or 0; p = row['toman_price'] or 0.0; u = row['usd_rate'] or 0.0; min_q = row['min_quantity'] or 0; cat = row['type'] or 'Uncategorized'
                    total_quantity += q
                    if u > 0 and daily_usd_price > 0: current_part_value_toman = (p / u) * q * daily_usd_price
                    else: current_part_value_toman = p * q
                    total_value_toman_calculated += current_part_value_toman
                    
                    if q <= min_q:
                        links = []
                        try: 
                            if row['purchase_links']: links = json.loads(row['purchase_links'])
                        except: pass
                        # ارسال کد انبار و فاکتور به لیست کسری‌ها
                        shortages.append({
                            "id": row['id'], "val": row['val'], "pkg": row['package'], "qty": q, "min": min_q, 
                            "loc": row['storage_location'], "type": row['type'], "watt": row['watt'], 
                            "tolerance": row['tolerance'], "tech": row['tech'], "vendor": row['vendor_name'], 
                            "links": links, "invoice_number": row['invoice_number'], "part_code": row['part_code']
                        })
                        
                    if cat not in categories: categories[cat] = {"count": 0, "value": 0}
                    categories[cat]["count"] += q; categories[cat]["value"] += current_part_value_toman
                
                if daily_usd_price > 0: total_value_usd_live = total_value_toman_calculated / daily_usd_price
                else: total_value_usd_live = 0
                shortages.sort(key=lambda x: x['qty'])
                
                return jsonify({
                    "total_items": total_items, "total_quantity": total_quantity, "total_value_toman": int(total_value_toman_calculated),
                    "total_value_usd_live": round(total_value_usd_live, 2), "live_usd_price": daily_usd_price, "usd_date": usd_date, "shortages": shortages, "categories": categories
                })   
        except Exception as e: return jsonify({"error": str(e)}), 500
# --- [بخش جدید: مدیریت هوشمند لاگ‌ها و اصلاح انبار] ---
    @app.route('/api/log/delete/<int:log_id>', methods=['DELETE'])
    def delete_log_entry(log_id: int) -> Response:
        try:
            with get_db_connection() as conn:
                log = conn.execute("SELECT * FROM purchase_log WHERE log_id = ?", (log_id,)).fetchone()
                if not log: return jsonify({"ok": False, "error": "Log not found"}), 404
                
                # واگردانی اثر تراکنش روی انبار (معکوس کردن مقدار قبلی)
                # اگر ورود بوده (مثبت)، از انبار کم میشود. اگر خروج بوده (منفی)، به انبار اضافه میشود.
                conn.execute("UPDATE parts SET quantity = quantity - ? WHERE id = ?", (log['quantity_added'], log['part_id']))
                
                # حذف لاگ
                conn.execute("DELETE FROM purchase_log WHERE log_id = ?", (log_id,))
                conn.commit()
                return jsonify({"ok": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    @app.route('/api/log/update', methods=['POST'])
    def update_log_entry() -> Response:
        try:
            data = request.get_json()
            log_id = data.get('log_id')
            new_qty = float(data.get('quantity_added', 0))
            new_reason = data.get('reason', '')
            
            with get_db_connection() as conn:
                old_log = conn.execute("SELECT * FROM purchase_log WHERE log_id = ?", (log_id,)).fetchone()
                if not old_log: return jsonify({"ok": False, "error": "Log not found"}), 404
                
                # اعمال تفاضل مقدار جدید و قدیم روی انبار
                # مثلا اگر قبلا ۱۰ تا وارد شده و الان کردیم ۱۲ تا، باید ۲ تا به انبار اضافه شود
                diff = new_qty - old_log['quantity_added']
                conn.execute("UPDATE parts SET quantity = quantity + ? WHERE id = ?", (diff, old_log['part_id']))
                
                # بروزرسانی لاگ
                conn.execute("UPDATE purchase_log SET quantity_added = ?, reason = ? WHERE log_id = ?", (new_qty, new_reason, log_id))
                conn.commit()
                return jsonify({"ok": True})
        except Exception as e: return jsonify({"error": str(e)}), 500    