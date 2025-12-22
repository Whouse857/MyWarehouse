// [TAG: PAGE_INVENTORY]
// صفحه آمار و موجودی انبار با طراحی مدرن

const StatCard = ({ title, value, subtitle, icon, color, delay }) => (
    <div className={`glass-panel p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 animate-scale-in`} style={{ animationDelay: `${delay}ms` }}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-xs font-bold mb-1">{title}</p>
                <h3 className="text-2xl font-black text-white tracking-tight ltr font-mono">
                    {value}
                </h3>
                {subtitle && <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center text-${color}-400 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                <i data-lucide={icon} className="w-5 h-5"></i>
            </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-${color}-600 to-${color}-400 transition-all duration-1000 w-full opacity-50`}></div>
    </div>
);

const InventoryPage = () => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const notify = useNotify();

    const loadStats = React.useCallback(async () => {
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/inventory/stats');
            if (ok) setStats(data);
            else notify.show('خطا', 'عدم دریافت اطلاعات آماری', 'error');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { loadStats(); }, [loadStats]);
    useLucide([stats]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
                <div className="w-12 h-12 border-4 border-nexus-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-nexus-primary font-bold animate-pulse">در حال تحلیل داده‌های انبار...</p>
            </div>
        );
    }

    if (!stats) return null;

    // محاسبه بیشترین مقدار برای نرمال‌سازی نمودارها
    const maxCatValue = Math.max(...Object.values(stats.categories).map(c => c.value)) || 1;

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scroll">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">گزارش تحلیلی انبار</h2>
                    <p className="text-gray-400 text-xs mt-1">وضعیت کلی دارایی‌ها و کسری‌ها</p>
                </div>
                <button onClick={loadStats} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition hover:rotate-180 duration-500">
                    <i data-lucide="refresh-ccw" className="w-5 h-5"></i>
                </button>
            </header>

            {/* کارت‌های آماری بالا */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="ارزش کل (تومان)" 
                    value={formatNumberWithCommas(stats.total_value_toman)} 
                    subtitle="مجموع دارایی ریالی"
                    icon="banknote" 
                    color="emerald" 
                    delay={0}
                />
                <StatCard 
                    title="ارزش تقریبی (دلار)" 
                    value={`$${formatNumberWithCommas(stats.total_value_usd)}`} 
                    subtitle="بر اساس نرخ تبدیل ثبت شده"
                    icon="dollar-sign" 
                    color="blue" 
                    delay={100}
                />
                <StatCard 
                    title="تعداد کل قطعات" 
                    value={formatNumberWithCommas(stats.total_quantity)} 
                    subtitle={`در ${stats.total_items} ردیف مجزا`}
                    icon="layers" 
                    color="purple" 
                    delay={200}
                />
                 <StatCard 
                    title="اقلام نیازمند خرید" 
                    value={stats.shortages.length} 
                    subtitle="موجودی کمتر از حد مجاز"
                    icon="alert-octagon" 
                    color="rose" 
                    delay={300}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* بخش کسری موجودی */}
                <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)] flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <i data-lucide="shopping-basket" className="w-5 h-5 text-rose-400"></i>
                            لیست سفارش خرید (Shortages)
                        </h3>
                        <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg font-mono">{stats.shortages.length} item</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-3">
                        {stats.shortages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-emerald-400/50 gap-4">
                                <i data-lucide="check-circle-2" className="w-16 h-16"></i>
                                <p className="text-sm font-bold">وضعیت موجودی عالی است!</p>
                            </div>
                        ) : (
                            stats.shortages.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 hover:bg-rose-500/10 transition group">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white ltr font-mono">{item.val}</span>
                                            <span className="text-[10px] text-gray-400 bg-black/20 px-1.5 rounded">{item.pkg}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <i data-lucide="map-pin" className="w-3 h-3"></i>
                                            <span>{item.loc || 'بدون آدرس'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2 text-xs font-mono mb-1">
                                            <span className="text-rose-400 font-bold">{item.qty}</span>
                                            <span className="text-gray-600">/</span>
                                            <span className="text-gray-400">{item.min}</span>
                                        </div>
                                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-rose-500 rounded-full" 
                                                style={{ width: `${Math.min((item.qty / item.min) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* بخش نمودار دسته‌بندی */}
                <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/5 flex flex-col h-[500px]">
                    <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5 flex items-center gap-2">
                        <i data-lucide="pie-chart" className="w-5 h-5 text-nexus-accent"></i>
                        ارزش موجودی به تفکیک دسته
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto custom-scroll pr-2 space-y-5">
                        {Object.entries(stats.categories)
                            .sort(([, a], [, b]) => b.value - a.value)
                            .map(([cat, data], idx) => {
                                const percent = (data.value / maxCatValue) * 100;
                                const colors = ['from-blue-500 to-cyan-400', 'from-purple-500 to-fuchsia-400', 'from-orange-500 to-amber-400', 'from-emerald-500 to-teal-400', 'from-pink-500 to-rose-400'];
                                const colorClass = colors[idx % colors.length];
                                
                                return (
                                    <div key={cat} className="group">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-gray-300">{cat}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{formatNumberWithCommas(data.value)} T</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
                                            <div 
                                                className={`h-full rounded-full bg-gradient-to-r ${colorClass} opacity-80 group-hover:opacity-100 transition-all duration-1000 ease-out`}
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-right mt-1">
                                            <span className="text-[9px] text-gray-600">{formatNumberWithCommas(data.count)} قطعه</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.InventoryPage = InventoryPage;