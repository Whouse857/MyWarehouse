/**
 * ====================================================================================================
 * فایل: ProjectsPage.jsx
 * وظیفه: نقطه ورود اصلی و نمایش لیست پروژه‌ها
 * توضیحات: این فایل نقش کانتینر اصلی را دارد و بین لیست و BOM سوییچ می‌کند.
 * ====================================================================================================
 */

const { useState, useEffect } = React;

// ----------------------------------------------------------------------------------------------------
// [کامپوننت ویجت نرخ دلار]
// این ویجت در بالای لیست پروژه‌ها نمایش داده می‌شود
// ----------------------------------------------------------------------------------------------------
const DollarRateWidget = ({ rate, setRate, serverRate, config }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 mb-6 shadow-lg animate-scale-in">
        <div className="flex justify-between items-center">
            <label className="text-[11px] text-nexus-primary font-black flex items-center gap-2">
                <i data-lucide="dollar-sign" className="w-4 h-4"></i> نرخ دلار (تومان)
            </label>
            {/* نشانگر زنده بودن */}
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        
        <input 
            type="number" 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xl font-black text-center text-white outline-none focus:border-nexus-primary transition-all shadow-inner"
            value={rate} 
            onChange={(e) => setRate(Math.max(0, parseInt(e.target.value) || 0))} 
            placeholder="نرخ را وارد کنید..."
        />
        
        {/* دکمه‌های میانبر نرخ (سرور و تنظیمات) */}
        <div className="grid grid-cols-2 gap-2 mt-1">
            <button 
                onClick={() => serverRate.price > 0 && setRate(serverRate.price)} 
                className="text-[10px] bg-white/5 p-2 rounded-lg text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all flex flex-col items-center gap-1"
                title="استفاده از نرخ آنلاین سرور"
            >
                <span className="font-bold">آنلاین سرور</span>
                <span className="font-mono text-xs">{serverRate.price > 0 ? serverRate.price.toLocaleString() : '---'}</span>
            </button>
            <button 
                onClick={() => config?.['General']?.manual_usd_price && setRate(config['General'].manual_usd_price)} 
                className="text-[10px] bg-white/5 p-2 rounded-lg text-gray-300 hover:text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all flex flex-col items-center gap-1"
                title="استفاده از نرخ دستی تنظیمات"
            >
                <span className="font-bold">دستی تنظیمات</span>
                <span className="font-mono text-xs">{config?.['General']?.manual_usd_price ? parseInt(config['General'].manual_usd_price).toLocaleString() : '---'}</span>
            </button>
        </div>
    </div>
);

