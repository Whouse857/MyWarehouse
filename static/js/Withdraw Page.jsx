// ====================================================================================================
// نسخه: 0.22 (اصلاح شده نهایی)
// فایل: Withdraw Page.jsx
// تغییرات: افزودن محافظ (Guard) برای جلوگیری از خطای trim() روی مقادیر undefined
// ====================================================================================================

const { useState, useEffect, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت پاپ‌آپ فیلتر]
// ----------------------------------------------------------------------------------------------------
const FilterPopup = ({ title, children, onClear }) => {
    return (
        <div className="wp-filter-popup" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <i data-lucide="list-filter" className="w-4 h-4 text-nexus-accent"></i>
                    <span className="text-xs font-bold text-white">{title}</span>
                </div>
                <button onClick={onClear} className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition">پاک کردن همه</button>
            </div>
            <div className="custom-scroll max-h-[300px] overflow-y-auto pr-1">
                {children}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت نوار فیلترهای فعال]
// ----------------------------------------------------------------------------------------------------
const ActiveFiltersBar = ({ searchTerm, selectedCategory, specConditions, onClearSearch, onClearCategory, onRemoveSpec, setSearchTerm }) => {
    const hasSearch = (searchTerm || "").trim() !== '';
    const hasCategory = selectedCategory !== 'All';
    
    // اصلاح: بررسی دقیق‌تر برای جلوگیری از خطای undefined
    const activeSpecs = (specConditions || []).filter(c => c && c.value && String(c.value).trim() !== '');

    if (!hasSearch && !hasCategory && activeSpecs.length === 0) return null;

    return (
        <div className="wp-active-filters-bar">
            <div className="flex items-center gap-1.5 text-nexus-accent opacity-70 ml-2">
                <i data-lucide="filter" className="w-3.5 h-3.5"></i>
                <span className="text-[10px] font-bold">فیلترهای فعال:</span>
            </div>
            
            {hasCategory && (
                <div className="wp-filter-chip border-orange-500/30 bg-orange-500/10 text-orange-200">
                    <span className="label text-orange-400">دسته:</span>
                    <span className="value">{selectedCategory}</span>
                    <button onClick={onClearCategory} className="hover:bg-orange-500"><i data-lucide="x" className="w-2.5 h-2.5"></i></button>
                </div>
            )}

            {hasSearch && (
                <div className="wp-filter-chip">
                    <span className="label">جستجو:</span>
                    <span className="value font-mono dir-ltr max-w-[100px] truncate">{searchTerm}</span>
                    <button onClick={onClearSearch}><i data-lucide="x" className="w-2.5 h-2.5"></i></button>
                </div>
            )}

            {activeSpecs.map((spec, idx) => (
                <div key={spec.id} className="wp-filter-chip border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                    {idx > 0 && <span className="text-[9px] text-gray-500 mx-1 font-mono">({spec.logic})</span>}
                    <span className="label text-emerald-400">شرط:</span>
                    <span className="value font-mono dir-ltr max-w-[100px] truncate">{spec.value}</span>
                    <button onClick={() => onRemoveSpec(spec.id)} className="hover:bg-emerald-500"><i data-lucide="x" className="w-2.5 h-2.5"></i></button>
                </div>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت اصلی]
// ----------------------------------------------------------------------------------------------------
const WithdrawPage = ({ user, serverStatus }) => {
    const {
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        cart, projectReason, setProjectReason,
        categories, filteredParts, partsList,
        globalConfig,
        specConditions, activeFilterPopup,
        addSpecCondition, removeSpecCondition, updateSpecCondition,
        toggleSpecLogic, toggleFilterPopup, clearFilterGroup,
        handleCheckout, handlePrintPickList, handleManualQtyChange,
        updateCartQty, addToCart, helpers
    } = window.useWithdrawLogic({ user, serverStatus });

    const { getPartCodeLocal, getStockStatus } = helpers;

    return (
        <div className="flex-1 p-6 flex flex-col h-full overflow-hidden">
            <header className="mb-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="shopping-cart" className="w-6 h-6 text-nexus-primary"></i>
                        میز کار و برداشت قطعه
                    </h2>
                    <div className="text-xs text-gray-400 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <span className="text-white font-bold">{partsList.length}</span> قطعه در انبار
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 flex gap-2">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-nexus-primary transition-colors">
                                <i data-lucide="search" className="w-5 h-5"></i>
                            </div>
                            <input 
                                className="nexus-input w-full pr-10 pl-4 py-3 text-sm shadow-lg border-white/10 focus:border-nexus-primary/50 transition-all" 
                                placeholder="جستجوی سریع (کد، نام، پکیج، آدرس...)" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                autoFocus 
                            />
                        </div>
                        
                        <div className="relative">
                            <button 
                                className={`wp-filter-toggle-btn h-full px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition flex items-center gap-2 ${activeFilterPopup === 'specs' ? 'active' : ''} ${specConditions && specConditions.some(c => c.value) ? 'has-filters' : ''}`}
                                onClick={(e) => { e.stopPropagation(); toggleFilterPopup('specs'); }}
                                title="فیلتر پیشرفته"
                            >
                                <i data-lucide="sliders-horizontal" className="w-5 h-5"></i>
                                <span className="hidden lg:inline text-xs font-bold">فیلتر پیشرفته</span>
                            </button>

                            {activeFilterPopup === 'specs' && (
                                <FilterPopup title="سازنده شرط جستجو (Query Builder)" onClear={() => clearFilterGroup('specs')}>
                                    <div className="space-y-1">
                                        {specConditions.map((cond, index) => (
                                            <div key={cond.id} className="wp-condition-row">
                                                {index > 0 && (
                                                    <div className="wp-condition-connector">
                                                        <button 
                                                            className={`wp-logic-btn ${cond.logic.toLowerCase()}`}
                                                            onClick={(e) => { e.stopPropagation(); toggleSpecLogic(cond.id); }}
                                                            title="کلیک برای تغییر (AND/OR)"
                                                        >
                                                            {cond.logic === 'AND' ? 'و (And)' : 'یا (Or)'}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    <input 
                                                        className="nexus-input w-full px-3 py-2.5 pl-9 text-xs bg-black/40 border-white/10 focus:border-nexus-accent/50" 
                                                        placeholder={index === 0 ? "مثلاً: 100k یا 0805" : "شرط بعدی..."}
                                                        value={cond.value} 
                                                        onChange={e => updateSpecCondition(cond.id, e.target.value)}
                                                        autoFocus={index === specConditions.length - 1}
                                                    />
                                                    
                                                    {specConditions.length > 1 && (
                                                        <button 
                                                            className="wp-remove-condition-btn" 
                                                            onClick={(e) => { e.stopPropagation(); removeSpecCondition(cond.id); }}
                                                            title="حذف این شرط"
                                                        >
                                                            <i data-lucide="trash-2" className="w-4 h-4"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        className="wp-add-condition-btn mt-3 border-dashed border-white/20 hover:border-nexus-accent/50 hover:text-nexus-accent" 
                                        onClick={(e) => { e.stopPropagation(); addSpecCondition(); }}
                                    >
                                        <i data-lucide="plus-circle" className="w-4 h-4"></i>
                                        <span>افزودن شرط جدید</span>
                                    </button>
                                </FilterPopup>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 max-w-full md:max-w-md custom-scroll items-center">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition border ${selectedCategory === cat ? 'bg-nexus-primary text-white border-nexus-primary shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-gray-200'}`}>{cat === "All" ? "همه دسته‌ها" : cat}</button>
                        ))}
                    </div>
                </div>
            </header>
            
            <ActiveFiltersBar 
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                specConditions={specConditions}
                onClearSearch={() => setSearchTerm('')}
                onClearCategory={() => setSelectedCategory('All')}
                onRemoveSpec={removeSpecCondition}
                setSearchTerm={setSearchTerm}
            />
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
                {/* سبد خروج */}
                <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 order-2 md:order-1">
                    <div className="glass-panel flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
                        <div className="p-4 border-b border-white/5 bg-[#020617]/40 flex justify-between items-center">
                            <h3 className="font-bold text-gray-200 flex items-center gap-2"><i data-lucide="clipboard-list" className="w-4 h-4 text-orange-400"></i>لیست خروج</h3>
                            <div className="flex gap-2">
                                {cart.length > 0 && (
                                    <button onClick={() => handlePrintPickList()} title="پیش‌نمایش حواله" className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all">
                                        <i data-lucide="printer" className="w-4 h-4"></i>
                                    </button>
                                )}
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-mono">{cart.length}</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-2 bg-[#020617]/20">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-40 gap-3"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><i data-lucide="package-open" className="w-8 h-8"></i></div><span className="text-xs">لیست خالی است</span><span className="text-[10px]">قطعات را از لیست انتخاب کنید</span></div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="bg-[#1e293b] p-3 rounded-xl border border-white/5 group relative overflow-hidden transition hover:border-orange-500/30 animate-in zoom-in">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-sm ltr font-mono text-right">{item.val}</span>
                                                <span className="text-[9px] text-nexus-accent font-mono font-bold tracking-tighter">{getPartCodeLocal(item, globalConfig)}</span>
                                            </div>
                                            <button onClick={() => updateCartQty(item.id, -item.qty)} className="text-gray-600 hover:text-red-400 transition"><i data-lucide="x" className="w-4 h-4"></i></button>
                                        </div>
                                        <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                                            <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-400 rounded transition"><i data-lucide="plus" className="w-3 h-3"></i></button>
                                            
                                            <input 
                                                type="text"
                                                className="w-14 bg-white/5 text-center font-mono font-bold text-orange-400 text-sm focus:outline-none border border-white/10 rounded-md focus:border-orange-500 transition-colors"
                                                value={item.qty === 0 ? "" : item.qty}
                                                onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                                            />

                                            <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded transition"><i data-lucide="minus" className="w-3 h-3"></i></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-4 bg-[#1e293b] border-t border-white/5 space-y-3 z-10">
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500"><i data-lucide="briefcase" className="w-4 h-4"></i></div>
                                <input className="nexus-input w-full pr-9 pl-3 py-2.5 text-xs bg-black/30 border-white/10" placeholder="نام پروژه / دلیل مصرف..." value={projectReason} onChange={e => setProjectReason(e.target.value)} />
                            </div>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || !serverStatus} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-red-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 group"><span>ثبت و صدور حواله</span><i data-lucide="arrow-left" className="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i></button>
                        </div>
                    </div>
                </div>
                
                {/* لیست قطعات */}
                <div className="md:col-span-8 lg:col-span-9 order-1 md:order-2 flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scroll pr-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                            {filteredParts.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4"><i data-lucide="search-x" className="w-10 h-10 opacity-30"></i></div>
                                    <p className="font-bold">موردی یافت نشد</p>
                                    <p className="text-xs mt-1 opacity-50">فیلترها را تغییر دهید</p>
                                </div>
                            ) : (
                                filteredParts.map(part => {
                                    const status = getStockStatus(part.quantity, part.min_quantity);
                                    const inCart = cart.find(c => c.id === part.id);
                                    const pCode = getPartCodeLocal(part, globalConfig);
                                    return (
                                        <div key={part.id} className={`glass-panel p-4 rounded-2xl border transition-all duration-200 group relative flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl ${inCart ? 'border-nexus-primary/50 bg-nexus-primary/5' : 'border-white/5 hover:border-white/20'}`}>
                                            <div className={`absolute top-0 inset-x-4 h-0.5 rounded-b-full ${status.color} opacity-50`}></div>
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-nexus-accent font-mono tracking-tighter">{pCode}</span>
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.color.replace('bg-', 'bg-').replace('500', '500/10')} ${status.text}`}>{status.label === 'ناموجود' ? <i data-lucide="alert-octagon" className="w-3 h-3"></i> : <i data-lucide="box" className="w-3 h-3"></i>}<span>{part.quantity}</span></div>
                                                </div>
                                                <h4 className="text-xl font-black text-white ltr font-mono mb-1 truncate" title={part.val}>{part.val} <span className="text-sm font-normal text-gray-400">{part.unit}</span></h4>
                                                
                                                <div className="space-y-1 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded-md border border-white/5">{part.package}</span>
                                                        <span className="text-[10px] text-blue-400 font-bold uppercase">{part.type}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {part.watt && <span className="text-[9px] text-yellow-500/80 font-bold bg-yellow-500/5 px-1.5 rounded flex items-center gap-0.5"><i data-lucide="zap" className="w-2.5 h-2.5"></i>{part.watt}</span>}
                                                        {part.tolerance && <span className="text-[9px] text-purple-400 font-bold bg-purple-500/5 px-1.5 rounded">{part.tolerance}</span>}
                                                        {part.tech && <span className="text-[9px] text-gray-500 bg-black/20 px-1.5 rounded truncate max-w-[100px]">{part.tech}</span>}
                                                    </div>
                                                    <div className="pt-1.5 flex items-center gap-1 text-[10px] text-orange-300/70">
                                                        <i data-lucide="map-pin" className="w-3 h-3 text-orange-400"></i>
                                                        <span className="font-bold">{part.storage_location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-3 border-t border-white/5 flex gap-2">
                                                <button onClick={() => addToCart(part, 1)} disabled={part.quantity <= 0} className="flex-1 bg-white/5 hover:bg-nexus-primary hover:text-white text-gray-300 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group-hover:bg-white/10"><i data-lucide="plus" className="w-4 h-4"></i>افزودن به سبد</button>
                                                {inCart && (<div className="flex items-center justify-center w-10 h-10 rounded-xl bg-nexus-primary/20 text-nexus-primary font-mono font-bold border border-nexus-primary/30 animate-in zoom-in">{inCart.qty}</div>)}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.WithdrawPage = WithdrawPage;