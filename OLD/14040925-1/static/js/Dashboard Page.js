// [TAG: PAGE_DASHBOARD]
// صفحه اصلی داشبورد

const DashboardPage = ({ setView, role }) => {
    const items = [
        { title: "ورود قطعه", icon: "package-plus", color: "text-green-400", desc: "افزودن و ویرایش قطعات", view: "entry" },
        { title: "برداشت قطعه", icon: "arrow-down-circle", color: "text-red-400", desc: "ثبت خروج قطعات مصرفی", view: "withdraw" },
        { title: "موجودی انبار", icon: "bar-chart-2", color: "text-blue-400", desc: "گزارش‌گیری و آمار", view: "inventory" },
        { title: "تامین‌کنندگان", icon: "contact-2", color: "text-purple-400", desc: "مدیریت لیست فروشندگان", view: "contacts" },
        { title: "تاریخچه تراکنش‌ها", icon: "history", color: "text-amber-400", desc: "لاگ کامل خرید و ورود", view: "log", full: true }
    ];
    if (role === 'admin') {
        items.push({ title: "مدیریت کاربران", icon: "users", color: "text-pink-400", desc: "تعریف کاربر و سطح دسترسی", view: "users" });
        items.push({ title: "مدیریت لیست‌ها", icon: "list-checks", color: "text-orange-400", desc: "ویرایش پکیج‌ها و مشخصات", view: "management" });
        items.push({ title: "پشتیبان‌گیری", icon: "database-backup", color: "text-teal-400", desc: "مدیریت فایل‌های بک‌آپ", view: "backup" });
    }
    useLucide([]);
    return (
        <div className="flex-1 p-8">
            <header className="mb-8"><h2 className="text-2xl font-bold text-white tracking-tight">داشبورد سیستم</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">{items.map((item, idx) => (<div key={idx} onClick={() => setView(item.view)} className={`cursor-pointer group relative overflow-hidden glass-panel hover:border-nexus-primary/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-between h-48 ${item.full ? 'col-span-1 md:col-span-2 lg:col-span-4' : ''}`}><div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div><div className="relative z-10"><div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-800/50 group-hover:bg-nexus-primary/20 transition-colors border border-white/5`}><i data-lucide={item.icon} className={`w-6 h-6 ${item.color}`}></i></div><h3 className="text-xl font-bold text-white mb-1">{item.title}</h3><p className="text-gray-400 text-xs">{item.desc}</p></div></div>))}</div>
        </div>
    );
};

window.DashboardPage = DashboardPage;