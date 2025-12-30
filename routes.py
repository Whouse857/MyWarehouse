# =========================================================================
# نام فایل: routes.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این فایل تمام مسیرهای API (Endpoints) سرور Flask را تعریف و مدیریت می‌کند.
# وظیفه اصلی آن دریافت درخواست‌های کلاینت، پردازش آن‌ها (با کمک دیتابیس) و ارسال پاسخ مناسب است.
# * بخش‌های کلیدی:
# 1. System Routes: مسیرهای مربوط به وضعیت سرور، فایل اصلی و خروج.
# 2. Backup Routes: مدیریت ایجاد، لیست، دانلود و بازگردانی بک‌آپ‌ها.
# 3. User Management: ورود، ثبت‌نام، ویرایش و حذف کاربران.
# 4. Settings: مدیریت تنظیمات کلی سیستم و دسته‌بندی‌ها.
# 5. Inventory Operations: عملیات اصلی انبار (لیست، ذخیره، حذف، خروج).
# 6. Logs & Stats: گزارش‌گیری، آمار و تاریخچه عملیات.
# =========================================================================

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

# متغیر کش برای ذخیره محتوای فایل اصلی رابط کاربری (بهبود سرعت لود)
GLOBAL_INDEX_CACHE = None

# =========================================================================
# نام تابع: register_routes
# کارایی: تابع اصلی برای ثبت تمام مسیرها به اپلیکیشن Flask
# =========================================================================
def register_routes(app, server_state):
    
    # =========================================================================
    # بخش ابزارهای کمکی داخلی (INTERNAL HELPERS)
    # =========================================================================

    # =========================================================================
    # نام تابع: error_response
    # کارایی: تولید پاسخ خطای استاندارد JSON
    # =========================================================================
    def error_response(msg, code=500):
        """تولید پاسخ خطای استاندارد"""
        return jsonify({"success": False, "error": str(msg)}), code

    # =========================================================================
    # نام تابع: success_response
    # کارایی: تولید پاسخ موفقیت استاندارد JSON
    # =========================================================================
    def success_response(data=None):
        """تولید پاسخ موفقیت استاندارد"""
        res = {"success": True}
        if data: res.update(data)
        return jsonify(res)

    # =========================================================================
    # بخش مسیرهای سیستمی (SYSTEM ROUTES)
    # =========================================================================

    # =========================================================================
    # مسیر: /
    # کارایی: سرو کردن فایل اصلی رابط کاربری (HTML)
    # =========================================================================
    @app.route('/')
    def serve_index() -> Response:
        global GLOBAL_INDEX_CACHE
        if GLOBAL_INDEX_CACHE: 
            return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, 'rb') as f: 
                GLOBAL_INDEX_CACHE = f.read()
            return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        return "خطا: فایل index.html یافت نشد.", 404

    # =========================================================================
    # مسیر: /api/heartbeat
    # کارایی: دریافت سیگنال زنده بودن کلاینت برای جلوگیری از بسته شدن سرور
    # =========================================================================
    @app.route('/api/heartbeat', methods=['POST'])
    def heartbeat() -> Response:
        """بررسی زنده بودن اتصال کلاینت به سرور"""
        server_state["last_heartbeat"] = time.time()
        server_state["shutdown_trigger"] = False
        return jsonify({"status": "alive"})

    # =========================================================================
    # مسیر: /api/client_closed
    # کارایی: اعلام بسته شدن مرورگر توسط کاربر
    # =========================================================================
    @app.route('/api/client_closed', methods=['POST'])
    def client_closed() -> Response:
        """اعلام بسته شدن پنجره توسط کاربر"""
        server_state["shutdown_trigger"] = True
        return jsonify({"status": "closing_soon"})

    # =========================================================================
    # مسیر: /api/exit_app
    # کارایی: درخواست خروج کامل و بستن پروسس پایتون
    # =========================================================================
    @app.route('/api/exit_app', methods=['POST'])
    def exit_app() -> Response:
        """خروج کامل از برنامه و بستن پروسس سرور"""
        def shutdown(): 
            time.sleep(0.5)
            os._exit(0)
        threading.Thread(target=shutdown).start()
        return jsonify({"status": "exiting"}), 200

    # =========================================================================
    # بخش مدیریت پشتیبان‌گیری (BACKUP MANAGEMENT)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/backup/create
    # کارایی: ایجاد فایل پشتیبان جدید از دیتابیس
    # =========================================================================
    @app.route('/api/backup/create', methods=['POST'])
    def create_backup():
        """ایجاد یک نسخه پشتیبان از دیتابیس فعلی"""
        try:
            data = request.json or {}
            username = data.get('username', 'System')
            
            # انتقال تغییرات از فایل WAL به فایل اصلی قبل از کپی
            with get_db_connection() as conn:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
            
            # نام‌گذاری فایل با تاریخ و نام کاربر (پاکسازی نام کاربر از کاراکترهای غیرمجاز)
            safe_user = "".join([c for c in username if c.isalnum() or c in ('-','_')])
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"nexus_backup_{safe_user}_{timestamp}.db"
            dest_path = os.path.join(BACKUP_FOLDER, filename)
            
            shutil.copy2(DATABASE_FILE, dest_path)
            return success_response({"filename": filename})
        except Exception as e: 
            return error_response(e)

    # =========================================================================
    # مسیر: /api/backup/download/<filename>
    # کارایی: دانلود فایل بک‌آپ برای ذخیره روی سیستم کلاینت
    # =========================================================================
    @app.route('/api/backup/download/<filename>', methods=['GET'])
    def download_backup(filename: str):
        """ارسال فایل بک‌آپ برای دانلود کلاینت"""
        try:
            path = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(path): return error_response("فایل یافت نشد", 404)
            return send_file(path, as_attachment=True)
        except Exception as e: return error_response(e)
        
    # =========================================================================
    # مسیر: /api/backup/list
    # کارایی: دریافت لیست تمام فایل‌های پشتیبان موجود
    # =========================================================================
    @app.route('/api/backup/list', methods=['GET'])
    def list_backups():
        """لیست کردن تمام بک‌آپ‌های موجود بر اساس زمان"""
        try:
            files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.db')]
            files.sort(key=lambda x: os.path.getmtime(os.path.join(BACKUP_FOLDER, x)), reverse=True)
            
            backups = []
            for f in files:
                path = os.path.join(BACKUP_FOLDER, f)
                size_kb = os.path.getsize(path) / 1024
                name_part = f.replace("nexus_backup_", "").replace(".db", "")
                creator, readable_date = "System", f
                
                # استخراج تاریخ و سازنده از نام فایل
                if len(name_part) >= 19:
                    ts_str = name_part[-19:]
                    creator = name_part[:-20] if len(name_part) > 20 else "System"
                    try: 
                        dt = datetime.strptime(ts_str, "%Y-%m-%d_%H-%M-%S")
                        readable_date = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except: pass
                
                backups.append({"name": f, "size": round(size_kb, 2), "date": readable_date, "creator": creator})
            return jsonify(backups)
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/backup/restore_upload
    # کارایی: آپلود و جایگزینی دیتابیس توسط فایل کاربر
    # =========================================================================
    @app.route('/api/backup/restore_upload', methods=['POST'])
    def restore_database_upload():
        """جایگزینی دیتابیس فعلی با فایل ارسالی توسط کاربر"""
        if 'file' not in request.files: return error_response("فایلی ارسال نشده است", 400)
        
        file = request.files['file']
        if file.filename == '': return error_response("نام فایل نامعتبر است", 400)

        try:
            with get_db_connection() as conn:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")
            file.save(DATABASE_FILE)
            return success_response({"message": "دیتابیس با موفقیت بازگردانی شد."})
        except Exception as e: return error_response(f"خطا در جایگزینی فایل: {e}")
    
    # =========================================================================
    # مسیر: /api/backup/restore/<filename>
    # کارایی: بازگردانی دیتابیس از روی یکی از فایل‌های بک‌آپ سرور
    # =========================================================================
    @app.route('/api/backup/restore/<filename>', methods=['POST'])
    def restore_backup(filename: str):
        """بازگردانی یکی از نسخه‌های بک‌آپ موجود در پوشه سیستم"""
        try:
            src = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(src): return error_response("فایل یافت نشد", 404)
            
            with get_db_connection() as conn:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")

            # ایجاد یک نسخه موقت از دیتابیس فعلی برای امنیت
            temp_backup = DATABASE_FILE + ".tmp"
            if os.path.exists(DATABASE_FILE): shutil.copy2(DATABASE_FILE, temp_backup)
            
            try:
                shutil.copy2(src, DATABASE_FILE)
                if os.path.exists(temp_backup): os.remove(temp_backup)
                return success_response()
            except Exception as e:
                if os.path.exists(temp_backup): shutil.copy2(temp_backup, DATABASE_FILE)
                raise e
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/backup/delete/<filename>
    # کارایی: حذف فایل بک‌آپ
    # =========================================================================
    @app.route('/api/backup/delete/<filename>', methods=['DELETE'])
    def delete_backup(filename: str):
        """حذف فیزیکی یک فایل بک‌آپ"""
        try:
            src = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(src): return error_response("فایل یافت نشد", 404)
            os.remove(src)
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # بخش مدیریت کاربران و احراز هویت (USER MANAGEMENT)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/login
    # کارایی: بررسی نام کاربری و رمز عبور برای ورود
    # =========================================================================
    @app.route('/api/login', methods=['POST'])
    def login():
        """ورود کاربر به سیستم"""
        try:
            data = request.json or {}
            user_in, pass_in = data.get('username'), data.get('password')
            if not user_in or not pass_in: 
                return jsonify({"success": False, "message": "نام کاربری و رمز عبور الزامی است"}), 400
            
            with get_db_connection() as conn:
                user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                                   (user_in, hash_password(pass_in))).fetchone()
                if user:
                    perms = parse_permissions_recursive(user['permissions'])
                    return success_response({
                        "role": user['role'], "username": user['username'], 
                        "permissions": perms, "full_name": user['full_name']
                    })
                return jsonify({"success": False, "message": "نام کاربری یا رمز عبور اشتباه است"}), 401
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/users
    # کارایی: دریافت لیست کاربران
    # =========================================================================
    @app.route('/api/users', methods=['GET'])
    def get_users():
        """دریافت لیست تمام کاربران"""
        with get_db_connection() as conn:
            users = conn.execute("SELECT id, username, role, full_name, mobile, permissions FROM users").fetchall()
            result = []
            for u in users:
                d = dict(u)
                d['permissions'] = parse_permissions_recursive(d['permissions'])
                result.append(d)
            return jsonify(result)

    # =========================================================================
    # مسیر: /api/users/save
    # کارایی: ایجاد یا ویرایش کاربر
    # =========================================================================
    @app.route('/api/users/save', methods=['POST'])
    def save_user():
        """ایجاد یا ویرایش اطلاعات کاربر"""
        try:
            d = request.json or {}
            uid, u_name = d.get('id'), d.get('username')
            pwd, role = d.get('password'), d.get('role', 'operator')
            fname, mob = d.get('full_name', ''), d.get('mobile', '')
            perms = d.get('permissions', {})
            
            if not u_name: return error_response("نام کاربری الزامی است", 400)
            
            # تبدیل پرمیشن‌ها به فرمت JSON برای ذخیره در دیتابیس
            perms_json = json.dumps(parse_permissions_recursive(perms) if isinstance(perms, str) else perms)
            
            with get_db_connection() as conn:
                if uid:
                    if pwd and pwd.strip():
                        conn.execute("UPDATE users SET username=?, password=?, role=?, full_name=?, mobile=?, permissions=? WHERE id=?", 
                                    (u_name, hash_password(pwd), role, fname, mob, perms_json, uid))
                    else:
                        conn.execute("UPDATE users SET username=?, role=?, full_name=?, mobile=?, permissions=? WHERE id=?", 
                                    (u_name, role, fname, mob, perms_json, uid))
                else:
                    if not pwd: return error_response("رمز عبور برای کاربر جدید الزامی است", 400)
                    conn.execute("INSERT INTO users (username, password, role, full_name, mobile, permissions) VALUES (?, ?, ?, ?, ?, ?)", 
                                (u_name, hash_password(pwd), role, fname, mob, perms_json))
                conn.commit()
            return success_response()
        except sqlite3.IntegrityError: return error_response("نام کاربری تکراری است", 400)
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/users/delete/<id>
    # کارایی: حذف کاربر
    # =========================================================================
    @app.route('/api/users/delete/<int:id>', methods=['DELETE'])
    def delete_user(id: int):
        """حذف کاربر (جلوگیری از حذف ادمین اصلی)"""
        with get_db_connection() as conn:
            target = conn.execute("SELECT username FROM users WHERE id=?", (id,)).fetchone()
            if target and target['username'] == 'admin': 
                return error_response("حذف کاربر مدیر اصلی امکان‌پذیر نیست", 403)
            conn.execute("DELETE FROM users WHERE id=?", (id,))
            conn.commit()
            return success_response()

    # =========================================================================
    # مسیر: /api/user/change_password
    # کارایی: تغییر رمز عبور کاربر جاری
    # =========================================================================
    @app.route('/api/user/change_password', methods=['POST'])
    def change_password_api():
        """تغییر رمز عبور توسط خود کاربر"""
        try:
            d = request.json or {}
            u, old_p, new_p = d.get('username'), d.get('old_password'), d.get('new_password')
            if not all([u, old_p, new_p]): return error_response("اطلاعات ناقص است", 400)
            
            with get_db_connection() as conn:
                user = conn.execute("SELECT id FROM users WHERE username = ? AND password = ?", 
                                   (u, hash_password(old_p))).fetchone()
                if not user: return error_response("رمز عبور فعلی اشتباه است", 401)
                conn.execute("UPDATE users SET password = ? WHERE id = ?", (hash_password(new_p), user['id']))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # بخش مدیریت تنظیمات (SETTINGS MANAGEMENT)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/settings/config [GET]
    # کارایی: دریافت تنظیمات کلی سیستم
    # =========================================================================
    @app.route('/api/settings/config', methods=['GET'])
    def get_config():
        """دریافت تنظیمات دسته‌بندی‌ها و پارامترهای قطعات"""
        with get_db_connection() as conn:
            row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
            if row: 
                stored = json.loads(row['value'])
                # ادغام با مقادیر پیش‌فرض در صورتی که کلید جدیدی اضافه شده باشد
                for k, v in DEFAULT_COMPONENT_CONFIG.items():
                    if k not in stored: stored[k] = v
                return jsonify(stored)
            return jsonify(DEFAULT_COMPONENT_CONFIG)

    # =========================================================================
    # مسیر: /api/settings/config [POST]
    # کارایی: ذخیره تنظیمات سیستم
    # =========================================================================
    @app.route('/api/settings/config', methods=['POST'])
    def save_config():
        """ذخیره تنظیمات و به‌روزرسانی خودکار کدهای انبار در صورت تغییر پیشوند"""
        try:
            new_cfg = request.json
            with get_db_connection() as conn:
                old_row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
                if old_row:
                    old_cfg = json.loads(old_row['value'])
                    for cat, settings in new_cfg.items():
                        if cat in old_cfg:
                            old_p, new_p = old_cfg[cat].get('prefix'), settings.get('prefix')
                            if old_p and new_p and old_p != new_p:
                                # تغییر پیشوند تمام قطعات ثبت شده در این دسته
                                sql = "UPDATE {} SET part_code = ? || SUBSTR(part_code, ?) WHERE type = ? AND part_code LIKE ?"
                                conn.execute(sql.format("parts"), (new_p, len(old_p)+1, cat, f"{old_p}%"))
                                conn.execute(sql.format("purchase_log"), (new_p, len(old_p)+1, cat, f"{old_p}%"))

                conn.execute("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)", 
                            ('component_config', json.dumps(new_cfg)))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/settings/rename
    # کارایی: تغییر نام دسته‌بندی‌ها یا آیتم‌ها در تمام سیستم
    # =========================================================================
    @app.route('/api/settings/rename', methods=['POST'])
    def rename_item_api():
        """تغییر نام دسته‌ها یا آیتم‌های داخل لیست‌ها در تنظیمات و دیتابیس"""
        try:
            d = request.json or {}
            mode, old_v, new_v = d.get('mode'), d.get('oldVal'), d.get('newVal')
            cat, lst_name = d.get('category'), d.get('listName')
            if not old_v or not new_v: return error_response("مقادیر نمی‌توانند خالی باشند", 400)
            
            with get_db_connection() as conn:
                row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
                if not row: return error_response("خطا در تنظیمات")
                config = json.loads(row['value'])
                
                if mode == 'category':
                    if old_v not in config: return error_response("دسته یافت نشد", 404)
                    config[new_v] = config.pop(old_v); config[new_v]['label'] = new_v 
                    conn.execute("UPDATE parts SET type = ? WHERE type = ?", (new_v, old_v))
                elif mode == 'item':
                    target = config.get(cat, {}).get(lst_name)
                    if target is None or old_v not in target: return error_response("گزینه یافت نشد", 404)
                    target[target.index(old_v)] = new_v
                    
                    # به‌روزرسانی فیلد مربوطه در جدول قطعات برای هماهنگی داده‌ها
                    col_map = {'packages': 'package', 'techs': 'tech', 'locations': 'storage_location', 'paramOptions': 'watt'}
                    if lst_name in col_map:
                        db_col = col_map[lst_name]
                        if cat == 'General' and lst_name == 'locations':
                            conn.execute(f"UPDATE parts SET {db_col} = ? WHERE {db_col} = ?", (new_v, old_v))
                        else:
                            conn.execute(f"UPDATE parts SET {db_col} = ? WHERE {db_col} = ? AND type = ?", (new_v, old_v, cat))
                
                conn.execute("UPDATE app_config SET value = ? WHERE key = 'component_config'", (json.dumps(config),))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # بخش عملیات انبار (INVENTORY OPERATIONS)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/parts
    # کارایی: دریافت لیست قطعات انبار
    # =========================================================================
    @app.route('/api/parts', methods=['GET'])
    def get_parts():
        """دریافت تمام قطعات موجود در انبار"""
        with get_db_connection() as conn:
            parts = conn.execute('SELECT * FROM parts ORDER BY id DESC').fetchall()
            return jsonify([dict(p) for p in parts])

    # =========================================================================
    # مسیر: /api/save
    # کارایی: ثبت قطعه جدید یا ویرایش قطعه موجود
    # =========================================================================
    @app.route('/api/save', methods=['POST'])
    def save_part():
        """ذخیره قطعه جدید یا ویرایش قطعه قدیمی (با مدیریت ادغام و ثبت لاگ تغییرات)"""
        try:
            d = request.json or {}
            pid = d.get('id')
            user = d.get('username', 'unknown')
            
            # پاکسازی و تبدیل مقادیر عددی (حذف کاما و تبدیل به عدد)
            def clean_float(val): return float(str(val).replace(',', '')) if val and str(val).replace(',', '').replace('.', '', 1).isdigit() else 0.0
            def clean_int(val): return int(str(val).replace(',', '')) if val and str(val).replace(',', '').isdigit() else 0
            
            price = clean_float(d.get("price"))
            usd_rate = clean_float(d.get("usd_rate"))
            inv_num = d.get("invoice_number", "")
            entry_dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            with get_db_connection() as conn:
                # بررسی معتبر بودن ID
                if pid and not conn.execute("SELECT id FROM parts WHERE id = ?", (pid,)).fetchone(): pid = None

                # استخراج پیشوند از تنظیمات برای تولید کد انبار
                cfg_row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
                config = json.loads(cfg_row['value']) if cfg_row else {}
                prefix = config.get(d.get("type"), {}).get("prefix", "PRT")

                # تولید خودکار کد انبار صعودی در صورت نبود کد
                part_code = d.get("part_code", "")
                if not pid and not part_code:
                    last = conn.execute("SELECT part_code FROM parts WHERE type = ? AND part_code LIKE ? ORDER BY part_code DESC LIMIT 1",
                                       (d.get("type"), f"{prefix}%")).fetchone()
                    next_num = 1
                    if last and last['part_code']:
                        try: next_num = int(last['part_code'][len(prefix):]) + 1
                        except: pass
                    part_code = f"{prefix}{str(next_num).zfill(9)}"

                links_json = json.dumps(d.get("purchase_links", [])[:5])
                
                # آماده‌سازی داده‌ها برای دیتابیس
                payload = {
                    "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""), 
                    "package": d.get("pkg", ""), "type": d.get("type", ""), "buy_date": d.get("date", ""),
                    "quantity": clean_int(d.get("qty")), "toman_price": price, "reason": d.get("reason", ""), 
                    "min_quantity": clean_int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
                    "last_modified_by": user, "storage_location": d.get("location", ""), "tech": d.get("tech", ""), 
                    "usd_rate": usd_rate, "purchase_links": links_json, "invoice_number": inv_num, 
                    "entry_date": entry_dt, "part_code": part_code,
                    "list5": d.get("list5", ""), "list6": d.get("list6", ""), "list7": d.get("list7", ""), 
                    "list8": d.get("list8", ""), "list9": d.get("list9", ""), "list10": d.get("list10", "")
                }
                
                op, qty_change = 'ENTRY (New)', payload['quantity']
                dup_sql = "SELECT id, quantity FROM parts WHERE val=? AND watt=? AND tolerance=? AND package=? AND type=? AND tech=? AND storage_location=?"
                dup_params = (payload['val'], payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['tech'], payload['storage_location'])
                
                if pid:
                    # عملیات ویرایش قطعه موجود
                    old = conn.execute('SELECT * FROM parts WHERE id = ?', (pid,)).fetchone()
                    if not old: pid = None
                    else:
                        # ردیابی تغییرات برای ثبت در لاگ
                        track = {"val": "مقدار", "watt": "پارامتر", "tolerance": "تولرانس", "package": "پکیج", "quantity": "تعداد"}
                        changes = [f"{lbl}: {old[col]}->{payload[col]}" for col, lbl in track.items() if str(old[col]) != str(payload[col])]
                        
                        if not changes and str(old['toman_price']) == str(payload['toman_price']):
                            return success_response({"message": "تغییری تشخیص داده نشد"})
                        
                        if changes: payload["reason"] = f"{(payload['reason'] or '')} [اصلاح: {' | '.join(changes)}]"
                        
                        # بررسی عدم وجود قطعه مشابه دیگر (جلوگیری از ایجاد دیتای تکراری در آدرس‌های مختلف)
                        if conn.execute(dup_sql + " AND id != ?", (*dup_params, pid)).fetchone():
                            return error_response("قطعه‌ای با این مشخصات فنی در سیستم وجود دارد", 400)
                        
                        qty_change = payload['quantity'] - old['quantity']
                        op = 'ENTRY (Refill)' if qty_change > 0 else ('UPDATE (Decrease)' if qty_change < 0 else 'UPDATE (Edit)')
                        
                        sql_upd = f"UPDATE parts SET {', '.join([f'{k}=?' for k in payload.keys()])} WHERE id=?"
                        conn.execute(sql_upd, (*payload.values(), pid))
                        rid = pid
                else:
                    # عملیات ثبت قطعه جدید یا ادغام با قطعه مشابه
                    existing = conn.execute(dup_sql, dup_params).fetchone()
                    if existing:
                        rid = existing['id']
                        old_p = conn.execute("SELECT part_code FROM parts WHERE id = ?", (rid,)).fetchone()
                        if old_p: payload['part_code'] = old_p['part_code']
                        
                        new_qty = existing['quantity'] + qty_change
                        op = 'ENTRY (Refill - Merge)'
                        sql_merge = "UPDATE parts SET quantity=?, toman_price=?, buy_date=?, vendor_name=?, last_modified_by=?, reason=?, usd_rate=?, purchase_links=?, invoice_number=?, entry_date=?, part_code=? WHERE id=?"
                        conn.execute(sql_merge, (new_qty, payload['toman_price'], payload['buy_date'], payload['vendor_name'], user, payload['reason'], payload['usd_rate'], payload['purchase_links'], payload['invoice_number'], payload['entry_date'], payload['part_code'], rid))
                    else:
                        cols = ", ".join(payload.keys())
                        placeholders = ", ".join(["?"] * len(payload))
                        rid = conn.execute(f"INSERT INTO parts ({cols}) VALUES ({placeholders})", tuple(payload.values())).lastrowid
                
                # ثبت تاریخچه عملیات در لاگ خرید/تغییرات
                log_cols = ["part_id", "val", "quantity_added", "unit_price", "vendor_name", "purchase_date", "reason", "operation_type", "username", "watt", "tolerance", "package", "type", "storage_location", "tech", "usd_rate", "invoice_number", "part_code", "list5", "list6", "list7", "list8", "list9", "list10"]
                log_vals = (rid, payload['val'], qty_change, payload['toman_price'], payload['vendor_name'], payload['buy_date'], payload['reason'], op, user, payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['storage_location'], payload['tech'], payload['usd_rate'], inv_num, payload['part_code'], payload['list5'], payload['list6'], payload['list7'], payload['list8'], payload['list9'], payload['list10'])
                conn.execute(f"INSERT INTO purchase_log ({', '.join(log_cols)}) VALUES ({', '.join(['?']*len(log_vals))})", log_vals)
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)
        
    # =========================================================================
    # مسیر: /api/withdraw
    # کارایی: خروج (برداشت) قطعات از انبار
    # =========================================================================
    @app.route('/api/withdraw', methods=['POST'])
    def withdraw_parts():
        """خروج قطعات از انبار برای یک پروژه خاص"""
        try:
            d = request.json or {}
            items, proj, user = d.get('items', []), d.get('project', 'General Usage'), d.get('username', 'unknown')
            if not items: return error_response("هیچ قطعه‌ای انتخاب نشده است", 400)
            
            with get_db_connection() as conn:
                # بررسی موجودی تمام اقلام قبل از شروع عملیات کسر
                for item in items:
                    row = conn.execute("SELECT quantity, val FROM parts WHERE id = ?", (item['id'],)).fetchone()
                    if not row: return error_response(f"قطعه یافت نشد: {item['id']}", 404)
                    if row['quantity'] < int(item['qty']): 
                        return error_response(f"موجودی ناکافی برای {row['val']} (موجودی: {row['quantity']})", 400)
                
                # کسر از انبار و ثبت لاگ خروج
                for item in items:
                    pid, q_off = item['id'], int(item['qty'])
                    row = conn.execute("SELECT * FROM parts WHERE id = ?", (pid,)).fetchone()
                    conn.execute("UPDATE parts SET quantity = quantity - ?, last_modified_by = ? WHERE id = ?", (q_off, user, pid))
                    
                    log_sql = """INSERT INTO purchase_log (part_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username, watt, tolerance, package, type, storage_location, tech, usd_rate, part_code) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
                    conn.execute(log_sql, (pid, row['val'], -q_off, row['toman_price'], row['vendor_name'], datetime.now().strftime("%Y-%m-%d"), proj, 'EXIT (Project)', user, row['watt'], row['tolerance'], row['package'], row['type'], row['storage_location'], row['tech'], row['usd_rate'], row['part_code']))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/delete/<id>
    # کارایی: حذف کامل قطعه از انبار
    # =========================================================================
    @app.route('/api/delete/<int:id>', methods=['DELETE'])
    def delete_part(id: int):
        """حذف قطعه از انبار و ثبت لاگ حذف"""
        with get_db_connection() as conn:
            part = conn.execute("SELECT * FROM parts WHERE id=?", (id,)).fetchone()
            if part: 
                conn.execute("""INSERT INTO purchase_log (part_id, val, quantity_added, operation_type, reason, watt, tolerance, package, type, storage_location, tech, part_code) 
                             VALUES (?, ?, 0, 'DELETE', 'حذف توسط کاربر', ?, ?, ?, ?, ?, ?, ?)""", 
                             (id, part['val'], part['watt'], part['tolerance'], part['package'], part['type'], part['storage_location'], part['tech'], part['part_code']))
            conn.execute('DELETE FROM parts WHERE id = ?', (id,))
            conn.commit()
            return success_response()

    # =========================================================================
    # بخش مدیریت مخاطبین (CONTACTS MANAGEMENT)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/contacts
    # کارایی: دریافت لیست مخاطبین
    # =========================================================================
    @app.route('/api/contacts', methods=['GET'])
    def get_contacts():
        """دریافت لیست مخاطبین و فروشندگان"""
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM contacts ORDER BY name ASC').fetchall()
            return jsonify([dict(r) for r in rows])

    # =========================================================================
    # مسیر: /api/contacts/save
    # کارایی: ذخیره یا ویرایش مخاطب
    # =========================================================================
    @app.route('/api/contacts/save', methods=['POST'])
    def save_contact():
        """ذخیره یا ویرایش مخاطب"""
        try:
            d = request.json or {}
            fields = ("name", "phone", "mobile", "fax", "website", "email", "address", "notes")
            params = tuple(d.get(f) for f in fields)
            with get_db_connection() as conn:
                if d.get('id'): 
                    set_clause = ", ".join([f"{f}=?" for f in fields])
                    conn.execute(f"UPDATE contacts SET {set_clause} WHERE id=?", (*params, d['id']))
                else: 
                    cols = ", ".join(fields)
                    vals = ", ".join(["?"] * len(fields))
                    conn.execute(f"INSERT INTO contacts ({cols}) VALUES ({vals})", params)
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/contacts/delete/<id>
    # کارایی: حذف مخاطب
    # =========================================================================
    @app.route('/api/contacts/delete/<int:id>', methods=['DELETE'])
    def delete_contact(id: int):
        """حذف مخاطب"""
        with get_db_connection() as conn: 
            conn.execute('DELETE FROM contacts WHERE id = ?', (id,))
            conn.commit()
        return success_response()

    # =========================================================================
    # بخش لاگ‌ها و آمار (LOGS AND STATISTICS)
    # =========================================================================

    # =========================================================================
    # مسیر: /api/log
    # کارایی: دریافت تاریخچه عملیات
    # =========================================================================
    @app.route('/api/log', methods=['GET'])
    def get_log():
        """دریافت لیست تمام عملیات‌های انجام شده (لاگ‌ها)"""
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC').fetchall()
            return jsonify([dict(r) for r in rows])

    # =========================================================================
    # مسیر: /api/inventory/stats
    # کارایی: دریافت آمار تجمیعی انبار و کسری‌ها
    # =========================================================================
    @app.route('/api/inventory/stats', methods=['GET'])
    def get_inventory_stats():
        """دریافت آمار کلی انبار، ارزش ریالی/دلاری و لیست کسری‌ها"""
        try:
            live_usd = fetch_daily_usd_price()
            usd_date = USD_CACHE.get("date_str", "")
            
            with get_db_connection() as conn:
                rows = conn.execute("SELECT * FROM parts").fetchall()
                total_qty, total_val_toman = 0, 0.0
                shortages, categories = [], {}
                
                for r in rows:
                    q, p, u, min_q = (r['quantity'] or 0), (r['toman_price'] or 0.0), (r['usd_rate'] or 0.0), (r['min_quantity'] or 0)
                    total_qty += q
                    # محاسبه ارزش بر اساس نرخ دلار روز خرید در مقابل نرخ دلار امروز
                    curr_val = (p / u * q * live_usd) if (u > 0 and live_usd > 0) else (p * q)
                    total_val_toman += curr_val
                    
                    # بررسی کسری انبار
                    if q <= min_q:
                        links = []
                        try: links = json.loads(r['purchase_links']) if r['purchase_links'] else []
                        except: pass
                        shortages.append({
                            "id": r['id'], "val": r['val'], "pkg": r['package'], "qty": q, "min": min_q, 
                            "loc": r['storage_location'], "type": r['type'], "watt": r['watt'], 
                            "tolerance": r['tolerance'], "tech": r['tech'], "vendor": r['vendor_name'], 
                            "links": links, "invoice_number": r['invoice_number'], "part_code": r['part_code']
                        })
                        
                    cat = r['type'] or 'بدون دسته'
                    if cat not in categories: categories[cat] = {"count": 0, "value": 0}
                    categories[cat]["count"] += q
                    categories[cat]["value"] += curr_val
                
                shortages.sort(key=lambda x: x['qty'])
                return jsonify({
                    "total_items": len(rows), "total_quantity": total_qty, 
                    "total_value_toman": int(total_val_toman),
                    "total_value_usd_live": round(total_val_toman / live_usd, 2) if live_usd > 0 else 0, 
                    "live_usd_price": live_usd, "usd_date": usd_date, 
                    "shortages": shortages, "categories": categories
                })   
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/log/delete/<id>
    # کارایی: حذف یک لاگ و واگردانی تغییرات موجودی
    # =========================================================================
    @app.route('/api/log/delete/<int:log_id>', methods=['DELETE'])
    def delete_log_entry(log_id: int) -> Response:
        """حذف یک لاگ و واگردانی اثر آن بر موجودی انبار"""
        try:
            with get_db_connection() as conn:
                log = conn.execute("SELECT * FROM purchase_log WHERE log_id = ?", (log_id,)).fetchone()
                if not log: return error_response("لاگ یافت نشد", 404)
                
                # معکوس کردن تغییرات موجودی در جدول قطعات
                conn.execute("UPDATE parts SET quantity = quantity - ? WHERE id = ?", (log['quantity_added'], log['part_id']))
                conn.execute("DELETE FROM purchase_log WHERE log_id = ?", (log_id,))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)

    # =========================================================================
    # مسیر: /api/log/update
    # کارایی: ویرایش یک لاگ و اصلاح موجودی
    # =========================================================================
    @app.route('/api/log/update', methods=['POST'])
    def update_log_entry() -> Response:
        """ویرایش یک لاگ (تغییر تعداد یا دلیل) و به‌روزرسانی موجودی انبار بر اساس تفاضل"""
        try:
            d = request.json or {}
            lid, n_qty, n_reason = d.get('log_id'), float(d.get('quantity_added', 0)), d.get('reason', '')
            
            with get_db_connection() as conn:
                old = conn.execute("SELECT * FROM purchase_log WHERE log_id = ?", (lid,)).fetchone()
                if not old: return error_response("لاگ یافت نشد", 404)
                
                # اعمال تفاضل مقدار جدید و قدیم روی انبار
                diff = n_qty - old['quantity_added']
                conn.execute("UPDATE parts SET quantity = quantity + ? WHERE id = ?", (diff, old['part_id']))
                conn.execute("UPDATE purchase_log SET quantity_added = ?, reason = ? WHERE log_id = ?", (n_qty, n_reason, lid))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)