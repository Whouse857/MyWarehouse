// ====================================================================================================
// نسخه: 0.20
// فایل: admin_server.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل حاوی کامپوننت `ServerSettingsPage` است که رابط کاربری تنظیمات هسته سرور را فراهم می‌کند.
// 
// وظایف اصلی:
// ۱. نمایش و ویرایش اطلاعات اتصال به دیتابیس MySQL (آدرس، پورت، نام کاربری، رمز عبور).
// ۲. تنظیم مسیر فایل‌های اجرایی حیاتی برای بک‌آپ و ریستور (mysqldump.exe و mysql.exe).
// ۳. ذخیره تنظیمات در فایل `server_config.json` سمت سرور.
// ۴. نمایش راهنما و هشدارهای امنیتی برای جلوگیری از قطع اتصال اشتباه.
//
// نکته مهم: این تنظیمات مستقیماً بر عملکرد کل سیستم و ارتباط با داده‌ها تاثیر می‌گذارد.
// ====================================================================================================

// استخراج هوک‌های مورد نیاز از کتابخانه React
const { useState, useEffect } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت تنظیمات سرور]
// ----------------------------------------------------------------------------------------------------
const ServerSettingsPage = ({ serverStatus }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // config: آبجکت حاوی تمام پارامترهای تنظیمات. مقادیر پیش‌فرض برای راهنمایی کاربر قرار داده شده‌اند.
    // showPass: وضعیت نمایش یا مخفی بودن فیلد رمز عبور.
    // loading: وضعیت در حال پردازش بودن درخواست‌ها.
    // ------------------------------------------------------------------------------------------------
    // خط ۴۴ تا ۴۸ فایل admin_server.js را با این جایگزین کنید:
    const [config, setConfig] = useState({
        host: '', user: '', password: '', database: '', port: 3306,
        // اینجا آدرس‌های پیش‌فرض را می‌نویسیم تا کاربر ببیند و الگوی صحیح را بداند
        mysqldump_path: 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe', 
        mysql_client_path: 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe'
    });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // استفاده از توابع کمکی سراسری برای اعلان و دیالوگ (تعریف شده در Main Application)
    const notify = useNotify();
    const dialog = useDialog();

    // ------------------------------------------------------------------------------------------------
    // [تگ: دریافت تنظیمات]
    // دریافت تنظیمات فعلی ذخیره شده در فایل کانفیگ سرور هنگام لود صفحه.
    // ------------------------------------------------------------------------------------------------
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // فراخوانی API اختصاصی تنظیمات سرور
                const { ok, data } = await fetchAPI('/admin/server-settings');
                // ترکیب داده‌های دریافتی با مقادیر پیش‌فرض استیت
                if (ok) setConfig(prev => ({ ...prev, ...data }));
            } catch (e) {
                console.error("Error loading server settings", e);
            }
        };
        loadSettings();
    }, []);

    // رفرش آیکون‌های Lucide در صورت تغییر وضعیت لودینگ
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [loading]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: ذخیره تنظیمات]
    // ارسال تنظیمات جدید به سرور برای ذخیره‌سازی.
    // شامل نمایش هشدار جدی به کاربر، زیرا تنظیمات غلط باعث از کار افتادن برنامه می‌شود.
    // ------------------------------------------------------------------------------------------------
    const handleSave = async () => {
        const confirmed = await dialog.ask(
            "تغییر تنظیمات سرور", 
            "هشدار: تغییر اشتباه مشخصات سرور باعث قطع دسترسی کل سیستم به دیتابیس می‌شود. آیا از صحت اطلاعات اطمینان دارید؟", 
            "warning"
        );

        if (confirmed) {
            setLoading(true);
            try {
                const { ok, data } = await fetchAPI('/admin/server-settings', {
                    method: 'POST',
                    body: config
                });
                if (ok) {
                    notify.show('موفقیت', "تنظیمات با موفقیت در فایل server_config.json ذخیره شد. لطفاً یک بار برنامه پایتون را بازنشانی کنید.", 'success');
                } else {
                    notify.show('خطا', data.error || "خطا در ذخیره‌سازی تنظیمات", 'error');
                }
            } catch (e) {
                notify.show('خطای شبکه', "ارتباط با سرور برقرار نشد.", 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ساختار فرم تنظیمات شامل کارت‌های شیشه‌ای، اینپوت‌ها و توضیحات راهنما.
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scroll" dir="rtl">
            <header className="mb-8 pb-6 border-b border-white/5">
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <i data-lucide="server" className="w-8 h-8 text-blue-400"></i>
                    تنظیمات هسته سیستم
                </h2>
                <p className="text-gray-400 text-sm mt-1 font-medium">پیکربندی پارامترهای اتصال به سرور MySQL</p>
            </header>

            <div className="max-w-2xl mx-auto glass-panel p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative bg-[#0f172a]/90 overflow-hidden">
                {/* دکوراسیون گرافیکی بالای کارت */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                {/* بخش اول: اطلاعات اتصال به دیتابیس */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
                    {/* استفاده از کامپوننت NexusInput برای ظاهر یکپارچه */}
                    <NexusInput 
                        label="آدرس سرور (Host)" 
                        value={config.host} 
                        onChange={e => setConfig({...config, host: e.target.value})} 
                        dir="ltr" 
                        className="text-center font-mono text-blue-300"
                        placeholder="127.0.0.1"
                    />
                    <NexusInput 
                        label="پورت (Port)" 
                        type="number"
                        value={config.port} 
                        onChange={e => setConfig({...config, port: parseInt(e.target.value) || 0})}
                        dir="ltr" 
                        className="text-center font-mono"
                        placeholder="3306"
                    />
                    <NexusInput 
                        label="نام کاربری دیتابیس" 
                        value={config.user} 
                        onChange={e => setConfig({...config, user: e.target.value})} 
                        dir="ltr" 
                        className="text-center"
                        placeholder="root"
                    />
                    <NexusInput 
                        label="نام دیتابیس (Schema)" 
                        value={config.database} 
                        onChange={e => setConfig({...config, database: e.target.value})} 
                        dir="ltr" 
                        className="text-center text-nexus-accent font-bold"
                        placeholder="HY"
                    />
                    <div className="md:col-span-2 relative">
                        <NexusInput 
                            label="رمز عبور MySQL" 
                            type={showPass ? "text" : "password"}
                            value={config.password} 
                            onChange={e => setConfig({...config, password: e.target.value})} 
                            dir="rtl" 
                            className="nexus-input w-full px-3 py-2 text-sm placeholder-gray-500 text-center font-mono"
                            placeholder="عبارت عبور را وارد کنید..."
                        />
                        {/* دکمه نمایش/مخفی کردن رمز */}
                        <button 
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute left-3 top-9 text-gray-500 hover:text-white transition-colors"
                        >
                            <i data-lucide={showPass ? "eye-off" : "eye"} className="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                {/* بخش دوم: تنظیمات مسیر فایل‌های اجرایی (برای بک‌آپ/ریستور) */}
                <div className="glass-panel p-6 rounded-[2rem] border border-white/10 shadow-2xl relative bg-[#0f172a]/90">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="folder-cog" className="w-5 h-5 text-orange-400"></i>مسیر فایل‌های اجرایی (Binaries)</h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl text-xs text-orange-300 leading-relaxed mb-4">
                            <i data-lucide="info" className="w-4 h-4 inline-block ml-1 align-middle"></i>
                            برای بک‌آپ و ریستور، سیستم نیاز دارد بداند MySQL کجا نصب شده است. آدرس فایل‌های <b>mysqldump.exe</b> و <b>mysql.exe</b> را در زیر وارد کنید.
                        </div>
                        
                        <NexusInput 
                            label="مسیر فایل mysqldump.exe (برای بک‌آپ)" 
                            value={config.mysqldump_path || ''} 
                            onChange={e => setConfig({...config, mysqldump_path: e.target.value})} 
                            dir="ltr" 
                            className="text-left font-mono text-xs text-gray-300"
                            placeholder="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
                        />
                        
                        <NexusInput 
                            label="مسیر فایل mysql.exe (برای ریستور)" 
                            value={config.mysql_client_path || ''} 
                            onChange={e => setConfig({...config, mysql_client_path: e.target.value})} 
                            dir="ltr" 
                            className="text-left font-mono text-xs text-gray-300"
                            placeholder="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
                        />
                    </div>
                </div>

                {/* راهنمای انتهایی */}
                <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex items-start gap-4 mb-8">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <i data-lucide="info" className="w-5 h-5"></i>
                    </div>
                    <div>
                        <h4 className="text-blue-200 font-bold text-sm mb-1">راهنمای سیستمی:</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            این تنظیمات در فایل <span className="font-mono text-nexus-accent">server_config.json</span> ذخیره می‌شوند. در صورت بروز مشکل در اتصال، می‌توانید این فایل را دستی حذف کنید تا سیستم به تنظیمات پیش‌فرض بازگردد.
                        </p>
                    </div>
                </div>

                {/* دکمه ذخیره نهایی */}
                <button 
                    onClick={handleSave} 
                    disabled={loading || !serverStatus}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm shadow-xl transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                    {loading ? (
                        <i data-lucide="refresh-cw" className="animate-spin w-5 h-5"></i>
                    ) : (
                        <i data-lucide="save" className="w-5 h-5"></i>
                    )}
                    <span>ذخیره و ثبت نهایی در هسته</span>
                </button>
            </div>

            {/* لوگوی تزئینی پایین صفحه */}
            <div className="flex justify-center mt-12 opacity-10 grayscale invert pointer-events-none">
                <img src="/static/logo.png" alt="" className="h-12 w-auto" />
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: اتصال به فضای جهانی]
// اتصال کامپوننت به شیء window جهت دسترسی در سایر فایل‌ها بدون نیاز به ایمپورت ماژولار.
// ----------------------------------------------------------------------------------------------------
window.ServerSettingsPage = ServerSettingsPage;