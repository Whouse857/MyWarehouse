// [TAG: PAGE_EXTRAS]
// صفحات جانبی: تامین‌کنندگان و لاگ‌ها

const { useState, useEffect, useCallback, useMemo } = React;

// --- Contacts Page ---
const ContactsPage = ({ serverStatus }) => {
    const [contacts, setContacts] = useState([]);
    const [newContact, setNewContact] = useState({ id: null, name: '', phone: '', mobile: '', fax: '', website: '', email: '', address: '', notes: '' });
    const notify = useNotify();
    const dialog = useDialog();

    const loadContacts = useCallback(async () => { try { const { ok, data } = await fetchAPI('/contacts'); if (ok) setContacts(data); } catch (e) {} }, []);
    useEffect(() => { loadContacts(); }, [loadContacts]);
    useLucide([contacts, newContact]);

    const handleSave = async () => { if (!newContact.name.trim()) return notify.show('خطا', "نام تامین‌کننده الزامی است", 'error'); try { const { ok } = await fetchAPI('/contacts/save', { method: 'POST', body: newContact }); if (ok) { loadContacts(); setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''}); notify.show('موفقیت', "ذخیره شد.", 'success'); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); } };
    const handleDelete = async (id) => { if(await dialog.ask("حذف", "آیا مطمئن هستید؟", "danger")) { try { const { ok } = await fetchAPI(`/contacts/delete/${id}`, {method:'DELETE'}); if(ok) loadContacts(); } catch(e){} } };
    const handleEdit = (c) => { setNewContact(c); };

    return (
        <div className="flex-1 p-6 overflow-hidden flex flex-col h-full">
            <header className="h-16 border-b border-white/5 flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white">مدیریت تامین‌کنندگان</h2></header>
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                <div className="col-span-12 lg:col-span-8 glass-panel rounded-2xl flex flex-col">
                    <div className="grid grid-cols-12 gap-2 bg-[#1e293b]/50 p-3 text-xs text-gray-400 font-bold border-b border-white/5"><div className="col-span-2">نام</div><div className="col-span-3 text-center">تماس</div><div className="col-span-2 text-center">وب/ایمیل</div><div className="col-span-4 text-center">آدرس</div><div className="col-span-1 text-center">عملیات</div></div>
                    <div className="p-2 space-y-2 overflow-y-auto custom-scroll flex-1">
                        {contacts.map(c => (
                            <div key={c.id} className={`grid grid-cols-12 gap-2 p-3 rounded-lg hover:bg-white/5 items-center text-sm ${newContact.id === c.id ? 'bg-nexus-primary/10 border border-nexus-primary/50' : ''}`}>
                                <div className="col-span-2 font-bold text-white truncate">{c.name}</div>
                                <div className="col-span-3 text-center flex flex-col gap-1"><span className="text-xs ltr text-white">{c.mobile}</span><span className="text-[10px] ltr text-gray-400">{c.phone}</span></div>
                                <div className="col-span-2 text-center flex flex-col gap-1"><a href={c.website} target="_blank" className="text-[10px] text-blue-400 truncate">{c.website}</a><span className="text-[10px] ltr text-gray-400 truncate">{c.email}</span></div>
                                <div className="col-span-4 text-center text-[10px] text-gray-300 truncate">{c.address}</div>
                                <div className="col-span-1 flex justify-center gap-1"><button onClick={() => handleEdit(c)} disabled={!serverStatus} className="text-blue-400 p-1.5"><i data-lucide="pencil" className="w-4 h-4"></i></button><button onClick={() => handleDelete(c.id)} disabled={!serverStatus} className="text-red-400 p-1.5"><i data-lucide="trash-2" className="w-4 h-4"></i></button></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 glass-panel border border-white/10 rounded-2xl p-5 shadow-2xl h-fit">
                    <h2 className="text-lg font-bold text-white mb-4 flex justify-between">{newContact.id ? 'ویرایش' : 'افزودن'}{newContact.id && <button onClick={()=>setNewContact({id:null, name:'', phone:'', mobile:'', fax:'', website:'', email:'', address: '', notes:''})} className="text-xs bg-white/5 px-2 rounded hover:bg-white/10 transition">انصراف</button>}</h2>
                    <div className="space-y-3 custom-scroll overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
                        <NexusInput label="نام *" value={newContact.name} onChange={e=>setNewContact(p=>({...p, name:e.target.value}))} disabled={!serverStatus} />
                        <div className="grid grid-cols-2 gap-2"><NexusInput label="موبایل" dir="ltr" value={newContact.mobile} onChange={e=>setNewContact(p=>({...p, mobile:e.target.value}))} disabled={!serverStatus} /><NexusInput label="تلفن" dir="ltr" value={newContact.phone} onChange={e=>setNewContact(p=>({...p, phone:e.target.value}))} disabled={!serverStatus} /></div>
                        <div className="grid grid-cols-2 gap-2"><NexusInput label="فکس" dir="ltr" value={newContact.fax} onChange={e=>setNewContact(p=>({...p, fax:e.target.value}))} disabled={!serverStatus} /><NexusInput label="وب‌سایت" dir="ltr" value={newContact.website} onChange={e=>setNewContact(p=>({...p, website:e.target.value}))} disabled={!serverStatus} /></div>
                        <NexusInput label="آدرس" value={newContact.address} onChange={e=>setNewContact(p=>({...p, address:e.target.value}))} disabled={!serverStatus} />
                        <NexusInput label="ایمیل" dir="ltr" value={newContact.email} onChange={e=>setNewContact(p=>({...p, email:e.target.value}))} disabled={!serverStatus} />
                        <button onClick={handleSave} disabled={!serverStatus} className="w-full h-10 rounded-lg font-bold text-white bg-nexus-primary hover:bg-indigo-600 mt-2">{newContact.id ? 'ذخیره تغییرات' : 'ذخیره'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Modern Timeline Log Page ---
const LogPage = () => {
    const [logList, setLogList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => { 
        fetchAPI('/log').then(({ok, data}) => {
            if (ok) setLogList(data);
            setLoading(false);
        }).catch(console.error); 
    }, []);
    
    // فیلتر کردن لاگ‌ها
    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logList;
        const lower = searchTerm.toLowerCase();
        return logList.filter(l => 
            (l.val && l.val.toLowerCase().includes(lower)) ||
            (l.username && l.username.toLowerCase().includes(lower)) ||
            (l.operation_type && l.operation_type.toLowerCase().includes(lower)) ||
            (l.reason && l.reason.toLowerCase().includes(lower)) ||
            (l.vendor_name && l.vendor_name.toLowerCase().includes(lower)) ||
            (String(l.log_id).includes(lower))
        );
    }, [logList, searchTerm]);

    useLucide([filteredLogs]);

    if (loading) return <div className="flex justify-center items-center h-full text-white">در حال دریافت تاریخچه...</div>;

    const formatMoney = (val) => val ? Number(val).toLocaleString() : '0';

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="history" className="w-6 h-6 text-nexus-primary"></i>
                        تاریخچه تراکنش‌های انبار
                    </h2>
                    <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">{filteredLogs.length} تراکنش</span>
                </div>
                
                {/* نوار جستجو */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                        <i data-lucide="search" className="w-4 h-4"></i>
                    </div>
                    <input 
                        className="nexus-input w-full pr-10 pl-4 py-2.5 text-sm bg-black/20 border-white/10 focus:bg-black/40 transition-colors" 
                        placeholder="جستجو در نام قطعه، کاربر، نوع عملیات، دلیل..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm("")} className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 hover:text-white">
                            <i data-lucide="x" className="w-3 h-3"></i>
                        </button>
                    )}
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 relative">
                {/* خط اتصال عمودی */}
                <div className="absolute top-0 right-[27px] w-0.5 h-full bg-white/10 z-0"></div>

                <div className="space-y-6 relative z-10 pb-10">
                    {filteredLogs.length === 0 ? (
                        <div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <i data-lucide="search-x" className="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                            <p>موردی با این مشخصات یافت نشد.</p>
                        </div>
                    ) : (
                        filteredLogs.map(l => {
                            const isEntry = l.quantity_added > 0;
                            const isDelete = l.operation_type === 'DELETE';
                            // تشخیص عملیات ویرایش: اگر متن شامل UPDATE باشد
                            const isEdit = l.operation_type && l.operation_type.includes('UPDATE');
                            
                            // تعیین رنگ و آیکون
                            let colorClass = '';
                            let iconName = '';
                            let borderColor = '';
                            let titleText = '';

                            if (isDelete) {
                                colorClass = 'text-gray-400 bg-gray-500/10';
                                borderColor = 'border-gray-600';
                                iconName = 'trash-2';
                                titleText = 'حذف قطعه';
                            } else if (isEdit) {
                                colorClass = 'text-yellow-400 bg-yellow-500/10'; // رنگ زرد برای ویرایش
                                borderColor = 'border-yellow-500';
                                iconName = 'pencil-line'; // آیکون متفاوت
                                titleText = 'ویرایش / تغییر موجودی';
                            } else if (isEntry) {
                                colorClass = 'text-emerald-400 bg-emerald-500/10';
                                borderColor = 'border-emerald-500';
                                iconName = 'arrow-down-left';
                                titleText = 'ورود به انبار';
                            } else {
                                colorClass = 'text-rose-400 bg-rose-500/10';
                                borderColor = 'border-rose-500';
                                iconName = 'arrow-up-right';
                                titleText = 'خروج از انبار';
                            }
                            
                            return (
                                <div key={l.log_id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                                    {/* آیکون سمت راست */}
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 group-hover:scale-110 bg-[#0f172a] ${borderColor} ${colorClass.split(' ')[0]}`}>
                                        <i data-lucide={iconName} className="w-6 h-6"></i>
                                    </div>

                                    {/* کارت محتوا */}
                                    <div className={`flex-1 glass-panel p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.02] ${isEdit ? 'hover:border-yellow-500/30' : 'hover:border-white/10'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-bold ${colorClass.split(' ')[0]}`}>
                                                        {titleText}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 px-2 py-0.5 bg-white/5 rounded-full font-mono">ID: {l.log_id}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{l.operation_type}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white ltr font-mono text-right flex items-center gap-2">
                                                    {l.val}
                                                    <span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded">{l.package || '-'}</span>
                                                </h3>
                                            </div>
                                            <div className="text-left flex flex-col items-end">
                                                <span className="text-xs text-gray-400 font-mono">{toShamsiDateTime(l.timestamp)}</span>
                                                <span className="text-[10px] text-nexus-primary mt-1 flex items-center gap-1">
                                                    <i data-lucide="user" className="w-3 h-3"></i> {l.username || 'سیستم'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* جزئیات فنی و عملیاتی */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">نوع قطعه</span>
                                                <span className="text-white font-bold">{l.type || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">تکنولوژی/وات</span>
                                                <span className="text-white dir-ltr">{l.tech || l.watt || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">محل نگهداری</span>
                                                <span className="text-orange-300 flex items-center gap-1"><i data-lucide="map-pin" className="w-3 h-3"></i> {l.storage_location || '-'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">دلیل/پروژه</span>
                                                <span className="text-white truncate font-medium" title={l.reason}>{l.reason || '-'}</span>
                                            </div>
                                        </div>

                                        {/* بخش مالی و تعداد */}
                                        <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-3">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                {l.vendor_name && <span className="flex items-center gap-1"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i> {l.vendor_name}</span>}
                                                {l.unit_price > 0 && <span className="flex items-center gap-1 font-mono text-amber-400"><i data-lucide="tag" className="w-3 h-3"></i> {formatMoney(l.unit_price)} T</span>}
                                                {l.usd_rate > 0 && <span className="flex items-center gap-1 font-mono text-[10px] opacity-70">($ {formatMoney(l.usd_rate)})</span>}
                                            </div>
                                            
                                            {/* نمایش تغییرات موجودی - برای ویرایش متفاوت است */}
                                            {isEdit ? (
                                                <div className="text-sm font-bold font-mono flex items-center gap-2 text-yellow-400">
                                                    {l.quantity_added > 0 ? `+${l.quantity_added}` : (l.quantity_added < 0 ? l.quantity_added : 'تغییر اطلاعات')}
                                                    {l.quantity_added !== 0 && <span className="text-[10px] font-normal text-gray-500">عدد</span>}
                                                </div>
                                            ) : (
                                                <div className={`text-lg font-black font-mono flex items-center gap-2 ${isEntry ? 'text-emerald-400' : (isDelete ? 'text-gray-500' : 'text-rose-400')}`}>
                                                    {l.quantity_added > 0 ? '+' : ''}{l.quantity_added} <span className="text-xs font-normal text-gray-500">عدد</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// Export to global scope
window.ContactsPage = ContactsPage;
window.LogPage = LogPage;