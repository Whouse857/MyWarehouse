// ====================================================================================================
// نسخه: 0.20
// فایل: UI Components.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل کتابخانه‌ای از کامپوننت‌های رابط کاربری (UI) مشترک است که در سراسر برنامه استفاده می‌شوند.
// هدف از این فایل، ایجاد یکپارچگی بصری و جلوگیری از تکرار کد برای المان‌های پرکاربرد است.
//
// لیست کامپوننت‌های موجود:
// ۱. ModalOverlay: لایه تاریک پس‌زمینه برای تمام مودال‌ها.
// ۲. ConfirmDialog: پنجره پرسش و تایید با استایل‌های متنوع (خطر، هشدار، موفقیت).
// ۳. NotificationModal: پنجره اطلاع‌رسانی ساده (Alert).
// ۴. ExitDialog: دیالوگ اختصاصی خروج با قابلیت پشتیبان‌گیری سریع.
// ۵. InputModal: دیالوگ دریافت ورودی متنی از کاربر.
// ۶. NexusInput: فیلد ورودی متن با استایل اختصاصی نکسوس.
// ۷. NexusSelect: لیست کشویی با استایل اختصاصی نکسوس.
// ====================================================================================================

// [TAG: UI_COMPONENTS]
// کامپوننت‌های رابط کاربری عمومی (Modal, Input, Select, etc)

// ----------------------------------------------------------------------------------------------------
// [تگ: لایه زیرین مودال]
// این کامپوننت یک لایه تمام صفحه نیمه‌شفاف ایجاد می‌کند که روی سایر محتوا قرار می‌گیرد.
// وظیفه آن تمرکز کاربر روی مودال و بستن مودال با کلیک روی فضای خالی است.
// ----------------------------------------------------------------------------------------------------
const ModalOverlay = ({ children, onClick }) => (
 <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in" onClick={onClick}>
 {children}
 </div>
);

