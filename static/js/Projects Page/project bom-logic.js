/**
 * ====================================================================================================
 * فایل: project-bom-logic.js
 * وظیفه: مدیریت منطق صفحه جزئیات پروژه (BOM)، محاسبات و کسر از انبار
 * تغییرات: افزودن قابلیت انتخاب قطعات برای کسر (Checkbox Logic) و آنالیز دقیق
 * ====================================================================================================
 */

window.useProjectBomLogic = (initialProject, initialRate) => {
    const { useState, useEffect, useMemo, useCallback, useRef } = React;
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

    // [جدید] وضعیت‌های گزارش و انتخاب کسر از انبار
    const [deductionReport, setDeductionReport] = useState({ available: [], missing: [] });
    const [deductionSelection, setDeductionSelection] = useState([]); // لیست آیدی‌های انتخاب شده
    const [showDeductionModal, setShowDeductionModal] = useState(false);

    const [targetParentIdForAlt, setTargetParentIdForAlt] = useState(null);
    const [lastSwappedId, setLastSwappedId] = useState(null);

    // وضعیت مودال حذف
    const [deleteModal, setDeleteModal] = useState({ 
        isOpen: false, id: null, parentId: null, title: "", message: "" 
    });

    const isMounted = useRef(true);

    const [productionCount, setProductionCount] = useState(1);
    const [conversionRate, setConversionRate] = useState(0);
    const [partProfit, setPartProfit] = useState(0);
    const [calculationRate, setCalculationRate] = useState(initialRate || 60000);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // --- API Calls ---
    const loadBOMDetails = useCallback(async () => {
        if (!activeProject?.id) return;
        try {
            const result = await fetchAPI(`/projects/${activeProject.id}/details`);
            if (isMounted.current && result.ok && result.data) {
                const { data } = result;
                const processedBOM = (data.bom || []).map(item => ({
                    ...item,
                    isSelected: item.isSelected !== false,
                    alternatives: item.alternatives ? item.alternatives.map(alt => ({...alt, isSelected: !!alt.isSelected})) : [],
                    isExpanded: false
                }));
                setBomItems(processedBOM);
                setExtraCosts(data.costs || []);
                setConversionRate(data.project.conversion_rate || 0);
                setPartProfit(data.project.part_profit || 0);
            }
        } catch (e) { 
            if (isMounted.current) notify.show('خطای بحرانی', 'خطا در دریافت اطلاعات', 'error'); 
        }
    }, [activeProject?.id, fetchAPI]);

    const loadInventory = useCallback(async () => {
        try {
            const { ok, data } = await fetchAPI('/parts');
            if (isMounted.current && ok) setInventory(data || []);
        } catch (e) { console.error("Inventory Load Error"); }
    }, [fetchAPI]);

    useEffect(() => {
        loadBOMDetails();
        loadInventory();
    }, [loadBOMDetails, loadInventory]);

    useEffect(() => {
        if (initialRate) setCalculationRate(initialRate);
    }, [initialRate]);

    useEffect(() => {
        if (lastSwappedId) {
            const timer = setTimeout(() => {
                if (isMounted.current) setLastSwappedId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [lastSwappedId]);

    // --- Drag & Drop & BOM Logic ---
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
    const onDragEnd = () => setDraggedIndex(null);

    const addPartToBOM = (part) => {
        if (targetParentIdForAlt) {
            const parentIndex = bomItems.findIndex(i => i.part_id === targetParentIdForAlt);
            if (parentIndex !== -1) {
                const newItems = [...bomItems];
                const parent = newItems[parentIndex];
                if (parent.alternatives.find(a => a.part_id === part.id) || parent.part_id === part.id) {
                    notify.show('تکراری', 'این قطعه قبلاً وجود دارد', 'warning'); return;
                }
                parent.alternatives.push({
                    part_id: part.id, val: part.val, part_code: part.part_code,
                    unit: part.unit || 'عدد', package: part.package, watt: part.watt,
                    tolerance: part.tolerance, tech: part.tech, storage_location: part.storage_location,
                    required_qty: parent.required_qty, toman_price: parseFloat(part.toman_price || 0),
                    usd_rate: parseFloat(part.usd_rate || 1), inventory_qty: part.quantity,
                    vendor_name: part.vendor_name, isSelected: false
                });
                parent.isExpanded = true;
                setBomItems(newItems); setSearchInventory(""); setTargetParentIdForAlt(null); return;
            }
        }
        const exists = bomItems.find(item => item.part_id === part.id);
        if (exists) return notify.show('تکراری', 'این قطعه قبلا موجود است', 'info');
        setBomItems([...bomItems, {
            part_id: part.id, val: part.val, part_code: part.part_code,
            unit: part.unit || 'عدد', package: part.package, watt: part.watt,
            tolerance: part.tolerance, tech: part.tech, storage_location: part.storage_location,
            required_qty: 1, toman_price: parseFloat(part.toman_price || 0),
            usd_rate: parseFloat(part.usd_rate || 1), inventory_qty: part.quantity,
            vendor_name: part.vendor_name, alternatives: [], isSelected: true, isExpanded: false
        }]);
        setSearchInventory("");
    };

    const updateBOMQty = (partId, qty) => {
        const val = Math.max(1, parseInt(qty) || 0);
        setBomItems(bomItems.map(item => item.part_id === partId ? { ...item, required_qty: val } : item));
    };

    const requestDelete = (partId, parentId = null) => {
        const title = parentId ? "حذف جایگزین" : "حذف قطعه اصلی";
        const message = parentId ? "آیا از حذف این قطعه جایگزین اطمینان دارید؟" : "آیا از حذف این قطعه و تمام زیرمجموعه‌های آن اطمینان دارید؟";
        setDeleteModal({ isOpen: true, id: partId, parentId: parentId, title: title, message: message });
    };

    const confirmDelete = () => {
        const { id, parentId } = deleteModal;
        if (!id) return;
        if (parentId) {
            const newItems = [...bomItems];
            const parent = newItems.find(i => i.part_id === parentId);
            if (parent) {
                parent.alternatives = parent.alternatives.filter(a => a.part_id !== id);
                if (!parent.isSelected && !parent.alternatives.some(a => a.isSelected)) parent.isSelected = true;
            }
            setBomItems(newItems);
        } else {
            setBomItems(bomItems.filter(item => item.part_id !== id));
        }
        setDeleteModal({ isOpen: false, id: null, parentId: null, title: "", message: "" });
    };

    const cancelDelete = () => setDeleteModal({ isOpen: false, id: null, parentId: null, title: "", message: "" });
    const removeBOMItem = (partId, parentId = null) => requestDelete(partId, parentId);
    
    const toggleExpand = (partId) => setBomItems(bomItems.map(item => item.part_id === partId ? { ...item, isExpanded: !item.isExpanded } : item));
    
    const toggleSelection = (parentId, childId = null) => {
        const newItems = [...bomItems];
        const parentIndex = newItems.findIndex(i => i.part_id === parentId);
        if (parentIndex === -1) return;
        const parent = newItems[parentIndex];
        if (childId === null) {
            if (!parent.isSelected) {
                parent.isSelected = true;
                parent.alternatives.forEach(a => a.isSelected = false);
                setBomItems(newItems);
            }
            return;
        }
        const childIndex = parent.alternatives.findIndex(a => a.part_id === childId);
        if (childIndex === -1) return;
        const child = parent.alternatives[childIndex];
        const newParent = {
            ...child, required_qty: parent.required_qty, isSelected: true, isExpanded: true,
            alternatives: [...parent.alternatives.filter(a => a.part_id !== childId), { ...parent, isSelected: false, alternatives: [], isExpanded: false }]
        };
        newItems[parentIndex] = newParent;
        setBomItems(newItems);
        setLastSwappedId(child.part_id);
    };

    // --- Calculations ---
    const totals = useMemo(() => {
        const rateToUse = parseFloat(calculationRate) || 0;
        let bomUnitUSD = 0;
        let totalPartsCount = 0;
        bomItems.forEach(item => {
            let activeItem = item.isSelected ? item : item.alternatives.find(a => a.isSelected) || item;
            const price = parseFloat(activeItem.toman_price || 0) / parseFloat(activeItem.usd_rate || 1);
            const qty = parseFloat(item.required_qty || 0);
            bomUnitUSD += (price * qty);
            totalPartsCount += (qty * productionCount);
        });
        const extraUnitUSD = extraCosts.reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
        const totalUnitUSD = bomUnitUSD + extraUnitUSD;
        const unitBaseToman = totalUnitUSD * rateToUse;
        const afterConversion = unitBaseToman * (1 + (parseFloat(conversionRate)||0)/100);
        const finalUnitToman = afterConversion * (1 + (parseFloat(partProfit)||0)/100);
        return {
            usdUnit: bomUnitUSD, usdBatch: bomUnitUSD * productionCount,
            totalProductionUSD: totalUnitUSD * productionCount, totalProductionToman: finalUnitToman * productionCount,
            unitFinalToman: finalUnitToman, profitBatchUSD: rateToUse > 0 ? ((finalUnitToman - afterConversion) * productionCount) / rateToUse : 0,
            profitBatchToman: (finalUnitToman - afterConversion) * productionCount,
            variety: bomItems.length, totalParts: totalPartsCount
        };
    }, [bomItems, extraCosts, productionCount, conversionRate, partProfit, calculationRate]);

    // [جدید] توابع مدیریت کسر از انبار
    const analyzeDeduction = () => {
        const available = [];
        const missing = [];
        const allIds = [];

        bomItems.forEach(item => {
            // فقط آیتم فعال
            const activeItem = item.isSelected ? item : item.alternatives.find(a => a.isSelected);
            
            if (activeItem) {
                const totalRequired = (item.required_qty || 0) * productionCount;
                const currentInventory = activeItem.inventory_qty || 0;
                
                const reportItem = {
                    id: activeItem.part_id,
                    name: activeItem.val,
                    code: activeItem.part_code,
                    needed: totalRequired,
                    inventory: currentInventory,
                    location: activeItem.storage_location,
                    // محاسبه کسری دقیق
                    shortage: Math.max(0, totalRequired - currentInventory)
                };

                if (currentInventory >= totalRequired) {
                    available.push(reportItem);
                } else {
                    missing.push(reportItem);
                }
                allIds.push(activeItem.part_id);
            }
        });

        // پیش‌فرض: همه تیک خورده باشند
        setDeductionSelection(allIds);
        setDeductionReport({ available, missing });
        setShowDeductionModal(true);
    };

    const toggleDeductionItem = (id) => {
        setDeductionSelection(prev => {
            if (prev.includes(id)) return prev.filter(i => i !== id);
            return [...prev, id];
        });
    };

    const handleDeduct = async (force = false, user) => {
        setIsDeducting(true);
        try {
            // فقط قطعاتی که تیک خورده‌اند ارسال می‌شوند
            const { ok, data } = await fetchAPI('/projects/deduct', {
                method: 'POST',
                body: { 
                    project_id: activeProject.id, 
                    count: productionCount, 
                    force, 
                    username: user?.username || 'Admin',
                    selected_part_ids: deductionSelection // ارسال لیست انتخابی
                }
            });

            if (ok && data.success) {
                notify.show('موفقیت', `موجودی انبار (برای ${deductionSelection.length} قطعه انتخاب شده) کسر شد.`, 'success');
                setShortageData(null); 
                setShowDeductionModal(false); // بستن مودال
                loadInventory(); 
                loadBOMDetails();
            } else if (data?.status === 'shortage') {
                // اگر سرور همچنان ارور کسری داد (نباید پیش بیاید اگر لیست درست باشد)
                setShortageData(data.shortages);
                setShowDeductionModal(false);
            } else {
                notify.show('خطا', (data && data.error) || 'خطا در عملیات', 'error');
            }
        } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); }
        finally { if (isMounted.current) setIsDeducting(false); }
    };

    const saveBOMDetails = async () => {
        setIsSaving(true);
        try {
            const bomTotalUSD = bomItems.reduce((sum, item) => {
                 const active = item.isSelected ? item : item.alternatives.find(a => a.isSelected) || item;
                 const price = parseFloat(active.toman_price || 0);
                 let rate = parseFloat(active.usd_rate); if (!rate) rate = 1;
                 return sum + ((price / rate) * parseFloat(item.required_qty || 0));
            }, 0);
            const extraTotalUSD = extraCosts.reduce((s, i) => s + (parseFloat(i.cost)||0), 0);
            const totalBatchUSD = (bomTotalUSD + extraTotalUSD) * productionCount;
            const totalCount = bomItems.reduce((s, i) => s + (parseFloat(i.required_qty)||0), 0) * productionCount;

            const { ok, data } = await fetchAPI('/projects/save_details', {
                method: 'POST',
                body: {
                    project_id: activeProject.id, bom: bomItems, costs: extraCosts,
                    conversion_rate: conversionRate, part_profit: partProfit,
                    total_price_usd: totalBatchUSD, total_count: totalCount
                }
            });
            if (ok) { notify.show('موفقیت', 'ذخیره شد.', 'success'); return true; }
        } catch (e) { notify.show('خطا', 'خطای شبکه', 'error'); } 
        finally { if (isMounted.current) setIsSaving(false); }
        return false;
    };

    const handlePrintBOM = () => {
        const printWindow = window.open('', '_blank');
        
        const activeList = [];
        bomItems.forEach(item => {
            const active = item.isSelected ? item : item.alternatives.find(a => a.isSelected);
            if (active) {
                const finalItem = { ...active, required_qty: item.required_qty }; 
                activeList.push(finalItem);
            }
        });

        const purchaseList = activeList.filter(item => (item.inventory_qty || 0) < (item.required_qty * productionCount));
        
        const htmlContent = `
            <html dir="rtl">
            <head>
                <base href="${window.location.origin}/" />
                <title>H&Y BOM - ${activeProject?.name}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; padding: 30px; color: #000; font-size: 12px; }
                    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .header h1 { margin: 10px 0 5px 0; font-size: 24px; }
                    .logo-box { text-align: center; margin-bottom: 15px; }
                    .logo-box img { max-height: 80px; width: auto; object-fit: contain; }
                    .project-info { display: flex; justify-content: space-between; margin-bottom: 15px; background: #eee; padding: 12px; border: 1px solid #333; font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 6px; text-align: center; }
                    th { background-color: #ddd; }
                    .specs { font-size: 9px; color: #333; display: block; margin-top: 2px; }
                    .footer { margin-top: 30px; display: flex; justify-content: flex-start; }
                    .totals-box { width: 400px; background: #f9f9f9; padding: 15px; border: 2px solid #000; }
                    .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .check-box { width: 16px; height: 16px; border: 1px solid #000; display: inline-block; }
                    .purchase-title { color: #d32f2f; border-right: 5px solid #d32f2f; padding-right: 10px; margin-top: 30px; font-size: 16px; font-weight: bold; }
                    .note { font-size: 10px; color: #666; margin-top: 5px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-box">
                        <img src="/static/logo.png" alt="Company Logo" onerror="this.style.display='none'; console.log('Logo not found at /static/logo.png');" />
                    </div>
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
                            <th>نام و مشخصات فنی (گزینه نهایی)</th>
                            <th style="width: 40px;">واحد</th>
                            <th style="width: 40px;">تعداد</th>
                            <th style="width: 50px;">نیاز کل</th>
                            <th style="width: 90px;">محل انبار</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeList.map((item, idx) => {
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
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="note">* این لیست فقط شامل قطعات انتخاب شده (تیک خورده) در BOM است. گزینه‌های جایگزین چاپ نشده‌اند.</div>

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
                        <div class="totals-row"><span>تعداد کل قطعات:</span> <span>${totals.totalParts} عدد</span></div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const filteredInventory = inventory.filter(p => p.val.toLowerCase().includes(searchInventory.toLowerCase()) || p.part_code.toLowerCase().includes(searchInventory.toLowerCase())).slice(0, 10);

    return {
        activeProject, bomItems, extraCosts, inventory,
        searchInventory, setSearchInventory, filteredInventory,
        isSaving, isDeducting, shortageData, setShortageData,
        productionCount, setProductionCount, calculationRate, setCalculationRate,
        conversionRate, setConversionRate, partProfit, setPartProfit,
        draggedIndex, lastSwappedId, targetParentIdForAlt, setTargetParentIdForAlt,
        
        addPartToBOM, updateBOMQty, removeBOMItem,
        deleteModal, requestDelete, confirmDelete, cancelDelete,
        
        // اکسپورت‌های جدید
        deductionReport, showDeductionModal, setShowDeductionModal, 
        analyzeDeduction, deductionSelection, toggleDeductionItem,
        
        toggleExpand, toggleSelection, setExtraCosts, saveBOMDetails, handleDeduct, handlePrintBOM, 
        onDragStart, onDragOver, onDrop, onDragEnd, totals, toShamsi
    };
};