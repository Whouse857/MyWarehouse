# --- [TAG: IMPORTS] ---
import logging
import os
import sqlite3
import threading
import time
import webbrowser
import hashlib
import json
import sys
import shutil
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS

# --- [TAG: SAFE_IMPORTS] ---
try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False
    print("--- WARNING: 'requests' or 'beautifulsoup4' not installed. Live USD price disabled. ---")

# --- [TAG: CONFIG_CONSTANTS] ---
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

API_PORT: int = 8090
DATABASE_FILE: str = os.path.join(BASE_DIR, 'nexus_warehouse.db')
UPLOAD_FOLDER: str = os.path.join(BASE_DIR, 'uploads')
BACKUP_FOLDER: str = os.path.join(BASE_DIR, 'backups')
INDEX_FILE: str = os.path.join(BASE_DIR, 'index.html')

SERVER_URL: str = f'http://127.0.0.1:{API_PORT}'
HEARTBEAT_TIMEOUT: int = 70

GLOBAL_INDEX_CACHE: Optional[bytes] = None

# --- [TAG: USD_CACHE] ---
USD_CACHE = {
    "price": 0,
    "date_str": "",
    "status": "init"
}

# --- [TAG: APP_INIT] ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

for folder in [UPLOAD_FOLDER, BACKUP_FOLDER]:
    os.makedirs(folder, exist_ok=True)

server_state: Dict[str, Any] = {
    "last_heartbeat": time.time(),
    "shutdown_trigger": False
}

DEFAULT_COMPONENT_CONFIG: Dict[str, Dict] = {
    "General": {
        "label": "تنظیمات عمومی (General)",
        "icon": "settings",
        "locations": ["کشوی A1", "کشوی A2", "کشوی A3", "قفسه B1", "قفسه B2", "جعبه ابزار"],
        "units": [], "packages": [], "techs": [], "paramOptions": []
    },
    "Resistor": {
        "label": "مقاومت (Resistor)", "icon": "zap", "units": ["R", "k", "M"],
        "paramLabel": "توان (Watt)",
        "paramOptions": ["1/10W", "1/8W", "1/4W", "1/2W", "1W", "2W", "3W", "5W", "10W", "20W"],
        "packages": ["0201", "0402", "0603", "0805", "1206", "1210", "2010", "2512", "Axial", "DIP", "Power"],
        "techs": ["General Purpose", "Precision", "Thin Film", "Thick Film", "Wirewound", "Metal Oxide", "Carbon Film"]
    },
    "Capacitor": {
        "label": "خازن (Capacitor)", "icon": "battery", "units": ["pF", "nF", "uF", "mF", "F"],
        "paramLabel": "ولتاژ (Voltage)",
        "paramOptions": ["4V", "6.3V", "10V", "16V", "25V", "35V", "50V", "63V", "100V", "200V", "250V", "400V", "450V", "630V", "1kV"],
        "packages": ["0402", "0603", "0805", "1206", "1210", "Radial", "SMD Can (V-Chip)", "Snap-in", "Axial"],
        "techs": ["Ceramic (MLCC) X7R", "Ceramic (MLCC) C0G/NP0", "Ceramic (MLCC) X5R", "Electrolytic", "Tantalum", "Polymer", "Film"]
    },
    "Inductor": {
        "label": "سلف (Inductor)", "icon": "waves", "units": ["nH", "uH", "mH", "H"],
        "paramLabel": "جریان (Current)",
        "paramOptions": ["100mA", "250mA", "500mA", "1A", "2A", "3A", "5A", "10A"],
        "packages": ["0402", "0603", "0805", "1206", "CDRH", "Power SMD", "Toroidal", "Axial"],
        "techs": ["Ferrite Bead", "Multilayer", "Wirewound", "Power Inductor", "Air Core", "Shielded"]
    },
    "Diode": {
        "label": "دیود (Diode)", "icon": "arrow-right-circle", "units": ["-"],
        "paramLabel": "ولتاژ/جریان",
        "paramOptions": ["Low Power", "High Speed", "Schottky", "Zener"],
        "packages": ["SOD-123", "SOD-323", "SMA", "SMB", "SMC", "DO-35", "DO-41", "TO-220"],
        "techs": ["Rectifier", "Zener", "Schottky", "Switching", "TVS", "Bridge", "LED"]
    },
    "Transistor": {
        "label": "ترانزیستور (Transistor)", "icon": "cpu", "units": ["-"],
        "paramLabel": "Rating",
        "paramOptions": ["Small Signal", "Power"],
        "packages": ["SOT-23", "SOT-223", "TO-92", "TO-220", "DPAK", "D2PAK"],
        "techs": ["BJT (NPN)", "BJT (PNP)", "MOSFET (N-Ch)", "MOSFET (P-Ch)", "IGBT", "JFET"]
    },
    "IC": {
        "label": "آی‌سی (IC)", "icon": "box-select", "units": ["-"],
        "paramLabel": "نوع پکیج",
        "paramOptions": ["DIP", "SMD"],
        "packages": ["SOIC-8", "SOIC-16", "TSSOP", "QFP", "QFN", "BGA", "DIP-8", "DIP-16"],
        "techs": ["Microcontroller", "Op-Amp", "Regulator", "Memory", "Logic", "Driver", "Sensor"]
    },
     "Connector": {
        "label": "کانکتور (Connector)", "icon": "plug", "units": ["Pin"],
        "paramLabel": "Pitch",
        "paramOptions": ["1.27mm", "2.0mm", "2.54mm", "3.81mm", "5.08mm"],
        "packages": ["Through Hole", "SMD", "Right Angle"],
        "techs": ["Header", "Terminal Block", "USB", "Jack", "Socket"]
    }
}

