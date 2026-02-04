# ==============================================================================
# نسخه: 0.21 (مهاجرت کامل به MySQL - نسخه نهایی و جامع)
# فایل: routes.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول مسئول تعریف تمامی مسیرها (Routes) و نقاط پایانی (Endpoints) سیستم است.
# توابع موجود در این فایل وظایف مدیریت قطعات، کاربران، تنظیمات، عملیات پشتیبان‌گیری
# و گزارش‌گیری‌های انبار را از طریق پروتکل HTTP مدیریت می‌کنند.
# ==============================================================================

import os
import time
import json
import shutil
import mysql.connector
import subprocess
import threading
from datetime import datetime
from flask import jsonify, request, Response, send_file
from config import INDEX_FILE, BACKUP_FOLDER, DEFAULT_COMPONENT_CONFIG, DB_CONFIG
from database import get_db_connection, SERVER_CONFIG_FILE
from auth_utils import hash_password, parse_permissions_recursive
from services import fetch_daily_usd_price, USD_CACHE

# متغیر کش برای ذخیره محتوای فایل اصلی (Index) جهت بهینه‌سازی سرعت لود
GLOBAL_INDEX_CACHE = None


# [تگ: مبدل تاریخ میلادی به شمسی برای ثبت لحظه خروج]
def get_current_jalali_date():
    now = datetime.now()
    gy, gm, gd = now.year, now.month, now.day
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    if (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0):
        g_d_m = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]
    jy = 0 if gy <= 1600 else 979
    gy -= 621 if gy <= 1600 else 1600
    gy2 = (gm > 2) + gy
    days = (365 * gy) + (int((gy2 + 3) / 4)) - (int((gy2 + 99) / 100)) + (int((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1]
    jy += 33 * (int(days / 12053)); days %= 12053; jy += 4 * (int(days / 1461)); days %= 1461
    jy += int((days - 1) / 365)
    if days > 365: days = (days - 1) % 365
    jm = (days // 31) if days < 186 else 6 + ((days - 186) // 30)
    jd = 1 + (days if jm < 6 else days - 186 - (jm - 6) * 30)
    return f"{jy}/{jm+1}/{jd}"


# ------------------------------------------------------------------------------
# [تگ: ثبت مسیرهای اصلی برنامه]
# این تابع تمامی مسیرهای API را به اپلیکیشن Flask معرفی و ثبت می‌کند.
# ------------------------------------------------------------------------------
def register_routes(app, server_state):
    
    # ------------------------------------------------------------------------------
    # مسیر ریشه: ارائه فایل index.html (رابط کاربری) با سیستم کشینگ
    # ------------------------------------------------------------------------------
    @app.route('/')
    def serve_index() -> Response:
        global GLOBAL_INDEX_CACHE
        if GLOBAL_INDEX_CACHE: return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        if os.path.exists(INDEX_FILE):
            with open(INDEX_FILE, 'rb') as f: GLOBAL_INDEX_CACHE = f.read()
            return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
        return "Error: index.html not found.", 404

    # ------------------------------------------------------------------------------
    # مسیر Heartbeat: به‌روزرسانی زمان آخرین فعالیت کلاینت برای جلوگیری از بسته شدن سرور
    # ------------------------------------------------------------------------------
    @app.route('/api/heartbeat', methods=['POST'])
    def heartbeat() -> Response:
        server_state["last_heartbeat"] = time.time(); server_state["shutdown_trigger"] = False
        return jsonify({"status": "alive"})

    # ------------------------------------------------------------------------------
    # مسیر Client Closed: اعلام بسته شدن دستی پنجره مرورگر توسط کلاینت
    # ------------------------------------------------------------------------------
    @app.route('/api/client_closed', methods=['POST'])
    def client_closed() -> Response:
        server_state["shutdown_trigger"] = True
        return jsonify({"status": "closing_soon"})

    # ------------------------------------------------------------------------------
    # مسیر Exit App: خاموش کردن کامل سرور و خروج از برنامه
    # ------------------------------------------------------------------------------
    @app.route('/api/exit_app', methods=['POST'])
    def exit_app() -> Response:
        def shutdown(): time.sleep(0.5); os._exit(0)
        threading.Thread(target=shutdown).start()
        return jsonify({"status": "exiting"}), 200

    # ------------------------------------------------------------------------------
    # [بخش: مدیریت پشتیبان‌گیری (Backup)]
    # این بخش شامل ایجاد، لیست کردن، دانلود و بازگردانی دیتابیس است.
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # ایجاد بک‌آپ: تهیه نسخه کپی از دیتابیس فعلی با نام کاربر و برچسب زمانی
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/create', methods=['POST'])
    def create_backup():
        try:
            data = request.json or {}
            username = data.get('username', 'System')
            safe_username = "".join([c for c in username if c.isalnum() or c in ('-','_')])
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"HY_backup_{safe_username}_{timestamp}.sql"
            dest_path = os.path.join(BACKUP_FOLDER, filename)
            
            # --- خواندن تنظیمات ---
            current_conf = DB_CONFIG.copy()
            # مقادیر پیش‌فرض مسیرها (برای اینکه اگر تنظیم نشده بود، روی سیستم فعلی کار کند)
            mysqldump_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
            
            if os.path.exists(SERVER_CONFIG_FILE):
                try:
                    with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                        saved = json.load(f)
                        current_conf.update(saved)
                        # اگر کاربر مسیر جدید داده بود، جایگزین کن
                        if saved.get('mysqldump_path'):
                            mysqldump_path = saved.get('mysqldump_path')
                except: pass

            dump_cmd = [
                mysqldump_path,
                f'--host={current_conf["host"]}',
                f'--user={current_conf["user"]}',
                f'--password={current_conf["password"]}',
                f'--port={current_conf["port"]}',
                current_conf["database"]
            ]
            
            with open(dest_path, 'w', encoding='utf-8') as f:
                subprocess.run(dump_cmd, stdout=f, check=True)
                
            return jsonify({"success": True, "filename": filename})
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # دانلود بک‌آپ: ارسال فایل دیتابیس مشخص شده به سیستم کلاینت
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/download/<filename>', methods=['GET'])
    def download_backup(filename: str):
        try:
            path = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(path):
                return jsonify({"error": "فایل یافت نشد"}), 404
            return send_file(path, as_attachment=True)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    # ------------------------------------------------------------------------------
    # لیست بک‌آپ‌ها: نمایش تمامی فایل‌های پشتیبان موجود در پوشه مخصوص
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/list', methods=['GET'])
    def list_backups():
        try:
            # جستجو برای هر دو فرمت .sql و .db جهت سازگاری با فایل‌های قدیمی
            files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.sql') or f.endswith('.db')]
            files.sort(key=lambda x: os.path.getmtime(os.path.join(BACKUP_FOLDER, x)), reverse=True)
            backups = []
            for f in files:
                path = os.path.join(BACKUP_FOLDER, f)
                size = os.path.getsize(path) / 1024
                ext = ".sql" if f.endswith('.sql') else ".db"
                name_part = f.replace("HY_backup_", "").replace(ext, "")
                creator = "سیستم"
                readable_date = f
                if len(name_part) >= 19:
                    ts_str = name_part[-19:]
                    if len(name_part) > 20: creator = name_part[:-20]
                    try: 
                        dt = datetime.strptime(ts_str, "%Y-%m-%d_%H-%M-%S")
                        readable_date = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except: readable_date = f
                backups.append({"name": f, "size": round(size, 2), "date": readable_date, "creator": creator})
            return jsonify(backups)
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # آپلود و بازگردانی: اجرای اسکریپت SQL آپلود شده روی دیتابیس MySQL
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/restore_upload', methods=['POST'])
    def restore_database_upload():
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "فایلی ارسال نشده است"}), 400
        
        file = request.files['file']
        if not file.filename.endswith('.sql'):
            return jsonify({"success": False, "error": "فقط فایل‌های .sql مجاز هستند"}), 400

        try:
            temp_path = os.path.join(BACKUP_FOLDER, "temp_restore.sql")
            file.save(temp_path)
            
            current_conf = DB_CONFIG.copy()
            mysql_client_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
            
            if os.path.exists(SERVER_CONFIG_FILE):
                try:
                    with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                        saved = json.load(f)
                        current_conf.update(saved)
                        if saved.get('mysql_client_path'):
                            mysql_client_path = saved.get('mysql_client_path')
                except: pass
            
            restore_cmd = [
                mysql_client_path,
                f'--host={current_conf["host"]}',
                f'--user={current_conf["user"]}',
                f'--password={current_conf["password"]}',
                f'--port={current_conf["port"]}',
                current_conf["database"]
            ]
            
            with open(temp_path, 'r', encoding='utf-8') as f:
                subprocess.run(restore_cmd, stdin=f, check=True)
            
            if os.path.exists(temp_path): os.remove(temp_path)
            return jsonify({"success": True, "message": "دیتابیس با موفقیت بازگردانی شد."})
        except Exception as e:
            return jsonify({"success": False, "error": f"خطا در بازگردانی: {str(e)}"}), 500
        
    # ------------------------------------------------------------------------------
    # بازگردانی داخلی: اجرای یکی از بک‌آپ‌های ذخیره شده در سرور روی دیتابیس
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/restore/<filename>', methods=['POST'])
    def restore_backup(filename):
        try:
            safe_filename = os.path.basename(filename)
            file_path = os.path.join(BACKUP_FOLDER, safe_filename)
            
            if not os.path.exists(file_path):
                return jsonify({"error": "File not found"}), 404

            current_conf = DB_CONFIG.copy()
            mysql_client_path = r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

            if os.path.exists(SERVER_CONFIG_FILE):
                try:
                    with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                        saved = json.load(f)
                        current_conf.update(saved)
                        if saved.get('mysql_client_path'):
                            mysql_client_path = saved.get('mysql_client_path')
                except: pass

            restore_cmd = [
                mysql_client_path,
                f'--host={current_conf["host"]}',
                f'--user={current_conf["user"]}',
                f'--password={current_conf["password"]}',
                f'--port={current_conf["port"]}',
                current_conf["database"]
            ]

            with open(file_path, 'r', encoding='utf-8') as f:
                subprocess.run(restore_cmd, stdin=f, check=True)

            return jsonify({"success": True, "message": "Database restored successfully"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    # ------------------------------------------------------------------------------
    # حذف بک‌آپ: پاک کردن دائمی یک فایل پشتیبان از روی سرور
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/delete/<filename>', methods=['DELETE'])
    def delete_backup(filename: str):
        try:
            src = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(src): return jsonify({"error": "فایل پیدا نشد"}), 404
            os.remove(src)
            return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # [بخش: احراز هویت و مدیریت کاربران (Auth)]
    # مدیریت ورود، لیست کاربران، ذخیره و تغییر گذرواژه.
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # ورود (Login): بررسی اعتبار کاربر و ارسال سطوح دسترسی
    # ------------------------------------------------------------------------------
    @app.route('/api/login', methods=['POST'])
    def login():
        try:
            data = request.json
            if not data: return jsonify({"error": "No data"}), 400
            username = data.get('username')
            password = data.get('password')
            if not username or not password: return jsonify({"success": False, "message": "نام کاربری و رمز عبور الزامی است"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True) 
            try:
                cursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, hash_password(password)))
                user = cursor.fetchone()
                if user:
                    perms = parse_permissions_recursive(user['permissions'])
                    return jsonify({ "success": True, "role": user['role'], "username": user['username'], "permissions": perms, "full_name": user['full_name'] })
                return jsonify({"success": False, "message": "نام کاربری یا رمز عبور اشتباه است"}), 401
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # لیست کاربران: دریافت اطلاعات تمامی کاربران ثبت شده در سیستم
    # ------------------------------------------------------------------------------
    @app.route('/api/users', methods=['GET'])
    def get_users():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id, username, role, full_name, mobile, permissions FROM users")
            users = cursor.fetchall()
            result = []
            for u in users:
                u['permissions'] = parse_permissions_recursive(u['permissions'])
                result.append(u)
            return jsonify(result)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # ذخیره کاربر: افزودن کاربر جدید یا ویرایش اطلاعات و دسترسی‌های کاربر فعلی
    # ------------------------------------------------------------------------------
    @app.route('/api/users/save', methods=['POST'])
    def save_user():
        try:
            d = request.json
            user_id = d.get('id'); username = d.get('username'); password = d.get('password')
            role = d.get('role', 'operator'); full_name = d.get('full_name', ''); mobile = d.get('mobile', '')
            perms_input = d.get('permissions', {})
            if isinstance(perms_input, str): perms_input = parse_permissions_recursive(perms_input)
            perms_json = json.dumps(perms_input)
            if not username: return jsonify({"error": "نام کاربری الزامی است"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                if user_id:
                    if password and password.strip():
                        cursor.execute("UPDATE users SET username=%s, password=%s, role=%s, full_name=%s, mobile=%s, permissions=%s WHERE id=%s", 
                                    (username, hash_password(password), role, full_name, mobile, perms_json, user_id))
                    else:
                        cursor.execute("UPDATE users SET username=%s, role=%s, full_name=%s, mobile=%s, permissions=%s WHERE id=%s", 
                                    (username, role, full_name, mobile, perms_json, user_id))
                else:
                    if not password: return jsonify({"error": "رمز عبور برای کاربر جدید الزامی است"}), 400
                    cursor.execute("INSERT INTO users (username, password, role, full_name, mobile, permissions) VALUES (%s, %s, %s, %s, %s, %s)", 
                                (username, hash_password(password), role, full_name, mobile, perms_json))
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except mysql.connector.Error as err:
            if err.errno == 1062: return jsonify({"error": "نام کاربری تکراری است"}), 400
            return jsonify({"error": str(err)}), 500
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # حذف کاربر: حذف اکانت کاربر (به استثنای کاربر ادمین اصلی)
    # ------------------------------------------------------------------------------
    @app.route('/api/users/delete/<int:id>', methods=['DELETE'])
    def delete_user(id: int):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT username FROM users WHERE id=%s", (id,))
            target = cursor.fetchone()
            if target and target['username'] == 'admin': return jsonify({"error": "کاربر ادمین اصلی قابل حذف نیست"}), 403
            cursor.execute("DELETE FROM users WHERE id=%s", (id,))
            conn.commit()
            return jsonify({"success": True})
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # تغییر رمز عبور: به‌روزرسانی گذرواژه کاربر فعلی با تایید رمز عبور قبلی
    # ------------------------------------------------------------------------------
    @app.route('/api/user/change_password', methods=['POST'])
    def change_password_api():
        try:
            d = request.json
            username = d.get('username'); old_pass = d.get('old_password'); new_pass = d.get('new_password')
            if not username or not old_pass or not new_pass: return jsonify({"success": False, "message": "اطلاعات ناقص است"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT id FROM users WHERE username = %s AND password = %s", (username, hash_password(old_pass)))
                user = cursor.fetchone()
                if not user: return jsonify({"success": False, "message": "رمز عبور فعلی اشتباه است"}), 401
                cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hash_password(new_pass), user['id']))
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"success": False, "error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # [بخش: تنظیمات سیستم (Settings)]
    # مدیریت پیکربندی قطعات، دسته‌بندی‌ها و تغییر نام لیست‌ها.
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # دریافت کانفیگ: خواندن تنظیمات ذخیره شده برای انواع قطعات و فیلدها
    # ------------------------------------------------------------------------------
    @app.route('/api/settings/config', methods=['GET'])
    def get_config():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT `value` FROM app_config WHERE `key` = 'component_config'")
            row = cursor.fetchone()
            if row: 
                stored_config = json.loads(row['value'])
                for key, val in DEFAULT_COMPONENT_CONFIG.items():
                    if key not in stored_config: stored_config[key] = val
                return jsonify(stored_config)
            return jsonify(DEFAULT_COMPONENT_CONFIG)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # ذخیره کانفیگ: ثبت تنظیمات جدید و بروزرسانی کدهای انبار در صورت تغییر پیشوند
    # ------------------------------------------------------------------------------
    @app.route('/api/settings/config', methods=['POST'])
    def save_config():
        try:
            new_config = request.json
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT `value` FROM app_config WHERE `key` = 'component_config'")
                old_row = cursor.fetchone()
                if old_row:
                    old_config = json.loads(old_row['value'])
                    for category, settings in new_config.items():
                        if category in old_config:
                            old_prefix = old_config[category].get('prefix')
                            new_prefix = settings.get('prefix')
                            if old_prefix and new_prefix and old_prefix != new_prefix:
                                # استفاده از CONCAT در MySQL برای اتصال رشته‌ها
                                cursor.execute(
                                    "UPDATE parts SET part_code = CONCAT(%s, SUBSTR(part_code, %s)) WHERE type = %s AND part_code LIKE %s",
                                    (new_prefix, len(old_prefix) + 1, category, f"{old_prefix}%")
                                )
                                cursor.execute(
                                    "UPDATE purchase_log SET part_code = CONCAT(%s, SUBSTR(part_code, %s)) WHERE type = %s AND part_code LIKE %s",
                                    (new_prefix, len(old_prefix) + 1, category, f"{old_prefix}%")
                                )

                # استفاده از ON DUPLICATE KEY UPDATE در MySQL برای شبیه‌سازی Replace
                cursor.execute(
                    "INSERT INTO app_config (`key`, `value`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)", 
                    ('component_config', json.dumps(new_config))
                )
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: 
            return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # تغییر نام آیتم: به‌روزرسانی نام دسته‌ها یا آیتم‌های لیست در کل دیتابیس
    # ------------------------------------------------------------------------------
    @app.route('/api/settings/rename', methods=['POST'])
    def rename_item_api():
        try:
            d = request.json
            mode = d.get('mode'); old_val = d.get('oldVal'); new_val = d.get('newVal'); category = d.get('category'); list_name = d.get('listName')
            if not old_val or not new_val: return jsonify({"error": "مقادیر نمی‌توانند خالی باشند"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT `value` FROM app_config WHERE `key` = 'component_config'")
                row = cursor.fetchone()
                if not row: return jsonify({"error": "خطا در بارگذاری تنظیمات"}), 500
                config = json.loads(row['value'])
                
                if mode == 'category':
                    if old_val not in config: return jsonify({"error": "دسته یافت نشد"}), 404
                    if new_val in config: return jsonify({"error": "دسته جدید از قبل وجود دارد"}), 400
                    config[new_val] = config.pop(old_val); config[new_val]['label'] = new_val 
                    cursor.execute("UPDATE parts SET type = %s WHERE type = %s", (new_val, old_val))
                elif mode == 'item':
                    if category not in config: return jsonify({"error": "دسته یافت نشد"}), 404
                    target_list = config[category].get(list_name)
                    if target_list is None or old_val not in target_list: return jsonify({"error": "آیتم یافت نشد"}), 404
                    idx = target_list.index(old_val); target_list[idx] = new_val
                    col_map = {'packages': 'package', 'techs': 'tech', 'locations': 'storage_location', 'paramOptions': 'watt'}
                    if list_name in col_map:
                        db_col = col_map[list_name]
                        if category == 'General' and list_name == 'locations': 
                            cursor.execute(f"UPDATE parts SET `{db_col}` = %s WHERE `{db_col}` = %s", (new_val, old_val))
                        else: 
                            cursor.execute(f"UPDATE parts SET `{db_col}` = %s WHERE `{db_col}` = %s AND type = %s", (new_val, old_val, category))
                
                cursor.execute("UPDATE app_config SET `value` = %s WHERE `key` = 'component_config'", (json.dumps(config),))
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # [بخش: مدیریت موجودی و تراکنش‌ها (Parts & Transactions)]
    # مدیریت اصلی قطعات شامل ثبت، ورود، خروج و حذف.
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # لیست قطعات: دریافت مشخصات تمامی کالاهای موجود در انبار
    # ------------------------------------------------------------------------------
    @app.route('/api/parts', methods=['GET'])
    def get_parts():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('SELECT * FROM parts ORDER BY id DESC')
            parts = cursor.fetchall()
            return jsonify(parts)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # [تگ: تابع کمکی تشخیص تغییرات]
    # مقایسه داده‌های قدیم و جدید و تولید گزارش متنی از تغییرات برای ثبت در لاگ
    # ------------------------------------------------------------------------------
    # [تگ: تابع کمکی گزارش تغییرات - نسخه کامل و دقیق]
    def generate_change_report(old_data, new_data):
        changes = []
        
        # لیست کامل تمام فیلدهایی که باید چک شوند (هیچ موردی حذف نشده است)
        field_labels = {
            'val': 'نام قطعه',
            'quantity': 'موجودی',
            'unit': 'واحد',
            'toman_price': 'قیمت (تومان)',
            'usd_rate': 'نرخ دلار',
            'type': 'دسته',
            'package': 'پکیج',
            'tolerance': 'تولرانس',
            'watt': 'توان/مشخصه',
            'tech': 'تکنولوژی',
            'vendor_name': 'فروشنده',
            'storage_location': 'آدرس/محل نگهداری',
            'part_code': 'کد انبار',
            'invoice_number': 'شماره فاکتور',
            'min_quantity': 'حد حداقل',
            'buy_date': 'تاریخ خرید',
            'purchase_links': 'لینک خرید',
            'reason': 'دلیل خرید/پروژه',
            'description': 'توضیحات',
            'list5': 'فیلد ۵', 'list6': 'فیلد ۶', 'list7': 'فیلد ۷', 
            'list8': 'فیلد ۸', 'list9': 'فیلد ۹', 'list10': 'فیلد ۱۰'
        }

        # نگاشت نام‌های احتمالی متفاوت در فرانت‌اند به نام‌های دیتابیس
        key_map = {
            'qty': 'quantity', 
            'price_toman': 'toman_price',
            'price': 'toman_price',
            'location': 'storage_location',
            'pkg': 'package', 
            'tol': 'tolerance',
            'desc': 'description',
            'date': 'buy_date',
            'min_qty': 'min_quantity'
        }

        for key, label in field_labels.items():
            # دریافت مقدار جدید (اول با کلید اصلی، اگر نبود با کلید جایگزین)
            new_val = new_data.get(key)
            if new_val is None:
                # جستجوی کلید معادل در دیتای ورودی فرانت
                front_key = next((k for k, v in key_map.items() if v == key), key)
                new_val = new_data.get(front_key)

            # دریافت مقدار قدیم
            old_val = old_data.get(key)

            # تبدیل به رشته و حذف فاصله‌ها برای مقایسه دقیق
            s_new = str(new_val if new_val is not None else '').strip()
            s_old = str(old_val if old_val is not None else '').strip()

            # نادیده گرفتن تفاوت‌های جزئی در اعداد اعشاری (مثلاً 100.0 با 100) و None با ''
            if s_old == 'None': s_old = ''
            if s_new == 'None': s_new = ''
            
            try:
                # اگر هر دو عدد هستند، مقایسه عددی کن
                if s_old and s_new and float(s_old) == float(s_new): continue
            except ValueError:
                pass

            # اگر واقعاً تغییری رخ داده باشد
            if s_new != s_old:
                if not s_old:
                    changes.append(f"{label}: {s_new}")
                else:
                    changes.append(f"{label}: {s_old} -> {s_new}")
                
        # [نکته مهم]: اگر لیست تغییرات خالی بود، None برمی‌گرداند تا در تابع اصلی لاگ نشود
        return " | ".join(changes) if changes else None
    
    # ------------------------------------------------------------------------------
    # ذخیره قطعه: ثبت قطعه جدید، شارژ موجودی یا ویرایش مشخصات فنی
    # ------------------------------------------------------------------------------
    @app.route('/api/save', methods=['POST'])
    def save_part():
        try:
            d = request.json
            part_id = d.get('id'); username = d.get('username', 'unknown')
            
            # تبدیل و پاکسازی اعداد
            raw_price = str(d.get("price", "")).replace(',', ''); price = float(raw_price) if raw_price and raw_price.replace('.', '', 1).isdigit() else 0.0
            raw_usd = str(d.get("usd_rate", "")).replace(',', ''); usd_rate = float(raw_usd) if raw_usd and raw_usd.replace('.', '', 1).isdigit() else 0.0
            inv_num = d.get("invoice_number", "")
            
            # زمان دقیق سرور
            now_dt = datetime.now()
            current_timestamp = now_dt.strftime("%Y-%m-%d %H:%M:%S")

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                # بررسی وجود ID
                if part_id:
                    cursor.execute("SELECT id FROM parts WHERE id = %s", (part_id,))
                    if not cursor.fetchone(): part_id = None
                
                # تولید کد قطعه خودکار (اگر جدید باشد)
                part_code = d.get("part_code", "")
                if not part_id and not part_code:
                    cursor.execute("SELECT `value` FROM app_config WHERE `key` = 'component_config'")
                    row_cfg = cursor.fetchone()
                    config = json.loads(row_cfg['value']) if row_cfg else {}
                    prefix = config.get(d.get("type"), {}).get("prefix", "PRT")
                    
                    cursor.execute("SELECT part_code FROM parts WHERE type = %s AND part_code LIKE %s ORDER BY part_code DESC LIMIT 1", (d.get("type"), f"{prefix}%"))
                    last_row = cursor.fetchone()
                    next_num = 1
                    if last_row and last_row['part_code']:
                        try: next_num = int(last_row['part_code'][len(prefix):]) + 1
                        except: pass
                    part_code = f"{prefix}{str(next_num).zfill(9)}"

                links = d.get("purchase_links", []); links_json = json.dumps(links[:5]) if isinstance(links, list) else "[]"
                
                # دیکشنری داده‌های جدید (Payload)
                payload = {
                    "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""), "package": d.get("pkg", ""), "type": d.get("type", ""), 
                    "buy_date": d.get("date", ""), "quantity": int(d.get("qty") or 0), "toman_price": price, 
                    "reason": d.get("reason", ""), "min_quantity": int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
                    "last_modified_by": username, "storage_location": d.get("location", ""), "tech": d.get("tech", ""), 
                    "usd_rate": usd_rate, "purchase_links": links_json, "invoice_number": inv_num, "entry_date": current_timestamp, "part_code": part_code,
                    "list5": d.get("list5", ""), "list6": d.get("list6", ""), "list7": d.get("list7", ""), 
                    "list8": d.get("list8", ""), "list9": d.get("list9", ""), "list10": d.get("list10", "")
                }
                
                rid = None
                qty_change = payload['quantity']
                op = 'ENTRY (New)'
                final_edit_report = "" # متنی که قرار است در ستون edit_reason ذخیره شود

                # --- سناریوی ۱: ویرایش قطعه موجود ---
                if part_id:
                    cursor.execute('SELECT * FROM parts WHERE id = %s', (part_id,))
                    old_data = cursor.fetchone()
                    
                    if old_data:
                        # محاسبه تغییر تعداد
                        old_q = old_data['quantity']
                        qty_change = payload['quantity'] - old_q
                        
                        if qty_change > 0: op = 'ENTRY (Refill)'
                        elif qty_change < 0: op = 'UPDATE (Decrease)'
                        else: op = 'UPDATE (Edit)'
                        
                        # --- شروع تغییر: اولویت با متنی است که از کلاینت آمده ---
                        client_reason = d.get("edit_reason")
                        if client_reason:
                            final_edit_report = client_reason
                        else:
                            # اگر کلاینت چیزی نفرستاد، سرور خودش حساب کند (حالت فال‌بک)
                            final_edit_report = generate_change_report(old_data, payload)
                        # --- پایان تغییر ---
                        
                        # قانون مهم: اگر هیچ چیزی تغییر نکرده، عملیات را کنسل کن
                        if qty_change == 0 and not final_edit_report:
                            return jsonify({"success": True, "message": "No changes detected"})

                        # انجام آپدیت در جدول parts
                        cursor.execute("""UPDATE parts SET val=%s, watt=%s, tolerance=%s, package=%s, type=%s, buy_date=%s, quantity=%s, toman_price=%s, reason=%s, min_quantity=%s, vendor_name=%s, last_modified_by=%s, storage_location=%s, tech=%s, usd_rate=%s, purchase_links=%s, invoice_number=%s, entry_date=%s, part_code=%s, list5=%s, list6=%s, list7=%s, list8=%s, list9=%s, list10=%s WHERE id=%s""", (*payload.values(), part_id))
                        rid = part_id

                # --- سناریوی ۲: قطعه جدید (یا ادغام) ---
                if not rid:
                    # چک کردن تکراری بودن
                    dup_sql = "SELECT id, quantity FROM parts WHERE val=%s AND watt=%s AND tolerance=%s AND package=%s AND type=%s AND tech=%s AND storage_location=%s"
                    dup_params = (payload['val'], payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['tech'], payload['storage_location'])
                    cursor.execute(dup_sql, dup_params)
                    existing = cursor.fetchone()
                    
                    if existing:
                        # ادغام با موجودی قبلی
                        rid = existing['id']
                        new_qty = existing['quantity'] + qty_change
                        op = 'ENTRY (Refill - Merge)'
                        final_edit_report = "افزایش موجودی از طریق ادغام با قطعه جدید"
                        
                        # حفظ کد قطعه قدیمی
                        cursor.execute("SELECT part_code FROM parts WHERE id=%s", (rid,))
                        p_code_row = cursor.fetchone()
                        if p_code_row and p_code_row['part_code']: payload['part_code'] = p_code_row['part_code']

                        cursor.execute("UPDATE parts SET quantity=%s, toman_price=%s, buy_date=%s, vendor_name=%s, last_modified_by=%s, reason=%s, usd_rate=%s, purchase_links=%s, invoice_number=%s, entry_date=%s, part_code=%s WHERE id=%s", (new_qty, payload['toman_price'], payload['buy_date'], payload['vendor_name'], username, payload['reason'], payload['usd_rate'], payload['purchase_links'], payload['invoice_number'], payload['entry_date'], payload['part_code'], rid))
                    else:
                        # کاملاً جدید
                        final_edit_report = "ثبت اولیه قطعه"
                        cursor.execute("INSERT INTO parts (val, watt, tolerance, package, type, buy_date, quantity, toman_price, reason, min_quantity, vendor_name, last_modified_by, storage_location, tech, usd_rate, purchase_links, invoice_number, entry_date, part_code, list5, list6, list7, list8, list9, list10) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)", tuple(payload.values()))
                        rid = cursor.lastrowid
                
                # ثبت در لاگ با گزارش کامل تغییرات
                log_sql = """
                    INSERT INTO purchase_log (
                        part_id, val, quantity_added, unit_price, vendor_name, purchase_date, 
                        reason, edit_reason, operation_type, username, watt, tolerance, package, type, 
                        storage_location, tech, usd_rate, invoice_number, part_code, timestamp,
                        list5, list6, list7, list8, list9, list10
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                log_params = (
                    rid, payload['val'], qty_change, payload['toman_price'], payload['vendor_name'], payload['buy_date'],
                    payload['reason'], final_edit_report, op, username, payload['watt'], payload['tolerance'], payload['package'], payload['type'],
                    payload['storage_location'], payload['tech'], payload['usd_rate'], inv_num, payload['part_code'], current_timestamp,
                    payload['list5'], payload['list6'], payload['list7'], payload['list8'], payload['list9'], payload['list10']
                )
                
                cursor.execute(log_sql, log_params)
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500
        
    # ------------------------------------------------------------------------------
    # برداشت کالا: ثبت خروج قطعات از انبار برای مصارف پروژه‌ای
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # برداشت کالا: ثبت خروج + ثبت توضیحات اصلاح + گزارش تغییر موجودی (هوشمند)
    # ------------------------------------------------------------------------------
    @app.route('/api/withdraw', methods=['POST'])
    def withdraw_parts():
        try:
            data = request.json
            items = data.get('items', [])
            project_name = data.get('project', 'General Usage')
            username = data.get('username', 'unknown')
            
            # دریافت توضیحات دستی کاربر
            user_note = data.get('description', '') or data.get('edit_reason', '')
            
            if not items: return jsonify({"error": "قطعه‌ای انتخاب نشده است"}), 400
            
            # دریافت تاریخ شمسی و زمان دقیق همان لحظه
            persian_date = get_current_jalali_date()
            current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                # گام ۱: چک کردن موجودی
                for item in items:
                    cursor.execute("SELECT quantity, val FROM parts WHERE id = %s", (item['id'],))
                    row = cursor.fetchone()
                    if not row: return jsonify({"error": f"قطعه {item['id']} یافت نشد"}), 404
                    if row['quantity'] < int(item['qty']): 
                        return jsonify({"error": f"موجودی ناکافی برای قطعه {row['val']}"}), 400
                
                # گام ۲: ثبت خروج و لاگ
                for item in items:
                    part_id = item['id']; qty = int(item['qty'])
                    cursor.execute("SELECT * FROM parts WHERE id = %s", (part_id,))
                    part = cursor.fetchone()
                    
                    # محاسبه مقادیر قبل و بعد برای ثبت در گزارش
                    old_qty = part['quantity']
                    new_qty = old_qty - qty
                    
                    # تولید گزارش هوشمند (شبیه بخش ورود کالا)
                    change_report = f"موجودی: {old_qty} -> {new_qty}"
                    
                    # ترکیب توضیحات کاربر با گزارش سیستم
                    final_edit_reason = f"{user_note} | {change_report}" if user_note else change_report
                    
                    # کسر موجودی از دیتابیس
                    cursor.execute("UPDATE parts SET quantity = %s, last_modified_by = %s WHERE id = %s", (new_qty, username, part_id))
                    
                    # ثبت لاگ کامل
                    log_sql = """INSERT INTO purchase_log (
                        part_id, val, quantity_added, unit_price, vendor_name, purchase_date, 
                        reason, edit_reason, operation_type, username, watt, tolerance, package, type, 
                        storage_location, tech, usd_rate, invoice_number, part_code, timestamp,
                        list5, list6, list7, list8, list9, list10
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'EXIT (Project)', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
                    
                    cursor.execute(log_sql, (
                        part_id, part['val'], -qty, part['toman_price'], part['vendor_name'], 
                        persian_date,       # تاریخ شمسی
                        project_name,       # دلیل اصلی (پروژه)
                        final_edit_reason,  # دلیل اصلاح (شامل توضیحات کاربر + تغییر موجودی)
                        username, part['watt'], part['tolerance'], part['package'], part['type'],
                        part['storage_location'], part['tech'], part['usd_rate'], part['invoice_number'], 
                        part['part_code'], 
                        current_timestamp,  # زمان دقیق
                        part['list5'], part['list6'], part['list7'], part['list8'], part['list9'], part['list10']
                    ))
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close(); conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500
    # ------------------------------------------------------------------------------
    # حذف قطعه: پاک کردن یک قطعه از لیست + ثبت دقیق در تاریخچه با زمان سرور
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # حذف قطعه: پاک کردن یک قطعه از لیست + ثبت دقیق در تاریخچه با زمان سرور
    # ------------------------------------------------------------------------------
    @app.route('/api/delete/<int:id>', methods=['DELETE'])
    def delete_part(id: int):
        # تلاش برای دریافت نام کاربر از پارامترهای URL (چون متد DELETE بدنه ندارد)
        username = request.args.get('username', 'unknown')
        
        # زمان دقیق برای ثبت در لاگ
        now_dt = datetime.now()
        current_timestamp = now_dt.strftime("%Y-%m-%d %H:%M:%S")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM parts WHERE id=%s", (id,))
            part = cursor.fetchone()
            
            if part: 
                # ثبت عملیات حذف در جدول لاگ با تمام جزئیات
                # اصلاح: اضافه شدن ستون edit_reason به لاگ
                log_sql = """
                    INSERT INTO purchase_log (
                        part_id, val, quantity_added, unit_price, vendor_name, purchase_date, 
                        reason, edit_reason, operation_type, username, watt, tolerance, package, type, 
                        storage_location, tech, usd_rate, invoice_number, part_code, timestamp,
                        list5, list6, list7, list8, list9, list10
                    ) VALUES (%s, %s, 0, %s, %s, %s, %s, %s, 'DELETE', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                params = (
                    id, part['val'], part['toman_price'], part['vendor_name'], part['buy_date'],
                    'حذف قطعه از انبار', # reason
                    '', # edit_reason (مقدار خالی برای جلوگیری از خطا)
                    username, part['watt'], part['tolerance'], part['package'], part['type'],
                    part['storage_location'], part['tech'], part['usd_rate'], part['invoice_number'], 
                    part['part_code'], current_timestamp,
                    part['list5'], part['list6'], part['list7'], part['list8'], part['list9'], part['list10']
                )
                
                cursor.execute(log_sql, params)

            cursor.execute('DELETE FROM parts WHERE id = %s', (id,))
            conn.commit()
            return jsonify({"success": True})
        except Exception as e: return jsonify({"error": str(e)}), 500
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # [بخش: مدیریت مخاطبین (Contacts)]
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # لیست مخاطبین: دریافت اطلاعات تمامی تامین‌کنندگان ثبت شده
    # ------------------------------------------------------------------------------
    @app.route('/api/contacts', methods=['GET'])
    def get_contacts():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('SELECT * FROM contacts ORDER BY name ASC')
            rows = cursor.fetchall()
            return jsonify(rows)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # ذخیره مخاطب: افزودن تامین‌کننده جدید یا ویرایش اطلاعات فعلی
    # ------------------------------------------------------------------------------
    @app.route('/api/contacts/save', methods=['POST'])
    def save_contact():
        try:
            d = request.json
            params = (d.get("name"), d.get("phone"), d.get("mobile"), d.get("fax"), d.get("website"), d.get("email"), d.get("address"), d.get("notes"))
            
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                if d.get('id'): 
                    cursor.execute("UPDATE contacts SET name=%s, phone=%s, mobile=%s, fax=%s, website=%s, email=%s, address=%s, notes=%s WHERE id=%s", (*params, d['id']))
                else: 
                    cursor.execute("INSERT INTO contacts (name, phone, mobile, fax, website, email, address, notes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", params)
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # حذف مخاطب: پاک کردن یک تامین‌کننده از لیست مخاطبین
    # ------------------------------------------------------------------------------
    @app.route('/api/contacts/delete/<int:id>', methods=['DELETE'])
    def delete_contact(id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('DELETE FROM contacts WHERE id = %s', (id,))
            conn.commit()
            return jsonify({"success": True})
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # [بخش: لاگ و آمار (Logs & Stats)]
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # دریافت لاگ: مشاهده تاریخچه کامل ورود و خروج کالاها
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # دریافت لاگ: اصلاح شده برای تبدیل فرمت زمان و جلوگیری از خطای JSON
    # ------------------------------------------------------------------------------
    @app.route('/api/log', methods=['GET'])
    def get_log():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC')
            rows = cursor.fetchall()
            
            # تبدیل datetime به رشته (چون json نمیتواند datetime را سریالایز کند)
            for row in rows:
                if row.get('timestamp'):
                    row['timestamp'] = str(row['timestamp'])
                    
            return jsonify(rows)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # آمار انبار: محاسبه ارزش سرمایه، قیمت زنده دلار و لیست کسری‌ها
    # ------------------------------------------------------------------------------
    @app.route('/api/inventory/stats', methods=['GET'])
    def get_inventory_stats():
        try:
            daily_usd_price = fetch_daily_usd_price()
            usd_date = USD_CACHE.get("date_str", "")
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT id, val, quantity, toman_price, usd_rate, min_quantity, type, package, storage_location, watt, tolerance, tech, vendor_name, purchase_links, invoice_number, part_code FROM parts")
                rows = cursor.fetchall()
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
                        shortages.append({"id": row['id'], "val": row['val'], "pkg": row['package'], "qty": q, "min": min_q, "loc": row['storage_location'], "type": row['type'], "watt": row['watt'], "tolerance": row['tolerance'], "tech": row['tech'], "vendor": row['vendor_name'], "links": links, "invoice_number": row['invoice_number'], "part_code": row['part_code']})
                    if cat not in categories: categories[cat] = {"count": 0, "value": 0}
                    categories[cat]["count"] += q; categories[cat]["value"] += current_part_value_toman
                if daily_usd_price > 0: total_value_usd_live = total_value_toman_calculated / daily_usd_price
                else: total_value_usd_live = 0
                shortages.sort(key=lambda x: x['qty'])
                return jsonify({"total_items": total_items, "total_quantity": total_quantity, "total_value_toman": int(total_value_toman_calculated), "total_value_usd_live": round(total_value_usd_live, 2), "live_usd_price": daily_usd_price, "usd_date": usd_date, "shortages": shortages, "categories": categories})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # حذف لاگ: حذف فیزیکی رکورد تراکنش و واگردانی موجودی انبار
    # ------------------------------------------------------------------------------
    @app.route('/api/log/delete/<int:log_id>', methods=['DELETE'])
    def delete_log_entry(log_id: int) -> Response:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT * FROM purchase_log WHERE log_id = %s", (log_id,))
                log = cursor.fetchone()
                if not log: return jsonify({"ok": False, "error": "Log not found"}), 404
                cursor.execute("UPDATE parts SET quantity = quantity - %s WHERE id = %s", (log['quantity_added'], log['part_id']))
                cursor.execute("DELETE FROM purchase_log WHERE log_id = %s", (log_id,))
                conn.commit()
                return jsonify({"ok": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # ------------------------------------------------------------------------------
    # ویرایش لاگ: تغییر اطلاعات یک تراکنش و اصلاح مابه‌تفاوت روی انبار
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # ویرایش لاگ: اصلاح شده برای ثبت "دلیل ویرایش" در ستون جداگانه
    # ------------------------------------------------------------------------------
    @app.route('/api/log/update', methods=['POST'])
    def update_log_entry() -> Response:
        try:
            data = request.get_json()
            log_id = data.get('log_id')
            new_qty = float(data.get('quantity_added', 0))
            new_reason = data.get('reason', '') # دلیل اصلی (مثلا نام پروژه)
            edit_note = data.get('edit_reason', '') # دلیل ویرایش (مثلا اشتباه تایپی) - ستون جدید
            
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("SELECT * FROM purchase_log WHERE log_id = %s", (log_id,))
                old_log = cursor.fetchone()
                if not old_log: return jsonify({"ok": False, "error": "Log not found"}), 404
                
                # اصلاح موجودی انبار
                diff = new_qty - old_log['quantity_added']
                cursor.execute("UPDATE parts SET quantity = quantity + %s WHERE id = %s", (diff, old_log['part_id']))
                
                # بروزرسانی لاگ: ثبت دلیل اصلی و دلیل ویرایش در ستون‌های جداگانه
                cursor.execute(
                    "UPDATE purchase_log SET quantity_added = %s, reason = %s, edit_reason = %s WHERE log_id = %s", 
                    (new_qty, new_reason, edit_note, log_id)
                )
                conn.commit()
                return jsonify({"ok": True})
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500
    
    # ------------------------------------------------------------------------------
    # تنظیمات سرور: خواندن و نوشتن فایل server_config.json
    # ------------------------------------------------------------------------------
    @app.route('/api/admin/server-settings', methods=['GET', 'POST'])
    def server_settings():
        from database import SERVER_CONFIG_FILE
        if request.method == 'GET':
            if os.path.exists(SERVER_CONFIG_FILE):
                with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return jsonify(json.load(f))
            # اگر فایل وجود نداشت، تنظیمات پیش‌فرض را از config برگردان
            return jsonify(DB_CONFIG)
        
        # بخش POST برای ذخیره تنظیمات (که از قبل در admin_server.js داشتی)
        new_settings = request.json
        try:
            with open(SERVER_CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(new_settings, f, indent=4)
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    # ------------------------------------------------------------------------------
    # [بخش جدید: ماژول مدیریت پروژه‌ها و BOM]
    # اضافه شده در نسخه 0.23 - شامل APIهای CRUD پروژه، BOM و کسر از انبار
    # ------------------------------------------------------------------------------

    # 1. دریافت لیست پروژه‌ها (با شمارش تعداد قطعات BOM)
    @app.route('/api/projects', methods=['GET'])
    def get_projects():
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # تغییر کوئری برای گرفتن تعداد قطعات در هر پروژه
            query = """
                SELECT p.*, 
                (SELECT COUNT(*) FROM project_bom WHERE project_id = p.id) as bom_count 
                FROM projects p 
                ORDER BY last_modified DESC
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            for r in rows:
                if r.get('last_modified'): r['last_modified'] = str(r['last_modified'])
                if r.get('created_at'): r['created_at'] = str(r['created_at'])
            return jsonify(rows)
        finally:
            cursor.close(); conn.close()

    # 2. ذخیره پروژه (ایجاد یا ویرایش نام و توضیحات)
    @app.route('/api/projects/save', methods=['POST'])
    def save_project():
        try:
            d = request.json
            p_id = d.get('id')
            name = d.get('name')
            desc = d.get('description', '')
            
            if not name: return jsonify({"error": "نام پروژه الزامی است"}), 400

            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                if p_id:
                    cursor.execute("UPDATE projects SET name=%s, description=%s WHERE id=%s", (name, desc, p_id))
                    pid = p_id
                else:
                    cursor.execute("INSERT INTO projects (name, description) VALUES (%s, %s)", (name, desc))
                    pid = cursor.lastrowid
                conn.commit()
                return jsonify({"success": True, "id": pid})
            finally:
                cursor.close(); conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # 3. حذف پروژه (به همراه BOM و هزینه‌ها)
    @app.route('/api/projects/delete/<int:id>', methods=['DELETE'])
    def delete_project(id: int):
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM projects WHERE id=%s", (id,))
            conn.commit()
            return jsonify({"success": True})
        finally:
            cursor.close(); conn.close()

    # 4. دریافت اطلاعات کامل پروژه (BOM + Costs)
    @app.route('/api/projects/<int:id>/details', methods=['GET'])
    def get_project_details(id: int):
        conn = get_db_connection(); cursor = conn.cursor(dictionary=True)
        try:
            # 1. دریافت اطلاعات اصلی پروژه
            cursor.execute("SELECT * FROM projects WHERE id=%s", (id,))
            project = cursor.fetchone()
            if not project: return jsonify({"error": "پروژه یافت نشد"}), 404
            
            # تبدیل تاریخ‌ها به رشته
            if project.get('last_modified'): project['last_modified'] = str(project['last_modified'])
            if project.get('created_at'): project['created_at'] = str(project['created_at'])

            # 2. دریافت لیست قطعات (BOM) با اطلاعات تکمیلی از جدول قطعات
            # نکته مهم: ستون parent_part_id برای تشخیص زیرمجموعه‌ها اضافه شده است
            # [اصلاح]: p.unit حذف شد تا خطای Unknown column برطرف شود
            bom_query = """
                SELECT pb.id as bom_id, pb.quantity as required_qty, pb.sort_order, pb.parent_part_id,
                       p.id as part_id, p.val, p.part_code, p.package, p.toman_price, p.usd_rate, 
                       p.storage_location, p.quantity as inventory_qty, p.type, p.watt, p.tolerance, p.tech
                FROM project_bom pb JOIN parts p ON pb.part_id = p.id
                WHERE pb.project_id = %s
                ORDER BY pb.sort_order ASC, pb.id ASC
            """
            cursor.execute(bom_query, (id,))
            flat_bom = cursor.fetchall()
            
            # 3. تبدیل لیست خطی به ساختار درختی (Tree Structure)
            bom_tree = []
            lookup = {}
            
            # مرحله اول: شناسایی والدها و تبدیل داده‌های عددی
            for item in flat_bom:
                # تبدیل مقادیر Decimal به float برای سازگاری با JSON
                for key in item:
                    if type(item[key]).__name__ == 'Decimal': item[key] = float(item[key])
                    elif hasattr(item[key], 'isoformat'): item[key] = str(item[key])
                
                # اگر parent_part_id ندارد، یعنی یک ردیف اصلی (والد) است
                if not item['parent_part_id']:
                    item['alternatives'] = [] # آماده‌سازی آرایه برای فرزندان
                    bom_tree.append(item)
                    lookup[item['part_id']] = item # ذخیره در lookup برای دسترسی سریع
            
            # مرحله دوم: تخصیص فرزندان به والدین
            for item in flat_bom:
                if item['parent_part_id']:
                    parent_id = item['parent_part_id']
                    # اگر والدش در لیست موجود بود، به لیست جایگزین‌های آن اضافه شود
                    if parent_id in lookup:
                        lookup[parent_id]['alternatives'].append(item)

            # 4. دریافت هزینه‌های جانبی
            cursor.execute("SELECT * FROM project_costs WHERE project_id=%s", (id,))
            costs_list = cursor.fetchall()
            for item in costs_list:
                for key, val in item.items():
                    if type(val).__name__ == 'Decimal': item[key] = float(val)

            return jsonify({"project": project, "bom": bom_tree, "costs": costs_list})
        finally: cursor.close(); conn.close()

    # 5. ذخیره تغییرات BOM و هزینه‌ها (اصلاح شده برای ذخیره قیمت دلار و ضرایب)
    @app.route('/api/projects/save_details', methods=['POST'])
    def save_project_details():
        try:
            d = request.json
            p_id = d.get('project_id')
            bom_items = d.get('bom', [])
            cost_items = d.get('costs', [])
            
            # پارامترهای محاسباتی پروژه
            conv_rate = d.get('conversion_rate', 0)
            p_profit = d.get('part_profit', 0)
            total_usd = d.get('total_price_usd', 0)
            total_count = d.get('total_count', 0)
            
            conn = get_db_connection(); cursor = conn.cursor()
            try:
                # 1. حذف BOM قبلی برای جایگزینی با نسخه جدید
                cursor.execute("DELETE FROM project_bom WHERE project_id=%s", (p_id,))
                
                if bom_items:
                    bom_values = []
                    # پیمایش لیست درختی برای استخراج ردیف‌های دیتابیس
                    for idx, item in enumerate(bom_items):
                        # الف) ذخیره ردیف اصلی (والد) -> parent_part_id = NULL
                        bom_values.append((p_id, item['part_id'], item['required_qty'], idx, None))
                        
                        # ب) ذخیره زیرمجموعه‌ها (فرزندان) -> parent_part_id = ID والد
                        if 'alternatives' in item:
                            for alt in item['alternatives']:
                                # فرزندان، تعداد مورد نیاز (required_qty) و ترتیب (idx) را از والد به ارث می‌برند
                                # یا می‌توانند مستقل باشند، اما در اینجا منطق BOM این است که جایگزین همان تعداد را دارد.
                                bom_values.append((p_id, alt['part_id'], item['required_qty'], idx, item['part_id']))
                                
                    # درج یکجا (Bulk Insert) برای کارایی بالاتر
                    cursor.executemany("""
                        INSERT INTO project_bom (project_id, part_id, quantity, sort_order, parent_part_id) 
                        VALUES (%s, %s, %s, %s, %s)
                    """, bom_values)

                # 2. به‌روزرسانی هزینه‌های جانبی
                cursor.execute("DELETE FROM project_costs WHERE project_id=%s", (p_id,))
                if cost_items:
                    cost_values = [(p_id, c['description'], float(c['cost'])) for c in cost_items if c.get('description')]
                    if cost_values: 
                        cursor.executemany("INSERT INTO project_costs (project_id, description, cost) VALUES (%s, %s, %s)", cost_values)

                # 3. به‌روزرسانی اطلاعات کلی پروژه (نرخ‌ها و قیمت نهایی)
                update_sql = """
                    UPDATE projects SET 
                        last_modified=NOW(), 
                        conversion_rate=%s, 
                        part_profit=%s, 
                        total_price_usd=%s, 
                        total_parts_count=%s 
                    WHERE id=%s
                """
                cursor.execute(update_sql, (conv_rate, p_profit, total_usd, total_count, p_id))
                conn.commit()
                return jsonify({"success": True})
            finally: cursor.close(); conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # 6. کسر از انبار (لاجیک هوشمند کسری و برداشت اجباری)
    @app.route('/api/projects/deduct', methods=['POST'])
    def deduct_project_bom():
        try:
            d = request.json
            p_id = d.get('project_id')
            count = int(d.get('count', 1)) # تعداد سری تولید
            force = d.get('force', False)  # آیا در صورت کسری هم برداشت انجام شود؟
            user = d.get('username', 'System')
            
            conn = get_db_connection(); cursor = conn.cursor(dictionary=True)
            try:
                # دریافت نام پروژه برای ثبت در لاگ
                cursor.execute("SELECT name FROM projects WHERE id=%s", (p_id,))
                p_row = cursor.fetchone()
                project_name = p_row.get('name', 'Unknown') if p_row else 'Unknown'
                
                # دریافت لیست قطعات BOM (فقط قطعات اصلی/والد باید کسر شوند)
                # نکته: فرض بر این است که در BOM نهایی، کاربر قطعه اصلی را انتخاب کرده است.
                # اگر قرار باشد قطعه جایگزین کسر شود، باید لاجیک انتخاب (Selection) سمت سرور هم ذخیره شود.
                # فعلاً برای سادگی و طبق منطق فعلی دیتابیس، تمام ردیف‌هایی که parent_part_id ندارند (اصلی‌ها) بررسی می‌شوند.
                cursor.execute("""
                    SELECT pb.quantity as bom_qty, p.* FROM project_bom pb 
                    JOIN parts p ON pb.part_id = p.id 
                    WHERE pb.project_id=%s AND pb.parent_part_id IS NULL
                """, (p_id,))
                items = cursor.fetchall()
                
                # 1. بررسی کسری موجودی
                shortages = []
                for it in items:
                    req = it['bom_qty'] * count
                    if it['quantity'] < req: 
                        shortages.append({
                            "val": it['val'], 
                            "part_code": it['part_code'], 
                            "required": req, 
                            "in_stock": it['quantity'], 
                            "missing": req - it['quantity'], 
                            "location": it['storage_location']
                        })
                
                # اگر کسری وجود داشت و حالت Force نبود، خطا برگردان
                if shortages and not force: 
                    return jsonify({"success": False, "status": "shortage", "shortages": shortages})
                
                # 2. انجام عملیات کسر
                for it in items:
                    req = it['bom_qty'] * count
                    # اگر فورس باشد، تا حد امکان (موجودی فعلی) کسر کن
                    deduct = it['quantity'] if (force and it['quantity'] < req) else req
                    
                    if deduct > 0:
                        # آپدیت موجودی
                        cursor.execute("UPDATE parts SET quantity = quantity - %s WHERE id = %s", (deduct, it['id']))
                        
                        # ثبت لاگ تراکنش
                        price = float(it['toman_price']) if it['toman_price'] else 0
                        log_sql = """
                            INSERT INTO purchase_log 
                            (part_id, val, quantity_added, unit_price, operation_type, username, reason, timestamp, part_code, storage_location) 
                            VALUES (%s, %s, %s, %s, 'EXIT (Project)', %s, %s, NOW(), %s, %s)
                        """
                        cursor.execute(log_sql, (
                            it['id'], it['val'], -deduct, price, user, 
                            f"پروژه: {project_name} (تعداد تولید: {count})", 
                            it['part_code'], it['storage_location']
                        ))
                        
                conn.commit()
                return jsonify({"success": True})
            finally: cursor.close(); conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # --------------------------------------------------------------------------
    # 7. کپی پروژه (Duplicate) - ایجاد نسخه جدید از پروژه به همراه BOM و هزینه‌ها
    # --------------------------------------------------------------------------
    @app.route('/api/projects/duplicate/<int:id>', methods=['POST'])
    def duplicate_project(id: int):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            # 1. دریافت اطلاعات پروژه اصلی
            cursor.execute("SELECT * FROM projects WHERE id=%s", (id,))
            original = cursor.fetchone()
            if not original:
                return jsonify({"error": "پروژه یافت نشد"}), 404
            
            # 2. ساخت نام جدید و ایجاد پروژه جدید (شامل کپی نرخ تسعیر و سود)
            new_name = f"{original['name']} - Copy"
            conv_rate = original.get('conversion_rate', 0)
            p_profit = original.get('part_profit', 0)
            
            cursor.execute(
                "INSERT INTO projects (name, description, conversion_rate, part_profit, created_at, last_modified) VALUES (%s, %s, %s, %s, NOW(), NOW())",
                (new_name, original.get('description', ''), conv_rate, p_profit)
            )
            new_id = cursor.lastrowid
            
            # 3. کپی کردن آیتم‌های BOM
            cursor.execute("SELECT part_id, quantity, sort_order FROM project_bom WHERE project_id=%s", (id,))
            bom_items = cursor.fetchall()
            if bom_items:
                bom_values = [(new_id, item['part_id'], item['quantity'], item['sort_order']) for item in bom_items]
                cursor.executemany("INSERT INTO project_bom (project_id, part_id, quantity, sort_order) VALUES (%s, %s, %s, %s)", bom_values)
            
            # 4. کپی کردن هزینه‌های جانبی
            cursor.execute("SELECT description, cost FROM project_costs WHERE project_id=%s", (id,))
            cost_items = cursor.fetchall()
            if cost_items:
                cost_values = [(new_id, item['description'], item['cost']) for item in cost_items]
                cursor.executemany("INSERT INTO project_costs (project_id, description, cost) VALUES (%s, %s, %s)", cost_values)
            
            conn.commit()
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            cursor.close()
            conn.close()    