/**
 * ====================================================================================================
 * فایل: contacts page-logic.js
 * نسخه: 0.26 (Logic Layer - مغز متفکر صفحه مخاطبین)
 * توضیحات:
 * تمام توابع ذخیره‌سازی، ویرایش، حذف و اعتبارسنجی فرم مخاطبین در این فایل قرار دارد.
 * این فایل کاملاً مستقل است و به فایل‌های دیگر (جز هسته اصلی) وابسته نیست.
 * ====================================================================================================
 */

window.useContactsLogic = (serverStatus) => {
    // استخراج هوک‌های مورد نیاز از React
    const { useState, useEffect, useCallback, useMemo } = React;

    // دسترسی به ابزارهای سراسری
    const fetchAPI = window.fetchAPI;
    const notify = window.useNotify ? window.useNotify() : { show: (t, m) => console.log(t, m) };
    const dialog = window.useDialog ? window.useDialog() : { ask: () => Promise.resolve(true) };

    // ------------------------------------------------------------------------------------------------
    // [تگ: توابع کمکی مستقل]
    // این توابع عیناً حفظ شده‌اند تا منطق برنامه تغییر نکند
    // ------------------------------------------------------------------------------------------------
    const toEnglishDigits = (str) => {
        if (!str) return str;
        return String(str).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\//g, '/');
    };

    const toPersianDigits = (str) => {
        if (!str) return str;
        return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: State Management]
    // ------------------------------------------------------------------------------------------------
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ id: null, name: '', phone: '', mobile: '', fax: '', website: '', email: '', address: '', notes: '' });
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [copyFeedback, setCopyFeedback] = useState(null);

    // ------------------------------------------------------------------------------------------------
    // [تگ: لود داده‌ها]
    // ------------------------------------------------------------------------------------------------
    const loadContacts = useCallback(async () => { 
        try { 
            const { ok, data } = await fetchAPI('/contacts'); 
            if (ok) setContacts(data); 
        } catch (e) {
            console.error("Error loading contacts:", e);
        } 
    }, []);

    useEffect(() => { loadContacts(); }, [loadContacts]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: فیلترینگ و جستجو]
    // ------------------------------------------------------------------------------------------------
    const filteredContacts = useMemo(() => {
        if (!searchTerm) return contacts;
        const lower = toEnglishDigits(searchTerm.toLowerCase());
        return contacts.filter(c => 
            (c.name && c.name.toLowerCase().includes(lower)) || 
            (c.mobile && c.mobile.includes(lower)) || 
            (c.phone && c.phone.includes(lower)) ||
            (c.notes && c.notes.includes(lower))
        );
    }, [contacts, searchTerm]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: عملیات کپی در کلیپ‌بورد]
    // ------------------------------------------------------------------------------------------------
    const copyToClipboard = (e, text) => {
        if (!text) return;
        e.stopPropagation(); 
        navigator.clipboard.writeText(text);
        setCopyFeedback({ x: e.clientX, y: e.clientY });
        setTimeout(() => setCopyFeedback(null), 1500);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: اعتبارسنجی و فرم]
    // ------------------------------------------------------------------------------------------------
    const validatePhoneFormat = (num) => {
        if (!num) return true;
        if (!num.startsWith('0')) return false;
        if (num.length > 11) return false;
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

    const preventNonNumeric = (e) => { 
        if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Tab") { 
            e.preventDefault(); 
        } 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: عملیات CRUD (ذخیره، حذف، ویرایش)]
    // ------------------------------------------------------------------------------------------------
    const handleSave = async () => { 
        const newErrors = {};
        let isValid = true;
        
        // اعتبارسنجی‌های اجباری
        if (!newContact.name.trim()) { newErrors.name = true; isValid = false; }
        if (!newContact.address.trim()) { newErrors.address = true; isValid = false; }
        
        const hasPhone = newContact.phone && newContact.phone.trim();
        const hasMobile = newContact.mobile && newContact.mobile.trim();
        
        if (!hasPhone && !hasMobile) { 
            newErrors.phone = true; 
            newErrors.mobile = true; 
            isValid = false; 
            notify.show('خطا', "حداقل یک شماره تماس (موبایل یا ثابت) الزامی است", 'error'); 
        } else {
            if (hasPhone && !validatePhoneFormat(newContact.phone)) { newErrors.phone = true; isValid = false; notify.show('خطا', "فرمت تلفن ثابت اشتباه است (باید با 0 شروع شود)", 'error'); }
            if (hasMobile && !validatePhoneFormat(newContact.mobile)) { newErrors.mobile = true; isValid = false; notify.show('خطا', "فرمت موبایل اشتباه است (باید با 0 شروع شود)", 'error'); }
        }

        setErrors(newErrors);
        if (!isValid) return;
        
        try { 
            const { ok } = await fetchAPI('/contacts/save', { method: 'POST', body: newContact }); 
            if (ok) { 
                loadContacts(); 
                setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); 
                notify.show('موفقیت', "اطلاعات مخاطب با موفقیت ذخیره شد.", 'success'); 
            } 
        } catch (e) { 
            notify.show('خطا', "مشکل در ارتباط با سرور", 'error'); 
        } 
    };

    const handleDelete = async (id) => { 
        if(await dialog.ask("حذف مخاطب", "آیا از حذف این تامین‌کننده از لیست اطمینان دارید؟", "danger")) { 
            try { 
                const { ok } = await fetchAPI(`/contacts/delete/${id}`, {method:'DELETE'}); 
                if(ok) {
                    loadContacts();
                    if (newContact.id === id) {
                        setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''});
                    }
                }
            } catch(e) {
                notify.show('خطا', "مشکل در حذف مخاطب", 'error');
            } 
        } 
    };

    const handleEdit = (c) => { 
        setNewContact(c); 
        setErrors({}); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: خروجی]
    // ------------------------------------------------------------------------------------------------
    return {
        contacts,
        newContact, setNewContact,
        errors, setErrors,
        searchTerm, setSearchTerm,
        copyFeedback,
        filteredContacts,
        loadContacts,
        handleSave,
        handleDelete,
        handleEdit,
        handleChange,
        copyToClipboard,
        preventNonNumeric,
        toPersianDigits
    };
};