// [TAG: PAGE_ADMIN]
// صفحات مدیریتی: کاربران، تنظیمات و پشتیبان‌گیری
// این فایل شامل کامپوننت‌های UsersPage, ManagementPage, BackupPage است که در Main Application صدا زده می‌شوند.

const { useState, useEffect, useCallback } = React;

// --- Users Page ---
const UsersPage = ({ serverStatus }) => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ id: null, username: '', password: '', full_name: '', mobile: '', permissions: {} });
    const notify = useNotify();
    const dialog = useDialog();

    // لیست دسترسی‌های قابل تنظیم
    const permissionKeys = [
        { key: 'entry', label: 'ورود قطعه' },
        { key: 'withdraw', label: 'خروج قطعه' },
        { key: 'inventory', label: 'مشاهده موجودی' },
        { key: 'contacts', label: 'تامین‌کنندگان' },
        { key: 'log', label: 'گزارشات' },
        { key: 'users', label: 'مدیریت کاربران' },
        { key: 'management', label: 'تنظیمات سیستم' },
        { key: 'backup', label: 'پشتیبان‌گیری' }
    ];

    const loadUsers = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/users');
            if (ok) setUsers(data);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useLucide([users]);

    const handleSave = async () => {
        if (!formData.username) return notify.show('خطا', 'نام کاربری الزامی است', 'error');
        if (!formData.id && !formData.password) return notify.show('خطا', 'رمز عبور برای کاربر جدید الزامی است', 'error');

        try {
            const { ok, data } = await fetchAPI('/users/save', { method: 'POST', body: formData });
            if (ok) {
                notify.show('موفقیت', 'کاربر ذخیره شد', 'success');
                setFormData({ id: null, username: '', password: '', full_name: '', mobile: '', permissions: {} });
                loadUsers();
            } else {
                notify.show('خطا', data.error || 'مشکل در ذخیره', 'error');
            }
        } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); }
    };

    const handleDelete = async (id) => {
        if (await dialog.ask('حذف کاربر', 'آیا مطمئن هستید؟ دسترسی کاربر قطع خواهد شد.', 'danger')) {
            try {
                const { ok, data } = await fetchAPI(`/users/delete/${id}`, { method: 'DELETE' });
                if (ok) { loadUsers(); notify.show('حذف شد', 'کاربر حذف گردید.', 'success'); }
                else notify.show('خطا', data.error, 'error');
            } catch (e) {}
        }
    };

    const togglePerm = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
        }));
    };

    return (
        <div className="flex-1 p-6 h-full flex flex-col overflow-hidden">
            <header className="mb-6"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><i data-lucide="users" className="text-nexus-primary"></i>مدیریت کاربران</h2></header>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-3 bg-white/5 border-b border-white/5 grid grid-cols-12 text-xs font-bold text-gray-400 text-center">
                        <div className="col-span-3 text-right pr-2">نام کاربری / نام کامل</div>
                        <div className="col-span-2">نقش</div>
                        <div className="col-span-2">موبایل</div>
                        <div className="col-span-3">دسترسی‌ها</div>
                        <div className="col-span-2">عملیات</div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-2">
                        {users.map(u => (
                            <div key={u.id} className="grid grid-cols-12 items-center p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition text-sm">
                                <div className="col-span-3 text-right pr-2">
                                    <div className="font-bold text-white">{u.username}</div>
                                    <div className="text-[10px] text-gray-400">{u.full_name || '-'}</div>
                                </div>
                                <div className="col-span-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>{u.role === 'admin' ? 'مدیر کل' : 'اپراتور'}</span></div>
                                <div className="col-span-2 text-center text-xs text-gray-400">{u.mobile || '-'}</div>
                                <div className="col-span-3 text-center flex flex-wrap gap-1 justify-center">
                                    {u.role === 'admin' ? <span className="text-[10px] text-gray-500">دسترسی کامل</span> : 
                                        permissionKeys.filter(k => u.permissions && u.permissions[k.key]).length > 0 
                                        ? <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1 rounded">{permissionKeys.filter(k => u.permissions && u.permissions[k.key]).length} مورد</span>
                                        : <span className="text-[10px] text-red-400">بدون دسترسی</span>
                                    }
                                </div>
                                <div className="col-span-2 flex justify-center gap-2">
                                    <button onClick={() => setFormData({...u, password: ''})} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"><i data-lucide="pencil" className="w-4 h-4"></i></button>
                                    {u.role !== 'admin' && <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"><i data-lucide="trash-2" className="w-4 h-4"></i></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-2xl border border-white/5 h-fit">
                    <h3 className="text-lg font-bold text-white mb-4">{formData.id ? 'ویرایش کاربر' : 'افزودن کاربر جدید'}</h3>
                    <div className="space-y-3">
                        <NexusInput label="نام کاربری *" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} disabled={!serverStatus} dir="ltr" />
                        <NexusInput label={formData.id ? "تغییر رمز عبور (اختیاری)" : "رمز عبور *"} type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} disabled={!serverStatus} dir="ltr" />
                        <NexusInput label="نام و نام خانوادگی" value={formData.full_name} onChange={e=>setFormData({...formData, full_name: e.target.value})} disabled={!serverStatus} />
                        <NexusInput label="شماره موبایل" value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} disabled={!serverStatus} dir="ltr" />
                        
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                            <label className="text-xs text-gray-400 block mb-2 font-bold">سطح دسترسی‌ها</label>
                            <div className="grid grid-cols-2 gap-2">
                                {permissionKeys.map(p => (
                                    <div key={p.key} onClick={() => togglePerm(p.key)} className={`cursor-pointer px-2 py-1.5 rounded-lg border text-[11px] flex items-center justify-between transition ${formData.permissions[p.key] ? 'bg-nexus-primary/20 border-nexus-primary/50 text-white' : 'bg-black/20 border-transparent text-gray-500 hover:bg-white/5'}`}>
                                        <span>{p.label}</span>
                                        {formData.permissions[p.key] && <i data-lucide="check" className="w-3 h-3 text-nexus-primary"></i>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            {formData.id && <button onClick={() => setFormData({ id: null, username: '', password: '', full_name: '', mobile: '', permissions: {} })} className="flex-1 py-2 bg-white/5 rounded-xl text-gray-400 text-xs">انصراف</button>}
                            <button onClick={handleSave} disabled={!serverStatus} className="flex-[2] py-2 bg-nexus-primary hover:bg-indigo-600 rounded-xl text-white font-bold transition">{formData.id ? 'ذخیره تغییرات' : 'ایجاد کاربر'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Management Page ---
const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    const notify = useNotify();
    const [activeCat, setActiveCat] = useState('Resistor');
    const [newItemVal, setNewItemVal] = useState("");
    const [editMode, setEditMode] = useState(null); // { mode: 'item'|'category', oldVal: '' }

    const handleRename = async (mode, oldVal, newVal, listName = null) => {
        if (!newVal || newVal === oldVal) { setEditMode(null); return; }
        try {
            const body = { mode, oldVal, newVal, category: activeCat, listName };
            const { ok, data } = await fetchAPI('/settings/rename', { method: 'POST', body });
            if (ok) {
                notify.show('موفقیت', 'تغییر نام انجام شد. دیتابیس بروزرسانی شد.', 'success');
                // Refresh Config
                const { ok: ok2, data: cfg } = await fetchAPI('/settings/config');
                if (ok2) onConfigUpdate(cfg);
            } else {
                notify.show('خطا', data.error, 'error');
            }
        } catch (e) { notify.show('خطا', 'مشکل ارتباط با سرور', 'error'); }
        setEditMode(null);
    };

    const categories = globalConfig ? Object.keys(globalConfig).filter(k => k !== 'General') : [];
    const currentConfig = globalConfig?.[activeCat] || {};

    const EditableItem = ({ val, onDelete, onRename }) => {
        const [temp, setTemp] = useState(val);
        const isEditing = editMode?.oldVal === val;

        if (isEditing) {
            return (
                <div className="flex gap-1 animate-in zoom-in">
                    <input className="nexus-input px-2 py-1 text-xs w-full" value={temp} onChange={e => setTemp(e.target.value)} autoFocus />
                    <button onClick={() => onRename(temp)} className="text-emerald-400 p-1"><i data-lucide="check" className="w-4 h-4"></i></button>
                    <button onClick={() => setEditMode(null)} className="text-red-400 p-1"><i data-lucide="x" className="w-4 h-4"></i></button>
                </div>
            );
        }
        return (
            <div className="flex justify-between items-center group">
                <span className="text-gray-300 text-sm">{val}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setEditMode({ mode: 'item', oldVal: val })} className="text-blue-400 hover:bg-blue-500/10 p-1 rounded"><i data-lucide="pencil" className="w-3 h-3"></i></button>
                    {/* Note: Delete logic requires simpler array manipulation on backend, omitted for safety in rename-focused robust version, can be added if needed */}
                </div>
            </div>
        );
    };

    useLucide([activeCat, editMode]);

    if (!globalConfig) return null;

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <header className="mb-6"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><i data-lucide="list-checks" className="text-nexus-primary"></i>مدیریت لیست‌ها و تنظیمات</h2></header>
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 md:col-span-3 glass-panel rounded-xl border border-white/5 p-4 flex flex-col gap-2 overflow-y-auto">
                    <h4 className="text-xs text-gray-500 font-bold mb-2">دسته‌بندی‌ها</h4>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCat(cat)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex justify-between items-center ${activeCat === cat ? 'bg-nexus-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                            <span>{globalConfig[cat].label || cat}</span>
                            {activeCat === cat && <i data-lucide="chevron-left" className="w-4 h-4"></i>}
                        </button>
                    ))}
                    <div className="mt-auto pt-4 border-t border-white/5">
                        <p className="text-[10px] text-gray-500 leading-relaxed text-justify">
                            توجه: تغییر نام در اینجا باعث بروزرسانی تمام قطعات ثبت شده در دیتابیس می‌شود.
                        </p>
                    </div>
                </div>
                <div className="col-span-12 md:col-span-9 glass-panel rounded-xl border border-white/5 p-6 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
                        <div>
                            <span className="text-xs text-gray-400 block mb-1">دسته انتخاب شده</span>
                            <h3 className="text-2xl font-black text-white">{currentConfig.label}</h3>
                        </div>
                        <div className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full font-mono">{activeCat}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto custom-scroll pr-2">
                        {/* Packages List */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <h4 className="text-sm font-bold text-nexus-accent mb-4 flex items-center gap-2"><i data-lucide="box" className="w-4 h-4"></i> پکیج‌ها (Packages)</h4>
                            <div className="space-y-2">
                                {(currentConfig.packages || []).map((pkg, idx) => (
                                    <div key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-transparent hover:border-white/10">
                                        <EditableItem 
                                            val={pkg} 
                                            onRename={(newVal) => handleRename('item', pkg, newVal, 'packages')} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Techs/Types List */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <h4 className="text-sm font-bold text-nexus-accent mb-4 flex items-center gap-2"><i data-lucide="cpu" className="w-4 h-4"></i> تکنولوژی‌ها (Techs)</h4>
                            <div className="space-y-2">
                                {(currentConfig.techs || []).map((tech, idx) => (
                                    <div key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-transparent hover:border-white/10">
                                        <EditableItem 
                                            val={tech} 
                                            onRename={(newVal) => handleRename('item', tech, newVal, 'techs')} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Storage Locations (Only for General or if specific per cat) */}
                        {activeCat === 'General' && (
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 lg:col-span-2">
                                <h4 className="text-sm font-bold text-nexus-accent mb-4 flex items-center gap-2"><i data-lucide="map-pin" className="w-4 h-4"></i> آدرس‌های انبار (Locations)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {(currentConfig.locations || []).map((loc, idx) => (
                                        <div key={idx} className="bg-white/5 px-3 py-2 rounded-lg border border-transparent hover:border-white/10">
                                            <EditableItem 
                                                val={loc} 
                                                onRename={(newVal) => handleRename('item', loc, newVal, 'locations')} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Backup Page ---
const BackupPage = () => {
    const [backups, setBackups] = useState([]);
    const notify = useNotify();
    const dialog = useDialog();

    const loadBackups = useCallback(async () => {
        try { const { ok, data } = await fetchAPI('/backup/list'); if (ok) setBackups(data); } catch (e) {}
    }, []);

    useEffect(() => { loadBackups(); }, [loadBackups]);
    useLucide([backups]);

    const handleCreate = async () => {
        const { ok, data } = await fetchAPI('/backup/create', { method: 'POST' });
        if (ok) { notify.show('موفقیت', 'نسخه پشتیبان جدید ایجاد شد', 'success'); loadBackups(); }
        else notify.show('خطا', data.error, 'error');
    };

    const handleRestore = async (name) => {
        if (await dialog.ask('بازگردانی اطلاعات', `آیا مطمئن هستید؟ دیتابیس فعلی با نسخه ${name} جایگزین می‌شود و تغییرات جدید از بین می‌رود.`, 'danger')) {
            const { ok, data } = await fetchAPI(`/backup/restore/${name}`, { method: 'POST' });
            if (ok) { notify.show('موفقیت', 'دیتابیس با موفقیت بازگردانی شد. صفحه رفرش می‌شود.', 'success'); setTimeout(() => window.location.reload(), 2000); }
            else notify.show('خطا', data.error, 'error');
        }
    };

    const handleDelete = async (name) => {
        if (await dialog.ask('حذف فایل', `آیا از حذف فایل پشتیبان ${name} اطمینان دارید؟`, 'warning')) {
            const { ok } = await fetchAPI(`/backup/delete/${name}`, { method: 'DELETE' });
            if (ok) loadBackups();
        }
    };

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><i data-lucide="database" className="text-nexus-primary"></i>مدیریت فایل‌های پشتیبان</h2>
                <button onClick={handleCreate} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition"><i data-lucide="plus-circle" className="w-5 h-5"></i>ایجاد نسخه پشتیبان جدید</button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scroll pb-10">
                {backups.map((b, i) => (
                    <div key={i} className="glass-panel border border-white/5 p-4 rounded-xl flex flex-col gap-3 group hover:border-nexus-primary/30 transition">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400"><i data-lucide="file-clock" className="w-5 h-5"></i></div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-white truncate" dir="ltr">{b.name}</h4>
                                <span className="text-[10px] text-gray-500 font-mono">{b.date} | {b.size} KB</span>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => handleRestore(b.name)} className="flex-1 py-1.5 bg-white/5 hover:bg-nexus-warning hover:text-black text-nexus-warning border border-nexus-warning/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"><i data-lucide="rotate-ccw" className="w-3 h-3"></i>بازگردانی</button>
                            <button onClick={() => handleDelete(b.name)} className="px-3 py-1.5 bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 border border-white/5 rounded-lg transition"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                        </div>
                    </div>
                ))}
                {backups.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                        <i data-lucide="database-backup" className="w-16 h-16 mb-4"></i>
                        <p>هیچ فایل پشتیبانی یافت نشد.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export to global scope
window.UsersPage = UsersPage;
window.ManagementPage = ManagementPage;
window.BackupPage = BackupPage;