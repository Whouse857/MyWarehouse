// ====================================================================================================
// نسخه: 0.20
// فایل: admin_users.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل حاوی کامپوننت `UsersPage` است که برای مدیریت کاربران سیستم (CRUD) طراحی شده است.
// 
// وظایف اصلی:
// ۱. مشاهده لیست کاربران موجود و سطح دسترسی آن‌ها.
// ۲. افزودن کاربر جدید با نام کاربری، رمز عبور و مشخصات فردی.
// ۳. ویرایش کاربران موجود (تغییر نقش، بازنشانی دسترسی‌ها و اطلاعات).
// ۴. حذف کاربران (به جز ادمین اصلی).
// ۵. مدیریت دقیق سطوح دسترسی (Permissions) برای هر ماژول به صورت جداگانه.
//
// این ماژول از فایل یکپارچه قدیمی جدا شده تا امنیت و مدیریت کد بهتر شود.
// ====================================================================================================

// استخراج هوک‌های مورد نیاز از کتابخانه React
const { useState, useEffect, useCallback } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت صفحه مدیریت کاربران]
// ----------------------------------------------------------------------------------------------------
const UsersPage = ({ serverStatus }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // users: لیست کاربران دریافتی از سرور.
    // defaultPerms: آبجکت پیش‌فرض دسترسی‌ها (همه دسترسی‌ها در ابتدا غیرفعال هستند).
    // newUser: آبجکت نگهداری اطلاعات فرم (برای افزودن یا ویرایش کاربر).
    // ------------------------------------------------------------------------------------------------
    const [users, setUsers] = useState([]);
    
    const defaultPerms = {
        entry: false, withdraw: false, inventory: false, contacts: false,
        log: false, users: false, management: false, backup: false, server: false     
    };

    const [newUser, setNewUser] = useState({ 
        id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '', permissions: defaultPerms 
    });

    // هوک‌های اعلان و دیالوگ
    const notify = useNotify();
    const dialog = useDialog();

    // ------------------------------------------------------------------------------------------------
    // [تگ: بارگذاری کاربران]
    // دریافت لیست کاربران از API.
    // ------------------------------------------------------------------------------------------------
    const loadUsers = useCallback(async () => { 
        try { const { ok, data } = await fetchAPI('/users'); if(ok) setUsers(data); } catch(e){} 
    }, []);
    
    useEffect(() => { loadUsers(); }, [loadUsers]);
    
    // بروزرسانی آیکون‌ها پس از تغییر لیست کاربران
    // توجه: تابع useLucide باید در سطح گلوبال در دسترس باشد
    if (typeof useLucide === 'function') {
        useLucide([users, newUser.id]);
    }

    // ------------------------------------------------------------------------------------------------
    // [تگ: ذخیره کاربر]
    // ارسال اطلاعات فرم به سرور برای ایجاد یا آپدیت کاربر.
    // شامل اعتبارسنجی اولیه (نام کاربری و رمز عبور).
    // ------------------------------------------------------------------------------------------------
    const handleSaveUser = async () => {
        if(!newUser.username || (!newUser.id && !newUser.password)) 
            return notify.show('خطای اعتبارسنجی', "نام کاربری و رمز عبور (برای کاربر جدید) الزامی است.", 'error');
        try { 
            const { ok, data } = await fetchAPI('/users/save', { method: 'POST', body: newUser });
            if(ok) { 
                loadUsers(); 
                // ریست کردن فرم به حالت اولیه
                setNewUser({ id: null, username: '', password: '', role: 'operator', full_name: '', mobile: '', permissions: defaultPerms }); 
                notify.show('موفقیت', "اطلاعات کاربر با موفقیت ذخیره شد.", 'success'); 
            } else notify.show('خطا', data.error || "خطا در ذخیره کاربر", 'error'); 
        } catch(e) { notify.show('خطای سرور', "ارتباط با سرور برقرار نشد.", 'error'); }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: آماده‌سازی ویرایش]
    // پر کردن فرم با اطلاعات کاربر انتخاب شده.
    // نکته: رمز عبور خالی گذاشته می‌شود تا اگر کاربر نخواهد تغییر دهد، تغییری نکند.
    // دسترسی‌ها از فرمت JSON یا استرینگ پارس می‌شوند.
    // ------------------------------------------------------------------------------------------------
    const handleEditUser = (user) => { 
        let userPerms = user.permissions;
        if (typeof userPerms === 'string') { try { userPerms = JSON.parse(userPerms); } catch (e) { userPerms = {}; } }
        if (!userPerms || typeof userPerms !== 'object') userPerms = defaultPerms;
        else userPerms = { ...defaultPerms, ...userPerms };
        setNewUser({ ...user, password: '', permissions: userPerms }); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: حذف کاربر]
    // ارسال درخواست حذف به سرور پس از تایید کاربر.
    // ------------------------------------------------------------------------------------------------
    const handleDeleteUser = async (id) => { 
        if(await dialog.ask("حذف کاربر", "آیا از حذف این کاربر اطمینان دارید؟", "danger")) {
            try { const { ok } = await fetchAPI(`/users/delete/${id}`, { method: 'DELETE' }); if(ok) { loadUsers(); notify.show('حذف شد', 'کاربر حذف گردید.', 'success'); } } catch(e){} 
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر دسترسی]
    // تغییر وضعیت (Toggle) یک دسترسی خاص در آبجکت permissions.
    // ------------------------------------------------------------------------------------------------
    const togglePermission = (key) => {
        setNewUser(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
    };
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: وضعیت نمایشی کاربر]
    // تعیین برچسب و رنگ وضعیت کاربر بر اساس سطح دسترسی‌ها (ادمین، ارشد، عادی).
    // این تابع صرفاً جنبه بصری دارد.
    // ------------------------------------------------------------------------------------------------
    const getUserStatusBadge = (u) => {
        let perms = u.permissions;
        if (typeof perms === 'string') { try { perms = JSON.parse(perms); } catch(e){ perms = {}; } }
        const activePermsCount = perms && typeof perms === 'object' ? Object.values(perms).filter(v => v === true || v === 'true').length : 0;
        
        // شرط تشخیص ادمین کل: داشتن دسترسی به مدیریت کاربران، تنظیمات و بک‌آپ
        const isAdminAccess = perms?.users && perms?.management && perms?.backup;
        
        if (isAdminAccess) return { label: 'مدیر کل (Admin)', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        else if (activePermsCount > 4) return { label: 'کاربر ارشد', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
        else if (activePermsCount > 0) return { label: 'کاربر عادی', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
        return { label: 'بدون دسترسی', style: 'bg-red-500/20 text-red-300 border-red-500/30' };
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll">
            {/* هدر صفحه و آمار کلی */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div><h2 className="text-3xl font-black text-white tracking-tight">کاربران سیستم</h2><p className="text-gray-400 text-sm mt-1">مدیریت دسترسی‌ها</p></div>
                <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-nexus-primary/20 flex items-center justify-center text-nexus-primary"><i data-lucide="users" className="w-5 h-5"></i></div><div className="flex flex-col"><span className="text-[10px] text-gray-400">تعداد کل</span><span className="text-white font-bold text-lg">{users.length} کاربر</span></div></div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* ------------------------------------------------------------------------------ */}
                {/* [تگ: لیست کاربران]                                                              */}
                {/* ستون سمت راست: نمایش کارت‌های کاربران موجود                                     */}
                {/* ------------------------------------------------------------------------------ */}
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
                                {/* نمایش برچسب‌های دسترسی فعال */}
                                <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                                    {Object.entries(displayPerms || {}).filter(([k,v]) => v === true || v === 'true').length > 0 ? Object.entries(displayPerms || {}).filter(([k,v]) => v === true || v === 'true').map(([k, v]) => (
                                        <span key={k} className={`px-2.5 py-1 rounded-md text-[10px] font-medium border ${['users','management','backup'].includes(k) ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-blue-500/5 text-blue-200 border-blue-500/10'}`}>{k}</span>
                                    )) : <span className="text-[10px] text-gray-500 flex items-center gap-1"><i data-lucide="lock" className="w-3 h-3"></i> بدون دسترسی ویژه</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ------------------------------------------------------------------------------ */}
                {/* [تگ: فرم کاربر]                                                                 */}
                {/* ستون سمت چپ: فرم شناور برای افزودن یا ویرایش کاربر                              */}
                {/* ------------------------------------------------------------------------------ */}
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
                                    
                                    {/* بخش چک‌باکس‌های دسترسی */}
                                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5">
                                        <h4 className="text-xs font-bold text-nexus-accent mb-4 flex items-center gap-2 uppercase tracking-wider"><i data-lucide="shield-check" className="w-4 h-4"></i> سطوح دسترسی</h4>
                                        <div className="space-y-5">
                                            {/* دسترسی‌های عمومی */}
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
                                            {/* دسترسی‌های مدیریتی (قرمز) */}
                                            <div className="pt-4 border-t border-white/10 relative">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f172a] px-2 text-[10px] text-red-400/80 font-bold uppercase border border-red-500/20 rounded-full">مدیریت</div>
                                                <div className="grid grid-cols-1 gap-2 mt-2">
                                                    {[{ k: 'users', l: 'مدیریت کاربران' }, { k: 'management', l: 'تنظیمات پایه' }, { k: 'backup', l: 'دیتابیس و بک‌آپ' }, { k: 'server', l: 'تنظیمات سرور' }].map(p => {
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
                                    <button onClick={handleSaveUser} className={`w-full py-4 rounded-2xl font-black text-white text-sm shadow-xl transition-all flex items-center justify-center gap-3 ${newUser.id ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-nexus-primary to-purple-600'}`}>{newUser.id ? 'ذخیره تغییرات' : 'ثبت کاربر جدید'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: اتصال به فضای جهانی]
// ----------------------------------------------------------------------------------------------------
window.UsersPage = UsersPage;