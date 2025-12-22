// [TAG: PAGE_EXTRAS]
// صفحات جانبی: تامین‌کنندگان و لاگ‌ها
// نسخه نهایی: تقویم شمسی اختصاصی (Popup)، جستجوی اصلاح شده

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// --- Helper Functions ---
const toEnglishDigits = (str) => {
    if (!str) return str;
    return String(str).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\//g, '/');
};

const toPersianDigits = (str) => {
    if (!str) return str;
    return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

// لیست ماه‌های شمسی
const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// --- Custom Persian Date Picker Component ---
const PersianDatePicker = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempDate, setTempDate] = useState({ y: 1403, m: 1, d: 1 });
    const popupRef = useRef(null);

    // بستن پاپ‌آپ با کلیک بیرون
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // مقداردهی اولیه هنگام باز شدن
    useEffect(() => {
        if (value) {
            const parts = toEnglishDigits(value).split('/');
            if (parts.length === 3) {
                setTempDate({ y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) });
            }
        } else {
            // پیش‌فرض: تاریخ امروز شمسی
            const now = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/'); // 1403/9/25
            if (now.length === 3) {
                setTempDate({ y: parseInt(now[0]), m: parseInt(now[1]), d: parseInt(now[2]) });
            }
        }
    }, [value, isOpen]);

    const handleConfirm = () => {
        // فرمت خروجی: 1403/09/05 (با صفر قبل عدد)
        const mStr = tempDate.m.toString().padStart(2, '0');
        const dStr = tempDate.d.toString().padStart(2, '0');
        const dateStr = `${tempDate.y}/${mStr}/${dStr}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange("");
        setIsOpen(false);
    };

    // تولید آرایه اعداد
    const years = Array.from({ length: 21 }, (_, i) => 1395 + i); // 1395 تا 1415
    const days = Array.from({ length: 31 }, (_, i) => 1 + i);

    return (
        <div className="relative" ref={popupRef}>
            <span className="absolute -top-2 right-2 text-[9px] text-gray-400 bg-[#1e293b] px-1 z-10">{label}</span>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="nexus-input w-full px-2 py-2 text-sm bg-black/20 border-white/10 cursor-pointer flex items-center justify-between hover:bg-white/5 transition"
            >
                <span className={value ? "text-white" : "text-gray-500"}>
                    {value ? toPersianDigits(value) : "انتخاب کنید..."}
                </span>
                <i data-lucide="calendar" className="w-4 h-4 text-gray-400"></i>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 mb-4">
                        {/* سال */}
                        <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 mb-1 text-center">سال</label>
                            <select 
                                className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white"
                                value={tempDate.y}
                                onChange={e => setTempDate({...tempDate, y: parseInt(e.target.value)})}
                            >
                                {years.map(y => <option key={y} value={y}>{toPersianDigits(y)}</option>)}
                            </select>
                        </div>
                        {/* ماه */}
                        <div className="flex-[1.5]">
                            <label className="block text-[10px] text-gray-500 mb-1 text-center">ماه</label>
                            <select 
                                className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white"
                                value={tempDate.m}
                                onChange={e => setTempDate({...tempDate, m: parseInt(e.target.value)})}
                            >
                                {persianMonths.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                        {/* روز */}
                        <div className="flex-1">
                            <label className="block text-[10px] text-gray-500 mb-1 text-center">روز</label>
                            <select 
                                className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white"
                                value={tempDate.d}
                                onChange={e => setTempDate({...tempDate, d: parseInt(e.target.value)})}
                            >
                                {days.map(d => <option key={d} value={d}>{toPersianDigits(d)}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleClear} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition">پاک کردن</button>
                        <button onClick={handleConfirm} className="flex-1 py-1.5 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-xs text-white font-bold transition shadow-lg">تایید</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Contacts Page (بدون تغییر) ---
const ContactsPage = ({ serverStatus }) => {
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ id: null, name: '', phone: '', mobile: '', fax: '', website: '', email: '', address: '', notes: '' });
    const notify = useNotify();
    const dialog = useDialog();

    const loadContacts = useCallback(async () => { try { const { ok, data } = await fetchAPI('/contacts'); if (ok) setContacts(data); } catch (e) {} }, []);
    useEffect(() => { loadContacts(); }, [loadContacts]);
    useLucide([contacts, newContact]);

    const handleSave = async () => { if (!newContact.name.trim()) return notify.show('خطا', "نام تامین‌کننده الزامی است", 'error'); try { const { ok } = await fetchAPI('/contacts/save', { method: 'POST', body: newContact }); if (ok) { loadContacts(); setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); notify.show('موفقیت', "ذخیره شد.", 'success'); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); } };
    const handleDelete = async (id) => { if(await dialog.ask("حذف", "آیا مطمئن هستید؟", "danger")) { try { const { ok } = await fetchAPI(`/contacts/delete/${id}`, {method:'DELETE'}); if(ok) loadContacts(); } catch(e){} } };
    const handleEdit = (c) => { setNewContact(c); };

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full">
            <header className="h-16 border-b border-white/5 flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">مدیریت تامین‌کنندگان</h2></header>
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 lg:col-span-8 glass-panel rounded-2xl flex flex-col">
                    <div className="grid grid-cols-12 gap-2 bg-[#1e293b]/50 p-3 text-xs text-gray-400 font-bold border-b border-white/5"><div className="col-span-2">نام</div><div className="col-span-3 text-center">تماس</div><div className="col-span-2 text-center">وب/ایمیل</div><div className="col-span-4 text-center">آدرس</div><div className="col-span-1 text-center">عملیات</div></div>
                    <div className="p-2 space-y-2 overflow-y-auto custom-scroll flex-1">
                        {contacts.map(c => (
                            <div key={c.id} className={`grid grid-cols-12 gap-2 p-3 rounded-lg hover:bg-white/5 items-center text-sm ${newContact.id === c.id ? 'bg-nexus-primary/10 border border-nexus-primary/50' : ''}`}>
                                <div className="col-span-2 font-bold text-white truncate">{c.name}</div>
                                <div className="col-span-3 text-center flex flex-col gap-1"><span className="text-xs ltr text-white">{c.mobile}</span><span className="text-[10px] ltr text-gray-400">{c.phone}</span></div>
                                <div className="col-span-2 text-center flex flex-col gap-1"><a href={c.website} target="_blank" className="text-[10px] text-blue-400 truncate">{c.website}</a><span className="text-[10px] ltr text-gray-400 truncate">{c.email}</span></div>
                                <div className="col-span-4 text-center text-[10px] text-gray-300 truncate">{c.address}</div>
                                <div className="col-span-1 flex justify-center gap-1"><button onClick={() => handleEdit(c)} disabled={!serverStatus} className="text-blue-400 p-1.5"><i data-lucide="pencil" className="w-4 h-4"></i></button><button onClick={() => handleDelete(c.id)} disabled={!serverStatus} className="text-red-400 p-1.5"><i data-lucide="trash-2" className="w-4 h-4"></i></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 glass-panel border border-white/10 rounded-2xl p-5 shadow-2xl h-fit">
                    <h2 className="text-lg font-bold text-white mb-4 flex justify-between">{newContact.id ? 'ویرایش' : 'افزودن'}{newContact.id && <button onClick={()=>setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''})} className="text-xs bg-white/5 px-2 rounded hover:bg-white/10 transition">انصراف</button>}</h2>
                    <div className="space-y-3 custom-scroll overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                        <NexusInput label="نام *" value={newContact.name} onChange={e=>setNewContact(p=>({...p, name:e.target.value}))} disabled={!serverStatus} />
                        <div className="grid grid-cols-2 gap-2"><NexusInput label="موبایل" dir="ltr" value={newContact.mobile} onChange={e=>setNewContact(p=>({...p, mobile:e.target.value}))} disabled={!serverStatus} /><NexusInput label="تلفن" dir="ltr" value={newContact.phone} onChange={e=>setNewContact(p=>({...p, phone:e.target.value}))} disabled={!serverStatus} /></div>
                        <div className="grid grid-cols-2 gap-2"><NexusInput label="فکس" dir="ltr" value={newContact.fax} onChange={e=>setNewContact(p=>({...p, fax:e.target.value}))} disabled={!serverStatus} /><NexusInput label="وب‌سایت" dir="ltr" value={newContact.website} onChange={e=>setNewContact(p=>({...p, website:e.target.value}))} disabled={!serverStatus} /></div>
                        <NexusInput label="آدرس" value={newContact.address} onChange={e=>setNewContact(p=>({...p, address:e.target.value}))} disabled={!serverStatus} />
                        <NexusInput label="ایمیل" dir="ltr" value={newContact.email} onChange={e=>setNewContact(p=>({...p, email:e.target.value}))} disabled={!serverStatus} />
                        <button onClick={handleSave} disabled={!serverStatus} className="w-full h-10 rounded-lg font-bold text-white bg-nexus-primary hover:bg-indigo-600 mt-2">{newContact.id ? 'ذخیره تغییرات' : 'ذخیره'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Log Page ---
const LogPage = () => {
    const [logList, setLogList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // فیلترها (تاریخ‌ها به صورت شمسی ذخیره می‌شوند: "1403/09/25")
    const [filters, setFilters] = useState({
        general: "",
        user: "",
        operation: "",
        startDate: "", 
        endDate: ""
    });

    useEffect(() => { 
        fetchAPI('/log').then(({ok, data}) => {
            if (ok) setLogList(data);
            setLoading(false);
        }).catch(console.error); 
    }, []);
    
    // فیلتر کردن هوشمند
    const filteredLogs = useMemo(() => {
        return logList.filter(l => {
            // تبدیل تاریخ لاگ (میلادی timestamp) به شمسی برای مقایسه
            // فرمت خروجی toShamsi در Core Logic معمولا "YYYY/MM/DD" فارسی یا انگلیسی است.
            // اینجا مطمئن می‌شویم انگلیسی است برای مقایسه راحت‌تر.
            // استفاده از Intl برای تبدیل دقیق
            const logDateObj = new Date(l.timestamp);
            const logShamsi = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' })
                .format(logDateObj); // خروجی: 1403/09/25
            
            // 1. بررسی بازه زمانی (رشته‌ای مقایسه می‌کنیم چون فرمت YYYY/MM/DD است)
            if (filters.startDate && logShamsi < filters.startDate) return false;
            if (filters.endDate && logShamsi > filters.endDate) return false;

            // 2. جستجوی متنی
            const terms = filters.general ? toEnglishDigits(filters.general.toLowerCase()).trim().split(/\s+/) : [];
            const searchableText = toEnglishDigits(`
                ${l.val || ''} 
                ${l.username || ''} 
                ${l.operation_type || ''} 
                ${l.reason || ''} 
                ${l.vendor_name || ''} 
                ${l.log_id || ''}
                ${logShamsi}
            `.toLowerCase());

            const generalMatch = terms.length === 0 || terms.every(term => searchableText.includes(term));
            
            // 3. فیلترهای اختصاصی
            const userMatch = !filters.user || (l.username && l.username.toLowerCase().includes(filters.user.toLowerCase()));
            const opMatch = !filters.operation || (l.operation_type && l.operation_type.toLowerCase().includes(filters.operation.toLowerCase()));

            return generalMatch && userMatch && opMatch;
        });
    }, [logList, filters]);

    useLucide([filteredLogs, filters]); // Re-render icons on filter change

    if (loading) return <div className="flex justify-center items-center h-full text-white">در حال دریافت تاریخچه...</div>;

    const formatMoney = (val) => val ? Number(val).toLocaleString() : '0';

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <header className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="history" className="w-6 h-6 text-nexus-primary"></i>
                        تاریخچه تراکنش‌های انبار
                    </h2>
                    <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">{filteredLogs.length} تراکنش</span>
                </div>
                
                {/* پنل فیلترها */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    {/* جستجوی متنی */}
                    <div className="md:col-span-3">
                        <input 
                            className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" 
                            placeholder="جستجو (نام، دلیل، تاریخ)..." 
                            value={filters.general}
                            onChange={e => setFilters({...filters, general: e.target.value})}
                        />
                    </div>
                    
                    {/* فیلتر کاربر */}
                    <div className="md:col-span-2">
                        <input 
                            className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" 
                            placeholder="نام کاربر" 
                            value={filters.user}
                            onChange={e => setFilters({...filters, user: e.target.value})}
                        />
                    </div>

                    {/* فیلتر عملیات */}
                    <div className="md:col-span-2">
                        <select 
                            className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40 appearance-none cursor-pointer"
                            value={filters.operation}
                            onChange={e => setFilters({...filters, operation: e.target.value})}
                        >
                            <option value="">همه عملیات‌ها</option>
                            <option value="ENTRY">ورود (ENTRY)</option>
                            <option value="EXIT">خروج (EXIT)</option>
                            <option value="UPDATE">ویرایش (UPDATE)</option>
                            <option value="DELETE">حذف (DELETE)</option>
                        </select>
                    </div>

                    {/* انتخاب بازه زمانی (تقویم شمسی سفارشی) */}
                    <div className="md:col-span-5 flex gap-2 items-center">
                        <div className="flex-1">
                            <PersianDatePicker 
                                label="از تاریخ" 
                                value={filters.startDate} 
                                onChange={date => setFilters({...filters, startDate: date})} 
                            />
                        </div>
                        <span className="text-gray-600">-</span>
                        <div className="flex-1">
                            <PersianDatePicker 
                                label="تا تاریخ" 
                                value={filters.endDate} 
                                onChange={date => setFilters({...filters, endDate: date})} 
                            />
                        </div>
                        
                        {(filters.startDate || filters.endDate || filters.general || filters.user || filters.operation) && (
                            <button 
                                onClick={() => setFilters({general: "", user: "", operation: "", startDate: "", endDate: ""})}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition h-[38px] w-[38px] flex items-center justify-center"
                                title="پاک کردن فیلترها"
                            >
                                <i data-lucide="filter-x" className="w-4 h-4"></i>
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 relative">
                <div className="absolute top-0 right-[27px] w-0.5 h-full bg-white/10 z-0"></div>

                <div className="space-y-6 relative z-10 pb-10">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <i data-lucide="search-x" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>موردی با این مشخصات یافت نشد.</p>
                        </div>
                    ) : (
                        filteredLogs.map(l => {
                            const isEntry = l.quantity_added > 0;
                            const isDelete = l.operation_type && l.operation_type.includes('DELETE');
                            const isEdit = l.operation_type && l.operation_type.includes('UPDATE');
                            
                            let colorClass = '';
                            let iconName = '';
                            let borderColor = '';
                            let titleText = '';

                            if (isDelete) {
                                colorClass = 'text-gray-400 bg-gray-500/10';
                                borderColor = 'border-gray-600';
                                iconName = 'trash-2';
                                titleText = 'حذف قطعه';
                            } else if (isEdit) {
                                colorClass = 'text-yellow-400 bg-yellow-500/10'; 
                                borderColor = 'border-yellow-500/50';
                                iconName = 'pencil-line';
                                titleText = 'ویرایش اطلاعات';
                            } else if (isEntry) {
                                colorClass = 'text-emerald-400 bg-emerald-500/10';
                                borderColor = 'border-emerald-500';
                                iconName = 'arrow-down-left';
                                titleText = 'ورود به انبار';
                            } else {
                                colorClass = 'text-rose-400 bg-rose-500/10';
                                borderColor = 'border-rose-500';
                                iconName = 'arrow-up-right';
                                titleText = 'خروج از انبار';
                            }
                            
                            return (
                                <div key={l.log_id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 group-hover:scale-110 bg-[#0f172a] ${borderColor} ${colorClass.split(' ')[0]}`}>
                                        <i data-lucide={iconName} className="w-6 h-6"></i>
                                    </div>

                                    <div className={`flex-1 glass-panel p-4 rounded-2xl border transition-all hover:bg-white/[0.02] ${isEdit ? 'border-yellow-500/20' : 'border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-bold ${colorClass.split(' ')[0]}`}>
                                                        {titleText}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-white/5 rounded-full font-mono">ID: {l.log_id}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{l.operation_type}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white ltr font-mono text-right flex items-center gap-2">
                                                    {l.val}
                                                    <span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded">{l.package || '-'}</span>
                                                </h3>
                                            </div>
                                            <div className="text-left flex flex-col items-end">
                                                <span className="text-xs text-gray-300 font-mono bg-white/5 px-2 py-1 rounded">{toShamsiDateTime(l.timestamp)}</span>
                                                <span className="text-[10px] text-nexus-primary mt-1 flex items-center gap-1">
                                                    <i data-lucide="user" className="w-3 h-3"></i> {l.username || 'سیستم'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">نوع قطعه</span>
                                                <span className="text-white font-bold">{l.type || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">تکنولوژی/وات</span>
                                                <span className="text-white dir-ltr">{l.tech || l.watt || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">محل نگهداری</span>
                                                <span className="text-orange-300 flex items-center gap-1"><i data-lucide="map-pin" className="w-3 h-3"></i> {l.storage_location || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">دلیل/پروژه</span>
                                                <span className="text-white truncate font-medium" title={l.reason}>{l.reason || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-3">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                {l.vendor_name && <span className="flex items-center gap-1"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i> {l.vendor_name}</span>}
                                                {l.unit_price > 0 && <span className="flex items-center gap-1 font-mono text-amber-400"><i data-lucide="tag" className="w-3 h-3"></i> {formatMoney(l.unit_price)} T</span>}
                                            </div>
                                            
                                            {isEdit ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-gray-500">تغییر موجودی:</span>
                                                    {l.quantity_added !== 0 ? (
                                                        <div className="px-3 py-1 rounded border bg-yellow-500/10 border-yellow-500/50 text-yellow-400 font-bold font-mono shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                            {l.quantity_added > 0 ? `+${l.quantity_added}` : l.quantity_added}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-yellow-500/80 font-bold">بروزرسانی اطلاعات</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={`text-lg font-black font-mono flex items-center gap-2 ${isEntry ? 'text-emerald-400' : (isDelete ? 'text-gray-500' : 'text-rose-400')}`}>
                                                    {l.quantity_added > 0 ? '+' : ''}{l.quantity_added} <span className="text-xs font-normal text-gray-500">عدد</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// Export to global scope
window.ContactsPage = ContactsPage;
window.LogPage = LogPage;