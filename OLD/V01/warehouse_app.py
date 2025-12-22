import datetime
import logging
import os
import sqlite3
import threading
import time
import webbrowser
import hashlib
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

# --- تنظیمات مهندسی سیستم ---
API_PORT = 8090
DATABASE_FILE = 'nexus_warehouse.db'
SERVER_URL = f'http://127.0.0.1:{API_PORT}'
UPLOAD_FOLDER = 'uploads'

# محاسبه مهندسی Watchdog:
# مرورگرها در حالت Sleep تایمرها را تا ۶۰ ثانیه کند می‌کنند.
# بنابراین تایم‌اوت باید > ۶۰ ثانیه باشد تا در پس‌زمینه قطع نشود.
HEARTBEAT_TIMEOUT = 70 

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
CORS(app)

if not os.path.exists(UPLOAD_FOLDER):
    try: os.makedirs(UPLOAD_FOLDER)
    except OSError: pass

# متغیرهای کنترل وضعیت سیستم
server_state = {
    "last_heartbeat": time.time(),
    "shutdown_trigger": False
}

# --- توابع امنیتی ---
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# --- دیتابیس (با بهینه‌سازی WAL) ---
def get_db_connection():
    try:
        conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA journal_mode=WAL;') 
        return conn
    except sqlite3.Error as e:
        print(f"[DB ERROR] {e}")
        return None

def init_db():
    try:
        with get_db_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS resistors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    val TEXT NOT NULL,
                    watt TEXT,
                    tolerance TEXT,
                    package TEXT,
                    type TEXT,
                    buy_date TEXT,
                    quantity INTEGER,
                    toman_price REAL,
                    reason TEXT,
                    image_path TEXT,
                    min_quantity INTEGER DEFAULT 1,
                    vendor_name TEXT,
                    last_modified_by TEXT
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
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            if not conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone():
                conn.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ('admin', hash_password('admin'), 'admin'))

            try: conn.execute("ALTER TABLE resistors ADD COLUMN last_modified_by TEXT")
            except: pass
            try: conn.execute("ALTER TABLE purchase_log ADD COLUMN username TEXT")
            except: pass
            try: conn.execute("ALTER TABLE contacts ADD COLUMN address TEXT")
            except: pass

            conn.commit()
    except Exception as e:
        print(f"[INIT ERROR] {e}")

init_db()

# --- Watchdog Timer (سگ نگهبان) ---
def watchdog_service():
    # تاخیر اولیه برای استیبل شدن سیستم
    time.sleep(3)
    server_state["last_heartbeat"] = time.time()
    
    while True:
        current_time = time.time()
        
        # ۱. بررسی تریگر خروج دستی (Priority 1)
        if server_state["shutdown_trigger"]:
            # یک تاخیر کوتاه برای اینکه اگر کاربر رفرش کرد، فرصت بازگشت باشد
            # اگر در این ۳ ثانیه هارت‌بیت جدید بیاید، تریگر لغو می‌شود (در تابع API)
            time.sleep(3) 
            if server_state["shutdown_trigger"]: # چک مجدد
                print("--- Graceful Shutdown ---")
                os._exit(0)

        # ۲. بررسی تایم‌اوت کلی (Priority 2)
        # اگر کاربر سیستم را بست و سیگنال خروج نرسید، این بخش بعد از ۷۰ ثانیه عمل می‌کند
        if current_time - server_state["last_heartbeat"] > HEARTBEAT_TIMEOUT:
            print(f"--- Watchdog Timeout ({HEARTBEAT_TIMEOUT}s expired) ---")
            os._exit(0)
            
        time.sleep(2) # چک کردن وضعیت هر ۲ ثانیه یکبار

@app.route('/')
def serve_index(): return send_file('index.html')

# --- API Endpoints ---
@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    # دریافت پالس: ریست کردن تایمر و لغو کردن هرگونه دستور خاموشی
    server_state["last_heartbeat"] = time.time()
    server_state["shutdown_trigger"] = False
    return jsonify({"status": "alive"})

@app.route('/api/client_closed', methods=['POST'])
def client_closed():
    # دریافت سیگنال خروج از سمت کلاینت
    server_state["shutdown_trigger"] = True
    return jsonify({"status": "closing_soon"})

@app.route('/api/exit_app', methods=['POST'])
def exit_app():
    # خروج دستی با دکمه
    def shutdown(): 
        time.sleep(0.5)
        os._exit(0)
    threading.Thread(target=shutdown).start()
    return jsonify({"status": "exiting"}), 200

# --- User Auth ---
@app.route('/api/login', methods=['POST'])
def login():
    try:
        d = request.json
        with get_db_connection() as conn:
            user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (d.get('username'), hash_password(d.get('password')))).fetchone()
            return jsonify({"success": True, "role": user['role'], "username": user['username']}) if user else (jsonify({"success": False, "message": "Login failed"}), 401)
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    with get_db_connection() as conn:
        return jsonify([dict(u) for u in conn.execute("SELECT id, username, role FROM users").fetchall()])

@app.route('/api/users/add', methods=['POST'])
def add_user():
    try:
        d = request.json
        with get_db_connection() as conn:
            conn.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", (d['username'], hash_password(d['password']), d.get('role', 'operator')))
            conn.commit()
        return jsonify({"success": True})
    except: return jsonify({"error": "User exists"}), 400

