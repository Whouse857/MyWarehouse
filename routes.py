<<<<<<< HEAD
# ==============================================================================
# نسخه: 0.21 (مهاجرت کامل به MySQL - نسخه نهایی و جامع)
# فایل: routes.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول مسئول تعریف تمامی مسیرها (Routes) و نقاط پایانی (Endpoints) سیستم است.
# توابع موجود در این فایل وظایف مدیریت قطعات، کاربران، تنظیمات، عملیات پشتیبان‌گیری
# و گزارش‌گیری‌های انبار را از طریق پروتکل HTTP مدیریت می‌کنند.
# ==============================================================================

=======
# --- [فایل بهینه‌شده و مدیریت‌شده مسیرهای API سیستم نکسوس] ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
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

<<<<<<< HEAD
# متغیر کش برای ذخیره محتوای فایل اصلی (Index) جهت بهینه‌سازی سرعت لود
=======
# متغیر کش برای ذخیره محتوای فایل اصلی رابط کاربری (بهبود سرعت لود)
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
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
    
<<<<<<< HEAD
    # ------------------------------------------------------------------------------
    # مسیر ریشه: ارائه فایل index.html (رابط کاربری) با سیستم کشینگ
    # ------------------------------------------------------------------------------
=======
    # --- ابزارهای کمکی داخلی برای استانداردسازی پاسخ‌ها ---
    def error_response(msg, code=500):
        """تولید پاسخ خطای استاندارد"""
        return jsonify({"success": False, "error": str(msg)}), code

    def success_response(data=None):
        """تولید پاسخ موفقیت استاندارد"""
        res = {"success": True}
        if data: res.update(data)
        return jsonify(res)

    # --- مدیریت فایل اصلی (Index) ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
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

<<<<<<< HEAD
    # ------------------------------------------------------------------------------
    # مسیر Heartbeat: به‌روزرسانی زمان آخرین فعالیت کلاینت برای جلوگیری از بسته شدن سرور
    # ------------------------------------------------------------------------------
=======
    # --- مدیریت وضعیت اتصال و خروج ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
    @app.route('/api/heartbeat', methods=['POST'])
    def heartbeat() -> Response:
        """بررسی زنده بودن اتصال کلاینت به سرور"""
        server_state["last_heartbeat"] = time.time()
        server_state["shutdown_trigger"] = False
        return jsonify({"status": "alive"})

    # ------------------------------------------------------------------------------
    # مسیر Client Closed: اعلام بسته شدن دستی پنجره مرورگر توسط کلاینت
    # ------------------------------------------------------------------------------
    @app.route('/api/client_closed', methods=['POST'])
    def client_closed() -> Response:
        """اعلام بسته شدن پنجره توسط کاربر"""
        server_state["shutdown_trigger"] = True
        return jsonify({"status": "closing_soon"})

    # ------------------------------------------------------------------------------
    # مسیر Exit App: خاموش کردن کامل سرور و خروج از برنامه
    # ------------------------------------------------------------------------------
    @app.route('/api/exit_app', methods=['POST'])
    def exit_app() -> Response:
        """خروج کامل از برنامه و بستن پروسس سرور"""
        def shutdown(): 
            time.sleep(0.5)
            os._exit(0)
        threading.Thread(target=shutdown).start()
        return jsonify({"status": "exiting"}), 200

<<<<<<< HEAD
    # ------------------------------------------------------------------------------
    # [بخش: مدیریت پشتیبان‌گیری (Backup)]
    # این بخش شامل ایجاد، لیست کردن، دانلود و بازگردانی دیتابیس است.
    # ------------------------------------------------------------------------------

    # ------------------------------------------------------------------------------
    # ایجاد بک‌آپ: تهیه نسخه کپی از دیتابیس فعلی با نام کاربر و برچسب زمانی
    # ------------------------------------------------------------------------------
=======
    # --- مدیریت پشتیبان‌گیری (Backup) ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
    @app.route('/api/backup/create', methods=['POST'])
    def create_backup():
        """ایجاد یک نسخه پشتیبان از دیتابیس فعلی"""
        try:
            data = request.json or {}
            username = data.get('username', 'System')
