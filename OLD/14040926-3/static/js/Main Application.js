// [TAG: MAIN_APP]
// نقطه شروع برنامه، مدیریت وضعیت کلی و مسیریابی
// نسخه نهایی: مدیریت متمرکز دسترسی‌ها برای جلوگیری از کرش اپراتور

const { useState, useEffect, useCallback, useMemo } = React;

// --- Login Page ---
const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const notify = useNotify();
    useLucide([]);

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/login', { method: 'POST', body: { username, password } });
            if (ok && data.success) {
                onLogin(data);
            } else {
                notify.show('خطای ورود', data.message || "نام کاربری یا رمز عبور اشتباه است", 'error');
            }
        } catch (err) { 
            notify.show('خطای شبکه', "امکان اتصال به سرور وجود ندارد.", 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
                <div className="flex justify-center mb-6"><h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">NEXUS</h1></div>
                <h2 className="text-xl font-bold text-white text-center mb-6">ورود به سیستم انبار</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <NexusInput label="نام کاربری" value={username} onChange={e=>setUsername(e.target.value)} dir="ltr" className="text-center" />
                    <NexusInput label="رمز عبور" type="password" value={password} onChange={e=>setPassword(e.target.value)} dir="ltr" className="text-center" />
                    <button type="submit" disabled={loading} className="w-full h-11 bg-nexus-primary hover:bg-indigo-600 rounded-xl font-bold text-white transition disabled:opacity-50">{loading ? 'در حال بررسی...' : 'ورود'}</button>
                </form>
            </div>
        </div>
    );
};

// --- Change Password Modal ---
const ChangePasswordModal = ({ isOpen, onClose, username, notify }) => {
    const [d, setD] = useState({ old: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!d.old || !d.new || !d.confirm) return notify.show('خطا', 'تمامی فیلدها الزامی هستند', 'error');
        if (d.new !== d.confirm) return notify.show('خطا', 'تکرار رمز عبور مطابقت ندارد', 'error');
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/user/change_password', { method: 'POST', body: { username, old_password: d.old, new_password: d.new } });
            if (ok && data.success) { notify.show('موفقیت', 'رمز عبور تغییر کرد', 'success'); onClose(); setD({ old: '', new: '', confirm: '' }); }
            else notify.show('خطا', data.message || 'خطا در تغییر رمز', 'error');
        } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); } finally { setLoading(false); }
    };

    if (!isOpen) return null;
    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4">تغییر رمز عبور</h3>
                <div className="space-y-3">
                    <NexusInput label="رمز فعلی" type="password" value={d.old} onChange={e => setD({...d, old: e.target.value})} dir="ltr" />
                    <NexusInput label="رمز جدید" type="password" value={d.new} onChange={e => setD({...d, new: e.target.value})} dir="ltr" />
                    <NexusInput label="تکرار رمز جدید" type="password" value={d.confirm} onChange={e => setD({...d, confirm: e.target.value})} dir="ltr" />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold">انصراف</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-white text-xs font-bold">{loading ? '...' : 'تغییر رمز'}</button>
                </div>
            </div>
        </ModalOverlay>
    );
};

