// ====================================================================================================
// نسخه: 0.20
// فایل: admin_management.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل حاوی کامپوننت `ManagementPage` است که قلب تپنده تنظیمات سیستم انبارداری محسوب می‌شود.
// وظایف اصلی این بخش عبارتند از:
// ۱. مدیریت دسته‌بندی‌های اصلی قطعات (مثل مقاومت، خازن و ...) و مرتب‌سازی آنها.
// ۲. مدیریت لیست‌های پویا برای هر دسته (مانند مقادیر، پکیج‌ها، تولرانس‌ها و ...).
// ۳. تعیین قوانین برای فیلدها (مانند تغییر نام نمایشی، اجباری کردن یا مخفی کردن فیلدها).
// ۴. تنظیم الگوی کددهی (Prefix) برای هر دسته جهت تولید کدهای انبارداری.
//
// این ماژول از فایل یکپارچه قدیمی جدا شده تا توسعه و نگهداری آن ساده‌تر شود.
// ====================================================================================================

// استخراج هوک‌های مورد نیاز از کتابخانه React
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت صفحه مدیریت تنظیمات]
// ورودی‌ها (Props):
// - globalConfig: کل تنظیمات فعلی سیستم که از سرور یا والد دریافت شده است.
// - onConfigUpdate: تابعی برای اطلاع دادن به کامپوننت والد هنگام بروزرسانی تنظیمات.
// ----------------------------------------------------------------------------------------------------
const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // sortedKeys: لیست کلیدهای دسته‌بندی مرتب شده بر اساس اولویت.
    // selectedType: دسته‌بندی که هم‌اکنون توسط کاربر برای ویرایش انتخاب شده است.
    // config: کپی محلی از تنظیمات برای اعمال تغییرات قبل از ذخیره نهایی.
    // newItems: ذخیره موقت مقادیر تایپ شده در اینپوت‌های افزودن آیتم جدید.
    // renameModal: وضعیت مودال تغییر نام (شامل نوع تغییر، مقدار قبلی و ...).
    // addCategoryModal: وضعیت نمایش یا عدم نمایش مودال افزودن دسته جدید.
    // ------------------------------------------------------------------------------------------------
    const [sortedKeys, setSortedKeys] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [config, setConfig] = useState(globalConfig || {});
    const [newItems, setNewItems] = useState({});
    const [renameModal, setRenameModal] = useState({ open: false, type: '', oldVal: '', category: '', listName: '' });
    const [addCategoryModal, setAddCategoryModal] = useState(false);
    
    // رفرنس‌ها برای مدیریت Drag & Drop (کشیدن و رها کردن دسته‌ها)
    const dragItem = useRef();
    const dragOverItem = useRef();

    // هوک‌های سفارشی برای نمایش پیام و دیالوگ تایید
    const notify = useNotify();
    const dialog = useDialog();

    // ------------------------------------------------------------------------------------------------
    // [تگ: همگام‌سازی اولیه]
    // هر زمان که globalConfig تغییر کند، این هوک اجرا می‌شود تا لیست مرتب شده را بسازد
    // و اولین دسته را به عنوان انتخاب پیش‌فرض تنظیم کند.
    // ------------------------------------------------------------------------------------------------
    useEffect(() => {
        if (globalConfig && Object.keys(globalConfig).length > 0) {
            setConfig(globalConfig);
            const keys = Object.keys(globalConfig);
            // مرتب‌سازی کلیدها بر اساس فیلد priority به صورت نزولی
            const sorted = keys.sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0));
            setSortedKeys(sorted);
            // انتخاب اولین دسته در صورتی که هیچ دسته‌ای انتخاب نشده باشد
            if (!selectedType && sorted.length > 0) setSelectedType(sorted[0]);
        }
    }, [globalConfig]);

    // بروزرسانی آیکون‌ها در صورت تغییر وضعیت‌های کلیدی
    if (typeof useLucide === 'function') {
        useLucide([selectedType, config, sortedKeys]);
    }

    // ------------------------------------------------------------------------------------------------
    // [تگ: منطق Drag & Drop]
    // توابع مربوط به جابجایی دسته‌بندی‌ها با کشیدن موس برای تغییر اولویت نمایش.
    // ------------------------------------------------------------------------------------------------
    const handleDragStart = (e, position) => { 
        dragItem.current = position; 
        e.target.classList.add('opacity-50'); 
    };

    const handleDragEnter = (e, position) => { 
        dragOverItem.current = position; 
        const copyListItems = [...sortedKeys]; 
        const dragItemContent = copyListItems[dragItem.current]; 
        copyListItems.splice(dragItem.current, 1); 
        copyListItems.splice(dragOverItem.current, 0, dragItemContent); 
        dragItem.current = position; 
        setSortedKeys(copyListItems); 
    };

    const handleDragEnd = (e) => { 
        e.target.classList.remove('opacity-50'); 
        dragItem.current = null; 
        dragOverItem.current = null; 
        
        // بروزرسانی اولویت‌ها در آبجکت config بر اساس ترتیب جدید
        const newConfig = { ...config }; 
        sortedKeys.forEach((key, index) => { 
            if (newConfig[key]) newConfig[key].priority = sortedKeys.length - index; 
        }); 
        setConfig(newConfig); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تعاریف متا لیست‌ها]
    // نگاشت نام‌های فنی لیست‌ها به برچسب‌های فارسی و آیکون‌های مربوطه جهت نمایش در UI.
    // ------------------------------------------------------------------------------------------------
    const listLabels = { 
        'units': { label: 'واحدها', icon: 'ruler' }, 
        'paramOptions': { label: 'مقادیر پارامتر', icon: 'sliders' }, 
        'tolerances': { label: 'تولرانس / ویژگی فنی', icon: 'list' },
        'packages': { label: 'پکیج‌ها', icon: 'box' }, 
        'techs': { label: 'تکنولوژی‌ها', icon: 'cpu' }, 
        'list5': { label: 'فیلد ۵', icon: 'list' },
        'list6': { label: 'فیلد ۶', icon: 'list' },
        'list7': { label: 'فیلد ۷', icon: 'list' },
        'list8': { label: 'فیلد ۸', icon: 'list' },
        'list9': { label: 'فیلد ۹', icon: 'list' },
        'list10': { label: 'فیلد ۱۰', icon: 'list' },
        'locations': { label: 'آدرس‌های انبار (General)', icon: 'map-pin' }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر تنظیمات فیلد]
    // مدیریت تغییر ویژگی‌های هر فیلد (مانند الزامی بودن، مخفی بودن یا تغییر نام).
    // شامل منطق اعتبارسنجی: کاربر نمی‌تواند فیلدی را که لیست آن خالی است، فعال یا الزامی کند.
    // ------------------------------------------------------------------------------------------------
    const handleFieldConfigChange = (listName, key, value) => {
        // --- بررسی شرط خالی نبودن لیست قبل از فعال‌سازی ---
        if ((key === 'visible' && value === true) || (key === 'required' && value === true)) {
            const currentList = config[selectedType][listName] || [];
            if (currentList.length === 0) {
                notify.show(
                    'لیست خالی است', 
                    `ابتدا باید حداقل یک آیتم برای این فیلد تعریف کنید تا بتوانید آن را فعال یا الزامی نمایید.`, 
                    'error'
                );
                return; // لغو عملیات
            }
        }

        const newConfig = { ...config };
        
        // اطمینان از وجود ساختار آبجکت برای ذخیره تنظیمات فیلد
        if (!newConfig[selectedType].fields) newConfig[selectedType].fields = {};
        if (!newConfig[selectedType].fields[listName]) newConfig[selectedType].fields[listName] = {};
        
        // اعمال مقدار جدید
        newConfig[selectedType].fields[listName][key] = value;

        // منطق هوشمند: اگر فیلدی "الزامی" شود، باید حتماً "قابل مشاهده" هم باشد.
        if (key === 'required' && value === true) {
             newConfig[selectedType].fields[listName]['visible'] = true;
        }
        
        // منطق هوشمند: اگر فیلدی "مخفی" شود، دیگر نمی‌تواند "الزامی" باشد.
        if (key === 'visible' && value === false) {
             newConfig[selectedType].fields[listName]['required'] = false;
        }

        setConfig(newConfig);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت آیتم‌های لیست]
    // توابع افزودن و حذف آیتم از لیست‌های داخل هر دسته (مثلاً افزودن یک پکیج جدید).
    // ------------------------------------------------------------------------------------------------
    const handleAddItem = (listName, value) => {
        if (!value || !value.trim()) return;
        const newConfig = { ...config };
        if (!newConfig[selectedType][listName]) newConfig[selectedType][listName] = [];
        
        // جلوگیری از تکرار
        if (!newConfig[selectedType][listName].includes(value)) { 
            newConfig[selectedType][listName].push(value); 
            setConfig(newConfig); 
            setNewItems({ ...newItems, [listName]: '' }); // پاک کردن فیلد ورودی
        }
    };
    
    const handleDeleteItem = (listName, value) => { 
        const newConfig = { ...config }; 
        newConfig[selectedType][listName] = newConfig[selectedType][listName].filter(item => item !== value); 
        setConfig(newConfig); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: ذخیره تغییرات]
    // ارسال کل آبجکت تنظیمات (config) به سرور برای ذخیره‌سازی دائم.
    // ------------------------------------------------------------------------------------------------
    const handleSave = async () => {
        if (await dialog.ask("ذخیره تنظیمات", "آیا از ذخیره تغییرات اطمینان دارید؟", "warning")) {
            try { 
                const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: config }); 
                if (ok) { 
                    onConfigUpdate(config); 
                    notify.show('موفقیت', "تنظیمات ذخیره شد.", 'success'); 
                } 
            } catch (e) { 
                notify.show('خطا', "مشکل شبکه", 'error'); 
            }
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: حذف دسته‌بندی]
    // حذف کامل یک دسته (Category) به همراه تمام تنظیمات آن.
    // نکته: حذف دسته 'General' (عمومی) مجاز نیست.
    // ------------------------------------------------------------------------------------------------
    const handleDeleteCategory = async (keyToDelete) => {
        if (keyToDelete === 'General') return notify.show('خطا', 'حذف تنظیمات عمومی مجاز نیست.', 'error');
        if (await dialog.ask("حذف دسته", `آیا از حذف دسته‌بندی "${config[keyToDelete].label}" اطمینان دارید؟`, "danger")) {
            try {
                const newConfig = { ...config }; 
                delete newConfig[keyToDelete];
                
                // ذخیره آنی پس از حذف
                const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig });
                if (ok) { 
                    setConfig(newConfig); 
                    setSortedKeys(sortedKeys.filter(k => k !== keyToDelete)); 
                    if (selectedType === keyToDelete) setSelectedType(sortedKeys[0]); 
                    onConfigUpdate(newConfig); 
                    notify.show('موفقیت', 'حذف شد.', 'success'); 
                }
            } catch (e) { notify.show('خطا', 'مشکل سرور', 'error'); }
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر نام (Rename)]
    // مدیریت تغییر نام دسته‌ها یا آیتم‌های لیست.
    // این بخش با ارسال درخواست به API مخصوص rename انجام می‌شود تا ارجاعات سمت سرور هم اصلاح شوند.
    // ------------------------------------------------------------------------------------------------
    const handleRenameSubmit = async (newVal) => {
        if (!newVal || newVal === renameModal.oldVal) return setRenameModal({ ...renameModal, open: false });
        try {
            const { ok } = await fetchAPI('/settings/rename', { 
                method: 'POST', 
                body: { 
                    mode: renameModal.type, 
                    oldVal: renameModal.oldVal, 
                    newVal, 
                    category: renameModal.category, 
                    listName: renameModal.listName 
                } 
            });
            
            if (ok) {
                notify.show('موفقیت', 'تغییر نام انجام شد.', 'success');
                const newConfig = { ...config };
                
                if (renameModal.type === 'category') {
                    // تغییر نام کلید در آبجکت اصلی
                    const priority = newConfig[renameModal.oldVal].priority; 
                    newConfig[newVal] = newConfig[renameModal.oldVal]; 
                    delete newConfig[renameModal.oldVal];
                    
                    newConfig[newVal].label = newVal; 
                    newConfig[newVal].priority = priority;
                    
                    const newSorted = sortedKeys.map(k => k === renameModal.oldVal ? newVal : k);
                    setSortedKeys(newSorted); 
                    setConfig(newConfig); 
                    onConfigUpdate(newConfig); 
                    setSelectedType(newVal);
                } else {
                    // تغییر نام آیتم در آرایه
                    const list = newConfig[renameModal.category][renameModal.listName]; 
                    const idx = list.indexOf(renameModal.oldVal); 
                    if (idx !== -1) list[idx] = newVal;
                    setConfig(newConfig); 
                    onConfigUpdate(newConfig);
                }
            }
        } catch (e) { notify.show('خطا', 'مشکل شبکه', 'error'); }
        setRenameModal({ ...renameModal, open: false });
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: افزودن دسته جدید]
    // ایجاد یک دسته‌بندی جدید با ساختار پیش‌فرض و لیست‌های خالی.
    // ------------------------------------------------------------------------------------------------
    const handleAddCategorySubmit = async (newVal) => {
        if (!newVal || config[newVal]) return setAddCategoryModal(false);
        
        // ساختار اولیه یک دسته جدید
        const newConfig = { ...config, 
            [newVal]: { 
            label: newVal, icon: 'box', 
            tolerances: [],
            units: [], packages: [], techs: [], paramOptions: [], 
            // لیست‌های اضافی جهت توسعه آینده
            list5: [], list6: [], list7: [], list8: [], list9: [], list10: [],
            paramLabel: 'Parameter', priority: 0, prefix: 'PRT' 
        }};
        
        try { 
            const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig }); 
            if (ok) { 
                setConfig(newConfig); 
                onConfigUpdate(newConfig); 
                setSortedKeys([...sortedKeys, newVal]); 
                setSelectedType(newVal); 
                notify.show('موفقیت', 'اضافه شد.', 'success'); 
            } 
        } catch(e){}
        setAddCategoryModal(false);
    };
    
    // فیلتر کردن لیست‌هایی که باید نمایش داده شوند (برای General فقط لوکیشن نمایش داده می‌شود)
    const listKeys = selectedType ? Object.keys(listLabels).filter(key => (selectedType === 'General' ? key === 'locations' : key !== 'locations')) : [];

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر پیشوند کد]
    // تابع کمکی برای آپدیت فیلد prefix (مربوط به کدینگ انبار).
    // ورودی را به حروف بزرگ تبدیل کرده و به ۳ کاراکتر محدود می‌کند.
    // ------------------------------------------------------------------------------------------------
    const handlePrefixChange = (val) => {
        if (!selectedType) return;
        const newConfig = { ...config };
        newConfig[selectedType].prefix = (val || "").toUpperCase().substring(0, 3);
        setConfig(newConfig);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ساختار اصلی JSX شامل سایدبار دسته‌ها و پنل اصلی تنظیمات لیست‌ها.
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-6 overflow-hidden h-full flex flex-col">
            {/* مودال‌های پاپ‌آپ برای تغییر نام و افزودن دسته */}
            <InputModal isOpen={renameModal.open} onClose={() => setRenameModal({ ...renameModal, open: false })} onConfirm={handleRenameSubmit} title="تغییر نام" label="نام جدید:" initialValue={renameModal.oldVal} />
            <InputModal isOpen={addCategoryModal} onClose={() => setAddCategoryModal(false)} onConfirm={handleAddCategorySubmit} title="افزودن دسته" label="نام انگلیسی:" initialValue="" />
            
            {/* هدر صفحه */}
            <header className="h-16 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white">مدیریت لیست‌ها و دسته‌بندی‌ها</h2>
                <button onClick={handleSave} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition"><i data-lucide="save" className="w-4 h-4"></i> ذخیره همه تغییرات</button>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* ---------------------------------------------------------------------------------- */}
                {/* [تگ: سایدبار دسته‌ها]                                                            */}
                {/* لیست دسته‌های موجود با قابلیت Drag & Drop و دکمه‌های ویرایش/حذف                     */}
                {/* ---------------------------------------------------------------------------------- */}
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

                {/* ---------------------------------------------------------------------------------- */}
                {/* [تگ: پنل جزئیات دسته]                                                             */}
                {/* نمایش کارت‌های تنظیمات برای هر فیلد (پکیج، تولرانس و ...) در دسته انتخاب شده        */}
                {/* ---------------------------------------------------------------------------------- */}
                <div className="col-span-12 md:col-span-8 lg:col-span-9 glass-panel rounded-2xl border border-white/10 p-6 overflow-y-auto custom-scroll">
                    {selectedType && config[selectedType] ? (
                        <>
                            {/* هدر داخلی پنل: نام دسته و اینپوت تنظیم Prefix */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-nexus-primary/20 flex items-center justify-center text-nexus-primary"><i data-lucide={config[selectedType].icon || 'box'} className="w-6 h-6"></i></div>
                                    <div><h3 className="text-xl font-bold text-white">{config[selectedType].label}</h3><p className="text-xs text-gray-500">ویرایش لیست‌های زیرمجموعه</p></div>
                                </div>
                                {selectedType !== 'General' && (
                                    <div className="flex flex-col items-end">
                                        <label className="text-[10px] text-nexus-accent font-bold uppercase tracking-widest mb-1">پیشوند کدینگ (3 کاراکتر)</label>
                                        <input 
                                            className="nexus-input w-24 px-3 py-1.5 text-center font-mono font-bold text-nexus-accent uppercase" 
                                            maxLength={3} 
                                            placeholder="ABC" 
                                            value={config[selectedType].prefix || ''} 
                                            onChange={(e) => handlePrefixChange(e.target.value)} 
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* شبکه کارت‌ها برای هر نوع لیست (مثلاً Units, Packages, ...) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {listKeys.map(listName => { 
                                    const meta = listLabels[listName] || { label: listName, icon: 'list' }; 
                                    // دریافت تنظیمات ذخیره شده برای این فیلد
                                    const fieldSettings = config[selectedType].fields?.[listName] || {};
                                    const displayLabel = fieldSettings.label || meta.label;
                                    const isRequired = !!fieldSettings.required;
                                    const isVisible = fieldSettings.visible !== false; // پیش‌فرض نمایش داده شود

                                    return (
                                        <div key={listName} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition group/card">
                                            {/* هدر کارت: تنظیمات نام و دکمه‌های وضعیت */}
                                            <div className="flex flex-col gap-2 mb-4 border-b border-white/5 pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <i data-lucide={meta.icon} className="w-4 h-4 text-nexus-accent"></i> 
                                                        {/* ورودی تغییر نام فیلد نمایشی */}
                                                        <input 
                                                            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-nexus-accent text-sm font-bold text-gray-300 focus:text-white outline-none w-full transition-colors placeholder-gray-600"
                                                            value={displayLabel}
                                                            placeholder={meta.label}
                                                            onChange={(e) => handleFieldConfigChange(listName, 'label', e.target.value)}
                                                            title="برای تغییر نام کلیک کنید"
                                                        />
                                                    </div>
                                                </div>
                                                {/* دکمه‌های کنترلی: الزامی / نمایش */}
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleFieldConfigChange(listName, 'required', !isRequired)}
                                                        className={`flex-1 text-[10px] py-1 rounded border transition font-bold ${isRequired ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                                                    >
                                                        {isRequired ? '* الزامی' : 'اختیاری'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleFieldConfigChange(listName, 'visible', !isVisible)}
                                                        className={`flex-1 text-[10px] py-1 rounded border transition font-bold ${isVisible ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}`}
                                                    >
                                                        {isVisible ? 'نمایش' : 'مخفی'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* بخش افزودن آیتم به لیست */}
                                            <div className="flex gap-2 mb-3">
                                                <input className="nexus-input flex-1 px-3 py-1.5 text-xs" placeholder="آیتم پیش‌فرض..." value={newItems[listName] || ''} onChange={(e) => setNewItems({...newItems, [listName]: e.target.value})} />
                                                <button onClick={() => handleAddItem(listName, newItems[listName])} className="bg-nexus-primary hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg"><i data-lucide="plus" className="w-4 h-4"></i></button>
                                            </div>
                                            
                                            {/* نمایش آیتم‌های موجود در لیست */}
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

// اتصال به فضای سراسری پنجره مرورگر
window.ManagementPage = ManagementPage;