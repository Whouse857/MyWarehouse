# --- [فایل توابع احراز هویت و امنیت] ---
import hashlib
import json

def hash_password(password: str) -> str:
    """هش کردن رمز عبور برای امنیت بیشتر"""
    return hashlib.sha256(password.encode()).hexdigest()

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