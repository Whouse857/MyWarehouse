/**
 * ====================================================================================================
 * فایل: project-list-logic.js
 * وظیفه: مدیریت منطق صفحه اصلی لیست پروژه‌ها
 * توضیحات: شامل دریافت لیست، حذف، کپی، مودال جدید و دریافت نرخ اولیه دلار.
 * ====================================================================================================
 */

window.useProjectListLogic = () => {
    const { useState, useEffect, useCallback } = React;
    const fetchAPI = window.fetchAPI;
    const notify = window.useNotify ? window.useNotify() : { show: (t, m) => console.log(t, m) };
    const dialog = window.useDialog ? window.useDialog() : { ask: () => Promise.resolve(true) };

    // --- State Definition ---
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // مدیریت نرخ ارز (مشترک بین لیست و BOM اما در اینجا مقداردهی اولیه می‌شود)
    const [calculationRate, setCalculationRate] = useState(window.USD_RATE || 60000);
    const [serverRate, setServerRate] = useState({ price: 0, date: '' });
    const [config, setConfig] = useState(null);

    // مدیریت مودال ساخت پروژه
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectForm, setProjectForm] = useState({ id: null, name: '', description: '' });

    // --- API Calls ---

    const fetchConfig = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/settings/config');
            if (ok) setConfig(data);
        } catch (e) { console.error("Config fetch failed"); }
    }, [fetchAPI]);

    const fetchLiveRate = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/inventory/stats');
            if (ok && data && data.live_usd_price && data.live_usd_price > 0) {
                let displayDate = data.usd_date;
                // تبدیل تاریخ میلادی به شمسی اگر تابع موجود باشد
                if (window.toShamsi && displayDate) {
                    displayDate = window.toShamsi(displayDate);
                } else if (!displayDate) {
                    displayDate = new Date().toLocaleDateString('fa-IR');
                }
                
                setServerRate({ price: data.live_usd_price, date: displayDate });
                // اگر نرخ هنوز پیش‌فرض است، آن را با نرخ زنده آپدیت کن
                setCalculationRate(prev => prev === 60000 ? data.live_usd_price : prev);
            }
        } catch (e) { console.error("Live Rate fetch failed"); }
    }, [fetchAPI]);

    const loadProjects = useCallback(async () => {
        if (!fetchAPI) return;
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/projects');
            if (ok) setProjects(data || []);
        } catch (e) { 
            notify.show('خطا', 'عدم برقراری ارتباط با سرور', 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchAPI, notify]);

    // --- Actions ---

    const handleSaveProject = async () => {
        if (!projectForm.name.trim()) return notify.show('خطا', 'نام پروژه الزامی است', 'error');
        try {
            const { ok } = await fetchAPI('/projects/save', { method: 'POST', body: projectForm });
            if (ok) {
                setIsModalOpen(false);
                loadProjects();
                notify.show('موفقیت', 'پروژه با موفقیت ذخیره شد.', 'success');
            }
        } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); }
    };

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (await dialog.ask("حذف پروژه", "آیا از حذف پروژه و لیست BOM آن مطمئن هستید؟", "danger")) {
            try {
                const { ok } = await fetchAPI(`/projects/delete/${id}`, { method: 'DELETE' });
                if (ok) { loadProjects(); notify.show('حذف شد', 'پروژه حذف گردید.', 'success'); }
            } catch (e) { notify.show('خطا', 'خطا در حذف پروژه', 'error'); }
        }
    };

    const handleDuplicateProject = async (e, id) => {
        e.stopPropagation();
        if (await dialog.ask("کپی پروژه", "آیا از ایجاد نسخه کپی اطمینان دارید؟")) {
            setLoading(true);
            try {
                const { ok } = await fetchAPI(`/projects/duplicate/${id}`, { method: 'POST' });
                if (ok) { await loadProjects(); notify.show('موفقیت', 'پروژه کپی شد.', 'success'); }
            } catch (e) { notify.show('خطا', 'خطا در کپی پروژه', 'error'); }
            finally { setLoading(false); }
        }
    };

    // --- Initial Load ---
    useEffect(() => {
        loadProjects();
        fetchConfig();
        fetchLiveRate();
    }, [loadProjects, fetchConfig, fetchLiveRate]);

    // --- Filtering ---
    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        projects, filteredProjects, loading,
        searchTerm, setSearchTerm,
        calculationRate, setCalculationRate,
        serverRate, config,
        isModalOpen, setIsModalOpen,
        projectForm, setProjectForm,
        loadProjects,
        handleSaveProject,
        handleDeleteProject,
        handleDuplicateProject
    };
};