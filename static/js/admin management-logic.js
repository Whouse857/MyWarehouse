// ====================================================================================================
// نسخه: 0.20
// فایل: admin_management_logic.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول منطق:
// این فایل حاوی هوک سفارشی `useAdminManagementLogic` است که تمام منطق تجاری، مدیریت وضعیت (State)
// و توابع پردازشی صفحه مدیریت را در خود جای داده است.
//
// وظایف اصلی:
// ۱. مدیریت State ها (داده‌ها، مودال‌ها، انتخاب‌ها).
// ۲. مدیریت عملیات Drag & Drop.
// ۳. ارتباط با API برای ذخیره، حذف و تغییر نام.
// ۴. آماده‌سازی داده‌ها برای نمایش در لایه View.
// ====================================================================================================

// استخراج هوک‌های مورد نیاز از کتابخانه React
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: تعاریف ثابت]
// نگاشت نام‌های فنی لیست‌ها به برچسب‌های فارسی و آیکون‌های مربوطه جهت نمایش در UI.
// این آبجکت ثابت است و نیازی به تعریف مجدد در هر رندر ندارد.
// ----------------------------------------------------------------------------------------------------
const listLabels = { 
    'units': { label: 'واحدها', icon: 'ruler' }, 
    'paramOptions': { label: 'مقادیر پارامتر', icon: 'sliders' }, 
    'tolerances': { label: 'تولرانس / ویژگی فنی', icon: 'list' },
    'packages': { label: 'پکیج‌ها', icon: 'box' }, 
    'techs': { label: 'تکنولوژی‌ها', icon: 'cpu' }, 
    'list5': { label: 'فیلد ۵', icon: 'list' },
    'list6': { label: 'فیلد ۶', icon: 'list' },
    'list7': { label: 'فیلد ۷', icon: 'list' },
    'list8': { label: 'فیلد ۸', icon: 'list' },
    'list9': { label: 'فیلد ۹', icon: 'list' },
    'list10': { label: 'فیلد ۱۰', icon: 'list' },
    'locations': { label: 'آدرس‌های انبار (General)', icon: 'map-pin' }
};

