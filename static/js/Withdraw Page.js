// [TAG: PAGE_WITHDRAW]
// صفحه برداشت قطعه (سبد خروج)
// نسخه اصلاح شده: خروج خودکار پرینت پس از تایید، اعلان‌های خودکار نارنجی و بهبود تایپ دستی

const getPartCodeLocal = (p, config) => {
    if (!p) return "---";
    // اولویت با کد اختصاصی ذخیره شده در دیتابیس
    if (p.part_code) return p.part_code;
    
    // حالت رزرو برای قطعات قدیمی
    if (!p.id) return "---";
    const prefix = (config && config[p.type]?.prefix) || "PRT";
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

const WithdrawPage = ({ user, serverStatus }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [cart, setCart] = useState([]);
    const [partsList, setPartsList] = useState([]);
    const [projectReason, setProjectReason] = useState("");
    const [globalConfig, setGlobalConfig] = useState(null);
    
    const notify = useNotify();
    const dialog = useDialog();

    const loadParts = useCallback(async () => {
        try {
            const [partsRes, configRes] = await Promise.all([
                fetchAPI('/parts'),
                fetchAPI('/settings/config')
            ]);
            if (partsRes.ok) setPartsList(partsRes.data);
            if (configRes.ok) setGlobalConfig(configRes.data);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadParts(); }, [loadParts]);

    const categories = useMemo(() => {
        const cats = ["All", ...new Set(partsList.map(p => p.type || "Other"))];
        return cats.sort();
    }, [partsList]);

    const filteredParts = useMemo(() => {
        let res = partsList;
        if (selectedCategory !== "All") {
            res = res.filter(p => (p.type || "Other") === selectedCategory);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(p => 
                (p.val && p.val.toLowerCase().includes(lower)) || 
                (p.package && p.package.toLowerCase().includes(lower)) ||
                (p.storage_location && p.storage_location.toLowerCase().includes(lower)) ||
                (p.type && p.type.toLowerCase().includes(lower)) ||
                (getPartCodeLocal(p, globalConfig).toLowerCase().includes(lower))
            );
        }
        return res.slice(0, 50);
    }, [searchTerm, partsList, selectedCategory, globalConfig]);

    useLucide([cart, filteredParts, selectedCategory]);

    const getStockStatus = (qty, minQty) => {
        if (qty <= 0) return { color: 'bg-red-500', text: 'text-red-500', label: 'ناموجود' };
        if (qty <= minQty) return { color: 'bg-orange-500', text: 'text-orange-500', label: 'کم' };
        return { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'موجود' };
    };

    const addToCart = (part, exactQty = null) => {
        let qtyToAdd = 1;
        const existing = cart.find(i => i.id === part.id);
        const currentInCart = existing ? existing.qty : 0;
        const remainingStock = part.quantity - currentInCart;

        if (remainingStock <= 0) {
            // استفاده از نوع info برای اطمینان از ناپدید شدن خودکار (طبق منطق Core شما) با متن هشدار
            return notify.show('موجودی ناکافی', 'تمام موجودی این قطعه در لیست خروج قرار دارد.', 'info');
        }

        if (exactQty !== null) {
            qtyToAdd = exactQty;
            if (qtyToAdd > remainingStock) {
                return notify.show('محدودیت موجودی', `فقط ${remainingStock} عدد دیگر قابل افزودن است.`, 'info');
            }
        }

        if (existing) {
            setCart(cart.map(i => i.id === part.id ? { ...i, qty: i.qty + qtyToAdd } : i));
        } else {
            setCart([...cart, { ...part, qty: qtyToAdd }]);
        }
    };

    const updateCartQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        const part = partsList.find(p => p.id === id);
        if (!item || !part) return;

        const newQty = item.qty + delta;
        if (newQty <= 0) {
            setCart(cart.filter(i => i.id !== id));
            return;
        }
        if (newQty > part.quantity) {
            return notify.show('هشدار موجودی', `موجودی ناکافی. حداکثر مقدار: ${part.quantity}`, 'info');
        }
        setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i));
    };

    const handleManualQtyChange = (id, value) => {
        const part = partsList.find(p => p.id === id);
        if (!part) return;

        // تغییر جدید: حذف هر کاراکتری جز اعداد 0 تا 9
        const cleanValue = value.replace(/[^0-9]/g, '');
        const newQty = cleanValue === '' ? 0 : parseInt(cleanValue);

        if (newQty > part.quantity) {
            notify.show('موجودی محدود', `تعداد وارد شده بیشتر از موجودی انبار (${part.quantity}) است.`, 'info');
            return;
        }

        setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i));
    };

    // تابع پرینت (حواله برداشت)
    const handlePrintPickList = (currentCart = cart, reason = projectReason) => {
        if (currentCart.length === 0) return;
        const printWindow = window.open('', '_blank');
        const today = getJalaliDate();
        
        let htmlContent = `
            <html lang="fa" dir="rtl">
            <head>
                <title>لیست برداشت انبار - ${reason || 'پروژه نامشخص'}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; padding: 20px; color: #000; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                    .check-box { width: 20px; height: 20px; border: 1px solid #000; display: inline-block; vertical-align: middle; }
                    .ltr { direction: ltr; display: inline-block; font-family: monospace; font-weight: bold; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header"><h2>حواله خروج قطعات از انبار نکسوس</h2></div>
                <div class="meta">
                    <div><strong>پروژه / دلیل مصرف:</strong> ${reason || '---'}</div>
                    <div><strong>مسئول برداشت:</strong> ${user.full_name || user.username}</div>
                    <div><strong>تاریخ ثبت:</strong> ${today}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">#</th>
                            <th style="width: 15%">کد کالا</th>
                            <th style="width: 25%">شرح قطعه</th>
                            <th style="width: 10%">پکیج</th>
                            <th style="width: 15%">آدرس دقیق انبار</th>
                            <th style="width: 10%">تعداد درخواستی</th>
                            <th style="width: 10%">وضعیت برداشت</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        currentCart.forEach((item, index) => {
            const pCode = getPartCodeLocal(item, globalConfig);
            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="ltr">${pCode}</span></td>
                    <td style="text-align: right;"><span class="ltr">${item.val}</span> <br/> <small style="color: #666;">${item.type} | ${item.watt || ''}</small></td>
                    <td><span class="ltr">${item.package}</span></td>
                    <td style="font-weight: bold;">${item.storage_location}</td>
                    <td style="font-size: 14px; font-weight: bold;">${item.qty}</td>
                    <td><div class="check-box"></div> <small>تایید</small></td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <div style="margin-top: 50px; display: flex; justify-content: space-around; font-size: 11px;">
                    <div>امضا تحویل گیرنده: ............................</div>
                    <div>تایید واحد انبار: ............................</div>
                </div>
                <script>window.onload=function(){ setTimeout(()=> { window.print(); }, 500); }</script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (cart.some(i => i.qty <= 0)) return notify.show('خطا', 'تعداد قطعات برداشتی نمی‌تواند صفر باشد.', 'info');
        if (!projectReason.trim()) return notify.show('توجه', 'لطفاً نام پروژه یا دلیل مصرف را وارد کنید', 'info');
        
        const confirmed = await dialog.ask('تایید نهایی خروج', `آیا از خروج ${cart.length} ردیف قطعه برای "${projectReason}" اطمینان دارید؟`, 'warning');
        
        if (confirmed) {
            try {
                // کپی از سبد برای پرینت، چون بعد از ok پاک می‌شود
                const cartToPrint = [...cart];
                const reasonToPrint = projectReason;

                const { ok, data } = await fetchAPI('/withdraw', { 
                    method: 'POST', 
                    body: { items: cart, project: projectReason, username: user.username } 
                });
                
                if (ok) {
                    // باز کردن تب پرینت به صورت خودکار
                    handlePrintPickList(cartToPrint, reasonToPrint);
                    
                    notify.show('موفقیت', 'خروج با موفقیت ثبت شد و حواله صادر گردید.', 'success');
                    setCart([]);
                    setProjectReason("");
                    loadParts();
                } else {
                    notify.show('خطا در سرور', data.error || 'خطا در ثبت خروج', 'error');
                }
            } catch (e) { notify.show('خطای شبکه', 'ارتباط با سرور برقرار نشد.', 'error'); }
        }
    };

    return (
        <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
            <header className="mb-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shopping-cart" className="w-6 h-6 text-nexus-primary"></i>
                        میز کار و برداشت قطعه
                    </h2>
                    <div className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1 rounded-full">
                        {partsList.length} قطعه در انبار
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                            <i data-lucide="search" className="w-5 h-5"></i>
                        </div>
                        <input className="nexus-input w-full pr-10 pl-4 py-3 text-sm shadow-lg border-white/10 focus:border-nexus-primary/50" placeholder="جستجوی هوشمند (کد، نام، پکیج، آدرس...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 max-w-full md:max-w-md custom-scroll items-center">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition border ${selectedCategory === cat ? 'bg-nexus-primary text-white border-nexus-primary shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200'}`}>{cat === "All" ? "همه" : cat}</button>
                        ))}
                    </div>
                </div>
            </header>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
                <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 order-2 md:order-1">
                    <div className="glass-panel flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                        <div className="p-4 border-b border-white/5 bg-[#020617]/40 flex justify-between items-center">
                            <h3 className="font-bold text-gray-200 flex items-center gap-2"><i data-lucide="clipboard-list" className="w-4 h-4 text-orange-400"></i>لیست خروج</h3>
                            <div className="flex gap-2">
                                {cart.length > 0 && (
                                    <button onClick={() => handlePrintPickList()} title="پیش‌نمایش حواله" className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                                        <i data-lucide="printer" className="w-4 h-4"></i>
                                    </button>
                                )}
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-mono">{cart.length}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2 bg-[#020617]/20">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-40 gap-3"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><i data-lucide="package-open" className="w-8 h-8"></i></div><span className="text-xs">لیست خالی است</span><span className="text-[10px]">قطعات را از لیست انتخاب کنید</span></div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="bg-[#1e293b] p-3 rounded-xl border border-white/5 group relative overflow-hidden transition hover:border-orange-500/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm ltr font-mono text-right">{item.val}</span>
                                                <span className="text-[9px] text-nexus-accent font-mono font-bold tracking-tighter">{getPartCodeLocal(item, globalConfig)}</span>
                                            </div>
                                            <button onClick={() => updateCartQty(item.id, -item.qty)} className="text-gray-600 hover:text-red-400 transition"><i data-lucide="x" className="w-4 h-4"></i></button>
                                        </div>
                                        <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                                            <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition"><i data-lucide="plus" className="w-3 h-3"></i></button>
                                            
                                            <input 
                                                type="text"
                                                className="w-14 bg-white/5 text-center font-mono font-bold text-orange-400 text-sm focus:outline-none border border-white/10 rounded-md focus:border-orange-500 transition-colors"
                                                value={item.qty === 0 ? "" : item.qty}
                                                onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                                            />

                                            <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded transition"><i data-lucide="minus" className="w-3 h-3"></i></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-[#1e293b] border-t border-white/5 space-y-3 z-10">
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500"><i data-lucide="briefcase" className="w-4 h-4"></i></div>
                                <input className="nexus-input w-full pr-9 pl-3 py-2.5 text-xs bg-black/30 border-white/10" placeholder="نام پروژه / دلیل مصرف..." value={projectReason} onChange={e => setProjectReason(e.target.value)} />
                            </div>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || !serverStatus} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-red-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"><span>ثبت و صدور حواله</span><i data-lucide="arrow-left" className="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i></button>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-8 lg:col-span-9 order-1 md:order-2 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scroll pr-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredParts.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500"><i data-lucide="search-x" className="w-16 h-16 mb-4 opacity-20"></i><p>موردی یافت نشد</p></div>
                            ) : (
                                filteredParts.map(part => {
                                    const status = getStockStatus(part.quantity, part.min_quantity);
                                    const inCart = cart.find(c => c.id === part.id);
                                    const pCode = getPartCodeLocal(part, globalConfig);
                                    return (
                                        <div key={part.id} className={`glass-panel p-4 rounded-2xl border transition-all duration-200 group relative flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl ${inCart ? 'border-nexus-primary/50 bg-nexus-primary/5' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className={`absolute top-0 inset-x-4 h-0.5 rounded-b-full ${status.color} opacity-50`}></div>
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-nexus-accent font-mono tracking-tighter">{pCode}</span>
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.color.replace('bg-', 'bg-').replace('500', '500/10')} ${status.text}`}>{status.label === 'ناموجود' ? <i data-lucide="alert-octagon" className="w-3 h-3"></i> : <i data-lucide="box" className="w-3 h-3"></i>}<span>{part.quantity}</span></div>
                                                </div>
                                                <h4 className="text-xl font-black text-white ltr font-mono mb-1 truncate" title={part.val}>{part.val} <span className="text-sm font-normal text-gray-400">{part.unit}</span></h4>
                                                
                                                <div className="space-y-1 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded-md border border-white/5">{part.package}</span>
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase">{part.type}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {part.watt && <span className="text-[9px] text-yellow-500/80 font-bold bg-yellow-500/5 px-1.5 rounded flex items-center gap-0.5"><i data-lucide="zap" className="w-2.5 h-2.5"></i>{part.watt}</span>}
                                                        {part.tolerance && <span className="text-[9px] text-purple-400 font-bold bg-purple-500/5 px-1.5 rounded">{part.tolerance}</span>}
                                                        {part.tech && <span className="text-[9px] text-gray-500 bg-black/20 px-1.5 rounded truncate max-w-[100px]">{part.tech}</span>}
                                                    </div>
                                                    <div className="pt-1.5 flex items-center gap-1 text-[10px] text-orange-300/70">
                                                        <i data-lucide="map-pin" className="w-3 h-3 text-orange-400"></i>
                                                        <span className="font-bold">{part.storage_location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-3 border-t border-white/5 flex gap-2">
                                                <button onClick={() => addToCart(part, 1)} disabled={part.quantity <= 0} className="flex-1 bg-white/5 hover:bg-nexus-primary hover:text-white text-gray-300 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group-hover:bg-white/10"><i data-lucide="plus" className="w-4 h-4"></i>افزودن به سبد</button>
                                                {inCart && (<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-nexus-primary/20 text-nexus-primary font-mono font-bold border border-nexus-primary/30 animate-in zoom-in">{inCart.qty}</div>)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WithdrawPage = WithdrawPage;
