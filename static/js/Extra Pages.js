/**
 * نام فایل: Extra Pages.js
 * نویسنده: سرگلی
 * نسخه: V0.20
 * * کلیات عملکرد و توابع:
 * این فایل شامل صفحات جانبی مهم سیستم از جمله مدیریت تامین‌کنندگان (Contacts) و تاریخچه تراکنش‌ها (Logs) است.
 * همچنین کامپوننت‌های کمکی مانند تقویم شمسی و مودال ویرایش لاگ در اینجا قرار دارند.
 * * توابع و بخش‌های کلیدی:
 * 1. toEnglishDigits / toPersianDigits: توابع کمکی برای تبدیل اعداد بین فارسی و انگلیسی.
 * 2. PersianDatePicker: کامپوننت انتخابگر تاریخ شمسی سفارشی.
 * 3. ContactsPage: صفحه مدیریت لیست تامین‌کنندگان (افزودن، ویرایش، حذف و جستجو).
 * 4. LogPage: صفحه نمایش تاریخچه کامل تراکنش‌های سیستم با امکان فیلتر پیشرفته.
 * 5. handleSave / handleDelete (در ContactsPage): مدیریت عملیات CRUD برای مخاطبین.
 * 6. loadLogs / handleDeleteLog (در LogPage): بارگذاری و مدیریت لاگ‌ها (شامل واگردانی تراکنش).
 */

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// =========================================================================
// بخش توابع کمکی سراسری (GLOBAL HELPER FUNCTIONS)
// =========================================================================

// =========================================================================
/**
 * نام تابع: toEnglishDigits
 * کارایی: تبدیل اعداد فارسی موجود در رشته به اعداد انگلیسی (برای محاسبات)
 */
// =========================================================================
const toEnglishDigits = (str) => {
    if (!str) return str;
    return String(str).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\//g, '/');
};

// =========================================================================
/**
 * نام تابع: toPersianDigits
 * کارایی: تبدیل اعداد انگلیسی به فارسی (برای نمایش در رابط کاربری)
 */
// =========================================================================
const toPersianDigits = (str) => {
    if (!str) return str;
    return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

// =========================================================================
/**
 * نام تابع: getPartCodeLog
 * کارایی: تولید کد اختصاصی قطعه برای نمایش در لاگ‌ها (با اولویت کد دیتابیس)
 */
// =========================================================================
const getPartCodeLog = (l, config) => {
    if (!l) return "---";
    if (l.part_code) return l.part_code; // اولویت با کد دیتابیس

    const prefix = (config && config[l.type]?.prefix) || "PRT";
    const numeric = String(l.part_id || 0).padStart(9, '0');
    return `${prefix}${numeric}`;
};

// =========================================================================
/**
 * متغیر ثابت: persianMonths
 * کارایی: لیست نام ماه‌های شمسی برای استفاده در تقویم
 */
// =========================================================================
const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// =========================================================================
// بخش کامپوننت‌های کمکی (HELPER COMPONENTS)
// =========================================================================

// =========================================================================
/**
 * نام کامپوننت: EditLogModal
 * کارایی: مودال برای ویرایش دستی یک لاگ (جهت اصلاح اشتباهات کاربری در انبار)
 */
// =========================================================================
const EditLogModal = ({ isOpen, onClose, onSave, log }) => {
    // =========================================================================
    // بخش منطق و توابع (LOGIC & FUNCTIONS)
    // =========================================================================
    const [qty, setQty] = useState(0);
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (log && isOpen) {
            setQty(log.quantity_added);
            setReason(log.reason || "");
        }
    }, [log, isOpen]);

    if (!isOpen || !log) return null;

    // =========================================================================
    // بخش نمایش و رابط کاربری (VIEW / UI)
    // =========================================================================
    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i data-lucide="pencil-line" className="text-nexus-accent w-5 h-5"></i>
                    اصلاح تراکنش
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">مقدار تغییر (تعداد)</label>
                        <input 
                            type="number" 
                            className="nexus-input w-full px-3 py-2 text-sm font-mono ltr"
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">* اعداد مثبت یعنی ورود و اعداد منفی یعنی خروج.</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">دلیل / پروژه</label>
                        <textarea 
                            className="nexus-input w-full px-3 py-2 text-sm min-h-[60px] resize-none"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold transition">انصراف</button>
                        <button onClick={() => onSave(log.log_id, qty, reason)} className="flex-1 py-2 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white text-sm font-bold transition shadow-lg">ذخیره و اصلاح انبار</button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
};