# --- [TAG: DB_HELPERS] ---
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection() -> sqlite3.Connection:
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
    try:
        cursor = conn.execute(f"PRAGMA table_info({table})")
        columns = [row['name'] for row in cursor.fetchall()]
        if column not in columns:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
    except Exception as e:
        print(f"[DB MIGRATION ERROR] {e}")

# --- [TAG: DB_INIT] ---
def init_db():
    try:
        with get_db_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS resistors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    val TEXT NOT NULL,
                    watt TEXT, tolerance TEXT, package TEXT, type TEXT,
                    buy_date TEXT, quantity INTEGER, toman_price REAL,
                    reason TEXT, image_path TEXT, min_quantity INTEGER DEFAULT 1,
                    vendor_name TEXT, last_modified_by TEXT, storage_location TEXT, tech TEXT, usd_rate REAL DEFAULT 0.0,
                    purchase_links TEXT
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS purchase_log (
                    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    resistor_id INTEGER NOT NULL,
                    val TEXT NOT NULL,
                    quantity_added INTEGER NOT NULL,
                    unit_price REAL,
                    vendor_name TEXT,
                    purchase_date TEXT,
                    reason TEXT,
                    operation_type TEXT, 
                    username TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    watt TEXT, tolerance TEXT, package TEXT, type TEXT,
                    storage_location TEXT, tech TEXT, usd_rate REAL
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    phone TEXT, mobile TEXT, fax TEXT, website TEXT, email TEXT, address TEXT, notes TEXT
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'operator',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    full_name TEXT,
                    mobile TEXT
                );
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS app_config (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            """)
            
            conn.execute("CREATE INDEX IF NOT EXISTS idx_resistors_lookup ON resistors (val, package, type, watt, storage_location);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_log_timestamp ON purchase_log (timestamp);")
            
            if not conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
                conn.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)", 
                             ('admin', hash_password('admin'), 'admin', 'مدیر سیستم'))

            add_column_safe(conn, "resistors", "last_modified_by", "TEXT")
            add_column_safe(conn, "resistors", "storage_location", "TEXT")
            add_column_safe(conn, "resistors", "tech", "TEXT")
            add_column_safe(conn, "resistors", "usd_rate", "REAL")
            add_column_safe(conn, "resistors", "purchase_links", "TEXT")
            add_column_safe(conn, "purchase_log", "username", "TEXT")
            add_column_safe(conn, "contacts", "address", "TEXT")
            add_column_safe(conn, "users", "full_name", "TEXT")
            add_column_safe(conn, "users", "mobile", "TEXT")

            add_column_safe(conn, "purchase_log", "watt", "TEXT")
            add_column_safe(conn, "purchase_log", "tolerance", "TEXT")
            add_column_safe(conn, "purchase_log", "package", "TEXT")
            add_column_safe(conn, "purchase_log", "type", "TEXT")
            add_column_safe(conn, "purchase_log", "storage_location", "TEXT")
            add_column_safe(conn, "purchase_log", "tech", "TEXT")
            add_column_safe(conn, "purchase_log", "usd_rate", "REAL")

            if not conn.execute("SELECT key FROM app_config WHERE key = 'component_config'").fetchone():
                conn.execute("INSERT INTO app_config (key, value) VALUES (?, ?)", 
                             ('component_config', json.dumps(DEFAULT_COMPONENT_CONFIG)))
            
            conn.execute("VACUUM;") 
            conn.commit()
            print("[INFO] Database initialized and optimized successfully.")
    except Exception as e:
        print(f"[INIT ERROR] {e}")

init_db()

# --- [TAG: WATCHDOG] ---
def watchdog_service():
    time.sleep(3)
    server_state["last_heartbeat"] = time.time()
    while True:
        current_time = time.time()
        if server_state["shutdown_trigger"]:
            time.sleep(3) 
            if server_state["shutdown_trigger"]:
                print("--- Graceful Shutdown ---")
                os._exit(0)
        if current_time - server_state["last_heartbeat"] > HEARTBEAT_TIMEOUT:
            print(f"--- Watchdog Timeout ({HEARTBEAT_TIMEOUT}s expired) ---")
            os._exit(0)
        time.sleep(2)

# --- [TAG: SCRAPING_HELPERS] ---
def fetch_daily_usd_price():
    global USD_CACHE
    if not SCRAPING_AVAILABLE:
        return 0

    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if USD_CACHE["date_str"] == today_str and USD_CACHE["price"] > 0:
        return USD_CACHE["price"]

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'}
        url = "https://www.tgju.org/profile/price_dollar_rl"
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            price_tag = soup.find("span", {"data-col": "info.last_price"})
            if not price_tag: price_tag = soup.select_one(".value > span")
            if price_tag:
                price = float(price_tag.text.strip().replace(',', ''))
                if price > 100000: price = price / 10
                USD_CACHE["price"] = price
                USD_CACHE["date_str"] = today_str
                USD_CACHE["status"] = "online"
                return price
    except Exception as e:
        print(f"[WARNING] USD Scraper Error: {e}")
    return USD_CACHE["price"]

# --- [TAG: ROUTE_INDEX] ---
@app.route('/')
def serve_index() -> Response:
    global GLOBAL_INDEX_CACHE
    if GLOBAL_INDEX_CACHE:
        return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
    if os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, 'rb') as f:
            GLOBAL_INDEX_CACHE = f.read()
        return Response(GLOBAL_INDEX_CACHE, mimetype='text/html')
    return "Error: index.html not found.", 404

# --- API Endpoints ---

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat() -> Response:
    server_state["last_heartbeat"] = time.time()
    server_state["shutdown_trigger"] = False
    return jsonify({"status": "alive"})

@app.route('/api/client_closed', methods=['POST'])
def client_closed() -> Response:
    server_state["shutdown_trigger"] = True
    return jsonify({"status": "closing_soon"})

@app.route('/api/exit_app', methods=['POST'])
def exit_app() -> Response:
    def shutdown(): 
        time.sleep(0.5)
        os._exit(0)
    threading.Thread(target=shutdown).start()
    return jsonify({"status": "exiting"}), 200

# --- Backup (SAFE IMPLEMENTATION) ---
@app.route('/api/backup/create', methods=['POST'])
def create_backup() -> tuple:
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        filename = f"nexus_backup_{timestamp}.db"
        dest = os.path.join(BACKUP_FOLDER, filename)
        
        # Ensure WAL file is checkpointed
        with get_db_connection() as conn:
            conn.execute("PRAGMA wal_checkpoint(FULL);")
            
        # Small delay to ensure file lock release
        time.sleep(0.1)
        
        # Safe copy using shutil
        shutil.copy2(DATABASE_FILE, dest)
        
        return jsonify({"success": True, "filename": filename})
    except Exception as e:
        print(f"[BACKUP ERROR] {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/backup/list', methods=['GET'])
def list_backups() -> Response:
    try:
        files = [f for f in os.listdir(BACKUP_FOLDER) if f.endswith('.db')]
        files.sort(reverse=True)
        backups = []
        for f in files:
            path = os.path.join(BACKUP_FOLDER, f)
            size = os.path.getsize(path) / 1024
            try:
                date_part = f.replace("nexus_backup_", "").replace(".db", "")
                dt = datetime.strptime(date_part, "%Y-%m-%d_%H-%M-%S")
                # تبدیل تاریخ به شمسی با کتابخانه پایتون (اگر نصب باشد) یا فرمت ساده
                # اینجا فعلا فرمت میلادی تمیز برمیگردانیم، فرانت اند تبدیل میکند
                readable_date = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                readable_date = f
            backups.append({"name": f, "size": round(size, 2), "date": readable_date})
        return jsonify(backups)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/backup/restore/<filename>', methods=['POST'])
def restore_backup(filename: str) -> tuple:
    try:
        src = os.path.join(BACKUP_FOLDER, filename)
        if not os.path.exists(src): return jsonify({"error": "File not found"}), 404
        
        # بستن کانکشن‌ها قبل از ریستور (اگر در معماری پیچیده‌تر بودیم)
        # در اینجا چون کانکشن per-request است، فقط کافیست فایل را جایگزین کنیم
        # اما در ویندوز ممکن است فایل لاک باشد.
        
        # یک راه حل موقت: تغییر نام دیتابیس فعلی و کپی فایل جدید
        temp_backup = DATABASE_FILE + ".tmp"
        if os.path.exists(DATABASE_FILE):
             shutil.copy2(DATABASE_FILE, temp_backup)
        
        try:
            shutil.copy2(src, DATABASE_FILE)
            if os.path.exists(temp_backup): os.remove(temp_backup)
            return jsonify({"success": True})
        except Exception as e:
            # Rollback
            if os.path.exists(temp_backup):
                shutil.copy2(temp_backup, DATABASE_FILE)
            raise e
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/backup/delete/<filename>', methods=['DELETE'])
def delete_backup(filename: str) -> tuple:
    try:
        src = os.path.join(BACKUP_FOLDER, filename)
        if not os.path.exists(src): return jsonify({"error": "File not found"}), 404
        os.remove(src)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Auth ---
@app.route('/api/login', methods=['POST'])
def login() -> tuple:
    try:
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        with get_db_connection() as conn:
            user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                (data.get('username'), hash_password(data.get('password')))).fetchone()
            if user:
                return jsonify({"success": True, "role": user['role'], "username": user['username']})
            return jsonify({"success": False, "message": "Login failed"}), 401
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users() -> Response:
    with get_db_connection() as conn:
        users = conn.execute("SELECT id, username, role, full_name, mobile FROM users").fetchall()
        return jsonify([dict(u) for u in users])

@app.route('/api/users/save', methods=['POST'])
def save_user() -> tuple:
    try:
        d = request.json
        user_id = d.get('id')
        username = d.get('username')
        password = d.get('password')
        role = d.get('role', 'operator')
        full_name = d.get('full_name', '')
        mobile = d.get('mobile', '')
        
        with get_db_connection() as conn:
            if user_id:
                if password:
                    conn.execute("UPDATE users SET username=?, password=?, role=?, full_name=?, mobile=? WHERE id=?", (username, hash_password(password), role, full_name, mobile, user_id))
                else:
                    conn.execute("UPDATE users SET username=?, role=?, full_name=?, mobile=? WHERE id=?", (username, role, full_name, mobile, user_id))
            else:
                conn.execute("INSERT INTO users (username, password, role, full_name, mobile) VALUES (?, ?, ?, ?, ?)", (username, hash_password(password), role, full_name, mobile))
            conn.commit()
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Duplicate username"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/delete/<int:id>', methods=['DELETE'])
def delete_user(id: int) -> tuple:
    with get_db_connection() as conn:
        target = conn.execute("SELECT username FROM users WHERE id=?", (id,)).fetchone()
        if target and target['username'] == 'admin': return jsonify({"error": "Cannot delete admin"}), 403
        conn.execute("DELETE FROM users WHERE id=?", (id,))
        conn.commit()
    return jsonify({"success": True})

# --- Settings ---
@app.route('/api/settings/config', methods=['GET'])
def get_config() -> Response:
    with get_db_connection() as conn:
        row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
        if row: 
            stored_config = json.loads(row['value'])
            for key, val in DEFAULT_COMPONENT_CONFIG.items():
                if key not in stored_config: stored_config[key] = val
            return jsonify(stored_config)
        return jsonify(DEFAULT_COMPONENT_CONFIG)

@app.route('/api/settings/config', methods=['POST'])
def save_config() -> tuple:
    try:
        new_config = request.json
        with get_db_connection() as conn:
            conn.execute("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)", ('component_config', json.dumps(new_config)))
            conn.commit()
        return jsonify({"success": True})
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

@app.route('/api/settings/rename', methods=['POST'])
def rename_item_api() -> tuple:
    try:
        d = request.json
        mode = d.get('mode')
        old_val = d.get('oldVal')
        new_val = d.get('newVal')
        category = d.get('category') 
        list_name = d.get('listName')

        if not old_val or not new_val: return jsonify({"error": "Empty values"}), 400

        with get_db_connection() as conn:
            row = conn.execute("SELECT value FROM app_config WHERE key = 'component_config'").fetchone()
            if not row: return jsonify({"error": "Config error"}), 500
            config = json.loads(row['value'])

            if mode == 'category':
                if old_val not in config: return jsonify({"error": "Category not found"}), 404
                if new_val in config: return jsonify({"error": "Category exists"}), 400
                
                config[new_val] = config.pop(old_val)
                curr_lbl = config[new_val].get('label', '')
                suffix = curr_lbl.split('(')[-1] if '(' in curr_lbl else ''
                config[new_val]['label'] = f"{new_val} ({suffix}" if suffix else new_val
                conn.execute("UPDATE resistors SET type = ? WHERE type = ?", (new_val, old_val))
            
            elif mode == 'item':
                if category not in config: return jsonify({"error": "Category not found"}), 404
                target_list = config[category].get(list_name)
                if target_list is None or old_val not in target_list: return jsonify({"error": "Item not found"}), 404
                
                idx = target_list.index(old_val)
                target_list[idx] = new_val
                
                col_map = {'packages': 'package', 'techs': 'tech', 'locations': 'storage_location', 'paramOptions': 'watt'}
                if list_name in col_map:
                    db_col = col_map[list_name]
                    if category == 'General' and list_name == 'locations':
                        conn.execute(f"UPDATE resistors SET {db_col} = ? WHERE {db_col} = ?", (new_val, old_val))
                    else:
                        conn.execute(f"UPDATE resistors SET {db_col} = ? WHERE {db_col} = ? AND type = ?", (new_val, old_val, category))

            conn.execute("UPDATE app_config SET value = ? WHERE key = 'component_config'", (json.dumps(config),))
            conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Parts ---
@app.route('/api/parts', methods=['GET'])
def get_parts() -> Response:
    with get_db_connection() as conn:
        parts = conn.execute('SELECT * FROM resistors ORDER BY id DESC').fetchall()
        return jsonify([dict(p) for p in parts])

@app.route('/api/save', methods=['POST'])
def save_part() -> tuple:
    try:
        d = request.json
        part_id = d.get('id')
        username = d.get('username', 'unknown')
        
        raw_price = str(d.get("price", "")).replace(',', '')
        price = float(raw_price) if raw_price and raw_price.replace('.', '', 1).isdigit() else 0.0
        
        raw_usd = str(d.get("usd_rate", "")).replace(',', '')
        usd_rate = float(raw_usd) if raw_usd and raw_usd.replace('.', '', 1).isdigit() else 0.0
        
        links = d.get("purchase_links", [])
        if isinstance(links, list): links_json = json.dumps(links[:5])
        else: links_json = "[]"

        payload = {
            "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""),
            "package": d.get("pkg", ""), "type": d.get("type", ""), "buy_date": d.get("date", ""),
            "quantity": int(d.get("qty") or 0), "toman_price": price, "reason": d.get("reason", ""),
            "min_quantity": int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
            "last_modified_by": username, "storage_location": d.get("location", ""),
            "tech": d.get("tech", ""), "usd_rate": usd_rate,
            "purchase_links": links_json
        }
        
        op = 'ENTRY (New)'
        qty_change = payload['quantity']

        with get_db_connection() as conn:
            dup_sql = "SELECT id, quantity FROM resistors WHERE val=? AND watt=? AND tolerance=? AND package=? AND type=? AND tech=? AND storage_location=?"
            dup_params = (payload['val'], payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['tech'], payload['storage_location'])
            
            if part_id:
                existing = conn.execute(dup_sql + " AND id != ?", (*dup_params, part_id)).fetchone()
                if existing: return jsonify({"error": "Duplicate part"}), 400

                old = conn.execute('SELECT quantity FROM resistors WHERE id = ?', (part_id,)).fetchone()
                old_q = old['quantity'] if old else 0
                
                if payload['quantity'] > old_q: op = 'ENTRY (Refill)'
                elif payload['quantity'] < old_q: op = 'UPDATE (Decrease)'
                else: op = 'UPDATE (Edit)'
                
                qty_change = payload['quantity'] - old_q
                
                conn.execute("""UPDATE resistors SET val=?, watt=?, tolerance=?, package=?, type=?, buy_date=?, quantity=?, toman_price=?, reason=?, min_quantity=?, vendor_name=?, last_modified_by=?, storage_location=?, tech=?, usd_rate=?, purchase_links=? WHERE id=?""", (*payload.values(), part_id))
                rid = part_id
            else:
                existing = conn.execute(dup_sql, dup_params).fetchone()
                if existing:
                    rid = existing['id']
                    new_qty = existing['quantity'] + qty_change
                    op = 'ENTRY (Refill - Merge)'
                    conn.execute("UPDATE resistors SET quantity=?, toman_price=?, buy_date=?, vendor_name=?, last_modified_by=?, reason=?, usd_rate=?, purchase_links=? WHERE id=?", 
                                 (new_qty, payload['toman_price'], payload['buy_date'], payload['vendor_name'], username, payload['reason'], payload['usd_rate'], payload['purchase_links'], rid))
                else:
                    cur = conn.execute("INSERT INTO resistors (val, watt, tolerance, package, type, buy_date, quantity, toman_price, reason, min_quantity, vendor_name, last_modified_by, storage_location, tech, usd_rate, purchase_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", tuple(payload.values()))
                    rid = cur.lastrowid

            conn.execute("INSERT INTO purchase_log (resistor_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username, watt, tolerance, package, type, storage_location, tech, usd_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                         (rid, payload['val'], qty_change, payload['toman_price'], payload['vendor_name'], payload['buy_date'], payload['reason'], op, username,
                          payload['watt'], payload['tolerance'], payload['package'], payload['type'], payload['storage_location'], payload['tech'], payload['usd_rate']))
            conn.commit()
            return jsonify({"success": True})
    except Exception as e: 
        return jsonify({"error": str(e)}), 500

@app.route('/api/withdraw', methods=['POST'])
def withdraw_parts() -> tuple:
    try:
        data = request.json
        items = data.get('items', [])
        project_name = data.get('project', 'General Usage')
        username = data.get('username', 'unknown')
        
        if not items:
            return jsonify({"error": "No items selected"}), 400
            
        with get_db_connection() as conn:
            for item in items:
                part_id = item['id']
                qty_to_remove = int(item['qty'])
                row = conn.execute("SELECT quantity, val FROM resistors WHERE id = ?", (part_id,)).fetchone()
                if not row: return jsonify({"error": f"Part ID {part_id} not found."}), 404
                if row['quantity'] < qty_to_remove:
                     return jsonify({"error": f"موجودی ناکافی برای قطعه {row['val']}. (موجودی: {row['quantity']})"}), 400

            for item in items:
                part_id = item['id']
                qty_to_remove = int(item['qty'])
                
                row = conn.execute("SELECT * FROM resistors WHERE id = ?", (part_id,)).fetchone()
                new_qty = row['quantity'] - qty_to_remove
                
                conn.execute("UPDATE resistors SET quantity = ?, last_modified_by = ? WHERE id = ?", (new_qty, username, part_id))
                conn.execute("""
                    INSERT INTO purchase_log (resistor_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username, watt, tolerance, package, type, storage_location, tech, usd_rate) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (part_id, row['val'], -qty_to_remove, row['toman_price'], row['vendor_name'], datetime.now().strftime("%Y-%m-%d"), project_name, 'EXIT (Project)', username,
                      row['watt'], row['tolerance'], row['package'], row['type'], row['storage_location'], row['tech'], row['usd_rate']))
            
            conn.commit()
            
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete/<int:id>', methods=['DELETE'])
def delete_part(id: int) -> tuple:
    with get_db_connection() as conn:
        try:
            part = conn.execute("SELECT * FROM resistors WHERE id=?", (id,)).fetchone()
            if part: 
                conn.execute("INSERT INTO purchase_log (resistor_id, val, quantity_added, operation_type, reason, watt, tolerance, package, type, storage_location, tech) VALUES (?, ?, 0, 'DELETE', 'Deleted by user', ?, ?, ?, ?, ?, ?)", 
                             (id, part['val'], part['watt'], part['tolerance'], part['package'], part['type'], part['storage_location'], part['tech']))
        except: pass
        conn.execute('DELETE FROM resistors WHERE id = ?', (id,))
        conn.commit()
    return jsonify({"success": True})

