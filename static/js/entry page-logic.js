// ====================================================================================================
// نسخه: 0.20
// فایل: entry page-logic.js
// توصیف: فایل حاوی منطق (Business Logic) و هوک‌های سفارشی برای صفحه ورود کالا.
// وظایف: مدیریت استیت‌ها، توابع محاسباتی، هندلرها و ارتباط با API.
// ====================================================================================================

// در محیط بدون باندلر (مثل اینجا)، ماژول‌های React را از آبجکت جهانی React دریافت می‌کنیم
const { useState, useEffect, useMemo, useCallback, useRef } = React;

// فرض بر این است که توابعی مانند fetchAPI, getJalaliDate, ... در فایل‌های Core Logic تعریف شده و گلوبال هستند.

// ----------------------------------------------------------------------------------------------------
// [تگ: نگاشت فیلدهای پویا]
// این آرایه ثابت، ارتباط بین تنظیمات ذخیره شده در دیتابیس (تنظیمات ادمین)
// و نام متغیرها در فرم ورود اطلاعات (formData) را برقرار می‌کند.
// ----------------------------------------------------------------------------------------------------
const DYNAMIC_FIELDS_MAP = [
    { key: 'units', stateKey: 'unit', label: 'واحد' },
    { key: 'tolerances', stateKey: 'tol', label: 'تولرانس' },
    { key: 'paramOptions', stateKey: 'watt', label: 'پارامتر فنی' },
    { key: 'packages', stateKey: 'pkg', label: 'پکیج' },
    { key: 'techs', stateKey: 'tech', label: 'تکنولوژی' },
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
// ----------------------------------------------------------------------------------------------------
const getPartCode = (p, globalConfig) => {
    if (p && p.part_code) return p.part_code; 
    if (!p || !p.id) return "---";
    const prefix = (globalConfig && globalConfig[p.type]?.prefix) || "PRT";
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

// ----------------------------------------------------------------------------------------------------
// [تگ: هوک اصلی منطق]
// تمام منطق کامپوننت EntryPage در این هوک کپسوله شده است.
// ----------------------------------------------------------------------------------------------------
const useEntryPageLogic = ({ serverStatus, user, globalConfig }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: وضعیت‌های فرم و داده‌ها]
    // ------------------------------------------------------------------------------------------------
    const [formData, setFormData] = useState({ 
        id: null, val: "", unit: "", watt: "", tol: "", pkg: "", type: "Resistor", 
        date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", 
        min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: [], 
        invoice_number: "",
        list5: "", list6: "", list7: "", list8: "", list9: "", list10: ""
    });
    const [partsList, setPartsList] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [filters, setFilters] = useState({ val: '', pkg: '', loc: '', type: '', code: '' });
    const [errors, setErrors] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [linkInput, setLinkInput] = useState(""); 
    
    // هوک‌های اعلان و دیالوگ (فرض بر وجود سراسری آن‌هاست)
    const notify = useNotify();
    const dialog = useDialog();

    // ------------------------------------------------------------------------------------------------
    // [تگ: بارگذاری اطلاعات]
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
    // ------------------------------------------------------------------------------------------------
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

    // ------------------------------------------------------------------------------------------------
    // [تگ: فیلتر کردن لیست]
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
            
            if (activeCategory && pType !== activeCategory) return false;
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
    // ------------------------------------------------------------------------------------------------
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

    // بروزرسانی آیکون‌ها
    useLucide([filteredParts.length, formData.type, duplicates.length, formData.purchase_links.length]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت تغییرات فرم]
    // ------------------------------------------------------------------------------------------------
    const handleChange = useCallback((key, val) => {
        let v = val;
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

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت لینک‌ها]
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
    // ------------------------------------------------------------------------------------------------
    const handleSubmit = () => {
        const newErrors = {};
        const typeConfig = globalConfig?.[formData.type] || {}; 

        if(!formData.val) newErrors.val = true;
        if(formData.qty === "" || Number(formData.qty) < 0) newErrors.qty = true;
        if(formData.min_qty === "" || Number(formData.min_qty) < 0) newErrors.min_qty = true;
        if(!formData.usd_rate) newErrors.usd_rate = true;

        const locSetting = globalConfig?.["General"]?.fields?.['locations'];
        const isLocRequired = locSetting ? locSetting.required : true;
        if(isLocRequired && !formData.location) newErrors.location = true;
        
        if(!formData.price_toman) newErrors.price_toman = true;
        if(!formData.vendor_name) newErrors.vendor_name = true;

        DYNAMIC_FIELDS_MAP.forEach(field => {
            const fieldConfig = typeConfig.fields?.[field.key];
            const isDefaultVisible = ['units','paramOptions','packages','techs'].includes(field.key);
            const isVisible = fieldConfig ? fieldConfig.visible : isDefaultVisible;
            const isDefaultRequired = ['units','packages'].includes(field.key);
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
    // ------------------------------------------------------------------------------------------------
    const handleFinalSubmit = async () => {
        let fullVal = formData.val;
        if(formData.unit && formData.unit !== "-") fullVal += formData.unit;

        const payload = { ...formData, val: fullVal, qty: Number(formData.qty) || 0, min_qty: Number(formData.min_qty) || 1, price: String(formData.price_toman).replace(/,/g, ''), usd_rate: String(formData.usd_rate).replace(/,/g, ''), username: user.username , invoice_number: formData.invoice_number};
        try { 
            const { ok, data } = await fetchAPI('/save', { method: 'POST', body: payload });
            if (ok) { 
                loadData(); 
                const typeConfig = globalConfig?.[formData.type] || globalConfig?.["Resistor"] || {};
                const defUnit = (typeConfig.units && typeConfig.units[0]) || "";
                
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
    // ------------------------------------------------------------------------------------------------
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
            list5: p.list5 || "", list6: p.list6 || "", list7: p.list7 || "", 
            list8: p.list8 || "", list9: p.list9 || "", list10: p.list10 || ""
        });
        setErrors({});
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: حذف قطعه]
    // ------------------------------------------------------------------------------------------------
    const handleDelete = async (id) => { 
        const confirmed = await dialog.ask("حذف قطعه", "آیا از حذف این قطعه از انبار اطمینان دارید؟", "danger");
        if(confirmed) { 
            try { 
                await fetchAPI(`/delete/${id}?username=${user.username}`, { method: 'DELETE' }); 
                loadData(); 
                notify.show('حذف شد', 'قطعه با موفقیت حذف شد و در تاریخچه ثبت گردید.', 'success'); 
            } catch(e) {
                notify.show('خطا', 'مشکل در حذف قطعه', 'error');
            } 
        } 
    };

    const currentConfig = (globalConfig?.[formData.type]) ? globalConfig[formData.type] : (globalConfig?.["Resistor"]) || { units: [], paramOptions: [], packages: [], techs: [], icon: 'circle', label: 'Unknown', prefix: 'PRT' };

    // ------------------------------------------------------------------------------------------------
    // [تگ: توابع کمکی UI]
    // ------------------------------------------------------------------------------------------------
    const getLabel = (key, defaultLabel) => {
        const isLoc = key === 'location';
        const targetConfig = isLoc ? globalConfig?.["General"] : currentConfig;
        const configKey = isLoc ? 'locations' : key;
        const fConfig = targetConfig?.fields?.[configKey];
        const label = fConfig?.label || defaultLabel;
        const isRequired = fConfig ? fConfig.required : ['units', 'packages', 'location'].includes(key);
        return label + (isRequired ? " *" : "");
    };

    const isVisible = (key) => {
        const fConfig = currentConfig.fields?.[key];
        const isBase = ['units', 'paramOptions', 'packages', 'techs', 'tolerances'].includes(key);
        return fConfig ? fConfig.visible : isBase;
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: بازگشت خروجی]
    // ------------------------------------------------------------------------------------------------
    return {
        formData, setFormData,
        partsList,
        filters, setFilters,
        errors, setErrors,
        showSummary, setShowSummary,
        linkInput, setLinkInput,
        duplicates, filteredParts,
        vendorOptions, locationOptions,
        currentConfig,
        handleChange, preventNonNumeric,
        handleAddLink, handleRemoveLink,
        handleSubmit, handleFinalSubmit,
        handleEdit, handleDelete,
        getLabel, isVisible
    };
};

// ----------------------------------------------------------------------------------------------------
// [تگ: انتشار سراسری]
// برای استفاده در فایل Entry Page.js که بعد از این فایل لود می‌شود، توابع را به window متصل می‌کنیم.
// ----------------------------------------------------------------------------------------------------
window.DYNAMIC_FIELDS_MAP = DYNAMIC_FIELDS_MAP;
window.getPartCode = getPartCode;
window.useEntryPageLogic = useEntryPageLogic;