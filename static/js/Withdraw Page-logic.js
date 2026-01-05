// ====================================================================================================
// نسخه: 0.21
// فایل: Withdraw Page-logic.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول منطق:
// این فایل حاوی هوک سفارشی `useWithdrawLogic` است که تمام منطق صفحه برداشت کالا را مدیریت می‌کند.
// تغییرات جدید: اضافه شدن سیستم فیلتر پیشرفته (Query Builder) مشابه صفحه ورود کالا.
// ====================================================================================================

const { useState, useEffect, useCallback, useMemo } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی]
// ----------------------------------------------------------------------------------------------------
const getPartCodeLocal = (p, config) => {
    if (!p) return "---";
    if (p.part_code) return p.part_code;
    
    if (!p.id) return "---";
    const prefix = (config && config[p.type]?.prefix) || "PRT";
    const numeric = String(p.id).padStart(9, '0');
    return `${prefix}${numeric}`;
};

const getStockStatus = (qty, minQty) => {
    if (qty <= 0) return { color: 'bg-red-500', text: 'text-red-500', label: 'ناموجود' };
    if (qty <= minQty) return { color: 'bg-orange-500', text: 'text-orange-500', label: 'کم' };
    return { color: 'bg-emerald-500', text: 'text-emerald-500', label: 'موجود' };
};