# --- Contacts ---
@app.route('/api/contacts', methods=['GET'])
def get_contacts() -> Response:
    with get_db_connection() as conn:
        rows = conn.execute('SELECT * FROM contacts ORDER BY name ASC').fetchall()
        return jsonify([dict(r) for r in rows])

@app.route('/api/contacts/save', methods=['POST'])
def save_contact() -> tuple:
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
def delete_contact(id: int) -> tuple:
    with get_db_connection() as conn:
        conn.execute('DELETE FROM contacts WHERE id = ?', (id,))
        conn.commit()
    return jsonify({"success": True})

@app.route('/api/log', methods=['GET'])
def get_log() -> Response:
    with get_db_connection() as conn:
        rows = conn.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC').fetchall()
        return jsonify([dict(r) for r in rows])

# --- [TAG: ROUTE_INVENTORY_STATS] ---
@app.route('/api/inventory/stats', methods=['GET'])
def get_inventory_stats() -> Response:
    try:
        daily_usd_price = fetch_daily_usd_price()
        
        with get_db_connection() as conn:
            rows = conn.execute("SELECT val, quantity, toman_price, usd_rate, min_quantity, type, package, storage_location, watt, tolerance, tech, vendor_name, purchase_links FROM resistors").fetchall()
            
            total_items = len(rows)
            total_quantity = 0
            total_value_toman_calculated = 0.0 
            total_value_usd_live = 0.0
            shortages = []
            categories = {}
            
            for row in rows:
                q = row['quantity'] or 0
                p = row['toman_price'] or 0.0
                u = row['usd_rate'] or 0.0
                min_q = row['min_quantity'] or 0
                cat = row['type'] or 'Uncategorized'
                
                total_quantity += q
                if u > 0 and daily_usd_price > 0:
                    current_part_value_toman = (p / u) * q * daily_usd_price
                else:
                    current_part_value_toman = p * q
                
                total_value_toman_calculated += current_part_value_toman
                
                if q <= min_q:
                    links = []
                    try:
                        if row['purchase_links']:
                            links = json.loads(row['purchase_links'])
                    except: pass

                    shortages.append({
                        "val": row['val'],
                        "pkg": row['package'],
                        "qty": q,
                        "min": min_q,
                        "loc": row['storage_location'],
                        "type": row['type'],
                        "watt": row['watt'],
                        "tolerance": row['tolerance'],
                        "tech": row['tech'],
                        "vendor": row['vendor_name'],
                        "links": links
                    })
                
                if cat not in categories:
                    categories[cat] = {"count": 0, "value": 0}
                categories[cat]["count"] += q
                categories[cat]["value"] += current_part_value_toman
            
            if daily_usd_price > 0:
                total_value_usd_live = total_value_toman_calculated / daily_usd_price
            else:
                total_value_usd_live = 0

            shortages.sort(key=lambda x: x['qty'])
            
            return jsonify({
                "total_items": total_items,
                "total_quantity": total_quantity,
                "total_value_toman": int(total_value_toman_calculated),
                "total_value_usd_live": round(total_value_usd_live, 2),
                "live_usd_price": daily_usd_price, 
                "shortages": shortages,
                "categories": categories
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- [TAG: MAIN_EXECUTION] ---
if __name__ == '__main__':
    threading.Thread(target=watchdog_service, daemon=True).start()
    
    def open_browser():
        time.sleep(1.5)
        webbrowser.open_new(SERVER_URL)
    threading.Thread(target=open_browser).start()
    
    print(f"--- Nexus Warehouse System Started on {API_PORT} ---")
    app.run(host='127.0.0.1', port=API_PORT, threaded=True)