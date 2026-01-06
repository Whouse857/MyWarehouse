/**
 * ====================================================================================================
 * فایل: project-bom-logic.js
 * وظیفه: مدیریت منطق صفحه جزئیات پروژه (BOM)، محاسبات و کسر از انبار
 * توضیحات: شامل تمام توابع محاسباتی و تابع حیاتی handlePrintBOM (فاکتور رسمی) بدون حذفیات.
 * ====================================================================================================
 */

window.useProjectBomLogic = (initialProject, initialRate) => {
    const { useState, useEffect, useMemo, useCallback } = React;
    const fetchAPI = window.fetchAPI;
    const notify = window.useNotify ? window.useNotify() : { show: (t, m) => console.log(t, m) };
    const toShamsi = window.toShamsi;

    // --- State Definition ---
    const [activeProject, setActiveProject] = useState(initialProject);
    const [bomItems, setBomItems] = useState([]);
    const [extraCosts, setExtraCosts] = useState([]);
    const [inventory, setInventory] = useState([]);
    
    // وضعیت‌های داخلی صفحه
    const [searchInventory, setSearchInventory] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeducting, setIsDeducting] = useState(false);
    const [shortageData, setShortageData] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);

    // پارامترهای محاسباتی
    const [productionCount, setProductionCount] = useState(1);
    const [conversionRate, setConversionRate] = useState(0);
    const [partProfit, setPartProfit] = useState(0);
    
    // نرخ دلار (که از والد گرفته می‌شود اما اینجا هم قابل تغییر است برای محاسبات داخلی)
    const [calculationRate, setCalculationRate] = useState(initialRate || 60000);

    // --- API Calls ---

    const loadBOMDetails = useCallback(async () => {
        if (!activeProject?.id) return;
        try {
            const result = await fetchAPI(`/projects/${activeProject.id}/details`);
            if (result.ok && result.data) {
                const { data } = result;
                setBomItems(data.bom || []);
                setExtraCosts(data.costs || []);
                setConversionRate(data.project.conversion_rate || 0);
                setPartProfit(data.project.part_profit || 0);
            } else {
                notify.show('خطا در بارگذاری', 'پاسخ سرور نامعتبر بود.', 'error');
            }
        } catch (e) { notify.show('خطای بحرانی', 'خطا در خواندن جزئیات BOM از دیتابیس', 'error'); }
    }, [activeProject?.id, fetchAPI]);

    const loadInventory = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/parts');
            if (ok) setInventory(data || []);
        } catch (e) { console.error("Inventory Load Error"); }
    }, [fetchAPI]);

    // لود اولیه
    useEffect(() => {
        loadBOMDetails();
        loadInventory();
    }, [loadBOMDetails, loadInventory]);

    // سینک کردن نرخ دلار اگر والد تغییر کرد
    useEffect(() => {
        if (initialRate) setCalculationRate(initialRate);
    }, [initialRate]);

    // --- Drag & Drop Logic ---
    const onDragStart = (e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = "move"; };
    const onDragOver = (e) => { e.preventDefault(); };
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

    // --- BOM Item Management ---
    const addPartToBOM = (part) => {
        const exists = bomItems.find(item => item.part_id === part.id);
        if (exists) return notify.show('تکراری', 'این قطعه قبلا در لیست موجود است', 'info');
        setBomItems([...bomItems, {
            part_id: part.id, val: part.val, part_code: part.part_code,
            unit: part.unit || 'عدد', package: part.package, watt: part.watt,
            tolerance: part.tolerance, tech: part.tech, storage_location: part.storage_location,
            required_qty: 1, toman_price: parseFloat(part.toman_price || 0),
            usd_rate: parseFloat(part.usd_rate || 1), inventory_qty: part.quantity,
            vendor_name: part.vendor_name
        }]);
        setSearchInventory("");
    };

    const updateBOMQty = (partId, qty) => {
        setBomItems(bomItems.map(item => item.part_id === partId ? { ...item, required_qty: Math.max(1, parseInt(qty) || 0) } : item));
    };

    const removeBOMItem = (partId) => setBomItems(bomItems.filter(item => item.part_id !== partId));

    // --- Calculations ---
    const totals = useMemo(() => {
        const rateToUse = parseFloat(calculationRate) || 0;
        const bomUnitUSD = bomItems.reduce((sum, item) => sum + ((parseFloat(item.toman_price||0)/parseFloat(item.usd_rate||1)) * parseFloat(item.required_qty||0)), 0);
        const extraUnitUSD = extraCosts.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        const totalUnitUSD = bomUnitUSD + extraUnitUSD;
        
        const unitBaseToman = totalUnitUSD * rateToUse;
        const afterConversion = unitBaseToman * (1 + (parseFloat(conversionRate)||0)/100);
        const finalUnitToman = afterConversion * (1 + (parseFloat(partProfit)||0)/100);
        const totalProfitToman = (finalUnitToman - afterConversion) * productionCount;

        return {
            usdUnit: bomUnitUSD, usdBatch: bomUnitUSD * productionCount,
            totalProductionUSD: totalUnitUSD * productionCount,
            totalProductionToman: finalUnitToman * productionCount,
            unitFinalToman: finalUnitToman,
            profitBatchUSD: rateToUse > 0 ? totalProfitToman / rateToUse : 0,
            profitBatchToman: totalProfitToman,
            variety: bomItems.length,
            totalParts: bomItems.reduce((sum, item) => sum + (parseFloat(item.required_qty)||0), 0) * productionCount
        };
    }, [bomItems, extraCosts, productionCount, conversionRate, partProfit, calculationRate]);

    // --- Printing System (سیستم کامل پرینت) ---
    const handlePrintBOM = () => {
        const printWindow = window.open('', '_blank');
        const purchaseList = bomItems.filter(item => (item.inventory_qty || 0) < (item.required_qty * productionCount));
        const usdStatusText = `(مبنای محاسبه: ${calculationRate.toLocaleString()} تومان)`;

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
                        <div class="totals-row">
                            <span>نرخ دلار:</span> 
                            <span>${calculationRate.toLocaleString()} تومان <br/><small>${usdStatusText}</small></span>
                        </div>
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

    // --- Actions (Save/Deduct) ---
    const saveBOMDetails = async () => {
        setIsSaving(true);
        try {
            // محاسبه دقیق قیمت دلاری برای ذخیره
            const bomTotalUSD = bomItems.reduce((sum, item) => {
                const price = parseFloat(item.toman_price || 0);
                let rate = parseFloat(item.usd_rate);
                if (!rate || rate <= 0) rate = 1; 
                const qty = parseFloat(item.required_qty || 0);
                return sum + ((price / rate) * qty);
            }, 0);
            
            const extraTotalUSD = extraCosts.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
            const unitTotalUSD = bomTotalUSD + extraTotalUSD;
            const totalBatchUSD = unitTotalUSD * productionCount;
            const totalCount = bomItems.reduce((sum, item) => sum + (parseFloat(item.required_qty) || 0), 0) * productionCount;

            const { ok, data } = await fetchAPI('/projects/save_details', {
                method: 'POST',
                body: {
                    project_id: activeProject.id, bom: bomItems, costs: extraCosts,
                    conversion_rate: conversionRate, part_profit: partProfit,
                    total_price_usd: totalBatchUSD || 0, total_count: totalCount || 0
                }
            });

            if (ok) { 
                notify.show('موفقیت', 'پروژه با موفقیت ذخیره شد.', 'success'); 
                return true; 
            } else {
                notify.show('خطا', (data && data.error) || 'سرور خطا داد اما پیامی نفرستاد.', 'error');
            }
        } catch (e) { notify.show('خطا', 'مشکل در ارتباط با سرور (کنسول را چک کنید)', 'error'); } 
        finally { setIsSaving(false); }
        return false;
    };

    const handleDeduct = async (force = false, user) => {
        setIsDeducting(true);
        try {
            const { ok, data } = await fetchAPI('/projects/deduct', {
                method: 'POST',
                body: { project_id: activeProject.id, count: productionCount, force, username: user?.username || 'Admin' }
            });
            if (ok && data.success) {
                notify.show('موفقیت', `موجودی انبار برای تولید ${productionCount} واحد کسر شد.`, 'success');
                setShortageData(null); loadInventory(); loadBOMDetails();
            } else if (data?.status === 'shortage') {
                setShortageData(data.shortages);
            } else {
                notify.show('خطا', (data && data.error) || 'خطا در انجام عملیات برداشت', 'error');
            }
        } catch (e) { notify.show('خطا', 'مشکل در ارتباط با سرور هنگام کسر موجودی', 'error'); }
        finally { setIsDeducting(false); }
    };

    // فیلتر جستجوی انبار
    const filteredInventory = inventory.filter(p => p.val.toLowerCase().includes(searchInventory.toLowerCase()) || p.part_code.toLowerCase().includes(searchInventory.toLowerCase())).slice(0, 10);

    return {
        activeProject, bomItems, extraCosts, inventory,
        searchInventory, setSearchInventory, filteredInventory,
        isSaving, isDeducting, shortageData, setShortageData,
        productionCount, setProductionCount, calculationRate, setCalculationRate,
        conversionRate, setConversionRate, partProfit, setPartProfit,
        draggedIndex,
        
        addPartToBOM, updateBOMQty, removeBOMItem,
        setExtraCosts, saveBOMDetails, handleDeduct,
        handlePrintBOM, // تابع کامل پرینت
        onDragStart, onDragOver, onDrop, totals, toShamsi
    };
};