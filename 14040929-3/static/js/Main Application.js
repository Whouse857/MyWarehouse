// [TAG: MAIN_APP]
// طراحی بصری اختصاصی H&Y با منطق دقیق فایل مرجع
// اصلاح شده: استفاده از لوگو در پس‌زمینه و افزایش غلظت پنل‌های شیشه‌ای
// تغییر جدید: عدم نمایش گزینه تغییر گذرواژه برای ادمین در منوی پروفایل

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// --- سیستم پس‌زمینه مهندسی H&Y ---
const AppBackground = () => (
  <div className="fixed inset-0 -z-20 overflow-hidden bg-[#01040f]">
    {/* لایه‌های نوری متحرک */}
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
    
    {/* خطوط شبکه‌ای مهندسی */}
    <div className="absolute inset-0 opacity-[0.06]" 
         style={{ backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>
    </div>
    
    {/* لوگوی برنامه در پس‌زمینه به جای متن */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none p-20">
       <img 
          src="/static/logo.png" 
          alt="" 
          className="w-full max-w-4xl h-auto object-contain grayscale invert" 
          onError={(e) => { e.target.style.display='none'; }}
       />
    </div>
  </div>
);

// --- کامپوننت اعلان (Toast) متمرکز و هوشمند ---
const NexusToast = ({ isOpen, onClose, title, message, type }) => {
  useEffect(() => { if (isOpen && window.lucide) window.lucide.createIcons(); }, [isOpen]);
  if (!isOpen) return null;
  
  const isErr = type === 'error';
  const colorClass = isErr ? 'text-red-400' : 'text-blue-400';
  const borderClass = isErr ? 'border-red-500/30' : 'border-blue-500/30';
  const bgClass = isErr ? 'bg-red-500/20' : 'bg-blue-500/20'; // پررنگ‌تر شد
  const icon = isErr ? 'alert-triangle' : 'check-circle-2';

  const toastBox = (
    <div className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-[#0f172a]/95 backdrop-blur-xl border ${borderClass} shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-300 max-w-sm pointer-events-auto text-center relative overflow-hidden`} dir="rtl" onClick={e => e.stopPropagation()}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass} mb-2 shadow-inner`}>
        <i data-lucide={icon} className="w-8 h-8"></i>
      </div>
      <div className="flex flex-col gap-1">
        <span className={`text-lg font-black tracking-tight ${colorClass}`}>{title}</span>
        <span className="text-sm text-gray-200 leading-relaxed font-medium">{message}</span>
      </div>
      
      {isErr ? (
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold transition-all shadow-lg text-sm active:scale-95">متوجه شدم</button>
      ) : (
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white transition-colors">
          <i data-lucide="x" className="w-4 h-4"></i>
        </button>
      )}
    </div>
  );

  return (
    <div className={`fixed inset-0 ${isErr ? 'z-[1000] bg-[#020617]/90 backdrop-blur-md' : 'z-[999] pointer-events-none'} flex items-center justify-center p-4 transition-all duration-300`}>
      {toastBox}
    </div>
  );
};

// --- صفحه ورود (Login Page) اختصاصی H&Y ---
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
    <div className="relative flex h-screen items-center justify-center p-6">
      <AppBackground />
      <div className="bg-[#020617]/95 backdrop-blur-2xl p-10 rounded-[3rem] w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6 group">
             <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-10"></div>
             <img 
              src="/static/logo.png" 
              alt="H&Y" 
              className="h-28 w-auto object-contain relative z-10 drop-shadow-2xl transition-transform duration-700 hover:scale-105"
              onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<h1 class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">H&Y</h1>'; }}
            />
          </div>
          <h2 className="text-2xl font-black text-white text-center tracking-tighter uppercase">مدیریت هوشمند انبار H&Y</h2>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-bold">Industrial OS System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <NexusInput label="نام کاربری" value={username} onChange={e=>setUsername(e.target.value)} dir="ltr" className="text-center font-bold !rounded-2xl bg-white/5 border-white/10 focus:border-blue-500/50 transition-all" />
            <NexusInput label="رمز عبور" type="password" value={password} onChange={e=>setPassword(e.target.value)} dir="ltr" className="text-center font-bold !rounded-2xl bg-white/5 border-white/10 focus:border-blue-500/50 transition-all" />
          </div>
          <button type="submit" disabled={loading} className="w-full h-14 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 rounded-2xl font-black text-white transition-all shadow-xl shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3">
            {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'ورود به پنل کاربری'}
          </button>
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
      if (ok && data.success) { 
          notify.show('موفقیت', 'رمز عبور با موفقیت تغییر کرد', 'success'); 
          onClose(); 
          setD({ old: '', new: '', confirm: '' }); 
      }
      else notify.show('خطا', data.message || 'خطا در تغییر رمز', 'error');
    } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <i data-lucide="key-round" className="text-blue-400"></i>
            تغییر گذرواژه
        </h3>
        <div className="space-y-4">
          <NexusInput label="رمز فعلی" type="password" value={d.old} onChange={e => setD({...d, old: e.target.value})} dir="ltr" />
          <NexusInput label="رمز جدید" type="password" value={d.new} onChange={e => setD({...d, new: e.target.value})} dir="ltr" />
          <NexusInput label="تکرار رمز جدید" type="password" value={d.confirm} onChange={e => setD({...d, confirm: e.target.value})} dir="ltr" />
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold transition-all border border-white/5">انصراف</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition-all">{loading ? '...' : 'تایید'}</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// --- App Component (منطق فایل مرجع + تم H&Y) ---
const App = () => {
  const [notifyState, setNotifyState] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, title: "", message: "", type: "danger", resolve: null });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStatus, setServerStatus] = useState(false);
  const [user, setUser] = useState(null);
  const [globalConfig, setGlobalConfig] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitLoading, setExitLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPassModal, setShowPassModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const toastTimerRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const showNotify = useCallback((title, message, type = 'success') => { 
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setNotifyState({ isOpen: true, title, message, type }); 
    if (type === 'success' || type === 'info') {
        toastTimerRef.current = setTimeout(() => { setNotifyState(prev => ({ ...prev, isOpen: false })); }, 1500);
    }
  }, []);

  const notifyValue = useMemo(() => ({ show: showNotify }), [showNotify]);
  const ask = useCallback((title, message, type="danger") => new Promise((resolve) => setDialogConfig({ isOpen: true, title, message, type, resolve })), []);
  const dialogValue = useMemo(() => ({ ask }), [ask]);
  const closeDialog = (result) => { if (dialogConfig.resolve) dialogConfig.resolve(result); setDialogConfig(prev => ({ ...prev, isOpen: false, resolve: null })); };

  const hasPerm = useCallback((key) => {
    if (!user) return false;
    if (user.role === 'admin' || user.username === 'admin') return true;
    if (!user.permissions || typeof user.permissions !== 'object') return false;
    return !!user.permissions[key];
  }, [user]);

  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { 
    const check = () => fetchAPI('/heartbeat', { method: 'POST' }).then(() => setServerStatus(true)).catch(() => setServerStatus(false));
    check(); const i = setInterval(check, 5000); return () => clearInterval(i); 
  }, []);
  useEffect(() => { fetchAPI('/settings/config').then(({ok, data}) => { if(ok) setGlobalConfig(data); }); }, []);
  useEffect(() => { const h = () => fetch(`${API_URL}/client_closed`, { method: 'POST', keepalive: true, body: JSON.stringify({ reason: 'unload' }) }); window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, []);
  useEffect(() => { setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 50); }, [activeTab, user, userMenuOpen]);

  const handleExitRequest = () => { setUserMenuOpen(false); setShowExitConfirm(true); };
  const performExit = () => fetchAPI('/exit_app', { method: 'POST' }).finally(() => window.close());
  
  const performBackupAndExit = async () => {
    setExitLoading(true);
    try { 
      const { ok } = await fetchAPI('/backup/create', { method: 'POST', body: { username: user ? user.username : 'System' } }); 
      if (ok) performExit(); 
      else { showNotify('خطا', 'مشکل در ایجاد بک‌آپ', 'error'); setExitLoading(false); setShowExitConfirm(false); } 
    } 
    catch (e) { showNotify('خطا', 'خطای شبکه در بک‌آپ گیری', 'error'); setExitLoading(false); setShowExitConfirm(false); }
  };

  const handleLogout = () => { setUserMenuOpen(false); setUser(null); setActiveTab('dashboard'); };

  if (!user) return (
    <NotificationContext.Provider value={notifyValue}>
      <LoginPage onLogin={setUser} />
      <NexusToast isOpen={notifyState.isOpen} onClose={() => setNotifyState(p => ({ ...p, isOpen: false }))} title={notifyState.title} message={notifyState.message} type={notifyState.type} />
    </NotificationContext.Provider>
  );

  if (!globalConfig) return <div className="flex h-screen items-center justify-center text-white font-black animate-pulse bg-[#020617]">H&Y SYSTEM INITIALIZING...</div>;

  return (
    <NotificationContext.Provider value={notifyValue}>
      <DialogContext.Provider value={dialogValue}>
        <AppBackground />
        <NexusToast isOpen={notifyState.isOpen} onClose={() => setNotifyState(p => ({ ...p, isOpen: false }))} title={notifyState.title} message={notifyState.message} type={notifyState.type} />
        <ConfirmDialog isOpen={dialogConfig.isOpen} title={dialogConfig.title} message={dialogConfig.message} type={dialogConfig.type} onConfirm={() => closeDialog(true)} onCancel={() => closeDialog(false)} />
        <ExitDialog isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} onConfirm={performExit} onBackupAndExit={performBackupAndExit} title="خروج از سیستم" message="آیا می‌خواهید قبل از خروج، نسخه پشتیبان تهیه شود؟" loading={exitLoading} />
        
        <div className="flex min-h-screen text-gray-300 font-sans relative z-10">
          {/* Sidebar Design H&Y - افزایش غلظت پس‌زمینه */}
          <aside className="w-72 flex flex-col border-l border-white/5 bg-[#020617]/95 backdrop-blur-3xl shrink-0 sticky top-0 h-screen shadow-2xl">
            <div className="flex flex-col items-center justify-center border-b border-white/5 py-10 relative">
              <img 
                src="/static/logo.png" 
                alt="H&Y" 
                className="h-16 w-auto object-contain drop-shadow-xl" 
                onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML = '<h1 class="text-3xl font-black text-blue-500">H&Y</h1>'; }}
              />
              <div className="flex items-center gap-2 mt-4">
                <div className={`w-2 h-2 rounded-full ${serverStatus ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${serverStatus ? 'text-blue-400' : 'text-red-400'}`}>{serverStatus ? 'System Online' : 'Offline'}</span>
              </div>
            </div>

            <nav className="flex-1 p-6 space-y-1 overflow-y-auto custom-scroll">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-4 flex justify-between"><span>Workspace</span><span className="text-blue-400">{user.username}</span></div>
              
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <i data-lucide="layout-grid" className="w-5 h-5"></i> <span className="font-bold">داشبورد</span>
              </button>
              {hasPerm('entry') && <button onClick={() => setActiveTab('entry')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'entry' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="package-plus" className="w-5 h-5"></i> <span className="font-bold">ورود قطعه</span></button>}
              {hasPerm('withdraw') && <button onClick={() => setActiveTab('withdraw')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'withdraw' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="arrow-down-circle" className="w-5 h-5"></i> <span className="font-bold">برداشت قطعه</span></button>}
              {hasPerm('inventory') && <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="bar-chart-2" className="w-5 h-5"></i> <span className="font-bold">موجودی و آمار</span></button>}
              
              <div className="h-px bg-white/5 my-6 mx-4"></div>
              
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-4">Management</div>
              {hasPerm('users') && <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'users' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="users" className="w-5 h-5"></i> <span className="font-bold">کاربران</span></button>}
              {hasPerm('management') && <button onClick={() => setActiveTab('management')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'management' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="list-checks" className="w-5 h-5"></i> <span className="font-bold">تنظیمات</span></button>}
              {hasPerm('backup') && <button onClick={() => setActiveTab('backup')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'backup' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="database-backup" className="w-5 h-5"></i> <span className="font-bold">پشتیبان‌گیری</span></button>}
              
              <div className="h-px bg-white/5 my-6 mx-4"></div>

              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-4">Reports</div>
              {hasPerm('contacts') && <button onClick={() => setActiveTab('contacts')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'contacts' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="contact-2" className="w-5 h-5"></i> <span className="font-bold">تامین‌کنندگان</span></button>}
              {hasPerm('log') && <button onClick={() => setActiveTab('log')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === 'log' ? 'bg-blue-600/40 text-white border border-blue-500/30 shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><i data-lucide="history" className="w-5 h-5"></i> <span className="font-bold">تاریخچه</span></button>}
            </nav>

            <div className="p-6 border-t border-white/5 bg-black/40">
              <p className="text-[10px] text-gray-400 text-center font-bold tracking-widest uppercase">H&Y Warehouse v4.0</p>
            </div>
          </aside>

          <main className="flex-1 flex flex-col min-w-0 bg-transparent">
            {/* Header - افزایش غلظت */}
            <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-40">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">امروز</span>
                    <span className="text-sm font-black text-white mt-1" dir="ltr">{new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime)}</span>
                </div>
                
                <div className="flex items-center gap-10">
                    <div className="flex flex-col items-end font-mono">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">System Time</span>
                        <span className="text-2xl font-black text-blue-400 tracking-tighter" dir="ltr">{new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(currentTime)}</span>
                    </div>
                    
                    <div className="relative" ref={userMenuRef}>
                        <button 
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-4 pl-4 border-r border-white/10 group transition-all"
                        >
                            <div className="text-right">
                                <p className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{user.username}</p>
                                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">{user.role}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border border-white/10 group-hover:shadow-blue-500/40 transition-all ${userMenuOpen ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                                <i data-lucide="user" className="w-6 h-6 text-white"></i>
                            </div>
                        </button>

                        {userMenuOpen && (
                            <div className="absolute top-full left-0 mt-3 w-56 bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* نمایش گزینه تغییر گذرواژه فقط برای غیر از ادمین */}
                                {user.role !== 'admin' && (
                                  <button onClick={() => { setShowPassModal(true); setUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all font-bold">
                                      <i data-lucide="key" className="w-4 h-4 text-blue-400"></i> تغییر گذرواژه
                                  </button>
                                )}
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-amber-500/20 hover:text-white transition-all font-bold">
                                    <i data-lucide="log-out" className="w-4 h-4 text-amber-400"></i> خروج از حساب
                                </button>
                                <div className="h-px bg-white/5 my-1"></div>
                                <button onClick={handleExitRequest} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 transition-all font-bold">
                                    <i data-lucide="power" className="w-4 h-4"></i> بستن برنامه
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 p-10 overflow-y-auto custom-scroll relative">
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
            </div>
          </main>
        </div>

        {user && user.role !== 'admin' && <ChangePasswordModal isOpen={showPassModal} onClose={() => setShowPassModal(false)} username={user.username} notify={{show: showNotify}} />}
      </DialogContext.Provider>
    </NotificationContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);