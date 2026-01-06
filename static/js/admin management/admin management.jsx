// ====================================================================================================
// نسخه: 0.28 (نهایی - رابط کاربری کامل با پشتیبانی از اعداد و تاریخ فارسی)
// فایل: admin management.jsx
// توضیح: این فایل مسئول نمایش ظاهر (JSX) است و منطق را از هوک دریافت می‌کند.
// ====================================================================================================

// اطمینان از دسترسی به React برای پردازش JSX
const React = window.React;

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی فرمت‌دهی]
// این توابع صرفاً جهت نمایش هستند و داده‌های اصلی را تغییر نمی‌دهند.
// ----------------------------------------------------------------------------------------------------

const toPersianDigits = (str) => {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
};

const toEnglishDigits = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]) // تبدیل اعداد فارسی
        .replace(/,/g, ''); // حذف کاما (برای قیمت)
};

const addCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ترکیب توابع برای نمایش قیمت: عدد انگلیسی -> کاما -> عدد فارسی
const formatPriceDisplay = (val) => {
    if (!val && val !== 0) return '';
    // مطمئن شویم ورودی تمیز است
    const cleanEn = toEnglishDigits(val);
    const withComma = addCommas(cleanEn);
    return toPersianDigits(withComma);
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت‌های کمکی داخلی]
// تعریف مودال‌ها در همین فایل برای تضمین ظاهر و عملکرد صحیح کلیدهای میانبر
// ----------------------------------------------------------------------------------------------------
const CustomModal = ({ isOpen, onClose, onConfirm, title, label, value, onChange, placeholder }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl animate-zoom-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><i data-lucide="x" className="w-5 h-5"></i></button>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-400 mb-2">{label}</label>
                    <input 
                        autoFocus
                        className="nexus-input w-full px-4 py-2 text-sm rounded-xl bg-black/30 border-white/10 text-white focus:border-nexus-primary"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') onConfirm(value);
                            if (e.key === 'Escape') onClose();
                        }}
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 text-sm font-bold transition">انصراف</button>
                    <button onClick={() => onConfirm(value)} className="flex-1 py-2 rounded-xl bg-nexus-primary text-white hover:bg-indigo-600 text-sm font-bold transition shadow-lg">تایید</button>
                </div>
            </div>
        </div>
    );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="glass-panel w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl animate-zoom-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4 text-red-400">
                    <div className="bg-red-500/10 p-2 rounded-full"><i data-lucide="alert-triangle" className="w-6 h-6"></i></div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                </div>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 text-sm font-bold transition">انصراف</button>
                    <button onClick={onConfirm} className="flex-1 py-2 rounded-xl bg-red-500/80 text-white hover:bg-red-600 text-sm font-bold transition shadow-lg">حذف شود</button>
                </div>
            </div>
        </div>
    );
};

