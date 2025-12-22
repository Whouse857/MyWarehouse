// [TAG: PAGE_ENTRY]
// صفحه ورود قطعه (ثبت اطلاعات)
// نسخه اصلاح شده: نمایش کد اختصاصی 12 کاراکتری در لیست و پیش‌نمایش

// تابع کمکی برای تولید کد 12 رقمی بر اساس ID و تنظیمات
const getPartCode = (p, globalConfig) => {
    if (!p || !p.id) return "---";
    const prefix = (globalConfig && globalConfig[p.type]?.prefix) || "PRT";
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

const SummaryModal = ({ isOpen, onClose, onConfirm, data, globalConfig }) => {
    if (!isOpen) return null;
    const fullCode = getPartCode({ id: data.id || 'NEW', type: data.type }, globalConfig);
    
    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4 text-center border-b border-white/10 pb-3">پیش‌نمایش ثبت قطعه</h3>
                <div className="space-y-3 text-sm text-gray-300 mb-6">
                    <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 font-bold">کد ۱۲ کاراکتری:</span> 
                        <span className="text-white font-black font-mono tracking-widest">{fullCode}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>نوع:</span> <span className="text-white font-bold">{data.type}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>مقدار:</span> <span className="text-white font-bold ltr font-mono">{data.val} {data.unit}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>پکیج:</span> <span className="text-white font-bold">{data.pkg}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>تعداد:</span> <span className="text-emerald-400 font-bold ltr font-mono">{data.qty}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>قیمت کل:</span> <span className="text-amber-400 font-bold ltr font-mono">{data.price_toman} تومان</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>فروشنده:</span> <span className="text-blue-300 font-bold">{data.vendor_name}</span></div>
                    <div className="flex justify-between items-center"><span>محل نگهداری:</span> <span className="text-orange-300 font-bold">{data.location}</span></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5">بازگشت و اصلاح</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white font-bold transition shadow-lg shadow-indigo-500/20">تایید و ثبت نهایی</button>
                </div>
            </div>
        </ModalOverlay>
    );
};

