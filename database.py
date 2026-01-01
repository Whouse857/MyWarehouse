# ==============================================================================
# نسخه: 0.22 (مهاجرت کامل به MySQL - اصلاح شده)
# فایل: database.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول مسئولیت مدیریت کامل پایگاه داده MySQL سیستم را بر عهده دارد.
# وظایف اصلی آن شامل ایجاد اتصال امن (Connection)، تعریف جداول (Schema)،
# مدیریت مهاجرت داده‌ها (Migration) و مقداردهی اولیه تنظیمات و کاربر ادمین است.
# ==============================================================================

import mysql.connector
import json 
import os
from config import DB_CONFIG, DEFAULT_COMPONENT_CONFIG, BASE_DIR
from auth_utils import hash_password

# مسیر فایل تنظیمات سرور برای زمانی که دیتابیس توسط ادمین در پنل تغییر یافته است
SERVER_CONFIG_FILE = os.path.join(BASE_DIR, 'server_config.json')

# ------------------------------------------------------------------------------
# [تگ: ایجاد اتصال به دیتابیس]
# این تابع یک اتصال فعال به سرور MySQL برقرار می‌کند.
# ------------------------------------------------------------------------------
def get_db_connection():
    """ایجاد اتصال به دیتابیس MySQL با فیلتر کردن پارامترهای اضافی"""
    
    # 1. تنظیمات پیش‌فرض
    config_data = DB_CONFIG.copy()

    # 2. اگر فایل تنظیمات وجود دارد، آن را بخوان و روی پیش‌فرض‌ها بریز
    if os.path.exists(SERVER_CONFIG_FILE):
        try:
            with open(SERVER_CONFIG_FILE, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                config_data.update(saved)
        except: pass

    # 3. (مهم) فقط پارامترهای استاندارد اتصال را جدا کن
    # این دیکشنری فقط چیزهایی که MySQL لازم دارد را نگه می‌دارد
    clean_params = {
        'host': config_data.get('host', '127.0.0.1'),
        'user': config_data.get('user', 'root'),
        'password': config_data.get('password', ''),
        'database': config_data.get('database', 'HY'),
        'port': int(config_data.get('port', 3306))
    }

    # 4. حالا با خیال راحت وصل شو (بدون پارامترهای اضافی مثل mysqldump_path)
    return mysql.connector.connect(**clean_params)

# ------------------------------------------------------------------------------
# [تگ: افزودن ستون به صورت ایمن]
# بررسی می‌کند که آیا ستون مورد نظر در جدول وجود دارد یا خیر؛ 
# در صورت عدم وجود، آن را به ساختار جدول اضافه می‌کند.
# ------------------------------------------------------------------------------
def add_column_safe(conn, table_name, column_name, column_type):
    """افزودن ستون جدید به جدول در MySQL با بررسی عدم وجود قبلی"""
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(f"SHOW COLUMNS FROM `{table_name}` LIKE '{column_name}'")
        if not cursor.fetchone():
            cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{column_name}` {column_type}")
            print(f"[Migration] Added column {column_name} to {table_name}")
    except Exception as e:
        print(f"[Migration Error] {e}")
    finally:
        if cursor:
            cursor.close()

# ------------------------------------------------------------------------------
# [تگ: مقداردهی اولیه پایگاه داده]
# این تابع وظیفه ساخت جداول اصلی، ایندکس‌ها، ستون‌های داینامیک و
# ایجاد کاربر مدیر (admin) و تنظیمات پیش‌فرض را بر عهده دارد.
# ------------------------------------------------------------------------------
def init_db():
    """مقداردهی اولیه، ایجاد جداول و مدیریت مهاجرت داده‌ها"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # ۱. ایجاد جدول کاربران
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(50) DEFAULT 'operator',
            full_name VARCHAR(255),
            mobile VARCHAR(20),
            permissions TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۲. ایجاد جدول قطعات انبار (اطلاعات فنی و موجودی)
        cursor.execute('''CREATE TABLE IF NOT EXISTS parts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            val TEXT, watt TEXT, tolerance TEXT, package TEXT, type TEXT,
            buy_date TEXT, quantity INT DEFAULT 0, toman_price DOUBLE DEFAULT 0,
            reason TEXT, min_quantity INT DEFAULT 1, vendor_name TEXT,
            last_modified_by TEXT, storage_location TEXT, tech TEXT,
            usd_rate DOUBLE DEFAULT 0, purchase_links TEXT, invoice_number TEXT,
            entry_date TEXT, part_code VARCHAR(100),
            list5 TEXT, list6 TEXT, list7 TEXT, list8 TEXT, list9 TEXT, list10 TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۳. ایجاد جدول تاریخچه تراکنش‌ها (لاگ ورود و خروج)
        cursor.execute('''CREATE TABLE IF NOT EXISTS purchase_log (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            part_id INT, val TEXT, quantity_added INT, unit_price DOUBLE,
            vendor_name TEXT, purchase_date TEXT, reason TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, operation_type TEXT,
            username TEXT, watt TEXT, tolerance TEXT, package TEXT, type TEXT,
            storage_location TEXT, tech TEXT, usd_rate DOUBLE,
            invoice_number TEXT, part_code VARCHAR(100),
            list5 TEXT, list6 TEXT, list7 TEXT, list8 TEXT, list9 TEXT, list10 TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۴. ایجاد جدول مخاطبین (تامین‌کنندگان و مشتریان)
        cursor.execute('''CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL, phone VARCHAR(50), mobile VARCHAR(50),
            fax VARCHAR(50), website TEXT, email VARCHAR(255),
            address TEXT, notes TEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۵. ایجاد جدول تنظیمات سیستمی (ذخیره کانفیگ‌ها بصورت JSON)
        cursor.execute('''CREATE TABLE IF NOT EXISTS app_config (
            `key` VARCHAR(255) PRIMARY KEY,
            `value` LONGTEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۶. ایجاد جدول مدیریت نسخه‌های دیتابیس (Migration Tracking)
        cursor.execute('''CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(100) UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')
        
        # --- بخش مهاجرت داده‌ها (مدیریت تغییرات در نسخه‌های جدید) ---
        extra_fields = ['list5', 'list6', 'list7', 'list8', 'list9', 'list10']
        for field in extra_fields:
            add_column_safe(conn, "parts", field, "TEXT")
            add_column_safe(conn, "purchase_log", field, "TEXT")
        
        # بررسی و ایجاد کاربر ادمین پیش‌فرض (در صورت عدم وجود)
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        if not cursor.fetchone():
            admin_perms = json.dumps({"entry": True, "withdraw": True, "inventory": True, "users": True, "management": True, "backup": True, "contacts": True, "log": True})
            cursor.execute(
                "INSERT INTO users (username, password, role, full_name, permissions) VALUES (%s, %s, %s, %s, %s)", 
                ('admin', hash_password('admin'), 'admin', 'مدیر سیستم', admin_perms)
            )

        # درج تنظیمات قطعات پیش‌فرض (اگر قبلاً تنظیم نشده باشد)
        cursor.execute("SELECT `key` FROM app_config WHERE `key` = 'component_config'")
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO app_config (`key`, `value`) VALUES (%s, %s)", 
                ('component_config', json.dumps(DEFAULT_COMPONENT_CONFIG))
            )
        
        # ایجاد ایندکس یکتا برای کدهای انبار جهت جلوگیری از تکرار و افزایش سرعت جستجو
        try:
            cursor.execute("CREATE UNIQUE INDEX idx_parts_part_code_unique ON parts (part_code)")
        except:
            pass

        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"[INIT DB ERROR] {e}")
    finally:
        if conn:
            conn.close()