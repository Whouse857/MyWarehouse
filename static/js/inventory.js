// [TAG: PAGE_INVENTORY]
// داشبورد پیشرفته تحلیل و آمار انبار نکسوس
// نسخه اصلاح شده: نمایش کد 12 کاراکتری اختصاصی در آمار و لیست پرینت

const formatDecimal = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatInteger = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US');
};

// تابع تولید کد اختصاصی 12 کاراکتری
const getPartCodeInv = (item, config) => {
    if (!item) return "---";
    // اولویت با کد اختصاصی ذخیره شده در دیتابیس (بسیار مهم)
    if (item.part_code) return item.part_code; 
    
    // حالت رزرو برای قطعات قدیمی که کد ندارند
    const prefix = (config && config[item.type]?.prefix) || "PRT";
    const numeric = String(item.id || 0).padStart(9, '0');
    return `${prefix}${numeric}`;
};

const KPICard = ({ title, value, subtitle, icon, color, delay = 0 }) => (
    <div 
        className={`glass-panel p-5 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-500 animate-scale-in border border-white/5 hover:border-${color}-500/30`} 
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`absolute -top-4 -right-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all duration-700`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-white tracking-tight ltr font-mono">
                    {value}
                </h3>
                <p className="text-[10px] text-gray-500 mt-2 truncate max-w-[140px]">{subtitle}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${color}-500/20 to-transparent flex items-center justify-center text-${color}-400 shadow-lg`}>
                <i data-lucide={icon} className="w-5 h-5"></i>
            </div>
        </div>
    </div>
);

const PurchaseLinks = ({ links }) => {
    if (!links || links.length === 0) return <span className="text-[10px] text-gray-600">-</span>;

    return (
        <div className="flex flex-col gap-1 items-end">
            {links.map((link, idx) => (
                <a 
                    key={idx}
                    href={link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition border border-blue-500/20 flex items-center gap-1 max-w-[120px] truncate"
                    title={link}
                >
                    <i data-lucide="external-link" className="w-3 h-3 flex-shrink-0"></i> 
                    <span>لینک {idx + 1}</span>
                </a>
            ))}
        </div>
    );
};

const InventoryPage = () => {
    const [stats, setStats] = React.useState(null);
    const [config, setConfig] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = React.useState('overview');
    const notify = useNotify();

    const loadStats = React.useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, configRes] = await Promise.all([
                fetchAPI('/inventory/stats'),
                fetchAPI('/settings/config')
            ]);
            if (statsRes.ok) setStats(statsRes.data);
            if (configRes.ok) setConfig(configRes.data);
            else notify.show('خطا', 'عدم دریافت اطلاعات آماری', 'error');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { loadStats(); }, [loadStats]);
    
    React.useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [stats, activeTab]);

    const handlePrintShortages = () => {
        if (!stats || !stats.shortages || stats.shortages.length === 0) return;
        const printWindow = window.open('', '_blank');
        const today = getJalaliDate();
        
        let htmlContent = `
            <html lang="fa" dir="rtl">
            <head>
                <title>لیست سفارش خرید - ${today}</title>
                <style>
                    body { font-family: 'Tahoma', 'Segoe UI', sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin-bottom: 5px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { border: 1px solid #444; padding: 6px; text-align: center; vertical-align: middle; }
                    th { background-color: #eee; font-weight: bold; }
                    .ltr { direction: ltr; display: inline-block; font-family: 'Consolas', monospace; font-weight: bold; }
                    .text-right { text-align: right; }
                    .empty-col { background-color: #fff; }
                    @media print { 
                        body { -webkit-print-color-adjust: exact; }
                        th { background-color: #eee !important; }
                    }
                </style>
            </head>
            <body>
                <h2>لیست سفارش خرید قطعات (کسری انبار)</h2>
                <div class="meta">تاریخ گزارش: ${today} | تعداد اقلام: ${stats.shortages.length}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">#</th>
                            <th style="width: 12%">کد اختصاصی</th>
                            <th style="width: 18%">قطعه / مقدار</th>
                            <th style="width: 10%">پکیج</th>
                            <th style="width: 20%">مشخصات فنی</th>
                            <th style="width: 10%">فروشنده قبلی</th>
                            <th style="width: 8%">موجودی</th>
                            <th style="width: 17%">تعداد خرید (دستی)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        stats.shortages.forEach((item, index) => {
            const specs = [
                item.type,
                item.watt ? item.watt : null,
                item.tolerance ? item.tolerance : null,
                item.tech ? item.tech : null
            ].filter(Boolean).join(' | ');

            const pCode = getPartCodeInv(item, config);

            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="ltr">${pCode}</span></td>
                    <td class="text-right"><span class="ltr">${item.val}</span></td>
                    <td><span class="ltr">${item.pkg || '-'}</span></td>
                    <td class="text-right">${specs}</td>
                    <td>${item.vendor || '-'}</td>
                    <td>${item.qty}</td>
                    <td class="empty-col"></td>
                </tr>
            `;
        });

        htmlContent += `</tbody></table><script>window.onload=function(){setTimeout(()=>window.print(),500);}</script></body></html>`;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-nexus-primary/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-nexus-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400 font-bold animate-pulse text-sm">در حال آنالیز داده‌های انبار...</p>
            </div>
        );
    }

    if (!stats) return null;

    const totalItems = stats.total_items || 0;
    const totalQty = stats.total_quantity || 0;
    const totalCategories = Object.keys(stats.categories).length;
    const healthScore = totalItems > 0 ? Math.round(((totalItems - stats.shortages.length) / totalItems) * 100) : 100;
    const maxCategoryVal = Math.max(...Object.values(stats.categories).map(c => c.value)) || 1;
    let topCategory = "---";
    Object.entries(stats.categories).forEach(([name, data]) => { if (data.value === maxCategoryVal) topCategory = name; });
    const avgPrice = totalQty > 0 ? (stats.total_value_toman / totalQty) : 0;

    return (
        <div className="flex-1 p-6 overflow-y-auto custom-scroll h-full">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <i data-lucide="bar-chart-2" className="w-8 h-8 text-nexus-primary"></i>
                        داشبورد تحلیل سرمایه
                    </h2>
                    <p className="text-gray-400 text-xs mt-1 font-medium">
                        نرخ دلار ({stats.usd_date ? toShamsi(stats.usd_date) : 'نامشخص'}): <span className="text-emerald-400 font-mono ltr">{stats.live_usd_price ? formatDecimal(stats.live_usd_price) : '---'} T</span>
                    </p>
                </div>
                
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                    {['overview', 'categories', 'shortages'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-nexus-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {{'overview': 'نمای کلی', 'categories': 'دسته‌بندی‌ها', 'shortages': 'کسری و سفارش'}[tab]}
                        </button>
                    ))}
                    <button onClick={loadStats} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition ml-1" title="بروزرسانی">
                        <i data-lucide="refresh-cw" className="w-4 h-4"></i>
                    </button>
                </div>
            </header>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title="ارزش کل انبار (تومان)" value={formatDecimal(stats.total_value_toman)} subtitle="محاسبه با نرخ روز" icon="wallet" color="blue" delay={0} />
                        <KPICard title="ارزش دلاری کل انبار" value={`$${formatDecimal(stats.total_value_usd_live)}`} subtitle="مجموع ارزش دلاری قطعات" icon="globe" color="emerald" delay={100} />
                        <div className="glass-panel p-4 rounded-2xl relative overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-500 animate-scale-in" style={{ animationDelay: '200ms' }}>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">وضعیت موجودی</p>
                                    <i data-lucide="layers" className="w-5 h-5 text-purple-400"></i>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center divide-x divide-x-reverse divide-white/10">
                                    <div><span className="text-[10px] text-purple-300 block mb-1">تنوع</span><span className="text-lg font-black text-white ltr font-mono">{totalItems}</span></div>
                                    <div><span className="text-[10px] text-purple-300 block mb-1">دسته‌ها</span><span className="text-lg font-black text-white ltr font-mono">{totalCategories}</span></div>
                                    <div><span className="text-[10px] text-blue-300 block mb-1">تعداد کل</span><span className="text-lg font-black text-white ltr font-mono">{formatInteger(totalQty)}</span></div>
                                </div>
                            </div>
                        </div>
                        <KPICard title="امتیاز سلامت انبار" value={`${healthScore}%`} subtitle={`${stats.shortages.length} قلم کسری موجودی`} icon="activity" color={healthScore > 80 ? "emerald" : healthScore > 50 ? "orange" : "rose"} delay={300} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><i data-lucide="bar-chart-horizontal" className="w-5 h-5 text-nexus-accent"></i>ترکیب سرمایه</h3>
                            <div className="space-y-4">
                                {Object.entries(stats.categories).sort(([, a], [, b]) => b.value - a.value).slice(0, 7).map(([name, data], idx) => (
                                    <div key={name} className="flex items-center gap-4 group">
                                        <div className="w-24 text-left"><span className="text-xs font-bold text-gray-300 block truncate" title={name}>{name}</span></div>
                                        <div className="flex-1"><div className="h-8 bg-slate-800/50 rounded-lg overflow-hidden relative flex items-center px-3 border border-white/5 group-hover:border-white/10 transition"><div className="absolute left-0 top-0 h-full bg-gradient-to-r from-nexus-primary/40 to-nexus-primary/60 rounded-r-lg transition-all duration-1000 ease-out" style={{ width: `${(data.value / maxCategoryVal) * 100}%` }}></div><span className="relative z-10 text-xs font-mono font-bold text-white ltr">{formatDecimal(data.value)} T</span></div></div>
                                        <div className="w-16 text-right"><span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-mono">{formatInteger(data.count)}</span></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white mb-2">خلاصه وضعیت</h3>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5"><div className="text-gray-400 text-xs mb-1">میانگین ارزش هر قطعه</div><div className="text-xl font-bold text-white ltr font-mono">{formatDecimal(avgPrice)} <span className="text-xs text-gray-500">Toman</span></div></div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5"><div className="text-gray-400 text-xs mb-1">ارزشمندترین گروه</div><div className="text-xl font-bold text-nexus-accent truncate" title={topCategory}>{topCategory}</div><div className="text-xs text-gray-500 mt-1">بیشترین سهم از نقدینگی</div></div>
                            {stats.shortages.length > 0 && (
                                <div onClick={() => setActiveTab('shortages')} className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 mt-auto animate-pulse-slow cursor-pointer hover:bg-rose-500/20 transition group">
                                    <div className="flex items-center gap-2 text-rose-400 font-bold mb-2"><i data-lucide="alert-octagon" className="w-5 h-5 group-hover:scale-110 transition-transform"></i><span>هشدار کسری (کلیک کنید)</span></div>
                                    <p className="text-xs text-rose-300 leading-relaxed">تعداد <b>{stats.shortages.length}</b> ردیف کالا نیازمند شارژ فوری هستند.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="glass-panel p-6 rounded-2xl border border-white/5 animate-in">
                    <h3 className="text-lg font-bold text-white mb-6">جزئیات کامل دسته‌بندی‌ها</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="text-xs text-gray-400 bg-white/5 uppercase font-bold">
                                <tr><th className="px-4 py-3 rounded-r-lg">دسته‌بندی</th><th className="px-4 py-3 text-center">تعداد کل</th><th className="px-4 py-3 text-center">ارزش کل (تومان)</th><th className="px-4 py-3 text-center">درصد از سرمایه</th><th className="px-4 py-3 rounded-l-lg">وضعیت</th></tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(stats.categories).sort(([, a], [, b]) => b.value - a.value).map(([name, data]) => {
                                    const percentage = ((data.value / stats.total_value_toman) * 100).toFixed(2);
                                    return (
                                        <tr key={name} className="hover:bg-white/5 transition">
                                            <td className="px-4 py-4 font-bold text-white flex items-center gap-2"><div className="w-2 h-8 bg-nexus-primary rounded-full"></div>{name}</td>
                                            <td className="px-4 py-4 text-center font-mono text-gray-300">{formatInteger(data.count)}</td>
                                            <td className="px-4 py-4 text-center font-mono text-emerald-400 font-bold">{formatDecimal(data.value)}</td>
                                            <td className="px-4 py-4"><div className="flex items-center gap-2"><span className="text-xs w-10 text-left font-mono">{percentage}%</span><div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-nexus-primary" style={{width: `${percentage}%`}}></div></div></div></td>
                                            <td className="px-4 py-4 text-center"><span className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">فعال</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'shortages' && (
                <div className="animate-in">
                    {stats.shortages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 glass-panel rounded-2xl">
                            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4"><i data-lucide="check-circle-2" className="w-10 h-10"></i></div>
                            <h3 className="text-xl font-bold text-white">وضعیت عالی!</h3>
                            <p className="text-gray-400 mt-2">هیچ کمبود موجودی در انبار گزارش نشده است.</p>
                        </div>
                    ) : (
                        <div className="glass-panel rounded-2xl border border-rose-500/20 overflow-hidden">
                            <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2"><i data-lucide="alert-triangle" className="w-5 h-5 text-rose-500"></i>لیست سفارش خرید (اولویت بالا)</h3>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full">{stats.shortages.length} مورد</span>
                                    <button onClick={handlePrintShortages} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-lg"><i data-lucide="printer" className="w-4 h-4"></i>پرینت لیست خرید</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-400 bg-black/20 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-right">کد اختصاصی</th>
                                            <th className="px-4 py-3 text-right">قطعه</th>
                                            <th className="px-4 py-3 text-right">مشخصات فنی</th>
                                            <th className="px-4 py-3 text-center">موجودی</th>
                                            <th className="px-4 py-3 text-center">نقطه سفارش</th>
                                            <th className="px-4 py-3 text-center">وضعیت</th>
                                            <th className="px-4 py-3 text-right">فروشنده</th>
                                            <th className="px-4 py-3 text-right">خرید آنلاین</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats.shortages.map((item, idx) => {
                                            const criticalRatio = item.qty / item.min;
                                            // حالا item.id در دسترس است و کد به درستی تولید می‌شود
                                            const pCode = getPartCodeInv(item, config);
                                            return (
                                                <tr key={idx} className="hover:bg-white/5 transition group">
                                                    <td className="px-4 py-3 text-nexus-accent font-mono font-bold text-[10px] tracking-tighter">{pCode}</td>
                                                    <td className="px-4 py-3"><div className="flex flex-col"><span className="font-bold text-white ltr font-mono text-right">{item.val}</span><span className="text-[10px] text-gray-500">{item.pkg || '-'} | {item.type}</span></div></td>
                                                    <td className="px-4 py-3 text-xs text-gray-400"><div className="flex flex-wrap gap-1">{item.watt && <span className="bg-white/5 px-1 rounded">{item.watt}</span>}{item.tolerance && <span className="text-purple-400 font-bold bg-purple-500/5 px-1.5 rounded">{item.tolerance}</span>}{item.tech && <span className="text-gray-500 block w-full truncate max-w-[100px]">{item.tech}</span>}</div></td>
                                                    <td className="px-4 py-3 text-center font-bold text-rose-400 font-mono">{formatInteger(item.qty)}</td>
                                                    <td className="px-4 py-3 text-center text-gray-500 font-mono">{formatInteger(item.min)}</td>
                                                    <td className="px-4 py-3"><div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden mx-auto"><div className={`h-full rounded-full ${criticalRatio === 0 ? 'bg-rose-600' : 'bg-orange-500'}`} style={{ width: `${Math.min(criticalRatio * 100, 100)}%` }}></div></div></td>
                                                    <td className="px-4 py-3 text-right text-xs text-blue-300 truncate max-w-[100px]">{item.vendor || '-'}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <PurchaseLinks links={item.links} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

window.InventoryPage = InventoryPage;