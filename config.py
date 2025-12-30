# =========================================================================
# نام فایل: config.py
# نویسنده: سرگلی
# نسخه: V0.20
# * کلیات عملکرد و توابع:
# این فایل وظیفه نگهداری تمام تنظیمات ثابت، مسیرهای فایل، پورت‌های شبکه
# و پیکربندی‌های پیش‌فرض قطعات (مانند مقاومت، خازن و...) را بر عهده دارد.
# * بخش‌های کلیدی:
# 1. Base Setup: تعیین مسیر پایه اجرای برنامه (چه در حالت اسکریپت و چه در حالت فایل اجرایی).
# 2. System Constants: تعریف پورت سرور، مسیر دیتابیس، پوشه‌های آپلود و بک‌آپ.
# 3. Component Config: دیکشنری جامع تنظیمات پیش‌فرض برای انواع قطعات الکترونیکی.
# =========================================================================

import os
import sys

# =========================================================================
# بخش تعیین مسیر پایه (BASE DIRECTORY SETUP)
# =========================================================================

# تشخیص مسیر اجرای برنامه (سازگار با PyInstaller و اجرای مستقیم پایتون)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# =========================================================================
# بخش ثابت‌های پیکربندی سیستم (SYSTEM CONFIGURATION CONSTANTS)
# =========================================================================

API_PORT = 8090
DATABASE_FILE = os.path.join(BASE_DIR, 'nexus_warehouse.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
BACKUP_FOLDER = os.path.join(BASE_DIR, 'backups')
INDEX_FILE = os.path.join(BASE_DIR, 'index.html')
SERVER_URL = f'http://127.0.0.1:{API_PORT}'
HEARTBEAT_TIMEOUT = 70  # زمان (ثانیه) برای تشخیص قطعی کلاینت

# =========================================================================
# بخش تنظیمات پیش‌فرض قطعات (DEFAULT COMPONENT CONFIGURATION)
# =========================================================================

# این دیکشنری ساختار پیش‌فرض دسته‌بندی‌ها، واحدها، پکیج‌ها و پارامترهای فنی را تعریف می‌کند
DEFAULT_COMPONENT_CONFIG = {
    "General": {
        "label": "تنظیمات عمومی (General)",
        "icon": "settings",
        "locations": ["کشوی A1", "کشوی A2", "کشوی A3", "قفسه B1", "قفسه B2", "جعبه ابزار"],
        "units": [], "packages": [], "techs": [], "paramOptions": []
    },
    "Resistor": {
        "label": "مقاومت (Resistor)", "icon": "zap", "units": ["R", "k", "M"],
        "paramLabel": "توان (Watt)",
        "paramOptions": ["1/10W", "1/8W", "1/4W", "1/2W", "1W", "2W", "3W", "5W", "10W", "20W"],
        "packages": ["0201", "0402", "0603", "0805", "1206", "1210", "2010", "2512", "Axial", "DIP", "Power"],
        "techs": ["General Purpose", "Precision", "Thin Film", "Thick Film", "Wirewound", "Metal Oxide", "Carbon Film"]
    },
    "Capacitor": {
        "label": "خازن (Capacitor)", "icon": "battery", "units": ["pF", "nF", "uF", "mF", "F"],
        "paramLabel": "ولتاژ (Voltage)",
        "paramOptions": ["4V", "6.3V", "10V", "16V", "25V", "35V", "50V", "63V", "100V", "200V", "250V", "400V", "450V", "630V", "1kV"],
        "packages": ["0402", "0603", "0805", "1206", "1210", "Radial", "SMD Can (V-Chip)", "Snap-in", "Axial"],
        "techs": ["Ceramic (MLCC) X7R", "Ceramic (MLCC) C0G/NP0", "Ceramic (MLCC) X5R", "Electrolytic", "Tantalum", "Polymer", "Film"]
    },
    "Inductor": {
        "label": "سلف (Inductor)", "icon": "waves", "units": ["nH", "uH", "mH", "H"],
        "paramLabel": "جریان (Current)",
        "paramOptions": ["100mA", "250mA", "500mA", "1A", "2A", "3A", "5A", "10A"],
        "packages": ["0402", "0603", "0805", "1206", "CDRH", "Power SMD", "Toroidal", "Axial"],
        "techs": ["Ferrite Bead", "Multilayer", "Wirewound", "Power Inductor", "Air Core", "Shielded"]
    },
    "Diode": {
        "label": "دیود (Diode)", "icon": "arrow-right-circle", "units": ["-"],
        "paramLabel": "ولتاژ/جریان",
        "paramOptions": ["Low Power", "High Speed", "Schottky", "Zener"],
        "packages": ["SOD-123", "SOD-323", "SMA", "SMB", "SMC", "DO-35", "DO-41", "TO-220"],
        "techs": ["Rectifier", "Zener", "Schottky", "Switching", "TVS", "Bridge", "LED"]
    },
    "Transistor": {
        "label": "ترانزیستور (Transistor)", "icon": "cpu", "units": ["-"],
        "paramLabel": "Rating",
        "paramOptions": ["Small Signal", "Power"],
        "packages": ["SOT-23", "SOT-223", "TO-92", "TO-220", "DPAK", "D2PAK"],
        "techs": ["BJT (NPN)", "BJT (PNP)", "MOSFET (N-Ch)", "MOSFET (P-Ch)", "IGBT", "JFET"]
    },
    "IC": {
        "label": "آی‌سی (IC)", "icon": "box-select", "units": ["-"],
        "paramLabel": "نوع پکیج",
        "paramOptions": ["DIP", "SMD"],
        "packages": ["SOIC-8", "SOIC-16", "TSSOP", "QFP", "QFN", "BGA", "DIP-8", "DIP-16"],
        "techs": ["Microcontroller", "Op-Amp", "Regulator", "Memory", "Logic", "Driver", "Sensor"]
    },
    "Connector": {
        "label": "کانکتور (Connector)", "icon": "plug", "units": ["Pin"],
        "paramLabel": "Pitch",
        "paramOptions": ["1.27mm", "2.0mm", "2.54mm", "3.81mm", "5.08mm"],
        "packages": ["Through Hole", "SMD", "Right Angle"],
        "techs": ["Header", "Terminal Block", "USB", "Jack", "Socket"]
    }
}