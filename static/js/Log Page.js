// ====================================================================================================
// نسخه: 0.25
// فایل: Log Page.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل فقط شامل کدهای JSX و رابط کاربری صفحه لاگ است.
// تمام منطق از طریق هوک useLogLogic دریافت می‌شود.
// کامپوننت‌های EditLogModal و PersianDatePicker نیز به اینجا منتقل شده‌اند تا ماژول کامل باشد.
// ====================================================================================================

const { useState, useEffect, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی داخلی UI]
// این توابع برای کامپوننت‌های UI داخلی (مثل DatePicker) نیاز هستند.
// ما این‌ها را اینجا هم نگه می‌داریم تا UI کاملاً مستقل کار کند.
// ----------------------------------------------------------------------------------------------------
const toEnglishDigitsUI = (str) => {
    if (!str) return str;
    return String(str).replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/\//g, '/');
};

const toPersianDigitsUI = (str) => {
    if (!str) return str;
    return String(str).replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
};

// ----------------------------------------------------------------------------------------------------
// [تگ: مودال ویرایش لاگ]
// کامپوننت EditLogModal که قبلاً در Extra Pages بود.
// ----------------------------------------------------------------------------------------------------
const EditLogModal = ({ isOpen, onClose, onSave, log }) => {
    const [qty, setQty] = useState(0);
    const [reason, setReason] = useState("");
    const [editReason, setEditReason] = useState(""); 

    useEffect(() => {
        if (log) {
            setQty(log.quantity_added);
            setReason(log.reason || "");
            setEditReason(log.edit_reason || ""); 
        }
    }, [log, isOpen]);

    if (!isOpen || !log) return null;

    const handleConfirm = () => {
        onSave({
            log_id: log.log_id,
            quantity_added: qty,
            reason: reason,
            edit_reason: editReason
        });
    };

    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i data-lucide="pencil-line" className="text-nexus-accent w-5 h-5"></i>
                    اصلاح تراکنش
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">مقدار تغییر (تعداد)</label>
                        <input type="number" className="nexus-input w-full px-3 py-2 text-sm font-mono ltr" value={qty} onChange={e => setQty(e.target.value)} />
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">دلیل اصلی / پروژه</label>
                        <textarea className="nexus-input w-full px-3 py-2 text-sm min-h-[50px] resize-none" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثلاً: استفاده در پروژه X" />
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <label className="text-xs text-yellow-500/80 block mb-1">دلیل ویرایش (چرا تغییر می‌دهید؟)</label>
                        <input 
                            className="nexus-input w-full px-3 py-2 text-sm bg-yellow-500/5 border-yellow-500/20 focus:border-yellow-500/50 text-yellow-100 placeholder-yellow-500/30"
                            value={editReason}
                            onChange={e => setEditReason(e.target.value)}
                            placeholder="مثلاً: اشتباه تایپی..."
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold transition">انصراف</button>
                        <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white text-sm font-bold transition shadow-lg">ذخیره و اصلاح</button>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: انتخابگر تاریخ شمسی]
// کامپوننت PersianDatePicker که قبلاً در Extra Pages بود و در Log Page کاربرد دارد.
// ----------------------------------------------------------------------------------------------------
const PersianDatePicker = ({ label, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempDate, setTempDate] = useState({ y: 1403, m: 1, d: 1 });
    const popupRef = useRef(null);

    const persianMonths = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (value) {
            const parts = toEnglishDigitsUI(value).split('/');
            if (parts.length === 3) {
                setTempDate({ y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) });
            }
        } else {
            const now = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/'); 
            if (now.length === 3) {
                setTempDate({ y: parseInt(now[0]), m: parseInt(now[1]), d: parseInt(now[2]) });
            }
        }
    }, [value, isOpen]);

    const handleConfirm = () => {
        const mStr = tempDate.m.toString().padStart(2, '0');
        const dStr = tempDate.d.toString().padStart(2, '0');
        const dateStr = `${tempDate.y}/${mStr}/${dStr}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const handleClear = () => { onChange(""); setIsOpen(false); };
    
    const years = Array.from({ length: 21 }, (_, i) => 1395 + i);
    const days = Array.from({ length: 31 }, (_, i) => 1 + i);

    return (
        <div className="relative" ref={popupRef}>
            <span className="absolute -top-2 right-2 text-[9px] text-gray-400 bg-[#1e293b] px-1 z-10">{label}</span>
            <div onClick={() => setIsOpen(!isOpen)} className="nexus-input w-full h-[38px] px-3 py-2 text-sm bg-black/20 border-white/10 cursor-pointer flex items-center justify-between hover:bg-white/5 transition">
                <span className={value ? "text-white" : "text-gray-500"}>{value ? toPersianDigitsUI(value) : "انتخاب کنید..."}</span>
                <i data-lucide="calendar" className="w-4 h-4 text-gray-400"></i>
            </div>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex gap-2 mb-4">
                        <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1 text-center">سال</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.y} onChange={e => setTempDate({...tempDate, y: parseInt(e.target.value)})}>{years.map(y => <option key={y} value={y}>{toPersianDigitsUI(y)}</option>)}</select></div>
                        <div className="flex-[1.5]"><label className="block text-[10px] text-gray-500 mb-1 text-center">ماه</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.m} onChange={e => setTempDate({...tempDate, m: parseInt(e.target.value)})}>{persianMonths.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select></div>
                        <div className="flex-1"><label className="block text-[10px] text-gray-500 mb-1 text-center">روز</label><select className="w-full bg-black/30 border border-white/10 rounded-lg text-sm p-1 text-center text-white" value={tempDate.d} onChange={e => setTempDate({...tempDate, d: parseInt(e.target.value)})}>{days.map(d => <option key={d} value={d}>{toPersianDigitsUI(d)}</option>)}</select></div>
                    </div>
                    <div className="flex gap-2"><button onClick={handleClear} className="flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:bg-white/5 transition">پاک کردن</button><button onClick={handleConfirm} className="flex-1 py-1.5 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-xs text-white font-bold transition shadow-lg">تایید</button></div>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت اصلی LogPage]
// ----------------------------------------------------------------------------------------------------
const LogPage = () => {
    // اتصال به هوک منطق
    if (!window.useLogLogic) return <div>در حال بارگذاری ماژول لاگ...</div>;

    const {
        loading,
        filters, setFilters,
        editModal, setEditModal,
        filteredLogs,
        config,
        handleDeleteLog,
        handleUpdateLog,
        toEnglishDigits,
        toPersianDigits,
        getPartCodeLog
    } = window.useLogLogic();
    
    // هوک‌های UI سراسری
    useLucide([filteredLogs, filters, editModal.open]); 

    if (loading) return <div className="flex justify-center items-center h-full text-white">در حال دریافت تاریخچه...</div>;
    const formatMoney = (val) => val ? Number(val).toLocaleString() : '0';

    return (
        <div className="flex-1 p-6 h-full flex flex-col">
            {/* مودال ویرایش */}
            <EditLogModal 
                isOpen={editModal.open} 
                log={editModal.log} 
                onClose={() => setEditModal({ open: false, log: null })} 
                onSave={handleUpdateLog}
            />

            {/* هدر و فیلترها */}
            <header className="mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white flex items-center gap-3"><i data-lucide="history" className="w-6 h-6 text-nexus-primary"></i>تاریخچه تراکنش‌های انبار</h2><span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">{filteredLogs.length} تراکنش</span></div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-3"><input className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" placeholder="جستجو (کد، نام، دلیل)..." value={filters.general} onChange={e => setFilters({...filters, general: e.target.value})} /></div>
                    <div className="md:col-span-2"><input className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40" placeholder="نام کاربر" value={filters.user} onChange={e => setFilters({...filters, user: e.target.value})} /></div>
                    <div className="md:col-span-2"><select className="nexus-input w-full px-3 py-2 text-sm bg-black/20 border-white/10 focus:bg-black/40 appearance-none cursor-pointer" value={filters.operation} onChange={e => setFilters({...filters, operation: e.target.value})}><option value="">همه عملیات‌ها</option><option value="ENTRY">ورود (ENTRY)</option><option value="EXIT">خروج (EXIT)</option><option value="UPDATE">ویرایش (UPDATE)</option><option value="DELETE">حذف (DELETE)</option></select></div>
                    <div className="md:col-span-5 flex gap-2 items-center">
                        <div className="flex-1"><PersianDatePicker label="از تاریخ" value={filters.startDate} onChange={date => setFilters({...filters, startDate: date})} /></div><span className="text-gray-600">-</span><div className="flex-1"><PersianDatePicker label="تا تاریخ" value={filters.endDate} onChange={date => setFilters({...filters, endDate: date})} /></div>
                        {(filters.startDate || filters.endDate || filters.general || filters.user || filters.operation) && (<button onClick={() => setFilters({general: "", user: "", operation: "", startDate: "", endDate: ""})} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition h-[38px] w-[38px] flex items-center justify-center"><i data-lucide="filter-x" className="w-4 h-4"></i></button>)}
                    </div>
                </div>
            </header>
            
            {/* لیست تراکنش‌ها */}
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 relative">
                <div className="absolute top-0 right-[27px] w-0.5 h-full bg-white/10 z-0"></div>
                <div className="space-y-6 relative z-10 pb-10">
                    {filteredLogs.length === 0 ? (<div className="text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10"><i data-lucide="search-x" className="w-12 h-12 mx-auto mb-3 opacity-50"></i><p>موردی یافت نشد.</p></div>) : (
                        filteredLogs.map(l => {
                            // ------------------------------------------------------------------------
                            // [تگ: آخرین فیکس منطق رنگ‌بندی]
                            // این بخش دقیقا طبق آخرین توافق اصلاح شده است:
                            // ۱. اگر تعداد کم شده (منفی) -> قرمز (خروج)
                            // ۲. اگر تعداد اضافه شده یا ثبت اولیه است -> سبز (ورود)
                            // ۳. اگر فقط اطلاعات عوض شده و تعداد صفر است -> زرد (ویرایش)
                            // ------------------------------------------------------------------------
                            
                            const isNew = l.operation_type === 'ENTRY (New)'; 
                            const isDelete = l.operation_type && l.operation_type.includes('DELETE');

                            // ورود: اگر موجودی اضافه شده یا "ثبت اولیه" است (حتی با تعداد صفر) -> سبز شود
                            const isEntry = l.quantity_added > 0 || isNew;
                            
                            // ویرایش: فقط و فقط زمانی که تغییر موجودی "صفر" باشد (و حذف یا ثبت اولیه هم نباشد) -> زرد شود
                            const isEdit = !isNew && !isDelete && l.quantity_added === 0;
                            
                            // متغیرهای استایل
                            let colorClass = '', iconName = '', borderColor = '', bgClass = '', titleText = '';

                            if (isDelete) {
                                colorClass = 'text-red-700';
                                bgClass = 'bg-red-950/60';
                                borderColor = 'border-red-900';
                                iconName = 'trash-2';
                                titleText = 'حذف قطعه';
                            } 
                            else if (isEdit) {
                                colorClass = 'text-yellow-400';
                                bgClass = 'bg-[#0f172a]';
                                borderColor = 'border-yellow-500/50';
                                iconName = 'pencil-line';
                                titleText = 'ویرایش اطلاعات';
                            } 
                            else if (isEntry) {
                                colorClass = 'text-emerald-400';
                                bgClass = 'bg-[#0f172a]';
                                borderColor = 'border-emerald-500';
                                iconName = 'arrow-down-left';
                                titleText = 'ورود به انبار';
                            } 
                            else {
                                // حالت پیش‌فرض (کاهش موجودی / خروج)
                                colorClass = 'text-rose-400';
                                bgClass = 'bg-[#0f172a]';
                                borderColor = 'border-rose-500';
                                iconName = 'arrow-up-right';
                                titleText = 'خروج از انبار';
                            }

                            const pCode = getPartCodeLog(l, config);
                            
                            return (
                                <div key={l.log_id} className="flex gap-4 group animate-in slide-in-from-right-2 duration-300">
                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border-2 shadow-lg transition-all duration-300 group-hover:scale-110 ${bgClass} ${borderColor} ${colorClass}`}>
                                        <i data-lucide={iconName} className="w-6 h-6"></i>
                                    </div>
                                    
                                    <div className={`flex-1 glass-panel p-4 rounded-2xl border transition-all hover:bg-white/[0.02] ${isEdit ? 'border-yellow-500/20' : 'border-white/5'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-sm font-bold ${colorClass}`}>{titleText}</span>
                                                    <span className="text-[10px] text-nexus-accent font-mono font-bold bg-nexus-accent/10 px-2 py-0.5 rounded-full border border-nexus-accent/20 tracking-tighter">{pCode}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">{l.operation_type}</span>
                                                    {l.invoice_number && (
                                                        <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mr-1">
                                                            فاکتور: {l.invoice_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-black text-white ltr font-mono text-right flex items-center gap-2">{l.val}<span className="text-xs font-normal text-gray-400 bg-white/5 px-2 py-1 rounded">{l.package || '-'}</span></h3>
                                            </div>
                                            <div className="text-left flex flex-col items-end">
                                                <div className="flex gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditModal({ open: true, log: l })} title="اصلاح تراکنش" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><i data-lucide="pencil" className="w-3.5 h-3.5"></i></button>
                                                    <button onClick={() => handleDeleteLog(l)} title="حذف و واگردانی" className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"><i data-lucide="trash-2" className="w-3.5 h-3.5"></i></button>
                                                </div>
                                                <span className="text-xs text-gray-300 font-mono bg-white/5 px-2 py-1 rounded">{toShamsiDateTime(l.timestamp)}</span>
                                                <span className="text-[10px] text-nexus-primary mt-1 flex items-center gap-1"><i data-lucide="user" className="w-3 h-3"></i> {l.username || 'سیستم'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-black/20 p-3 rounded-xl border border-white/5 text-xs">
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">نوع قطعه</span><span className="text-white font-bold">{l.type || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">تکنولوژی/وات</span><span className="text-white dir-ltr">{l.tech || l.watt || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">محل نگهداری</span><span className="text-orange-300 flex items-center gap-1"><i data-lucide="map-pin" className="w-3 h-3"></i> {l.storage_location || '-'}</span></div>
                                            <div className="flex flex-col gap-1"><span className="text-gray-500">دلیل/پروژه</span><span className="text-white truncate font-medium" title={l.reason}>{l.reason || '-'}</span></div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500">توضیحات اصلاح</span>
                                                {l.edit_reason ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        {l.edit_reason.split(' | ').map((change, idx) => (
                                                            <span key={idx} className="text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20 text-[10px] whitespace-normal leading-tight text-right w-full">
                                                                • {change}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-3">
                                            <div className="flex items-center gap-4 text-xs text-gray-400">{l.vendor_name && <span className="flex items-center gap-1"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i> {l.vendor_name}</span>}{l.unit_price > 0 && <span className="flex items-center gap-1 font-mono text-amber-400"><i data-lucide="tag" className="w-3 h-3"></i> {formatMoney(l.unit_price)} T</span>}</div>
                                            {isEdit ? (<div className="flex items-center gap-2"><span className="text-[10px] text-gray-500">تغییر موجودی:</span>{l.quantity_added !== 0 ? (<div className="px-3 py-1 rounded border bg-yellow-500/10 border-yellow-500/50 text-yellow-400 font-bold font-mono shadow-[0_0_10px_rgba(234,179,8,0.2)]">{l.quantity_added > 0 ? `+${l.quantity_added}` : l.quantity_added}</div>) : (<span className="text-xs text-yellow-500/80 font-bold">بروزرسانی اطلاعات</span>)}</div>) : (<div className={`text-lg font-black font-mono flex items-center gap-2 ${isEntry ? 'text-emerald-400' : (isDelete ? 'text-gray-500' : 'text-rose-400')}`}>{l.quantity_added > 0 ? '+' : ''}{l.quantity_added} <span className="text-xs font-normal text-gray-500">عدد</span></div>)}
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

// اتصال به فضای جهانی
window.LogPage = LogPage;