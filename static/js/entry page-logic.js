// ====================================================================================================
// نسخه: 0.26
// فایل: entry page-logic.js
// توصیف: منطق صفحه ورود کالا.
// تغییرات جدید: 
// - جایگزینی فیلترهای جداگانه با specConditions (آرایه شرط‌ها).
// - پیاده‌سازی منطق جستجوی جامع در تمام فیلدها.
// - قابلیت AND/OR بین کادرهای جستجو.
// ====================================================================================================

const { useState, useEffect, useMemo, useCallback, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: نگاشت فیلدهای پویا]
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

const getPartCode = (p, globalConfig) => {
    if (p && p.part_code) return p.part_code; 
    if (!p || !p.id) return "---";
    const prefix = (globalConfig && globalConfig[p.type]?.prefix) || "PRT";
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

const useEntryPageLogic = ({ serverStatus, user, globalConfig }) => {
    // --- استیت‌های داده ---
    const [formData, setFormData] = useState({ 
        id: null, val: "", unit: "", watt: "", tol: "", pkg: "", type: "Resistor", 
        date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", 
        min_qty: 1, vendor_name: "", location: "", tech: "", purchase_links: [], 
        invoice_number: "",
        list5: "", list6: "", list7: "", list8: "", list9: "", list10: ""
    });
    const [partsList, setPartsList] = useState([]);
    const [contacts, setContacts] = useState([]);
    
    // --- استیت‌های فیلتر ---
    // فیلتر کد جدا می‌ماند
    const [codeFilter, setCodeFilter] = useState("");
    
    // فیلتر مشخصات: آرایه‌ای از شرط‌ها
    // هر شرط: { id, value: متن جستجو, logic: رابطه با شرط قبلی (AND/OR) }
    // منطق: شرط اول همیشه پایه است، شرط دوم با logic خودش به نتیجه شرط اول وصل می‌شود.
    const [specConditions, setSpecConditions] = useState([
        { id: 1, value: '', logic: 'AND' }
    ]);

    const [activeFilterPopup, setActiveFilterPopup] = useState(null); 
    const [errors, setErrors] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [linkInput, setLinkInput] = useState(""); 
    
    const notify = useNotify();
    const dialog = useDialog();

    // --- بارگذاری اطلاعات ---
    const loadData = useCallback(async () => { 
        try { 
            const [partsRes, contactsRes] = await Promise.all([fetchAPI('/parts'), fetchAPI('/contacts')]);
            if(partsRes.ok) setPartsList(Array.isArray(partsRes.data) ? partsRes.data : []);
            if(contactsRes.ok) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
        } catch(e){} 
    }, []);
    
    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.filter-popup') && !e.target.closest('.filter-icon-btn')) {
                setActiveFilterPopup(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- تشخیص تکراری ---
    const duplicates = useMemo(() => {
        if (!formData.val || !formData.type) return [];
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

    // --- مدیریت شرط‌های جستجو ---
    const addSpecCondition = () => {
        setSpecConditions(prev => [
            ...prev,
            { id: Date.now(), value: '', logic: 'AND' } // پیش‌فرض AND است
        ]);
    };

    const removeSpecCondition = (id) => {
        setSpecConditions(prev => {
            const newConditions = prev.filter(c => c.id !== id);
            if (newConditions.length === 0) return [{ id: Date.now(), value: '', logic: 'AND' }];
            return newConditions;
        });
    };

    const updateSpecCondition = (id, newValue) => {
        setSpecConditions(prev => prev.map(c => c.id === id ? { ...c, value: newValue } : c));
    };

    const toggleSpecLogic = (id) => {
        setSpecConditions(prev => prev.map(c => 
            c.id === id ? { ...c, logic: c.logic === 'AND' ? 'OR' : 'AND' } : c
        ));
    };

    // --- فیلتر کردن لیست (موتور اصلی) ---
    const filteredParts = useMemo(() => {
        const normalize = (s) => s ? String(s).toLowerCase().replace(/,/g, '').trim() : '';
        const activeCategory = normalize(formData.type);
        const filterCode = normalize(codeFilter);

        // بررسی اینکه آیا شرط‌های مشخصات اصلا مقداری دارند؟
        const hasSpecFilters = specConditions.some(c => c.value.trim() !== '');

        if (!Array.isArray(partsList)) return [];

        return partsList.filter(p => {
            if (!p) return false;

            // 1. فیلتر دسته‌بندی اصلی (تب بالا)
            if (activeCategory && normalize(p.type) !== activeCategory) return false;

            // 2. فیلتر کد اختصاصی (جداگانه)
            if (filterCode) {
                const pCode = normalize(getPartCode(p, globalConfig));
                if (!pCode.includes(filterCode)) return false;
            }

            // 3. فیلتر پیشرفته مشخصات (Query Builder)
            if (hasSpecFilters) {
                // ساختن یک رشته بزرگ از تمام مشخصات قطعه برای جستجوی جامع
                // شامل: مقدار، پکیج، آدرس، تکنولوژی، توضیحات
                const partAllSpecs = (
                    normalize(p.val) + " " +
                    normalize(p.package) + " " +
                    normalize(p.storage_location) + " " +
                    normalize(p.tech) + " " +
                    normalize(p.watt) + " " +
                    normalize(p.tolerance)
                );

                // ارزیابی زنجیره‌ای شرط‌ها
                let finalResult = false; // مقدار اولیه مهم نیست چون با شرط اول ست می‌شود

                specConditions.forEach((condition, index) => {
                    const term = normalize(condition.value);
                    let isMatch = true;

                    if (term) {
                        isMatch = partAllSpecs.includes(term);
                    } else {
                        isMatch = true; // اگر کادر خالی است، پاس می‌شود (تاثیری نگذارد)
                    }

                    if (index === 0) {
                        finalResult = isMatch;
                    } else {
                        // اعمال منطق نسبت به نتیجه قبلی
                        if (condition.logic === 'AND') {
                            finalResult = finalResult && isMatch;
                        } else {
                            finalResult = finalResult || isMatch;
                        }
                    }
                });

                if (!finalResult) return false;
            }
            
            return true;
        });
    }, [partsList, specConditions, codeFilter, formData.type, globalConfig]);

    // --- گزینه‌های داینامیک ---
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

    useLucide([filteredParts.length, formData.type, duplicates.length, activeFilterPopup, specConditions.length]);

    // --- مدیریت تغییرات فرم ---
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

    // --- توابع کمکی فیلتر ---
    const toggleFilterPopup = (popupName) => {
        setActiveFilterPopup(prev => prev === popupName ? null : popupName);
    };

    const clearFilterGroup = (group) => {
        if (group === 'specs') {
            setSpecConditions([{ id: Date.now(), value: '', logic: 'AND' }]);
        } else if (group === 'code') {
            setCodeFilter("");
        }
    };

    // --- عملیات CRUD ---
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

    return {
        formData, setFormData,
        partsList,
        codeFilter, setCodeFilter,
        specConditions, addSpecCondition, removeSpecCondition, updateSpecCondition, toggleSpecLogic,
        activeFilterPopup, toggleFilterPopup, clearFilterGroup, 
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

window.DYNAMIC_FIELDS_MAP = DYNAMIC_FIELDS_MAP;
window.getPartCode = getPartCode;
window.useEntryPageLogic = useEntryPageLogic;