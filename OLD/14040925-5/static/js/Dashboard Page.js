// [TAG: PAGE_DASHBOARD]
// صفحه اصلی داشبورد
// تغییرات: نمایش هوشمند کارت‌ها بر اساس سطح دسترسی

const DashboardPage = ({ setView, user }) => {
    // دسترسی‌ها رو از آبجکت کاربر میخونیم. اگر ادمین بود همه چی مجازه.
    const perms = user.permissions || {};
    const isAdmin = user.role === 'admin';

    // تابع کمکی برای چک کردن دسترسی
    const hasPerm = (key) => isAdmin || perms[key];

    // لیست تمام کارت‌های ممکن با کلید دسترسی مربوطه (reqPerm)
    const allItems = [
        { 
            title: "ورود قطعه", 
            icon: "package-plus", 
            color: "text-green-400", 
            desc: "افزودن و ویرایش قطعات", 
            view: "entry", 
            reqPerm: 'entry' 
        },
        { 
            title: "برداشت قطعه", 
            icon: "arrow-down-circle", 
            color: "text-red-400", 
            desc: "ثبت خروج قطعات مصرفی", 
            view: "withdraw", 
            reqPerm: 'withdraw' 
        },
        { 
            title: "موجودی انبار", 
            icon: "bar-chart-2", 
            color: "text-blue-400", 
            desc: "گزارش‌گیری و آمار", 
            view: "inventory", 
            reqPerm: 'inventory' 
        },
        { 
            title: "تامین‌کنندگان", 
            icon: "contact-2", 
            color: "text-purple-400", 
            desc: "مدیریت لیست فروشندگان", 
            view: "contacts", 
            reqPerm: 'contacts' 
        },
        { 
            title: "مدیریت کاربران", 
            icon: "users", 
            color: "text-pink-400", 
            desc: "تعریف کاربر و سطح دسترسی", 
            view: "users", 
            reqPerm: 'users' 
        },
        { 
            title: "مدیریت لیست‌ها", 
            icon: "list-checks", 
            color: "text-orange-400", 
            desc: "ویرایش پکیج‌ها و مشخصات", 
            view: "management", 
            reqPerm: 'management' 
        },
        { 
            title: "پشتیبان‌گیری", 
            icon: "database-backup", 
            color: "text-teal-400", 
            desc: "مدیریت فایل‌های بک‌آپ", 
            view: "backup", 
            reqPerm: 'backup' 
        },
        { 
            title: "تاریخچه تراکنش‌ها", 
            icon: "history", 
            color: "text-amber-400", 
            desc: "لاگ کامل خرید و ورود", 
            view: "log", 
            full: true, // کارت عریض
            reqPerm: 'log' 
        }
    ];

    // فقط کارت‌هایی رو نشون بده که کاربر دسترسی داره
    const visibleItems = allItems.filter(item => hasPerm(item.reqPerm));

    useLucide([visibleItems]);

    return (
        <div className="flex-1 p-8">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-white tracking-tight">داشبورد سیستم</h2>
                <p className="text-xs text-gray-500 mt-1">
                    کاربر فعال: <span className="text-nexus-accent">{user.full_name || user.username}</span> | نقش: {isAdmin ? 'مدیر سیستم' : 'اپراتور'}
                </p>
            </header>
            
            {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 glass-panel rounded-2xl border border-white/5">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <i data-lucide="lock" className="w-8 h-8 opacity-50"></i>
                    </div>
                    <p className="font-bold">دسترسی محدود</p>
                    <p className="text-xs mt-1">شما مجوز دسترسی به هیچ ماژولی را ندارید.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto animate-in">
                    {visibleItems.map((item) => (
                        <div 
                            key={item.view} 
                            onClick={() => setView(item.view)} 
                            className={`cursor-pointer group relative overflow-hidden glass-panel hover:border-nexus-primary/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-between h-48 ${item.full ? 'col-span-1 md:col-span-2 lg:col-span-4' : ''}`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-800/50 group-hover:bg-nexus-primary/20 transition-colors border border-white/5`}>
                                    <i data-lucide={item.icon} className={`w-6 h-6 ${item.color}`}></i>
                                </div>
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

window.DashboardPage = DashboardPage;