<<<<<<< HEAD
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
=======
            
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

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
<<<<<<< HEAD
=======
        """ارسال فایل بک‌آپ برای دانلود کلاینت"""
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
        try:
            path = os.path.join(BACKUP_FOLDER, filename)
            if not os.path.exists(path): return error_response("فایل یافت نشد", 404)
            return send_file(path, as_attachment=True)
        except Exception as e: return error_response(e)
        
    # ------------------------------------------------------------------------------
    # لیست بک‌آپ‌ها: نمایش تمامی فایل‌های پشتیبان موجود در پوشه مخصوص
    # ------------------------------------------------------------------------------
    @app.route('/api/backup/list', methods=['GET'])
    def list_backups():
        """لیست کردن تمام بک‌آپ‌های موجود بر اساس زمان"""
        try:
<<<<<<< HEAD
            # جستجو برای هر دو فرمت .sql و .db جهت سازگاری با فایل‌های قدیمی
            files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.sql') or f.endswith('.db')]
=======
            files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.db')]
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
            files.sort(key=lambda x: os.path.getmtime(os.path.join(BACKUP_FOLDER, x)), reverse=True)
            
            backups = []
            for f in files:
                path = os.path.join(BACKUP_FOLDER, f)
<<<<<<< HEAD
                size = os.path.getsize(path) / 1024
                ext = ".sql" if f.endswith('.sql') else ".db"
                name_part = f.replace("HY_backup_", "").replace(ext, "")
                creator = "سیستم"
                readable_date = f
                if len(name_part) >= 19:
                    ts_str = name_part[-19:]
                    if len(name_part) > 20: creator = name_part[:-20]
=======
                size_kb = os.path.getsize(path) / 1024
                name_part = f.replace("nexus_backup_", "").replace(".db", "")
                creator, readable_date = "System", f
                
                # استخراج تاریخ و سازنده از نام فایل
                if len(name_part) >= 19:
                    ts_str = name_part[-19:]
                    creator = name_part[:-20] if len(name_part) > 20 else "System"
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
                    try: 
                        dt = datetime.strptime(ts_str, "%Y-%m-%d_%H-%M-%S")
                        readable_date = dt.strftime("%Y-%m-%d %H:%M:%S")
                    except: pass
                
                backups.append({"name": f, "size": round(size_kb, 2), "date": readable_date, "creator": creator})
            return jsonify(backups)
<<<<<<< HEAD
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
=======
        except Exception as e: return error_response(e)

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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

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
        """حذف فیزیکی یک فایل بک‌آپ"""
        try:
            src = os.path.join(BACKUP_FOLDER, filename)
<<<<<<< HEAD
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
=======
            if not os.path.exists(src): return error_response("فایل یافت نشد", 404)
            os.remove(src)
            return success_response()
        except Exception as e: return error_response(e)

    # --- مدیریت کاربران و دسترسی‌ها ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
    @app.route('/api/login', methods=['POST'])
    def login():
        """ورود کاربر به سیستم"""
        try:
<<<<<<< HEAD
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
=======
            data = request.json or {}
            user_in, pass_in = data.get('username'), data.get('password')
            if not user_in or not pass_in: 
                return jsonify({"success": False, "message": "نام کاربری و رمز عبور الزامی است"}), 400
            
            with get_db_connection() as conn:
                user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                                   (user_in, hash_password(pass_in))).fetchone()
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
                if user:
                    perms = parse_permissions_recursive(user['permissions'])
                    return success_response({
                        "role": user['role'], "username": user['username'], 
                        "permissions": perms, "full_name": user['full_name']
                    })
                return jsonify({"success": False, "message": "نام کاربری یا رمز عبور اشتباه است"}), 401
<<<<<<< HEAD
            finally:
                cursor.close()
                conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500
=======
        except Exception as e: return error_response(e)
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # لیست کاربران: دریافت اطلاعات تمامی کاربران ثبت شده در سیستم
    # ------------------------------------------------------------------------------
    @app.route('/api/users', methods=['GET'])
    def get_users():
