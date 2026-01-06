/**
 * ====================================================================================================
 * فایل: log page-logic.js
 * نسخه: 0.25 (Logic Layer - مغز متفکر صفحه لاگ)
 * توضیحات:
 * این فایل تمامی محاسبات، ارتباط با سرور و مدیریت وضعیت (State) صفحه تاریخچه را بر عهده دارد.
 * هیچ کد UI (تگ‌های HTML/JSX) در این فایل وجود ندارد.
 * ====================================================================================================
 */

window.useLogLogic = () => {
    // استخراج هوک‌های مورد نیاز از React
    const { useState, useEffect, useCallback, useMemo } = React;

    // دسترسی به ابزارهای سراسری
    const fetchAPI = window.fetchAPI;
    const notify = window.useNotify ? window.useNotify() : { show: (t, m) => console.log(t, m) };
    const dialog = window.useDialog ? window.useDialog() : { ask: () => Promise.resolve(true) };

    // ------------------------------------------------------------------------------------------------
    // [تگ: توابع کمکی داخلی]
    // این توابع عیناً از Extra Pages کپی شده‌اند تا این ماژول کاملاً مستقل باشد.
    // ------------------------------------------------------------------------------------------------
    const toEnglishDigits = (str) => {
        if (!str) return str;
        return String(str).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\//g, '/');
    };

    const toPersianDigits = (str) => {
        if (!str) return str;
        return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    };

    const getPartCodeLog = (l, config) => {
        if (!l) return "---";
        // اولویت با کد ذخیره شده در دیتابیس است
        if (l.part_code) return l.part_code;

        // حالت رزرو برای لاگ‌های قدیمی (تولید از روی ID)
        const prefix = (config && config[l.type]?.prefix) || "PRT";
        const numeric = String(l.part_id || 0).padStart(9, '0');
        return `${prefix}${numeric}`;
    };

    // لیست ماه‌های شمسی برای استفاده در فیلترها
    const persianMonths = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    // ------------------------------------------------------------------------------------------------
    // [تگ: State Management]
    // ------------------------------------------------------------------------------------------------
    const [logList, setLogList] = useState([]);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ general: "", user: "", operation: "", startDate: "", endDate: "" });
    const [editModal, setEditModal] = useState({ open: false, log: null });

    // ------------------------------------------------------------------------------------------------
    // [تگ: ارتباط با سرور - لود دیتا]
    // ------------------------------------------------------------------------------------------------
    const loadLogs = useCallback(async () => { 
        setLoading(true);
        try {
            const [logRes, configRes] = await Promise.all([
                fetchAPI('/log'),
                fetchAPI('/settings/config')
            ]); 
            if (logRes.ok) setLogList(logRes.data); 
            if (configRes.ok) setConfig(configRes.data);
            setLoading(false); 
        } catch(e) { setLoading(false); }
    }, []);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: حذف لاگ]
    // ------------------------------------------------------------------------------------------------
    const handleDeleteLog = async (log) => {
        const text = `آیا از حذف این تراکنش و اصلاح "معکوس" موجودی انبار اطمینان دارید؟\nمقدار: ${log.quantity_added} عدد`;
        if (await dialog.ask("حذف و واگردانی تراکنش", text, "danger")) {
            try {
                const { ok } = await fetchAPI(`/log/delete/${log.log_id}`, { method: 'DELETE' });
                if (ok) {
                    notify.show('تراکنش حذف شد', 'موجودی انبار به صورت خودکار اصلاح گردید.', 'success');
                    loadLogs();
                }
            } catch (e) { notify.show('خطا', 'مشکل در ارتباط با سرور', 'error'); }
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: ویرایش لاگ]
    // ------------------------------------------------------------------------------------------------
    const handleUpdateLog = async (updatedData) => {
        try {
            const result = await fetchAPI('/log/update', { 
                method: 'POST', 
                body: updatedData // ارسال کل آبجکت شامل edit_reason
            });
            
            if (result.ok) {
                notify.show('تراکنش اصلاح شد', 'تغییرات با موفقیت ثبت گردید.', 'success');
                setEditModal({ open: false, log: null });
                loadLogs();
            } else {
                notify.show('خطا', result.error || 'خطای ناشناخته در ذخیره‌سازی', 'error');
            }
        } catch (e) { notify.show('خطا', 'مشکل در ارتباط با سرور', 'error'); }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: فیلترینگ لاگ‌ها]
    // ------------------------------------------------------------------------------------------------
    const filteredLogs = useMemo(() => {
        return logList.filter(l => {
            const logDateObj = new Date(l.timestamp);
            const logShamsi = new Intl.DateTimeFormat('fa-IR-u-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(logDateObj); 
            
            // فیلتر تاریخ
            if (filters.startDate && logShamsi < filters.startDate) return false;
            if (filters.endDate && logShamsi > filters.endDate) return false;
            
            // فیلتر جستجوی عمومی (در تمام فیلدها)
            const terms = filters.general ? toEnglishDigits(filters.general.toLowerCase()).trim().split(/\s+/) : [];
            const searchableText = toEnglishDigits(`${l.val || ''} ${l.username || ''} ${l.operation_type || ''} ${l.reason || ''} ${l.invoice_number || ''} ${getPartCodeLog(l, config)}`.toLowerCase());
            const generalMatch = terms.length === 0 || terms.every(term => searchableText.includes(term));
            
            // فیلتر کاربر و نوع عملیات
            const userMatch = !filters.user || (l.username && l.username.toLowerCase().includes(filters.user.toLowerCase()));
            const opMatch = !filters.operation || (l.operation_type && l.operation_type.toLowerCase().includes(filters.operation.toLowerCase()));
            
            return generalMatch && userMatch && opMatch;
        });
    }, [logList, filters, config]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: خروجی]
    // تمام متغیرها و توابعی که UI به آنها نیاز دارد
    // ------------------------------------------------------------------------------------------------
    return {
        logList,
        config,
        loading,
        filters, setFilters,
        editModal, setEditModal,
        filteredLogs,
        handleDeleteLog,
        handleUpdateLog,
        loadLogs,
        // Utils
        toEnglishDigits,
        toPersianDigits,
        getPartCodeLog,
        persianMonths
    };
};