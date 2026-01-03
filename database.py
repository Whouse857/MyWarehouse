# ==============================================================================
# نسخه: 0.23 (مهاجرت کامل به MySQL - به همراه ماژول پروژه‌ها)
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
                file_config = json.load(f)
                config_data.update(file_config)
        except Exception as e:
            print(f"Error reading server config: {e}")

    # 3. حذف پارامترهایی که مربوط به اتصال نیستند (مثل مسیر فایل mysqldump)
    # تا تابع mysql.connector.connect خطا ندهد
    valid_keys = {'host', 'user', 'password', 'database', 'port', 'charset', 'collation'}
    connection_params = {k: v for k, v in config_data.items() if k in valid_keys}

    # 4. برقراری اتصال
    return mysql.connector.connect(**connection_params)

# ------------------------------------------------------------------------------
# [تگ: مدیریت ستون‌های جدید]
# این تابع کمکی برای جلوگیری از خطا هنگام آپدیت دیتابیس استفاده می‌شود.
# اگر ستونی وجود نداشته باشد، آن را اضافه می‌کند.
# ------------------------------------------------------------------------------
def add_column_safe(conn, table_name, column_name, column_type):
    """اضافه کردن ستون به جدول در صورت عدم وجود (Migration Helper)"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table_name}' AND COLUMN_NAME = '{column_name}'")
        if cursor.fetchone()[0] == 0:
            print(f"Adding missing column '{column_name}' to table '{table_name}'...")
            cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            conn.commit()
    except Exception as e:
        print(f"Migration Warning ({table_name}.{column_name}): {e}")
    finally:
        cursor.close()

# ------------------------------------------------------------------------------
# [تگ: مقداردهی اولیه دیتابیس]
# تابع اصلی که هنگام اجرای برنامه فراخوانی می‌شود تا از وجود جداول اطمینان حاصل کند.
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
            invoice_number TEXT, part_code VARCHAR(100), edit_reason TEXT,
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

        # ----------------------------------------------------------------------
        # [تگ: جداول ماژول مدیریت پروژه‌ها و BOM]
        # این بخش اضافه شده تا قابلیت‌های تعریف پروژه و لیست قطعات فعال شود.
        # از IF NOT EXISTS استفاده شده تا در اجراهای بعدی خطایی رخ ندهد.
        # ----------------------------------------------------------------------
        
        # ۷. ایجاد جدول اصلی پروژه‌ها
        cursor.execute('''CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_modified DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            conversion_rate DOUBLE DEFAULT 0,
            part_profit DOUBLE DEFAULT 0,
            total_price_usd DOUBLE DEFAULT 0,
            total_parts_count INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۸. ایجاد جدول لیست قطعات پروژه (BOM)
        # کلید خارجی دارد تا با حذف پروژه، لیست قطعات آن نیز حذف شود (CASCADE)
        cursor.execute('''CREATE TABLE IF NOT EXISTS project_bom (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            part_id INT,
            quantity INT DEFAULT 1,
            sort_order INT DEFAULT 0,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')

        # ۹. ایجاد جدول هزینه‌های جانبی پروژه
        cursor.execute('''CREATE TABLE IF NOT EXISTS project_costs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            description VARCHAR(255),
            cost DOUBLE DEFAULT 0,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;''')
        
        # ----------------------------------------------------------------------

        # --- بخش مهاجرت داده‌ها (مدیریت تغییرات در نسخه‌های جدید) ---
        extra_fields = ['list5', 'list6', 'list7', 'list8', 'list9', 'list10']
        for field in extra_fields:
            add_column_safe(conn, "parts", field, "TEXT")
            add_column_safe(conn, "purchase_log", field, "TEXT")
        
        # اضافه کردن ستون edit_reason به لاگ اگر وجود ندارد
        add_column_safe(conn, "purchase_log", "edit_reason", "TEXT")

        # بررسی و ایجاد کاربر ادمین پیش‌فرض (در صورت عدم وجود)
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        if not cursor.fetchone():
            # دسترسی‌های کامل برای ادمین (پروژه‌ها نیز اضافه شد)
            admin_perms = json.dumps({
                "entry": True, "withdraw": True, "inventory": True, "users": True, 
                "management": True, "backup": True, "contacts": True, "log": True, 
                "projects": True
            })
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
        print("Database initialized successfully.")
    except Exception as e:
        print(f"[INIT DB ERROR] {e}")
    finally:
        if conn:
            conn.close()