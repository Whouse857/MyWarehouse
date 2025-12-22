from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import datetime
import sqlite3
import os
import webbrowser
import time
import threading
import logging

# --- تنظیمات پیکربندی ---
API_PORT = 8090
DATABASE_FILE = 'nexus_warehouse.db'
SERVER_URL = f'http://127.0.0.1:{API_PORT}'
UPLOAD_FOLDER = 'uploads' 

# زمان (به ثانیه) که اگر پیامی از مرورگر نیاید، سرور بسته می‌شود
HEARTBEAT_TIMEOUT = 4 

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# غیرفعال کردن لاگ‌های اضافی برای تمیزی کنسول
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

CORS(app)

# مطمئن شدن از وجود پوشه آپلود
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"[INFO] Created upload folder: {UPLOAD_FOLDER}")

# متغیر سراسری برای ذخیره آخرین زمان ارتباط
last_heartbeat_time = time.time()

# --- مدیریت دیتابیس ---
def get_db_connection():
    try:
        conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"[DB CONNECTION ERROR] {e}")
        return None

def init_db():
    try:
        with get_db_connection() as conn:
            # اضافه شدن ستون‌های 'reason' و 'image_path' به جدول resistors
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
                    dollar_price REAL,
                    reason TEXT,
                    image_path TEXT 
                );
            """)
            conn.commit()
    except Exception as e:
        print(f"[INIT ERROR] Failed to initialize DB: {e}")

init_db()

# --- مانیتورینگ بسته شدن مرورگر ---
def monitor_client_status():
    global last_heartbeat_time
    print(f"[INFO] Monitoring client heartbeat (Timeout: {HEARTBEAT_TIMEOUT}s)...")
    
    time.sleep(5)
    last_heartbeat_time = time.time()

    while True:
        current_time = time.time()
        if current_time - last_heartbeat_time > HEARTBEAT_TIMEOUT:
            print("\n[INFO] Browser closed or connection lost. Shutting down server...")
            os._exit(0)
        time.sleep(1)

# --- مسیرهای API ---

@app.route('/api/heartbeat', methods=['POST'])
def heartbeat():
    global last_heartbeat_time
    last_heartbeat_time = time.time()
    return jsonify({"status": "alive", "time": datetime.datetime.now().strftime("%H:%M:%S")})

@app.route('/api/exit_app', methods=['POST'])
def exit_app():
    print("\n[INFO] Manual exit signal received.")
    def shutdown():
        time.sleep(0.5)
        os._exit(0)
    threading.Thread(target=shutdown).start()
    return jsonify({"status": "exiting"}), 200

@app.route('/', methods=['GET'])
def serve_index():
    return send_file('index.html')

@app.route('/api/upload_image', methods=['POST'])
def upload_file():
    """مسیر جدید برای آپلود فایل"""
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{int(time.time())}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # مسیر نسبی را برای ذخیره در دیتابیس و نمایش برمی گردانیم
        return jsonify({"success": True, "path": f"{app.config['UPLOAD_FOLDER']}/{unique_filename}"})
    
    return jsonify({"success": False, "error": "Unknown error"}), 500

# مسیر برای سرویس دهی تصاویر
@app.route(f'/{UPLOAD_FOLDER}/<filename>')
def uploaded_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))


@app.route('/api/parts', methods=['GET'])
def get_parts():
    try:
        with get_db_connection() as conn:
            parts = conn.execute('SELECT * FROM resistors ORDER BY id DESC').fetchall()
            return jsonify([dict(part) for part in parts])
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/save', methods=['POST'])
def save_part():
    try:
        data = request.json
        part_id = data.get('id')
        
        raw_price_str = str(data.get("price", "")).replace(',', '')
        try:
            dollar_price = float(raw_price_str) if raw_price_str else None
        except ValueError:
            return jsonify({"success": False, "error": "Invalid price format."}), 400

        quantity = int(data.get("qty") or 0)
        buy_date = data.get("date", datetime.date.today().strftime("%Y/%m/%d"))

        payload = {
            "val": data.get("val", ""), "watt": data.get("watt", ""), "tolerance": data.get("tol", ""), 
            "package": data.get("pkg", ""), "type": data.get("type", ""),
            "buy_date": buy_date, 
            "quantity": quantity, "dollar_price": dollar_price,
            "reason": data.get("reason", ""),
            "image_path": data.get("image_path", "")
        }

        with get_db_connection() as conn:
            if part_id:
                # کوئری UPDATE اصلاح شده: تعداد پارامترها و ترتیب آن‌ها دقیقا با payload تطابق دارد.
                cursor = conn.execute("""
                    UPDATE resistors SET 
                        val=?, watt=?, tolerance=?, package=?, type=?, buy_date=?, quantity=?, dollar_price=?, reason=?, image_path=?
                    WHERE id=?
                """, (*payload.values(), part_id))
                
                if cursor.rowcount > 0: conn.commit(); return jsonify({"success": True, "message": "Updated"})
            
            # کوئری INSERT
            cursor = conn.execute("""
                INSERT INTO resistors (val, watt, tolerance, package, type, buy_date, quantity, dollar_price, reason, image_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, tuple(payload.values()))
            conn.commit()
            return jsonify({"success": True, "message": "Added", "id": cursor.lastrowid})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/delete/<int:part_id>', methods=['DELETE'])
def delete_part(part_id):
    try:
        with get_db_connection() as conn:
            cursor = conn.execute('DELETE FROM resistors WHERE id = ?', (part_id,))
            conn.commit()
            return jsonify({"success": True}) if cursor.rowcount > 0 else (jsonify({"success": False}), 404)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# --- اجرای برنامه ---
if __name__ == '__main__':
    monitor_thread = threading.Thread(target=monitor_client_status, daemon=True)
    monitor_thread.start()

    def open_browser():
        time.sleep(1.5)
        webbrowser.open_new(SERVER_URL)
        print(f"[INFO] Browser launched at {SERVER_URL}")
    threading.Thread(target=open_browser).start()
    
    print(f"[INFO] Server started on port {API_PORT}")
    app.run(host='127.0.0.1', port=API_PORT, debug=False, use_reloader=False)