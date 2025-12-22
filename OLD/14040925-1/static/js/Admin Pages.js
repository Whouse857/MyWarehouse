// [TAG: PAGE_ADMIN]
// صفحات مربوط به مدیریت سیستم (کاربران، تنظیمات، بک‌آپ)

const { useState, useEffect, useCallback } = React;

// --- Users Page ---
const UsersPage = ({ serverStatus }) => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '' });
    const notify = useNotify();
    const dialog = useDialog();

    const loadUsers = useCallback(async () => { 
        try { const { ok, data } = await fetchAPI('/users'); if(ok) setUsers(data); } catch(e){} 
    }, []);
    
    useEffect(() => { loadUsers(); }, [loadUsers]);
    useLucide([users, newUser.id]);

    const handleSaveUser = async () => {
        if(!newUser.username || (!newUser.id && !newUser.password)) 
            return notify.show('خطای اعتبارسنجی', "نام کاربری و رمز عبور (برای کاربر جدید) الزامی است.", 'error');
        try { 
            const { ok, data } = await fetchAPI('/users/save', { method: 'POST', body: newUser });
            if(ok) { 
                loadUsers(); 
                setNewUser({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '' }); 
                notify.show('موفقیت', "اطلاعات کاربر با موفقیت ذخیره شد.", 'success'); 
            } else notify.show('خطا', data.error || "خطا در ذخیره کاربر", 'error'); 
        } catch(e) { notify.show('خطای سرور', "ارتباط با سرور برقرار نشد.", 'error'); }
    };

    const handleEditUser = (user) => { setNewUser({ ...user, password: '' }); };

    const handleDeleteUser = async (id) => { 
        const confirmed = await dialog.ask("حذف کاربر", "آیا از حذف این کاربر اطمینان دارید؟\nاین عملیات قابل بازگشت نیست.", "danger");
        if(confirmed) {
            try { 
                const { ok } = await fetchAPI(`/users/delete/${id}`, { method: 'DELETE' });
                if(ok) { loadUsers(); notify.show('حذف شد', 'کاربر با موفقیت حذف گردید.', 'success'); }
            } catch(e){ notify.show('خطا', 'مشکل در حذف کاربر', 'error'); } 
        }
    };
    
    return (
        <div className="flex-1 p-8">
            <header className="mb-8"><h2 className="text-2xl font-bold text-white">مدیریت کاربران</h2></header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel rounded-2xl p-6">
                    <h3 className="text-lg font-bold mb-4 text-nexus-accent">لیست کاربران</h3>
                    <div className="space-y-2">
                        {users.map(u => (
                            <div key={u.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white ml-2">{u.username}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{u.role === 'admin' ? 'مدیر' : 'اپراتور'}</span>
                                    </div>
                                    {(u.full_name || u.mobile) && (<div className="text-xs text-gray-400 flex gap-3">{u.full_name && <span>{u.full_name}</span>}{u.mobile && <span className="ltr font-mono text-gray-500">{u.mobile}</span>}</div>)}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditUser(u)} disabled={!serverStatus} className="text-blue-400 hover:bg-blue-400/20 p-2 rounded transition disabled:opacity-50"><i data-lucide="pencil" className="w-4 h-4"></i></button>
                                    {u.username !== 'admin' && (<button onClick={()=>handleDeleteUser(u.id)} disabled={!serverStatus} className="text-nexus-danger hover:bg-nexus-danger/20 p-2 rounded transition disabled:opacity-50"><i data-lucide="trash-2" className="w-4 h-4"></i></button>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel rounded-2xl p-6 h-fit sticky top-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center justify-between"><span className={newUser.id ? 'text-orange-400' : 'text-nexus-success'}>{newUser.id ? 'ویرایش کاربر' : 'افزودن کاربر'}</span>{newUser.id && <button onClick={() => setNewUser({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '' })} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white transition">انصراف</button>}</h3>
                    <div className="space-y-4">
                        <NexusInput label="نام کاربری *" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} dir="ltr" disabled={!serverStatus} />
                        <NexusInput label={newUser.id ? "رمز عبور جدید (اختیاری)" : "رمز عبور *"} type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} dir="ltr" disabled={!serverStatus} placeholder={newUser.id ? "تغییر ندهید..." : ""} />
                        <div className="grid grid-cols-2 gap-3"><NexusInput label="نام و نام خانوادگی" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name: e.target.value})} disabled={!serverStatus} /><NexusInput label="شماره تماس" value={newUser.mobile} onChange={e=>setNewUser({...newUser, mobile: e.target.value})} dir="ltr" disabled={!serverStatus} /></div>
                        <div className="flex flex-col"><label className="text-gray-400 text-xs mb-1">سطح دسترسی</label><select value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} disabled={!serverStatus} className="nexus-input w-full px-3 py-2 text-sm"><option value="operator">اپراتور</option><option value="admin">مدیر</option></select></div>
                        <button onClick={handleSaveUser} disabled={!serverStatus} className={`w-full h-10 rounded-lg font-bold text-white mt-2 disabled:opacity-50 transition shadow-lg ${newUser.id ? 'bg-orange-500 hover:bg-orange-600' : 'bg-nexus-primary hover:bg-indigo-600'}`}>{newUser.id ? 'ذخیره تغییرات' : 'افزودن کاربر'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Management Page ---
const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    const [selectedType, setSelectedType] = useState(Object.keys(globalConfig)[0]);
    const [config, setConfig] = useState(globalConfig);
    const [newItems, setNewItems] = useState({});
    const [renameModal, setRenameModal] = useState({ open: false, type: '', oldVal: '', category: '', listName: '' });
    const [addCategoryModal, setAddCategoryModal] = useState(false);
    const notify = useNotify();
    const dialog = useDialog();
    useLucide([selectedType, config]);

    const listLabels = { 'packages': { label: 'پکیج‌ها', icon: 'box' }, 'techs': { label: 'تکنولوژی‌ها', icon: 'cpu' }, 'units': { label: 'واحدها', icon: 'ruler' }, 'paramOptions': { label: 'مقادیر پارامتر', icon: 'sliders' }, 'locations': { label: 'آدرس‌های انبار', icon: 'map-pin' } };

    const handleAddItem = (listName, value) => {
        if (!value || !value.trim()) return;
        const newConfig = { ...config };
        if (!newConfig[selectedType][listName]) newConfig[selectedType][listName] = [];
        if (!newConfig[selectedType][listName].includes(value)) {
            newConfig[selectedType][listName].push(value);
            setConfig(newConfig);
            setNewItems({ ...newItems, [listName]: '' });
        }
    };
    
    const handleDeleteItem = (listName, value) => {
        const newConfig = { ...config };
        newConfig[selectedType][listName] = newConfig[selectedType][listName].filter(item => item !== value);
        setConfig(newConfig);
    };

    const handleSave = async () => {
        const confirmed = await dialog.ask("ذخیره تنظیمات", "آیا از ذخیره تغییرات اطمینان دارید؟", "warning");
        if (confirmed) {
            try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: config }); if (ok) { onConfigUpdate(config); notify.show('موفقیت', "تنظیمات ذخیره شد.", 'success'); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); }
        }
    };

    // ... (Rename logic simplified for brevity but functional)
    const handleRenameSubmit = async (newVal) => {
        if (!newVal || newVal === renameModal.oldVal) return setRenameModal({ ...renameModal, open: false });
        try {
            const { ok } = await fetchAPI('/settings/rename', { method: 'POST', body: { mode: renameModal.type, oldVal: renameModal.oldVal, newVal, category: renameModal.category, listName: renameModal.listName } });
            if (ok) {
                notify.show('موفقیت', 'تغییر نام با موفقیت انجام شد.', 'success');
                const newConfig = { ...config };
                if (renameModal.type === 'category') {
                    newConfig[newVal] = newConfig[renameModal.oldVal]; delete newConfig[renameModal.oldVal];
                    newConfig[newVal].label = newVal;
                    setConfig(newConfig); onConfigUpdate(newConfig); setSelectedType(newVal);
                } else {
                    const list = newConfig[renameModal.category][renameModal.listName];
                    const idx = list.indexOf(renameModal.oldVal);
                    if (idx !== -1) list[idx] = newVal;
                    setConfig(newConfig); onConfigUpdate(newConfig);
                }
            }
        } catch (e) { notify.show('خطا', 'مشکل شبکه', 'error'); }
        setRenameModal({ ...renameModal, open: false });
    };

    const handleAddCategorySubmit = async (newVal) => {
        if (!newVal || config[newVal]) return setAddCategoryModal(false);
        const newConfig = { ...config, [newVal]: { label: newVal, icon: 'box', units: [], packages: [], techs: [], paramOptions: [], paramLabel: 'Parameter' }};
        try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig }); if (ok) { setConfig(newConfig); onConfigUpdate(newConfig); setSelectedType(newVal); notify.show('موفقیت', 'دسته جدید اضافه شد.', 'success'); } } catch(e){}
        setAddCategoryModal(false);
    };
    
    const listKeys = Object.keys(config[selectedType] || {}).filter(key => Array.isArray(config[selectedType][key]) && (selectedType === 'General' ? key === 'locations' : key !== 'locations'));

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <InputModal isOpen={renameModal.open} onClose={() => setRenameModal({ ...renameModal, open: false })} onConfirm={handleRenameSubmit} title="تغییر نام" label="نام جدید:" initialValue={renameModal.oldVal} />
            <InputModal isOpen={addCategoryModal} onClose={() => setAddCategoryModal(false)} onConfirm={handleAddCategorySubmit} title="افزودن دسته" label="نام انگلیسی:" initialValue="" />
            <header className="mb-8 flex justify-between items-center"><h2 className="text-2xl font-bold text-white">مدیریت لیست‌ها</h2><button onClick={handleSave} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><i data-lucide="save" className="w-4 h-4"></i> ذخیره تغییرات</button></header>
            <div className="glass-panel p-6 rounded-2xl mb-6">
                <div className="flex flex-col mb-6"><label className="text-nexus-accent text-sm mb-2 font-bold">انتخاب نوع قطعه:</label><div className="flex gap-2"><select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="nexus-input flex-1 px-3 py-2 text-sm font-bold text-yellow-400 bg-slate-900/80">{Object.keys(config).map(key => <option key={key} value={key}>{config[key].label}</option>)}</select><button onClick={() => setAddCategoryModal(true)} className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg"><i data-lucide="plus" className="w-5 h-5"></i></button>{selectedType !== 'General' && (<button onClick={() => setRenameModal({ open: true, type: 'category', oldVal: selectedType, category: selectedType })} className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><i data-lucide="pencil" className="w-5 h-5"></i></button>)}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{listKeys.map(listName => { const meta = listLabels[listName] || { label: listName, icon: 'list' }; return (<div key={listName} className="bg-white/5 p-4 rounded-xl border border-white/10"><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><i data-lucide={meta.icon} className="w-5 h-5 text-blue-400"></i> {meta.label}</h3><div className="flex gap-2 mb-4"><input className="nexus-input flex-1 px-3 py-2 text-sm" placeholder="آیتم جدید..." value={newItems[listName] || ''} onChange={(e) => setNewItems({...newItems, [listName]: e.target.value})} /><button onClick={() => handleAddItem(listName, newItems[listName])} className="bg-nexus-primary hover:bg-indigo-600 text-white p-2 rounded-lg"><i data-lucide="plus" className="w-5 h-5"></i></button></div><div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">{(config[selectedType][listName] || []).map(item => (<div key={item} className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5 group"><span className="text-sm text-gray-300 font-mono">{item}</span><div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity"><button onClick={() => setRenameModal({ open: true, type: 'item', oldVal: item, category: selectedType, listName })} className="text-blue-400"><i data-lucide="pencil" className="w-3.5 h-3.5"></i></button><button onClick={() => handleDeleteItem(listName, item)} className="text-red-400"><i data-lucide="trash-2" className="w-3.5 h-3.5"></i></button></div></div>))}</div></div>); })}</div>
            </div>
        </div>
    );
};

