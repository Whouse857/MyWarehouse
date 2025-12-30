/**
 * نام فایل: admin_management.js
 * نویسنده: سرگلی
 * نسخه: V0.20
 * * کلیات عملکرد و توابع:
 * این ماژول وظیفه مدیریت تنظیمات سیستم، لیست‌های پایه (مانند واحدها، پکیج‌ها)،
 * و پیکربندی دسته‌بندی‌های مختلف قطعات را بر عهده دارد.
 * * توابع کلیدی:
 * 1. handleDragStart/Enter/End: مدیریت عملیات Drag & Drop برای تغییر اولویت نمایش دسته‌ها.
 * 2. handleFieldConfigChange: تنظیم ویژگی‌های فیلدها (مانند الزامی بودن یا نمایش/عدم نمایش).
 * 3. handleAddItem: افزودن یک آیتم جدید به لیست‌های فرعی (مثل لیست برندها یا واحدها).
 * 4. handleDeleteItem: حذف یک آیتم از لیست‌های فرعی.
 * 5. handleSave: ارسال کل پیکربندی (Config) تغییر یافته به سرور جهت ذخیره‌سازی.
 * 6. handleDeleteCategory: حذف کامل یک دسته‌بندی (به جز دسته‌بندی عمومی).
 * 7. handleRenameSubmit: مدیریت تغییر نام دسته‌بندی‌ها یا آیتم‌های داخل لیست‌ها.
 * 8. handleAddCategorySubmit: ایجاد یک دسته‌بندی جدید با تنظیمات پیش‌فرض.
 * 9. handlePrefixChange: تغییر پیشوند ۳ حرفی کدینگ برای دسته‌بندی انتخاب شده.
 */

const { useState, useEffect, useRef } = React;

