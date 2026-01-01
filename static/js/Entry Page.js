// ====================================================================================================
// نسخه: 0.20
// فایل: Entry Page.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل یکی از مهم‌ترین صفحات برنامه است که وظیفه "ثبت ورود کالا" و "مدیریت موجودی" را بر عهده دارد.
// 
// قابلیت‌های اصلی:
// ۱. فرم ثبت قطعه جدید با فیلدهای داینامیک (بر اساس تنظیمات ادمین).
// ۲. لیست قطعات موجود با قابلیت جستجو و فیلتر پیشرفته.
// ۳. شناسایی هوشمند قطعات تکراری برای جلوگیری از ثبت مجدد.
// ۴. ویرایش و حذف قطعات موجود.
// ۵. تولید کد اختصاصی ۱۲ رقمی برای هر قطعه.
// ۶. محاسبه قیمت‌ها (ریالی و دلاری) و مدیریت لینک‌های خرید.
// ====================================================================================================

// ----------------------------------------------------------------------------------------------------
// [تگ: نگاشت فیلدهای پویا]
// این آرایه ثابت، ارتباط بین تنظیمات ذخیره شده در دیتابیس (تنظیمات ادمین)
// و نام متغیرها در فرم ورود اطلاعات (formData) را برقرار می‌کند.
// اگر در آینده فیلدی اضافه شود، باید اینجا تعریف گردد.
// ----------------------------------------------------------------------------------------------------
const DYNAMIC_FIELDS_MAP = [
    { key: 'units', stateKey: 'unit', label: 'واحد' },
    { key: 'tolerances', stateKey: 'tol', label: 'تولرانس' },
    { key: 'paramOptions', stateKey: 'watt', label: 'پارامتر فنی' }, // مثلا وات برای مقاومت
    { key: 'packages', stateKey: 'pkg', label: 'پکیج' },
    { key: 'techs', stateKey: 'tech', label: 'تکنولوژی' },
    // فیلدهای توسعه یافته (رزرو شده برای آینده)
    { key: 'list5', stateKey: 'list5', label: 'فیلد ۵' },
    { key: 'list6', stateKey: 'list6', label: 'فیلد ۶' },
    { key: 'list7', stateKey: 'list7', label: 'فیلد ۷' },
    { key: 'list8', stateKey: 'list8', label: 'فیلد ۸' },
    { key: 'list9', stateKey: 'list9', label: 'فیلد ۹' },
    { key: 'list10', stateKey: 'list10', label: 'فیلد ۱۰' },
];