// --- Backup Page ---
const BackupPage = () => {
    const [backups, setBackups] = useState([]);
    const notify = useNotify();
    const dialog = useDialog();

    const loadBackups = useCallback(async () => { try { const { ok, data } = await fetchAPI('/backup/list'); if (ok) setBackups(data); } catch (e) {} }, []);
    useEffect(() => { loadBackups(); }, [loadBackups]);
    useLucide([backups]);

    const handleRestore = async (filename) => {
        if (await dialog.ask("بازگردانی بک‌آپ", `هشدار: با بازگردانی بک‌آپ، تمام اطلاعات فعلی جایگزین خواهند شد.\nآیا از بازگردانی فایل ${filename} مطمئن هستید؟`, "warning")) {
            try { const { ok, data } = await fetchAPI(`/backup/restore/${filename}`, { method: 'POST' }); if (ok) { notify.show('موفقیت', "دیتابیس بازیابی شد. لطفاً رفرش کنید.", 'success'); setTimeout(() => window.location.reload(), 3000); } else notify.show('خطا', data.error, 'error'); } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); }
        }
    };

    const handleDeleteBackup = async (filename) => {
        if (await dialog.ask("حذف بک‌آپ", `آیا از حذف ${filename} مطمئن هستید؟`, "danger")) {
            try { const { ok } = await fetchAPI(`/backup/delete/${filename}`, { method: 'DELETE' }); if (ok) { notify.show('موفقیت', "حذف شد.", 'success'); loadBackups(); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); }
        }
    };

    const handleCreateManualBackup = async () => {
        if (await dialog.ask("ایجاد بک‌آپ", "آیا نسخه پشتیبان جدید ایجاد شود؟", "info")) {
            try { const { ok, data } = await fetchAPI('/backup/create', { method: 'POST' }); if (ok) { notify.show('موفقیت', `نسخه ${data.filename} ایجاد شد.`, 'success'); loadBackups(); } } catch (e) {}
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <header className="mb-8 flex justify-between items-center"><h2 className="text-2xl font-bold text-white">مدیریت فایل‌های پشتیبان</h2><button onClick={handleCreateManualBackup} className="bg-nexus-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><i data-lucide="plus-circle" className="w-5 h-5"></i> ایجاد بک‌آپ جدید</button></header>
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="bg-black/20 rounded-xl p-4 min-h-[300px] overflow-y-auto custom-scroll space-y-3">
                    {backups.map((b, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl hover:bg-white/10 transition border border-white/5">
                            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><i data-lucide="database" className="w-5 h-5"></i></div><div className="flex flex-col"><span className="text-white font-bold text-sm ltr font-mono text-left">{b.name}</span><div className="flex gap-3 text-xs text-gray-400 mt-1"><span>{toShamsiDateTime(b.date)}</span><span>{b.size} KB</span></div></div></div>
                            <div className="flex gap-2"><button onClick={() => handleRestore(b.name)} className="bg-orange-500/10 text-orange-400 px-4 py-2 rounded-lg text-xs font-bold border border-orange-500/20">بازگردانی</button><button onClick={() => handleDeleteBackup(b.name)} className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-xs font-bold border border-red-500/20">حذف</button></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Export to global scope
window.UsersPage = UsersPage;
window.ManagementPage = ManagementPage;
window.BackupPage = BackupPage;