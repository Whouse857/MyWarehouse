import sqlite3
import hashlib
import json
import os
import sys
import time

# Database file name
DB_FILE = 'nexus_warehouse.db'

def hash_password(password):
    """Hashes the password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def fix_ahmad():
    print(f"--- Starting activation for user 'ahmad' ---")
    
    # 1. Locate database
    db_path = os.path.join(os.getcwd(), DB_FILE)
    
    if not os.path.exists(db_path):
        print(f"ERROR: File '{DB_FILE}' not found in current directory.")
        print("Please place this script exactly next to 'nexus_warehouse.db'.")
        input("\nPress Enter to exit...")
        return

    try:
        # 2. Connect to database
        conn = sqlite3.connect(db_path, timeout=10) # Added timeout to wait slightly for lock release
        cursor = conn.cursor()

        # 3. Define Full Admin Permissions
        full_permissions = {
            "entry": True,
            "withdraw": True,
            "inventory": True,
            "contacts": True,
            "log": True,
            "users": True,
            "management": True,
            "backup": True
        }
        perms_json = json.dumps(full_permissions)
        
        # 4. User Credentials
        username = 'ahmad'
        password_raw = '1234'
        password_hashed = hash_password(password_raw)
        
        # 5. Check existing user
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        existing_user = cursor.fetchone()

        if existing_user:
            print(f"-> User '{username}' found in database.")
            print("-> Resetting password and upgrading to Admin...")
            
            # Update existing user
            cursor.execute("""
                UPDATE users 
                SET password = ?, role = 'admin', full_name = 'Eng. Ahmad', permissions = ?
                WHERE username = ?
            """, (password_hashed, perms_json, username))
        else:
            print(f"-> User '{username}' NOT found.")
            print("-> Creating new user...")
            
            # Create new user
            cursor.execute("""
                INSERT INTO users (username, password, role, full_name, mobile, permissions) 
                VALUES (?, ?, 'admin', 'Eng. Ahmad', '09120000000', ?)
            """, (username, password_hashed, perms_json))

        conn.commit()
        conn.close()
        
        print("\nSUCCESS: Operation completed successfully!")
        print("="*40)
        print(f"Username : {username}")
        print(f"Password : {password_raw}")
        print("Role     : Admin")
        print("="*40)
        print("You can now restart the main server (warehouse_app.py) and login.")

    except sqlite3.OperationalError as e:
        if "locked" in str(e):
            print("\nCRITICAL ERROR: DATABASE IS LOCKED!")
            print("-----------------------------------")
            print("CAUSE: The main application (warehouse_app.py) is currently running.")
            print("SOLUTION: Please CLOSE the main application/server window and try again.")
        else:
            print(f"\nDatabase Error: {e}")

    except Exception as e:
        print(f"\nUnexpected Error: {e}")

    input("\nPress Enter to exit...")

if __name__ == "__main__":
    fix_ahmad()