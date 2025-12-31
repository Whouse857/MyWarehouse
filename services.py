# ==============================================================================
# نسخه: 0.21 (مهاجرت به MySQL - نسخه نهایی)
# فایل: services.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول مسئول ارائه سرویس‌های جانبی و پس‌زمینه سیستم است.
# وظایف اصلی شامل دریافت خودکار قیمت لحظه‌ای دلار از وب‌سایت‌های مرجع (TGJU)،
# مدیریت کش قیمت ارز و سرویس نظارتی (Watchdog) جهت بستن خودکار سرور
# در صورت عدم فعالیت یا خروج کاربر می‌باشد.
# ==============================================================================

import time
import json
import os
import re
from datetime import datetime
from database import get_db_connection

# ------------------------------------------------------------------------------
# [تگ: مدیریت حافظه موقت قیمت دلار]
# ذخیره آخرین قیمت دریافت شده به همراه وضعیت و تاریخ جهت جلوگیری از درخواست‌های مکرر.
# ------------------------------------------------------------------------------
USD_CACHE = {
    "price": 0,
    "date_str": "",
    "status": "init"
}

# بررسی وجود کتابخانه‌های مورد نیاز برای اسکرپینگ قیمت از وب
try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False

# ------------------------------------------------------------------------------
# [تگ: دریافت قیمت دلار]
# این تابع تلاش می‌کند قیمت روز دلار را از وب‌سایت TGJU استخراج کند.
# در صورت بروز خطا یا عدم دسترسی به اینترنت، آخرین قیمت ذخیره شده در دیتابیس را برمی‌گرداند.
# ------------------------------------------------------------------------------
def fetch_daily_usd_price():
    """دریافت قیمت لحظه‌ای دلار و مدیریت کش آن"""
    global USD_CACHE
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # اگر قیمت امروز قبلاً دریافت شده و معتبر است، از حافظه موقت (کش) استفاده کن
    if USD_CACHE["date_str"] == today_str and USD_CACHE["price"] > 0:
        return USD_CACHE["price"]
        
    if SCRAPING_AVAILABLE:
        try:
            # تنظیم هدرهای مرورگر برای جلوگیری از مسدود شدن توسط وب‌سایت مقصد
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'}
            url = "https://www.tgju.org/profile/price_dollar_rl"
            response = requests.get(url, headers=headers, timeout=3)
            
            if response.status_code == 200:
                
                # --- شروع کد جایگزین شده (نسخه اصلاح شده) ---
                # تلاش اول: پیدا کردن قیمت با جستجوی هوشمند (Regex)
                match = re.search(r'price_dollar_rl.*?(\d{1,3}(?:,\d{3})+)', response.text, re.DOTALL | re.IGNORECASE)
                
                class MockElement:
                    def __init__(self, text): self.text = text

                if match:
                    # ساخت متغیر price_span به صورت مصنوعی تا کدهای پایین خطا ندهند
                    price_span = MockElement(match.group(1))
                else:
                    # تلاش دوم: روش قدیمی
                    soup = BeautifulSoup(response.text, 'html.parser')
                    price_span = soup.find("span", {"data-col": "info.last_trade.prc"})
                # --- پایان کد جایگزین شده ---
                if price_span:
                    raw_price = price_span.text.replace(',', '')
                    price = float(raw_price) / 10 # تبدیل ریال به تومان
                    
                    # به‌روزرسانی حافظه موقت
                    USD_CACHE["price"] = price
                    USD_CACHE["date_str"] = today_str
                    USD_CACHE["status"] = "online"
                    
                    # ذخیره آخرین قیمت موفق در تنظیمات دیتابیس (اصلاح شده برای MySQL)
                    try:
                        conn = get_db_connection()
                        cursor = conn.cursor()
                        # در MySQL کلمه key رزرو شده است، از بک‌تیک استفاده می‌کنیم
                        query = "INSERT INTO app_config (`key`, `value`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)"
                        cursor.execute(query, ('last_usd_info', json.dumps(USD_CACHE)))
                        conn.commit()
                        cursor.close()
                        conn.close()
                    except: pass
                    return price
        except Exception as e: 
            print(f"[WARNING] USD Scraper Error: {e}")
            
    # در صورت شکست در دریافت آنلاین، تلاش برای خواندن آخرین قیمت ذخیره شده در دیتابیس
    if USD_CACHE["price"] == 0:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT `value` FROM app_config WHERE `key` = %s", ('last_usd_info',))
            row = cursor.fetchone()
            if row:
                saved_info = json.loads(row['value'])
                USD_CACHE["price"] = saved_info.get("price", 0)
                USD_CACHE["date_str"] = saved_info.get("date_str", "")
                USD_CACHE["status"] = "offline_db"
            cursor.close()
            conn.close()
        except: pass
    return USD_CACHE["price"]

# ------------------------------------------------------------------------------
# [تگ: سرویس نظارتی واتچ‌داگ]
# این سرویس در یک ترد (Thread) جداگانه اجرا شده و فعالیت کلاینت را رصد می‌کند.
# اگر کلاینت غیرفعال شود یا سیگنال خروج بفرستد، سرور را متوقف می‌کند.
# ------------------------------------------------------------------------------
def watchdog_service(server_state, timeout):
    """سرویس نظارت برای بستن خودکار برنامه در صورت عدم فعالیت کلاینت"""
    time.sleep(3) # وقفه اولیه برای لود شدن کامل برنامه
    server_state["last_heartbeat"] = time.time()
    
    while True:
        current_time = time.time()
        
        # بررسی سیگنال بسته شدن دستی کلاینت
        if server_state["shutdown_trigger"]:
            time.sleep(3) 
            if server_state["shutdown_trigger"]:
                print("--- Graceful Shutdown ---")
                os._exit(0)
                
        # بررسی انقضای زمان Heartbeat (عدم پاسخگویی کلاینت)
        if current_time - server_state["last_heartbeat"] > timeout:
            print(f"--- Watchdog Timeout ({timeout}s) ---")
            os._exit(0)
            
        time.sleep(5) # وقفه بین هر نوبت بررسی وضعیت