import sqlite3
import hashlib
import os

# نام فایل دیتابیس
DB_FILE = 'nexus_warehouse.db'

def hash_password(password):
    """هش کردن رمز عبور با الگوریتم SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def reset_password_tool():
    print("==========================================")
    print("   ابزار بازنشانی رمز عبور نکسوس (Nexus)   ")
    print("==========================================")
    
    if not os.path.exists(DB_FILE):
        print(f"[!] خطا: فایل دیتابیس '{DB_FILE}' پیدا نشد.")
        input("اینتر را بزنید تا خارج شوید...")
        return

    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # نمایش لیست کاربران
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()

        if not users:
            print("[!] هیچ کاربری در سیستم یافت نشد.")
            conn.close()
            return

        print("\nلیست کاربران موجود:")
        print("-" * 30)
        print(f"{'ID':<5} {'نام کاربری':<15} {'نقش':<10}")
        print("-" * 30)
        
        valid_ids = []
        for u in users:
            print(f"{u[0]:<5} {u[1]:<15} {u[2]:<10}")
            valid_ids.append(str(u[0]))
        print("-" * 30)

        # دریافت ID کاربر
        while True:
            target_id = input("\n> آی‌دی (ID) کاربری که می‌خواهید رمزش را عوض کنید وارد کنید: ").strip()
            if target_id in valid_ids:
                break
            print("(!) آی‌دی نامعتبر است. لطفاً عدد صحیح وارد کنید.")

        # دریافت رمز جدید
        new_pass = input("> رمز عبور جدید را وارد کنید: ").strip()
        if len(new_pass) < 4:
            print("(!) رمز عبور باید حداقل ۴ کاراکتر باشد.")
            conn.close()
            input("اینتر بزنید...")
            return

        # اعمال تغییرات
        hashed_pass = hash_password(new_pass)
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (hashed_pass, target_id))
        conn.commit()
        
        print(f"\n[OK] رمز عبور با موفقیت تغییر کرد.")
        print("حالا می‌توانید با رمز جدید وارد شوید.")

        conn.close()

    except Exception as e:
        print(f"\n[ERROR] خطای سیستمی: {e}")

    input("\nبرای خروج اینتر را بزنید...")

if __name__ == "__main__":
    reset_password_tool()