<<<<<<< HEAD
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id, username, role, full_name, mobile, permissions FROM users")
            users = cursor.fetchall()
=======
        """دریافت لیست تمام کاربران"""
        with get_db_connection() as conn:
            users = conn.execute("SELECT id, username, role, full_name, mobile, permissions FROM users").fetchall()
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
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
        """ایجاد یا ویرایش اطلاعات کاربر"""
        try:
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # حذف کاربر: حذف اکانت کاربر (به استثنای کاربر ادمین اصلی)
    # ------------------------------------------------------------------------------
    @app.route('/api/users/delete/<int:id>', methods=['DELETE'])
    def delete_user(id: int):
<<<<<<< HEAD
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
=======
        """حذف کاربر (جلوگیری از حذف ادمین اصلی)"""
        with get_db_connection() as conn:
            target = conn.execute("SELECT username FROM users WHERE id=?", (id,)).fetchone()
            if target and target['username'] == 'admin': 
                return error_response("حذف کاربر مدیر اصلی امکان‌پذیر نیست", 403)
            conn.execute("DELETE FROM users WHERE id=?", (id,))
            conn.commit()
            return success_response()
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # تغییر رمز عبور: به‌روزرسانی گذرواژه کاربر فعلی با تایید رمز عبور قبلی
    # ------------------------------------------------------------------------------
    @app.route('/api/user/change_password', methods=['POST'])
    def change_password_api():
        """تغییر رمز عبور توسط خود کاربر"""
        try:
<<<<<<< HEAD
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
=======
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

    # --- مدیریت تنظیمات سیستم ---
    @app.route('/api/settings/config', methods=['GET'])
    def get_config():
        """دریافت تنظیمات دسته‌بندی‌ها و پارامترهای قطعات"""
        with get_db_connection() as conn:
            row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
            if row: 
                stored = json.loads(row['value'])
                # ادغام با مقادیر پیش‌فرض در صورتی که کلید جدیدی اضافه شده باشد
                for k, v in DEFAULT_COMPONENT_CONFIG.items():
                    if k not in stored: stored[k] = v
                return jsonify(stored)
            return jsonify(DEFAULT_COMPONENT_CONFIG)
        finally:
            cursor.close()
            conn.close()

    # ------------------------------------------------------------------------------
    # ذخیره کانفیگ: ثبت تنظیمات جدید و بروزرسانی کدهای انبار در صورت تغییر پیشوند
    # ------------------------------------------------------------------------------
    @app.route('/api/settings/config', methods=['POST'])
    def save_config():
        """ذخیره تنظیمات و به‌روزرسانی خودکار کدهای انبار در صورت تغییر پیشوند"""
        try:
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # تغییر نام آیتم: به‌روزرسانی نام دسته‌ها یا آیتم‌های لیست در کل دیتابیس
    # ------------------------------------------------------------------------------
    @app.route('/api/settings/rename', methods=['POST'])
    def rename_item_api():
        """تغییر نام دسته‌ها یا آیتم‌های داخل لیست‌ها در تنظیمات و دیتابیس"""
        try:
<<<<<<< HEAD
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
=======
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

    # --- مدیریت قطعات (Inventory Management) ---
    @app.route('/api/parts', methods=['GET'])
    def get_parts():
        """دریافت تمام قطعات موجود در انبار"""
        with get_db_connection() as conn:
            parts = conn.execute('SELECT * FROM parts ORDER BY id DESC').fetchall()
            return jsonify([dict(p) for p in parts])

>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
    @app.route('/api/save', methods=['POST'])
    def save_part():
        """ذخیره قطعه جدید یا ویرایش قطعه قدیمی (با مدیریت ادغام و ثبت لاگ تغییرات)"""
        try:
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
                        except: pass
                    part_code = f"{prefix}{str(next_num).zfill(9)}"

                links_json = json.dumps(d.get("purchase_links", [])[:5])
                
