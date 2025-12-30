# =========================================================================
# نام فایل: services.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این فایل شامل سرویس‌های جانبی و پردازش‌های پس‌زمینه (Background Services) سرور است.
# این سرویس‌ها مستقل از درخواست‌های مستقیم کاربر عمل کرده و وظایف نگهداری و به‌روزرسانی را انجام می‌دهند.
# * توابع و بخش‌های کلیدی:
# 1. USD_CACHE: کش داخلی برای ذخیره آخرین قیمت دلار جهت جلوگیری از درخواست‌های تکراری به وب‌سایت مرجع.
# 2. fetch_daily_usd_price: دریافت نرخ لحظه‌ای دلار از وب‌سایت TGJU (با مکانیزم فال‌بک به دیتابیس).
# 3. watchdog_service: سرویس نظارت بر فعالیت سرور که در صورت بسته شدن کلاینت، سرور را خاموش می‌کند.
# =========================================================================

import time
import json
import os
from datetime import datetime
from database import get_db_connection

# =========================================================================
# بخش تنظیمات و متغیرهای سراسری (GLOBAL CONFIG & VARIABLES)
# =========================================================================

# کش برای نگهداری قیمت دلار و جلوگیری از درخواست‌های زیاد
USD_CACHE = {
    "price": 0,
    "date_str": "",
    "status": "init"
}

# تلاش برای ایمپورت کتابخانه‌های اسکرپینگ (در صورت نصب بودن)
try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False

# =========================================================================
# بخش توابع سرویس‌دهنده (SERVICE FUNCTIONS)
# =========================================================================

# =========================================================================
# نام تابع: fetch_daily_usd_price
# کارایی: دریافت قیمت روزانه دلار از اینترنت یا دیتابیس (در صورت آفلاین بودن)
# =========================================================================
def fetch_daily_usd_price():
    """دریافت قیمت لحظه‌ای دلار از وب‌سایت TGJU"""
    global USD_CACHE
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # اگر قیمت امروز قبلاً گرفته شده، همان را برگردان
    if USD_CACHE["date_str"] == today_str and USD_CACHE["price"] > 0:
        return USD_CACHE["price"]
        
    if SCRAPING_AVAILABLE:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'}
            url = "https://www.tgju.org/profile/price_dollar_rl"
            response = requests.get(url, headers=headers, timeout=3)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # استخراج قیمت از ساختار HTML سایت
                price_tag = soup.find("span", {"data-col": "info.last_price"}) or soup.select_one(".value > span")
                if price_tag:
                    price = float(price_tag.text.strip().replace(',', ''))
                    if price > 100000: price = price / 10 # تبدیل ریال به تومان اگر لازم بود
                    
                    # به‌روزرسانی کش و ذخیره در دیتابیس برای استفاده‌های بعدی
                    USD_CACHE["price"] = price; USD_CACHE["date_str"] = today_str; USD_CACHE["status"] = "online"
                    try:
                        with get_db_connection() as conn:
                            conn.execute("INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)", 
                                        ('last_usd_info', json.dumps(USD_CACHE)))
                            conn.commit()
                    except: pass
                    return price
        except Exception as e: 
            print(f"[WARNING] USD Scraper Error: {e}")
            
    # اگر اسکرپینگ شکست خورد (آفلاین یا خطا)، آخرین قیمت ذخیره شده در دیتابیس را بخوان
    if USD_CACHE["price"] == 0:
        try:
            with get_db_connection() as conn:
                row = conn.execute("SELECT value FROM app_config WHERE key = 'last_usd_info'").fetchone()
                if row:
                    saved_info = json.loads(row['value'])
                    USD_CACHE["price"] = saved_info.get("price", 0)
                    USD_CACHE["date_str"] = saved_info.get("date_str", "")
                    USD_CACHE["status"] = "offline_db"
        except: pass
    return USD_CACHE["price"]

# =========================================================================
# نام تابع: watchdog_service
# کارایی: حلقه نظارتی برای بررسی زنده بودن کلاینت و بستن سرور در صورت عدم فعالیت
# =========================================================================
def watchdog_service(server_state, timeout):
    """سرویس نظارت برای بستن خودکار برنامه در صورت عدم فعالیت کلاینت"""
    time.sleep(3) # تاخیر اولیه برای بالا آمدن کامل سرور
    server_state["last_heartbeat"] = time.time()
    
    while True:
        current_time = time.time()
        
        # اگر کلاینت درخواست خروج داده باشد
        if server_state["shutdown_trigger"]:
            time.sleep(3) # فرصت برای ارسال آخرین پاسخ به کلاینت
            if server_state["shutdown_trigger"]:
                print("--- Graceful Shutdown ---")
                os._exit(0)
        
        # اگر زمان زیادی از آخرین پینگ کلاینت گذشته باشد (Timeout)
        if current_time - server_state["last_heartbeat"] > timeout:
            print(f"--- Watchdog Timeout ({timeout}s expired) ---")
            os._exit(0)
            
        time.sleep(2) # بررسی وضعیت هر 2 ثانیه یکبار