// ----------------------------------------------------------------------------------------------------
// [تگ: هوک منطق اصلی]
// ----------------------------------------------------------------------------------------------------
window.useWithdrawLogic = ({ user, serverStatus }) => {
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // ------------------------------------------------------------------------------------------------
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [cart, setCart] = useState([]);
    const [partsList, setPartsList] = useState([]);
    const [projectReason, setProjectReason] = useState("");
    const [globalConfig, setGlobalConfig] = useState(null);
    
    // --- استیت‌های فیلتر پیشرفته (اضافه شده از Entry Page) ---
    // هر شرط: { id, value: متن جستجو, logic: رابطه با شرط قبلی (AND/OR) }
    const [specConditions, setSpecConditions] = useState([
        { id: 1, value: '', logic: 'AND' }
    ]);
    const [activeFilterPopup, setActiveFilterPopup] = useState(null);
    
    // هوک‌های سیستم
    const notify = typeof useNotify === 'function' ? useNotify() : { show: console.log };
    const dialog = typeof useDialog === 'function' ? useDialog() : { ask: () => Promise.resolve(true) };

    // ------------------------------------------------------------------------------------------------
    // [تگ: بارگذاری اطلاعات]
    // ------------------------------------------------------------------------------------------------
    const loadParts = useCallback(async () => {
        try {
            const [partsRes, configRes] = await Promise.all([
                fetchAPI('/parts'),
                fetchAPI('/settings/config')
            ]);
            if (partsRes.ok) setPartsList(partsRes.data);
            if (configRes.ok) setGlobalConfig(configRes.data);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadParts(); }, [loadParts]);

    // ------------------------------------------------------------------------------------------------
    // [تگ: توابع مدیریت فیلتر پیشرفته]
    // ------------------------------------------------------------------------------------------------
    const addSpecCondition = () => {
        setSpecConditions(prev => [
            ...prev,
            { id: Date.now(), value: '', logic: 'AND' }
        ]);
    };

    const removeSpecCondition = (id) => {
        setSpecConditions(prev => {
            const newConditions = prev.filter(c => c.id !== id);
            if (newConditions.length === 0) return [{ id: Date.now(), value: '', logic: 'AND' }];
            return newConditions;
        });
    };

    const updateSpecCondition = (id, newValue) => {
        setSpecConditions(prev => prev.map(c => c.id === id ? { ...c, value: newValue } : c));
    };

    const toggleSpecLogic = (id) => {
        setSpecConditions(prev => prev.map(c => 
            c.id === id ? { ...c, logic: c.logic === 'AND' ? 'OR' : 'AND' } : c
        ));
    };

    const toggleFilterPopup = (popupName) => {
        setActiveFilterPopup(prev => prev === popupName ? null : popupName);
    };

    const clearFilterGroup = (group) => {
        if (group === 'specs') {
            setSpecConditions([{ id: Date.now(), value: '', logic: 'AND' }]);
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: محاسبات و فیلترها]
    // ------------------------------------------------------------------------------------------------
    const categories = useMemo(() => {
        const cats = ["All", ...new Set(partsList.map(p => p.type || "Other"))];
        return cats.sort();
    }, [partsList]);

    const filteredParts = useMemo(() => {
        let res = partsList;
        const normalize = (s) => s ? String(s).toLowerCase().replace(/,/g, '').trim() : '';

        // 1. فیلتر دسته‌بندی
        if (selectedCategory !== "All") {
            res = res.filter(p => (p.type || "Other") === selectedCategory);
        }

        // 2. فیلتر جستجوی سریع (Basic Search)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(p => 
                (p.val && p.val.toLowerCase().includes(lower)) || 
                (p.package && p.package.toLowerCase().includes(lower)) ||
                (p.storage_location && p.storage_location.toLowerCase().includes(lower)) ||
                (p.type && p.type.toLowerCase().includes(lower)) ||
                (getPartCodeLocal(p, globalConfig).toLowerCase().includes(lower))
            );
        }

        // 3. فیلتر پیشرفته مشخصات (Query Builder Logic)
        const hasSpecFilters = specConditions.some(c => c.value.trim() !== '');
        
        if (hasSpecFilters) {
            res = res.filter(p => {
                // ساخت یک رشته بزرگ از تمام مشخصات قطعه برای جستجوی جامع
                const partAllSpecs = (
                    normalize(p.val) + " " +
                    normalize(p.package) + " " +
                    normalize(p.storage_location) + " " +
                    normalize(p.tech) + " " +
                    normalize(p.watt) + " " +
                    normalize(p.tolerance) + " " +
                    normalize(p.type) + " " +
                    normalize(getPartCodeLocal(p, globalConfig))
                );

                // ارزیابی زنجیره‌ای شرط‌ها
                let finalResult = false; // مقدار اولیه مهم نیست چون با شرط اول ست می‌شود

                specConditions.forEach((condition, index) => {
                    const term = normalize(condition.value);
                    let isMatch = true;

                    if (term) {
                        isMatch = partAllSpecs.includes(term);
                    } else {
                        isMatch = true; // اگر کادر خالی است، نادیده گرفته شود
                    }

                    if (index === 0) {
                        finalResult = isMatch;
                    } else {
                        // اعمال منطق نسبت به نتیجه قبلی
                        if (condition.logic === 'AND') {
                            finalResult = finalResult && isMatch;
                        } else {
                            finalResult = finalResult || isMatch;
                        }
                    }
                });

                return finalResult;
            });
        }

        return res.slice(0, 50);
    }, [searchTerm, partsList, selectedCategory, globalConfig, specConditions]);

    // بروزرسانی آیکون‌ها
    if (typeof useLucide === 'function') {
        useLucide([cart, filteredParts, selectedCategory, specConditions.length]);
    }

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت سبد خرید]
    // ------------------------------------------------------------------------------------------------
    const addToCart = (part, exactQty = null) => {
        let qtyToAdd = 1;
        const existing = cart.find(i => i.id === part.id);
        const currentInCart = existing ? existing.qty : 0;
        const remainingStock = part.quantity - currentInCart;

        if (remainingStock <= 0) {
            return notify.show('موجودی ناکافی', 'تمام موجودی این قطعه در لیست خروج قرار دارد.', 'info');
        }

        if (exactQty !== null) {
            qtyToAdd = exactQty;
            if (qtyToAdd > remainingStock) {
                return notify.show('محدودیت موجودی', `فقط ${remainingStock} عدد دیگر قابل افزودن است.`, 'info');
            }
        }

        if (existing) {
            setCart(cart.map(i => i.id === part.id ? { ...i, qty: i.qty + qtyToAdd } : i));
        } else {
            setCart([...cart, { ...part, qty: qtyToAdd }]);
        }
    };

    const updateCartQty = (id, delta) => {
        const item = cart.find(i => i.id === id);
        const part = partsList.find(p => p.id === id);
        if (!item || !part) return;

        const newQty = item.qty + delta;
        if (newQty <= 0) {
            setCart(cart.filter(i => i.id !== id));
            return;
        }
        if (newQty > part.quantity) {
            return notify.show('هشدار موجودی', `موجودی ناکافی. حداکثر مقدار: ${part.quantity}`, 'info');
        }
        setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i));
    };

    const handleManualQtyChange = (id, value) => {
        const part = partsList.find(p => p.id === id);
        if (!part) return;

        const cleanValue = value.replace(/[^0-9]/g, '');
        const newQty = cleanValue === '' ? 0 : parseInt(cleanValue);

        if (newQty > part.quantity) {
            notify.show('موجودی محدود', `تعداد وارد شده بیشتر از موجودی انبار (${part.quantity}) است.`, 'info');
            return;
        }

        setCart(cart.map(i => i.id === id ? { ...i, qty: newQty } : i));
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: چاپ و ثبت نهایی]
    // ------------------------------------------------------------------------------------------------
    const handlePrintPickList = (currentCart = cart, reason = projectReason) => {
        if (currentCart.length === 0) return;
        const printWindow = window.open('', '_blank');
        const today = typeof getJalaliDate === 'function' ? getJalaliDate() : new Date().toLocaleDateString('fa-IR');
        
        let htmlContent = `
            <html lang="fa" dir="rtl">
            <head>
                <title>لیست برداشت انبار - ${reason || 'پروژه نامشخص'}</title>
                <style>
                    body { font-family: 'Tahoma', sans-serif; padding: 20px; color: #000; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                    .check-box { width: 20px; height: 20px; border: 1px solid #000; display: inline-block; vertical-align: middle; }
                    .ltr { direction: ltr; display: inline-block; font-family: monospace; font-weight: bold; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="header"><h2>حواله خروج قطعات از انبار نکسوس</h2></div>
                <div class="meta">
                    <div><strong>پروژه / دلیل مصرف:</strong> ${reason || '---'}</div>
                    <div><strong>مسئول برداشت:</strong> ${user?.full_name || user?.username || 'ناشناس'}</div>
                    <div><strong>تاریخ ثبت:</strong> ${today}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%">#</th>
                            <th style="width: 15%">کد کالا</th>
                            <th style="width: 25%">شرح قطعه</th>
                            <th style="width: 10%">پکیج</th>
                            <th style="width: 15%">آدرس دقیق انبار</th>
                            <th style="width: 10%">تعداد درخواستی</th>
                            <th style="width: 10%">وضعیت برداشت</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        currentCart.forEach((item, index) => {
            const pCode = getPartCodeLocal(item, globalConfig);
            htmlContent += `
                <tr>
                    <td>${index + 1}</td>
                    <td><span class="ltr">${pCode}</span></td>
                    <td style="text-align: right;"><span class="ltr">${item.val}</span> <br/> <small style="color: #666;">${item.type} | ${item.watt || ''}</small></td>
                    <td><span class="ltr">${item.package}</span></td>
                    <td style="font-weight: bold;">${item.storage_location}</td>
                    <td style="font-size: 14px; font-weight: bold;">${item.qty}</td>
                    <td><div class="check-box"></div> <small>تایید</small></td>
                </tr>
            `;
        });

        htmlContent += `
                    </tbody>
                </table>
                <div style="margin-top: 50px; display: flex; justify-content: space-around; font-size: 11px;">
                    <div>امضا تحویل گیرنده: ............................</div>
                    <div>تایید واحد انبار: ............................</div>
                </div>
                <script>window.onload=function(){ setTimeout(()=> { window.print(); }, 500); }</script>
            </body>
            </html>
        `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (cart.some(i => i.qty <= 0)) return notify.show('خطا', 'تعداد قطعات برداشتی نمی‌تواند صفر باشد.', 'info');
        if (!projectReason.trim()) return notify.show('توجه', 'لطفاً نام پروژه یا دلیل مصرف را وارد کنید', 'info');
        
        const confirmed = await dialog.ask('تایید نهایی خروج', `آیا از خروج ${cart.length} ردیف قطعه برای "${projectReason}" اطمینان دارید؟`, 'warning');
        
        if (confirmed) {
            try {
                const cartToPrint = [...cart];
                const reasonToPrint = projectReason;

                const { ok, data } = await fetchAPI('/withdraw', { 
                    method: 'POST', 
                    body: { items: cart, project: projectReason, username: user.username } 
                });
                
                if (ok) {
                    handlePrintPickList(cartToPrint, reasonToPrint);
                    notify.show('موفقیت', 'خروج با موفقیت ثبت شد و حواله صادر گردید.', 'success');
                    setCart([]);
                    setProjectReason("");
                    loadParts();
                } else {
                    notify.show('خطا در سرور', data.error || 'خطا در ثبت خروج', 'error');
                }
            } catch (e) { notify.show('خطای شبکه', 'ارتباط با سرور برقرار نشد.', 'error'); }
        }
    };

    return {
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        cart, setCart,
        projectReason, setProjectReason,
        categories, filteredParts,
        partsList,
        serverStatus,
        globalConfig,
        
        // --- خروجی‌های جدید مربوط به فیلتر ---
        specConditions,
        activeFilterPopup,
        addSpecCondition,
        removeSpecCondition,
        updateSpecCondition,
        toggleSpecLogic,
        toggleFilterPopup,
        clearFilterGroup,
        
        // توابع
        handleCheckout,
        handlePrintPickList,
        handleManualQtyChange,
        updateCartQty,
        addToCart,
        
        // توابع کمکی
        helpers: {
            getPartCodeLocal,
            getStockStatus
        }
    };
};