const ManagementPage = ({ globalConfig, onConfigUpdate }) => {
    // =========================================================================
    // بخش منطق و توابع (LOGIC & FUNCTIONS)
    // =========================================================================

    const [sortedKeys, setSortedKeys] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [config, setConfig] = useState(globalConfig || {});
    const [newItems, setNewItems] = useState({});
    const [renameModal, setRenameModal] = useState({ open: false, type: '', oldVal: '', category: '', listName: '' });
    const [addCategoryModal, setAddCategoryModal] = useState(false);
    const dragItem = useRef();
    const dragOverItem = useRef();

    const notify = useNotify();
    const dialog = useDialog();

    useEffect(() => {
        if (globalConfig && Object.keys(globalConfig).length > 0) {
            setConfig(globalConfig);
            const keys = Object.keys(globalConfig);
            const sorted = keys.sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0));
            setSortedKeys(sorted);
            if (!selectedType && sorted.length > 0) setSelectedType(sorted[0]);
        }
    }, [globalConfig]);

    if (typeof useLucide === 'function') {
        useLucide([selectedType, config, sortedKeys]);
    }

    // =========================================================================
    /**
     * گروه توابع: Drag & Drop
     * کارایی: مدیریت جابجایی دسته‌بندی‌ها برای تعیین اولویت نمایش
     */
    // =========================================================================
    const handleDragStart = (e, position) => { dragItem.current = position; e.target.classList.add('opacity-50'); };
    const handleDragEnter = (e, position) => { dragOverItem.current = position; const copyListItems = [...sortedKeys]; const dragItemContent = copyListItems[dragItem.current]; copyListItems.splice(dragItem.current, 1); copyListItems.splice(dragOverItem.current, 0, dragItemContent); dragItem.current = position; setSortedKeys(copyListItems); };
    const handleDragEnd = (e) => { e.target.classList.remove('opacity-50'); dragItem.current = null; dragOverItem.current = null; const newConfig = { ...config }; sortedKeys.forEach((key, index) => { if (newConfig[key]) newConfig[key].priority = sortedKeys.length - index; }); setConfig(newConfig); };

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

    // =========================================================================
    /**
     * نام تابع: handleFieldConfigChange
     * کارایی: تغییر تنظیمات یک فیلد خاص (نمایش/مخفی، الزامی/اختیاری، نام فیلد)
     */
    // =========================================================================
    const handleFieldConfigChange = (listName, key, value) => {
        if ((key === 'visible' && value === true) || (key === 'required' && value === true)) {
            const currentList = config[selectedType][listName] || [];
            if (currentList.length === 0) {
                notify.show('لیست خالی است', `ابتدا باید حداقل یک آیتم برای این فیلد تعریف کنید تا بتوانید آن را فعال یا الزامی نمایید.`, 'error');
                return;
            }
        }
        const newConfig = { ...config };
        if (!newConfig[selectedType].fields) newConfig[selectedType].fields = {};
        if (!newConfig[selectedType].fields[listName]) newConfig[selectedType].fields[listName] = {};
        newConfig[selectedType].fields[listName][key] = value;
        if (key === 'required' && value === true) newConfig[selectedType].fields[listName]['visible'] = true;
        if (key === 'visible' && value === false) newConfig[selectedType].fields[listName]['required'] = false;
        setConfig(newConfig);
    };

    // =========================================================================
    /**
     * نام تابع: handleAddItem
     * کارایی: افزودن یک مقدار جدید به لیست‌های فرعی (مانند اضافه کردن یک واحد جدید)
     */
    // =========================================================================
    const handleAddItem = (listName, value) => {
        if (!value || !value.trim()) return;
        const newConfig = { ...config };
        if (!newConfig[selectedType][listName]) newConfig[selectedType][listName] = [];
        if (!newConfig[selectedType][listName].includes(value)) { newConfig[selectedType][listName].push(value); setConfig(newConfig); setNewItems({ ...newItems, [listName]: '' }); }
    };
    
    // =========================================================================
    /**
     * نام تابع: handleDeleteItem
     * کارایی: حذف یک مقدار از لیست‌های فرعی
     */
    // =========================================================================
    const handleDeleteItem = (listName, value) => { const newConfig = { ...config }; newConfig[selectedType][listName] = newConfig[selectedType][listName].filter(item => item !== value); setConfig(newConfig); };

    // =========================================================================
    /**
     * نام تابع: handleSave
     * کارایی: ذخیره نهایی تمام تغییرات اعمال شده در تنظیمات روی سرور
     */
    // =========================================================================
    const handleSave = async () => {
        if (await dialog.ask("ذخیره تنظیمات", "آیا از ذخیره تغییرات اطمینان دارید؟", "warning")) {
            try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: config }); if (ok) { onConfigUpdate(config); notify.show('موفقیت', "تنظیمات ذخیره شد.", 'success'); } } catch (e) { notify.show('خطا', "مشکل شبکه", 'error'); }
        }
    };

    // =========================================================================
    /**
     * نام تابع: handleDeleteCategory
     * کارایی: حذف کامل یک دسته‌بندی قطعه (Category)
     */
    // =========================================================================
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

    // =========================================================================
    /**
     * نام تابع: handleRenameSubmit
     * کارایی: نهایی کردن تغییر نام (برای دسته‌بندی‌ها یا آیتم‌ها) و ارسال به سرور
     */
    // =========================================================================
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

    // =========================================================================
    /**
     * نام تابع: handleAddCategorySubmit
     * کارایی: ایجاد یک دسته‌بندی جدید با مقادیر پیش‌فرض
     */
    // =========================================================================
    const handleAddCategorySubmit = async (newVal) => {
        if (!newVal || config[newVal]) return setAddCategoryModal(false);
        const newConfig = { ...config, 
            [newVal]: { 
            label: newVal, icon: 'box', 
            tolerances: [],
            units: [], packages: [], techs: [], paramOptions: [], 
            list5: [], list6: [], list7: [], list8: [], list9: [], list10: [],
            paramLabel: 'Parameter', priority: 0, prefix: 'PRT' 
        }};
        try { const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig }); if (ok) { setConfig(newConfig); onConfigUpdate(newConfig); setSortedKeys([...sortedKeys, newVal]); setSelectedType(newVal); notify.show('موفقیت', 'اضافه شد.', 'success'); } } catch(e){}
        setAddCategoryModal(false);
    };
    
    const listKeys = selectedType ? Object.keys(listLabels).filter(key => (selectedType === 'General' ? key === 'locations' : key !== 'locations')) : [];

    // =========================================================================
    /**
     * نام تابع: handlePrefixChange
     * کارایی: به‌روزرسانی پیشوند ۳ کاراکتری کدینگ برای دسته‌بندی انتخاب شده
     */
    // =========================================================================
    const handlePrefixChange = (val) => {
        if (!selectedType) return;
        const newConfig = { ...config };
        newConfig[selectedType].prefix = (val || "").toUpperCase().substring(0, 3);
        setConfig(newConfig);
    };

    // =========================================================================
    // بخش نمایش و رابط کاربری (VIEW / UI)
    // =========================================================================
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {listKeys.map(listName => { 
    const meta = listLabels[listName] || { label: listName, icon: 'list' }; 
    const fieldSettings = config[selectedType].fields?.[listName] || {};
    const displayLabel = fieldSettings.label || meta.label;
    const isRequired = !!fieldSettings.required;
    const isVisible = fieldSettings.visible !== false;

    return (
        <div key={listName} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition group/card">
            <div className="flex flex-col gap-2 mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        <i data-lucide={meta.icon} className="w-4 h-4 text-nexus-accent"></i> 
                        <input 
                            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-nexus-accent text-sm font-bold text-gray-300 focus:text-white outline-none w-full transition-colors placeholder-gray-600"
                            value={displayLabel}
                            placeholder={meta.label}
                            onChange={(e) => handleFieldConfigChange(listName, 'label', e.target.value)}
                            title="برای تغییر نام کلیک کنید"
                        />
                    </div>
                </div>
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

            <div className="flex gap-2 mb-3">
                <input className="nexus-input flex-1 px-3 py-1.5 text-xs" placeholder="آیتم پیش‌فرض..." value={newItems[listName] || ''} onChange={(e) => setNewItems({...newItems, [listName]: e.target.value})} />
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

window.ManagementPage = ManagementPage;