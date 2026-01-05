// ====================================================================================================
// نسخه: 0.26
// فایل: Contacts Page.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل فقط شامل کدهای JSX و رابط کاربری صفحه مدیریت تامین‌کنندگان است.
// تمام منطق از طریق هوک useContactsLogic دریافت می‌شود.
// ====================================================================================================

const { useEffect } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت اصلی ContactsPage]
// ----------------------------------------------------------------------------------------------------
const ContactsPage = ({ serverStatus }) => {
    // بررسی بارگذاری فایل منطق (Safety Check)
    if (!window.useContactsLogic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <i data-lucide="loader-2" className="w-10 h-10 animate-spin text-nexus-primary"></i>
                <span className="text-gray-400 font-bold">در حال بارگذاری ماژول مخاطبین...</span>
            </div>
        );
    }

    // اتصال به لایه منطق
    const {
        newContact, setNewContact,
        errors, setErrors,
        searchTerm, setSearchTerm,
        copyFeedback,
        filteredContacts,
        handleSave,
        handleDelete,
        handleEdit,
        handleChange,
        copyToClipboard,
        preventNonNumeric
    } = window.useContactsLogic(serverStatus);

    // هوک UI برای رفرش آیکون‌ها
    useLucide([filteredContacts.length, newContact.id, errors, searchTerm, copyFeedback]);

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full relative">
            {/* فیدبک کپی شدن */}
            {copyFeedback && (
                <div className="fixed z-[9999] pointer-events-none bg-nexus-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-white/20 animate-zoom-in flex items-center gap-1" style={{ top: copyFeedback.y + 15, left: copyFeedback.x + 15 }}>
                    <i data-lucide="check" className="w-3 h-3"></i> کپی شد!
                </div>
            )}

            {/* هدر صفحه */}
            <header className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between mb-4">
                <div><h2 className="text-2xl font-black text-white flex items-center gap-3"><i data-lucide="contact-2" className="text-nexus-primary w-6 h-6"></i>مدیریت تامین‌کنندگان</h2><p className="text-gray-400 text-xs mt-1">لیست دفترچه تلفن و آدرس‌های خرید</p></div>
                <div className="w-64 relative"><i data-lucide="search" className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"></i><input className="nexus-input w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-black/20 focus:bg-black/40 border-white/10" placeholder="جستجو در مخاطبین..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            </header>

            {/* محتوای اصلی دو ستونه */}
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-0">
                
                {/* ستون راست: لیست کارت‌ها */}
                <div className="xl:col-span-8 overflow-y-auto custom-scroll pr-2 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredContacts.length === 0 && <div className="col-span-full py-20 text-gray-500 bg-white/5 rounded-3xl border border-dashed border-white/5 text-center">مخاطبی یافت نشد.</div>}
                        {filteredContacts.map(c => {
                            const isEditing = newContact.id === c.id;
                            return (
                                <div key={c.id} className={`glass-panel p-5 rounded-3xl border transition-all duration-300 group relative overflow-hidden flex flex-col gap-3 contact-card ${isEditing ? 'border-nexus-primary bg-nexus-primary/5 ring-1 ring-nexus-primary/30' : 'border-white/5 hover:border-white/20'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-white/10 shadow-inner">{c.name.charAt(0).toUpperCase()}</div>
                                            <div><h3 className="font-bold text-white text-base truncate max-w-[200px]" title={c.name}>{c.name}</h3>{c.website && <a href={c.website} target="_blank" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"><i data-lucide="globe" className="w-3 h-3"></i> وب‌سایت</a>}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(c)} className={`p-2 rounded-xl transition-colors ${isEditing ? 'bg-amber-500 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'}`}><i data-lucide="pencil" className="w-4 h-4"></i></button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5 w-full"></div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        {c.mobile && <div onClick={(e) => copyToClipboard(e, c.mobile)} className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-black/40 transition group/item hover:border-nexus-primary/30"><div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i data-lucide="smartphone" className="w-3 h-3"></i></div><span className="font-mono text-gray-300 group-hover/item:text-white transition-colors">{c.mobile}</span></div>}
                                        {c.phone && <div onClick={(e) => copyToClipboard(e, c.phone)} className="bg-black/20 p-2 rounded-xl border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-black/40 transition group/item hover:border-nexus-primary/30"><div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400"><i data-lucide="phone" className="w-3 h-3"></i></div><span className="font-mono text-gray-300 group-hover/item:text-white transition-colors">{c.phone}</span></div>}
                                        {c.fax && <div className="col-span-2 bg-black/10 p-2 rounded-xl border border-white/5 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-400"><i data-lucide="printer" className="w-3 h-3"></i></div><span className="text-[10px] text-gray-400">فکس: </span><span className="font-mono text-gray-300">{c.fax}</span></div>}
                                    </div>
                                    <div className="space-y-2">
                                        {c.email && <div onClick={(e) => copyToClipboard(e, c.email)} className="flex items-center gap-2 text-xs text-gray-400 hover:text-white cursor-pointer transition p-1 rounded hover:bg-white/5 hover:text-nexus-primary"><i data-lucide="mail" className="w-3.5 h-3.5 text-orange-400"></i><span className="font-mono truncate">{c.email}</span></div>}
                                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-white/5 p-2 rounded-xl"><i data-lucide="map-pin" className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0"></i><span className="leading-relaxed">{c.address}</span></div>
                                    </div>
                                    {c.notes && <div className="mt-auto pt-2 border-t border-dashed border-white/10 flex items-start gap-2"><i data-lucide="sticky-note" className="w-3 h-3 text-gray-500 mt-1 shrink-0"></i><p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{c.notes}</p></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ستون چپ: فرم ثبت/ویرایش */}
                <div className="xl:col-span-4 h-full overflow-y-auto custom-scroll">
                    <div className="glass-panel border border-white/10 rounded-2xl p-5 shadow-2xl relative bg-gradient-to-b from-white/5 to-[#020617] animate-fade-in">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 sticky top-0 bg-[#0f172a]/95 backdrop-blur z-10 -mx-5 px-5 -mt-5 pt-5 rounded-t-2xl"><h3 className="text-lg font-bold text-white flex items-center gap-2">{newContact.id ? <><i data-lucide="user-cog" className="text-nexus-accent w-5 h-5"></i> <span className="text-orange-100">ویرایش مخاطب</span></> : <><i data-lucide="user-plus" className="text-emerald-400 w-5 h-5"></i> <span className="text-emerald-100">افزودن مخاطب</span></>}</h3>{newContact.id && <button onClick={() => { setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); setErrors({}); }} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition">انصراف</button>}</div>
                        <div className="space-y-4">
                            <NexusInput label="نام شرکت / شخص *" value={newContact.name} onChange={e => handleChange('name', e.target.value)} disabled={!serverStatus} error={errors.name} placeholder="فروشگاه قطعات..." />
                            <div className="grid grid-cols-2 gap-3">
                                <NexusInput label="موبایل *" dir="ltr" maxLength={11} onKeyPress={preventNonNumeric} value={newContact.mobile} onChange={e => handleChange('mobile', e.target.value)} disabled={!serverStatus} error={errors.mobile} placeholder="09..." />
                                <NexusInput label="تلفن *" dir="ltr" maxLength={11} onKeyPress={preventNonNumeric} value={newContact.phone} onChange={e => handleChange('phone', e.target.value)} disabled={!serverStatus} error={errors.phone} placeholder="021..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3"><NexusInput label="فکس" dir="ltr" value={newContact.fax} onChange={e => handleChange('fax', e.target.value)} disabled={!serverStatus} /><NexusInput label="وب‌سایت" dir="ltr" value={newContact.website} onChange={e => handleChange('website', e.target.value)} disabled={!serverStatus} placeholder="example.com" /></div>
                            <NexusInput label="ایمیل" dir="ltr" value={newContact.email} onChange={e => handleChange('email', e.target.value)} disabled={!serverStatus} placeholder="info@example.com" />
                            <NexusInput label="آدرس دقیق *" value={newContact.address} onChange={e => handleChange('address', e.target.value)} disabled={!serverStatus} error={errors.address} placeholder="شهر، خیابان..." />
                            <div className="flex flex-col"><label className="text-xs mb-1 block font-medium text-gray-400">توضیحات تکمیلی</label><textarea className="nexus-input w-full px-3 py-2 text-sm min-h-[80px] resize-none bg-black/20 border-white/10 rounded-lg focus:border-nexus-primary/50" value={newContact.notes} onChange={e => handleChange('notes', e.target.value)} disabled={!serverStatus} /></div>
                            <button onClick={handleSave} disabled={!serverStatus} className={`w-full py-4 rounded-xl font-black text-white text-sm shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${newContact.id ? 'bg-gradient-to-r from-nexus-accent to-blue-600' : 'bg-gradient-to-r from-nexus-primary to-indigo-600'}`}>{newContact.id ? 'ذخیره تغییرات' : 'ثبت مخاطب جدید'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// اتصال به فضای جهانی
window.ContactsPage = ContactsPage;