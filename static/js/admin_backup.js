// [TAG: MODULE_ADMIN_BACKUP]
// ماژول بک‌آپ و بازیابی - تفکیک شده از Admin Pages.js

const { useState, useEffect, useCallback, useRef } = React;

const BackupPage = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const notify = useNotify();
    const dialog = useDialog();

    const loadBackups = useCallback(async () => {
        try { const { ok, data } = await fetchAPI('/backup/list'); if(ok) setBackups(data); } catch(e){}
    }, []);

    useEffect(() => { loadBackups(); }, [loadBackups]);
    
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const confirmed = await dialog.ask("تایید بازگردانی", `آیا از جایگزینی دیتابیس با فایل "${file.name}" اطمینان دارید؟`, "warning");
        if (confirmed) {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch(`${API_URL}/backup/restore_upload`, { method: 'POST', body: formData });
                const result = await res.json();
                if (result.success) {
                    notify.show('موفقیت', 'بازگردانی انجام شد. برنامه مجدد بارگذاری می‌شود.', 'success');
                    setTimeout(() => window.location.reload(), 2000);
                } else notify.show('خطا', result.error, 'error');
            } catch (err) { notify.show('خطا', 'خطای شبکه', 'error'); }
            finally { setLoading(false); e.target.value = null; }
        }
    };

    if (typeof useLucide === 'function') {
        useLucide([backups]);
    }

    const handleCreateBackup = async () => {
        setLoading(true);
        try {
            const currentUser = "Admin"; 
            const { ok, data } = await fetchAPI('/backup/create', { 
                method: 'POST',
                body: { username: currentUser } 
            });
            if (ok) {
                // نمایش مسیر دقیق ذخیره شده به کاربر
                notify.show('موفقیت', `بک‌آپ در مسیر ${data.full_path} ذخیره شد`, 'success');
                loadBackups();
            } else {
                notify.show('خطا', data.error || 'عملیات لغو شد', 'error');
            }
        } catch (e) { 
            notify.show('خطا', 'مشکل در ارتباط با سرور', 'error'); 
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (filename) => {
        if(await dialog.ask("بازگردانی", "با بازگردانی، اطلاعات فعلی جایگزین می‌شود. ادامه می‌دهید؟", "warning")) {
            setLoading(true);
            try {
                const { ok, data } = await fetchAPI(`/backup/restore/${filename}`, { method: 'POST' });
                if(ok) { notify.show('موفقیت', "اطلاعات با موفقیت بازیابی شد. صفحه رفرش می‌شود.", 'success'); setTimeout(() => window.location.reload(), 2000); }
                else notify.show('خطا', data.error, 'error');
            } catch(e) { notify.show('خطا', 'مشکل در بازگردانی', 'error'); }
            finally { setLoading(false); }
        }
    };

    const handleDelete = async (filename) => {
        if(await dialog.ask("حذف بک‌آپ", "این فایل غیرقابل بازگشت است. حذف شود؟", "danger")) {
            try {
                const { ok } = await fetchAPI(`/backup/delete/${filename}`, { method: 'DELETE' });
                if(ok) { loadBackups(); notify.show('حذف شد', "فایل بک‌آپ حذف گردید", 'info'); }
            } catch(e){}
        }
    };

    const toShamsiWithSeconds = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            }).format(date);
        } catch (e) { return dateStr; }
    };

    const handleDownload = (filename) => {
        // باز کردن لینک دانلود در یک تب جدید برای شروع دانلود
        window.open(`${API_URL}/backup/download/${filename}`, '_blank');
    };

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full">
            <header className="mb-6 flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-white flex items-center gap-3"><i data-lucide="database-backup" className="w-8 h-8 text-nexus-warning"></i>پشتیبان‌گیری و بازیابی</h2><p className="text-gray-400 text-xs mt-1">مدیریت فایل‌های دیتابیس</p></div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".db,.bak" className="hidden" />
                <button onClick={() => fileInputRef.current.click()}disabled={loading}className="bg-white/5 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-lg backdrop-blur-sm group"><i data-lucide="upload" className="w-4 h-4"></i>بازگردانی فایل دستی</button>
                <button onClick={handleCreateBackup} disabled={loading} className="px-6 py-2 bg-nexus-primary hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition flex items-center gap-2 disabled:opacity-50"><i data-lucide="plus-circle" className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}></i>{loading ? 'در حال ایجاد...' : 'ایجاد بک‌آپ جدید'}</button>
            </header>

            <div className="flex-1 overflow-y-auto custom-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {backups.map(b => (
                        <div key={b.name} className="glass-panel p-4 rounded-xl border border-white/5 hover:border-nexus-warning/30 transition group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-nexus-warning/5 rounded-bl-full -mr-4 -mt-4"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-white/5"><i data-lucide="file-clock" className="w-5 h-5"></i></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <i data-lucide="user" className="w-3 h-3 text-gray-500"></i>
                                            <span className="text-xs font-bold text-gray-300 truncate">{b.creator || 'سیستم'}</span>
                                        </div>
                                        <div className="text-[10px] text-nexus-warning font-mono bg-nexus-warning/10 px-1.5 py-0.5 rounded inline-block" dir="ltr">
                                            {toShamsiWithSeconds(b.date)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-gray-500 mb-3 px-1">
                                    <span>حجم: {b.size} KB</span>
                                    <span className="font-mono ltr text-gray-600">{b.name.replace('nexus_backup_', '').replace('.db', '')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDownload(b.name)} className="px-3 py-2 bg-white/5 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/20 rounded-lg transition" title="دانلود روی سیستم">
                                        <i data-lucide="download" className="w-4 h-4"></i>
                                    </button>
                                    <button onClick={() => handleRestore(b.name)} className="flex-1 py-2 bg-white/5 hover:bg-nexus-warning hover:text-black text-nexus-warning border border-nexus-warning/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                                        <i data-lucide="rotate-ccw" className="w-3 h-3"></i>بازگردانی
                                    </button>
                                    <button onClick={() => handleDelete(b.name)} className="px-3 py-2 bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 border border-white/5 rounded-lg transition">
                                        <i data-lucide="trash-2" className="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {backups.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/5">
                            <i data-lucide="hard-drive" className="w-12 h-12 mb-3 opacity-50"></i>
                            <span>هیچ فایل پشتیبانی یافت نشد.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.BackupPage = BackupPage;