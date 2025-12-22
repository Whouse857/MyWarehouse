// [TAG: MAIN_APP]
// نقطه شروع برنامه، مدیریت وضعیت کلی و مسیریابی
// نسخه نهایی: منطق ساده شده بررسی دسترسی‌ها

// استخراج هوک‌های React
const { useState, useEffect, useCallback, useMemo } = React;

// --- کامپوننت صفحه ورود (Login Page) ---
const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const notify = useNotify();
    
    // رفرش آیکون‌ها
    useLucide([]);

    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/login', { method: 'POST', body: { username, password } });
            if (ok && data.success) {
                // بک‌آپ دیتای یوزر تمیز شده است
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
                <div className="flex justify-center mb-6">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">NEXUS</h1>
                </div>
                <h2 className="text-xl font-bold text-white text-center mb-6">ورود به سیستم انبار</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <NexusInput 
                        label="نام کاربری" 
                        value={username} 
                        onChange={e=>setUsername(e.target.value)} 
                        dir="ltr" 
                        className="text-center" 
                    />
                    <NexusInput 
                        label="رمز عبور" 
                        type="password" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        dir="ltr" 
                        className="text-center" 
                    />
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full h-11 bg-nexus-primary hover:bg-indigo-600 rounded-xl font-bold text-white transition disabled:opacity-50"
                    >
                        {loading ? 'در حال بررسی...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- کامپوننت تغییر رمز عبور ---
const ChangePasswordModal = ({ isOpen, onClose, username, notify }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            notify.show('خطا', 'تمامی فیلدها باید پر شوند', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            notify.show('خطا', 'رمز عبور جدید و تأیید آن مطابقت ندارند', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/user/change_password', {
                method: 'POST',
                body: {
                    username,
                    old_password: oldPassword,
                    new_password: newPassword
                }
            });
            
            if (ok && data.success) {
                notify.show('موفقیت', 'رمز عبور با موفقیت تغییر کرد', 'success');
                onClose();
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                notify.show('خطا', data.message || 'خطا در تغییر رمز عبور', 'error');
            }
        } catch (e) {
            notify.show('خطا', 'خطای ارتباط با سرور', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4">تغییر رمز عبور</h3>
                <div className="space-y-3">
                    <NexusInput 
                        label="رمز عبور فعلی" 
                        type="password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        dir="ltr"
                    />
                    <NexusInput 
                        label="رمز عبور جدید" 
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        dir="ltr"
                    />
                    <NexusInput 
                        label="تأیید رمز عبور جدید" 
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        dir="ltr"
                    />
                </div>
                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition">انصراف</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-white text-xs font-bold transition disabled:opacity-50">
                        {loading ? 'در حال تغییر...' : 'تغییر رمز'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

// --- کامپوننت اصلی برنامه (App) ---
const App = () => {
    // 1. وضعیت‌های Global
    const [notifyState, setNotifyState] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: "", message: "", type: "danger", resolve: null });
    
    // 2. وضعیت‌های برنامه
    const [activeTab, setActiveTab] = useState('dashboard');
    const [serverStatus, setServerStatus] = useState(false);
    const [user, setUser] = useState(null);
    const [globalConfig, setGlobalConfig] = useState(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    
    // 3. وضعیت ساعت
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPassModal, setShowPassModal] = useState(false);

    // --- Contexts ---
    const showNotify = useCallback((title, message, type = 'success') => { 
        setNotifyState({ isOpen: true, title, message, type }); 
    }, []);
    const notifyValue = useMemo(() => ({ show: showNotify }), [showNotify]);

    const ask = useCallback((title, message, type="danger") => {
        return new Promise((resolve) => { 
            setDialogConfig({ isOpen: true, title, message, type, resolve }); 
        });
    }, []);
    const dialogValue = useMemo(() => ({ ask }), [ask]);

    const closeDialog = (result) => {
        if (dialogConfig.resolve) dialogConfig.resolve(result);
        setDialogConfig(prev => ({ ...prev, isOpen: false, resolve: null }));
    };

    // --- تابع ساده شده بررسی دسترسی‌ها ---
    const hasPerm = useCallback((key) => {
        // اگر کاربر لاگین نکرده
        if (!user) return false;
        
        // ادمین همیشه همه چیز را می‌بیند
        if (user.role === 'admin' || user.username === 'admin') {
            return true;
        }
        
        // اگر permissions تعریف نشده
        if (!user.permissions) {
            console.warn('No permissions defined for user:', user.username);
            return false;
        }
        
        // ساده‌ترین بررسی: اگر key در permissions وجود داشت و truthy بود
        return !!user.permissions[key];
    }, [user]);

    // --- Effects ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { 
        const check = () => fetchAPI('/heartbeat', { method: 'POST' })
            .then(() => setServerStatus(true))
            .catch(() => setServerStatus(false));
        check(); 
        const i = setInterval(check, 5000); 
        return () => clearInterval(i); 
    }, []);

    useEffect(() => {
        const loadConfig = async () => { 
            try { 
                const { ok, data } = await fetchAPI('/settings/config'); 
                if (ok) setGlobalConfig(data); 
            } catch (e) { console.error(e); } 
        };
        loadConfig();
    }, []);

    useEffect(() => {
        const handleUnload = () => { 
            fetch(`${API_URL}/client_closed`, { 
                method: 'POST', 
                keepalive: true, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ reason: 'unload' }) 
            }); 
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, []);
    
    useEffect(() => { 
        setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50); 
    }, [activeTab, user]);
    
    // --- Handlers ---
    const handleExitRequest = () => setShowExitConfirm(true);
    const performExit = () => fetchAPI('/exit_app', { method: 'POST' }).finally(() => window.close());
    const performBackupAndExit = async () => {
        try {
            const { ok, data } = await fetchAPI('/backup/create', { method: 'POST' });
            if (ok) performExit();
            else { showNotify('خطا', 'مشکل در گرفتن بک‌آپ', 'error'); setShowExitConfirm(false); }
        } catch (e) { showNotify('خطا', 'مشکل در ارتباط با سرور', 'error'); setShowExitConfirm(false); }
    };

    const handleLogout = () => { setUser(null); setActiveTab('dashboard'); };

    // --- Rendering ---
    if (!user) {
        return (
            <NotificationContext.Provider value={notifyValue}>
                <LoginPage onLogin={setUser} />
                <NotificationModal 
                    isOpen={notifyState.isOpen} 
                    onClose={() => setNotifyState(prev => ({ ...prev, isOpen: false }))} 
                    title={notifyState.title} 
                    message={notifyState.message} 
                    type={notifyState.type} 
                />
            </NotificationContext.Provider>
        );
    }

    if (!globalConfig) {
        return <div className="flex h-screen items-center justify-center text-white">در حال بارگذاری تنظیمات...</div>;
    }

    return (
        <NotificationContext.Provider value={notifyValue}>
            <DialogContext.Provider value={dialogValue}>
                <NotificationModal 
                    isOpen={notifyState.isOpen} 
                    onClose={() => setNotifyState(prev => ({ ...prev, isOpen: false }))} 
                    title={notifyState.title} 
                    message={notifyState.message} 
                    type={notifyState.type} 
                />
                <ConfirmDialog 
                    isOpen={dialogConfig.isOpen} 
                    title={dialogConfig.title} 
                    message={dialogConfig.message} 
                    type={dialogConfig.type} 
                    onConfirm={() => closeDialog(true)} 
                    onCancel={() => closeDialog(false)} 
                />
                <ExitDialog 
                    isOpen={showExitConfirm} 
                    onClose={() => setShowExitConfirm(false)} 
                    onConfirm={performExit} 
                    onBackupAndExit={performBackupAndExit} 
                    title="خروج از برنامه" 
                    message="آیا می‌خواهید قبل از خروج، یک نسخه پشتیبان (Backup) از اطلاعات تهیه کنید؟" 
                />
                
                {user.role !== 'admin' && (
                    <ChangePasswordModal 
                        isOpen={showPassModal} 
                        onClose={() => setShowPassModal(false)} 
                        username={user.username} 
                        notify={{show: showNotify}} 
                    />
                )}

                <div className="flex min-h-screen text-gray-300 font-sans">
                    <aside className="w-64 flex flex-col border-l border-white/5 bg-[#020617]/80 backdrop-blur-xl shrink-0 z-50 sticky top-0 h-screen">
                        <div className="flex flex-col items-center justify-center border-b border-white/5 gap-1 py-4">
                            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">NEXUS</h1>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                    <span className={`w-2 h-2 rounded-full ${serverStatus ? 'bg-nexus-success shadow-[0_0_8px_#10b981]' : 'bg-nexus-danger ping-slow'}`}></span>
                                    <span className={serverStatus ? 'text-nexus-success' : 'text-nexus-danger'}>{serverStatus ? 'سرور متصل' : 'تلاش برای اتصال...'}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono tracking-wider opacity-80" dir="ltr">
                                    {new Intl.DateTimeFormat('fa-IR', { 
                                        year: 'numeric', month: '2-digit', day: '2-digit',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                                    }).format(currentTime)}
                                </span>
                            </div>
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scroll">
                            <div className="text-xs font-bold text-gray-500 px-4 mb-2 flex justify-between">
                                <span>منوی اصلی</span>
                                <span className="text-nexus-accent">{user.username}</span>
                            </div>
                            
                            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                <i data-lucide="layout-grid" className="w-5 h-5"></i> داشبورد
                            </button>
                            
                            {hasPerm('entry') && (
                                <button onClick={() => setActiveTab('entry')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'entry' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="package-plus" className="w-5 h-5"></i> ورود قطعه
                                </button>
                            )}
                            
                            {hasPerm('withdraw') && (
                                <button onClick={() => setActiveTab('withdraw')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'withdraw' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="arrow-down-circle" className="w-5 h-5"></i> برداشت قطعه
                                </button>
                            )}
                            
                            {hasPerm('inventory') && (
                                <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="bar-chart-2" className="w-5 h-5"></i> موجودی و آمار
                                </button>
                            )}

                            {(hasPerm('users') || hasPerm('management') || hasPerm('backup')) && (
                                <div className="text-xs font-bold text-gray-500 px-4 mt-4 mb-2">مدیریت</div>
                            )}
                            
                            {hasPerm('users') && (
                                <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="users" className="w-5 h-5"></i> کاربران
                                </button>
                            )}
                            
                            {hasPerm('management') && (
                                <button onClick={() => setActiveTab('management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'management' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="list-checks" className="w-5 h-5"></i> لیست‌ها و تنظیمات
                                </button>
                            )}
                            
                            {hasPerm('backup') && (
                                <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'backup' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="database-backup" className="w-5 h-5"></i> پشتیبان‌گیری
                                </button>
                            )}
                            
                            {(hasPerm('contacts') || hasPerm('log')) && (
                                <div className="text-xs font-bold text-gray-500 px-4 mt-4 mb-2">گزارشات</div>
                            )}

                            {hasPerm('contacts') && (
                                <button onClick={() => setActiveTab('contacts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="contact-2" className="w-5 h-5"></i> تامین‌کنندگان
                                </button>
                            )}
                            
                            {hasPerm('log') && (
                                <button onClick={() => setActiveTab('log')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'log' ? 'bg-nexus-primary/10 text-nexus-primary border border-nexus-primary/20' : 'text-gray-400 hover:bg-white/5'}`}>
                                    <i data-lucide="history" className="w-5 h-5"></i> تاریخچه تراکنش
                                </button>
                            )}
                        </nav>

                        <div className="p-4 border-t border-white/5 space-y-2">
                            {user.role !== 'admin' && (
                                <button onClick={() => setShowPassModal(true)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm px-4 w-full">
                                    <i data-lucide="key" className="w-4 h-4"></i> تغییر رمز عبور
                                </button>
                            )}
                            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm px-4 w-full">
                                <i data-lucide="log-out" className="w-4 h-4"></i> خروج از حساب
                            </button>
                            <button onClick={handleExitRequest} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm px-4 w-full">
                                <i data-lucide="power" className="w-4 h-4"></i> بستن برنامه
                            </button>
                        </div>
                    </aside>
                    
                    <main className="flex-1 flex flex-col min-w-0 relative bg-nexus-bg">
                        <ErrorBoundary>
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