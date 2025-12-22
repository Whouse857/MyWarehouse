import os
import urllib.request

# لیست کتابخانه‌های مورد نیاز و لینک‌های آن‌ها
libraries = {
    "react.production.min.js": "https://unpkg.com/react@18/umd/react.production.min.js",
    "react-dom.production.min.js": "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
    "babel.min.js": "https://unpkg.com/@babel/standalone/babel.min.js",
    "tailwind.js": "https://cdn.tailwindcss.com",
    "framer-motion.js": "https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js",
    "axios.min.js": "https://unpkg.com/axios/dist/axios.min.js",
    "sweetalert2.all.min.js": "https://cdn.jsdelivr.net/npm/sweetalert2@11",
    "lucide.min.js": "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"
}

def download_assets():
    # ایجاد پوشه libs اگر وجود نداشته باشد
    if not os.path.exists('libs'):
        os.makedirs('libs')
        print("Folder 'libs' created.")

    print("Starting downloads...")
    
    for filename, url in libraries.items():
        filepath = os.path.join('libs', filename)
        try:
            print(f"Downloading {filename}...")
            # استفاده از User-Agent برای جلوگیری از مسدود شدن توسط برخی CDNها
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Successfully downloaded {filename}")
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

    print("\nAll downloads completed! You can now use the offline index.html.")

if __name__ == "__main__":
    download_assets()