const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: اتصال به منطق]
    // فراخوانی هوک منطق برای دریافت داده‌ها و توابع مورد نیاز
    // ------------------------------------------------------------------------------------------------
    const {
        sortedKeys, selectedType, config, newItems, listLabels, listKeys, onlineRateData,
        // مودال‌ها و مقادیر
        renameModal, addCategoryModal, deleteCategoryModal, inputValue,
        deleteItemModal, 
        // توابع
        setSelectedType, setNewItems, setInputValue,
        handleDragStart, handleDragEnter, handleDragEnd,
        handleFieldConfigChange, handleAddItem, handleDeleteItem,
        handleItemDragStart, handleItemDragEnter, handleItemDragEnd,
        handleSave, handleDeleteCategory, handleRenameSubmit, handleAddCategorySubmit, handlePrefixChange,
        handleManualUsdChange, applyOnlineToManual, // اضافه شده
        openRenameModal, openAddCategoryModal, confirmDeleteCategory, confirmDeleteItem,
        setRenameModal, setAddCategoryModal, setDeleteCategoryModal, setDeleteItemModal 
    } = window.useAdminManagementLogic({ globalConfig, onConfigUpdate });

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-6 overflow-hidden h-full flex flex-col">
            {/* مودال‌های پاپ‌آپ اصلاح شده با قابلیت پشتیبانی از Enter/Esc */}
            <CustomModal 
                isOpen={renameModal.open} 
                onClose={() => setRenameModal({ ...renameModal, open: false })} 
                onConfirm={handleRenameSubmit} 
                title="تغییر نام" 
                label="نام جدید:" 
                value={inputValue} 
                onChange={setInputValue} 
            />
            
            <CustomModal 
                isOpen={addCategoryModal} 
                onClose={() => setAddCategoryModal(false)} 
                onConfirm={handleAddCategorySubmit} 
                title="افزودن دسته" 
                label="نام انگلیسی:" 
                value={inputValue} 
                onChange={setInputValue} 
                placeholder="ExampleCategory"
            />

            <ConfirmModal
                isOpen={deleteCategoryModal.open}
                onClose={() => setDeleteCategoryModal({ open: false, key: '' })}
                onConfirm={confirmDeleteCategory}
                title="حذف دسته‌بندی"
                message={`آیا از حذف دسته‌بندی "${deleteCategoryModal.key ? config[deleteCategoryModal.key]?.label : ''}" و تمام محتویات آن اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
            />

            {/* مودال جدید برای حذف آیتم با توضیحات دقیق */}
            <ConfirmModal
                isOpen={deleteItemModal.open}
                onClose={() => setDeleteItemModal({ ...deleteItemModal, open: false })}
                onConfirm={confirmDeleteItem}
                title="حذف آیتم"
                message={`آیا از حذف آیتم «${deleteItemModal.value}» از لیست «${listLabels[deleteItemModal.listName]?.label || deleteItemModal.listName}» مربوط به دسته «${config[selectedType]?.label}» اطمینان دارید؟`}
            />
            
            {/* هدر صفحه */}
            <header className="h-16 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white">مدیریت لیست‌ها و دسته‌بندی‌ها</h2>
                <button onClick={handleSave} className="bg-nexus-success hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition"><i data-lucide="save" className="w-4 h-4"></i> ذخیره همه تغییرات</button>
            </header>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* ---------------------------------------------------------------------------------- */}
                {/* [تگ: سایدبار دسته‌ها]                                                            */}
                {/* ---------------------------------------------------------------------------------- */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center"><span className="text-sm font-bold text-gray-300">ترتیب دسته‌ها</span><button onClick={openAddCategoryModal} className="text-xs bg-nexus-primary hover:bg-indigo-600 text-white px-2 py-1 rounded transition flex items-center gap-1"><i data-lucide="plus" className="w-3 h-3"></i> افزودن</button></div>
                    <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1.5">
                        {sortedKeys.map((key, index) => (
                            <div key={key} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={() => setSelectedType(key)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${selectedType === key ? 'bg-nexus-primary/20 border-nexus-primary text-white' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}>
                                <div className="flex items-center gap-3"><div className="cursor-grab text-gray-600 hover:text-gray-400 p-1"><i data-lucide="grip-vertical" className="w-4 h-4"></i></div><span className="font-bold text-sm truncate max-w-[120px]">{config[key].label}</span></div>
                                {key !== 'General' && <div className="flex items-center gap-1"><button onClick={(e) => { e.stopPropagation(); openRenameModal('category', key, key); }} className="text-blue-400 p-1.5"><i data-lucide="pencil" className="w-3.5 h-3.5"></i></button><button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(key); }} className="text-red-400 p-1.5"><i data-lucide="trash-2" className="w-3.5 h-3.5"></i></button></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ---------------------------------------------------------------------------------- */}
                {/* [تگ: پنل جزئیات دسته]                                                             */}
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
                            
                            {/* [تگ: بخش تنظیمات نرخ دلار در General] - اصلاح شده برای فارسی‌سازی */}
                            {selectedType === 'General' && (
                                <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <i data-lucide="dollar-sign" className="w-5 h-5 text-green-400"></i>
                                        <h4 className="text-sm font-bold text-white">تنظیمات نرخ مرجع (آفلاین)</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-1">قیمت دستی دلار (تومان)</label>
                                            <input 
                                                type="text" 
                                                className="nexus-input w-full px-3 py-2 text-sm bg-black/30 border-white/10 focus:border-green-400 text-left font-bold tracking-wider" 
                                                /* نمایش: تبدیل به فارسی و سه رقم سه رقم */
                                                value={formatPriceDisplay(config['General'].manual_usd_price || '')}
                                                /* ذخیره: تبدیل به انگلیسی خالص و ارسال به لاجیک */
                                                onChange={(e) => handleManualUsdChange(toEnglishDigits(e.target.value), 'price')}
                                                placeholder="۶۰,۰۰۰"
                                                dir="ltr"
                                            />
                                            {/* متن پیشنهاد دهنده با اعداد فارسی */}
                                            {onlineRateData && (
                                                <div 
                                                    className="mt-1 text-[10px] text-gray-500/70 hover:text-green-300 transition-colors cursor-pointer flex items-center gap-1"
                                                    onClick={applyOnlineToManual}
                                                    title="کلیک کنید تا جایگزین شود"
                                                >
                                                    <i data-lucide="arrow-up-circle" className="w-3 h-3"></i>
                                                    آخرین نرخ آنلاین: {formatPriceDisplay(onlineRateData.price)} تومان ({toPersianDigits(onlineRateData.date)})
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 block mb-1">تاریخ بروزرسانی دستی</label>
                                            <input 
                                                type="text" 
                                                className="nexus-input w-full px-3 py-2 text-sm bg-black/30 border-white/10 focus:border-green-400 text-center font-bold" 
                                                /* نمایش و ورودی: تبدیل به فارسی */
                                                value={toPersianDigits(config['General'].manual_usd_date || '')}
                                                onChange={(e) => handleManualUsdChange(toEnglishDigits(e.target.value), 'date')}
                                                placeholder="۱۴۰۳/xx/xx"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                                <input 
                                                    className="nexus-input flex-1 px-3 py-1.5 text-xs" 
                                                    placeholder="آیتم پیش‌فرض..." 
                                                    value={newItems[listName] || ''} 
                                                    onChange={(e) => setNewItems({...newItems, [listName]: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(listName, newItems[listName])}
                                                />
                                                <button onClick={() => handleAddItem(listName, newItems[listName])} className="bg-nexus-primary hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg"><i data-lucide="plus" className="w-4 h-4"></i></button>
                                            </div>
                                            
                                            {/* نمایش آیتم‌های موجود در لیست */}
                                            <div 
                                                className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 custom-scroll"
                                                onDragOver={(e) => e.preventDefault()}
                                            >
                                                {(config[selectedType][listName] || []).map((item, idx) => (
                                                    <div 
                                                        key={`${selectedType}-${listName}-${item}-${idx}`}
                                                        draggable
                                                        onDragStart={(e) => handleItemDragStart(e, idx)}
                                                        onDragEnter={() => handleItemDragEnter(listName, idx)}
                                                        onDragEnd={handleItemDragEnd}
                                                        className="flex items-center gap-2 bg-white/5 pl-1 pr-2.5 py-1.5 rounded-lg border border-white/5 group hover:bg-white/10 transition"
                                                    >
                                                        <div className="text-gray-700 group-hover:text-gray-400 transition-colors cursor-grab pointer-events-none">
                                                            <i data-lucide="grip-vertical" className="w-3.5 h-3.5"></i>
                                                        </div>

                                                        <span className="text-xs text-gray-300 font-mono pointer-events-none flex-1">{item}</span>
                                                        <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                            <button onClick={() => openRenameModal('item', item, selectedType, listName)} className="text-blue-400 hover:text-blue-300"><i data-lucide="pencil" className="w-3 h-3"></i></button>
                                                            <button onClick={() => handleDeleteItem(listName, item)} className="text-red-400 hover:text-red-300"><i data-lucide="trash-2" className="w-3 h-3"></i></button>
                                                        </div>
                                                    </div>
                                                ))}
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