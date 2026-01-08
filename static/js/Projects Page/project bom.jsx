/**
 * ====================================================================================================
 * فایل: ProjectBOM.jsx
 * وظیفه: کامپوننت رابط کاربری ویرایشگر BOM
 * توضیحات: رفع باگ removeChild در دکمه ذخیره + مودال حذف شیک
 * ====================================================================================================
 */

const { useEffect, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [Sub-Component] بج‌های مشخصات فنی
// ----------------------------------------------------------------------------------------------------
const SpecBadges = ({ item }) => (
    <div className="flex flex-wrap gap-1 mt-1">
        {item.package && <span className="spec-badge badge-blue">{item.package}</span>}
        {item.watt && <span className="spec-badge badge-amber">{item.watt}</span>}
        {item.tolerance && <span className="spec-badge badge-purple">{item.tolerance}</span>}
        {item.tech && <span className="spec-badge badge-emerald">{item.tech}</span>}
    </div>
);

// ----------------------------------------------------------------------------------------------------
// [Sub-Component] مودال تایید حذف (مشابه Entry Page)
// ----------------------------------------------------------------------------------------------------
const DeleteConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={onCancel}>
            <div 
                className="glass-panel border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in text-right" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                        <i data-lucide="trash-2" className="w-8 h-8 text-rose-500"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
                </div>
                
                <div className="flex gap-3 mt-8">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5"
                    >
                        انصراف
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-lg shadow-rose-900/20"
                    >
                        تایید و حذف
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectBOM = ({ project, rate, serverRate, config, onBack, user }) => {
    
    const logic = window.useProjectBomLogic(project, rate);
    
    const {
        activeProject, bomItems, extraCosts, searchInventory, setSearchInventory,
        filteredInventory, isSaving, isDeducting, shortageData, setShortageData,
        productionCount, setProductionCount, calculationRate, setCalculationRate,
        conversionRate, setConversionRate, partProfit, setPartProfit, draggedIndex,
        lastSwappedId, 
        
        targetParentIdForAlt, setTargetParentIdForAlt,
        addPartToBOM, updateBOMQty, removeBOMItem, 
        // توابع مودال حذف
        deleteModal, requestDelete, confirmDelete, cancelDelete,
        
        toggleExpand, toggleSelection,
        setExtraCosts, saveBOMDetails, handleDeduct,
        handlePrintBOM, 
        onDragStart, onDragOver, onDrop, onDragEnd, 
        totals 
    } = logic;

    const searchInputRef = useRef(null);

    useEffect(() => {
        if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
    }, [bomItems, shortageData, extraCosts, targetParentIdForAlt, deleteModal, isSaving , isDeducting]);

    useEffect(() => {
        if (targetParentIdForAlt && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [targetParentIdForAlt]);

    const DollarWidget = () => (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 mb-6 shadow-lg">
             <div className="flex justify-between items-center">
                <label className="text-[11px] text-nexus-primary font-black flex items-center gap-2">
                    <i data-lucide="dollar-sign" className="w-4 h-4"></i> مبنای محاسبه دلار (تومان)
                </label>
            </div>
            <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-center text-white outline-none focus:border-nexus-primary transition-all no-spinner"
                value={calculationRate} 
                onChange={(e) => setCalculationRate(Math.max(0, parseInt(e.target.value) || 0))} 
            />
            
            <div className="grid grid-cols-2 gap-2 mt-1">
                <button 
                    onClick={() => serverRate?.price > 0 && setCalculationRate(serverRate.price)} 
                    className="text-[10px] bg-white/5 p-2 rounded text-gray-300 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 transition-all flex flex-col items-center gap-1"
                    title="استفاده از نرخ آنلاین سرور"
                >
                    <span className="font-bold">آنلاین</span>
                    <span className="font-mono text-[9px]">{serverRate?.price ? serverRate.price.toLocaleString() : '---'}</span>
                </button>
                <button 
                    onClick={() => config?.['General']?.manual_usd_price && setCalculationRate(config['General'].manual_usd_price)} 
                    className="text-[10px] bg-white/5 p-2 rounded text-gray-300 hover:text-blue-400 border border-transparent hover:border-blue-500/20 transition-all flex flex-col items-center gap-1"
                    title="استفاده از نرخ دستی تنظیمات"
                >
                    <span className="font-bold">دستی</span>
                    <span className="font-mono text-[9px]">{config?.['General']?.manual_usd_price ? parseInt(config['General'].manual_usd_price).toLocaleString() : '---'}</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right animate-in fade-in" dir="rtl">
            
            <DeleteConfirmationModal 
                isOpen={deleteModal.isOpen}
                title={deleteModal.title}
                message={deleteModal.message}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10 hover:scale-105 active:scale-95">
                        <i data-lucide="arrow-right" className="w-6 h-6"></i>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white">{activeProject?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-nexus-accent font-bold tracking-widest uppercase italic bg-nexus-primary/10 px-2 py-0.5 rounded">BOM Editor Mode</span>
                            <span className="text-[10px] text-gray-500 font-mono">{bomItems.length} groups</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={async () => { if(await saveBOMDetails()) onBack(); }} 
                    disabled={isSaving} 
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 hover:border-nexus-primary/30"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        // اصلاح: قرار دادن آیکون در span برای جلوگیری از خطای removeChild
                        <span className="flex items-center gap-2">
                            <i data-lucide="save" className="w-5 h-5 text-nexus-accent"></i>
                            <span>ذخیره و بازگشت</span>
                        </span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-6">
                    <div className="glass-panel rounded-[2rem] border border-white/5 overflow-visible z-10 relative">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <i data-lucide="package" className="w-5 h-5 text-nexus-primary"></i> قطعات پروژه
                            </h3>
                            
                            <div className="relative w-96 z-50">
                                <i data-lucide="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder={targetParentIdForAlt ? "در حال جستجوی جایگزین..." : "افزودن قطعه (نام یا کد)..."}
                                    className={`w-full bg-black/40 border rounded-xl py-2 pr-9 pl-3 text-xs text-white outline-none transition-colors ${targetParentIdForAlt ? 'border-nexus-accent shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'border-white/5 focus:border-nexus-primary'}`}
                                    value={searchInventory} 
                                    onChange={(e) => setSearchInventory(e.target.value)} 
                                />
                                {targetParentIdForAlt && (
                                    <button onClick={()=>setTargetParentIdForAlt(null)} className="absolute left-2 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-300">
                                        <i data-lucide="x-circle" className="w-4 h-4"></i>
                                    </button>
                                )}
                                {searchInventory && (
                                    <div className="absolute top-full mt-2 left-0 right-0 glass-panel rounded-xl border border-white/10 shadow-2xl z-[100] p-2 overflow-hidden bg-[#1e293b] animate-in slide-in-from-top-2">
                                        {filteredInventory.length > 0 ? filteredInventory.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => {
                                                    addPartToBOM(p);
                                                    if(searchInputRef.current) searchInputRef.current.focus();
                                                }} 
                                                className="p-3 hover:bg-nexus-primary/20 rounded-lg cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors group"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-white group-hover:text-nexus-accent transition-colors">{p.val}</span>
                                                    <span className="text-[9px] text-gray-500 font-mono">{p.part_code}</span>
                                                </div>
                                                <i data-lucide={targetParentIdForAlt ? "git-branch" : "plus"} className="w-4 h-4 text-gray-500 group-hover:text-nexus-primary"></i>
                                            </div>
                                        )) : (
                                            <div className="p-3 text-center text-xs text-gray-500">موردی یافت نشد</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-right border-collapse">
                                <thead className="text-[10px] text-gray-500 uppercase bg-black/20 font-black sticky top-0">
                                    <tr>
                                        <th className="p-4 w-16 text-center">ابزار</th> 
                                        <th className="p-4 w-24">کد</th>
                                        <th className="p-4">نام قطعه</th>
                                        <th className="p-4 w-28 text-center">تعداد واحد</th>
                                        <th className="p-4 w-20 text-center text-nexus-accent">تعداد کل</th>
                                        <th className="p-4 w-20 text-center">موجودی</th>
                                        <th className="p-4 w-24 text-center">قیمت واحد ($)</th>
                                        <th className="p-4 w-24 text-center">قیمت کل ($)</th>
                                        <th className="p-4 w-32 text-center font-black">قیمت کل (ت)</th>
                                        <th className="p-4 w-24 text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {bomItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="p-10 text-center text-gray-500 italic">
                                                لیست قطعات خالی است. از باکس جستجو بالا قطعات را اضافه کنید.
                                            </td>
                                        </tr>
                                    ) : bomItems.map((item, idx) => {
                                        const renderRow = (part, isParent, parentId = null) => {
                                            const unitPriceUSD = parseFloat(part.toman_price||0) / parseFloat(part.usd_rate||1);
                                            const qty = isParent ? part.required_qty : item.required_qty; 
                                            const rowTotalPriceUSD = unitPriceUSD * parseFloat(qty || 0);
                                            const totalToman = rowTotalPriceUSD * calculationRate;
                                            
                                            const totalRequiredInBatch = qty * productionCount;
                                            const isLowStock = (part.inventory_qty || 0) < totalRequiredInBatch;
                                            const isSelected = part.isSelected;
                                            const rowStatusClass = isSelected ? 'is-selected' : 'not-selected';
                                            const swapClass = (lastSwappedId === part.part_id) ? 'animate-swap' : '';

                                            return (
                                                <tr 
                                                    key={part.part_id} 
                                                    draggable={isParent}
                                                    onDragStart={(e)=>isParent && onDragStart(e, idx)} 
                                                    onDragOver={(e)=>isParent && onDragOver(e)} 
                                                    onDrop={(e)=>isParent && onDrop(e, idx)}
                                                    onDragEnd={isParent ? onDragEnd : undefined} 
                                                    className={`bom-item-row hover:bg-white/5 cursor-default group ${rowStatusClass} ${draggedIndex===idx ? 'dragging' : ''} ${swapClass}`}
                                                >
                                                    <td className="p-4 text-center">
                                                        {isParent ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <i data-lucide="grip-vertical" className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity cursor-move text-gray-500"></i>
                                                                {part.alternatives && part.alternatives.length > 0 && (
                                                                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(part.part_id); }}>
                                                                        <i data-lucide={part.isExpanded ? "chevron-down" : "chevron-left"} className="w-4 h-4 text-white hover:text-nexus-primary"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => toggleSelection(parentId, part.part_id)}
                                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-nexus-primary/20 text-gray-500 hover:text-nexus-accent border border-white/10 hover:border-nexus-primary/50 transition-all flex items-center justify-center mx-auto"
                                                                title="جایگزینی با قطعه اصلی"
                                                            >
                                                                <i data-lucide="arrow-up-down" className="w-4 h-4"></i>
                                                            </button>
                                                        )}
                                                    </td>
                                                    
                                                    <td className="p-4 font-mono text-[11px] text-nexus-accent">
                                                        {part.part_code}
                                                        {!isParent && <span className="ml-2 text-[9px] bg-white/10 px-1 rounded text-gray-400">ALT</span>}
                                                    </td>

                                                    <td className="p-4" colSpan={isParent ? 1 : 3}>
                                                        <div className={`font-bold text-white transition-colors ${!isParent ? 'pr-12 border-r-2 border-white/10' : ''}`}>
                                                            {part.val}
                                                        </div>
                                                        <div className={!isParent ? 'pr-12' : ''}>
                                                            <SpecBadges item={part} />
                                                        </div>
                                                    </td>

                                                    {isParent && (
                                                        <td className="p-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <input 
                                                                    type="number"
                                                                    min="1"
                                                                    className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white focus:border-nexus-primary outline-none transition-colors font-bold no-spinner" 
                                                                    value={part.required_qty} 
                                                                    onChange={(e)=>updateBOMQty(part.part_id, e.target.value)} 
                                                                />
                                                                <span className="text-[10px] text-gray-500">{part.unit || 'عدد'}</span>
                                                            </div>
                                                        </td>
                                                    )}

                                                    {isParent && (
                                                        <td className="p-4 text-center">
                                                            <span className="text-nexus-accent font-mono font-bold">
                                                                {totalRequiredInBatch.toLocaleString()}
                                                            </span>
                                                        </td>
                                                    )}

                                                    <td className={`p-4 text-center font-bold ${isLowStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {part.inventory_qty || 0}
                                                        {isLowStock && <div className="text-[8px] bg-rose-500/10 px-1 rounded mt-1">کسری</div>}
                                                    </td>
                                                    <td className="p-4 text-center font-mono text-[10px] text-blue-300">{unitPriceUSD.toFixed(4)}</td>
                                                    <td className="p-4 text-center font-mono text-[10px] text-blue-300">{rowTotalPriceUSD.toFixed(4)}</td>
                                                    <td className={`p-4 text-center font-black tracking-tight ${isSelected ? 'text-emerald-400' : 'text-gray-600'}`}>
                                                        {Math.round(totalToman).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            {isParent && (
                                                                <button 
                                                                    onClick={() => setTargetParentIdForAlt(part.part_id)} 
                                                                    className="p-2 rounded-lg text-gray-500 hover:text-nexus-accent hover:bg-nexus-primary/10 transition-all"
                                                                    title="افزودن جایگزین (Split)"
                                                                >
                                                                    <i data-lucide="git-branch" className="w-4 h-4"></i>
                                                                </button>
                                                            )}
                                                            <button 
                                                                onClick={()=>requestDelete(part.part_id, isParent ? null : parentId)} 
                                                                className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                                title="حذف"
                                                            >
                                                                <i data-lucide="trash-2" className="w-4 h-4"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        };

                                        return (
                                            <React.Fragment key={item.part_id}>
                                                {renderRow(item, true)}
                                                {item.isExpanded && item.alternatives && item.alternatives.map(alt => (
                                                    renderRow(alt, false, item.part_id)
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-panel rounded-[2rem] border border-white/5 p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <i data-lucide="calculator" className="w-5 h-5 text-nexus-primary"></i> هزینه‌های جانبی تولید (دلار)
                            </h3>
                            <button onClick={() => setExtraCosts([...extraCosts, { description: '', cost: 0 }])} className="text-[10px] font-black text-nexus-accent hover:text-white flex items-center gap-1 uppercase tracking-tighter transition-all bg-nexus-primary/10 px-3 py-1.5 rounded-lg border border-nexus-primary/20 hover:bg-nexus-primary/20">
                                <i data-lucide="plus" className="w-3 h-3"></i> افزودن ردیف هزینه
                            </button>
                        </div>
                        <div className="space-y-3">
                            {extraCosts.length === 0 ? (
                                <div className="text-center text-xs text-gray-600 py-4">بدون هزینه جانبی</div>
                            ) : extraCosts.map((cost, idx) => (
                                <div key={`extra-cost-${idx}`} className="flex gap-3 animate-in fade-in slide-in-from-right-2 items-center">
                                    <span className="text-gray-500 text-xs w-6 text-center">{idx + 1}.</span>
                                    <input 
                                        className="flex-[3] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-nexus-primary transition-colors"
                                        placeholder="شرح هزینه (مثال: هزینه مونتاژ)..."
                                        value={cost.description} 
                                        onChange={(e) => {const newC=[...extraCosts]; newC[idx].description=e.target.value; setExtraCosts(newC);}}
                                    />
                                    <div className="relative flex-[1]">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white text-center font-bold outline-none focus:border-nexus-primary transition-colors no-spinner"
                                            placeholder="0"
                                            value={cost.cost} 
                                            onChange={(e) => {const newC=[...extraCosts]; newC[idx].cost=Math.max(0, e.target.value); setExtraCosts(newC);}}
                                        />
                                    </div>
                                    <button onClick={() => setExtraCosts(extraCosts.filter((_, i) => i !== idx))} className="p-2 text-gray-600 hover:text-rose-400 transition-colors"><i data-lucide="x" className="w-4 h-4"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-6 sticky top-8">
                    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-nexus-primary/10 blur-[50px] rounded-full"></div>
                        
                        <DollarWidget />
                        
                        <div className="space-y-4 text-sm relative z-10">
                            
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2 mb-4">
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>تنوع قطعات (گروه):</span>
                                    <span className="text-white font-bold">{totals.variety} قلم</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>تعداد قطعات (پارت):</span>
                                    <span className="text-white font-bold">{totals.totalParts} عدد</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>هزینه دلاری قطعات:</span>
                                    <span className="text-white font-mono font-bold">${totals.usdBatch.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>هزینه ارزی کل (با جانبی):</span>
                                    <span className="text-nexus-accent font-mono font-bold text-sm">${totals.totalProductionUSD.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors">
                                <span>تعداد واحد تولید:</span>
                                <input 
                                    type="number" 
                                    min="1"
                                    className="w-16 bg-black/40 text-center text-white rounded-lg border border-white/5 focus:border-nexus-primary outline-none py-1 font-bold no-spinner" 
                                    value={productionCount} 
                                    onChange={(e)=>setProductionCount(Math.max(1, e.target.value))} 
                                />
                            </div>
                            <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors">
                                <span>نرخ تسعیر (%):</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-16 bg-black/40 text-center text-white rounded-lg border border-white/5 focus:border-nexus-primary outline-none py-1 font-bold no-spinner" 
                                    value={conversionRate} 
                                    onChange={(e)=>setConversionRate(Math.max(0, e.target.value))} 
                                />
                            </div>
                            <div className="flex justify-between items-center text-gray-400 hover:text-white transition-colors">
                                <span>سود قطعه (%):</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-16 bg-black/40 text-center text-white rounded-lg border border-white/5 focus:border-nexus-primary outline-none py-1 font-bold no-spinner" 
                                    value={partProfit} 
                                    onChange={(e)=>setPartProfit(Math.max(0, e.target.value))} 
                                />
                            </div>
                            
                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2 mt-2 backdrop-blur-sm">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">سود کل پارت (ارزی):</span>
                                    <span className="text-emerald-400 font-mono font-bold">${totals.profitBatchUSD.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs pt-2 border-t border-emerald-500/10">
                                    <span className="text-gray-400">سود کل پارت (تومان):</span>
                                    <span className="text-emerald-400 font-black">{Math.round(totals.profitBatchToman).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-4 text-center">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">قیمت نهایی تولید (هر واحد)</div>
                                    <div className="text-3xl font-black text-white leading-tight">
                                        {Math.round(totals.unitFinalToman).toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 mr-2">تومان</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] text-nexus-accent font-black uppercase tracking-widest mb-1">قیمت کل پارت تولیدی</div>
                                    <div className="text-4xl font-black text-white drop-shadow-lg tracking-tight bg-nexus-primary/10 p-3 rounded-2xl border border-nexus-primary/20 shadow-inner">
                                        {Math.round(totals.totalProductionToman).toLocaleString()} <span className="text-xs text-gray-500 font-normal">تومان</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handlePrintBOM} 
                                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <i data-lucide="printer" className="w-5 h-5"></i> چاپ رسمی لیست BOM
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={()=>handleDeduct(false, user)} 
                        disabled={isDeducting} 
                        className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isDeducting ? (
                            // اضافه کردن key="loading"
                            <span key="loading" className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>در حال پردازش...</span>
                            </span>
                        ) : (
                            // اضافه کردن key="idle"
                            <span key="idle" className="flex items-center gap-2">
                                <i data-lucide="package-minus" className="w-6 h-6 group-hover:rotate-12 transition-transform"></i>
                                <span>کسر موجودی از انبار</span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {shortageData && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
                    <div className="glass-panel border border-rose-500/30 p-8 rounded-[3rem] max-w-2xl w-full text-right shadow-2xl shadow-rose-900/20 animate-in slide-in-from-bottom-10">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-500">
                                <i data-lucide="alert-triangle" className="w-8 h-8"></i>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white text-rose-500">کسری موجودی انبار!</h3>
                                <p className="text-gray-400 text-sm mt-1">امکان کسر کامل قطعات زیر وجود ندارد:</p>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-2xl p-1 mb-8 border border-white/5">
                            <div className="max-h-[300px] overflow-y-auto custom-scroll">
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-gray-500 border-b border-white/5 bg-white/5">
                                        <tr>
                                            <th className="py-3 px-4 text-right">نام قطعه</th>
                                            <th className="py-3 text-center">کسری</th>
                                            <th className="py-3 text-left pl-4">محل انبار</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {shortageData.map((s, i) => (
                                            <tr key={i} className="hover:bg-rose-500/5">
                                                <td className="py-3 px-4 text-white font-bold">{s.val}</td>
                                                <td className="py-3 text-center font-black text-rose-500 bg-rose-500/10 rounded-lg">{s.missing}</td>
                                                <td className="py-3 text-left pl-4 font-mono text-nexus-accent">{s.location || 'نامشخص'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={()=>setShortageData(null)} 
                                className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all border border-white/5"
                            >
                                انصراف
                            </button>
                            <button 
                                onClick={()=>handleDeduct(true, user)} 
                                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black shadow-lg transition-all active:scale-95"
                            >
                                برداشت اجباری موجودی فعلی
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
window.ProjectBOM = ProjectBOM;