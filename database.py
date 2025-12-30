# =========================================================================
# نام فایل: database.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این ماژول وظیفه مدیریت ارتباط با پایگاه داده SQLite، ایجاد جداول،
# و اعمال تغییرات ساختاری (Migration) در دیتابیس را بر عهده دارد.
# * توابع و بخش‌های کلیدی:
# 1. get_db_connection: ایجاد اتصال امن و بهینه به فایل دیتابیس (با فعال‌سازی WAL).
# 2. add_column_safe: تابع کمکی برای افزودن ستون‌های جدید به جداول قدیمی بدون از دست رفتن اطلاعات.
# 3. init_db: تابع اصلی راه‌اندازی که جداول را می‌سازد، کاربر ادمین پیش‌فرض را ایجاد می‌کند و مایگریشن‌ها را اعمال می‌نماید.
# =========================================================================

import sqlite3
import json
from config import DATABASE_FILE, DEFAULT_COMPONENT_CONFIG
from auth_utils import hash_password

# =========================================================================
# نام تابع: get_db_connection
# کارایی: ایجاد اتصال به دیتابیس با تنظیمات بهینه (WAL Mode) برای عملکرد بهتر
# =========================================================================
def get_db_connection() -> sqlite3.Connection:
    """ایجاد اتصال به دیتابیس با تنظیمات بهینه"""
    try:
        conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        # فعال‌سازی Write-Ahead Logging برای همزمانی بهتر خواندن و نوشتن
        conn.execute('PRAGMA journal_mode=WAL;')
        conn.execute('PRAGMA synchronous=NORMAL;')
        return conn
    except sqlite3.Error as e:
        print(f"[DB ERROR] {e}")
        raise e

# =========================================================================
# نام تابع: add_column_safe
# کارایی: بررسی وجود یک ستون در جدول و افزودن آن در صورت عدم وجود (Migration)
# =========================================================================
def add_column_safe(conn: sqlite3.Connection, table: str, column: str, type_def: str):
    """افزودن ستون به جدول در صورت عدم وجود (برای آپدیت‌های دیتابیس)"""
    try:
        cursor = conn.execute(f"PRAGMA table_info({table})")
        columns = [row['name'] for row in cursor.fetchall()]
        if column not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
    except Exception as e:
        print(f"[DB MIGRATION ERROR] {e}")

# =========================================================================
# نام تابع: init_db
# کارایی: مقداردهی اولیه دیتابیس، ساخت جداول، انتقال نام‌ها و ایجاد داده‌های پیش‌فرض
# =========================================================================
def init_db():
    """مقداردهی اولیه جداول و تنظیمات دیتابیس"""
    try:
        with get_db_connection() as conn:
            # --- ۱. انتقال هوشمند اطلاعات قبل از هر کاری (مایگریشن نام‌ها) ---
            tables = [r['name'] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            
            # تغییر نام جدول قدیمی resistors به parts
            if 'resistors' in tables and 'parts' not in tables:
                conn.execute("ALTER TABLE resistors RENAME TO parts")
            
            # اصلاح نام ستون در جدول لاگ
            if 'purchase_log' in tables:
                cols = [c['name'] for c in conn.execute("PRAGMA table_info(purchase_log)").fetchall()]
                if 'resistor_id' in cols and 'part_id' not in cols:
                    conn.execute("ALTER TABLE purchase_log RENAME COLUMN resistor_id TO part_id")
            # ---------------------------------------------

            # ۲. ایجاد جدول اصلی قطعات (اگر وجود نداشته باشد)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS parts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    val TEXT NOT NULL,
                    watt TEXT, tolerance TEXT, package TEXT, type TEXT,
                    buy_date TEXT, quantity INTEGER, toman_price REAL,
                    reason TEXT, image_path TEXT, min_quantity INTEGER DEFAULT 1,
                    vendor_name TEXT, last_modified_by TEXT, storage_location TEXT, tech TEXT, usd_rate REAL DEFAULT 0.0,
                    purchase_links TEXT
                );
            """)

            # ۳. ایجاد بقیه جداول سیستم (لاگ، مخاطبین، کاربران، تنظیمات)
            conn.execute("CREATE TABLE IF NOT EXISTS purchase_log (log_id INTEGER PRIMARY KEY AUTOINCREMENT, part_id INTEGER NOT NULL, val TEXT NOT NULL, quantity_added INTEGER NOT NULL, unit_price REAL, vendor_name TEXT, purchase_date TEXT, reason TEXT, operation_type TEXT, username TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, watt TEXT, tolerance TEXT, package TEXT, type TEXT, storage_location TEXT, tech TEXT, usd_rate REAL);")
            conn.execute("CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, phone TEXT, mobile TEXT, fax TEXT, website TEXT, email TEXT, address TEXT, notes TEXT);")
            conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'operator', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, full_name TEXT, mobile TEXT, permissions TEXT);")
            conn.execute("CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT);")
            
            # ایجاد ایندکس‌ها برای افزایش سرعت جستجو
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parts_lookup ON parts (val, package, type, watt, storage_location);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_log_timestamp ON purchase_log (timestamp);")

            # افزودن ستون‌های جدید (کد قطعه) برای اطمینان از وجود آن‌ها در نسخه‌های قدیمی
            add_column_safe(conn, "parts", "part_code", "TEXT")
            add_column_safe(conn, "purchase_log", "part_code", "TEXT")

            # --- شروع تغییرات: افزودن ستون‌های فیلدهای اضافی (List 5-10) ---
            extra_fields = ['list5', 'list6', 'list7', 'list8', 'list9', 'list10']
            for field in extra_fields:
                add_column_safe(conn, "parts", field, "TEXT")
                add_column_safe(conn, "purchase_log", field, "TEXT")
            
            # ایجاد کاربر ادمین پیش‌فرض اگر وجود نداشته باشد
            if not conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
                admin_perms = json.dumps({"entry": True, "withdraw": True, "inventory": True, "users": True, "management": True, "backup": True, "contacts": True, "log": True})
                conn.execute("INSERT INTO users (username, password, role, full_name, permissions) VALUES (?, ?, ?, ?, ?)", ('admin', hash_password('admin'), 'admin', 'مدیر سیستم', admin_perms))

            # ایجاد تنظیمات پیش‌فرض اگر وجود نداشته باشد
            if not conn.execute("SELECT key FROM app_config WHERE key = 'component_config'").fetchone():
                conn.execute("INSERT INTO app_config (key, value) VALUES (?, ?)", ('component_config', json.dumps(DEFAULT_COMPONENT_CONFIG)))
            
            # جلوگیری فیزیکی از ثبت کدهای تکراری در سطح دیتابیس (فقط برای کدهای پر شده)
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_parts_part_code_unique ON parts (part_code) WHERE part_code IS NOT NULL AND part_code != '';")

            conn.commit()
            print("[INFO] Database Migration and Init successful.")
    except Exception as e:
        print(f"[INIT ERROR] {e}")