// --- App Component ---
const App = () => {
    const [notifyState, setNotifyState] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: "", message: "", type: "danger", resolve: null });
    const [activeTab, setActiveTab] = useState('dashboard');
    const [serverStatus, setServerStatus] = useState(false);
    const [user, setUser] = useState(null);
    const [globalConfig, setGlobalConfig] = useState(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPassModal, setShowPassModal] = useState(false);

    const showNotify = useCallback((title, message, type = 'success') => { setNotifyState({ isOpen: true, title, message, type }); }, []);
    const notifyValue = useMemo(() => ({ show: showNotify }), [showNotify]);
    const ask = useCallback((title, message, type="danger") => new Promise((resolve) => setDialogConfig({ isOpen: true, title, message, type, resolve })), []);
    const dialogValue = useMemo(() => ({ ask }), [ask]);
    const closeDialog = (result) => { if (dialogConfig.resolve) dialogConfig.resolve(result); setDialogConfig(prev => ({ ...prev, isOpen: false, resolve: null })); };

    // --- تابع حیاتی مدیریت دسترسی‌ها ---
    // این تابع با بررسی دقیق آبجکت دسترسی‌ها از کرش کردن برنامه جلوگیری می‌کند
    const hasPerm = useCallback((key) => {
        if (!user) return false;
        if (user.role === 'admin' || user.username === 'admin') return true;
        
        // اگر دسترسی‌ها تعریف نشده بود یا آبجکت نبود، دسترسی نده
        if (!user.permissions || typeof user.permissions !== 'object') return false;
        
        // بررسی مستقیم کلید (چون سرور داده تمیز می‌فرستد)
        return !!user.permissions[key];
    }, [user]);

    useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
    useEffect(() => { 
        const check = () => fetchAPI('/heartbeat', { method: 'POST' }).then(() => setServerStatus(true)).catch(() => setServerStatus(false));
        check(); const i = setInterval(check, 5000); return () => clearInterval(i); 
    }, []);
    useEffect(() => { fetchAPI('/settings/config').then(({ok, data}) => { if(ok) setGlobalConfig(data); }); }, []);
    useEffect(() => { const h = () => fetch(`${API_URL}/client_closed`, { method: 'POST', keepalive: true, body: JSON.stringify({ reason: 'unload' }) }); window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, []);
    useEffect(() => { setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50); }, [activeTab, user]);

    const handleExitRequest = () => setShowExitConfirm(true);
    const performExit = () => fetchAPI('/exit_app', { method: 'POST' }).finally(() => window.close());
    const performBackupAndExit = async () => {
        try { const { ok } = await fetchAPI('/backup/create', { method: 'POST' }); if (ok) performExit(); else { showNotify('خطا', 'مشکل در بک‌آپ', 'error'); setShowExitConfirm(false); } } 
        catch (e) { showNotify('خطا', 'مشکل شبکه', 'error'); setShowExitConfirm(false); }
    };
    const handleLogout = () => { setUser(null); setActiveTab('dashboard'); };

    if (!user) return <NotificationContext.Provider value={notifyValue}><LoginPage onLogin={setUser} /><NotificationModal isOpen={notifyState.isOpen} onClose={() => setNotifyState(p => ({ ...p, isOpen: false }))} title={notifyState.title} message={notifyState.message} type={notifyState.type} /></NotificationContext.Provider>;
    if (!globalConfig) return <div className="flex h-screen items-center justify-center text-white font-bold animate-pulse">در حال دریافت تنظیمات از سرور...</div>;

    return (
        <NotificationContext.Provider value={notifyValue}>
            <DialogContext.Provider value={dialogValue}>
                <NotificationModal isOpen={notifyState.isOpen} onClose={() => setNotifyState(p => ({ ...p, isOpen: false }))} title={notifyState.title} message={notifyState.message} type={notifyState.type} />
                <ConfirmDialog isOpen={dialogConfig.isOpen} title={dialogConfig.title} message={dialogConfig.message} type={dialogConfig.type} onConfirm={() => closeDialog(true)} onCancel={() => closeDialog(false)} />
                <ExitDialog isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={performExit} onBackupAndExit={performBackupAndExit} title="خروج" message="آیا نسخه پشتیبان گرفته شود؟" />
                {user.role !== 'admin' && <ChangePasswordModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} username={user.username} notify={{show: showNotify}} />}

                <div className="flex min-h-screen text-gray-300 font-sans">
                    <aside className="w-64 flex flex-col border-l border-white/5 bg-[#020617]/80 backdrop-blur-xl shrink-0 z-50 sticky top-0 h-screen">
                        <div className="flex flex-col items-center justify-center border-b border-white/5 gap-1 py-4">
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">NEXUS</h1>
                            <div className="flex items-center gap-2 text-[10px] font-bold"><span className={`w-2 h-2 rounded-full ${serverStatus ? 'bg-nexus-success' : 'bg-nexus-danger'}`}></span><span className={serverStatus ? 'text-nexus-success' : 'text-nexus-danger'}>{serverStatus ? 'سرور متصل' : 'قطع'}</span></div>
                            <span className="text-[10px] text-gray-500 font-mono" dir="ltr">{new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(currentTime)}</span>
                        </div>
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
                            <div className="text-xs font-bold text-gray-500 px-4 mb-2 flex justify-between"><span>منو</span><span className="text-nexus-accent">{user.username}</span></div>
                            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="layout-grid" className="w-5 h-5"></i> داشبورد</button>
                            {hasPerm('entry') && <button onClick={() => setActiveTab('entry')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'entry' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="package-plus" className="w-5 h-5"></i> ورود قطعه</button>}
                            {hasPerm('withdraw') && <button onClick={() => setActiveTab('withdraw')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'withdraw' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="arrow-down-circle" className="w-5 h-5"></i> برداشت قطعه</button>}
                            {hasPerm('inventory') && <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="bar-chart-2" className="w-5 h-5"></i> موجودی و آمار</button>}
                            {(hasPerm('users') || hasPerm('management') || hasPerm('backup')) && <div className="text-xs font-bold text-gray-500 px-4 mt-4 mb-2">مدیریت</div>}
                            {hasPerm('users') && <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="users" className="w-5 h-5"></i> کاربران</button>}
                            {hasPerm('management') && <button onClick={() => setActiveTab('management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="list-checks" className="w-5 h-5"></i> تنظیمات</button>}
                            {hasPerm('backup') && <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'backup' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="database-backup" className="w-5 h-5"></i> پشتیبان‌گیری</button>}
                            {(hasPerm('contacts') || hasPerm('log')) && <div className="text-xs font-bold text-gray-500 px-4 mt-4 mb-2">گزارشات</div>}
                            {hasPerm('contacts') && <button onClick={() => setActiveTab('contacts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="contact-2" className="w-5 h-5"></i> تامین‌کنندگان</button>}
                            {hasPerm('log') && <button onClick={() => setActiveTab('log')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'log' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}><i data-lucide="history" className="w-5 h-5"></i> تاریخچه</button>}
                        </nav>
                        <div className="p-4 border-t border-white/5 space-y-2">
                            {user.role !== 'admin' && <button onClick={() => setShowPassModal(true)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-4 w-full"><i data-lucide="key" className="w-4 h-4"></i> تغییر رمز</button>}
                            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm px-4 w-full"><i data-lucide="log-out" className="w-4 h-4"></i> خروج</button>
                            <button onClick={handleExitRequest} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm px-4 w-full"><i data-lucide="power" className="w-4 h-4"></i> بستن</button>
                        </div>
                    </aside>
                    <main className="flex-1 flex flex-col min-w-0 bg-nexus-bg">
                        <ErrorBoundary>
                            {/* ارسال مستقیم hasPerm به داشبورد و سایر کامپوننت‌ها */}
                            {activeTab === 'dashboard' && <DashboardPage setView={setActiveTab} user={user} hasPerm={hasPerm} />}
                            {activeTab === 'entry' && hasPerm('entry') && <EntryPage setView={setActiveTab} serverStatus={serverStatus} user={user} globalConfig={globalConfig} />}
                            {activeTab === 'withdraw' && hasPerm('withdraw') && <WithdrawPage user={user} serverStatus={serverStatus} />}
                            {activeTab === 'inventory' && hasPerm('inventory') && <InventoryPage />} 
                            {activeTab === 'users' && hasPerm('users') && <UsersPage serverStatus={serverStatus} />}
                            {activeTab === 'management' && hasPerm('management') && <ManagementPage globalConfig={globalConfig} onConfigUpdate={setGlobalConfig} />}
                            {activeTab === 'backup' && hasPerm('backup') && <BackupPage />}
                            {activeTab === 'contacts' && hasPerm('contacts') && <ContactsPage serverStatus={serverStatus} />}
                            {activeTab === 'log' && hasPerm('log') && <LogPage />}
                        </ErrorBoundary>
                    </main>
                </div>
            </DialogContext.Provider>
        </NotificationContext.Provider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);