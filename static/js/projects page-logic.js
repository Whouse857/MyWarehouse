// ====================================================================================================
// نسخه: 0.45 (سیستم H&Y - افزودن قابلیت کپی، ذخیره ضرایب و تکمیل کارت‌ها)
// فایل: projects page-logic.js (بخش منطق)
// تهیه کننده: Sargoli
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

window.useProjectsLogic = (user, serverStatus) => {
    const { useState, useEffect, useCallback, useMemo } = React;

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

    return {
        view, setView,
        projects, setProjects,
        searchTerm, setSearchTerm,
        loading, setLoading,
        liveUsdRate, setLiveUsdRate,
        isModalOpen, setIsModalOpen,
        projectForm, setProjectForm,
        activeProject, setActiveProject,
        bomItems, setBomItems,
        extraCosts, setExtraCosts,
        inventory, setInventory,
        searchInventory, setSearchInventory,
        isSaving, setIsSaving,
        productionCount, setProductionCount,
        shortageData, setShortageData,
        isDeducting, setIsDeducting,
        conversionRate, setConversionRate,
        partProfit, setPartProfit,
        draggedIndex, setDraggedIndex,
        fetchLiveRate,
        loadProjects,
        loadInventory,
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
    };
};