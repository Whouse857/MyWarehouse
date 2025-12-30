# =========================================================================
# نام فایل: auth_utils.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این ماژول شامل توابع کمکی برای امنیت و احراز هویت است.
# وظیفه اصلی آن هش کردن رمزهای عبور و پردازش ساختارهای پیچیده سطوح دسترسی (Permissions) است.
# * توابع و بخش‌های کلیدی:
# 1. hash_password: تبدیل رمز عبور متنی به هش SHA-256 برای ذخیره‌سازی امن.
# 2. parse_permissions_recursive: تحلیل و استخراج سطوح دسترسی از رشته‌های JSON تو در تو.
# =========================================================================

import hashlib
import json

# =========================================================================
# نام تابع: hash_password
# کارایی: هش کردن رمز عبور برای امنیت بیشتر (SHA-256)
# =========================================================================
def hash_password(password: str) -> str:
    """هش کردن رمز عبور برای امنیت بیشتر"""
    return hashlib.sha256(password.encode()).hexdigest()

# =========================================================================
# نام تابع: parse_permissions_recursive
# کارایی: تجزیه تحلیل سطوح دسترسی به صورت بازگشتی (تبدیل رشته‌های JSON به دیکشنری)
# =========================================================================
def parse_permissions_recursive(data, depth=0):
    """تجزیه تحلیل سطوح دسترسی به صورت بازگشتی"""
    if depth > 3: return {}
    if data is None: return {}
    if isinstance(data, dict): return data
    if isinstance(data, str):
        cleaned = data.strip()
        if not cleaned or cleaned.lower() == "null" or cleaned == "{}": return {}
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, str): return parse_permissions_recursive(parsed, depth + 1)
            elif isinstance(parsed, dict): return parsed
            else: return {}
        except json.JSONDecodeError: return {}
    return {}