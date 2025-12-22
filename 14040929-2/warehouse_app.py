# --- [فایل اصلی - نقطه ورود برنامه] ---
import logging
import os
import time
import threading
import webbrowser
from flask import Flask
from flask_cors import CORS

# ایمپورت ماژول‌های داخلی
from config import API_PORT, UPLOAD_FOLDER, BACKUP_FOLDER, SERVER_URL, HEARTBEAT_TIMEOUT
from database import init_db
from routes import register_routes
from services import watchdog_service

# آماده‌سازی اپلیکیشن Flask
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

# تنظیمات لاگ (فقط خطاها نمایش داده شوند)
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# وضعیت سرور برای مدیریت واتچ‌داگ
server_state = {
    "last_heartbeat": time.time(),
    "shutdown_trigger": False
}

def start_app():
    # ۱. ایجاد پوشه‌های مورد نیاز
    for folder in [UPLOAD_FOLDER, BACKUP_FOLDER]:
        os.makedirs(folder, exist_ok=True)

    # ۲. مقداردهی اولیه دیتابیس
    init_db()

    # ۳. ثبت مسیرهای API
    register_routes(app, server_state)

    # ۴. راه‌اندازی سرویس واتچ‌داگ در یک ترد جداگانه
    threading.Thread(target=watchdog_service, args=(server_state, HEARTBEAT_TIMEOUT), daemon=True).start()

    # ۵. باز کردن مرورگر پس از کمی تاخیر
    def open_browser():
        time.sleep(1.5)
        webbrowser.open_new(SERVER_URL)
    threading.Thread(target=open_browser).start()

    # ۶. اجرای سرور
    print(f"--- Nexus Warehouse System Modular Started on {API_PORT} ---")
    app.run(host='127.0.0.1', port=API_PORT, threaded=True)

if __name__ == '__main__':
    start_app()