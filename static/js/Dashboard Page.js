// ====================================================================================================
// نسخه: 0.20
// فایل: Dashboard Page.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این صفحه اولین نمایی است که کاربر پس از ورود مشاهده می‌کند (داشبورد اصلی).
// وظیفه آن نمایش کارت‌های میانبر (Shortcuts) برای دسترسی سریع به بخش‌های مختلف سیستم است.
//
// ویژگی‌های کلیدی:
// ۱. نمایش پویا بر اساس سطح دسترسی کاربر (فقط کارت‌هایی که کاربر مجوز دارد نمایش داده می‌شوند).
// ۲. طراحی بصری جذاب با آیکون‌های رنگی و افکت‌های هاور.
// ۳. کارت ویژه "تاریخچه تراکنش‌ها" که به صورت عریض در پایین صفحه قرار می‌گیرد.
// ۴. نمایش اطلاعات کاربر جاری و نقش او در هدر صفحه.
// ====================================================================================================

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت صفحه داشبورد]
// ورودی‌ها (Props):
// - setView: تابعی برای تغییر تب فعال در کامپوننت والد (Main Application).
// - user: اطلاعات کاربر لاگین شده.
// - hasPerm: تابع کمکی برای چک کردن دسترسی کاربر به هر ماژول.
// ----------------------------------------------------------------------------------------------------
const DashboardPage = ({ setView, user, hasPerm }) => {
    // تشخیص ادمین بودن برای نمایش متن نقش
    const isAdmin = user && (user.role === 'admin' || user.username === 'admin');
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: تعریف کارت‌های داشبورد]
    // آرایه‌ای از اشیاء که مشخصات هر کارت را تعیین می‌کند.
    // - title: عنوان فارسی کارت
    // - icon: نام آیکون Lucide
    // - color: کلاس رنگی آیکون (Tailwind)
    // - desc: توضیحات کوتاه زیر عنوان
    // - view: نام تب متناظر (که با کلیک روی کارت فعال می‌شود)
    // - reqPerm: کلید دسترسی مورد نیاز برای دیدن این کارت
    // ------------------------------------------------------------------------------------------------
    const allItems = [
        { title: "ورود قطعه", icon: "package-plus", color: "text-green-400", desc: "افزودن و ویرایش قطعات", view: "entry", reqPerm: 'entry' },
        { title: "برداشت قطعه", icon: "arrow-down-circle", color: "text-red-400", desc: "ثبت خروج قطعات مصرفی", view: "withdraw", reqPerm: 'withdraw' },
        { title: "موجودی انبار", icon: "bar-chart-2", color: "text-blue-400", desc: "گزارش‌گیری و آمار", view: "inventory", reqPerm: 'inventory' },
        { title: "تامین‌کنندگان", icon: "contact-2", color: "text-purple-400", desc: "مدیریت لیست فروشندگان", view: "contacts", reqPerm: 'contacts' },
        { title: "مدیریت کاربران", icon: "users", color: "text-pink-400", desc: "تعریف کاربر و سطح دسترسی", view: "users", reqPerm: 'users' },
        { title: "مدیریت لیست‌ها", icon: "list-checks", color: "text-orange-400", desc: "ویرایش پکیج‌ها و مشخصات", view: "management", reqPerm: 'management' },
        { title: "پشتیبان‌گیری", icon: "database-backup", color: "text-teal-400", desc: "مدیریت فایل‌های بک‌آپ", view: "backup", reqPerm: 'backup' },
        // --- کارت تنظیمات سرور (اضافه شده در آپدیت‌های اخیر) ---
        { title: "تنظیمات سرور", icon: "server", color: "text-blue-400", desc: "مدیریت اتصال به MySQL", view: "server", reqPerm: 'server' },
        // --- کارت تاریخچه (Full Width) ---
        { title: "تاریخچه تراکنش‌ها", icon: "history", color: "text-amber-400", desc: "لاگ کامل خرید و ورود", view: "log", full: true, reqPerm: 'log' }
    ];
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: فیلترینگ دسترسی]
    // فیلتر کردن کارت‌ها بر اساس تابع hasPerm که از والد (Main Application) دریافت شده است.
    // این روش ایمن‌ترین راه است چون منطق دسترسی به صورت مرکزی مدیریت می‌شود.
    // ------------------------------------------------------------------------------------------------
    const visibleItems = allItems.filter(item => hasPerm(item.reqPerm));
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: اثر جانبی (Effect)]
    // رندر مجدد آیکون‌ها با کمی تاخیر برای اطمینان از اینکه DOM ساخته شده است.
    // ------------------------------------------------------------------------------------------------
    React.useEffect(() => {
        setTimeout(() => {
            if (window.lucide) window.lucide.createIcons();
        }, 100);
    }, [visibleItems]);
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-8">
            {/* هدر داخلی داشبورد */}
            <header className="mb-8 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">داشبورد سیستم</h2>
                <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-gray-400">
                        کاربر فعال: <span className="text-nexus-accent font-bold">{user ? (user.full_name || user.username) : 'ناشناس'}</span>
                    </span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-400">
                        نقش: <span className={isAdmin ? "text-purple-400" : "text-blue-400"}>{isAdmin ? 'مدیر سیستم' : 'اپراتور'}</span>
                    </span>
                </div>
            </header>
            
            {/* حالت بدون دسترسی: اگر کاربر هیچ دسترسی فعالی نداشته باشد */}
            {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 glass-panel rounded-2xl border border-white/5 animate-in">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i data-lucide="lock" className="w-8 h-8 opacity-50 text-red-400"></i>
                    </div>
                    <p className="font-bold text-lg text-white">دسترسی محدود شده است</p>
                    <p className="text-xs mt-1 text-gray-400">حساب کاربری شما فعال است اما مجوز دسترسی به هیچ ماژولی را ندارید.</p>
                    <p className="text-[10px] mt-4 text-gray-600 bg-black/20 px-3 py-1 rounded">
                        اگر فکر می‌کنید اشتباهی رخ داده، با مدیر سیستم تماس بگیرید.
                    </p>
                </div>
            ) : (
                /* شبکه کارت‌ها (Grid) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto animate-in">
                    {visibleItems.map((item) => (
                        <div 
                            key={item.view} 
                            onClick={() => setView(item.view)} 
                            className={`cursor-pointer group relative overflow-hidden glass-panel hover:border-nexus-primary/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-between h-48 ${item.full ? 'col-span-1 md:col-span-2 lg:col-span-4' : ''}`}
                        >
                            {/* افکت پس‌زمینه کارت */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            
                            <div className="relative z-10">
                                {/* آیکون کارت */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-800/50 group-hover:bg-nexus-primary/20 transition-colors border border-white/5`}>
                                    <i data-lucide={item.icon} className={`w-6 h-6 ${item.color}`}></i>
                                </div>
                                {/* عنوان و توضیحات */}
                                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                                <p className="text-gray-400 text-xs">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: اتصال به فضای جهانی]
// ----------------------------------------------------------------------------------------------------
window.DashboardPage = DashboardPage;