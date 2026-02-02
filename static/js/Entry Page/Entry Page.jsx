// ====================================================================================================
// نسخه: 0.27
// فایل: EntryPage.jsx
// تغییرات: 
// - اضافه شدن حالت Empty State برای جلوگیری از بریده شدن پاپ‌آپ فیلتر در زمان نبود نتیجه.
// - بهینه‌سازی z-index و دسترسی‌های فیلتر.
// ====================================================================================================

const { useState, useEffect, useRef } = React;
const { useEntryPageLogic, getPartCode, DYNAMIC_FIELDS_MAP } = window;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت پاپ‌آپ فیلتر]
// ----------------------------------------------------------------------------------------------------
const FilterPopup = ({ title, children, onClear, width }) => {
    return (
        <div className="filter-popup" style={width ? {width} : {}} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-nexus-accent">{title}</span>
                <button onClick={onClear} className="text-[10px] text-gray-500 hover:text-red-400 transition">پاک کردن</button>
            </div>
            <div className="custom-scroll max-h-[300px] overflow-y-auto pr-1">
                {children}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: نوار فیلترهای فعال]
// ----------------------------------------------------------------------------------------------------
const ActiveFiltersBar = ({ codeFilter, specConditions, onClearCode, onRemoveSpec }) => {
    const hasCode = codeFilter && codeFilter.trim() !== '';
    const activeSpecs = specConditions.filter(c => c.value && c.value.trim() !== '');

    if (!hasCode && activeSpecs.length === 0) return null;

    return (
        <div className="active-filters-bar animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] text-gray-400 ml-2">فیلترهای فعال:</span>
            
            {hasCode && (
                <div className="filter-chip">
                    <span className="label">کد:</span>
                    <span className="value font-mono dir-ltr">{codeFilter}</span>
                    <button onClick={onClearCode}><i data-lucide="x" className="w-2.5 h-2.5"></i></button>
                </div>
            )}

            {activeSpecs.map((spec, idx) => (
                <div key={spec.id} className="filter-chip">
                    {idx > 0 && <span className="text-[9px] text-gray-500 mx-1">({spec.logic})</span>}
                    <span className="label">شامل:</span>
                    <span className="value font-mono dir-ltr">{spec.value}</span>
                    <button onClick={() => onRemoveSpec(spec.id)}><i data-lucide="x" className="w-2.5 h-2.5"></i></button>
                </div>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: مودال خلاصه]
// ----------------------------------------------------------------------------------------------------
const SummaryModal = ({ isOpen, onClose, onConfirm, data, globalConfig }) => {
    if (!isOpen) return null;
    const fullCode = getPartCode(data, globalConfig);
    
    return (
        <ModalOverlay>
            <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-white mb-4 text-center border-b border-white/10 pb-3">پیش‌نمایش ثبت قطعه</h3>
                <div className="space-y-3 text-sm text-gray-300 mb-6">
                    <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                        <span className="text-blue-300 font-bold">کد ۱۲ کاراکتری:</span> 
                        <span className="text-white font-black font-mono tracking-widest">{fullCode}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>نوع:</span> <span className="text-white font-bold">{data.type}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>مقدار:</span> <span className="text-white font-bold ltr font-mono">{data.val} {data.unit}</span></div>
                    {data.pkg && <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>پکیج:</span> <span className="text-white font-bold">{data.pkg}</span></div>}
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>تعداد:</span> <span className="text-emerald-400 font-bold ltr font-mono">{data.qty}</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>قیمت کل:</span> <span className="text-amber-400 font-bold ltr font-mono">{data.price_toman} تومان</span></div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>فروشنده:</span> <span className="text-blue-300 font-bold">{data.vendor_name}</span></div>
                    <div className="flex justify-between items-center"><span>محل نگهداری:</span> <span className="text-orange-300 font-bold">{data.location}</span></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5">بازگشت و اصلاح</button>
                    <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white font-bold transition shadow-lg shadow-indigo-500/20">تایید و ثبت نهایی</button>
                </div>
            </div>
        </ModalOverlay>
    );
};

const SearchableDropdown = ({ label, value, options, onChange, disabled, placeholder, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef(null);
    const notify = useNotify();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => { setSearchTerm(value || ""); }, [value]);

    const filteredOptions = (options || []).filter(item => 
        String(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBlur = () => {
        setTimeout(() => {
            const exactMatch = (options || []).find(opt => String(opt) === searchTerm);
            if (searchTerm && !exactMatch) {
                notify.show('خطای انتخاب', `مقدار "${searchTerm}" در لیست مجاز نیست.`, 'error');
                onChange("");
                setSearchTerm("");
            }
            setIsOpen(false);
        }, 200);
    };

    return (
        <div className="relative flex-1" ref={wrapperRef}>
            <label className={`block text-[10px] font-bold mb-1 pr-1 ${error ? 'text-red-400' : 'text-gray-500'}`}>{label}</label>
            <div className="relative">
                <input
                    type="text"
                    className={`nexus-input w-full px-3 py-2 text-sm transition-all ${error ? '!border-red-500 focus:!border-red-500 bg-red-500/10 placeholder-red-300/50' : 'bg-black/20 border-white/10 focus:border-nexus-primary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={handleBlur}
                    placeholder={placeholder || "انتخاب..."}
                    disabled={disabled}
                    dir="rtl"
                />
                <div className={`absolute left-2 top-2.5 pointer-events-none ${error ? 'text-red-400' : 'text-gray-500'}`}>
                    <i data-lucide="chevron-down" className="w-4 h-4"></i>
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto custom-scroll bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((item, idx) => (
                            <div 
                                key={idx}
                                onClick={() => { onChange(item); setSearchTerm(item); setIsOpen(false); }}
                                className="px-3 py-2 text-sm text-gray-300 hover:bg-nexus-primary/20 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0 font-mono"
                            >
                                {item}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-red-400 text-center bg-red-500/5">یافت نشد</div>
                    )}
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت اصلی]
// ----------------------------------------------------------------------------------------------------
const EntryPage = (props) => {
    const logic = useEntryPageLogic(props);
    const { 
        formData, setFormData, partsList, 
        codeFilter, setCodeFilter,
        specConditions, addSpecCondition, removeSpecCondition, updateSpecCondition, toggleSpecLogic,
        activeFilterPopup, toggleFilterPopup, clearFilterGroup,
        errors, setErrors,
        showSummary, setShowSummary,
        linkInput, setLinkInput,
        duplicates, filteredParts,
        vendorOptions, locationOptions, currentConfig,
        handleChange, preventNonNumeric, handleAddLink, handleRemoveLink,
        handleSubmit, handleFinalSubmit, handleEdit, handleDelete, getLabel, isVisible
    } = logic;

    const { serverStatus, globalConfig } = props;

    return (
        <ErrorBoundary>
            <div className="entry-page-container">
                <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} onConfirm={handleFinalSubmit} data={formData} globalConfig={globalConfig} />
                
                <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 bg-black/20 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3"><span className="text-xs text-nexus-accent font-bold">تعداد قطعات موجود: {partsList.length}</span><div className="w-2 h-2 rounded-full bg-nexus-primary animate-pulse"></div></div>
                </header>
                
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-12 gap-6">
                        
                        {/* --- ستون لیست قطعات --- */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col order-2 lg:order-1">
                            <div className="glass-panel rounded-2xl flex flex-col relative min-h-[450px]">
                                
                                {/* نوار فیلترهای فعال */}
                                <ActiveFiltersBar 
                                    codeFilter={codeFilter} 
                                    specConditions={specConditions} 
                                    onClearCode={() => clearFilterGroup('code')}
                                    onRemoveSpec={removeSpecCondition}
                                />

                                {/* هدر لیست */}
                                <div className="grid grid-cols-12 gap-2 bg-black/30 p-3 border-b border-white/5 text-[11px] text-gray-400 font-bold items-center sticky top-0 z-20">
                                    
                                    {/* ستون کد اختصاصی */}
                                    <div className="col-span-2 text-right pr-2 flex items-center gap-2 relative">
                                        <span>کد اختصاصی</span>
                                        <div 
                                            className={`filter-icon-btn ${activeFilterPopup === 'code' ? 'active' : ''} ${codeFilter ? 'has-value' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); toggleFilterPopup('code'); }}
                                        >
                                            <i data-lucide="filter" className="w-3.5 h-3.5"></i>
                                        </div>
                                        {activeFilterPopup === 'code' && (
                                            <FilterPopup title="جستجوی کد" onClear={() => clearFilterGroup('code')}>
                                                <input className="nexus-input w-full px-2 py-1.5 text-xs" autoFocus placeholder="جستجو..." value={codeFilter} onChange={e => setCodeFilter(e.target.value)} />
                                            </FilterPopup>
                                        )}
                                    </div>

                                    {/* ستون مشخصات فنی (سیستم پیشرفته) */}
                                    <div className="col-span-5 text-right flex items-center gap-2 relative">
                                        <span>مشخصات فنی</span>
                                        <div 
                                            className={`filter-icon-btn ${activeFilterPopup === 'specs' ? 'active' : ''} ${specConditions.some(c => c.value && c.value.trim() !== '') ? 'has-value' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); toggleFilterPopup('specs'); }}
                                        >
                                            <i data-lucide="filter" className="w-3.5 h-3.5"></i>
                                        </div>
                                        {activeFilterPopup === 'specs' && (
                                            <FilterPopup title="جستجوی پیشرفته مشخصات" width="300px" onClear={() => clearFilterGroup('specs')}>
                                                
                                                {/* لیست شرط‌ها */}
                                                {specConditions.map((cond, index) => (
                                                    <div key={cond.id} className="condition-row">
                                                        
                                                        {/* دکمه اتصال منطقی (فقط بین شرط‌ها) */}
                                                        {index > 0 && (
                                                            <div className="condition-connector">
                                                                <button 
                                                                    className={`logic-btn ${cond.logic.toLowerCase()}`}
                                                                    onClick={(e) => { e.stopPropagation(); toggleSpecLogic(cond.id); }}
                                                                >
                                                                    {cond.logic}
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="relative">
                                                            {/* کادر جستجو */}
                                                            <input 
                                                                className="nexus-input w-full px-2 py-1.5 pl-8 text-xs" 
                                                                placeholder={index === 0 ? "مثلاً: 100k 0805" : "شرط بعدی..."}
                                                                value={cond.value} 
                                                                onChange={e => updateSpecCondition(cond.id, e.target.value)}
                                                                autoFocus={index === specConditions.length - 1} 
                                                            />
                                                            
                                                            {/* دکمه حذف سطر (اگر بیشتر از یکی باشد) */}
                                                            {specConditions.length > 1 && (
                                                                <button 
                                                                    className="remove-condition-btn" 
                                                                    onClick={(e) => { e.stopPropagation(); removeSpecCondition(cond.id); }}
                                                                    title="حذف این شرط"
                                                                >
                                                                    <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* دکمه افزودن شرط جدید */}
                                                <button 
                                                    className="add-condition-btn mt-2" 
                                                    onClick={(e) => { e.stopPropagation(); addSpecCondition(); }}
                                                >
                                                    <i data-lucide="plus" className="w-3.5 h-3.5"></i>
                                                    <span>افزودن شرط جدید</span>
                                                </button>

                                            </FilterPopup>
                                        )}
                                    </div>
                                    
                                    <div className="col-span-1 text-center">تعداد</div>
                                    <div className="col-span-2 text-center">قیمت</div>
                                    <div className="col-span-2 text-center">عملیات</div>
                                </div>
                                
                                {/* بدنه لیست */}
                                <div className="p-2 space-y-2 flex-1">
                                    {filteredParts.length > 0 ? (
                                        filteredParts.map(p => {
                                            const pCode = getPartCode(p, globalConfig);
                                            return (
                                                <div key={p.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all ${formData.id === p.id ? 'bg-nexus-primary/10 !border-nexus-primary/50' : ''}`}>
                                                    <div className="col-span-2 text-right text-nexus-accent font-mono text-[14px] font-bold tracking-tighter">{pCode}</div>
                                                    <div className="col-span-5 text-right flex flex-col justify-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white text-lg font-black ltr font-sans tracking-wide">{p.val}</span>
                                                            <span className="text-xs text-nexus-accent font-bold px-1.5 py-0.5 bg-nexus-accent/10 rounded">{p.package}</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 items-center">
                                                            {p.type && <span className="text-blue-300 font-bold">{p.type}</span>}
                                                            {p.watt && <span className="flex items-center gap-1"><i data-lucide="zap" className="w-3 h-3 text-yellow-500"></i>{p.watt}</span>}
                                                            {p.tolerance && <span className="text-purple-400 font-bold">{p.tolerance}</span>}
                                                            {p.tech && <span className="text-gray-500 border-x border-gray-700 px-2">{p.tech}</span>}
                                                            {p.storage_location && <span className="flex items-center gap-1 text-orange-300 bg-orange-500/10 px-1 rounded border border-orange-500/20"><i data-lucide="map-pin" className="w-3 h-3"></i>{p.storage_location}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${p.quantity < p.min_quantity ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{p.quantity}</span></div>
                                                    <div className="col-span-2 text-center text-xs text-amber-400 ltr font-mono">{(p.toman_price||0).toLocaleString()}</div>
                                                    <div className="col-span-2 flex justify-center gap-3">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} disabled={!serverStatus} title="ویرایش" className="w-9 h-9 rounded-full bg-nexus-primary/20 text-nexus-primary hover:bg-nexus-primary hover:text-white flex items-center justify-center transition-all shadow-lg hover:shadow-primary/50 disabled:opacity-30 disabled:cursor-not-allowed"><i data-lucide="pencil" className="w-5 h-5"></i></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} disabled={!serverStatus} title="حذف" className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"><i data-lucide="trash-2" className="w-5 h-5"></i></button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4 opacity-40 animate-in fade-in zoom-in-95">
                                            <i data-lucide="search-x" className="w-16 h-16"></i>
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm font-bold">نتیجه‌ای یافت نشد</span>
                                                <span className="text-[10px]">شرط‌های جستجو را تغییر دهید</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- ستون فرم ورود --- */}
                        <div className="col-span-12 lg:col-span-4 h-full order-1 lg:order-2">
                            <div className="glass-panel border-white/10 rounded-2xl p-5 h-full flex flex-col shadow-2xl relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-primary to-purple-600"></div>
                                <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between"><span>{formData.id ? 'ویرایش قطعه' : 'ثبت قطعه جدید'}</span>{formData.id && <button onClick={() => setFormData({id: null, val: "", unit: (currentConfig.units && currentConfig.units[0]) || "", watt: "", tol: "", pkg: "", type: formData.type, date: getJalaliDate(), qty: "", price_toman: "", usd_rate: "", reason: "", min_qty: "", vendor_name: "", location: "", tech: "", purchase_links: []})} className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition">انصراف</button>}</h2>
                                
                                {duplicates.length > 0 && !formData.id && (
                                    <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 mb-3 text-yellow-400 font-bold text-sm border-b border-yellow-500/10 pb-2">
                                            <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                                            <span>هشدار: قطعات مشابه یافت شد</span>
                                            <span className="text-[10px] bg-yellow-500/20 px-2 py-0.5 rounded-full text-yellow-300 mr-auto">{duplicates.length} مورد</span>
                                        </div>
                                        <div className="grid gap-3 max-h-60 overflow-y-auto pr-1 custom-scroll">
                                            {duplicates.map(d => (
                                                <div key={d.id} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-yellow-500/30"></div>
                                                    <div className="flex justify-between items-start mb-2 pr-3">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-bold text-sm">{d.val} {d.unit}</span>
                                                                <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 rounded">{d.package}</span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                                                                <span className="flex items-center gap-1.5"><i data-lucide="map-pin" className="w-3 h-3 text-orange-400"></i><span className="text-gray-300">{d.storage_location}</span></span>
                                                                <span className="flex items-center gap-1.5"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i><span>{d.vendor_name || 'فروشنده نامشخص'}</span></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1"><span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg">{d.quantity} عدد</span><span className="text-amber-500/60 text-[10px] font-mono ltr">{formatNumberWithCommas(d.toman_price)} T</span></div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 pr-3">
                                                        <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{d.tech || d.reason || '-'}</span>
                                                        <button onClick={() => handleEdit(d)} className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/5"><span>انتخاب و ادغام</span><i data-lucide="check-circle-2" className="w-3.5 h-3.5"></i></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-4 pl-1 pr-1">
                                    <div className="flex flex-col"><label className="text-nexus-accent text-xs mb-1 block font-bold">دسته‌بندی قطعه (Component Type)</label>
                                        <div className="relative">
                                            <select value={formData.type} onChange={e=>handleChange('type', e.target.value)} disabled={!serverStatus} className="nexus-input w-full px-3 py-2 text-sm appearance-none cursor-pointer font-bold text-yellow-400 bg-slate-900/80 border-nexus-accent/30">
                                                {Object.keys(globalConfig)
                                                    .filter(key => key !== 'General')
                                                    .sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0))
                                                    .map(key => <option key={key} value={key}>{globalConfig[key].label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <div className="flex gap-3">
                                        <NexusInput label="مقدار (Value) *" value={formData.val} onChange={e=>handleChange('val', e.target.value)} placeholder="مثلا 100" className="flex-1" disabled={!serverStatus} dir="rtl" error={errors.val} />
                                        {isVisible('units') && ( <SearchableDropdown label={getLabel('units', 'واحد')} options={currentConfig.units} value={formData.unit} onChange={(val)=>handleChange('unit', val)} disabled={!serverStatus} error={errors.unit} /> )}
                                    </div>
                                    <div className="flex gap-3">
                                        {isVisible('paramOptions') && ( <SearchableDropdown label={getLabel('paramOptions', currentConfig.paramLabel)} options={currentConfig.paramOptions} value={formData.watt} onChange={(val)=>handleChange('watt', val)} disabled={!serverStatus} error={errors.watt} /> )}
                                        {isVisible('tolerances') && ( <SearchableDropdown label={getLabel('tolerances', 'تولرانس')} options={currentConfig.tolerances || []} value={formData.tol} onChange={(val) => handleChange('tol', val)} disabled={!serverStatus} error={errors.tol} /> )}
                                    </div>
                                    <div className="flex gap-3">
                                        {isVisible('packages') && ( <SearchableDropdown label={getLabel('packages', 'پکیج (Package)')} options={currentConfig.packages} value={formData.pkg} onChange={(val)=>handleChange('pkg', val)} disabled={!serverStatus} error={errors.pkg} /> )}
                                        {isVisible('techs') && ( <SearchableDropdown label={getLabel('techs', 'تکنولوژی/نوع دقیق')} options={currentConfig.techs} value={formData.tech} onChange={(val)=>handleChange('tech', val)} disabled={!serverStatus} error={errors.tech} /> )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {DYNAMIC_FIELDS_MAP.filter(f => f.key.startsWith('list')).map(field => {
                                            const fConfig = currentConfig.fields?.[field.key];
                                            if (fConfig?.visible === false) return null;
                                            const options = currentConfig[field.key] || [];
                                            const label = getLabel(field.key, field.label);
                                            return ( <NexusSelect key={field.key} label={label} value={formData[field.stateKey]} options={options} onChange={e => handleChange(field.stateKey, e.target.value)} disabled={!serverStatus} error={errors[field.stateKey]} /> );
                                        })}
                                    </div>
                                    
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <div className="flex gap-3"><NexusInput label="تعداد *" type="number" value={formData.qty} onChange={e=>handleChange('qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.qty} /><NexusInput label="حداقل *" type="number" value={formData.min_qty} onChange={e=>handleChange('min_qty', e.target.value)} onKeyPress={preventNonNumeric} className="flex-1" disabled={!serverStatus} error={errors.min_qty} /></div>
                                    <div className="flex gap-3">
                                        <NexusInput label="قیمت قطعه *" value={formData.price_toman} onChange={e=>handleChange('price_toman', e.target.value)} disabled={!serverStatus} error={errors.price_toman} className="flex-1" />
                                        <NexusInput label="قیمت دلار (تومان) *" value={formData.usd_rate} onChange={e=>handleChange('usd_rate', e.target.value)} disabled={!serverStatus} error={errors.usd_rate} className="flex-1" />
                                    </div>
                                    <div className="flex gap-3">
                                        <NexusSelect label={getLabel('location', 'آدرس نگهداری')} value={formData.location} onChange={e=>handleChange('location', e.target.value)} options={locationOptions} disabled={!serverStatus} error={errors.location} className="flex-1" />
                                        <NexusSelect label="نام فروشنده *" value={formData.vendor_name} onChange={e=>handleChange('vendor_name', e.target.value)} options={vendorOptions} disabled={!serverStatus} error={errors.vendor_name} className="flex-1" />
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <PersianDatePicker label="تاریخ خرید/فاکتور" value={formData.date} onChange={date => handleChange('date', date)} />
                                        </div>
                                        <div className="flex-1">
                                            <NexusInput label="شماره فاکتور" value={formData.invoice_number} onChange={e=>handleChange('invoice_number', e.target.value)} disabled={!serverStatus} placeholder="مثلاً ۱۲۳۴۵" />
                                        </div>
                                    </div>
                                    <NexusInput label="پروژه / دلیل خرید" value={formData.reason} onChange={e=>handleChange('reason', e.target.value)} disabled={!serverStatus} />
                                    
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <label className="text-nexus-accent text-xs mb-2 block font-bold">لینک‌های خرید (اختیاری - حداکثر ۵ مورد)</label>
                                        <div className="flex gap-2 mb-2">
                                            <input className="nexus-input flex-1 px-3 py-2 text-xs ltr placeholder-gray-600" placeholder="https://..." value={linkInput} onChange={e => setLinkInput(e.target.value)} />
                                            <button onClick={handleAddLink} className="bg-nexus-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition disabled:opacity-50" disabled={formData.purchase_links.length >= 5}><i data-lucide="plus" className="w-4 h-4"></i></button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {formData.purchase_links.map((link, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-xs group">
                                                    <a href={link} target="_blank" className="text-blue-400 truncate max-w-[200px] hover:underline" rel="noreferrer">{link}</a>
                                                    <button onClick={() => handleRemoveLink(idx)} className="text-gray-500 hover:text-red-400 transition"><i data-lucide="x" className="w-3.5 h-3.5"></i></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-white/5"><button onClick={handleSubmit} disabled={!serverStatus} className={`w-full h-11 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${formData.id ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gradient-to-r from-nexus-primary to-purple-600'} disabled:opacity-50`}>{serverStatus ? (formData.id ? 'ذخیره تغییرات' : 'ذخیره در انبار') : 'سرور قطع است'}</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

window.EntryPage = EntryPage;