<<<<<<< HEAD
                # دیکشنری داده‌های جدید (Payload)
                payload = {
                    "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""), "package": d.get("pkg", ""), "type": d.get("type", ""), 
                    "buy_date": d.get("date", ""), "quantity": int(d.get("qty") or 0), "toman_price": price, 
                    "reason": d.get("reason", ""), "min_quantity": int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
                    "last_modified_by": username, "storage_location": d.get("location", ""), "tech": d.get("tech", ""), 
                    "usd_rate": usd_rate, "purchase_links": links_json, "invoice_number": inv_num, "entry_date": current_timestamp, "part_code": part_code,
=======
                # آماده‌سازی داده‌ها برای دیتابیس
                payload = {
                    "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""), 
                    "package": d.get("pkg", ""), "type": d.get("type", ""), "buy_date": d.get("date", ""),
                    "quantity": clean_int(d.get("qty")), "toman_price": price, "reason": d.get("reason", ""), 
                    "min_quantity": clean_int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
                    "last_modified_by": user, "storage_location": d.get("location", ""), "tech": d.get("tech", ""), 
                    "usd_rate": usd_rate, "purchase_links": links_json, "invoice_number": inv_num, 
                    "entry_date": entry_dt, "part_code": part_code,
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
                    "list5": d.get("list5", ""), "list6": d.get("list6", ""), "list7": d.get("list7", ""), 
                    "list8": d.get("list8", ""), "list9": d.get("list9", ""), "list10": d.get("list10", "")
                }
                
<<<<<<< HEAD
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
                        
                        # [استفاده از تابع هوشمند] تولید گزارش تغییرات
                        final_edit_report = generate_change_report(old_data, payload)
                        
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
        
    # ------------------------------------------------------------------------------
    # برداشت کالا: ثبت خروج قطعات از انبار برای مصارف پروژه‌ای
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # برداشت کالا: ثبت خروج + ثبت توضیحات اصلاح + گزارش تغییر موجودی (هوشمند)
    # ------------------------------------------------------------------------------
    @app.route('/api/withdraw', methods=['POST'])
    def withdraw_parts():
        """خروج قطعات از انبار برای یک پروژه خاص"""
        try:
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

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
<<<<<<< HEAD
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
=======
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

    # --- مدیریت مخاطبین ---
    @app.route('/api/contacts', methods=['GET'])
    def get_contacts():
        """دریافت لیست مخاطبین و فروشندگان"""
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM contacts ORDER BY name ASC').fetchall()
            return jsonify([dict(r) for r in rows])
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # ذخیره مخاطب: افزودن تامین‌کننده جدید یا ویرایش اطلاعات فعلی
    # ------------------------------------------------------------------------------
    @app.route('/api/contacts/save', methods=['POST'])
    def save_contact():
        """ذخیره یا ویرایش مخاطب"""
        try:
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # حذف مخاطب: پاک کردن یک تامین‌کننده از لیست مخاطبین
    # ------------------------------------------------------------------------------
    @app.route('/api/contacts/delete/<int:id>', methods=['DELETE'])
    def delete_contact(id: int):
<<<<<<< HEAD
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
=======
        """حذف مخاطب"""
        with get_db_connection() as conn: 
            conn.execute('DELETE FROM contacts WHERE id = ?', (id,))
            conn.commit()
        return success_response()

    # --- لاگ‌ها و آمار سیستم ---
    @app.route('/api/log', methods=['GET'])
    def get_log():
        """دریافت لیست تمام عملیات‌های انجام شده (لاگ‌ها)"""
        with get_db_connection() as conn:
            rows = conn.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC').fetchall()
            return jsonify([dict(r) for r in rows])
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # آمار انبار: محاسبه ارزش سرمایه، قیمت زنده دلار و لیست کسری‌ها
    # ------------------------------------------------------------------------------
    @app.route('/api/inventory/stats', methods=['GET'])
    def get_inventory_stats():
        """دریافت آمار کلی انبار، ارزش ریالی/دلاری و لیست کسری‌ها"""
        try:
            live_usd = fetch_daily_usd_price()
            usd_date = USD_CACHE.get("date_str", "")
            
<<<<<<< HEAD
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
                    if q <= min_q:
                        links = []
                        try: links = json.loads(r['purchase_links']) if r['purchase_links'] else []
                        except: pass
<<<<<<< HEAD
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
=======
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

    # --- مدیریت هوشمند لاگ‌های خرید و فروش (Undo/Edit) ---
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
    @app.route('/api/log/delete/<int:log_id>', methods=['DELETE'])
    def delete_log_entry(log_id: int) -> Response:
        """حذف یک لاگ و واگردانی اثر آن بر موجودی انبار"""
        try:
<<<<<<< HEAD
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
=======
            with get_db_connection() as conn:
                log = conn.execute("SELECT * FROM purchase_log WHERE log_id = ?", (log_id,)).fetchone()
                if not log: return error_response("لاگ یافت نشد", 404)
                
                # معکوس کردن تغییرات موجودی در جدول قطعات
                conn.execute("UPDATE parts SET quantity = quantity - ? WHERE id = ?", (log['quantity_added'], log['part_id']))
                conn.execute("DELETE FROM purchase_log WHERE log_id = ?", (log_id,))
                conn.commit()
            return success_response()
        except Exception as e: return error_response(e)
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13

    # ------------------------------------------------------------------------------
    # ویرایش لاگ: تغییر اطلاعات یک تراکنش و اصلاح مابه‌تفاوت روی انبار
    # ------------------------------------------------------------------------------
    # ------------------------------------------------------------------------------
    # ویرایش لاگ: اصلاح شده برای ثبت "دلیل ویرایش" در ستون جداگانه
    # ------------------------------------------------------------------------------
    @app.route('/api/log/update', methods=['POST'])
    def update_log_entry() -> Response:
        """ویرایش یک لاگ (تغییر تعداد یا دلیل) و به‌روزرسانی موجودی انبار بر اساس تفاضل"""
        try:
<<<<<<< HEAD
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
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM projects WHERE id=%s", (id,))
            project = cursor.fetchone()
            if not project: return jsonify({"error": "پروژه یافت نشد"}), 404
            
            # تبدیل تاریخ‌های پروژه به رشته
            if project.get('last_modified'): project['last_modified'] = str(project['last_modified'])
            if project.get('created_at'): project['created_at'] = str(project['created_at'])

            # اصلاحیه در routes.py -> تابع get_project_details
            bom_query = """
                SELECT 
                    pb.id as bom_id, pb.quantity as required_qty, pb.sort_order,
                    p.id as part_id, p.val, p.part_code, p.package, p.toman_price, p.usd_rate, 
                    p.storage_location, p.quantity as inventory_qty, p.type, p.watt, p.tolerance, p.tech
                FROM project_bom pb
                JOIN parts p ON pb.part_id = p.id
                WHERE pb.project_id = %s
                ORDER BY pb.sort_order ASC
            """
            cursor.execute(bom_query, (id,))
            bom_list = cursor.fetchall()
            
            # تبدیل مقادیر در لیست قطعات (حتی اگر لیست خالی باشد این کد خطا نمی‌دهد)
            for item in bom_list:
                for key in item:
                    if type(item[key]).__name__ == 'Decimal':
                        item[key] = float(item[key])
                    elif hasattr(item[key], 'isoformat'):
                        item[key] = str(item[key])

            cursor.execute("SELECT * FROM project_costs WHERE project_id=%s", (id,))
            costs_list = cursor.fetchall()
            
            # اصلاحیه مهم: تبدیل مقادیر در لیست هزینه‌ها
            for item in costs_list:
                for key, val in item.items():
                    if type(val).__name__ == 'Decimal': item[key] = float(val)

            return jsonify({"project": project, "bom": bom_list, "costs": costs_list})
        finally:
            cursor.close(); conn.close()

    # 5. ذخیره تغییرات BOM و هزینه‌ها (اصلاح شده برای ذخیره قیمت دلار و ضرایب)
    @app.route('/api/projects/save_details', methods=['POST'])
    def save_project_details():
        try:
            d = request.json
            p_id = d.get('project_id')
            bom_items = d.get('bom', [])
            cost_items = d.get('costs', [])
            
            # دریافت مقادیر جدید برای آپدیت پروژه
            conv_rate = d.get('conversion_rate', 0)
            p_profit = d.get('part_profit', 0)
            total_usd = d.get('total_price_usd', 0)
            total_count = d.get('total_count', 0)

            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                # بروزرسانی BOM
                cursor.execute("DELETE FROM project_bom WHERE project_id=%s", (p_id,))
                if bom_items:
                    bom_values = []
                    for idx, item in enumerate(bom_items):
                        bom_values.append((p_id, item['part_id'], item['required_qty'], idx))
                    cursor.executemany("INSERT INTO project_bom (project_id, part_id, quantity, sort_order) VALUES (%s, %s, %s, %s)", bom_values)

                # بروزرسانی هزینه‌ها
                cursor.execute("DELETE FROM project_costs WHERE project_id=%s", (p_id,))
                if cost_items:
                    cost_values = [(p_id, c['description'], float(c['cost'])) for c in cost_items if c.get('description')]
                    if cost_values:
                        cursor.executemany("INSERT INTO project_costs (project_id, description, cost) VALUES (%s, %s, %s)", cost_values)

                # [مهم] آپدیت اطلاعات مالی پروژه در جدول اصلی
                update_sql = """
                    UPDATE projects 
                    SET last_modified=NOW(), 
                        conversion_rate=%s, 
                        part_profit=%s, 
                        total_price_usd=%s, 
                        total_parts_count=%s 
                    WHERE id=%s
                """
                cursor.execute(update_sql, (conv_rate, p_profit, total_usd, total_count, p_id))
                
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close(); conn.close()
        except Exception as e: return jsonify({"error": str(e)}), 500

    # 6. کسر از انبار (لاجیک هوشمند کسری و برداشت اجباری)
    @app.route('/api/projects/deduct', methods=['POST'])
    def deduct_project_bom():
        try:
            d = request.json
            p_id = d.get('project_id')
            count = int(d.get('count', 1))
            force = d.get('force', False)
            user = d.get('username', 'System')
            p_date = get_current_jalali_date()
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                # بررسی وجود پروژه
                cursor.execute("SELECT name FROM projects WHERE id=%s", (p_id,))
                p_row = cursor.fetchone()
                project_name = p_row.get('name', 'Unknown') if p_row else 'Unknown'

                cursor.execute("SELECT pb.quantity as bom_qty, p.* FROM project_bom pb JOIN parts p ON pb.part_id = p.id WHERE pb.project_id=%s", (p_id,))
                items = cursor.fetchall()
                shortages = []
                for it in items:
                    req = it['bom_qty'] * count
                    if it['quantity'] < req:
                        shortages.append({"val": it['val'], "part_code": it['part_code'], "required": req, "in_stock": it['quantity'], "missing": req - it['quantity'], "location": it['storage_location']})
                
                if shortages and not force: return jsonify({"success": False, "status": "shortage", "shortages": shortages})
                
                for it in items:
                    req = it['bom_qty'] * count
                    deduct = it['quantity'] if (force and it['quantity'] < req) else req
                    if deduct > 0:
                        cursor.execute("UPDATE parts SET quantity = quantity - %s WHERE id = %s", (deduct, it['id']))
                        # تبدیل قیمت به float برای ثبت در لاگ
                        price = float(it['toman_price']) if it['toman_price'] else 0
                        log_sql = """INSERT INTO purchase_log (part_id, val, quantity_added, unit_price, operation_type, username, reason, timestamp) VALUES (%s, %s, %s, %s, 'EXIT (Project)', %s, %s, NOW())"""
                        cursor.execute(log_sql, (it['id'], it['val'], -deduct, price, user, f"پروژه: {project_name}"))
                conn.commit()
                return jsonify({"success": True})
            finally:
                cursor.close(); conn.close()
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
=======
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
>>>>>>> 6082b098671e7ba81b4cc0aab3cbbb088c775c13
