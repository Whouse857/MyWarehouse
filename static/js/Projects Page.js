// ====================================================================================================
// نسخه: 0.45 (سیستم H&Y - افزودن قابلیت کپی، ذخیره ضرایب و تکمیل کارت‌ها)
// فایل: Projects Page.js
// تهیه کننده: ------
//
// تغییرات اعمال شده:
// ۱. نمایش سود خالص پروژه به دلار و تومان در بخش آنالیز.
// ۲. تفکیک "مجموع هزینه قطعات پارت" از "کل هزینه ارزی (با جانبی)".
// ۳. بازنویسی کامل کارت‌های پروژه: نمایش تنوع، تعداد کل و قیمت دقیق هر پروژه در صفحه لیست.
// ۴. تثبیت قابلیت Drag & Drop برای تغییر ترتیب قطعات با حفظ منطق‌های پایدار قبلی.
// ۵. تمامی محاسبات با دقت ۶ رقم اعشار و بر اساس نرخ دلار زنده سیستم انجام می‌شود.
// ۶. اضافه شدن قابلیت کپی برداری (Duplicate) از کل پروژه.
// ۷. ذخیره و بازیابی نرخ تسعیر و درصد سود قطعه در دیتابیس.
// ۸. نمایش تعداد کل قطعات مونتاژی در کارت پروژه.
// ====================================================================================================

const { useState, useEffect, useCallback, useMemo } = React;