// =========================================================================
/**
 * نام کامپوننت: PersianDatePicker
 * کارایی: کامپوننت انتخاب تاریخ شمسی (سال، ماه، روز)
 */
// =========================================================================
const PersianDatePicker = ({ label, value, onChange }) => {
    // =========================================================================
    // بخش منطق و توابع (LOGIC & FUNCTIONS)
    // =========================================================================
    const [isOpen, setIsOpen] = useState(false);
    const [tempDate, setTempDate] = useState({ y: 1403, m: 1, d: 1 });
    const popupRef = useRef(null);

    // مدیریت بستن منوی تاریخ با کلیک بیرون از آن
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // تنظیم تاریخ اولیه هنگام باز شدن
    useEffect(() => {
        if (value) {
            const parts = toEnglishDigits(value).split('/');
            if (parts.length === 3) {
                setTempDate({ y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) });
            }
        } else {
            const now = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/'); 
            if (now.length === 3) {
                setTempDate({ y: parseInt(now[0]), m: parseInt(now[1]), d: parseInt(now[2]) });
            }
        }
    }, [value, isOpen]);

    const handleConfirm = () => {
        const mStr = tempDate.m.toString().padStart(2, '0');
        const dStr = tempDate.d.toString().padStart(2, '0');
        const dateStr = `${tempDate.y}/${mStr}/${dStr}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClear = () => { onChange(""); setIsOpen(false); };
    const years = Array.from({ length: 21 }, (_, i) => 1395 + i);
    const days = Array.from({ length: 31 }, (_, i) => 1 + i);

    // =========================================================================
    // بخش نمایش و رابط کاربری (VIEW / UI)
    // =========================================================================
    return (
        <div className="relative" ref={popupRef}>
            <span className="absolute -top-2 right-2 text-[9px] text-gray-400 bg-[#1e293b] px-1 z-10">{label}</span>
            <div onClick={() => setIsOpen(!isOpen)} className="nexus-input w-full h-[38px] px-3 py-2 text-sm bg-black/20 border-white/10 cursor-pointer flex items-center justify-between hover:bg-white/5 transition">
                <span className={value ? "text-white" : "text-gray-500"}>{value ? toPersianDigits(value) : "انتخاب کنید..."}</span>
                <i data-lucide="calendar" className="w-4 h-4 text-gray-400"></i>
            </div>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1 text-center">سال</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.y} onChange={e => setTempDate({...tempDate, y: parseInt(e.target.value)})}>{years.map(y => <option key={y} value={y}>{toPersianDigits(y)}</option>)}</select></div>
                        <div className="flex-[1.5]"><label className="block text-[10px] text-gray-500 mb-1 text-center">ماه</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.m} onChange={e => setTempDate({...tempDate, m: parseInt(e.target.value)})}>{persianMonths.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select></div>
                        <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1 text-center">روز</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.d} onChange={e => setTempDate({...tempDate, d: parseInt(e.target.value)})}>{days.map(d => <option key={d} value={d}>{toPersianDigits(d)}</option>)}</select></div>
                    </div>
                    <div className="flex gap-2"><button onClick={handleClear} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition">پاک کردن</button><button onClick={handleConfirm} className="flex-1 py-1.5 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-xs text-white font-bold transition shadow-lg">تایید</button></div>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// کامپوننت‌های اصلی صفحات (MAIN PAGE COMPONENTS)
// =========================================================================

// =========================================================================
/**
 * نام کامپوننت: ContactsPage
 * کارایی: مدیریت کامل تامین‌کنندگان (لیست، افزودن، ویرایش، حذف)
 */
// =========================================================================
const ContactsPage = ({ serverStatus }) => {
    // =========================================================================
    // بخش منطق و توابع (LOGIC & FUNCTIONS)
    // =========================================================================
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ id: null, name: '', phone: '', mobile: '', fax: '', website: '', email: '', address: '', notes: '' });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [copyFeedback, setCopyFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const notify = useNotify();
    const dialog = useDialog();

    // =========================================================================
    /**
     * نام تابع: loadContacts
     * کارایی: بارگذاری لیست مخاطبین از سرور
     */
    // =========================================================================
    const loadContacts = useCallback(async () => { 
        setIsLoading(true);
        try { 
            const { ok, data } = await fetchAPI('/contacts'); 
            if (ok) setContacts(Array.isArray(data) ? data : []); 
        } catch (e) {
            notify.show('خطا', 'عدم برقراری ارتباط با سرور', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    // =========================================================================
    /**
     * متغیر محاسباتی: filteredContacts
     * کارایی: فیلتر کردن مخاطبین بر اساس عبارت جستجو شده (نام، موبایل، آدرس، یادداشت)
     */
    // =========================================================================
    const filteredContacts = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        if (!lower) return contacts;
        return contacts.filter(c => 
            (c.name && c.name.toLowerCase().includes(lower)) || 
            (c.mobile && c.mobile.includes(lower)) || 
            (c.notes && c.notes.toLowerCase().includes(lower)) ||
            (c.address && c.address.toLowerCase().includes(lower))
        );
    }, [contacts, searchTerm]);

    useLucide([contacts, newContact.id, errors, searchTerm, filteredContacts.length, isLoading]);

    // =========================================================================
    /**
     * نام تابع: copyToClipboard
     * کارایی: کپی کردن متن (مانند شماره تماس) در کلیپ‌بورد و نمایش فیدبک بصری
     */
    // =========================================================================
    const copyToClipboard = (e, text) => {
        if (!text) return;
        e.stopPropagation(); 
        document.execCommand('copy'); // برای سازگاری بهتر در محیط Canvas
        navigator.clipboard.writeText(text);
        setCopyFeedback({ x: e.clientX, y: e.clientY });
        setTimeout(() => setCopyFeedback(null), 1500);
    };

    // =========================================================================
    /**
     * نام تابع: validatePhoneFormat
     * کارایی: بررسی صحت فرمت شماره تلفن/موبایل (شروع با 0 و طول مناسب)
     */
    // =========================================================================
    const validatePhoneFormat = (num) => {
        if (!num) return true;
        const clean = num.trim();
        if (!clean.startsWith('0')) return false;
        if (clean.length < 10 || clean.length > 11) return false;
        return true;
    };

    const handleChange = (field, value) => {
        setNewContact(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[field];
                return newErrs;
            });
        }
    };

    // =========================================================================
    /**
     * نام تابع: handleSave
     * کارایی: اعتبارسنجی فرم و ذخیره/ویرایش اطلاعات مخاطب در سرور
     */
    // =========================================================================
    const handleSave = async () => { 
        const newErrors = {};
        let isValid = true;
        
        if (!newContact.name.trim()) { newErrors.name = true; isValid = false; }
        if (!newContact.address.trim()) { newErrors.address = true; isValid = false; }
        
        const hasPhone = newContact.phone && newContact.phone.trim();
        const hasMobile = newContact.mobile && newContact.mobile.trim();
        
        if (!hasPhone && !hasMobile) { 
            newErrors.phone = true; 
            newErrors.mobile = true; 
            isValid = false; 
            notify.show('خطا', "حداقل یک شماره تماس الزامی است", 'error'); 
        } else {
            if (hasPhone && !validatePhoneFormat(newContact.phone)) { newErrors.phone = true; isValid = false; notify.show('خطا', "فرمت تلفن اشتباه است", 'error'); }
            if (hasMobile && !validatePhoneFormat(newContact.mobile)) { newErrors.mobile = true; isValid = false; notify.show('خطا', "فرمت موبایل اشتباه است", 'error'); }
        }

        setErrors(newErrors);
        if (!isValid) return;

        try { 
            const { ok } = await fetchAPI('/contacts/save', { method: 'POST', body: newContact }); 
            if (ok) { 
                loadContacts(); 
                setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); 
                notify.show('موفقیت', "اطلاعات با موفقیت ثبت شد.", 'success'); 
            } 
        } catch (e) { 
            notify.show('خطا', "مشکل در ذخیره‌سازی اطلاعات", 'error'); 
        } 
    };

    // =========================================================================
    /**
     * نام تابع: handleDelete
     * کارایی: حذف مخاطب پس از تایید کاربر
     */
    // =========================================================================
    const handleDelete = async (id) => { 
        if(await dialog.ask("حذف مخاطب", "آیا از حذف این مخاطب از دفترچه تلفن اطمینان دارید؟", "danger")) { 
            try { 
                const { ok } = await fetchAPI(`/contacts/delete/${id}`, {method:'DELETE'}); 
                if(ok) {
                    loadContacts(); 
                    notify.show('حذف شد', 'مخاطب با موفقیت حذف گردید.', 'success');
                }
            } catch(e){
                notify.show('خطا', 'مشکلی در حذف رخ داد.', 'error');
            } 
        } 
    };

    // =========================================================================
    /**
     * نام تابع: handleEdit
     * کارایی: پر کردن فرم با اطلاعات مخاطب انتخاب شده جهت ویرایش
     */
    // =========================================================================
    const handleEdit = (c) => { 
        setNewContact(c); 
        setErrors({}); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // =========================================================================
    /**
     * نام تابع: preventNonNumeric
     * کارایی: جلوگیری از ورود کاراکترهای غیرعددی در فیلدهای شماره تماس
     */
    // =========================================================================
    const preventNonNumeric = (e) => { 
        if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) { 
            e.preventDefault(); 
        } 
    };

    // =========================================================================
    // بخش نمایش و رابط کاربری (VIEW / UI)
    // =========================================================================
    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full relative">
            {copyFeedback && (
                <div className="fixed z-[9999] pointer-events-none bg-nexus-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-white/20 animate-in fade-in zoom-in duration-200 flex items-center gap-1" style={{ top: copyFeedback.y + 15, left: copyFeedback.x + 15 }}>
                    <i data-lucide="check" className="w-3 h-3"></i> کپی شد!
                </div>
            )}
            
            <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between mb-4">
                <div><h2 className="text-2xl font-black text-white flex items-center gap-3"><i data-lucide="contact-2" className="text-nexus-primary w-6 h-6"></i>مدیریت تامین‌کنندگان</h2><p className="text-gray-400 text-xs mt-1">لیست دفترچه تلفن و آدرس‌های خرید</p></div>
                <div className="w-64 relative"><i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"></i><input className="nexus-input w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-black/20 focus:bg-black/40 border-white/10" placeholder="جستجو در مخاطبین..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            </header>

            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
                {/* لیست مخاطبین */}
                <div className="xl:col-span-8 overflow-y-auto custom-scroll pr-2 pb-10">
                    {isLoading ? (
                        <div className="py-20 text-center text-nexus-accent"><i className="w-8 h-8 border-4 border-nexus-accent/30 border-t-nexus-accent rounded-full animate-spin mx-auto mb-4"></i>در حال بارگذاری...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredContacts.length === 0 && <div className="col-span-full py-20 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/5 text-center">مخاطبی یافت نشد.</div>}
                            {filteredContacts.map(c => {
                                const isEditing = newContact.id === c.id;
                                return (
                                    <div key={c.id} className={`glass-panel p-5 rounded-3xl border transition-all duration-300 group relative overflow-hidden flex flex-col gap-3 hover:-translate-y-1 hover:shadow-xl ${isEditing ? 'border-nexus-primary bg-nexus-primary/5 ring-1 ring-nexus-primary/30' : 'border-white/5 hover:border-white/20'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-white/10 shadow-inner">{c.name.charAt(0).toUpperCase()}</div>
                                                <div><h3 className="font-bold text-white text-base truncate max-w-[200px]" title={c.name}>{c.name}</h3>{c.website && <a href={c.website} target="_blank" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"><i data-lucide="globe" className="w-3 h-3"></i> وب‌سایت</a>}</div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(c)} className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'}`}><i data-lucide="pencil" className="w-4 h-4"></i></button>
                                                <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5 w-full"></div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {c.mobile && <div onClick={(e) => copyToClipboard(e, c.mobile)} className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-black/40 transition group/item hover:border-nexus-primary/30"><div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i data-lucide="smartphone" className="w-3 h-3"></i></div><span className="font-mono text-gray-300 group-hover/item:text-white transition-colors">{c.mobile}</span></div>}
                                            {c.phone && <div onClick={(e) => copyToClipboard(e, c.phone)} className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-black/40 transition group/item hover:border-nexus-primary/30"><div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><i data-lucide="phone" className="w-3 h-3"></i></div><span className="font-mono text-gray-300 group-hover/item:text-white transition-colors">{c.phone}</span></div>}
                                            {c.fax && <div className="col-span-2 bg-black/10 p-2 rounded-xl border border-white/5 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-400"><i data-lucide="printer" className="w-3 h-3"></i></div><span className="text-[10px] text-gray-400">فکس: </span><span className="font-mono text-gray-300">{c.fax}</span></div>}
                                        </div>
                                        <div className="space-y-2">
                                            {c.email && <div onClick={(e) => copyToClipboard(e, c.email)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer transition p-1 rounded hover:bg-white/5 hover:text-nexus-primary"><i data-lucide="mail" className="w-3.5 h-3.5 text-orange-400"></i><span className="font-mono truncate">{c.email}</span></div>}
                                            <div className="flex items-start gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded-xl"><i data-lucide="map-pin" className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0"></i><span className="leading-relaxed">{c.address}</span></div>
                                        </div>
                                        {c.notes && <div className="mt-auto pt-2 border-t border-dashed border-white/10 flex items-start gap-2"><i data-lucide="sticky-note" className="w-3 h-3 text-gray-500 mt-1 shrink-0"></i><p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{c.notes}</p></div>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* فرم افزودن/ویرایش */}
                <div className="xl:col-span-4 h-full overflow-y-auto custom-scroll">
                    <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-2xl relative bg-gradient-to-b from-white/5 to-[#020617]">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 sticky top-0 bg-[#0f172a]/95 backdrop-blur z-10 -mx-5 px-5 -mt-5 pt-5 rounded-t-2xl"><h3 className="text-lg font-bold text-white flex items-center gap-2">{newContact.id ? <><i data-lucide="user-cog" className="text-nexus-accent w-5 h-5"></i> <span className="text-orange-100">ویرایش مخاطب</span></> : <><i data-lucide="user-plus" className="text-emerald-400 w-5 h-5"></i> <span className="text-emerald-100">افزودن مخاطب</span></>}</h3>{newContact.id && <button onClick={() => { setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); setErrors({}); }} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition">انصراف</button>}</div>
                        <div className="space-y-4">
                            <NexusInput label="نام شرکت / شخص *" value={newContact.name} onChange={e => handleChange('name', e.target.value)} disabled={!serverStatus} error={errors.name} placeholder="فروشگاه قطعات..." />
                            <div className="grid grid-cols-2 gap-3">
                                <NexusInput label="موبایل *" dir="ltr" maxLength={11} onKeyPress={preventNonNumeric} value={newContact.mobile} onChange={e => handleChange('mobile', e.target.value)} disabled={!serverStatus} error={errors.mobile} placeholder="09..." />
                                <NexusInput label="تلفن *" dir="ltr" maxLength={11} onKeyPress={preventNonNumeric} value={newContact.phone} onChange={e => handleChange('phone', e.target.value)} disabled={!serverStatus} error={errors.phone} placeholder="021..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3"><NexusInput label="فکس" dir="ltr" value={newContact.fax} onChange={e => handleChange('fax', e.target.value)} disabled={!serverStatus} /><NexusInput label="وب‌سایت" dir="ltr" value={newContact.website} onChange={e => handleChange('website', e.target.value)} disabled={!serverStatus} placeholder="example.com" /></div>
                            <NexusInput label="ایمیل" dir="ltr" value={newContact.email} onChange={e => handleChange('email', e.target.value)} disabled={!serverStatus} placeholder="info@example.com" />
                            <NexusInput label="آدرس دقیق *" value={newContact.address} onChange={e => handleChange('address', e.target.value)} disabled={!serverStatus} error={errors.address} placeholder="شهر، خیابان..." />
                            <div className="flex flex-col"><label className="text-xs mb-1 block font-medium text-gray-400">توضیحات تکمیلی</label><textarea className="nexus-input w-full px-3 py-2 text-sm min-h-[60px] resize-none bg-black/20 border-white/10 rounded-lg focus:border-nexus-primary/50" value={newContact.notes} onChange={e => handleChange('notes', e.target.value)} disabled={!serverStatus} /></div>
                            <button onClick={handleSave} disabled={!serverStatus} className={`w-full py-4 rounded-xl font-black text-white text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${newContact.id ? 'bg-gradient-to-r from-nexus-accent to-blue-600' : 'bg-gradient-to-r from-nexus-primary to-indigo-600'}`}>{newContact.id ? 'ذخیره تغییرات' : 'ثبت مخاطب جدید'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =========================================================================
/**
 * نام کامپوننت: LogPage
 * کارایی: نمایش و مدیریت تاریخچه تراکنش‌ها (Log) با امکان فیلتر و جستجو
 */
// =========================================================================
const LogPage = () => {
    // =========================================================================
    // بخش منطق و توابع (LOGIC & FUNCTIONS)
    // =========================================================================
    const [logList, setLogList] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ general: "", user: "", operation: "", startDate: "", endDate: "" });
    const [editModal, setEditModal] = useState({ open: false, log: null });

    const notify = useNotify();
    const dialog = useDialog();

    // =========================================================================
    /**
     * نام تابع: loadLogs
     * کارایی: دریافت لیست لاگ‌ها و تنظیمات سیستم از سرور
     */
    // =========================================================================
    const loadLogs = useCallback(async () => { 
        setLoading(true);
        try {
            const [logRes, configRes] = await Promise.all([
                fetchAPI('/log'),
                fetchAPI('/settings/config')
            ]); 
            if (logRes.ok) setLogList(Array.isArray(logRes.data) ? logRes.data : []); 
            if (configRes.ok) setConfig(configRes.data);
        } catch(e) { 
            notify.show('خطا', 'عدم برقراری ارتباط با بخش تاریخچه', 'error');
        } finally {
            setLoading(false); 
        }
    }, [notify]);

    useEffect(() => { loadLogs(); }, [loadLogs]);
    
    // =========================================================================
    /**
     * نام تابع: handleDeleteLog
     * کارایی: حذف یک لاگ و بازگردانی خودکار تغییرات موجودی انبار
     */
    // =========================================================================
    const handleDeleteLog = async (log) => {
        const text = `آیا از حذف این تراکنش و اصلاح "معکوس" موجودی انبار اطمینان دارید؟ این عمل موجودی فعلی قطعه را تغییر خواهد داد.\nمقدار تراکنش: ${log.quantity_added} عدد`;
        if (await dialog.ask("حذف و واگردانی تراکنش", text, "danger")) {
            try {
                const { ok } = await fetchAPI(`/log/delete/${log.log_id}`, { method: 'DELETE' });
                if (ok) {
                    notify.show('تراکنش حذف شد', 'موجودی انبار به صورت خودکار اصلاح گردید.', 'success');
                    loadLogs();
                }
            } catch (e) { notify.show('خطا', 'خطا در ارتباط با سرور', 'error'); }
        }
    };

    // =========================================================================
    /**
     * نام تابع: handleUpdateLog
     * کارایی: ویرایش مقدار یا دلیل یک لاگ و اعمال اختلاف در موجودی انبار
     */
    // =========================================================================
    const handleUpdateLog = async (log_id, new_qty, new_reason) => {
        try {
            const { ok } = await fetchAPI('/log/update', { 
                method: 'POST', 
                body: { log_id, quantity_added: new_qty, reason: new_reason } 
            });
            if (ok) {
                notify.show('تراکنش اصلاح شد', 'تفاضل مقدار در انبار اعمال گردید.', 'success');
                setEditModal({ open: false, log: null });
                loadLogs();
            }
        } catch (e) { notify.show('خطا', 'خطا در اعمال تغییرات', 'error'); }
    };

    // =========================================================================
    /**
     * متغیر محاسباتی: filteredLogs
     * کارایی: فیلتر کردن لیست لاگ‌ها بر اساس تاریخ، کاربر، نوع عملیات و جستجوی عمومی
     */
    // =========================================================================
    const filteredLogs = useMemo(() => {
        return logList.filter(l => {
            const logDateObj = new Date(l.timestamp);
            const logShamsi = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(logDateObj); 
            
            if (filters.startDate && logShamsi < filters.startDate) return false;
            if (filters.endDate && logShamsi > filters.endDate) return false;
            
            const terms = filters.general ? toEnglishDigits(filters.general.toLowerCase()).trim().split(/\s+/) : [];
            const searchableText = toEnglishDigits(`${l.val || ''} ${l.username || ''} ${l.operation_type || ''} ${l.reason || ''} ${l.invoice_number || ''} ${getPartCodeLog(l, config)}`.toLowerCase());
            
            const generalMatch = terms.length === 0 || terms.every(term => searchableText.includes(term));
            const userMatch = !filters.user || (l.username && l.username.toLowerCase().includes(filters.user.toLowerCase()));
            const opMatch = !filters.operation || (l.operation_type === filters.operation);
            
            return generalMatch && userMatch && opMatch;
        });
    }, [logList, filters, config]);

    useLucide([filteredLogs, filters, editModal.open, loading]); 
    
    if (loading) return <div className="flex justify-center items-center h-full text-nexus-accent"><i className="w-10 h-10 border-4 border-nexus-accent/30 border-t-nexus-accent rounded-full animate-spin"></i></div>;
    
    const formatMoney = (val) => val ? Number(val).toLocaleString() : '0';

    // =========================================================================
    // بخش نمایش و رابط کاربری (VIEW / UI)
    // =========================================================================
    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <EditLogModal 
                isOpen={editModal.open} 
                log={editModal.log} 
                onClose={() => setEditModal({ open: false, log: null })} 
                onSave={handleUpdateLog}
            />

            <header className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><i data-lucide="history" className="w-6 h-6 text-nexus-primary"></i>تاریخچه تراکنش‌های انبار</h2><span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">{filteredLogs.length} تراکنش</span></div>
                
                {/* بخش فیلترها */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-3"><input className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" placeholder="جستجو (کد، نام، دلیل)..." value={filters.general} onChange={e => setFilters({...filters, general: e.target.value})} /></div>
                    <div className="md:col-span-2"><input className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" placeholder="نام کاربر" value={filters.user} onChange={e => setFilters({...filters, user: e.target.value})} /></div>
                    <div className="md:col-span-2"><select className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40 appearance-none cursor-pointer" value={filters.operation} onChange={e => setFilters({...filters, operation: e.target.value})}><option value="">همه عملیات‌ها</option><option value="ENTRY">ورود (ENTRY)</option><option value="EXIT">خروج (EXIT)</option><option value="UPDATE">ویرایش (UPDATE)</option><option value="DELETE">حذف (DELETE)</option></select></div>
                    <div className="md:col-span-5 flex gap-2 items-center">
                        <div className="flex-1"><PersianDatePicker label="از تاریخ" value={filters.startDate} onChange={date => setFilters({...filters, startDate: date})} /></div><span className="text-gray-600">-</span><div className="flex-1"><PersianDatePicker label="تا تاریخ" value={filters.endDate} onChange={date => setFilters({...filters, endDate: date})} /></div>
                        {(filters.startDate || filters.endDate || filters.general || filters.user || filters.operation) && (<button onClick={() => setFilters({general: "", user: "", operation: "", startDate: "", endDate: ""})} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition h-[38px] w-[38px] flex items-center justify-center"><i data-lucide="filter-x" className="w-4 h-4"></i></button>)}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll pr-2 relative">
                {/* خط زمانی بصری (Timeline) */}
                <div className="absolute top-0 right-[27px] w-0.5 h-full bg-white/10 z-0"></div>
                <div className="space-y-6 relative z-10 pb-10">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <i data-lucide="search-x" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>تراکنشی با این فیلترها یافت نشد.</p>
                        </div>
                    ) : (
                        filteredLogs.map(l => {
                            const isEntry = l.quantity_added > 0; 
                            const isDelete = l.operation_type?.includes('DELETE'); 
                            const isEdit = l.operation_type?.includes('UPDATE');
                            
                            let colorClass = '', iconName = '', borderColor = '', titleText = '';
                            if (isDelete) { colorClass = 'text-gray-400 bg-gray-500/10'; borderColor = 'border-gray-600'; iconName = 'trash-2'; titleText = 'حذف قطعه'; } 
                            else if (isEdit) { colorClass = 'text-yellow-400 bg-yellow-500/10'; borderColor = 'border-yellow-500/50'; iconName = 'pencil-line'; titleText = 'ویرایش اطلاعات'; } 
                            else if (isEntry) { colorClass = 'text-emerald-400 bg-emerald-500/10'; borderColor = 'border-emerald-500'; iconName = 'arrow-down-left'; titleText = 'ورود به انبار'; } 
                            else { colorClass = 'text-rose-400 bg-rose-500/10'; borderColor = 'border-rose-500'; iconName = 'arrow-up-right'; titleText = 'خروج از انبار'; }
                            
                            const pCode = getPartCodeLog(l, config);
                            
                            return (
                                <div key={l.log_id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 group-hover:scale-110 bg-[#0f172a] ${borderColor} ${colorClass.split(' ')[0]}`}><i data-lucide={iconName} className="w-6 h-6"></i></div>
                                    <div className={`flex-1 glass-panel p-4 rounded-2xl border transition-all hover:bg-white/[0.02] ${isEdit ? 'border-yellow-500/20' : 'border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-bold ${colorClass.split(' ')[0]}`}>{titleText}</span>
                                                    <span className="text-[10px] text-nexus-accent font-mono font-bold bg-nexus-accent/10 px-2 py-0.5 rounded-full border border-nexus-accent/20 tracking-tighter">{pCode}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{l.operation_type}</span>
                                                    {l.invoice_number && (
                                                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mr-1">
                                                            فاکتور: {l.invoice_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-white ltr font-mono text-right flex items-center gap-2">{l.val}<span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded">{l.package || '-'}</span></h3>
                                            </div>
                                            <div className="text-left flex flex-col items-end">
                                                {/* عملیات سریع روی هر تراکنش */}
                                                <div className="flex gap-2 mb-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditModal({ open: true, log: l })} title="اصلاح تراکنش" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><i data-lucide="pencil" className="w-3.5 h-3.5"></i></button>
                                                    <button onClick={() => handleDeleteLog(l)} title="حذف و واگردانی" className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><i data-lucide="trash-2" className="w-3.5 h-3.5"></i></button>
                                                </div>
                                                <span className="text-xs text-gray-300 font-mono bg-white/5 px-2 py-1 rounded">{toShamsiDateTime(l.timestamp)}</span>
                                                <span className="text-[10px] text-nexus-primary mt-1 flex items-center gap-1"><i data-lucide="user" className="w-3 h-3"></i> {l.username || 'سیستم'}</span>
                                            </div>
                                        </div>

                                        {/* جزئیات فنی تراکنش */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">نوع قطعه</span><span className="text-white font-bold">{l.type || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">تکنولوژی/وات</span><span className="text-white dir-ltr">{l.tech || l.watt || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">محل نگهداری</span><span className="text-orange-300 flex items-center gap-1"><i data-lucide="map-pin" className="w-3 h-3"></i> {l.storage_location || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">دلیل/پروژه</span><span className="text-white truncate font-medium" title={l.reason}>{l.reason || '-'}</span></div>
                                        </div>

                                        <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-3">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">{l.vendor_name && <span className="flex items-center gap-1"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i> {l.vendor_name}</span>}{l.unit_price > 0 && <span className="flex items-center gap-1 font-mono text-amber-400"><i data-lucide="tag" className="w-3 h-3"></i> {formatMoney(l.unit_price)} T</span>}</div>
                                            
                                            {/* نمایش مقدار تغییر موجودی */}
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

// =========================================================================
// اکسپورت‌های سراسری (GLOBAL EXPORTS)
// =========================================================================
window.ContactsPage = ContactsPage;
window.LogPage = LogPage;