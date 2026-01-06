/**
 * ====================================================================================================
 * فایل: Projects Page.js
 * نسخه: 0.59 (جابجایی باکس نرخ دلار به ابتدای محاسبات + افزودن به لیست پروژه‌ها)
 * ====================================================================================================
 */

const { useState, useEffect, useCallback, useMemo } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: کامپوننت ویجت نرخ دلار]
// این کامپوننت برای جلوگیری از تکرار کد و استفاده در هر دو نمای لیست و BOM ساخته شده است.
// ----------------------------------------------------------------------------------------------------
const DollarRateWidget = ({ rate, setRate, serverRate, config }) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 mb-6 shadow-lg animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
                <label className="text-[11px] text-nexus-primary font-black flex items-center gap-2">
                    <i data-lucide="dollar-sign" className="w-4 h-4"></i>
                    مبنای محاسبه دلار (تومان)
                </label>
                <i data-lucide="edit-2" className="w-3.5 h-3.5 text-gray-500"></i>
            </div>
            
            {/* اینپوت اصلی برای وارد کردن عدد */}
            <input 
                type="number"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-center text-white outline-none focus:border-nexus-primary transition-all shadow-inner focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                value={rate}
                onChange={(e) => setRate(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="نرخ دلار را وارد کنید..."
            />

            {/* پیشنهادات هوشمند (چیپ‌ها) */}
            <div className="flex flex-col gap-2 mt-1">
                <span className="text-[9px] text-gray-500 font-bold px-1">نرخ‌های پیشنهادی سیستم:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1. نرخ آنلاین (سرور) */}
                    <button 
                        onClick={() => serverRate.price > 0 && setRate(serverRate.price)}
                        className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                        title="استفاده از نرخ آنلاین"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10"><i data-lucide="globe" className="w-3.5 h-3.5"></i></div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-300 font-bold group-hover:text-emerald-300">آنلاین سرور</span>
                                <span className="text-[9px] text-gray-500 font-mono">{serverRate.date || '---'}</span>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 tracking-wide bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {serverRate.price > 0 ? serverRate.price.toLocaleString() : '---'}
                        </span>
                    </button>

                    {/* 2. نرخ تنظیمات (دستی) */}
                    <button 
                        onClick={() => {
                            const manualPrice = config?.['General']?.manual_usd_price;
                            if (manualPrice) setRate(manualPrice);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group"
                        title="استفاده از نرخ تنظیمات دستی"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10"><i data-lucide="settings-2" className="w-3.5 h-3.5"></i></div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] text-gray-300 font-bold group-hover:text-blue-300">دستی تنظیمات</span>
                                <span className="text-[9px] text-gray-500 font-mono">{config?.['General']?.manual_usd_date || '---'}</span>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-400 tracking-wide bg-blue-500/10 px-1.5 py-0.5 rounded">
                            {config?.['General']?.manual_usd_price ? parseInt(config['General'].manual_usd_price).toLocaleString() : '---'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProjectsPage = ({ user, serverStatus }) => {
    
    // ================================================================================================
    // [Safety Check] بررسی بارگذاری فایل منطق
    // ================================================================================================
    if (!window.useProjectsLogic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
                <div className="lds-hourglass"></div>
                <span className="text-gray-400 font-bold animate-pulse">در حال بارگذاری ماژول پروژه...</span>
            </div>
        );
    }

    // ================================================================================================
    // [SECTION 1] اتصال به منطق
    // ================================================================================================
    const logic = window.useProjectsLogic(user, serverStatus);

    const {
        view, setView,
        searchTerm, setSearchTerm,
        
        // [تگ: دریافت نرخ‌ها از منطق]
        calculationRate, setCalculationRate, 
        serverRate, 
        config,

        isModalOpen, setIsModalOpen,
        projectForm, setProjectForm,
        activeProject,
        bomItems, setBomItems,
        extraCosts, setExtraCosts,
        searchInventory, setSearchInventory,
        isSaving,
        productionCount, setProductionCount,
        shortageData, setShortageData,
        isDeducting,
        conversionRate, setConversionRate,
        partProfit, setPartProfit,
        draggedIndex,
        onDragStart,
        onDragOver,
        onDrop,
        SpecBadges,
        handlePrintBOM,
        handleOpenBOM,
        handleSaveProject,
        handleDeleteProject,
        handleDuplicateProject,
        saveBOMDetails,
        addPartToBOM,
        updateBOMQty,
        removeBOMItem,
        addExtraCost,
        updateExtraCost,
        handleDeduct,
        totals,
        filteredInventory,
        filteredProjects,
        toShamsi
    } = logic;

    // ================================================================================================
    // [SECTION 2] رندر رابط کاربری
    // ================================================================================================

    // --- حالت 1: نمایش لیست پروژه‌ها ---
    if (view === 'list') {
        return (
            <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right" dir="rtl">
                {/* بخش هدر صفحه لیست */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 pb-6 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <i data-lucide="briefcase" className="w-8 h-8 text-nexus-primary"></i>
                            پروژه ها و لیست BOM
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">مدیریت تولید و آنالیز هزینه در سیستم H&Y</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <i data-lucide="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"></i>
                            <input 
                                type="text" placeholder="جستجوی پروژه..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white focus:border-nexus-primary outline-none"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            className="bg-nexus-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                            onClick={() => { setProjectForm({ id: null, name: '', description: '' }); setIsModalOpen(true); }}
                        >
                            <i data-lucide="plus" className="w-5 h-5"></i> پروژه جدید
                        </button>
                    </div>
                </div>

                {/* [تگ: ابزار محاسبه نرخ دلار در لیست پروژه‌ها] */}
                <div className="max-w-2xl mx-auto mb-8">
                    <DollarRateWidget 
                        rate={calculationRate} 
                        setRate={setCalculationRate} 
                        serverRate={serverRate} 
                        config={config} 
                    />
                </div>

                {/* شبکه کارت‌های پروژه */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(p => {
                        const hasBOM = (p.bom_count || 0) > 0;
                        const usdBase = parseFloat(p.total_price_usd || 0);
                        const cRate = parseFloat(p.conversion_rate || 0);
                        const pProfit = parseFloat(p.part_profit || 0);
                        // نمایش قیمت تقریبی با نرخ فعلی محاسبه (زنده)
                        const baseToman = usdBase * calculationRate;
                        const finalPriceToman = baseToman * (1 + cRate / 100) * (1 + pProfit / 100);

                        return (
                            <div key={p.id} onClick={() => handleOpenBOM(p)} className="glass-panel p-5 rounded-[2rem] border border-white/5 hover:border-nexus-primary/40 transition-all group flex flex-col h-[280px] shadow-xl overflow-hidden relative cursor-pointer">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-nexus-primary/5 blur-3xl -z-10 group-hover:bg-nexus-primary/10 transition-all"></div>
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h3 className="text-lg font-black text-white truncate pl-2">{p.name}</h3>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl p-1 backdrop-blur-md absolute left-0 top-0">
                                        <button onClick={(e) => handleDuplicateProject(e, p.id)} title="کپی" className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500 hover:text-white transition-all"><i data-lucide="copy" className="w-4 h-4"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); setProjectForm(p); setIsModalOpen(true); }} title="ویرایش" className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><i data-lucide="edit-3" className="w-4 h-4"></i></button>
                                        <button onClick={(e) => handleDeleteProject(e, p.id)} title="حذف" className="p-1.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-4 h-8">{p.description || 'توضیحات ثبت نشده...'}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-auto">
                                    <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5">
                                        <i data-lucide="layers" className="w-3 h-3 text-indigo-400"></i>
                                        <span className="text-[10px] text-gray-300 font-bold">{p.total_parts_count || 0} <span className="text-gray-500 font-normal">قطعه</span></span>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5">
                                        <i data-lucide="list" className="w-3 h-3 text-blue-400"></i>
                                        <span className="text-[10px] text-gray-300 font-bold">{p.bom_count || 0} <span className="text-gray-500 font-normal">تنوع</span></span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 mt-2 flex justify-between items-end relative z-10">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 font-bold">آخرین تغییر:</span>
                                        <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                            {toShamsi ? toShamsi(p.last_modified) : p.last_modified}
                                        </span>
                                    </div>

                                    {hasBOM ? (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-emerald-400 tracking-tight">{Math.round(finalPriceToman).toLocaleString()}</span>
                                                <span className="text-[9px] text-emerald-500/70 font-bold">تومان</span>
                                            </div>
                                            <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                                                (Base: ${usdBase.toFixed(2)})
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 py-1 px-2 rounded-lg bg-amber-500/10 border border-amber-500/10">
                                            <span className="text-[10px] text-amber-500 font-bold">BOM خالی</span>
                                            <i data-lucide="alert-circle" className="w-3 h-3 text-amber-500"></i>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* مودال ایجاد/ویرایش پروژه */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="glass-panel border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl bg-[#0f172a]/95 text-right animate-scale-in" onClick={e => e.stopPropagation()}>
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                                {projectForm.id ? <i data-lucide="edit-3" className="text-blue-400"></i> : <i data-lucide="folder-plus" className="text-emerald-400"></i>}
                                {projectForm.id ? 'ویرایش پروژه' : 'پروژه جدید'}
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 mr-2">نام پروژه *</label>
                                    <input className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-nexus-primary" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="نام مدل یا نام مشتری..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 mr-2">توضیحات</label>
                                    <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm min-h-[120px] resize-none outline-none focus:border-nexus-primary" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition">انصراف</button>
                                    <button onClick={handleSaveProject} className="flex-[2] py-4 rounded-2xl bg-nexus-primary text-white font-black shadow-lg hover:bg-indigo-600 transition">ذخیره نهایی</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- حالت 2: نمایش جزئیات پروژه (BOM Editor) ---
    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right" dir="rtl">
            {/* نوار ابزار بالای صفحه جزئیات */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('list')} className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white transition-all hover:bg-white/10"><i data-lucide="arrow-right" className="w-6 h-6"></i></button>
                    <div>
                        <h2 className="text-2xl font-black text-white">{activeProject?.name}</h2>
                        <p className="text-xs text-nexus-accent font-bold mt-1 tracking-widest uppercase italic">BOM Editor Mode | H&Y System</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        key={`save-btn-${isSaving}`}
                        onClick={saveBOMDetails} 
                        disabled={isSaving} 
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <i data-lucide="save" className="w-5 h-5 text-nexus-accent"></i>
                        )}
                        ذخیره نهایی و خروج
                    </button>
                </div>
            </div>

            {/* بخش اصلی ویرایشگر */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* ستون راست: جدول قطعات و هزینه‌ها */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
                        {/* هدر جدول و جستجوی قطعه */}
                        <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><i data-lucide="package" className="w-5 h-5 text-nexus-primary"></i> لیست قطعات پروژه</h3>
                            <div className="relative w-80">
                                <i data-lucide="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                                <input 
                                    type="text" placeholder="افزودن قطعه (نام، کد یا مشخصات)..."
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pr-9 pl-3 text-xs text-white outline-none focus:border-nexus-primary"
                                    value={searchInventory} onChange={(e) => setSearchInventory(e.target.value)}
                                />
                                {/* دراپ‌داون نتایج جستجو */}
                                {searchInventory && (
                                    <div className="absolute top-full mt-2 left-0 right-0 glass-panel rounded-xl border border-white/10 shadow-2xl z-50 p-2 overflow-hidden bg-[#1e293b]">
                                        {filteredInventory.length > 0 ? filteredInventory.map(p => (
                                            <div key={`search-item-${p.id}`} onClick={() => addPartToBOM(p)} className="p-3 hover:bg-nexus-primary/20 rounded-lg cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors">
                                                <div className="flex flex-col text-right flex-1">
                                                    <span className="text-xs font-bold text-white">{p.val}</span>
                                                    <div className="flex gap-2 items-center mt-1">
                                                        <span className="text-[9px] font-mono text-gray-400">{p.part_code}</span>
                                                        <SpecBadges item={p} />
                                                    </div>
                                                </div>
                                                <i data-lucide="plus" className="w-4 h-4 text-nexus-primary"></i>
                                            </div>
                                        )) : <div className="p-4 text-center text-[10px] text-gray-500 italic">قطعه‌ای با این مشخصات یافت نشد</div>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* جدول اقلام BOM */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead className="text-[10px] text-gray-500 uppercase tracking-widest bg-black/20 font-black">
                                    <tr>
                                        <th className="p-4 w-10"></th>
                                        <th className="p-4 font-black">کد اختصاصی</th>
                                        <th className="p-4 font-black text-right font-black">نام و مشخصات فنی</th>
                                        <th className="p-4 font-black text-center">واحد</th>
                                        <th className="p-4 font-black text-center">تعداد</th>
                                        <th className="p-4 font-black text-center">موجودی</th>
                                        <th className="p-4 font-black text-center">قیمت واحد ($)</th>
                                        <th className="p-4 font-black text-center">قیمت کل ($)</th>
                                        <th className="p-4 font-black text-center font-black">قیمت کل (تومان)</th>
                                        <th className="p-4 font-black text-center">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    {bomItems.map((item, idx) => {
                                        const unitPriceUSD = parseFloat(item.toman_price || 0) / parseFloat(item.usd_rate || 1);
                                        const rowTotalPriceUSD = unitPriceUSD * parseFloat(item.required_qty || 0);
                                        
                                        // محاسبه قیمت تومانی ردیف بر اساس نرخ انتخابی کاربر
                                        const rowTotalPriceToman = rowTotalPriceUSD * calculationRate;
                                        
                                        const totalRequiredInBatch = item.required_qty * productionCount;
                                        const isLowStock = (item.inventory_qty || 0) < totalRequiredInBatch;
                                        
                                        return (
                                            <tr 
                                                key={`bom-item-${item.part_id}`} 
                                                draggable 
                                                onDragStart={(e) => onDragStart(e, idx)}
                                                onDragOver={(e) => onDragOver(e, idx)}
                                                onDrop={(e) => onDrop(e, idx)}
                                                className={`bom-item-row hover:bg-white/5 cursor-move group font-medium ${draggedIndex === idx ? 'dragging' : ''}`}
                                            >
                                                <td className="p-4 text-gray-600"><i data-lucide="grip-vertical" className="w-4 h-4 opacity-0 group-hover:opacity-100"></i></td>
                                                <td className="p-4 font-mono text-[10px] text-nexus-accent">{item.part_code}</td>
                                                <td className="p-4 text-right">
                                                    <div className="font-bold text-white text-base leading-none">{item.val}</div>
                                                    <SpecBadges item={item} />
                                                </td>
                                                <td className="p-4 text-center text-gray-400">{item.unit || 'عدد'}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <input 
                                                            type="number" className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white font-black outline-none focus:border-nexus-primary transition-all"
                                                            value={item.required_qty} onChange={(e) => updateBOMQty(item.part_id, e.target.value)}
                                                        />
                                                        {productionCount > 1 && <span className="text-[9px] text-gray-500 mt-1">کل پارت: {totalRequiredInBatch}</span>}
                                                    </div>
                                                </td>
                                                <td className={`p-4 text-center font-black ${isLowStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                    {item.inventory_qty || 0}
                                                    {isLowStock && <div className="text-[8px] font-black uppercase text-rose-500 flex items-center justify-center gap-0.5"><i data-lucide="alert-triangle" className="w-2 h-2"></i> کسری</div>}
                                                </td>
                                                <td className="p-4 text-center font-mono text-[11px] text-blue-300 font-bold">
                                                    ${unitPriceUSD.toFixed(6)}
                                                </td>
                                                <td className="p-4 text-center font-mono text-[11px] text-nexus-accent font-bold">
                                                    ${rowTotalPriceUSD.toFixed(6)}
                                                </td>
                                                <td className="p-4 text-center font-black text-emerald-400 text-base">
                                                    {Math.round(rowTotalPriceToman).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => removeBOMItem(item.part_id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><i data-lucide="trash" className="w-4 h-4"></i></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {bomItems.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="p-12 text-center text-gray-600 italic">لیست قطعات پروژه خالی است. از بخش جستجو قطعات مورد نیاز را اضافه کنید.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* پنل هزینه‌های جانبی */}
                    <div className="glass-panel rounded-[2rem] border border-white/5 p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-white flex items-center gap-2"><i data-lucide="calculator" className="w-5 h-5 text-nexus-primary"></i> هزینه‌های جانبی تولید (دلار)</h3>
                            <button onClick={addExtraCost} className="text-[10px] font-black text-nexus-accent hover:text-white flex items-center gap-1 uppercase tracking-tighter transition-all">
                                <i data-lucide="plus" className="w-3 h-3"></i> افزودن ردیف هزینه
                            </button>
                        </div>
                        <div className="space-y-3">
                            {extraCosts.map((cost, idx) => (
                                <div key={`extra-cost-${idx}`} className="flex gap-3 animate-in fade-in slide-in-from-right-2">
                                    <input 
                                        className="flex-[3] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-nexus-primary"
                                        placeholder="شرح هزینه (مونتاژ، چاپ برد، طراحی جعبه و...)"
                                        value={cost.description} onChange={(e) => updateExtraCost(idx, 'description', e.target.value)}
                                    />
                                    <input 
                                        type="number" className="flex-[1] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white text-center font-bold outline-none focus:border-nexus-primary"
                                        placeholder="مبلغ ($)"
                                        value={cost.cost} onChange={(e) => updateExtraCost(idx, 'cost', e.target.value)}
                                    />
                                    <button onClick={() => setExtraCosts(extraCosts.filter((_, i) => i !== idx))} className="p-2 text-gray-600 hover:text-red-400 transition-colors"><i data-lucide="x" className="w-4 h-4"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ستون چپ: پنل محاسبات نهایی و عملیات انبار */}
                <div className="xl:col-span-4 sticky top-8 space-y-6">
                    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 shadow-2xl bg-gradient-to-b from-white/5 to-transparent">
                        
                        {/* [تگ: بخش جدید ورود نرخ دلار در بالای ستون] */}
                        <div className="mb-6">
                            <DollarRateWidget 
                                rate={calculationRate} 
                                setRate={setCalculationRate} 
                                serverRate={serverRate} 
                                config={config} 
                            />
                        </div>

                        <h3 className="text-lg font-black text-white mb-6 border-b border-white/5 pb-4">آنالیز نهایی هزینه پروژه (دقیق)</h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-400">
                                <span>تعداد واحد تولید در این پارت:</span>
                                <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5">
                                    <button onClick={() => setProductionCount(Math.max(1, productionCount - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-all">-</button>
                                    <input 
                                        type="number" className="w-12 bg-transparent text-center text-white font-black outline-none" 
                                        value={productionCount} onChange={(e) => setProductionCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                    <button onClick={() => setProductionCount(productionCount + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold transition-all">+</button>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">تنوع قطعات:</span>
                                <span className="text-white font-bold">{totals.variety} قلم</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">تعداد قطعات مصرفی (پارت):</span>
                                <span className="text-white font-bold">{totals.totalParts} عدد</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">مجموع هزینه قطعات (پارت):</span>
                                <span className="text-white font-mono font-bold">${totals.usdBatch.toFixed(6)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold">کل هزینه ارزی پارت (با جانبی):</span>
                                <span className="text-nexus-accent font-mono font-black text-xl">${totals.totalProductionUSD.toFixed(6)}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">نرخ تسعیر (%):</span>
                                <input 
                                    type="number" 
                                    className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white font-bold outline-none focus:border-nexus-primary transition-all"
                                    value={conversionRate} 
                                    onChange={(e) => setConversionRate(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">سود قطعه (%):</span>
                                <input 
                                    type="number" 
                                    className="w-16 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white font-bold outline-none focus:border-nexus-primary transition-all"
                                    value={partProfit} 
                                    onChange={(e) => setPartProfit(e.target.value)}
                                />
                            </div>

                            {/* بخش جدید نمایش سود به دلار و تومان */}
                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">سود کل پارت (ارزی):</span>
                                    <span className="text-emerald-400 font-mono font-bold">${totals.profitBatchUSD.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400">سود کل پارت (تومان):</span>
                                    <span className="text-emerald-400 font-black">{Math.round(totals.profitBatchToman).toLocaleString()} تومان</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10 space-y-4">
                                <div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase mb-1 tracking-widest">قیمت نهایی تولید (هر واحد)</div>
                                    <div className="text-4xl font-black text-white leading-tight">
                                        {Math.round(totals.unitFinalToman).toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 mr-2">تومان</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-nexus-accent font-black uppercase mb-1 tracking-widest">قیمت نهایی تولید (کل پارت)</div>
                                    <div className="text-5xl font-black text-white leading-tight bg-nexus-primary/10 p-3 rounded-2xl border border-nexus-primary/20 shadow-inner">
                                        {Math.round(totals.totalProductionToman).toLocaleString()}
                                        <span className="text-xs font-normal text-gray-500 mr-2 text-right">تومان</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button onClick={handlePrintBOM} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black">
                                <i data-lucide="printer" className="w-5 h-5"></i> چاپ رسمی لیست BOM
                            </button>
                        </div>
                    </div>

                    {/* دکمه عملیات انبار */}
                    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 shadow-2xl bg-emerald-500/5">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                             <i data-lucide="shopping-cart" className="w-5 h-5 text-emerald-400"></i> عملیات برداشت از انبار
                        </h3>
                        <p className="text-[10px] text-gray-400 mb-6 leading-relaxed">
                            با کسر موجودی پارت از انبار، تمامی تراکنش ها با قیمت دقیق دلار روز در لاگ سیستم H&Y ثبت می گردند.
                        </p>
                        <button 
                            key={`deduct-btn-${isDeducting}`}
                            disabled={isDeducting || bomItems.length === 0}
                            onClick={() => handleDeduct(false)}
                            className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
                        >
                            {isDeducting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <i data-lucide="layout-list" className="w-5 h-5"></i>
                            )}
                            کسر موجودی پارت از انبار
                        </button>
                    </div>
                </div>
            </div>

            {/* مودال هشدار کسری موجودی */}
            {shortageData && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="glass-panel border border-rose-500/30 p-8 rounded-[3rem] max-w-2xl w-full shadow-2xl bg-[#0f172a] text-right animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center"><i data-lucide="alert-triangle" className="w-7 h-7"></i></div>
                                موجودی انبار کافی نیست!
                            </h3>
                            <button onClick={() => setShortageData(null)} className="p-2 text-gray-500 hover:text-white transition-colors"><i data-lucide="x" className="w-6 h-6"></i></button>
                        </div>
                        
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6 mb-6">
                            <p className="text-sm text-rose-200 mb-4 font-bold">قطعات دارای کسری برای تولید {productionCount} واحد در انبار H&Y:</p>
                            <div className="max-h-[300px] overflow-y-auto custom-scroll pr-2">
                                <table className="w-full text-right text-xs">
                                    <thead className="text-gray-500 border-b border-white/5">
                                        <tr>
                                            <th className="py-3">نام قطعه</th>
                                            <th className="py-3 text-center">نیاز کل</th>
                                            <th className="py-3 text-center">موجود</th>
                                            <th className="py-3 text-center">کسری</th>
                                            <th className="py-3 text-left">محل انبار</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {shortageData.map((s, idx) => (
                                            <tr key={`shortage-item-${idx}`} className="text-white">
                                                <td className="py-3 font-bold">{s.val} <span className="text-[10px] text-gray-500 font-mono block">{s.part_code}</span></td>
                                                <td className="py-3 text-center font-mono">{s.required}</td>
                                                <td className="py-3 text-center font-mono text-rose-400">{s.in_stock}</td>
                                                <td className="py-3 text-center font-black text-rose-500 bg-rose-500/10 rounded-lg">{s.missing}</td>
                                                <td className="py-3 text-left font-mono text-nexus-accent">{s.location || 'نامشخص'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShortageData(null)} 
                                className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all border border-white/5"
                            >
                                انصراف
                            </button>
                            <button 
                                onClick={() => handleDeduct(true)} 
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

window.ProjectsPage = ProjectsPage;