// ----------------------------------------------------------------------------------------------------
// [تگ: دیالوگ تایید عملیات]
// یک پنجره استاندارد برای گرفتن تایید از کاربر قبل از انجام عملیات‌های حساس.
// 
// پارامتر type ظاهر دیالوگ را تعیین می‌کند:
// - danger: قرمز (حذف، خروج)
// - warning: زرد (تغییرات مهم)
// - info: آبی (اطلاع‌رسانی)
// - success: سبز (تایید موفقیت)
// ----------------------------------------------------------------------------------------------------
const ConfirmDialog = ({ isOpen, title, message, type = 'danger', onConfirm, onCancel }) => {
 if (!isOpen) return null;
 
 // پیکربندی استایل‌ها بر اساس نوع دیالوگ
 const config = {
 danger: { icon: 'alert-triangle', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', btn: 'bg-red-500 hover:bg-red-600' },
 warning: { icon: 'alert-circle', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', btn: 'bg-amber-500 hover:bg-amber-600' },
 info: { icon: 'help-circle', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', btn: 'bg-blue-500 hover:bg-blue-600' },
 success: { icon: 'check-circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', btn: 'bg-emerald-500 hover:bg-emerald-600' }
 }[type] || config.danger;

 return (
 <ModalOverlay>
 <div className={`glass-panel border ${config.border} p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in`} onClick={e => e.stopPropagation()}>
 <div className="flex flex-col items-center text-center gap-4">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center ${config.bg} ${config.color} mb-2`}>
 <i data-lucide={config.icon} className="w-8 h-8"></i>
 </div>
 <h3 className={`text-xl font-bold text-white`}>{title}</h3>
 <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{message}</p>
 <div className="flex gap-3 w-full mt-4">
 <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5">انصراف</button>
 <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white font-bold transition shadow-lg ${config.btn}`}>تایید</button>
 </div>
 </div>
 </div>
 </ModalOverlay>
 );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: مودال اعلان پیام]
// نسخه ساده‌تر دیالوگ که فقط برای نمایش پیام (Alert) استفاده می‌شود و فقط یک دکمه "متوجه شدم" دارد.
// ----------------------------------------------------------------------------------------------------
const NotificationModal = ({ isOpen, onClose, title, message, type }) => {
 if (!isOpen) return null;
 const config = type === 'error' 
? { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/50', icon: 'alert-triangle' }
 : { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', icon: 'check-circle-2' };
   
return (
 <ModalOverlay onClick={onClose}>
 <div className={`glass-panel border ${config.border} p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in`} onClick={e => e.stopPropagation()}>
 <div className="flex flex-col items-center text-center gap-4">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center ${config.bg} ${config.color}`}>
 <i data-lucide={config.icon} className="w-8 h-8"></i>
 </div>
 <h3 className={`text-xl font-bold ${config.color}`}>{title}</h3>
 <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{message}</p>
 <button onClick={onClose} className="mt-4 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/5 shadow-lg">متوجه شدم</button>
 </div>
 </div>
 </ModalOverlay>
 );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: دیالوگ اختصاصی خروج]
// این مودال هنگام درخواست خروج نمایش داده می‌شود و گزینه "بک‌آپ گیری و خروج" را ارائه می‌دهد.
// طراحی آن برای جلب توجه بیشتر به رنگ قرمز/سبز متمایز شده است.
// ----------------------------------------------------------------------------------------------------
const ExitDialog = ({ isOpen, onClose, onConfirm, onBackupAndExit, title, message, loading }) => {
    if (!isOpen) return null;
    return (
        <ModalOverlay>
            {/* استایل کانتینر: تغییر بوردر به قرمز ملایم برای هماهنگی با حالت هشدار */}
            <div className="glass-panel border border-red-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center gap-4">
                    
                    {/* استایل آیکون: دایره‌ای قرمز با سایه داخلی (مشابه ConfirmDialog) */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 mb-2 shadow-inner border border-red-500/20">
                        <i data-lucide="power" className="w-8 h-8"></i>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{message}</p>
                    
                    <div className="flex flex-col gap-3 w-full mt-4">
                        {/* دکمه اصلی: بک‌آپ و خروج (سبز) - تمام عرض */}
                        <button 
                            onClick={onBackupAndExit} 
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 border border-emerald-500/20"
                        >
                            <i data-lucide="save" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}></i>
                            {loading ? 'در حال ایجاد بک‌آپ...' : 'بک‌آپ گیری و خروج'}
                        </button>
                        
                        {/* دکمه‌های فرعی: انصراف و فقط خروج - در یک ردیف */}
                        <div className="flex gap-2">
                            <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5 disabled:opacity-50">انصراف</button>
                            <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 font-bold transition shadow-lg disabled:opacity-50">فقط خروج</button>
                        </div>
                    </div>
                </div>
            </div>
        </ModalOverlay>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: مودال دریافت ورودی]
// یک فرم ساده مودال برای دریافت متن از کاربر (مثلاً برای تغییر نام دسته‌ها).
// ----------------------------------------------------------------------------------------------------
const InputModal = ({ isOpen, onClose, onConfirm, title, label, initialValue = "" }) => {
 const [value, setValue] = useState(initialValue);
 useEffect(() => { if (isOpen) setValue(initialValue); }, [isOpen, initialValue]);
 if (!isOpen) return null;
 return (
 <ModalOverlay>
 <div className="glass-panel border border-white/10 p-5 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
 <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
 <div className="mb-4">
 <label className="text-xs text-gray-400 block mb-1">{label}</label>
 <input className="nexus-input w-full px-3 py-2 text-sm" value={value} onChange={e => setValue(e.target.value)} autoFocus/>
 </div>
 <div className="flex gap-2">
 <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition">انصراف</button>
 <button onClick={() => onConfirm(value)} className="flex-1 py-2 rounded-lg bg-nexus-primary hover:bg-indigo-600 text-white text-xs font-bold transition">تایید</button>
 </div>
 </div>
 </ModalOverlay>
 );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: ورودی متنی نکسوس]
// کامپوننت Input سفارشی شده با استایل‌های پروژه (Glassmorphism).
// با استفاده از memo جهت بهینه‌سازی رندرینگ.
// ----------------------------------------------------------------------------------------------------
const NexusInput = memo(({ label, value, onChange, placeholder, dir="ltr", type="text", className="", list, disabled, onKeyPress, error }) => (
 <div className={`flex flex-col ${className}`}>
 {label && <label className={`text-xs mb-1 block font-medium ${error ? 'text-red-400' : 'text-gray-400'}`}>{label}</label>}
 <input type={type} value={value === null || value === undefined ? "" : value} onChange={onChange} onKeyPress={onKeyPress} dir={dir} placeholder={placeholder} list={list} disabled={disabled} className={`nexus-input w-full px-3 py-2 text-sm placeholder-gray-500 ${error ? '!border-red-500 focus:!border-red-500 !bg-red-500/10 placeholder-red-300/50' : ''}`} />
 </div>
));

// ----------------------------------------------------------------------------------------------------
// [تگ: لیست کشویی نکسوس]
// کامپوننت Select سفارشی شده با استایل‌های پروژه.
// ----------------------------------------------------------------------------------------------------
const NexusSelect = memo(({ label, options, value, onChange, className="", disabled, error }) => (
 <div className={`flex flex-col ${className}`}>
 <label className={`text-xs mb-1 block font-medium ${error ? 'text-red-400' : 'text-gray-400'}`}>{label}</label>
 <div className="relative">
 <select value={value === null || value === undefined ? "" : value} onChange={onChange} disabled={disabled} className={`nexus-input w-full px-3 py-2 text-sm appearance-none cursor-pointer disabled:cursor-not-allowed ${error ? '!border-red-500 focus:!border-red-500 !bg-red-500/10' : ''}`} dir="ltr">
 <option value="" className="bg-slate-900 text-gray-400">...</option>
 {(Array.isArray(options) ? options : []).map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
 </select>
 <i data-lucide="chevron-down" className={`absolute left-2 top-2.5 w-4 h-4 pointer-events-none ${error ? 'text-red-400' : 'text-gray-500'}`}></i>
 </div>
 </div>
));

// ----------------------------------------------------------------------------------------------------
// [تگ: صادرات جهانی]
// اتصال کامپوننت‌ها به شیء window جهت دسترسی در سایر فایل‌ها (بدون نیاز به ماژول لودر).
// ----------------------------------------------------------------------------------------------------
window.ModalOverlay = ModalOverlay;
window.ConfirmDialog = ConfirmDialog;
window.NotificationModal = NotificationModal;
window.ExitDialog = ExitDialog;
window.InputModal = InputModal;
window.NexusInput = NexusInput;
window.NexusSelect = NexusSelect;