@app.route('/api/users/delete/<int:id>', methods=['DELETE'])
def delete_user(id):
    with get_db_connection() as conn:
        if conn.execute("SELECT username FROM users WHERE id=?", (id,)).fetchone()['username'] == 'admin': return jsonify({"error": "No"}), 403
        conn.execute("DELETE FROM users WHERE id=?", (id,))
        conn.commit()
    return jsonify({"success": True})

# --- Inventory Logic ---
@app.route('/api/parts', methods=['GET'])
def get_parts():
    with get_db_connection() as conn:
        return jsonify([dict(p) for p in conn.execute('SELECT * FROM resistors ORDER BY id DESC').fetchall()])

@app.route('/api/save', methods=['POST'])
def save_part():
    try:
        d = request.json
        part_id = d.get('id')
        username = d.get('username', 'unknown')
        
        raw_p = str(d.get("price", "")).replace(',', '')
        price = float(raw_p) if raw_p else None
        
        payload = {
            "val": d.get("val", ""), "watt": d.get("watt", ""), "tolerance": d.get("tol", ""),
            "package": d.get("pkg", ""), "type": d.get("type", ""), "buy_date": d.get("date", ""),
            "quantity": int(d.get("qty") or 0), "toman_price": price, "reason": d.get("reason", ""),
            "min_quantity": int(d.get("min_qty") or 1), "vendor_name": d.get("vendor_name", ""),
            "last_modified_by": username
        }
        
        op = 'ENTRY (New)'
        qty_change = payload['quantity']

        with get_db_connection() as conn:
            if part_id:
                old = conn.execute('SELECT quantity FROM resistors WHERE id = ?', (part_id,)).fetchone()
                old_q = old['quantity'] if old else 0
                
                if payload['quantity'] > old_q:
                    op = 'ENTRY (Refill)'
                    qty_change = payload['quantity'] - old_q
                elif payload['quantity'] < old_q:
                    op = 'UPDATE (Decrease)'
                    qty_change = payload['quantity'] - old_q
                else:
                    op = 'UPDATE (Edit)'
                    qty_change = 0
                
                conn.execute("""UPDATE resistors SET val=?, watt=?, tolerance=?, package=?, type=?, buy_date=?, quantity=?, toman_price=?, reason=?, min_quantity=?, vendor_name=?, last_modified_by=? WHERE id=?""", (*payload.values(), part_id))
                rid = part_id
            else:
                cur = conn.execute("""INSERT INTO resistors (val, watt, tolerance, package, type, buy_date, quantity, toman_price, reason, min_quantity, vendor_name, last_modified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", tuple(payload.values()))
                rid = cur.lastrowid

            conn.execute("INSERT INTO purchase_log (resistor_id, val, quantity_added, unit_price, vendor_name, purchase_date, reason, operation_type, username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                            (rid, payload['val'], qty_change, payload['toman_price'], payload['vendor_name'], payload['buy_date'], payload['reason'], op, username))
            
            conn.commit()
            return jsonify({"success": True})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/delete/<int:id>', methods=['DELETE'])
def delete_part(id):
    with get_db_connection() as conn:
        try:
            part = conn.execute("SELECT val FROM resistors WHERE id=?", (id,)).fetchone()
            if part:
                conn.execute("INSERT INTO purchase_log (resistor_id, val, quantity_added, operation_type, reason) VALUES (?, ?, 0, 'DELETE', 'Deleted by user')", (id, part['val']))
        except: pass
        
        conn.execute('DELETE FROM resistors WHERE id = ?', (id,))
        conn.commit()
    return jsonify({"success": True})

# --- Contacts & Logs ---
@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    with get_db_connection() as conn:
        return jsonify([dict(r) for r in conn.execute('SELECT * FROM contacts ORDER BY name ASC').fetchall()])

@app.route('/api/contacts/save', methods=['POST'])
def save_contact():
    d = request.json
    p = (d.get("name"), d.get("phone"), d.get("mobile"), d.get("fax"), d.get("website"), d.get("email"), d.get("address"), d.get("notes"))
    with get_db_connection() as conn:
        if d.get('id'): conn.execute("UPDATE contacts SET name=?, phone=?, mobile=?, fax=?, website=?, email=?, address=?, notes=? WHERE id=?", (*p, d['id']))
        else: conn.execute("INSERT INTO contacts (name, phone, mobile, fax, website, email, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", p)
        conn.commit()
    return jsonify({"success": True})

@app.route('/api/contacts/delete/<int:id>', methods=['DELETE'])
def delete_contact(id):
    with get_db_connection() as conn:
        conn.execute('DELETE FROM contacts WHERE id = ?', (id,))
        conn.commit()
    return jsonify({"success": True})

@app.route('/api/log', methods=['GET'])
def get_log():
    with get_db_connection() as conn:
        return jsonify([dict(r) for r in conn.execute('SELECT * FROM purchase_log ORDER BY timestamp DESC').fetchall()])

if __name__ == '__main__':
    threading.Thread(target=watchdog_service, daemon=True).start()
    threading.Thread(target=lambda: (time.sleep(1.5), webbrowser.open_new(SERVER_URL))).start()
    app.run(host='127.0.0.1', port=API_PORT, threaded=True)