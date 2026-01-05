// ====================================================================================================
// نسخه: 0.20
// فایل: admin management.jsx
// توضیح: این فایل مسئول نمایش ظاهر (JSX) است و منطق را از هوک دریافت می‌کند.
// نکته: پسوند این فایل به jsx تغییر یافته تا نشان‌دهنده ماهیت React آن باشد.
// ====================================================================================================

// اطمینان از دسترسی به React برای پردازش JSX
const React = window.React;

const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: اتصال به منطق]
    // فراخوانی هوک منطق برای دریافت داده‌ها و توابع مورد نیاز
    // ------------------------------------------------------------------------------------------------
    const {
        sortedKeys, selectedType, config, newItems, renameModal, addCategoryModal, listLabels, listKeys,
        setSelectedType, setRenameModal, setAddCategoryModal, setNewItems,
        handleDragStart, handleDragEnter, handleDragEnd,
        handleFieldConfigChange, handleAddItem, handleDeleteItem,
        handleItemDragStart, handleItemDragEnter, handleItemDragEnd,
        handleSave, handleDeleteCategory, handleRenameSubmit, handleAddCategorySubmit, handlePrefixChange
    } = window.useAdminManagementLogic({ globalConfig, onConfigUpdate });

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
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
                                                            <button onClick={() => setRenameModal({ open: true, type: 'item', oldVal: item, category: selectedType, listName })} className="text-blue-400 hover:text-blue-300"><i data-lucide="pencil" className="w-3 h-3"></i></button>
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