const EntryPage = ({ setView, serverStatus, user, globalConfig }) => {
    const [formData, setFormData] = useState({ id: null, val: "", unit: "", watt: "", tol: "", pkg: "", type: "Resistor", date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: [] });
    const [partsList, setPartsList] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [filters, setFilters] = useState({ val: '', pkg: '', loc: '', type: '', code: '' });
    const [errors, setErrors] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [linkInput, setLinkInput] = useState(""); 
    
    const notify = useNotify();
    const dialog = useDialog();
    
    const rTols = ["0.1%", "0.25%", "0.5%", "1%", "2%", "5%", "10%", "20%"];

    const loadData = useCallback(async () => { 
        try { 
            const [partsRes, contactsRes] = await Promise.all([fetchAPI('/parts'), fetchAPI('/contacts')]);
            if(partsRes.ok) setPartsList(Array.isArray(partsRes.data) ? partsRes.data : []);
            if(contactsRes.ok) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        } catch(e){} 
    }, []);
    
    useEffect(() => { loadData(); }, [loadData]);

    const duplicates = useMemo(() => {
        if (!formData.val || !formData.type) {
            return [];
        }
        const clean = (str) => String(str || '').toLowerCase().replace(/\s+/g, '');
        const formFullVal = clean(formData.val + (formData.unit && formData.unit !== '-' ? formData.unit : ''));
        
        return partsList.filter(p => {
            if (formData.id && p.id === formData.id) return false; 
            const pType = clean(p.type);
            const pVal = clean(p.val);
            const matchType = pType === clean(formData.type);
            const matchVal = pVal === formFullVal;
            if (!matchType || !matchVal) return false;
            if (formData.pkg && p.package) {
                if (clean(p.package) !== clean(formData.pkg)) return false;
            }
            return true;
        });
    }, [formData.val, formData.unit, formData.pkg, formData.type, partsList, formData.id]);

    const filteredParts = useMemo(() => {
        const normalize = (s) => s ? String(s).toLowerCase().replace(/,/g, '').trim() : '';
        const activeCategory = normalize(formData.type);
        const filterVal = normalize(filters.val);
        const filterPkg = normalize(filters.pkg);
        const filterLoc = normalize(filters.loc);
        const filterType = normalize(filters.type);
        const filterCode = normalize(filters.code);

        if (!Array.isArray(partsList)) return [];

        return partsList.filter(p => {
            if (!p) return false;
            const pVal = normalize(p.val);
            const pPkg = normalize(p.package);
            const pLoc = normalize(p.storage_location);
            const pType = normalize(p.type);
            const pCode = normalize(getPartCode(p, globalConfig));
            
            if (activeCategory && pType !== activeCategory) return false;
            if (filterVal && !pVal.includes(filterVal)) return false;
            if (filterPkg && !pPkg.includes(filterPkg)) return false;
            if (filterLoc && !pLoc.includes(filterLoc)) return false;
            if (filterType && !pType.includes(filterType)) return false;
            if (filterCode && !pCode.includes(filterCode)) return false;
            return true;
        });
    }, [partsList, filters, formData.type, globalConfig]);

    const vendorOptions = useMemo(() => {
        const names = contacts.map(c => c.name);
        if (formData.vendor_name && !names.includes(formData.vendor_name)) names.push(formData.vendor_name);
        return names;
    }, [contacts, formData.vendor_name]);

    const locationOptions = useMemo(() => {
        const generalConfig = globalConfig?.["General"];
        const rawLocs = generalConfig?.locations;
        const sharedLocs = Array.isArray(rawLocs) ? [...rawLocs] : [];
        if (formData.location && !sharedLocs.includes(formData.location)) sharedLocs.push(formData.location);
        return sharedLocs;
    }, [globalConfig, formData.location]);

    useLucide([filteredParts.length, formData.type, duplicates.length, formData.purchase_links.length]); 

    const handleChange = useCallback((key, val) => {
        let v = val;
        // تغییر جدید: جلوگیری از ورود کاراکترهای غیر عددی برای تعداد
        if (key === 'qty' || key === 'min_qty') {
            v = val.replace(/[^0-9]/g, '');
        }
        else if (key === 'price_toman' || key === 'usd_rate') {
            v = formatNumberWithCommas(val.replace(/,/g, ''));
        }
        
        setErrors(prev => ({...prev, [key]: false}));
        if (key === 'type') {
            const newConfig = globalConfig?.[val] ? globalConfig[val] : (globalConfig?.["Resistor"] || {});
            const defaultUnit = (newConfig.units && newConfig.units.length > 0) ? newConfig.units[0] : "";
            setFormData(prev => ({ ...prev, [key]: v, unit: defaultUnit, watt: "", pkg: "", tech: "" }));
        } else {
            setFormData(prev => ({ ...prev, [key]: v }));
        }
    }, [globalConfig]);
    
    const preventNonNumeric = (e) => {
        if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") { e.preventDefault(); }
    };

    const handleAddLink = () => {
        if (!linkInput.trim()) return;
        if (formData.purchase_links.length >= 5) {
            notify.show('محدودیت', 'حداکثر ۵ لینک می‌توانید اضافه کنید.', 'warning');
            return;
        }
        setFormData(prev => ({
            ...prev,
            purchase_links: [...prev.purchase_links, linkInput.trim()]
        }));
        setLinkInput("");
    };

    const handleRemoveLink = (index) => {
        setFormData(prev => ({
            ...prev,
            purchase_links: prev.purchase_links.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        const newErrors = {};
        if(!formData.val) newErrors.val = true;
        if(!formData.unit) newErrors.unit = true;
        if(!formData.pkg) newErrors.pkg = true;
        if(!formData.qty || Number(formData.qty) <= 0) newErrors.qty = true;
        if(!formData.location) newErrors.location = true;
        if(!formData.min_qty || Number(formData.min_qty) <= 0) newErrors.min_qty = true;
        if(!formData.vendor_name) newErrors.vendor_name = true;
        
        const rawPrice = formData.price_toman ? Number(formData.price_toman.replace(/,/g, '')) : 0;
        if (!formData.price_toman || rawPrice <= 0) newErrors.price_toman = true;
        const rawUsd = formData.usd_rate ? Number(formData.usd_rate.replace(/,/g, '')) : 0;
        if (!formData.usd_rate || rawUsd <= 0) newErrors.usd_rate = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            notify.show('خطای اعتبارسنجی', 'لطفاً فیلدهای قرمز شده را بررسی و اصلاح کنید.\nموارد ستاره‌دار الزامی هستند.', 'error');
            return;
        }
        setShowSummary(true);
    };

    const handleFinalSubmit = async () => {
        let fullVal = formData.val;
        if(formData.unit && formData.unit !== "-") fullVal += formData.unit;

        const payload = { ...formData, val: fullVal, qty: Number(formData.qty) || 0, min_qty: Number(formData.min_qty) || 1, price: String(formData.price_toman).replace(/,/g, ''), usd_rate: String(formData.usd_rate).replace(/,/g, ''), username: user.username };
        try { 
            const { ok, data } = await fetchAPI('/save', { method: 'POST', body: payload });
            if (ok) { 
                loadData(); 
                const typeConfig = globalConfig?.[formData.type] || globalConfig?.["Resistor"] || {};
                const defUnit = (typeConfig.units && typeConfig.units[0]) || "";
                setFormData({ 
                    id: null, val: "", unit: defUnit, watt: "", tol: "", pkg: "", type: formData.type, date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: []
                });
                notify.show('موفقیت', 'قطعه با موفقیت در انبار ذخیره شد.', 'success');
                setShowSummary(false);
            } else {
                 notify.show('خطا', data.error || 'خطا در ذخیره اطلاعات', 'error');
            }
        } catch(e) { notify.show('خطای سرور', 'خطا در برقراری ارتباط با سرور.', 'error'); }
    };
    
    const handleEdit = (p) => {
        let category = p.type || "Resistor"; 
        if (!globalConfig?.[category]) {
            if (p.val.includes("F")) category = "Capacitor";
            else if (p.val.includes("H")) category = "Inductor";
            else category = "Resistor";
        }
        const config = globalConfig?.[category] ? globalConfig[category] : (globalConfig?.["Resistor"] || {});
        let u = (config.units && config.units.length > 0) ? config.units[0] : "";
        let v = p.val || "";
        if (config.units) {
            for (let unit of config.units) {
                if (v.endsWith(unit)) { u = unit; v = v.slice(0, -unit.length); break; }
            }
        }
        
        let links = [];
        try {
            if (p.purchase_links) {
                links = JSON.parse(p.purchase_links);
                if (!Array.isArray(links)) links = [];
            }
        } catch (e) { links = []; }

        setFormData({ 
            ...p, val: v, unit: u, tol: p.tolerance, pkg: p.package, type: category, tech: p.tech || "", watt: p.watt, date: p.buy_date, qty: (p.quantity === null || p.quantity === undefined) ? "" : p.quantity, price_toman: formatNumberWithCommas(p.toman_price), usd_rate: formatNumberWithCommas(p.usd_rate || ""), min_qty: (p.min_quantity === null || p.min_quantity === undefined) ? "" : p.min_quantity, location: p.storage_location || "", purchase_links: links
        });
        setErrors({});
    };
    
    const handleDelete = async (id) => { 
        const confirmed = await dialog.ask("حذف قطعه", "آیا از حذف این قطعه از انبار اطمینان دارید؟", "danger");
        if(confirmed) { try { await fetchAPI(`/delete/${id}`, { method: 'DELETE' }); loadData(); notify.show('حذف شد', 'قطعه با موفقیت حذف شد.', 'success'); } catch(e) {} } 
    };

    const currentConfig = (globalConfig?.[formData.type]) ? globalConfig[formData.type] : (globalConfig?.["Resistor"]) || { units: [], paramOptions: [], packages: [], techs: [], icon: 'circle', label: 'Unknown', prefix: 'PRT' };

    return (
        <ErrorBoundary>
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} onConfirm={handleFinalSubmit} data={formData} globalConfig={globalConfig} />
                <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3"><span className="text-xs text-nexus-accent font-bold">تعداد قطعات موجود: {partsList.length}</span><div className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse"></div></div>
                </header>
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-12 lg:col-span-8 flex flex-col">
                            <div className="glass-panel rounded-2xl flex flex-col">
                                <div className="p-3 border-b border-white/5 grid grid-cols-5 gap-3 bg-white/5">
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="کد 12 رقمی..." value={filters.code} onChange={e => setFilters({...filters, code: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر مقدار..." value={filters.val} onChange={e => setFilters({...filters, val: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر پکیج..." value={filters.pkg} onChange={e => setFilters({...filters, pkg: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر آدرس..." value={filters.loc} onChange={e => setFilters({...filters, loc: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر نوع..." value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-12 gap-2 bg-black/30 p-3 border-b border-white/5 text-[11px] text-gray-400 font-bold text-center"><div className="col-span-2 text-right pr-2">کد اختصاصی</div><div className="col-span-5 text-right">مشخصات فنی</div><div className="col-span-1">تعداد</div><div className="col-span-2">قیمت</div><div className="col-span-2">عملیات</div></div>
                                <div className="p-2 space-y-2">
                                    {filteredParts.map(p => {
                                        const pCode = getPartCode(p, globalConfig);
                                        return (
                                            <div key={p.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all ${formData.id === p.id ? 'bg-nexus-primary/10 !border-nexus-primary/50' : ''}`}>
                                                <div className="col-span-2 text-right text-nexus-accent font-mono text-[10px] font-bold tracking-tighter">{pCode}</div>
                                                <div className="col-span-5 text-right flex flex-col justify-center gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white text-lg font-black ltr font-sans tracking-wide">{p.val}</span>
                                                        <span className="text-xs text-nexus-accent font-bold px-1.5 py-0.5 bg-nexus-accent/10 rounded">{p.package}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 items-center">
                                                        {p.type && <span className="text-blue-300 font-bold">{p.type}</span>}
                                                        {p.watt && <span className="flex items-center gap-1"><i data-lucide="zap" className="w-3 h-3 text-yellow-500"></i>{p.watt}</span>}
                                                        {p.tolerance && <span className="flex items-center gap-1"><i data-lucide="percent" className="w-3 h-3 text-purple-400"></i>{p.tolerance}</span>}
                                                        {p.tech && <span className="text-gray-500 border-x border-gray-700 px-2">{p.tech}</span>}
                                                        {p.storage_location && <span className="flex items-center gap-1 text-orange-300 bg-orange-500/10 px-1 rounded border border-orange-500/20"><i data-lucide="map-pin" className="w-3 h-3"></i>{p.storage_location}</span>}
                                                    </div>
                                                </div>
                                                <div className="col-span-1 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.quantity < p.min_quantity ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{p.quantity}</span></div>
                                                <div className="col-span-2 text-center text-xs text-amber-400 ltr font-mono">{(p.toman_price||0).toLocaleString()}</div>
                                                <div className="col-span-2 flex justify-center gap-3">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} disabled={!serverStatus} title="ویرایش" className="w-9 h-9 rounded-full bg-nexus-primary/20 text-nexus-primary hover:bg-nexus-primary hover:text-white flex items-center justify-center transition-all shadow-lg hover:shadow-primary/50 disabled:opacity-30 disabled:cursor-not-allowed"><i data-lucide="pencil" className="w-5 h-5"></i></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} disabled={!serverStatus} title="حذف" className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"><i data-lucide="trash-2" className="w-5 h-5"></i></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-4 h-full">
                            <div className="glass-panel border-white/10 rounded-2xl p-5 h-full flex flex-col shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-primary to-purple-600"></div>
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between"><span>{formData.id ? 'ویرایش قطعه' : 'ثبت قطعه جدید'}</span>{formData.id && <button onClick={() => setFormData({id: null, val: "", unit: (currentConfig.units && currentConfig.units[0]) || "", watt: "", tol: "", pkg: "", type: "Resistor", date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", min_qty: "", vendor_name: "", location: "", tech: "", purchase_links: []})} className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition">انصراف</button>}</h2>
                                {duplicates.length > 0 && !formData.id && (
                                    <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 mb-3 text-yellow-400 font-bold text-sm border-b border-yellow-500/10 pb-2">
                                            <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                                            <span>هشدار: قطعات مشابه یافت شد</span>
                                            <span className="text-[10px] bg-yellow-500/20 px-2 py-0.5 rounded-full text-yellow-300 mr-auto">{duplicates.length} مورد</span>
                                        </div>
                                        <div className="grid gap-3 max-h-60 overflow-y-auto pr-1 custom-scroll">
                                            {duplicates.map(d => (
                                                <div key={d.id} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-yellow-500/30"></div>
                                                    <div className="flex justify-between items-start mb-2 pr-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-bold text-sm">{d.val} {d.unit}</span>
                                                                <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 rounded">{d.package}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                                                                <span className="flex items-center gap-1.5"><i data-lucide="map-pin" className="w-3 h-3 text-orange-400"></i><span className="text-gray-300">{d.storage_location}</span></span>
                                                                <span className="flex items-center gap-1.5"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i><span>{d.vendor_name || 'فروشنده نامشخص'}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1"><span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg">{d.quantity} عدد</span><span className="text-amber-500/60 text-[10px] font-mono ltr">{formatNumberWithCommas(d.toman_price)} T</span></div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 pr-3">
                                                        <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{d.tech || d.reason || '-'}</span>
                                                        <button onClick={() => handleEdit(d)} className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/5"><span>انتخاب و ادغام</span><i data-lucide="check-circle-2" className="w-3.5 h-3.5"></i></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-4 pl-1 pr-1">
                                    <div className="flex flex-col"><label className="text-nexus-accent text-xs mb-1 block font-bold">دسته‌بندی قطعه (Component Type)</label>
                                        <div className="relative">
                                            <select value={formData.type} onChange={e=>handleChange('type', e.target.value)} disabled={!serverStatus} className="nexus-input w-full px-3 py-2 text-sm appearance-none cursor-pointer font-bold text-yellow-400 bg-slate-900/80 border-nexus-accent/30">
                                                {Object.keys(globalConfig)
                                                    .filter(key => key !== 'General')
                                                    .sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0))
                                                    .map(key => <option key={key} value={key}>{globalConfig[key].label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <div className="flex gap-3"><NexusInput label="مقدار (Value) *" value={formData.val} onChange={e=>handleChange('val', e.target.value)} placeholder="مثلا 100" className="flex-1" disabled={!serverStatus} error={errors.val} /><div className="flex-1"><NexusSelect label="واحد *" options={currentConfig.units} value={formData.unit} onChange={e=>handleChange('unit', e.target.value)} disabled={!serverStatus} error={errors.unit} /></div></div>
                                    <div className="flex gap-3"><NexusSelect label={currentConfig.paramLabel} options={currentConfig.paramOptions} value={formData.watt} onChange={e=>handleChange('watt', e.target.value)} className="flex-1" disabled={!serverStatus} /><NexusSelect label="تولرانس" options={rTols} value={formData.tol} onChange={e=>handleChange('tol', e.target.value)} className="flex-1" disabled={!serverStatus} /></div>
                                    <div className="flex gap-3"><NexusSelect label="پکیج (Package) *" options={currentConfig.packages} value={formData.pkg} onChange={e=>handleChange('pkg', e.target.value)} className="flex-1" disabled={!serverStatus} error={errors.pkg} /><div className="flex-1"><label className="text-gray-400 text-xs mb-1 block font-medium">تکنولوژی/نوع دقیق</label><div className="relative"><select value={formData.tech} onChange={e=>handleChange('tech', e.target.value)} disabled={!serverStatus} className="nexus-input w-full px-3 py-2 text-sm appearance-none cursor-pointer" dir="ltr"><option value="" className="bg-slate-900 text-gray-400">...</option>{(currentConfig.techs || []).map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}</select><i data-lucide="chevron-down" className="absolute left-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none"></i></div></div></div>
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <div className="flex gap-3"><NexusInput label="تعداد *" type="number" value={formData.qty} onChange={e=>handleChange('qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.qty} /><NexusInput label="حداقل *" type="number" value={formData.min_qty} onChange={e=>handleChange('min_qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.min_qty} /></div>
                                    <div className="flex gap-3">
                                        <NexusInput label="قیمت قطعه *" value={formData.price_toman} onChange={e=>handleChange('price_toman', e.target.value)} disabled={!serverStatus} error={errors.price_toman} className="flex-1" />
                                        <NexusInput label="قیمت دلار (تومان) *" value={formData.usd_rate} onChange={e=>handleChange('usd_rate', e.target.value)} disabled={!serverStatus} error={errors.usd_rate} className="flex-1" />
                                    </div>
                                    <div className="flex gap-3">
                                        <NexusSelect label="آدرس نگهداری (Location) *" value={formData.location} onChange={e=>handleChange('location', e.target.value)} options={locationOptions} disabled={!serverStatus} error={errors.location} className="flex-1" />
                                        <NexusSelect label="نام فروشنده *" value={formData.vendor_name} onChange={e=>handleChange('vendor_name', e.target.value)} options={vendorOptions} disabled={!serverStatus} error={errors.vendor_name} className="flex-1" />
                                    </div>
                                    <NexusInput label="پروژه / دلیل خرید" value={formData.reason} onChange={e=>handleChange('reason', e.target.value)} disabled={!serverStatus} />
                                    
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <label className="text-nexus-accent text-xs mb-2 block font-bold">لینک‌های خرید (اختیاری - حداکثر ۵ مورد)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input 
                                                className="nexus-input flex-1 px-3 py-2 text-xs ltr placeholder-gray-600" 
                                                placeholder="https://..." 
                                                value={linkInput} 
                                                onChange={e => setLinkInput(e.target.value)} 
                                            />
                                            <button onClick={handleAddLink} className="bg-nexus-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition disabled:opacity-50" disabled={formData.purchase_links.length >= 5}>
                                                <i data-lucide="plus" className="w-4 h-4"></i>
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {formData.purchase_links.map((link, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-xs group">
                                                    <a href={link} target="_blank" className="text-blue-400 truncate max-w-[200px] hover:underline" rel="noreferrer">{link}</a>
                                                    <button onClick={() => handleRemoveLink(idx)} className="text-gray-500 hover:text-red-400 transition"><i data-lucide="x" className="w-3.5 h-3.5"></i></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5"><button onClick={handleSubmit} disabled={!serverStatus} className={`w-full h-11 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${formData.id ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gradient-to-r from-nexus-primary to-purple-600'} disabled:opacity-50`}>{serverStatus ? (formData.id ? 'ذخیره تغییرات' : 'ذخیره در انبار') : 'سرور قطع است'}</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

window.EntryPage = EntryPage;
