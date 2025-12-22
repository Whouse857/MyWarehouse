# --- [فایل سرویس‌های جانبی: قیمت دلار و واتچ‌داگ] ---
import time
import json
import os
from datetime import datetime
from database import get_db_connection

# کش برای قیمت دلار
USD_CACHE = {
    "price": 0,
    "date_str": "",
    "status": "init"
}

try:
    import requests
    from bs4 import BeautifulSoup
    SCRAPING_AVAILABLE = True
except ImportError:
    SCRAPING_AVAILABLE = False

def fetch_daily_usd_price():
    """دریافت قیمت لحظه‌ای دلار از وب‌سایت TGJU"""
    global USD_CACHE
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if USD_CACHE["date_str"] == today_str and USD_CACHE["price"] > 0:
        return USD_CACHE["price"]
        
    if SCRAPING_AVAILABLE:
        try:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'}
            url = "https://www.tgju.org/profile/price_dollar_rl"
            response = requests.get(url, headers=headers, timeout=3)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                price_tag = soup.find("span", {"data-col": "info.last_price"}) or soup.select_one(".value > span")
                if price_tag:
                    price = float(price_tag.text.strip().replace(',', ''))
                    if price > 100000: price = price / 10 # تبدیل ریال به تومان اگر لازم بود
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
            
    # اگر اسکرپینگ شکست خورد، از دیتابیس بخوان
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

def watchdog_service(server_state, timeout):
    """سرویس نظارت برای بستن خودکار برنامه در صورت عدم فعالیت کلاینت"""
    time.sleep(3)
    server_state["last_heartbeat"] = time.time()
    while True:
        current_time = time.time()
        if server_state["shutdown_trigger"]:
            time.sleep(3) 
            if server_state["shutdown_trigger"]:
                print("--- Graceful Shutdown ---")
                os._exit(0)
        if current_time - server_state["last_heartbeat"] > timeout:
            print(f"--- Watchdog Timeout ({timeout}s expired) ---")
            os._exit(0)
        time.sleep(2)