/**
 * ====================================================================================================
 * فایل: project-bom-logic.js
 * وظیفه: مدیریت منطق صفحه جزئیات پروژه (BOM)، محاسبات و کسر از انبار
 * نسخه اصلاح شده: شامل پرینت تعاملی با قابلیت مخفی‌سازی ستون‌ها
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

    // وضعیت‌های گزارش و انتخاب کسر از انبار
    const [deductionReport, setDeductionReport] = useState({ available: [], missing: [] });
    const [deductionSelection, setDeductionSelection] = useState([]); 
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

    const analyzeDeduction = () => {
        const available = [];
        const missing = [];
        const allIds = [];

        bomItems.forEach(item => {
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
            const { ok, data } = await fetchAPI('/projects/deduct', {
                method: 'POST',
                body: { 
                    project_id: activeProject.id, 
                    count: productionCount, 
                    force, 
                    username: user?.username || 'Admin',
                    selected_part_ids: deductionSelection 
                }
            });

            if (ok && data.success) {
                notify.show('موفقیت', `موجودی انبار (برای ${deductionSelection.length} قطعه انتخاب شده) کسر شد.`, 'success');
                setShortageData(null); 
                setShowDeductionModal(false); 
                loadInventory(); 
                loadBOMDetails();
            } else if (data?.status === 'shortage') {
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

    // ==================================================================================
    // [Start] تابع پرینت نهایی + خروجی اکسل (Excel Export)
    // ==================================================================================
    const handlePrintBOM = () => {
        // 1. آماده‌سازی و مرتب‌سازی داده‌ها
        const activeList = [];
        
        bomItems.forEach(item => {
            const active = item.isSelected ? item : item.alternatives.find(a => a.isSelected);
            if (active) {
                const totalNeeded = (item.required_qty || 0) * productionCount;
                const currentInventory = active.inventory_qty || 0;
                const shortage = Math.max(0, totalNeeded - currentInventory);
                
                activeList.push({
                    code: active.part_code || '',
                    name: active.val,
                    specs: [active.package, active.watt, active.tolerance, active.tech].filter(Boolean).join(' - '),
                    vendor: active.vendor_name,
                    unit: item.unit || 'عدد',
                    qty: item.required_qty,
                    totalNeeded: totalNeeded,
                    inventory: currentInventory,
                    shortage: shortage,
                    location: active.storage_location || '-'
                });
            }
        });

        // مرتب‌سازی بر اساس کد کالا
        activeList.sort((a, b) => a.code.toString().localeCompare(b.code.toString()));

        // تبدیل داده‌ها به JSON رشته‌ای برای استفاده در اسکریپت دانلود اکسل
        const jsonForExcel = JSON.stringify(activeList);
        const projectName = activeProject?.name || 'Project';

        // آیکون‌های چشم
        const iconEyeOpen = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
        const iconEyeOff = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.05A10.59 10.59 0 0 1 12 5c7 0 10 7 10 7a13.12 13.12 0 0 1-4.24 5.24"/><path d="M22 22l-1 1"/><path d="M12 22c-7 0-10-7-10-7a13.12 13.12 0 0 1 4-5.23"/><path d="M2 2l20 20"/></svg>`;

        const printWindow = window.open('', '_blank');

        const htmlContent = `
            <html dir="rtl" lang="fa">
            <head>
                <title>چاپ BOM - ${activeProject?.name}</title>
                <style>
                    /* --- فونت‌ها --- */
                    @font-face { font-family: 'Vazirmatn'; src: url('/static/fonts/Vazirmatn-Regular.ttf') format('truetype'); font-weight: normal; }
                    @font-face { font-family: 'Vazirmatn'; src: url('/static/fonts/Vazirmatn-Bold.ttf') format('truetype'); font-weight: bold; }
                    
                    * { font-family: 'Vazirmatn', 'B Nazanin', 'Tahoma', sans-serif !important; box-sizing: border-box; }
                    body { padding: 15px; color: #000; margin: 0; }

                    /* --- جدول --- */
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 20px; 
                        table-layout: auto; 
                    }
                    
                    th, td { 
                        border: 1px solid #444; 
                        padding: 4px; 
                        text-align: center; 
                        font-size: 10px; 
                        vertical-align: middle; 
                    }
                    th { background-color: #eee; font-weight: bold; font-size: 11px; height: 35px; white-space: nowrap; }
                    
                    /* --- استایل شکستن متن --- */
                    .col-name-cell {
                        text-align: right;
                        padding-right: 5px;
                        white-space: normal;
                        word-wrap: break-word;
                        line-height: 1.4;
                    }

                    .col-toggle { cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin-right: 5px; padding: 2px; border-radius: 4px; vertical-align: middle; }
                    .col-toggle:hover { background-color: #ddd; }
                    .hidden-print { opacity: 0.2; background-color: #f0f0f0; color: #ccc !important; border-color: #eee; }
                    
                    /* --- استایل‌های خاص انبار --- */
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                    .project-info { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f9f9f9; padding: 8px 12px; border: 1px solid #999; font-size: 11px; font-weight: bold; border-radius: 4px; }
                    
                    .specs { font-size: 9px; color: #555; display: block; margin-top: 2px; }
                    .check-box { width: 12px; height: 12px; border: 1px solid #000; display: inline-block; }
                    .shortage-cell { background-color: #ffebee; color: #d32f2f; font-weight: bold; }
                    
                    /* --- بخش امضاها --- */
                    .signature-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 40px;
                        border: 1px solid #000;
                        page-break-inside: avoid;
                    }
                    .sig-box {
                        flex: 1;
                        height: 100px;
                        border-left: 1px solid #000;
                        padding: 5px;
                        font-size: 11px;
                        font-weight: bold;
                        display: flex;
                        flex-direction: column;
                    }
                    .sig-box:last-child { border-left: none; }
                    .sig-line { margin-top: auto; border-bottom: 1px dotted #000; width: 80%; margin-bottom: 15px; align-self: center; }

                    .footer { margin-top: 10px; font-size: 10px; color: #666; }

                    @media print { 
                        @page { margin: 0.5cm; } 
                        body { padding: 0; }
                        .no-print, .col-toggle { display: none !important; }
                        .hidden-print { display: none !important; }
                    }

                    /* --- استایل دکمه‌های بالای صفحه --- */
                    .print-actions { 
                        text-align: center; margin-bottom: 20px; padding: 15px; 
                        background: #fffde7; border: 1px solid #eab308; border-radius: 8px; 
                        font-size: 11px; color: #854d0e; display: flex; flex-direction: column; align-items: center; gap: 12px;
                    }
                    .btn-group { display: flex; gap: 10px; justify-content: center; }
                    .btn-print { cursor:pointer; padding:8px 25px; background:#000; color:#fff; border:none; border-radius:6px; font-family:inherit; font-weight:bold; font-size: 12px; }
                    .btn-excel { cursor:pointer; padding:8px 25px; background:#10b981; color:#fff; border:none; border-radius:6px; font-family:inherit; font-weight:bold; font-size: 12px; display: flex; align-items: center; gap: 5px; }
                    .btn-excel:hover { background: #059669; }
                </style>
            </head>
            <body>
                
                <div class="no-print print-actions">
                    <div>
                        <span style="font-weight:bold; font-size:14px; vertical-align:middle">💡 پنل چاپ و خروجی:</span>
                         قطعات بر اساس <b>کد کالا</b> مرتب شده‌اند. برای مخفی کردن ستون‌ها روی آیکون چشم کلیک کنید.
                    </div>
                    <div class="btn-group">
                        <button onclick="window.print()" class="btn-print">چاپ / ذخیره PDF (Ctrl+P)</button>
                        <button onclick="downloadExcel()" class="btn-excel">
                            <span>دانلود فایل اکسل (Excel)</span>
                        </button>
                    </div>
                </div>

                <div class="header">
                    <div style="text-align:center; margin-bottom:5px;">
                        <img src="/static/logo.png" alt="Logo" onerror="this.style.display='none';" style="height:50px;" />
                    </div>
                    <h3>حواله خروج کالا / لیست BOM</h3>
                    <div style="font-size: 10px;">سیستم مدیریت هوشمند انبار H&Y</div>
                </div>
                
                <div class="project-info">
                    <span>پروژه: ${activeProject?.name}</span>
                    <span>تاریخ: ${toShamsi ? toShamsi(new Date().toISOString()) : new Date().toLocaleDateString('fa-IR')}</span>
                    <span>تعداد تولید: ${productionCount} واحد</span>
                </div>

                <table id="mainTable">
                    <thead>
                        <tr>
                            <th style="width:30px">چک</th>
                            <th style="width:30px">#</th>
                            
                            <th class="col-code" style="width:80px">
                                کد کالا 
                                <span class="col-toggle" onclick="toggleCol('col-code', this)">${iconEyeOpen}</span>
                            </th>
                            
                            <th style="width:30%; min-width:150px">نام قطعه و مشخصات فنی</th>
                            
                            <th style="width:30px">واحد</th>
                            <th style="width:40px">تعداد</th>
                            <th style="width:40px">نیاز کل</th>
                            
                            <th class="col-inv" style="width:40px">
                                موجودی
                                <span class="col-toggle" onclick="toggleCol('col-inv', this)">${iconEyeOpen}</span>
                            </th>
                            
                            <th class="col-shortage" style="width:40px; color:#d32f2f">
                                کسری
                                <span class="col-toggle" onclick="toggleCol('col-shortage', this)">${iconEyeOpen}</span>
                            </th>
                            
                            <th class="col-loc" style="width:50px">
                                محل انبار
                                <span class="col-toggle" onclick="toggleCol('col-loc', this)">${iconEyeOpen}</span>
                            </th>

                            <th class="col-note">
                                ملاحظات انبار
                                <span class="col-toggle" onclick="toggleCol('col-note', this)">${iconEyeOpen}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activeList.map((item, idx) => {
                            const shortageClass = item.shortage > 0 ? 'shortage-cell' : '';
                            const shortageText = item.shortage > 0 ? item.shortage : '-';
                            return `
                                <tr>
                                    <td><div class="check-box"></div></td>
                                    <td>${idx + 1}</td>
                                    <td class="col-code" style="font-family: monospace !important;">${item.code}</td>
                                    
                                    <td class="col-name-cell">
                                        <strong>${item.name}</strong>
                                        <span class="specs">${item.specs}</span>
                                    </td>
                                    
                                    <td>${item.unit}</td>
                                    <td>${item.qty}</td>
                                    <td style="font-weight:bold">${item.totalNeeded}</td>
                                    
                                    <td class="col-inv" style="color:#555">${item.inventory}</td>
                                    <td class="col-shortage ${shortageClass}">${shortageText}</td>
                                    <td class="col-loc" style="font-size:9px">${item.location}</td>
                                    
                                    <td class="col-note"></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                <div class="signature-section">
                    <div class="sig-box">
                        <span>درخواست کننده (تولید):</span>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <span>اقدام کننده (انبار):</span>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <span>تایید نهایی / تحویل گیرنده:</span>
                        <div class="sig-line"></div>
                    </div>
                </div>

                <div class="footer">
                    <div style="float:left">
                        <span>تنوع: ${totals.variety} قلم</span> | 
                        <span>مجموع قطعات: ${totals.totalParts} عدد</span>
                    </div>
                    <div style="clear:both"></div>
                </div>

                <script>
                    const svgOpen = \`${iconEyeOpen}\`;
                    const svgClosed = \`${iconEyeOff}\`;

                    // 1. منطق مخفی سازی ستون‌ها (قابلیت قبلی)
                    function toggleCol(colClass, btn) {
                        const cells = document.querySelectorAll('.' + colClass);
                        if (cells.length === 0) return;
                        const isHidden = cells[0].classList.contains('hidden-print');
                        cells.forEach(cell => {
                            if (isHidden) cell.classList.remove('hidden-print');
                            else cell.classList.add('hidden-print');
                        });
                        btn.innerHTML = isHidden ? svgOpen : svgClosed;
                    }

                    // 2. منطق دانلود اکسل (قابلیت جدید)
                    function downloadExcel() {
                        const data = ${jsonForExcel};
                        const fileName = 'BOM-${projectName}.csv';
                        
                        // هدرهای اکسل
                        let csvContent = "ردیف,کد کالا,نام قطعه و مشخصات,واحد,تعداد در برد,نیاز کل,موجودی انبار,کسری,محل انبار,ملاحظات\\n";
                        
                        data.forEach((item, index) => {
                            // تمیزکاری متن‌ها برای جلوگیری از به هم ریختگی CSV
                            // اگر متن حاوی کاما باشد، باید داخل کوتیشن قرار بگیرد
                            const code = '"' + (item.code || '') + '"'; // کد را داخل کوتیشن میذاریم تا اکسل عدد فرض نکند و صفر اولش پاک نشه
                            const name = '"' + item.name.replace(/"/g, '""') + ' ' + item.specs.replace(/"/g, '""') + '"';
                            const location = '"' + (item.location || '') + '"';
                            
                            const row = [
                                index + 1,
                                code,
                                name,
                                item.unit,
                                item.qty,
                                item.totalNeeded,
                                item.inventory,
                                item.shortage,
                                location,
                                "" // ستون خالی ملاحظات
                            ];
                            
                            csvContent += row.join(",") + "\\n";
                        });

                        // ایجاد فایل با انکودینگ UTF-8 BOM (برای پشتیبانی صحیح فارسی در اکسل)
                        const blob = new Blob(["\\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                        
                        // ایجاد لینک دانلود مجازی و کلیک روی آن
                        const link = document.createElement("a");
                        if (link.download !== undefined) { 
                            const url = URL.createObjectURL(blob);
                            link.setAttribute("href", url);
                            link.setAttribute("download", fileName);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }
                    }
                </script>
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
        
        deductionReport, showDeductionModal, setShowDeductionModal, 
        analyzeDeduction, deductionSelection, toggleDeductionItem,
        
        toggleExpand, toggleSelection, setExtraCosts, saveBOMDetails, handleDeduct, handlePrintBOM, 
        onDragStart, onDragOver, onDrop, onDragEnd, totals, toShamsi
    };
};