const ProjectsPage = ({ user, serverStatus }) => {
    // ------------------------------------------------------------------------------------------------
    // [Safety Check] بررسی بارگذاری فایل‌های لاجیک
    // اگر فایل‌های لاجیک هنوز لود نشده باشند، لودینگ نشان می‌دهیم
    // ------------------------------------------------------------------------------------------------
    if (!window.useProjectListLogic || !window.useProjectBomLogic) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white gap-4">
                <div className="lds-hourglass"></div>
                <span className="text-gray-400 text-sm animate-pulse">در حال راه اندازی ماژول پروژه...</span>
            </div>
        );
    }

    // وضعیت داخلی برای سوییچ بین صفحات
    const [view, setView] = useState('list');
    const [activeProjectData, setActiveProjectData] = useState(null);

    // استفاده از هوک منطق لیست (که قبلاً تایید شد)
    const listLogic = window.useProjectListLogic();
    const {
        projects, filteredProjects, loading, searchTerm, setSearchTerm,
        calculationRate, setCalculationRate, serverRate, config,
        isModalOpen, setIsModalOpen, projectForm, setProjectForm,
        handleSaveProject, handleDeleteProject, handleDuplicateProject, loadProjects
    } = listLogic;

    // بارگذاری آیکون‌ها هنگام تغییر ویو
    useEffect(() => {
        if (window.lucide) setTimeout(() => window.lucide.createIcons(), 100);
    }, [view, projects, isModalOpen]);

    const handleOpenProject = (project) => {
        setActiveProjectData(project);
        setView('editor');
    };

    // ------------------------------------------------------------------------------------------------
    // [RENDER MODE 1] حالت ویرایشگر BOM
    // اگر روی پروژه‌ای کلیک شده باشد، کامپوننت BOM را نشان می‌دهیم
    // ------------------------------------------------------------------------------------------------
    if (view === 'editor' && window.ProjectBOM) {
        return (
            <window.ProjectBOM 
                project={activeProjectData} 
                rate={calculationRate} // نرخ دلار فعلی را به صفحه بعد پاس می‌دهیم
                serverRate={serverRate}
                config={config}
                user={user}
                onBack={() => { setView('list'); loadProjects(); }} // هنگام بازگشت، لیست را رفرش می‌کنیم
            />
        );
    }

    // ------------------------------------------------------------------------------------------------
    // [RENDER MODE 2] حالت لیست پروژه‌ها (پیش‌فرض)
    // ------------------------------------------------------------------------------------------------
    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right" dir="rtl">
            {/* هدر صفحه */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 pb-6 border-b border-white/5">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <i data-lucide="briefcase" className="w-8 h-8 text-nexus-primary"></i> پروژه‌ها
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">مدیریت تولید، BOM و آنالیز هزینه</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <i data-lucide="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"></i>
                        <input 
                            type="text" 
                            placeholder="جستجو در پروژه‌ها..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white focus:border-nexus-primary outline-none transition-all"
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <button 
                        onClick={() => { setProjectForm({ id: null, name: '', description: '' }); setIsModalOpen(true); }} 
                        className="bg-nexus-primary hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <i data-lucide="plus" className="w-5 h-5"></i> <span className="hidden md:inline">پروژه جدید</span>
                    </button>
                </div>
            </div>

            {/* ویجت نرخ دلار */}
            <div className="max-w-xl mx-auto mb-8">
                <DollarRateWidget rate={calculationRate} setRate={setCalculationRate} serverRate={serverRate} config={config} />
            </div>

            {/* گرید کارت‌های پروژه */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">در حال دریافت لیست پروژه‌ها...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                    <i data-lucide="folder-open" className="w-16 h-16 mx-auto mb-4 opacity-20"></i>
                    <p>هیچ پروژه‌ای یافت نشد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
                    {filteredProjects.map(p => {
                        // محاسبه قیمت تقریبی برای نمایش روی کارت
                        const baseToman = (parseFloat(p.total_price_usd)||0) * calculationRate;
                        const finalPrice = baseToman * (1 + (parseFloat(p.conversion_rate)||0)/100) * (1 + (parseFloat(p.part_profit)||0)/100);
                        const hasBOM = (p.bom_count || 0) > 0;

                        return (
                            <div 
                                key={p.id} 
                                onClick={() => handleOpenProject(p)} 
                                className="glass-panel p-5 rounded-[2rem] border border-white/5 hover:border-nexus-primary/40 transition-all cursor-pointer group relative overflow-hidden h-[260px] flex flex-col hover:shadow-2xl hover:-translate-y-1"
                            >
                                {/* بک‌گراند نوری */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-primary/5 blur-3xl -z-10 group-hover:bg-nexus-primary/10 transition-all"></div>
                                
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-black text-white truncate pl-2 max-w-[70%]">{p.name}</h3>
                                    {/* دکمه‌های عملیات سریع (فقط وقتی موس روی کارت است دیده می‌شوند) */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl p-1 backdrop-blur-md z-10">
                                        <button onClick={(e)=>handleDuplicateProject(e, p.id)} className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded-lg transition-colors" title="کپی"><i data-lucide="copy" className="w-4 h-4"></i></button>
                                        <button onClick={(e)=>{e.stopPropagation();setProjectForm(p);setIsModalOpen(true);}} className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded-lg transition-colors" title="ویرایش"><i data-lucide="edit-3" className="w-4 h-4"></i></button>
                                        <button onClick={(e)=>handleDeleteProject(e, p.id)} className="p-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors" title="حذف"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                    </div>
                                </div>
                                
                                <p className="text-gray-400 text-[11px] line-clamp-2 mb-auto leading-relaxed">{p.description || 'توضیحات ثبت نشده...'}</p>
                                
                                <div className="flex gap-2 mb-4 mt-2">
                                    <div className="bg-white/5 px-2 py-1 rounded-lg text-[10px] text-gray-300 flex items-center gap-1 border border-white/5">
                                        <i data-lucide="layers" className="w-3 h-3 text-indigo-400"></i> {p.total_parts_count || 0} قطعه
                                    </div>
                                    <div className="bg-white/5 px-2 py-1 rounded-lg text-[10px] text-gray-300 flex items-center gap-1 border border-white/5">
                                        <i data-lucide="list" className="w-3 h-3 text-blue-400"></i> {p.bom_count || 0} تنوع
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 mt-auto flex justify-between items-end">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500">آخرین تغییر:</span>
                                        <span className="text-[10px] text-gray-400 font-mono">
                                            {window.toShamsi ? window.toShamsi(p.last_modified) : p.last_modified}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        {hasBOM ? (
                                            <>
                                                <div className="text-xl font-black text-emerald-400">{Math.round(finalPrice).toLocaleString()} <span className="text-[9px]">تومان</span></div>
                                                <div className="text-[9px] text-gray-500 font-mono">Base: ${(parseFloat(p.total_price_usd)||0).toFixed(2)}</div>
                                            </>
                                        ) : (
                                            <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/10">BOM خالی</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* مودال ایجاد/ویرایش پروژه */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={()=>setIsModalOpen(false)}>
                    <div className="glass-panel border border-white/10 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl bg-[#0f172a] text-right animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className={`p-3 rounded-2xl ${projectForm.id ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                <i data-lucide={projectForm.id ? "edit-3" : "folder-plus"} className="w-6 h-6"></i>
                            </div>
                            <h3 className="text-2xl font-black text-white">{projectForm.id ? 'ویرایش پروژه' : 'پروژه جدید'}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 mr-2 font-bold">نام پروژه <span className="text-rose-500">*</span></label>
                                <input className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none focus:border-nexus-primary transition-colors" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="مثال: برد کنترلی V2" autoFocus />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 mr-2 font-bold">توضیحات (اختیاری)</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm mb-2 min-h-[100px] outline-none focus:border-nexus-primary transition-colors resize-none" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} placeholder="توضیحات تکمیلی..." />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-colors">لغو</button>
                            <button onClick={handleSaveProject} className="flex-[2] py-4 rounded-2xl bg-nexus-primary text-white font-black shadow-lg hover:bg-indigo-600 transition-all active:scale-95">ذخیره نهایی</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.ProjectsPage = ProjectsPage;