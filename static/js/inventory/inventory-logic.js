// ====================================================================================================
// نسخه: 0.20
// فایل: inventory-logic.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول منطق:
// این فایل حاوی هوک سفارشی `useInventoryLogic` است که مغز متفکر داشبورد انبار محسوب می‌شود.
// تمام محاسبات آماری، ارتباط با API، تولید لیست خرید و مدیریت وضعیت‌ها در اینجا انجام می‌شود
// و داده‌های آماده نمایش را به لایه View (فایل JSX) ارسال می‌کند.
// ====================================================================================================

const { useState, useEffect, useCallback } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی فرمت‌دهی]
// این توابع خارج از هوک تعریف شده‌اند تا مستقل باشند و در صورت نیاز مجدداً استفاده شوند.
// ----------------------------------------------------------------------------------------------------
const formatDecimal = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatInteger = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return Number(num).toLocaleString('en-US');
};

const getPartCodeInv = (item, config) => {
    if (!item) return "---";
    if (item.part_code) return item.part_code; 
    const prefix = (config && config[item.type]?.prefix) || "PRT";
    const numeric = String(item.id || 0).padStart(9, '0');
    return `${prefix}${numeric}`;
};

// ----------------------------------------------------------------------------------------------------
// [تگ: هوک منطق اصلی]
// ----------------------------------------------------------------------------------------------------
window.useInventoryLogic = () => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // ------------------------------------------------------------------------------------------------
    const [stats, setStats] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    
    // استفاده از هوک نوتیفیکیشن (فرض بر وجود آن در محیط)
    const notify = typeof useNotify === 'function' ? useNotify() : { show: console.log };

    // ------------------------------------------------------------------------------------------------
    // [تگ: دریافت اطلاعات]
    // ------------------------------------------------------------------------------------------------
    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, configRes] = await Promise.all([
                fetchAPI('/inventory/stats'),
                fetchAPI('/settings/config')
            ]);
            if (statsRes.ok) setStats(statsRes.data);
            if (configRes.ok) setConfig(configRes.data);
            else notify.show('خطا', 'عدم دریافت اطلاعات آماری', 'error');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    // رندر مجدد آیکون‌ها هنگام تغییر تب یا دریافت داده جدید
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [stats, activeTab]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: چاپ لیست کسری]
    // منطق تولید HTML برای پرینت در اینجا کپسوله شده است.
    // ------------------------------------------------------------------------------------------------
    const handlePrintShortages = () => {
        if (!stats || !stats.shortages || stats.shortages.length === 0) return;
        const printWindow = window.open('', '_blank');
        const today = typeof getJalaliDate === 'function' ? getJalaliDate() : new Date().toLocaleDateString('fa-IR');
        
        let htmlContent = `
            <html lang="fa" dir="rtl">
            <head>
                <title>لیست سفارش خرید - ${today}</title>
                <style>
                    body { font-family: 'Tahoma', 'Segoe UI', sans-serif; padding: 20px; color: #000; }
                    h2 { text-align: center; margin-bottom: 5px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                    .meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; }
                    th, td { border: 1px solid #444; padding: 6px; text-align: center; vertical-align: middle; }
                    th { background-color: #eee; font-weight: bold; }
                    .ltr { direction: ltr; display: inline-block; font-family: 'Consolas', monospace; font-weight: bold; }
                    .text-right { text-align: right; }
                    .empty-col { background-color: #fff; }
                    @media print { 
                        body { -webkit-print-color-adjust: exact; }
                        th { background-color: #eee !important; }
                    }
                </style>
            </head>
            <body>
                <h2>لیست سفارش خرید قطعات (کسری انبار)</h2>
                <div class="meta">تاریخ گزارش: ${today} | تعداد اقلام: ${stats.shortages.length}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">#</th>
                            <th style="width: 12%">کد اختصاصی</th>
                            <th style="width: 18%">قطعه / مقدار</th>
                            <th style="width: 10%">پکیج</th>
                            <th style="width: 20%">مشخصات فنی</th>
                            <th style="width: 10%">فروشنده قبلی</th>
                            <th style="width: 8%">موجودی</th>
                            <th style="width: 17%">تعداد خرید (دستی)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        stats.shortages.forEach((item, index) => {
            const specs = [
                item.type,
                item.watt ? item.watt : null,
                item.tolerance ? item.tolerance : null,
                item.tech ? item.tech : null
            ].filter(Boolean).join(' | ');

            const pCode = getPartCodeInv(item, config);

            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="ltr">${pCode}</span></td>
                    <td class="text-right"><span class="ltr">${item.val}</span></td>
                    <td><span class="ltr">${item.pkg || '-'}</span></td>
                    <td class="text-right">${specs}</td>
                    <td>${item.vendor || '-'}</td>
                    <td>${item.qty}</td>
                    <td class="empty-col"></td>
                </tr>
            `;
        });

        htmlContent += `</tbody></table><script>window.onload=function(){setTimeout(()=>window.print(),500);}</script></body></html>`;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: محاسبات آماری]
    // این مقادیر از روی داده‌های خام (stats) محاسبه شده و به View پاس داده می‌شوند.
    // ------------------------------------------------------------------------------------------------
    const derivedStats = () => {
        if (!stats) return {};
        
        const totalItems = stats.total_items || 0;
        const totalQty = stats.total_quantity || 0;
        const totalCategories = stats.categories ? Object.keys(stats.categories).length : 0;
        const healthScore = totalItems > 0 ? Math.round(((totalItems - (stats.shortages?.length || 0)) / totalItems) * 100) : 100;
        
        const categories = stats.categories || {};
        const maxCategoryVal = Math.max(...Object.values(categories).map(c => c.value)) || 1;
        
        let topCategory = "---";
        Object.entries(categories).forEach(([name, data]) => { 
            if (data.value === maxCategoryVal) topCategory = name; 
        });
        
        const avgPrice = totalQty > 0 ? (stats.total_value_toman / totalQty) : 0;

        return {
            totalItems,
            totalQty,
            totalCategories,
            healthScore,
            maxCategoryVal,
            topCategory,
            avgPrice
        };
    };

    return {
        // داده‌ها و وضعیت‌ها
        stats,
        config,
        loading,
        activeTab,
        
        // توابع تغییر وضعیت
        setActiveTab,
        loadStats,
        handlePrintShortages,
        
        // داده‌های محاسبه شده
        ...derivedStats(),
        
        // توابع کمکی
        helpers: {
            formatDecimal,
            formatInteger,
            getPartCodeInv,
            toShamsi: (window.toShamsi || ((d) => d)) // اطمینان از وجود تابع تبدیل تاریخ
        }
    };
};