// [TAG: PAGE_EXTRAS]
// صفحات جانبی: تامین‌کنندگان و لاگ‌ها

const { useState, useEffect, useCallback } = React;

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

// --- Log Page ---
const LogPage = () => {
    const [logList, setLogList] = useState([]);
    useEffect(() => { fetchAPI('/log').then(({ok, data}) => ok ? setLogList(data) : []).catch(console.error); }, []);
    useLucide([logList]);
    return (
        <div className="flex-1 p-6">
            <header className="h-16 flex items-center mb-4"><h2 className="text-lg font-bold text-white">گزارشات سیستم</h2></header>
            <div className="flex-1 glass-panel rounded-2xl flex flex-col">
                <div className="grid grid-cols-12 gap-2 bg-[#1e293b]/50 p-3 text-xs text-gray-400 font-bold sticky top-0"><div className="col-span-1 text-center">ID</div><div className="col-span-2">کاربر</div><div className="col-span-2">قطعه</div><div className="col-span-2 text-center">عملیات</div><div className="col-span-1 text-center">تعداد</div><div className="col-span-2 text-center">فروشنده</div><div className="col-span-2 text-center">تاریخ</div></div>
                <div className="p-2 space-y-1 overflow-y-auto custom-scroll flex-1">{logList.map(l => (<div key={l.log_id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-lg hover:bg-white/5 border-b border-white/5 last:border-0 text-sm"><div className="col-span-1 text-center text-gray-600 text-xs">#{l.log_id}</div><div className="col-span-2 text-xs text-pink-400 font-mono">{l.username || 'unknown'}</div><div className="col-span-2 font-bold text-white ltr text-left">{l.val}</div><div className="col-span-2 text-center text-xs text-gray-400">{l.operation_type}</div><div className="col-span-1 text-center text-emerald-400 font-mono">{l.quantity_added > 0 ? `+${l.quantity_added}` : l.quantity_added}</div><div className="col-span-2 text-center text-blue-400 text-xs truncate">{l.vendor_name||'-'}</div><div className="col-span-2 text-center text-gray-500 text-xs flex flex-col"><span>{toShamsi(l.purchase_date)}</span><span className="text-[10px] opacity-50">{toShamsiDateTime(l.timestamp)}</span></div></div>))}</div>
            </div>
        </div>
    );
};

// Export to global scope
window.ContactsPage = ContactsPage;
window.LogPage = LogPage;