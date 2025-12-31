# ==============================================================================
# نسخه: 0.20
# فایل: database.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول مسئولیت مدیریت کامل پایگاه داده SQLite سیستم را بر عهده دارد.
# وظایف اصلی آن شامل ایجاد اتصال امن (Connection)، تعریف جداول (Schema)،
# مدیریت مهاجرت داده‌ها (Migration) و مقداردهی اولیه تنظیمات و کاربر ادمین است.
# ==============================================================================

import sqlite3
import json
from config import DATABASE_FILE, DEFAULT_COMPONENT_CONFIG
from auth_utils import hash_password

# ------------------------------------------------------------------------------
# [تگ: ایجاد اتصال به دیتابیس]
# این تابع یک اتصال فعال به فایل دیتابیس برقرار کرده و تنظیمات بهینه‌سازی
# مانند حالت WAL و Synchronous را جهت پایداری و سرعت بیشتر اعمال می‌کند.
# ------------------------------------------------------------------------------
def get_db_connection() -> sqlite3.Connection:
    """ایجاد اتصال به دیتابیس با تنظیمات بهینه"""
    try:
        conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # فعال‌سازی حالت Write-Ahead Logging برای مدیریت بهتر دسترسی‌های همزمان
        conn.execute('PRAGMA journal_mode=WAL;')
        # تنظیم همگام‌سازی روی حالت نرمال برای تعادل بین امنیت داده و سرعت
        conn.execute('PRAGMA synchronous=NORMAL;')
        return conn
    except sqlite3.Error as e:
        print(f"[DB ERROR] {e}")
        raise e

# ------------------------------------------------------------------------------
# [تگ: افزودن ستون به صورت ایمن]
# بررسی می‌کند که آیا ستون مورد نظر در جدول وجود دارد یا خیر؛ 
# در صورت عدم وجود، آن را به ساختار جدول اضافه می‌کند.
# ------------------------------------------------------------------------------
def add_column_safe(conn, table_name, column_name, column_type):
    """افزودن ستون جدید به جدول با بررسی عدم وجود قبلی جهت جلوگیری از خطا"""
    try:
        cursor = conn.execute(f"PRAGMA table_info({table_name})")
        columns = [row[1] for row in cursor.fetchall()]
        if column_name not in columns:
            conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
            print(f"[Migration] Added column {column_name} to {table_name}")
    except Exception as e:
        print(f"[Migration Error] {e}")

# ------------------------------------------------------------------------------
# [تگ: مقداردهی اولیه پایگاه داده]
# این تابع وظیفه ساخت جداول اصلی، ایندکس‌ها، ستون‌های داینامیک و
# ایجاد کاربر مدیر (admin) و تنظیمات پیش‌فرض را بر عهده دارد.
# ------------------------------------------------------------------------------
def init_db():
    """مقداردهی اولیه، ایجاد جداول و مدیریت مهاجرت داده‌ها"""
    with get_db_connection() as conn:
        # ۱. ایجاد جدول کاربران (احراز هویت و سطوح دسترسی)
        conn.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'operator',
            full_name TEXT,
            mobile TEXT,
            permissions TEXT
        )''')

        # ۲. ایجاد جدول قطعات انبار (اطلاعات فنی و موجودی)
        conn.execute('''CREATE TABLE IF NOT EXISTS parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            val TEXT,
            watt TEXT,
            tolerance TEXT,
            package TEXT,
            type TEXT,
            buy_date TEXT,
            quantity INTEGER DEFAULT 0,
            toman_price REAL DEFAULT 0,
            reason TEXT,
            min_quantity INTEGER DEFAULT 1,
            vendor_name TEXT,
            last_modified_by TEXT,
            storage_location TEXT,
            tech TEXT,
            usd_rate REAL DEFAULT 0,
            purchase_links TEXT DEFAULT '[]',
            invoice_number TEXT,
            entry_date TEXT,
            part_code TEXT
        )''')

        # ۳. ایجاد جدول تاریخچه تراکنش‌ها (لاگ ورود و خروج)
        conn.execute('''CREATE TABLE IF NOT EXISTS purchase_log (
            log_id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_id INTEGER,
            val TEXT,
            quantity_added INTEGER,
            unit_price REAL,
            vendor_name TEXT,
            purchase_date TEXT,
            reason TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            operation_type TEXT,
            username TEXT,
            watt TEXT,
            tolerance TEXT,
            package TEXT,
            type TEXT,
            storage_location TEXT,
            tech TEXT,
            usd_rate REAL,
            invoice_number TEXT,
            part_code TEXT
        )''')

        # ۴. ایجاد جدول مخاطبین (تامین‌کنندگان و مشتریان)
        conn.execute('''CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            mobile TEXT,
            fax TEXT,
            website TEXT,
            email TEXT,
            address TEXT,
            notes TEXT
        )''')

        # ۵. ایجاد جدول تنظیمات سیستمی (ذخیره کانفیگ‌ها بصورت JSON)
        conn.execute('''CREATE TABLE IF NOT EXISTS app_config (
            key TEXT PRIMARY KEY,
            value TEXT
        )''')

        # ۶. ایجاد جدول مدیریت نسخه‌های دیتابیس (Migration Tracking)
        conn.execute('''CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')

        # --- بخش مهاجرت داده‌ها (مدیریت تغییرات در نسخه‌های جدید) ---
        
        # افزودن فیلدهای داینامیک (list5 تا list10) به جداول قطعات و لاگ
        extra_fields = ['list5', 'list6', 'list7', 'list8', 'list9', 'list10']
        for field in extra_fields:
            add_column_safe(conn, "parts", field, "TEXT")
            add_column_safe(conn, "purchase_log", field, "TEXT")
        
        # بررسی و ایجاد کاربر ادمین پیش‌فرض (در صورت عدم وجود)
        if not conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
            admin_perms = json.dumps({
                "entry": True, "withdraw": True, "inventory": True, 
                "users": True, "management": True, "backup": True, 
                "contacts": True, "log": True
            })
            conn.execute(
                "INSERT INTO users (username, password, role, full_name, permissions) VALUES (?, ?, ?, ?, ?)", 
                ('admin', hash_password('admin'), 'admin', 'مدیر سیستم', admin_perms)
            )

        # درج تنظیمات قطعات پیش‌فرض (اگر قبلاً تنظیم نشده باشد)
        if not conn.execute("SELECT key FROM app_config WHERE key = 'component_config'").fetchone():
            conn.execute(
                "INSERT INTO app_config (key, value) VALUES (?, ?)", 
                ('component_config', json.dumps(DEFAULT_COMPONENT_CONFIG))
            )
        
        # ایجاد ایندکس یکتا برای کدهای انبار جهت جلوگیری از تکرار و افزایش سرعت جستجو
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_part_code_unique ON parts (part_code) WHERE part_code IS NOT NULL AND part_code != '';")

        conn.commit()