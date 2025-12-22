// [TAG: PAGE_ADMIN]
// صفحات مربوط به مدیریت سیستم (کاربران، تنظیمات، بک‌آپ)
// نسخه نهایی: حفظ ظاهر و منطق Drag & Drop با اصلاح مشکل لود نشدن داده‌ها

const { useState, useEffect, useCallback, useRef } = React;

// --- Users Page (Re-designed) ---
const UsersPage = ({ serverStatus }) => {
    const [users, setUsers] = useState([]);
    
    const defaultPerms = {
        entry: false, withdraw: false, inventory: false, contacts: false,
        log: false, users: false, management: false, backup: false     
    };

    const [newUser, setNewUser] = useState({ 
        id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '', permissions: defaultPerms 
    });

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
                setNewUser({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '', permissions: defaultPerms }); 
                notify.show('موفقیت', "اطلاعات کاربر با موفقیت ذخیره شد.", 'success'); 
            } else notify.show('خطا', data.error || "خطا در ذخیره کاربر", 'error'); 
        } catch(e) { notify.show('خطای سرور', "ارتباط با سرور برقرار نشد.", 'error'); }
    };

    const handleEditUser = (user) => { 
        let userPerms = user.permissions;
        if (typeof userPerms === 'string') { try { userPerms = JSON.parse(userPerms); } catch (e) { userPerms = {}; } }
        if (!userPerms || typeof userPerms !== 'object') userPerms = defaultPerms;
        else userPerms = { ...defaultPerms, ...userPerms };
        setNewUser({ ...user, password: '', permissions: userPerms }); 
    };

    const handleDeleteUser = async (id) => { 
        if(await dialog.ask("حذف کاربر", "آیا از حذف این کاربر اطمینان دارید؟", "danger")) {
            try { const { ok } = await fetchAPI(`/users/delete/${id}`, { method: 'DELETE' }); if(ok) { loadUsers(); notify.show('حذف شد', 'کاربر حذف گردید.', 'success'); } } catch(e){} 
        }
    };

    const togglePermission = (key) => {
        setNewUser(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
    };
    
    const getUserStatusBadge = (u) => {
        let perms = u.permissions;
        if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch(e){ perms = {}; } }
        const activePermsCount = perms && typeof perms === 'object' ? Object.values(perms).filter(v => v === true || v === 'true').length : 0;
        const isAdminAccess = perms?.users && perms?.management && perms?.backup;
        if (isAdminAccess) return { label: 'مدیر کل (Admin)', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        else if (activePermsCount > 4) return { label: 'کاربر ارشد', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
        else if (activePermsCount > 0) return { label: 'کاربر عادی', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
        return { label: 'بدون دسترسی', style: 'bg-red-500/20 text-red-300 border-red-500/30' };
    };

    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div><h2 className="text-3xl font-black text-white tracking-tight">کاربران سیستم</h2><p className="text-gray-400 text-sm mt-1">مدیریت دسترسی‌ها</p></div>
                <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-nexus-primary/20 flex items-center justify-center text-nexus-primary"><i data-lucide="users" className="w-5 h-5"></i></div><div className="flex flex-col"><span className="text-[10px] text-gray-400">تعداد کل</span><span className="text-white font-bold text-lg">{users.length} کاربر</span></div></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-7 space-y-4">
                    {users.length === 0 && <div className="text-center py-10 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/5">کاربری یافت نشد.</div>}
                    {users.map(u => {
                        const badge = getUserStatusBadge(u);
                        const isEditing = newUser.id === u.id;
                        const isSuperAdmin = u.username === 'admin'; 
                        let displayPerms = u.permissions;
                        if (typeof displayPerms === 'string') { try { displayPerms = JSON.parse(displayPerms); } catch(e){ displayPerms = {}; } }
                        return (
                            <div key={u.id} className={`group relative overflow-hidden glass-panel p-5 rounded-3xl border transition-all duration-300 ${isEditing ? 'border-nexus-primary bg-nexus-primary/5' : 'border-white/5 hover:border-nexus-primary/30 hover:shadow-lg hover:-translate-y-1'}`}>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-12 -mt-12 opacity-30 pointer-events-none"></div>
                                <div className="relative z-10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-inner border border-white/10 ${isSuperAdmin ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-gradient-to-br from-slate-700 to-slate-800'}`}>{u.username.charAt(0).toUpperCase()}</div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3"><h3 className="text-xl font-bold text-white">{u.username}</h3><span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${badge.style}`}>{badge.label}</span></div>
                                            <div className="flex flex-col gap-1 text-xs text-gray-400 mt-1">{u.full_name && <span className="flex items-center gap-1.5"><i data-lucide="user" className="w-3.5 h-3.5 opacity-70"></i> {u.full_name}</span>}{!u.full_name && <span className="italic opacity-40">بدون نام</span>}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-2">
                                        <button onClick={() => handleEditUser(u)} disabled={!serverStatus} className={`p-3 rounded-xl transition-all shadow-lg flex items-center justify-center ${isEditing ? 'bg-nexus-primary text-white' : 'bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white'}`}><i data-lucide={isEditing ? "edit-3" : "pencil"} className="w-5 h-5"></i></button>
                                        {!isSuperAdmin && <button onClick={() => handleDeleteUser(u.id)} disabled={!serverStatus} className="p-3 rounded-xl bg-white/5 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg"><i data-lucide="trash-2" className="w-5 h-5"></i></button>}
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                    {Object.entries(displayPerms || {}).filter(([k,v]) => v === true || v === 'true').length > 0 ? Object.entries(displayPerms || {}).filter(([k,v]) => v === true || v === 'true').map(([k, v]) => (
                                        <span key={k} className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${['users','management','backup'].includes(k) ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-blue-500/5 text-blue-200 border-blue-500/10'}`}>{k}</span>
                                    )) : <span className="text-[10px] text-gray-500 flex items-center gap-1"><i data-lucide="lock" className="w-3 h-3"></i> بدون دسترسی ویژه</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="xl:col-span-5 relative">
                    <div className="sticky top-6">
                        <div className="glass-panel p-1 rounded-[2.5rem] border border-white/10 shadow-2xl relative bg-gradient-to-b from-white/10 to-transparent">
                            <div className="bg-[#0f172a]/90 backdrop-blur-xl rounded-[2.3rem] p-6 sm:p-8 border border-white/5 h-full">
                                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                                    <h3 className="text-xl font-black text-white flex items-center gap-3">{newUser.id ? <><span className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400"><i data-lucide="user-cog" className="w-6 h-6"></i></span> ویرایش</> : <><span className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><i data-lucide="user-plus" className="w-6 h-6"></i></span> جدید</>}</h3>
                                    {newUser.id && <button onClick={() => setNewUser({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '', permissions: defaultPerms })} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1"><i data-lucide="x" className="w-3 h-3"></i> انصراف</button>}
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <NexusInput label="نام کاربری *" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} dir="ltr" disabled={!serverStatus} className="text-center font-bold tracking-wide text-nexus-accent" />
                                        <NexusInput label={newUser.id ? "تغییر رمز" : "رمز عبور *"} type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} dir="ltr" disabled={!serverStatus} className="text-center font-mono" />
                                    </div>
                                    <div className="space-y-4">
                                        <NexusInput label="نام کامل" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name: e.target.value})} disabled={!serverStatus} />
                                        <NexusInput label="موبایل" value={newUser.mobile} onChange={e=>setNewUser({...newUser, mobile: e.target.value})} dir="ltr" disabled={!serverStatus} className="font-mono text-left" />
                                    </div>
                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                        <h4 className="text-xs font-bold text-nexus-accent mb-4 flex items-center gap-2 uppercase tracking-wider"><i data-lucide="shield-check" className="w-4 h-4"></i> سطوح دسترسی</h4>
                                        <div className="space-y-5">
                                            <div className="grid grid-cols-2 gap-2">
                                                {[{ k: 'entry', l: 'ورود کالا' }, { k: 'withdraw', l: 'خروج کالا' }, { k: 'inventory', l: 'موجودی' }, { k: 'contacts', l: 'فروشندگان' }, { k: 'log', l: 'لاگ سیستم' }].map(p => {
                                                    const active = !!newUser.permissions?.[p.k];
                                                    return (
                                                        <label key={p.k} className={`cursor-pointer group flex items-center gap-3 p-3 rounded-2xl transition-all border ${active ? 'bg-nexus-primary/20 border-nexus-primary/50' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}>
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${active ? 'bg-nexus-primary border-transparent text-white' : 'border-gray-600/50 text-transparent'}`}><i data-lucide="check" className="w-3.5 h-3.5 stroke-[4]"></i></div>
                                                            <input type="checkbox" className="hidden" checked={active} onChange={() => togglePermission(p.k)} />
                                                            <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-500'}`}>{p.l}</span>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                            <div className="pt-4 border-t border-white/10 relative">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] px-2 text-[10px] text-red-400/80 font-bold uppercase border border-red-500/20 rounded-full">مدیریت</div>
                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                    {[{ k: 'users', l: 'مدیریت کاربران' }, { k: 'management', l: 'تنظیمات پایه' }, { k: 'backup', l: 'دیتابیس و بک‌آپ' }].map(p => {
                                                        const active = !!newUser.permissions?.[p.k];
                                                        return (
                                                            <label key={p.k} className={`cursor-pointer group flex items-center gap-3 p-3 rounded-2xl transition-all border ${active ? 'bg-red-500/10 border-red-500/40' : 'bg-red-500/5 border-transparent hover:bg-red-500/10'}`}>
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${active ? 'bg-red-500 border-transparent text-white' : 'border-red-900/30 text-transparent'}`}><i data-lucide="check" className="w-3.5 h-3.5 stroke-[4]"></i></div>
                                                                <input type="checkbox" className="hidden" checked={active} onChange={() => togglePermission(p.k)} />
                                                                <span className={`text-xs font-bold ${active ? 'text-red-100' : 'text-red-400/60'}`}>{p.l}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveUser} disabled={!serverStatus} className={`w-full py-4 rounded-2xl font-black text-white text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${newUser.id ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-nexus-primary to-purple-600'}`}>{newUser.id ? 'ذخیره تغییرات' : 'ثبت کاربر جدید'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Management Page (Sortable + Delete Category + SERVER SYNC FIX) ---
const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    const [sortedKeys, setSortedKeys] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    // استفاده از یک state داخلی برای config که با props سینک می‌شود
    const [config, setConfig] = useState(globalConfig || {});
    const [newItems, setNewItems] = useState({});
    const [renameModal, setRenameModal] = useState({ open: false, type: '', oldVal: '', category: '', listName: '' });
    const [addCategoryModal, setAddCategoryModal] = useState(false);
    const dragItem = useRef();
    const dragOverItem = useRef();

    const notify = useNotify();
    const dialog = useDialog();
    useLucide([selectedType, config, sortedKeys]); 

    // --- FIX: Sync with Server Data ---
    // این افکت باعث می‌شود وقتی داده‌ها از سرور لود شدند، لیست‌ها پر شوند
    useEffect(() => {
        if (globalConfig && Object.keys(globalConfig).length > 0) {
            setConfig(globalConfig);
            const keys = Object.keys(globalConfig);
            const sorted = keys.sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0));
            setSortedKeys(sorted);
            // فقط اگر هنوز انتخابی نداریم، اولی را انتخاب کن
            if (!selectedType && sorted.length > 0) setSelectedType(sorted[0]);
        }
    }, [globalConfig]); // وابسته به globalConfig

    const handleDragStart = (e, position) => { dragItem.current = position; e.target.classList.add('opacity-50'); };
    const handleDragEnter = (e, position) => { dragOverItem.current = position; const copyListItems = [...sortedKeys]; const dragItemContent = copyListItems[dragItem.current]; copyListItems.splice(dragItem.current, 1); copyListItems.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = position; setSortedKeys(copyListItems); };
    const handleDragEnd = (e) => { e.target.classList.remove('opacity-50'); dragItem.current = null; dragOverItem.current = null; const newConfig = { ...config }; sortedKeys.forEach((key, index) => { if (newConfig[key]) newConfig[key].priority = sortedKeys.length - index; }); setConfig(newConfig); };

    const listLabels = { 'packages': { label: 'پکیج‌ها', icon: 'box' }, 'techs': { label: 'تکنولوژی‌ها', icon: 'cpu' }, 'units': { label: 'واحدها', icon: 'ruler' }, 'paramOptions': { label: 'مقادیر پارامتر', icon: 'sliders' }, 'locations': { label: 'آدرس‌های انبار', icon: 'map-pin' } };

    const handleAddItem = (listName, value) => {
        if (!value || !value.trim()) return;
        const newConfig = { ...config };
        if (!newConfig[selectedType][listName]) newConfig[selectedType][listName] = [];
        if (!newConfig[selectedType][listName].includes(value)) { newConfig[selectedType][listName].push(value); setConfig(newConfig); setNewItems({ ...newItems, [listName]: '' }); }
    };
    
    const handleDeleteItem = (listName, value) => { const newConfig = { ...config }; newConfig[selectedType][listName] = newConfig[selectedType][listName].filter(item => item !== value); setConfig(newConfig); };

    const handleSave = async () => {
        if (await dialog.ask("ذخیره تنظیمات", "آیا از ذخیره تغییرات اطمینان دارید؟", "warning")) {
            try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: config }); if (ok) { onConfigUpdate(config); notify.show('موفقیت', "تنظیمات ذخیره شد.", 'success'); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); }
        }
    };

    const handleDeleteCategory = async (keyToDelete) => {
        if (keyToDelete === 'General') return notify.show('خطا', 'حذف تنظیمات عمومی مجاز نیست.', 'error');
        if (await dialog.ask("حذف دسته", `آیا از حذف دسته‌بندی "${config[keyToDelete].label}" اطمینان دارید؟`, "danger")) {
            try {
                const newConfig = { ...config }; delete newConfig[keyToDelete];
                const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig });
                if (ok) { setConfig(newConfig); setSortedKeys(sortedKeys.filter(k => k !== keyToDelete)); if (selectedType === keyToDelete) setSelectedType(sortedKeys[0]); onConfigUpdate(newConfig); notify.show('موفقیت', 'حذف شد.', 'success'); }
            } catch (e) { notify.show('خطا', 'مشکل سرور', 'error'); }
        }
    };

    const handleRenameSubmit = async (newVal) => {
        if (!newVal || newVal === renameModal.oldVal) return setRenameModal({ ...renameModal, open: false });
        try {
            const { ok } = await fetchAPI('/settings/rename', { method: 'POST', body: { mode: renameModal.type, oldVal: renameModal.oldVal, newVal, category: renameModal.category, listName: renameModal.listName } });
            if (ok) {
                notify.show('موفقیت', 'تغییر نام انجام شد.', 'success');
                const newConfig = { ...config };
                if (renameModal.type === 'category') {
                    const priority = newConfig[renameModal.oldVal].priority; newConfig[newVal] = newConfig[renameModal.oldVal]; delete newConfig[renameModal.oldVal];
                    newConfig[newVal].label = newVal; newConfig[newVal].priority = priority;
                    const newSorted = sortedKeys.map(k => k === renameModal.oldVal ? newVal : k);
                    setSortedKeys(newSorted); setConfig(newConfig); onConfigUpdate(newConfig); setSelectedType(newVal);
                } else {
                    const list = newConfig[renameModal.category][renameModal.listName]; const idx = list.indexOf(renameModal.oldVal); if (idx !== -1) list[idx] = newVal;
                    setConfig(newConfig); onConfigUpdate(newConfig);
                }
            }
        } catch (e) { notify.show('خطا', 'مشکل شبکه', 'error'); }
        setRenameModal({ ...renameModal, open: false });
    };

    const handleAddCategorySubmit = async (newVal) => {
        if (!newVal || config[newVal]) return setAddCategoryModal(false);
        const newConfig = { ...config, [newVal]: { label: newVal, icon: 'box', units: [], packages: [], techs: [], paramOptions: [], paramLabel: 'Parameter', priority: 0 }};
        try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig }); if (ok) { setConfig(newConfig); onConfigUpdate(newConfig); setSortedKeys([...sortedKeys, newVal]); setSelectedType(newVal); notify.show('موفقیت', 'اضافه شد.', 'success'); } } catch(e){}
        setAddCategoryModal(false);
    };
    
    // دریافت لیست‌های موجود برای دسته انتخاب شده
    const listKeys = selectedType && config[selectedType] ? Object.keys(config[selectedType]).filter(key => Array.isArray(config[selectedType][key]) && (selectedType === 'General' ? key === 'locations' : key !== 'locations')) : [];

    return (
        <div className="flex-1 p-6 overflow-hidden h-full flex flex-col">
            <InputModal isOpen={renameModal.open} onClose={() => setRenameModal({ ...renameModal, open: false })} onConfirm={handleRenameSubmit} title="تغییر نام" label="نام جدید:" initialValue={renameModal.oldVal} />
            <InputModal isOpen={addCategoryModal} onClose={() => setAddCategoryModal(false)} onConfirm={handleAddCategorySubmit} title="افزودن دسته" label="نام انگلیسی:" initialValue="" />
            
            <header className="h-16 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white">مدیریت لیست‌ها و دسته‌بندی‌ها</h2>
                <button onClick={handleSave} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition"><i data-lucide="save" className="w-4 h-4"></i> ذخیره همه تغییرات</button>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 md:col-span-4 lg:col-span-3 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center"><span className="text-sm font-bold text-gray-300">ترتیب دسته‌ها</span><button onClick={() => setAddCategoryModal(true)} className="text-xs bg-nexus-primary hover:bg-indigo-600 text-white px-2 py-1 rounded transition flex items-center gap-1"><i data-lucide="plus" className="w-3 h-3"></i> افزودن</button></div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
                        {sortedKeys.map((key, index) => (
                            <div key={key} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={() => setSelectedType(key)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedType === key ? 'bg-nexus-primary/20 border-nexus-primary text-white' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                                <div className="flex items-center gap-3"><div className="cursor-grab text-gray-600 hover:text-gray-400 p-1"><i data-lucide="grip-vertical" className="w-4 h-4"></i></div><span className="font-bold text-sm truncate max-w-[120px]">{config[key].label}</span></div>
                                {key !== 'General' && <div className="flex items-center gap-1"><button onClick={(e) => { e.stopPropagation(); setRenameModal({ open: true, type: 'category', oldVal: key, category: key }); }} className="text-blue-400 p-1.5"><i data-lucide="pencil" className="w-3.5 h-3.5"></i></button><button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(key); }} className="text-red-400 p-1.5"><i data-lucide="trash-2" className="w-3.5 h-3.5"></i></button></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 md:col-span-8 lg:col-span-9 glass-panel rounded-2xl border border-white/10 p-6 overflow-y-auto custom-scroll">
                    {selectedType && config[selectedType] ? (
                        <>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                <div className="w-12 h-12 rounded-xl bg-nexus-primary/20 flex items-center justify-center text-nexus-primary"><i data-lucide={config[selectedType].icon || 'box'} className="w-6 h-6"></i></div>
                                <div><h3 className="text-xl font-bold text-white">{config[selectedType].label}</h3><p className="text-xs text-gray-500">ویرایش لیست‌های زیرمجموعه</p></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {listKeys.map(listName => { 
                                    const meta = listLabels[listName] || { label: listName, icon: 'list' }; 
                                    return (
                                        <div key={listName} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition">
                                            <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2"><i data-lucide={meta.icon} className="w-4 h-4 text-nexus-accent"></i> {meta.label}</h3>
                                            <div className="flex gap-2 mb-3">
                                                <input className="nexus-input flex-1 px-3 py-1.5 text-xs" placeholder="آیتم جدید..." value={newItems[listName] || ''} onChange={(e) => setNewItems({...newItems, [listName]: e.target.value})} />
                                                <button onClick={() => handleAddItem(listName, newItems[listName])} className="bg-nexus-primary hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg"><i data-lucide="plus" className="w-4 h-4"></i></button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scroll">
                                                {(config[selectedType][listName] || []).map(item => (
                                                    <div key={item} className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 group hover:bg-white/10 transition">
                                                        <span className="text-xs text-gray-300 font-mono">{item}</span>
                                                        <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setRenameModal({ open: true, type: 'item', oldVal: item, category: selectedType, listName })} className="text-blue-400 hover:text-blue-300"><i data-lucide="pencil" className="w-3 h-3"></i></button>
                                                            <button onClick={() => handleDeleteItem(listName, item)} className="text-red-400 hover:text-red-300"><i data-lucide="trash-2" className="w-3 h-3"></i></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(config[selectedType][listName] || []).length === 0 && <span className="text-[10px] text-gray-600 italic">لیست خالی است</span>}
                                            </div>
                                        </div>
                                    ); 
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500"><i data-lucide="layout-grid" className="w-16 h-16 mb-4 opacity-20"></i><p>لطفاً یک دسته‌بندی را از لیست سمت راست انتخاب کنید.</p></div>
                    )}
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

    const loadBackups = useCallback(async () => { try { const { ok, data } = await fetchAPI('/backup/list'); if (ok) setBackups(data); } catch (e) {} }, []);
    useEffect(() => { loadBackups(); }, [loadBackups]);
    useLucide([backups]);

    const handleCreate = async () => { const { ok, data } = await fetchAPI('/backup/create', { method: 'POST' }); if (ok) { notify.show('موفقیت', 'بک‌آپ گرفته شد', 'success'); loadBackups(); } else notify.show('خطا', data.error, 'error'); };
    const handleRestore = async (name) => { if (await dialog.ask('بازگردانی', `آیا دیتابیس با ${name} جایگزین شود؟`, 'danger')) { const { ok, data } = await fetchAPI(`/backup/restore/${name}`, { method: 'POST' }); if (ok) { notify.show('موفقیت', 'بازگردانی شد. رفرش...', 'success'); setTimeout(() => window.location.reload(), 2000); } else notify.show('خطا', data.error, 'error'); } };
    const handleDelete = async (name) => { if (await dialog.ask('حذف', `حذف فایل ${name}؟`, 'warning')) { const { ok } = await fetchAPI(`/backup/delete/${name}`, { method: 'DELETE' }); if (ok) loadBackups(); } };

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <header className="mb-6 flex justify-between items-center"><h2 className="text-2xl font-bold text-white flex items-center gap-2"><i data-lucide="database" className="text-nexus-primary"></i>مدیریت فایل‌های پشتیبان</h2><button onClick={handleCreate} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg transition flex items-center gap-2"><i data-lucide="plus-circle" className="w-5 h-5"></i>ایجاد نسخه پشتیبان</button></header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scroll pb-10">
                {backups.map((b, i) => (
                    <div key={i} className="glass-panel border border-white/5 p-4 rounded-xl flex flex-col gap-3 group hover:border-nexus-primary/30 transition">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400"><i data-lucide="file-clock" className="w-5 h-5"></i></div><div className="flex-1 min-w-0"><h4 className="text-sm font-bold text-white truncate" dir="ltr">{b.name}</h4><span className="text-[10px] text-gray-500 font-mono">{b.date} | {b.size} KB</span></div></div>
                        <div className="flex gap-2 mt-2"><button onClick={() => handleRestore(b.name)} className="flex-1 py-1.5 bg-white/5 hover:bg-nexus-warning hover:text-black text-nexus-warning border border-nexus-warning/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"><i data-lucide="rotate-ccw" className="w-3 h-3"></i>بازگردانی</button><button onClick={() => handleDelete(b.name)} className="px-3 py-1.5 bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 border border-white/5 rounded-lg transition"><i data-lucide="trash-2" className="w-4 h-4"></i></button></div>
                    </div>
                ))}
                {backups.length === 0 && <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-50"><i data-lucide="database-backup" className="w-16 h-16 mb-4"></i><p>هیچ فایل پشتیبانی یافت نشد.</p></div>}
            </div>
        </div>
    );
};

// Export to global scope
window.UsersPage = UsersPage;
window.ManagementPage = ManagementPage;
window.BackupPage = BackupPage;