# --- [فایل مدیریت دیتابیس SQLite] ---
import sqlite3
import json
from config import DATABASE_FILE, DEFAULT_COMPONENT_CONFIG
from auth_utils import hash_password

def get_db_connection() -> sqlite3.Connection:
    """ایجاد اتصال به دیتابیس با تنظیمات بهینه"""
    try:
        conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA journal_mode=WAL;')
        conn.execute('PRAGMA synchronous=NORMAL;')
        return conn
    except sqlite3.Error as e:
        print(f"[DB ERROR] {e}")
        raise e

def add_column_safe(conn: sqlite3.Connection, table: str, column: str, type_def: str):
    """افزودن ستون به جدول در صورت عدم وجود (برای آپدیت‌های دیتابیس)"""
    try:
        cursor = conn.execute(f"PRAGMA table_info({table})")
        columns = [row['name'] for row in cursor.fetchall()]
        if column not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
    except Exception as e:
        print(f"[DB MIGRATION ERROR] {e}")

def init_db():
    """مقداردهی اولیه جداول و تنظیمات دیتابیس"""
    try:
        with get_db_connection() as conn:
            # --- ۱. انتقال هوشمند اطلاعات قبل از هر کاری ---
            tables = [r['name'] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            if 'resistors' in tables and 'parts' not in tables:
                conn.execute("ALTER TABLE resistors RENAME TO parts")
            
            if 'purchase_log' in tables:
                cols = [c['name'] for c in conn.execute("PRAGMA table_info(purchase_log)").fetchall()]
                if 'resistor_id' in cols and 'part_id' not in cols:
                    conn.execute("ALTER TABLE purchase_log RENAME COLUMN resistor_id TO part_id")
            # ---------------------------------------------

            # ۲. ایجاد جدول با نام جدید (اگر وجود نداشته باشد)
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

            # ۳. ایجاد بقیه جداول
            conn.execute("CREATE TABLE IF NOT EXISTS purchase_log (log_id INTEGER PRIMARY KEY AUTOINCREMENT, part_id INTEGER NOT NULL, val TEXT NOT NULL, quantity_added INTEGER NOT NULL, unit_price REAL, vendor_name TEXT, purchase_date TEXT, reason TEXT, operation_type TEXT, username TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, watt TEXT, tolerance TEXT, package TEXT, type TEXT, storage_location TEXT, tech TEXT, usd_rate REAL);")
            conn.execute("CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, phone TEXT, mobile TEXT, fax TEXT, website TEXT, email TEXT, address TEXT, notes TEXT);")
            conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'operator', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, full_name TEXT, mobile TEXT, permissions TEXT);")
            conn.execute("CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT);")
            
            # ایندکس‌ها با نام جدید
            conn.execute("CREATE INDEX IF NOT EXISTS idx_parts_lookup ON parts (val, package, type, watt, storage_location);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_log_timestamp ON purchase_log (timestamp);")

            # افزودن ستون‌های Migration برای اطمینان
            add_column_safe(conn, "parts", "invoice_number", "TEXT")
            add_column_safe(conn, "parts", "entry_date", "TEXT")
            add_column_safe(conn, "purchase_log", "invoice_number", "TEXT")

            if not conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
                admin_perms = json.dumps({"entry": True, "withdraw": True, "inventory": True, "users": True, "management": True, "backup": True, "contacts": True, "log": True})
                conn.execute("INSERT INTO users (username, password, role, full_name, permissions) VALUES (?, ?, ?, ?, ?)", ('admin', hash_password('admin'), 'admin', 'مدیر سیستم', admin_perms))

            if not conn.execute("SELECT key FROM app_config WHERE key = 'component_config'").fetchone():
                conn.execute("INSERT INTO app_config (key, value) VALUES (?, ?)", ('component_config', json.dumps(DEFAULT_COMPONENT_CONFIG)))
            
            conn.commit()
            print("[INFO] Database Migration and Init successful.")
    except Exception as e:
        print(f"[INIT ERROR] {e}")