const ProjectsPage = ({ user, serverStatus }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: ابزارها و توابع کمکی]
    // ------------------------------------------------------------------------------------------------
    const fetchAPI = window.fetchAPI;
    const toShamsi = window.toShamsi;
    const notify = window.useNotify ? window.useNotify() : { show: (t, m) => console.log(t, m) };
    const dialog = window.useDialog ? window.useDialog() : { ask: () => Promise.resolve(true) };

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // ------------------------------------------------------------------------------------------------
    const [view, setView] = useState('list'); 
    const [projects, setProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [liveUsdRate, setLiveUsdRate] = useState(window.USD_RATE || 60000);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectForm, setProjectForm] = useState({ id: null, name: '', description: '' });

    const [activeProject, setActiveProject] = useState(null);
    const [bomItems, setBomItems] = useState([]);
    const [extraCosts, setExtraCosts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [searchInventory, setSearchInventory] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [productionCount, setProductionCount] = useState(1);
    const [shortageData, setShortageData] = useState(null); 
    const [isDeducting, setIsDeducting] = useState(false);

    const [conversionRate, setConversionRate] = useState(0);
    const [partProfit, setPartProfit] = useState(0);

    // وضعیت برای مدیریت جابجایی ترتیب (Drag & Drop)
    const [draggedIndex, setDraggedIndex] = useState(null);

    // دریافت نرخ دلار زنده
    const fetchLiveRate = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/inventory/stats');
            if (ok && data.live_usd_price) {
                setLiveUsdRate(data.live_usd_price);
            }
        } catch (e) { console.error("H&Y System: Rate fetch failed"); }
    }, [fetchAPI]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [view, projects, isModalOpen, bomItems, extraCosts, shortageData, searchInventory, loading, isSaving, isDeducting]);

    const loadProjects = useCallback(async () => {
        if (!fetchAPI) return;
        setLoading(true);
        try {
            const { ok, data } = await fetchAPI('/projects');
            if (ok) setProjects(data || []);
        } catch (e) { 
            notify.show('خطا', 'عدم برقراری ارتباط با سرور H&Y', 'error');
        } finally {
            setLoading(false);
        }
    }, [fetchAPI, notify]);

    const loadInventory = useCallback(async () => {
        if (!fetchAPI) return;
        try {
            const { ok, data } = await fetchAPI('/parts');
            if (ok) setInventory(data || []);
        } catch (e) { console.error("Inventory Load Error"); }
    }, [fetchAPI]);

    useEffect(() => { 
        loadProjects(); 
        loadInventory();
        fetchLiveRate();
    }, [loadProjects, loadInventory, fetchLiveRate]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: هندلرهای Drag & Drop]
    // ------------------------------------------------------------------------------------------------
    const onDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
    };

    const onDrop = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        
        const newItems = [...bomItems];
        const itemToMove = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, itemToMove);
        setBomItems(newItems);
        setDraggedIndex(null);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: کامپوننت نمایش مشخصات فنی رنگی]
    // ------------------------------------------------------------------------------------------------
    const SpecBadges = ({ item }) => {
        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {item.package && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold border border-blue-500/10">{item.package}</span>}
                {item.watt && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[9px] font-bold border border-amber-500/10">{item.watt}</span>}
                {item.tolerance && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-[9px] font-bold border border-purple-500/10">{item.tolerance}</span>}
                {item.tech && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold border border-emerald-500/10">{item.tech}</span>}
            </div>
        );
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: سیستم چاپ BOM حرفه‌ای H&Y]
    // ------------------------------------------------------------------------------------------------
    const handlePrintBOM = () => {
        const printWindow = window.open('', '_blank');
        const purchaseList = bomItems.filter(item => (item.inventory_qty || 0) < (item.required_qty * productionCount));

        const htmlContent = `
            <html dir="rtl">
            <head>
                <title>H&Y BOM - ${activeProject?.name}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; padding: 30px; color: #000; font-size: 12px; }
                    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .project-info { display: flex; justify-content: space-between; margin-bottom: 15px; background: #eee; padding: 12px; border: 1px solid #333; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 6px; text-align: center; }
                    th { background-color: #ddd; }
                    .specs { font-size: 9px; color: #333; display: block; margin-top: 2px; }
                    .footer { margin-top: 30px; display: flex; justify-content: flex-start; }
                    .totals-box { width: 400px; background: #f9f9f9; padding: 15px; border: 2px solid #000; }
                    .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .final-price { font-size: 15px; font-weight: bold; border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
                    .check-box { width: 16px; height: 16px; border: 1px solid #000; display: inline-block; }
                    .purchase-title { color: #d32f2f; border-right: 5px solid #d32f2f; padding-right: 10px; margin-top: 30px; font-size: 16px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>لیست قطعات پروژه (BOM)</h1>
                    <div style="font-weight: bold;">سیستم مدیریت هوشمند انبار H&Y</div>
                </div>
                
                <div class="project-info">
                    <span>پروژه: ${activeProject?.name}</span>
                    <span>تاریخ: ${toShamsi ? toShamsi(new Date().toISOString()) : new Date().toLocaleDateString('fa-IR')}</span>
                    <span>تعداد واحد تولید: ${productionCount} واحد</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">برداشت</th>
                            <th style="width: 30px;">ردیف</th>
                            <th style="width: 80px;">کد انبار</th>
                            <th>نام و مشخصات فنی کامل</th>
                            <th style="width: 40px;">واحد</th>
                            <th style="width: 40px;">تعداد</th>
                            <th style="width: 50px;">نیاز کل</th>
                            <th style="width: 90px;">محل انبار</th>
                            <th style="width: 90px;">قیمت واحد ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bomItems.map((item, idx) => {
                            const unitUSD = parseFloat(item.toman_price || 0) / parseFloat(item.usd_rate || 1);
                            const totalNeeded = item.required_qty * productionCount;
                            const specs = [item.package, item.watt, item.tolerance, item.tech].filter(Boolean).join(' | ');
                            return `
                                <tr>
                                    <td><div class="check-box"></div></td>
                                    <td>${idx + 1}</td>
                                    <td style="font-family: monospace;">${item.part_code}</td>
                                    <td style="text-align: right;">
                                        <strong>${item.val}</strong>
                                        <span class="specs">${specs}</span>
                                    </td>
                                    <td>${item.unit || 'عدد'}</td>
                                    <td>${item.required_qty}</td>
                                    <td style="font-weight: bold;">${totalNeeded}</td>
                                    <td style="font-size: 10px; font-weight: bold;">${item.storage_location || '-'}</td>
                                    <td style="font-family: monospace;">${unitUSD.toFixed(6)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                ${purchaseList.length > 0 ? `
                    <div class="purchase-title">لیست خرید قطعات کسری (نیاز به تامین)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px;">ردیف</th>
                                <th>نام قطعه و پکیج</th>
                                <th>کد انبار</th>
                                <th>موجودی فعلی</th>
                                <th>نیاز کل</th>
                                <th style="color: #d32f2f;">کسری خرید</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchaseList.map((item, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td style="text-align: right;"><strong>${item.val}</strong> (${item.package})</td>
                                    <td>${item.part_code}</td>
                                    <td>${item.inventory_qty || 0}</td>
                                    <td>${item.required_qty * productionCount}</td>
                                    <td style="font-weight: bold; color: #d32f2f;">${(item.required_qty * productionCount) - (item.inventory_qty || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <div class="footer">
                    <div class="totals-box">
                        <div class="totals-row"><span>تنوع قطعات:</span> <span>${totals.variety} ردیف</span></div>
                        <div class="totals-row"><span>هزینه دلاری قطعات ($):</span> <span>${totals.usdBatch.toFixed(6)}</span></div>
                        <div class="totals-row"><span>کل هزینه ارزی ($):</span> <span>${totals.totalProductionUSD.toFixed(6)}</span></div>
                        <div class="totals-row"><span>نرخ دلار (روز):</span> <span>${liveUsdRate.toLocaleString()} تومان</span></div>
                        <div class="final-price totals-row">
                            <span>قیمت نهایی کل پارت:</span> 
                            <span>${Math.round(totals.totalProductionToman).toLocaleString()} تومان</span>
                        </div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت عملیات]
    // ------------------------------------------------------------------------------------------------

    const handleOpenBOM = async (project) => {
        if (!fetchAPI || !project?.id) return;
        
        setLoading(true);
        try {
            const result = await fetchAPI(`/projects/${project.id}/details`);
            if (result && result.ok && result.data) {
                const { data } = result;
                setActiveProject(data.project || project);
                setBomItems(data.bom || []);
                setExtraCosts(data.costs || []);
                // بازیابی نرخ تسعیر و سود از دیتابیس
                setConversionRate(data.project.conversion_rate || 0);
                setPartProfit(data.project.part_profit || 0);
                
                setView('editor');
                setProductionCount(1);
            } else {
                notify.show('خطا در بارگذاری', 'پاسخ سرور نامعتبر بود. سیستم H&Y را بررسی کنید.', 'error');
            }
        } catch (e) {
            notify.show('خطای بحرانی', 'خطا در خواندن جزئیات BOM از دیتابیس', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProject = async () => {
        if (!projectForm.name.trim()) return notify.show('خطا', 'نام پروژه الزامی است', 'error');
        try {
            const { ok } = await fetchAPI('/projects/save', { method: 'POST', body: projectForm });
            if (ok) {
                setIsModalOpen(false);
                loadProjects();
                notify.show('موفقیت', 'پروژه با موفقیت در سیستم H&Y ثبت شد.', 'success');
            }
        } catch (e) { notify.show('خطا', 'خطای شبکه در ذخیره پروژه', 'error'); }
    };

    const handleDeleteProject = async (e, id) => {
        e.stopPropagation();
        if (await dialog.ask("حذف پروژه", "آیا از حذف پروژه و لیست BOM آن مطمئن هستید؟", "danger")) {
            try {
                const { ok } = await fetchAPI(`/projects/delete/${id}`, { method: 'DELETE' });
                if (ok) { loadProjects(); notify.show('حذف شد', 'پروژه حذف گردید.', 'success'); }
            } catch (e) { notify.show('خطا', 'خطا در حذف پروژه', 'error'); }
        }
    };

    const handleDuplicateProject = async (e, id) => {
        e.stopPropagation();
        if (await dialog.ask("کپی پروژه", "آیا از ایجاد نسخه کپی اطمینان دارید؟")) {
            setLoading(true); // نمایش لودینگ
            try {
                const { ok } = await fetchAPI(`/projects/duplicate/${id}`, { method: 'POST' });
                if (ok) { 
                    await loadProjects(); // حتما صبر میکنیم تا لیست دوباره لود شود
                    notify.show('موفقیت', 'پروژه کپی شد.', 'success'); 
                }
            } catch (e) { notify.show('خطا', 'خطا در کپی پروژه', 'error'); }
            finally { setLoading(false); }
        }
    };

    const saveBOMDetails = async () => {
        setIsSaving(true);
        try {
            // ۱. محاسبه دستی با محافظت در برابر تقسیم بر صفر (جلوگیری از ارسال Infinity)
            const bomTotalUSD = bomItems.reduce((sum, item) => {
                const price = parseFloat(item.toman_price || 0);
                // اگر نرخ دلار صفر یا نامعتبر بود، ۱ در نظر بگیر تا تقسیم بر صفر نشود
                let rate = parseFloat(item.usd_rate);
                if (!rate || rate <= 0) rate = 1; 
                
                const qty = parseFloat(item.required_qty || 0);
                return sum + ((price / rate) * qty);
            }, 0);
            
            const extraTotalUSD = extraCosts.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
            const unitTotalUSD = bomTotalUSD + extraTotalUSD;
            
            // قیمت کل پارت
            const totalBatchUSD = unitTotalUSD * productionCount;
            const totalCount = bomItems.reduce((sum, item) => sum + (parseFloat(item.required_qty) || 0), 0) * productionCount;

            const { ok, data } = await fetchAPI('/projects/save_details', {
                method: 'POST',
                body: {
                    project_id: activeProject.id,
                    bom: bomItems,
                    costs: extraCosts,
                    conversion_rate: parseFloat(conversionRate) || 0,
                    part_profit: parseFloat(partProfit) || 0,
                    total_price_usd: totalBatchUSD || 0,
                    total_count: totalCount || 0
                }
            });

            if (ok) {
                notify.show('موفقیت', 'پروژه با موفقیت ذخیره شد.', 'success');
                await loadProjects(); // رفرش لیست
                setView('list'); // بازگشت قطعی به لیست
            } else {
                // [مهم] نمایش خطای سمت سرور اگر عملیات موفق نبود
                console.error('Server Save Error:', data);
                notify.show('خطا', (data && data.error) || 'سرور خطا داد اما پیامی نفرستاد.', 'error');
            }
        } catch (e) { 
            console.error('Network Error:', e);
            notify.show('خطا', 'مشکل در ارتباط با سرور (کنسول را چک کنید)', 'error'); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const addPartToBOM = (part) => {
        const exists = bomItems.find(item => item.part_id === part.id);
        if (exists) return notify.show('تکراری', 'این قطعه قبلا در لیست موجود است', 'info');
        
        const newItem = {
            part_id: part.id,
            val: part.val,
            part_code: part.part_code,
            unit: part.unit || 'عدد',
            package: part.package,
            watt: part.watt,
            tolerance: part.tolerance,
            tech: part.tech,
            storage_location: part.storage_location,
            vendor_name: part.vendor_name,
            required_qty: 1,
            toman_price: parseFloat(part.toman_price || 0),
            usd_rate: parseFloat(part.usd_rate || 1),
            inventory_qty: part.quantity
        };
        setBomItems([...bomItems, newItem]);
        setSearchInventory("");
    };

    const updateBOMQty = (partId, qty) => {
        setBomItems(bomItems.map(item => 
            item.part_id === partId ? { ...item, required_qty: Math.max(1, parseInt(qty) || 0) } : item
        ));
    };

    const removeBOMItem = (partId) => {
        setBomItems(bomItems.filter(item => item.part_id !== partId));
    };

    const addExtraCost = () => {
        setExtraCosts([...extraCosts, { description: '', cost: 0 }]);
    };

    const updateExtraCost = (index, field, value) => {
        const newCosts = [...extraCosts];
        newCosts[index][field] = value;
        setExtraCosts(newCosts);
    };

    const handleDeduct = async (force = false) => {
        setIsDeducting(true);
        try {
            const { ok, data } = await fetchAPI('/projects/deduct', {
                method: 'POST',
                body: {
                    project_id: activeProject.id,
                    count: productionCount,
                    force: force,
                    username: user?.username || 'Admin'
                }
            });

            if (ok && data.success) {
                notify.show('موفقیت', `موجودی انبار برای تولید ${productionCount} واحد کسر شد.`, 'success');
                setShortageData(null);
                loadInventory();
                handleOpenBOM(activeProject);
            } else if (data && data.status === 'shortage') {
                setShortageData(data.shortages);
            } else {
                notify.show('خطا', (data && data.error) || 'خطا در انجام عملیات برداشت', 'error');
            }
        } catch (e) {
            notify.show('خطا', 'مشکل در ارتباط با سرور هنگام کسر موجودی', 'error');
        } finally {
            setIsDeducting(false);
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: منطق محاسبات مالی پیشرفته]
    // ------------------------------------------------------------------------------------------------
    const totals = useMemo(() => {
        // ۱. مجموع ارزش دلاری قطعات برای ۱ واحد
        const bomUnitUSD = bomItems.reduce((sum, item) => {
            const unitPriceUSD = parseFloat(item.toman_price || 0) / parseFloat(item.usd_rate || 1);
            return sum + (unitPriceUSD * parseFloat(item.required_qty || 0));
        }, 0);

        // ۲. مجموع هزینه های جانبی دلاری برای ۱ واحد
        const extraUnitUSD = extraCosts.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        
        // ۳. هزینه پایه کل برای ۱ واحد (دلار)
        const totalUnitUSD = bomUnitUSD + extraUnitUSD;
        
        // ۴. هزینه پایه کل برای ۱ واحد (تومان - بر اساس نرخ روز)
        const unitBaseToman = totalUnitUSD * liveUsdRate;
        
        // ۵. اعمال ضریب تسعیر (روی هزینه پایه)
        const afterConversionToman = unitBaseToman * (1 + (parseFloat(conversionRate) || 0) / 100);
        
        // ۶. محاسبه سود بر اساس قیمت نهایی
        const finalUnitToman = afterConversionToman * (1 + (parseFloat(partProfit) || 0) / 100);
        
        // ۷. مقادیر سود برای کل پارت
        const totalProfitToman = (finalUnitToman - afterConversionToman) * productionCount;
        const totalProfitUSD = totalProfitToman / liveUsdRate;

        return { 
            usdUnit: bomUnitUSD,
            usdBatch: bomUnitUSD * productionCount, // مجموع هزینه قطعات پارت
            extraUSD: extraUnitUSD,
            variety: bomItems.length,
            totalParts: bomItems.reduce((sum, item) => sum + (parseFloat(item.required_qty) || 0), 0) * productionCount,
            totalProductionUSD: totalUnitUSD * productionCount, // کل هزینه ارزی پارت (با جانبی)
            totalProductionToman: finalUnitToman * productionCount,
            unitFinalToman: finalUnitToman,
            profitBatchUSD: totalProfitUSD,
            profitBatchToman: totalProfitToman
        };
    }, [bomItems, extraCosts, productionCount, conversionRate, partProfit, liveUsdRate]);

    const filteredInventory = inventory.filter(p => 
        p.val.toLowerCase().includes(searchInventory.toLowerCase()) || 
        p.part_code.toLowerCase().includes(searchInventory.toLowerCase())
    ).slice(0, 10);

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ------------------------------------------------------------------------------------------------
    // [تگ: رندر رابط کاربری]
    // ------------------------------------------------------------------------------------------------

    if (view === 'list') {
        return (
            <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right" dir="rtl">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(p => {
                        const hasBOM = (p.bom_count || 0) > 0;
                        
                        // [محاسبه دقیق قیمت]
                        // ۱. قیمت دلاری پایه
                        const usdBase = parseFloat(p.total_price_usd || 0);
                        // ۲. دریافت ضرایب
                        const cRate = parseFloat(p.conversion_rate || 0);
                        const pProfit = parseFloat(p.part_profit || 0);
                        
                        // ۳. محاسبه قیمت نهایی: (قیمت دلار × نرخ روز) × (ضریب تسعیر) × (ضریب سود)
                        const baseToman = usdBase * liveUsdRate;
                        const finalPriceToman = baseToman * (1 + cRate / 100) * (1 + pProfit / 100);

                        return (
                            <div key={p.id} onClick={() => handleOpenBOM(p)} className="glass-panel p-5 rounded-[2rem] border border-white/5 hover:border-nexus-primary/40 transition-all group flex flex-col h-[280px] shadow-xl overflow-hidden relative cursor-pointer">
                                {/* افکت پس‌زمینه */}
                                <div className="absolute top-0 right-0 w-40 h-40 bg-nexus-primary/5 blur-3xl -z-10 group-hover:bg-nexus-primary/10 transition-all"></div>
                                
                                {/* هدر کارت: عنوان و دکمه‌ها */}
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h3 className="text-lg font-black text-white truncate pl-2">{p.name}</h3>
                                    
                                    {/* منوی عملیات مخفی */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl p-1 backdrop-blur-md absolute left-0 top-0">
                                        <button onClick={(e) => handleDuplicateProject(e, p.id)} title="کپی" className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500 hover:text-white transition-all"><i data-lucide="copy" className="w-4 h-4"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); setProjectForm(p); setIsModalOpen(true); }} title="ویرایش" className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-all"><i data-lucide="edit-3" className="w-4 h-4"></i></button>
                                        <button onClick={(e) => handleDeleteProject(e, p.id)} title="حذف" className="p-1.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all"><i data-lucide="trash-2" className="w-4 h-4"></i></button>
                                    </div>
                                </div>

                                {/* توضیحات پروژه */}
                                <p className="text-gray-400 text-[11px] leading-relaxed line-clamp-2 mb-4 h-8">{p.description || 'توضیحات ثبت نشده...'}</p>
                                
                                {/* بج‌های اطلاعاتی (تعداد و تنوع) */}
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

                                {/* فوتر کارت: تاریخ (راست) و قیمت (چپ) */}
                                <div className="pt-4 border-t border-white/5 mt-2 flex justify-between items-end relative z-10">
                                    
                                    {/* [اصلاح شده] تاریخ در سمت راست با چیدمان ثابت */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-gray-500 font-bold">آخرین تغییر:</span>
                                        <span className="text-[10px] text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                            {toShamsi ? toShamsi(p.last_modified) : p.last_modified}
                                        </span>
                                    </div>

                                    {/* بخش قیمت در سمت چپ */}
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

    return (
        <div className="flex-1 p-8 pb-20 overflow-y-auto custom-scroll text-right" dir="rtl">
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

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 space-y-6">
                    <div className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden">
                        <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><i data-lucide="package" className="w-5 h-5 text-nexus-primary"></i> لیست قطعات پروژه</h3>
                            <div className="relative w-80">
                                <i data-lucide="search" className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"></i>
                                <input 
                                    type="text" placeholder="افزودن قطعه (نام، کد یا مشخصات)..."
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pr-9 pl-3 text-xs text-white outline-none focus:border-nexus-primary"
                                    value={searchInventory} onChange={(e) => setSearchInventory(e.target.value)}
                                />
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
                                        const rowTotalPriceToman = rowTotalPriceUSD * liveUsdRate;
                                        
                                        const totalRequiredInBatch = item.required_qty * productionCount;
                                        const isLowStock = (item.inventory_qty || 0) < totalRequiredInBatch;
                                        
                                        return (
                                            <tr 
                                                key={`bom-item-${item.part_id}`} 
                                                draggable 
                                                onDragStart={(e) => onDragStart(e, idx)}
                                                onDragOver={(e) => onDragOver(e, idx)}
                                                onDrop={(e) => onDrop(e, idx)}
                                                className={`hover:bg-white/5 transition-colors group font-medium cursor-move ${draggedIndex === idx ? 'opacity-30 border-2 border-dashed border-nexus-primary' : ''}`}
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

                <div className="xl:col-span-4 sticky top-8 space-y-6">
                    <div className="glass-panel rounded-[2.5rem] p-8 border border-white/10 shadow-2xl bg-gradient-to-b from-white/5 to-transparent">
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
                            
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 items-start">
                                <i data-lucide="alert-circle" className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"></i>
                                <div className="text-[10px] text-blue-200/70 leading-relaxed font-medium">
                                    محاسبه نهایی بر اساس نرخ دلار جاری سیستم (${liveUsdRate.toLocaleString()} تومان) و ضرایب دقیق تعیین شده در سیستم H&Y انجام شده است.
                                </div>
                            </div>

                            <button onClick={handlePrintBOM} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black">
                                <i data-lucide="printer" className="w-5 h-5"></i> چاپ رسمی لیست BOM
                            </button>
                        </div>
                    </div>

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