// ----------------------------------------------------------------------------------------------------
// [تگ: تولید کد قطعه]
// این تابع یک کد یکتا (UID) برای قطعه تولید می‌کند.
// ساختار کد: [پیشوند ۳ حرفی][شناسه ۹ رقمی] (مثال: RES000000123)
// ----------------------------------------------------------------------------------------------------
const getPartCode = (p, globalConfig) => {
    // اگر کد از قبل در دیتابیس ذخیره شده، همان را نشان بده
    if (p && p.part_code) return p.part_code; 
    
    // اگر قطعه جدید است و هنوز ID ندارد (هنوز در دیتابیس ثبت نشده)
    if (!p || !p.id) return "---";
    
    // دریافت پیشوند از تنظیمات (مثلاً RES برای مقاومت) یا استفاده از پیش‌فرض PRT
    const prefix = (globalConfig && globalConfig[p.type]?.prefix) || "PRT";
    // تبدیل ID به رشته ۹ رقمی با صفرهای ابتدایی
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت مودال خلاصه وضعیت]
// پنجره‌ای که قبل از ثبت نهایی نمایش داده می‌شود تا کاربر اطلاعات را بازبینی کند.
// ----------------------------------------------------------------------------------------------------
const SummaryModal = ({ isOpen, onClose, onConfirm, data, globalConfig }) => {
    if (!isOpen) return null;
    const fullCode = getPartCode(data, globalConfig);
    
    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4 text-center border-b border-white/10 pb-3">پیش‌نمایش ثبت قطعه</h3>
                <div className="space-y-3 text-sm text-gray-300 mb-6">
                    <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 font-bold">کد ۱۲ کاراکتری:</span> 
                        <span className="text-white font-black font-mono tracking-widest">{fullCode}</span>
                    </div>
                    {/* نمایش جزئیات ثبت شده */}
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


// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت دراپ‌داون قابل جستجو]
// جایگزین Select معمولی برای مدیریت لیست‌های طولانی با قابلیت جستجو و اعتبارسنجی سخت‌گیرانه
// ----------------------------------------------------------------------------------------------------
const SearchableDropdown = ({ label, value, options, onChange, disabled, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);
    const notify = useNotify();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => { setSearchTerm(value || ""); }, [value]);

    const filteredOptions = (options || []).filter(item => 
        String(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBlur = () => {
        setTimeout(() => {
            const exactMatch = (options || []).find(opt => String(opt) === searchTerm);
            if (searchTerm && !exactMatch) {
                notify.show('خطای انتخاب', `مقدار "${searchTerm}" در لیست مجاز نیست.`, 'error');
                onChange("");
                setSearchTerm("");
            }
            setIsOpen(false);
        }, 200);
    };

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            <label className="block text-[10px] font-bold text-gray-500 mb-1 pr-1">{label}</label>
            <div className="relative">
                {/* اصلاح استایل اینپوت برای هماهنگی با تم Nexus */}
                <input
                    type="text"
                    className={`nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:border-nexus-primary transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={handleBlur}
                    placeholder={placeholder || "انتخاب..."}
                    disabled={disabled}
                    dir="ltr"
                />
                <div className="absolute left-2 top-2.5 pointer-events-none text-gray-500">
                    <i data-lucide="chevron-down" className="w-4 h-4"></i>
                </div>
            </div>

            {/* اصلاح لیست نتایج: استفاده از تم شیشه‌ای تیره H&Y */}
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto custom-scroll bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((item, idx) => (
                            <div 
                                key={idx}
                                onClick={() => { onChange(item); setSearchTerm(item); setIsOpen(false); }}
                                className="px-3 py-2 text-sm text-gray-300 hover:bg-nexus-primary/20 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 font-mono"
                            >
                                {item}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-red-400 text-center bg-red-500/5">یافت نشد</div>
                    )}
                </div>
            )}
        </div>
    );
};


// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت اصلی صفحه ورود]
// ----------------------------------------------------------------------------------------------------
const EntryPage = ({ setView, serverStatus, user, globalConfig }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: وضعیت‌های فرم و داده‌ها]
    // formData: نگهداری مقادیر تمام فیلدهای ورودی.
    // partsList: لیست کل قطعات موجود در انبار (دریافتی از سرور).
    // contacts: لیست مخاطبین/فروشندگان برای پیشنهاد در فیلد فروشنده.
    // filters: مقادیر فیلترهای جستجو در لیست سمت چپ.
    // errors: آبجکت نگهداری خطاهای اعتبارسنجی (Validation).
    // showSummary: کنترل نمایش مودال پیش‌نمایش.
    // linkInput: متغیر موقت برای اینپوت افزودن لینک خرید.
    // ------------------------------------------------------------------------------------------------
    const [formData, setFormData] = useState({ 
    id: null, val: "", unit: "", watt: "", tol: "", pkg: "", type: "Resistor", 
    date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", 
    min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: [], 
    invoice_number: "",
    // مقادیر اولیه فیلدهای جدید
    list5: "", list6: "", list7: "", list8: "", list9: "", list10: ""
    });
    const [partsList, setPartsList] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [filters, setFilters] = useState({ val: '', pkg: '', loc: '', type: '', code: '' });
    const [errors, setErrors] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [linkInput, setLinkInput] = useState(""); 
    
    // هوک‌های اعلان و دیالوگ
    const notify = useNotify();
    const dialog = useDialog();
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: بارگذاری اطلاعات]
    // دریافت لیست قطعات و لیست مخاطبین از API هنگام لود صفحه.
    // ------------------------------------------------------------------------------------------------
    const loadData = useCallback(async () => { 
        try { 
            const [partsRes, contactsRes] = await Promise.all([fetchAPI('/parts'), fetchAPI('/contacts')]);
            if(partsRes.ok) setPartsList(Array.isArray(partsRes.data) ? partsRes.data : []);
            if(contactsRes.ok) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        } catch(e){} 
    }, []);
    
    useEffect(() => { loadData(); }, [loadData]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: تشخیص تکراری]
    // این هوک بررسی می‌کند آیا قطعه‌ای با مشخصات وارد شده (نوع، مقدار، پکیج) قبلاً ثبت شده است یا خیر.
    // اگر موردی پیدا شود، در لیست هشدارهای زرد رنگ نمایش داده می‌شود.
    // ------------------------------------------------------------------------------------------------
    const duplicates = useMemo(() => {
        if (!formData.val || !formData.type) {
            return [];
        }
        const clean = (str) => String(str || '').toLowerCase().replace(/\s+/g, '');
        const formFullVal = clean(formData.val + (formData.unit && formData.unit !== '-' ? formData.unit : ''));
        
        return partsList.filter(p => {
            if (formData.id && p.id === formData.id) return false; // خود قطعه در حال ویرایش را نادیده بگیر
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

    // ------------------------------------------------------------------------------------------------
    // [تگ: فیلتر کردن لیست]
    // اعمال فیلترهای جستجو (نوع، مقدار، پکیج، آدرس، کد) روی لیست قطعات سمت چپ.
    // ------------------------------------------------------------------------------------------------
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
            
            // فیلتر اصلی: فقط قطعات هم‌نوع با دسته‌بندی انتخاب شده در فرم نمایش داده شوند
            if (activeCategory && pType !== activeCategory) return false;
            
            // اعمال فیلترهای کاربر
            if (filterVal && !pVal.includes(filterVal)) return false;
            if (filterPkg && !pPkg.includes(filterPkg)) return false;
            if (filterLoc && !pLoc.includes(filterLoc)) return false;
            if (filterType && !pType.includes(filterType)) return false;
            if (filterCode && !pCode.includes(filterCode)) return false;
            return true;
        });
    }, [partsList, filters, formData.type, globalConfig]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: گزینه‌های داینامیک]
    // ساخت لیست پیشنهادی برای فیلد فروشنده و آدرس انبار.
    // ------------------------------------------------------------------------------------------------
    const vendorOptions = useMemo(() => {
        const names = contacts.map(c => c.name);
        // اگر نام وارد شده در لیست نیست، موقتاً به گزینه‌ها اضافه شود
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

    // بروزرسانی آیکون‌ها
    useLucide([filteredParts.length, formData.type, duplicates.length, formData.purchase_links.length]); 

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت تغییرات فرم]
    // تابع اصلی برای آپدیت استیت formData هنگام تایپ کاربر.
    // شامل منطق فرمت‌بندی اعداد (حذف کاما و محدودیت کاراکتر غیر عددی).
    // ------------------------------------------------------------------------------------------------
    const handleChange = useCallback((key, val) => {
        let v = val;
        // تغییر جدید: جلوگیری از ورود کاراکترهای غیر عددی برای تعداد
        if (key === 'qty' || key === 'min_qty') {
            v = val.replace(/[^0-9]/g, '');
        }
        // فرمت‌بندی ۳ رقم ۳ رقم برای قیمت‌ها
        else if (key === 'price_toman' || key === 'usd_rate') {
            v = formatNumberWithCommas(val.replace(/,/g, ''));
        }
        
        // پاک کردن خطا برای فیلد تغییر یافته
        setErrors(prev => ({...prev, [key]: false}));
        
        // اگر نوع قطعه تغییر کرد، واحد و مقادیر وابسته ریست شوند
        if (key === 'type') {
            const newConfig = globalConfig?.[val] ? globalConfig[val] : (globalConfig?.["Resistor"] || {});
            const defaultUnit = (newConfig.units && newConfig.units.length > 0) ? newConfig.units[0] : "";
            setFormData(prev => ({ ...prev, [key]: v, unit: defaultUnit, watt: "", pkg: "", tech: "" }));
        } else {
            setFormData(prev => ({ ...prev, [key]: v }));
        }
    }, [globalConfig]);
    
    // تابع کمکی برای جلوگیری از تایپ حروف در فیلدهای عددی
    const preventNonNumeric = (e) => {
        if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") { e.preventDefault(); }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت لینک‌ها]
    // افزودن و حذف لینک‌های خرید (حداکثر ۵ لینک).
    // ------------------------------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------------------------------
    // [تگ: اعتبارسنجی فرم]
    // بررسی صحت اطلاعات قبل از ارسال به سرور.
    // این بخش هم فیلدهای ثابت (مثل قیمت) و هم فیلدهای داینامیک (بر اساس تنظیمات ادمین) را چک می‌کند.
    // ------------------------------------------------------------------------------------------------
    const handleSubmit = () => {
        const newErrors = {};
        const typeConfig = globalConfig?.[formData.type] || {}; 

        // 1. بررسی فیلدهای ثابت همیشگی
        if(!formData.val) newErrors.val = true;
        // اجازه ثبت با تعداد صفر داده می‌شود، اما فیلد نباید خالی یا منفی باشد
        if(formData.qty === "" || Number(formData.qty) < 0) newErrors.qty = true;
        
        // بررسی الزامی بودن آدرس از تنظیمات General
        const locSetting = globalConfig?.["General"]?.fields?.['locations'];
        const isLocRequired = locSetting ? locSetting.required : true; // اگر تنظیم نشده بود، پیش‌فرض الزامی است
        if(isLocRequired && !formData.location) newErrors.location = true;
        
        if(!formData.price_toman) newErrors.price_toman = true;
        // اگر وندور الزامی است:
        if(!formData.vendor_name) newErrors.vendor_name = true;

        // 2. بررسی هوشمند فیلدهای داینامیک با توجه به تنظیمات ادمین
        DYNAMIC_FIELDS_MAP.forEach(field => {
            const fieldConfig = typeConfig.fields?.[field.key];
            
            // منطق پیش‌فرض (اگر ادمین هنوز تنظیم نکرده باشد، ۴ تای اصلی نمایش داده می‌شوند)
            const isDefaultVisible = ['units','paramOptions','packages','techs'].includes(field.key);
            const isVisible = fieldConfig ? fieldConfig.visible : isDefaultVisible;
            
            // منطق الزامی بودن
            const isDefaultRequired = ['units','packages'].includes(field.key); // مثلا یونیت و پکیج ذاتا مهم‌اند
            const isRequired = fieldConfig ? fieldConfig.required : isDefaultRequired;

            if (isVisible && isRequired) {
                if (!formData[field.stateKey]) newErrors[field.stateKey] = true;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            notify.show('خطای اعتبارسنجی', 'لطفاً فیلدهای ستاره‌دار (الزامی) را پر کنید.', 'error');
            return;
        }
        setShowSummary(true);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: ثبت نهایی]
    // ارسال داده‌ها به سرور پس از تایید در مودال خلاصه وضعیت.
    // ------------------------------------------------------------------------------------------------
    const handleFinalSubmit = async () => {
        let fullVal = formData.val;
        if(formData.unit && formData.unit !== "-") fullVal += formData.unit;

        // آماده‌سازی پیلود برای ارسال (حذف کاما از قیمت‌ها و ...)
        const payload = { ...formData, val: fullVal, qty: Number(formData.qty) || 0, min_qty: Number(formData.min_qty) || 1, price: String(formData.price_toman).replace(/,/g, ''), usd_rate: String(formData.usd_rate).replace(/,/g, ''), username: user.username , invoice_number: formData.invoice_number};
        try { 
            const { ok, data } = await fetchAPI('/save', { method: 'POST', body: payload });
            if (ok) { 
                loadData(); 
                const typeConfig = globalConfig?.[formData.type] || globalConfig?.["Resistor"] || {};
                const defUnit = (typeConfig.units && typeConfig.units[0]) || "";
                
                // ریست کردن فرم پس از ثبت موفق
                setFormData({ 
                    id: null, val: "", unit: defUnit, watt: "", tol: "", pkg: "", type: formData.type, 
                    date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", 
                    min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: [],
                    list5: "", list6: "", list7: "", list8: "", list9: "", list10: "" 
                });
                notify.show('موفقیت', 'قطعه با موفقیت در انبار ذخیره شد.', 'success');
                setShowSummary(false);
            } else {
                 notify.show('خطا', data.error || 'خطا در ذخیره اطلاعات', 'error');
            }
        } catch(e) { notify.show('خطای سرور', 'خطا در برقراری ارتباط با سرور.', 'error'); }
    };
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: ویرایش قطعه]
    // پر کردن فرم با اطلاعات یک قطعه انتخاب شده از لیست جهت ویرایش.
    // شامل منطق تفکیک مقدار از واحد (مثلا 100uF -> val: 100, unit: uF).
    // ------------------------------------------------------------------------------------------------
    const handleEdit = (p) => {
        let category = p.type || "Resistor"; 
        // منطق تشخیص دسته در صورت عدم وجود (مربوط به دیتای قدیمی)
        if (!globalConfig?.[category]) {
            if (p.val.includes("F")) category = "Capacitor";
            else if (p.val.includes("H")) category = "Inductor";
            else category = "Resistor";
        }
        const config = globalConfig?.[category] ? globalConfig[category] : (globalConfig?.["Resistor"] || {});
        
        // تفکیک هوشمند واحد از مقدار
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
        ...p, 
        val: v, 
        unit: u, 
        tol: p.tolerance, 
        pkg: p.package, 
        type: category, 
        tech: p.tech || "", 
        watt: p.watt, 
        date: p.buy_date, 
        qty: (p.quantity === null || p.quantity === undefined) ? "" : p.quantity, 
        price_toman: formatNumberWithCommas(p.toman_price), 
        usd_rate: formatNumberWithCommas(p.usd_rate || ""), 
        min_qty: (p.min_quantity === null || p.min_quantity === undefined) ? "" : p.min_quantity, 
        location: p.storage_location || "", 
        purchase_links: links, 
        invoice_number: p.invoice_number, 
        part_code: p.part_code,
        // بازگردانی مقادیر فیلدهای اضافی
        list5: p.list5 || "", list6: p.list6 || "", list7: p.list7 || "", 
        list8: p.list8 || "", list9: p.list9 || "", list10: p.list10 || ""
        });
        setErrors({});
    };
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: حذف قطعه - اصلاح شده]
    // حذف قطعه با ارسال نام کاربر جهت ثبت در لاگ تاریخچه
    // ------------------------------------------------------------------------------------------------
    const handleDelete = async (id) => { 
        const confirmed = await dialog.ask("حذف قطعه", "آیا از حذف این قطعه از انبار اطمینان دارید؟", "danger");
        if(confirmed) { 
            try { 
                // اصلاح: ارسال username در کوئری استرینگ
                await fetchAPI(`/delete/${id}?username=${user.username}`, { method: 'DELETE' }); 
                loadData(); 
                notify.show('حذف شد', 'قطعه با موفقیت حذف شد و در تاریخچه ثبت گردید.', 'success'); 
            } catch(e) {
                notify.show('خطا', 'مشکل در حذف قطعه', 'error');
            } 
        } 
    };

    // تنظیمات دسته جاری (انتخاب شده در دراپ‌داون)
    const currentConfig = (globalConfig?.[formData.type]) ? globalConfig[formData.type] : (globalConfig?.["Resistor"]) || { units: [], paramOptions: [], packages: [], techs: [], icon: 'circle', label: 'Unknown', prefix: 'PRT' };

    // ------------------------------------------------------------------------------------------------
    // [تگ: توابع کمکی رندر]
    // getLabel: دریافت نام نمایشی فیلد از تنظیمات ادمین (و افزودن ستاره اگر الزامی باشد).
    // isVisible: بررسی اینکه آیا فیلد باید طبق تنظیمات نمایش داده شود یا خیر.
    // ------------------------------------------------------------------------------------------------
    const getLabel = (key, defaultLabel) => {
    const isLoc = key === 'location';
    const targetConfig = isLoc ? globalConfig?.["General"] : currentConfig;
    const configKey = isLoc ? 'locations' : key;

    const fConfig = targetConfig?.fields?.[configKey];
    const label = fConfig?.label || defaultLabel;
    
    // چک کردن الزامی بودن: یا از تنظیمات ادمین یا موارد پیش‌فرض سیستم
    const isRequired = fConfig ? fConfig.required : ['units', 'packages', 'location'].includes(key);
    return label + (isRequired ? " *" : "");
    };

    const isVisible = (key) => {
        const fConfig = currentConfig.fields?.[key];
        const isBase = ['units', 'paramOptions', 'packages', 'techs'].includes(key);
        return fConfig ? fConfig.visible : isBase;
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری (JSX)]
    // ساختار اصلی صفحه شامل:
    // ۱. هدر (نمایش تعداد کل قطعات).
    // ۲. ستون سمت چپ: لیست قطعات با فیلترها.
    // ۳. ستون سمت راست: فرم ورود اطلاعات.
    // ------------------------------------------------------------------------------------------------
    return (
        <ErrorBoundary>
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* مودال پیش‌نمایش */}
                <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} onConfirm={handleFinalSubmit} data={formData} globalConfig={globalConfig} />
                
                {/* هدر صفحه */}
                <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3"><span className="text-xs text-nexus-accent font-bold">تعداد قطعات موجود: {partsList.length}</span><div className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse"></div></div>
                </header>
                
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-12 gap-6">
                        
                        {/* ---------------------------------------------------------------------- */}
                        {/* ستون لیست قطعات (سمت چپ در دسکتاپ، پایین در موبایل)                     */}
                        {/* ---------------------------------------------------------------------- */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col order-2 lg:order-1">
                            <div className="glass-panel rounded-2xl flex flex-col">
                                {/* نوار جستجو و فیلترها */}
                                <div className="p-3 border-b border-white/5 grid grid-cols-5 gap-3 bg-white/5">
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="کد 12 رقمی..." value={filters.code} onChange={e => setFilters({...filters, code: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر مقدار..." value={filters.val} onChange={e => setFilters({...filters, val: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر پکیج..." value={filters.pkg} onChange={e => setFilters({...filters, pkg: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر آدرس..." value={filters.loc} onChange={e => setFilters({...filters, loc: e.target.value})} />
                                    <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر نوع..." value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} />
                                </div>
                                
                                {/* هدر لیست */}
                                <div className="grid grid-cols-12 gap-2 bg-black/30 p-3 border-b border-white/5 text-[11px] text-gray-400 font-bold text-center"><div className="col-span-2 text-right pr-2">کد اختصاصی</div><div className="col-span-5 text-right">مشخصات فنی</div><div className="col-span-1">تعداد</div><div className="col-span-2">قیمت</div><div className="col-span-2">عملیات</div></div>
                                
                                {/* بدنه لیست قطعات */}
                                <div className="p-2 space-y-2">
                                    {filteredParts.map(p => {
                                        const pCode = getPartCode(p, globalConfig);
                                        return (
                                            <div key={p.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all ${formData.id === p.id ? 'bg-nexus-primary/10 !border-nexus-primary/50' : ''}`}>
                                                <div className="col-span-2 text-right text-nexus-accent font-mono text-[14px] font-bold tracking-tighter">{pCode}</div>
                                                <div className="col-span-5 text-right flex flex-col justify-center gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white text-lg font-black ltr font-sans tracking-wide">{p.val}</span>
                                                        <span className="text-xs text-nexus-accent font-bold px-1.5 py-0.5 bg-nexus-accent/10 rounded">{p.package}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 items-center">
                                                        {p.type && <span className="text-blue-300 font-bold">{p.type}</span>}
                                                        {p.watt && <span className="flex items-center gap-1"><i data-lucide="zap" className="w-3 h-3 text-yellow-500"></i>{p.watt}</span>}
                                                        {p.tolerance && <span className="text-purple-400 font-bold">{p.tolerance}</span>}
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

                        {/* ---------------------------------------------------------------------- */}
                        {/* ستون فرم ورود اطلاعات (سمت راست در دسکتاپ، بالا در موبایل)               */}
                        {/* ---------------------------------------------------------------------- */}
                        <div className="col-span-12 lg:col-span-4 h-full order-1 lg:order-2">
                            <div className="glass-panel border-white/10 rounded-2xl p-5 h-full flex flex-col shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-primary to-purple-600"></div>
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between"><span>{formData.id ? 'ویرایش قطعه' : 'ثبت قطعه جدید'}</span>{formData.id && <button onClick={() => setFormData({id: null, val: "", unit: (currentConfig.units && currentConfig.units[0]) || "", watt: "", tol: "", pkg: "", type: "Resistor", date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", min_qty: "", vendor_name: "", location: "", tech: "", purchase_links: []})} className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition">انصراف</button>}</h2>
                                
                                {/* بخش نمایش هشدارهای تکراری */}
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
                                
                                {/* فیلدهای ورودی فرم */}
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
                                    <div className="flex gap-3">
                                        <NexusInput label="مقدار (Value) *" value={formData.val} onChange={e=>handleChange('val', e.target.value)} placeholder="مثلا 100" className="flex-1" disabled={!serverStatus} error={errors.val} />
                                        {isVisible('units') && (
                                            <SearchableDropdown 
                                                label={getLabel('units', 'واحد')} 
                                                options={currentConfig.units} 
                                                value={formData.unit} 
                                                onChange={(val)=>handleChange('unit', val)} 
                                                disabled={!serverStatus} 
                                            />
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        {isVisible('paramOptions') && (
                                            <SearchableDropdown 
                                                label={getLabel('paramOptions', currentConfig.paramLabel)} 
                                                options={currentConfig.paramOptions} 
                                                value={formData.watt} 
                                                onChange={(val)=>handleChange('watt', val)} 
                                                disabled={!serverStatus} 
                                            />
                                        )}
                                        <SearchableDropdown 
                                            label={getLabel('tolerances', 'تولرانس')} 
                                            options={currentConfig.tolerances || []} 
                                            value={formData.tol} 
                                            onChange={(val) => handleChange('tol', val)} 
                                            disabled={!serverStatus} 
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        {isVisible('packages') && (
                                            <SearchableDropdown 
                                                label={getLabel('packages', 'پکیج (Package)')} 
                                                options={currentConfig.packages} 
                                                value={formData.pkg} 
                                                onChange={(val)=>handleChange('pkg', val)} 
                                                disabled={!serverStatus} 
                                            />
                                        )}
                                        {isVisible('techs') && (
                                            <SearchableDropdown 
                                                label={getLabel('techs', 'تکنولوژی/نوع دقیق')} 
                                                options={currentConfig.techs} 
                                                value={formData.tech} 
                                                onChange={(val)=>handleChange('tech', val)} 
                                                disabled={!serverStatus} 
                                            />
                                        )}
                                    </div>
                                    
                                    {/* رندر داینامیک فیلدهای اضافه (list5 تا list10) */}
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {DYNAMIC_FIELDS_MAP.filter(f => f.key.startsWith('list')).map(field => {
                                            const fConfig = currentConfig.fields?.[field.key];
                                            if (fConfig?.visible === false) return null;
                                            
                                            const options = currentConfig[field.key] || [];
                                            const label = getLabel(field.key, field.label);
                                               
                                            return (
                                                <NexusSelect 
                                                    key={field.key}
                                                    label={label} 
                                                    value={formData[field.stateKey]} 
                                                    options={options}
                                                    onChange={e => handleChange(field.stateKey, e.target.value)} 
                                                    disabled={!serverStatus} 
                                                    error={errors[field.stateKey]}
                                                />
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <div className="flex gap-3"><NexusInput label="تعداد *" type="number" value={formData.qty} onChange={e=>handleChange('qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.qty} /><NexusInput label="حداقل *" type="number" value={formData.min_qty} onChange={e=>handleChange('min_qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.min_qty} /></div>
                                    <div className="flex gap-3">
                                        <NexusInput label="قیمت قطعه *" value={formData.price_toman} onChange={e=>handleChange('price_toman', e.target.value)} disabled={!serverStatus} error={errors.price_toman} className="flex-1" />
                                        <NexusInput label="قیمت دلار (تومان) *" value={formData.usd_rate} onChange={e=>handleChange('usd_rate', e.target.value)} disabled={!serverStatus} error={errors.usd_rate} className="flex-1" />
                                    </div>
                                    <div className="flex gap-3">
                                        <NexusSelect label={getLabel('location', 'آدرس نگهداری')} value={formData.location} onChange={e=>handleChange('location', e.target.value)} options={locationOptions} disabled={!serverStatus} error={errors.location} className="flex-1" />
                                        <NexusSelect label="نام فروشنده *" value={formData.vendor_name} onChange={e=>handleChange('vendor_name', e.target.value)} options={vendorOptions} disabled={!serverStatus} error={errors.vendor_name} className="flex-1" />
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <PersianDatePicker label="تاریخ خرید/فاکتور" value={formData.date} onChange={date => handleChange('date', date)} />
                                        </div>
                                        <div className="flex-1">
                                            <NexusInput label="شماره فاکتور" value={formData.invoice_number} onChange={e=>handleChange('invoice_number', e.target.value)} disabled={!serverStatus} placeholder="مثلاً ۱۲۳۴۵" />
                                        </div>
                                    </div>
                                    <NexusInput label="پروژه / دلیل خرید" value={formData.reason} onChange={e=>handleChange('reason', e.target.value)} disabled={!serverStatus} />
                                    
                                    {/* بخش افزودن لینک‌ها */}
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

// ----------------------------------------------------------------------------------------------------
// [تگ: اتصال به فضای جهانی]
// ----------------------------------------------------------------------------------------------------
window.EntryPage = EntryPage;