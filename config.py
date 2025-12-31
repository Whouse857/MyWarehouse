# ==============================================================================
# نسخه: 0.20
# فایل: config.py
# تهیه کننده: ------
# توضیح توابع و ماژول های استفاده شده در برنامه:
# این ماژول وظیفه نگهداری تمامی ثابت‌ها، مسیرهای فایل، تنظیمات شبکه و 
# پیکربندی پیش‌فرض قطعات الکترونیک را بر عهده دارد. تغییر در این فایل 
# مستقیماً بر روی رفتار کلی سیستم و نحوه نمایش فیلدها تاثیر می‌گذارد.
# ==============================================================================

import os
import sys

# ------------------------------------------------------------------------------
# [تگ: تعیین مسیرهای پایه]
# شناسایی مسیر اجرای برنامه (حالت فایل اجرایی یا اسکریپت) جهت آدرس‌دهی صحیح فایل‌ها.
# ------------------------------------------------------------------------------
if getattr(sys, 'frozen', False):
    # مسیر در صورتی که برنامه بصورت EXE اجرا شود
    BASE_DIR = os.path.dirname(sys.executable)
else:
    # مسیر در صورتی که برنامه بصورت اسکریپت پایتون اجرا شود
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------------------------
# [تگ: ثابت‌های سیستمی]
# تعریف پورت اتصال، مسیر دیتابیس، پوشه‌های آپلود و بک‌آپ.
# ------------------------------------------------------------------------------
API_PORT = 8090
DATABASE_FILE = os.path.join(BASE_DIR, 'nexus_warehouse.db')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
BACKUP_FOLDER = os.path.join(BASE_DIR, 'backups')
INDEX_FILE = os.path.join(BASE_DIR, 'index.html')
SERVER_URL = f'http://127.0.0.1:{API_PORT}'
HEARTBEAT_TIMEOUT = 70

# ------------------------------------------------------------------------------
# [تگ: پیکربندی پیش‌فرض قطعات]
# تعریف ساختار نمایش، واحدها، پکیج‌ها و پارامترهای فنی برای هر دسته از قطعات.
# ------------------------------------------------------------------------------
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
        "paramOptions": ["1/8W", "1/4W", "1/2W", "1W", "2W", "5W", "10W"],
        "packages": ["0402", "0603", "0805", "1206", "2512", "Axial Small", "Axial Large"],
        "techs": ["Thick Film", "Thin Film", "Metal Film", "Wirewound", "Carbon Film"]
    },
    "Capacitor": {
        "label": "خازن (Capacitor)", "icon": "battery-charging", "units": ["pF", "nF", "uF", "mF"],
        "paramLabel": "ولتاژ (Voltage)",
        "paramOptions": ["6.3V", "10V", "16V", "25V", "35V", "50V", "100V", "250V", "400V", "1KV"],
        "packages": ["0402", "0603", "0805", "1206", "Radial D5", "Radial D8", "Radial D10", "Tantalum A", "Tantalum B"],
        "techs": ["Ceramic (MLCC)", "Electrolytic", "Tantalum", "Film", "Supercapacitor"]
    },
    "Inductor": {
        "label": "سلف (Inductor)", "icon": "Activity", "units": ["uH", "mH", "H"],
        "paramLabel": "جریان (Current)",
        "paramOptions": ["100mA", "500mA", "1A", "2A", "5A"],
        "packages": ["0603", "0805", "1206", "CD43", "CD54", "CD75", "Axial"],
        "techs": ["Wirewound", "Multilayer", "Power Core", "Shielded"]
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
        "paramOptions": ["Standard", "Interface", "Power", "Logic", "MCU"],
        "packages": ["DIP-8", "DIP-14", "DIP-16", "SOIC-8", "SOIC-14", "SOIC-16", "SOT-23-5", "SOT-23-6", "TQFP", "QFN", "BGA"],
        "techs": ["Linear", "Digital", "Mixed Signal", "Memory", "Processor"]
    },
    "Connector": {
        "label": "کانکتور (Connector)", "icon": "link-2", "units": ["Pin"],
        "paramLabel": "Pitch",
        "paramOptions": ["1.27mm", "2.00mm", "2.54mm", "3.81mm", "5.08mm"],
        "packages": ["Header Male", "Header Female", "XH", "PH", "KF301", "DB9", "USB-C", "Micro-USB"],
        "techs": ["Wire-to-Board", "Board-to-Board", "Power", "Data", "RF/Coaxial"]
    }
}