// ----------------------------------------------------------------------------------------------------
// [تگ: هوک منطق اصلی]
// این تابع تمام لاجیک را کپسوله کرده و خروجی‌های لازم برای View را برمی‌گرداند.
// ----------------------------------------------------------------------------------------------------
window.useAdminManagementLogic = ({ globalConfig, onConfigUpdate }) => {
    
    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت وضعیت (State)]
    // تعریف تمام متغیرهای واکنشی مورد نیاز برای صفحه.
    // ------------------------------------------------------------------------------------------------
    const [sortedKeys, setSortedKeys] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [config, setConfig] = useState(globalConfig || {});
    const [newItems, setNewItems] = useState({});
    const [renameModal, setRenameModal] = useState({ open: false, type: '', oldVal: '', category: '', listName: '' });
    const [addCategoryModal, setAddCategoryModal] = useState(false);
    
    // رفرنس‌ها برای مدیریت Drag & Drop
    const dragItem = useRef();
    const dragOverItem = useRef();
    const dragItemIdx = useRef(null);
    const dragOverItemIdx = useRef(null);

    // هوک‌های سفارشی (فرض بر این است که در محیط موجود هستند)
    const notify = useNotify();
    const dialog = useDialog();

    // ------------------------------------------------------------------------------------------------
    // [تگ: همگام‌سازی اولیه]
    // دریافت تنظیمات اولیه و مرتب‌سازی دسته‌ها.
    // ------------------------------------------------------------------------------------------------
    useEffect(() => {
        if (globalConfig && Object.keys(globalConfig).length > 0) {
            setConfig(globalConfig);
            const keys = Object.keys(globalConfig);
            // مرتب‌سازی کلیدها بر اساس فیلد priority به صورت نزولی
            const sorted = keys.sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0));
            setSortedKeys(sorted);
            // انتخاب اولین دسته در صورتی که هیچ دسته‌ای انتخاب نشده باشد
            if (!selectedType && sorted.length > 0) setSelectedType(sorted[0]);
        }
    }, [globalConfig]);

    // بروزرسانی آیکون‌ها
    if (typeof useLucide === 'function') {
        useLucide([selectedType, config, sortedKeys]);
    }

    // ------------------------------------------------------------------------------------------------
    // [تگ: منطق Drag & Drop دسته‌ها]
    // ------------------------------------------------------------------------------------------------
    const handleDragStart = (e, position) => { 
        dragItem.current = position; 
        // استفاده از کلاس CSS به جای استایل مستقیم
        e.target.classList.add('drag-category-active'); 
    };

    const handleDragEnter = (e, position) => { 
        dragOverItem.current = position; 
        const copyListItems = [...sortedKeys]; 
        const dragItemContent = copyListItems[dragItem.current]; 
        copyListItems.splice(dragItem.current, 1); 
        copyListItems.splice(dragOverItem.current, 0, dragItemContent); 
        dragItem.current = position; 
        setSortedKeys(copyListItems); 
    };

    const handleDragEnd = (e) => { 
        // حذف کلاس CSS مربوط به درگ
        e.target.classList.remove('drag-category-active'); 
        dragItem.current = null; 
        dragOverItem.current = null; 
        
        // بروزرسانی اولویت‌ها
        const newConfig = { ...config }; 
        sortedKeys.forEach((key, index) => { 
            if (newConfig[key]) newConfig[key].priority = sortedKeys.length - index; 
        }); 
        setConfig(newConfig); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر تنظیمات فیلد]
    // ------------------------------------------------------------------------------------------------
    const handleFieldConfigChange = (listName, key, value) => {
        // اعتبارسنجی: جلوگیری از فعال کردن لیست‌های خالی
        if ((key === 'visible' && value === true) || (key === 'required' && value === true)) {
            const currentList = config[selectedType][listName] || [];
            if (currentList.length === 0) {
                notify.show(
                    'لیست خالی است', 
                    `ابتدا باید حداقل یک آیتم برای این فیلد تعریف کنید تا بتوانید آن را فعال یا الزامی نمایید.`, 
                    'error'
                );
                return;
            }
        }

        const newConfig = { ...config };
        
        if (!newConfig[selectedType].fields) newConfig[selectedType].fields = {};
        if (!newConfig[selectedType].fields[listName]) newConfig[selectedType].fields[listName] = {};
        
        newConfig[selectedType].fields[listName][key] = value;

        // وابستگی‌های هوشمند (الزامی -> نمایش، مخفی -> غیرالزامی)
        if (key === 'required' && value === true) {
             newConfig[selectedType].fields[listName]['visible'] = true;
        }
        if (key === 'visible' && value === false) {
             newConfig[selectedType].fields[listName]['required'] = false;
        }

        setConfig(newConfig);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: مدیریت آیتم‌های لیست]
    // ------------------------------------------------------------------------------------------------
    const handleAddItem = (listName, value) => {
        if (!value || !value.trim()) return;
        const newConfig = { ...config };
        if (!newConfig[selectedType][listName]) newConfig[selectedType][listName] = [];
        
        if (!newConfig[selectedType][listName].includes(value)) { 
            newConfig[selectedType][listName].push(value); 
            setConfig(newConfig); 
            setNewItems({ ...newItems, [listName]: '' }); 
        }
    };
    
    const handleDeleteItem = (listName, value) => { 
        const newConfig = { ...config }; 
        newConfig[selectedType][listName] = newConfig[selectedType][listName].filter(item => item !== value); 
        setConfig(newConfig); 
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: Drag & Drop آیتم‌های لیست]
    // ------------------------------------------------------------------------------------------------
    const handleItemDragStart = (e, index) => {
        dragItemIdx.current = index;
        // استفاده از کلاس CSS به جای استایل مستقیم
        e.target.classList.add('drag-item-active');
    };

    const handleItemDragEnter = (listName, index) => {
        if (dragItemIdx.current === null || dragItemIdx.current === index) return;

        const newConfig = { ...config };
        const list = [...newConfig[selectedType][listName]];
        
        const draggedItemContent = list[dragItemIdx.current];
        list.splice(dragItemIdx.current, 1);
        list.splice(index, 0, draggedItemContent);
        
        dragItemIdx.current = index; 
        newConfig[selectedType][listName] = list;
        
        setConfig(newConfig);
    };

    const handleItemDragEnd = (e) => {
        // حذف کلاس CSS مربوط به درگ
        e.target.classList.remove('drag-item-active');
        dragItemIdx.current = null;
        dragOverItemIdx.current = null;
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: عملیات ذخیره‌سازی و حذف]
    // ------------------------------------------------------------------------------------------------
    const handleSave = async () => {
        if (await dialog.ask("ذخیره تنظیمات", "آیا از ذخیره تغییرات اطمینان دارید؟", "warning")) {
            try { 
                const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: config }); 
                if (ok) { 
                    onConfigUpdate(config); 
                    notify.show('موفقیت', "تنظیمات ذخیره شد.", 'success'); 
                } 
            } catch (e) { 
                notify.show('خطا', "مشکل شبکه", 'error'); 
            }
        }
    };

    const handleDeleteCategory = async (keyToDelete) => {
        if (keyToDelete === 'General') return notify.show('خطا', 'حذف تنظیمات عمومی مجاز نیست.', 'error');
        if (await dialog.ask("حذف دسته", `آیا از حذف دسته‌بندی "${config[keyToDelete].label}" اطمینان دارید؟`, "danger")) {
            try {
                const newConfig = { ...config }; 
                delete newConfig[keyToDelete];
                
                const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig });
                if (ok) { 
                    setConfig(newConfig); 
                    setSortedKeys(sortedKeys.filter(k => k !== keyToDelete)); 
                    if (selectedType === keyToDelete) setSelectedType(sortedKeys[0]); 
                    onConfigUpdate(newConfig); 
                    notify.show('موفقیت', 'حذف شد.', 'success'); 
                }
            } catch (e) { notify.show('خطا', 'مشکل سرور', 'error'); }
        }
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: تغییر نام و افزودن دسته]
    // ------------------------------------------------------------------------------------------------
    const handleRenameSubmit = async (newVal) => {
        if (!newVal || newVal === renameModal.oldVal) return setRenameModal({ ...renameModal, open: false });
        try {
            const { ok } = await fetchAPI('/settings/rename', { 
                method: 'POST', 
                body: { 
                    mode: renameModal.type, 
                    oldVal: renameModal.oldVal, 
                    newVal, 
                    category: renameModal.category, 
                    listName: renameModal.listName 
                } 
            });
            
            if (ok) {
                notify.show('موفقیت', 'تغییر نام انجام شد.', 'success');
                const newConfig = { ...config };
                
                if (renameModal.type === 'category') {
                    const priority = newConfig[renameModal.oldVal].priority; 
                    newConfig[newVal] = newConfig[renameModal.oldVal]; 
                    delete newConfig[renameModal.oldVal];
                    
                    newConfig[newVal].label = newVal; 
                    newConfig[newVal].priority = priority;
                    
                    const newSorted = sortedKeys.map(k => k === renameModal.oldVal ? newVal : k);
                    setSortedKeys(newSorted); 
                    setConfig(newConfig); 
                    onConfigUpdate(newConfig); 
                    setSelectedType(newVal);
                } else {
                    const list = newConfig[renameModal.category][renameModal.listName]; 
                    const idx = list.indexOf(renameModal.oldVal); 
                    if (idx !== -1) list[idx] = newVal;
                    setConfig(newConfig); 
                    onConfigUpdate(newConfig);
                }
            }
        } catch (e) { notify.show('خطا', 'مشکل شبکه', 'error'); }
        setRenameModal({ ...renameModal, open: false });
    };

    const handleAddCategorySubmit = async (newVal) => {
        if (!newVal || config[newVal]) return setAddCategoryModal(false);
        
        const newConfig = { ...config, 
            [newVal]: { 
            label: newVal, icon: 'box', 
            tolerances: [],
            units: [], packages: [], techs: [], paramOptions: [], 
            list5: [], list6: [], list7: [], list8: [], list9: [], list10: [],
            paramLabel: 'Parameter', priority: 0, prefix: 'PRT' 
        }};
        
        try { 
            const { ok } = await fetchAPI('/settings/config', { method: 'POST', body: newConfig }); 
            if (ok) { 
                setConfig(newConfig); 
                onConfigUpdate(newConfig); 
                setSortedKeys([...sortedKeys, newVal]); 
                setSelectedType(newVal); 
                notify.show('موفقیت', 'اضافه شد.', 'success'); 
            } 
        } catch(e){}
        setAddCategoryModal(false);
    };
    
    // محاسبه لیست‌های قابل نمایش
    const listKeys = selectedType ? Object.keys(listLabels).filter(key => (selectedType === 'General' ? key === 'locations' : key !== 'locations')) : [];

    const handlePrefixChange = (val) => {
        if (!selectedType) return;
        const newConfig = { ...config };
        newConfig[selectedType].prefix = (val || "").toUpperCase().substring(0, 3);
        setConfig(newConfig);
    };

    // ------------------------------------------------------------------------------------------------
    // [تگ: خروجی هوک]
    // بازگرداندن تمام توابع و متغیرها برای استفاده در View
    // ------------------------------------------------------------------------------------------------
    return {
        // وضعیت‌ها (States)
        sortedKeys,
        selectedType,
        config,
        newItems,
        renameModal,
        addCategoryModal,
        listLabels, // دیتای ثابت
        listKeys,   // دیتای محاسبه شده

        // توابع تغییر وضعیت (Setters)
        setSelectedType,
        setRenameModal,
        setAddCategoryModal,
        setNewItems,

        // توابع هندلر (Handlers)
        handleDragStart,
        handleDragEnter,
        handleDragEnd,
        handleFieldConfigChange,
        handleAddItem,
        handleDeleteItem,
        handleItemDragStart,
        handleItemDragEnter,
        handleItemDragEnd,
        handleSave,
        handleDeleteCategory,
        handleRenameSubmit,
        handleAddCategorySubmit,
        handlePrefixChange
    };
};