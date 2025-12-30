# =========================================================================
# نام فایل: warehouse_app.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این فایل نقطه شروع (Entry Point) سمت سرور (Backend) برنامه است که با استفاده از Flask نوشته شده است.
# وظیفه آن راه‌اندازی سرور، اتصال به دیتابیس، ثبت مسیرهای API و مدیریت چرخه حیات برنامه است.
# * توابع و بخش‌های کلیدی:
# 1. Flask Setup: پیکربندی اپلیکیشن Flask، تنظیمات CORS و پوشه‌های آپلود.
# 2. server_state: دیکشنری سراسری برای مدیریت وضعیت زنده بودن سرور (Heartbeat).
# 3. start_app: تابع اصلی که تمام سرویس‌ها (دیتابیس، روت‌ها، واتچ‌داگ و مرورگر) را به ترتیب اجرا می‌کند.
# =========================================================================

import logging
import os
import time
import threading
import webbrowser
from flask import Flask
from flask_cors import CORS

# =========================================================================
# بخش ایمپورت ماژول‌های داخلی (INTERNAL IMPORTS)
# =========================================================================
from config import API_PORT, UPLOAD_FOLDER, BACKUP_FOLDER, SERVER_URL, HEARTBEAT_TIMEOUT
from database import init_db
from routes import register_routes
from services import watchdog_service

# =========================================================================
# بخش پیکربندی اپلیکیشن (APP CONFIGURATION)
# =========================================================================

# آماده‌سازی اپلیکیشن Flask
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
CORS(app)

# تنظیمات لاگ (فقط خطاها نمایش داده شوند تا کنسول شلوغ نشود)
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# وضعیت سرور برای مدیریت واتچ‌داگ (نظارت بر بسته شدن برنامه توسط کلاینت)
server_state = {
    "last_heartbeat": time.time(),
    "shutdown_trigger": False
}

# =========================================================================
# بخش منطق و توابع اجرایی (EXECUTION LOGIC)
# =========================================================================

# =========================================================================
# نام تابع: start_app
# کارایی: تابع اصلی راه‌اندازی که تمام پیش‌نیازها را آماده کرده و سرور را استارت می‌زند.
# مراحل: ساخت پوشه‌ها -> دیتابیس -> روت‌ها -> سرویس نظارت -> باز کردن مرورگر -> اجرای Flask
# =========================================================================
def start_app():
    # ۱. ایجاد پوشه‌های مورد نیاز (آپلود و بک‌آپ) در صورت عدم وجود
    for folder in [UPLOAD_FOLDER, BACKUP_FOLDER]:
        os.makedirs(folder, exist_ok=True)

    # ۲. مقداردهی اولیه دیتابیس (ایجاد جداول اگر وجود ندارند)
    init_db()

    # ۳. ثبت مسیرهای API (Endpoints) به اپلیکیشن
    register_routes(app, server_state)

    # ۴. راه‌اندازی سرویس واتچ‌داگ در یک ترد جداگانه (برای بستن خودکار سرور)
    threading.Thread(target=watchdog_service, args=(server_state, HEARTBEAT_TIMEOUT), daemon=True).start()

    # ۵. باز کردن مرورگر پیش‌فرض سیستم پس از کمی تاخیر (برای اطمینان از بالا آمدن سرور)
    def open_browser():
        time.sleep(1.5)
        webbrowser.open_new(SERVER_URL)
    threading.Thread(target=open_browser).start()

    # ۶. اجرای نهایی سرور Flask
    print(f"--- Nexus Warehouse System Modular Started on {API_PORT} ---")
    app.run(host='127.0.0.1', port=API_PORT, threaded=True)

# =========================================================================
# بخش اجرای اصلی (MAIN EXECUTION BLOCK)
# =========================================================================
if __name__ == '__main__':
    start_app()