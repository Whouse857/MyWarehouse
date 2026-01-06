// ====================================================================================================
// نسخه: 0.25 (نهایی - کش هوشمند با اولویت نرخ دستی در شروع)
// فایل: inventory-logic.js
// توضیح:
// 1. هنگام شروع، آمار کش شده خوانده می‌شود.
// 2. بلافاصله نرخ دستی (از تنظیمات کش شده) روی آمار اعمال و محاسبه می‌شود.
// 3. صفحه بدون لودینگ باز می‌شود.
// 4. در پس‌زمینه اطلاعات جدید دریافت و جایگزین می‌شود.
// ====================================================================================================

const { useState, useEffect, useCallback } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی فرمت‌دهی]
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
    
    // 1. مقداردهی اولیه هوشمند (اعمال نرخ دستی روی داده‌های کش شده)
    const [stats, setStats] = useState(() => {
        try {
            const cachedStatsStr = localStorage.getItem('HNY_INVENTORY_STATS');
            const cachedConfigStr = localStorage.getItem('HNY_GLOBAL_CONFIG');
            
            // اگر آمار کش شده نداریم، null برگردان (تا لودینگ نمایش داده شود یا آبجکت خالی ساخته شود)
            if (!cachedStatsStr) {
                // اگر فقط کانفیگ داریم، یک آبجکت خالی با نرخ دستی می‌سازیم
                if (cachedConfigStr) {
                    const cfg = JSON.parse(cachedConfigStr);
                    const mPrice = cfg['General']?.manual_usd_price ? parseInt(cfg['General'].manual_usd_price) : 60000;
                    return {
                        live_usd_price: mPrice,
                        usd_date: cfg['General']?.manual_usd_date || "---",
                        is_offline: true,
                        total_value_toman: 0,
                        total_value_usd_live: 0,
                        shortages: [],
                        categories: {}
                    };
                }
                return null;
            }

            const cachedStats = JSON.parse(cachedStatsStr);
            
            // اگر کانفیگ (نرخ دستی) داریم، آن را روی آمار کش شده اعمال می‌کنیم
            // تا کاربر بلافاصله محاسبات را با نرخ دستی ببیند (طبق خواسته شما)
            if (cachedConfigStr) {
                const cfg = JSON.parse(cachedConfigStr);
                const manualPrice = cfg['General']?.manual_usd_price ? parseInt(cfg['General'].manual_usd_price) : 60000;
                
                // بروزرسانی محاسبات با نرخ دستی
                return {
                    ...cachedStats,
                    live_usd_price: manualPrice,
                    usd_date: cfg['General']?.manual_usd_date || cachedStats.usd_date,
                    is_offline: true, // نشان می‌دهیم فعلاً آفلاین است تا وقتی آنلاین بیاید
                    total_value_toman: (cachedStats.total_value_usd_live || 0) * manualPrice
                };
            }

            return cachedStats;
        } catch (e) { return null; }
    });

    const [config, setConfig] = useState(() => {
        try {
            const cached = localStorage.getItem('HNY_GLOBAL_CONFIG');
            return cached ? JSON.parse(cached) : null;
        } catch (e) { return null; }
    });

    // اگر دیتا (چه واقعی چه ساختگی از کانفیگ) داشته باشیم، لودینگ نداریم
    const [loading, setLoading] = useState(() => {
        const hasStats = !!localStorage.getItem('HNY_INVENTORY_STATS');
        const hasConfig = !!localStorage.getItem('HNY_GLOBAL_CONFIG');
        return !(hasStats || hasConfig);
    });
    
    const [activeTab, setActiveTab] = useState('overview');
    const notify = typeof useNotify === 'function' ? useNotify() : { show: console.log };

    // ------------------------------------------------------------------------------------------------
    // [تگ: دریافت اطلاعات (Background Fetch)]
    // ------------------------------------------------------------------------------------------------
    const loadStats = useCallback(async (isManualRefresh = false) => {
        // اگر رفرش دستی است یا هیچی نداریم، لودینگ را فعال کن
        if (isManualRefresh || !stats) {
            setLoading(true);
        }

        try {
            const [statsRes, configRes] = await Promise.all([
                fetchAPI('/inventory/stats'),
                fetchAPI('/settings/config')
            ]);
            
            // ذخیره و آپدیت کانفیگ
            let finalConfig = configRes.ok ? configRes.data : null;
            if (configRes.ok) {
                setConfig(finalConfig);
                localStorage.setItem('HNY_GLOBAL_CONFIG', JSON.stringify(finalConfig));
            } else {
                finalConfig = config || {}; 
            }

            const manualPrice = finalConfig && finalConfig['General'] ? parseInt(finalConfig['General'].manual_usd_price) : 60000;
            const manualDate = finalConfig && finalConfig['General'] ? finalConfig['General'].manual_usd_date : "1403/xx/xx";

            let rawData = statsRes.data || {};
            let finalState;

            // اگر نرخ آنلاین معتبر رسید -> استفاده از آنلاین
            if (statsRes.ok && rawData.live_usd_price && rawData.live_usd_price > 0) {
                finalState = {
                    ...rawData,
                    is_offline: false
                };
            } else {
                // اگر نرخ آنلاین نیامد -> استفاده از نرخ دستی روی داده‌های جدید (یا قدیمی)
                finalState = {
                    ...rawData, // شامل لیست قطعات جدید (اگر statsRes.ok باشد)
                    live_usd_price: manualPrice,
                    usd_date: manualDate,
                    is_offline: true,
                    // محاسبه مجدد تومان با نرخ دستی
                    total_value_toman: (rawData.total_value_usd_live || 0) * manualPrice
                };
                
                // اطمینان از وجود آرایه‌ها برای جلوگیری از کرش
                if (!finalState.shortages) finalState.shortages = [];
                if (!finalState.categories) finalState.categories = {};
            }

            setStats(finalState);
            localStorage.setItem('HNY_INVENTORY_STATS', JSON.stringify(finalState));

        } catch (e) {
            console.error("Inventory Background Update Failed:", e);
            // در صورت خطا، اگر دیتای قبلی داریم دست نمی‌زنیم (تا کاربر همان کش شده را ببیند)
            // فقط اگر هیچی نداشتیم، وضعیت اضطراری ست می‌کنیم
            if (!stats) {
                setStats({
                    live_usd_price: 60000,
                    usd_date: "خطای شبکه",
                    is_offline: true,
                    total_value_toman: 0,
                    total_value_usd_live: 0,
                    shortages: [],
                    categories: {}
                });
            }
        } finally {
            setLoading(false);
        }
    }, [stats, config]); 

    // اجرای اولیه (بدون آرگومان = بدون لودینگ اگر کش باشد)
    useEffect(() => { loadStats(); }, []);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [stats, activeTab]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: چاپ لیست کسری]
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
        stats,
        config,
        loading,
        activeTab,
        setActiveTab,
        // ارسال true برای رفرش دستی تا لودینگ نمایش داده شود
        loadStats: () => loadStats(true), 
        handlePrintShortages,
        ...derivedStats(),
        helpers: {
            formatDecimal,
            formatInteger,
            getPartCodeInv,
            toShamsi: (window.toShamsi || ((d) => d))
        }
    };
};