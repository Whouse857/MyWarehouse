/**
 * نام فایل: Entry Page.js
 * نویسنده: سرگلی
 * نسخه: V0.20
 * * کلیات عملکرد و توابع:
 * این ماژول وظیفه نمایش صفحه ورود اطلاعات قطعات (Entry Page) را بر عهده دارد.
 * امکان ثبت قطعه جدید، ویرایش قطعات موجود، جستجو و فیلتر کردن لیست قطعات در این صفحه فراهم شده است.
 * * توابع و بخش‌های کلیدی:
 * 1. getInitialFormData: ایجاد آبجکت اولیه برای فرم خالی با مقادیر پیش‌فرض.
 * 2. PartRow: کامپوننت رندر کننده هر ردیف از لیست قطعات (بهینه شده با Memo).
 * 3. loadData: بارگذاری لیست قطعات و مخاطبین از سرور.
 * 4. handleSubmit / handleFinalSubmit: اعتبارسنجی اولیه و ارسال نهایی اطلاعات به سرور.
 * 5. handleEdit / handleDelete: مدیریت عملیات ویرایش و حذف قطعات.
 * 6. duplicates / filteredParts: منطق‌های محاسباتی (Memoized) برای یافتن موارد تکراری و فیلتر کردن لیست نمایش.
 */

// =========================================================================
// بخش تعاریف و ثوابت (CONSTANTS & DEFINITIONS)
// =========================================================================

/**
 * تنظیمات ثابت فیلدهای داینامیک
 */
const DYNAMIC_FIELDS_MAP = [
  { key: 'units', stateKey: 'unit', label: 'واحد' },
  { key: 'tolerances', stateKey: 'tol', label: 'تولرانس' },
  { key: 'paramOptions', stateKey: 'watt', label: 'پارامتر فنی' },
  { key: 'packages', stateKey: 'pkg', label: 'پکیج' },
  { key: 'techs', stateKey: 'tech', label: 'تکنولوژی' },
  { key: 'list5', stateKey: 'list5', label: 'فیلد ۵' },
  { key: 'list6', stateKey: 'list6', label: 'فیلد ۶' },
  { key: 'list7', stateKey: 'list7', label: 'فیلد ۷' },
  { key: 'list8', stateKey: 'list8', label: 'فیلد ۸' },
  { key: 'list9', stateKey: 'list9', label: 'فیلد ۹' },
  { key: 'list10', stateKey: 'list10', label: 'فیلد ۱۰' },
];

// =========================================================================
/**
 * نام تابع: getInitialFormData
 * کارایی: ایجاد دیتای اولیه فرم (ریست کردن استیت فرم)
 */
// =========================================================================
const getInitialFormData = (type = "Resistor") => ({
  id: null,
  val: "",
  unit: "",
  watt: "",
  tol: "",
  pkg: "",
  type: type,
  date: typeof getJalaliDate === 'function' ? getJalaliDate() : "",
  qty: "",
  price_toman: "",
  usd_rate: "",
  reason: "",
  min_qty: 1,
  vendor_name: "",
  location: "",
  tech: "",
  purchase_links: [],
  invoice_number: "",
  list5: "", list6: "", list7: "", list8: "", list9: "", list10: ""
});

// =========================================================================
// بخش توابع کمکی (UTILITIES)
// =========================================================================

const cleanText = (str) => String(str || '').toLowerCase().replace(/\s+/g, '');
const normalizeText = (s) => s ? String(s).toLowerCase().replace(/,/g, '').trim() : '';

const preventNonNumericInput = (e) => {
  if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
    e.preventDefault();
  }
};

const getPartCode = (p, globalConfig) => {
  if (p && p.part_code) return p.part_code;
  if (!p || !p.id) return "---";
  const prefix = (globalConfig && globalConfig[p.type]?.prefix) || "PRT";
  const numeric = String(p.id).padStart(9, '0');
  return `${prefix}${numeric}`;
};

// =========================================================================
// بخش کامپوننت‌های فرعی (SUB-COMPONENTS)
// =========================================================================

/**
 * کامپوننت سطر قطعه (بهینه شده با Memo)
 */
const PartRow = React.memo(({ p, globalConfig, isSelected, serverStatus, onEdit, onDelete }) => {
  const pCode = getPartCode(p, globalConfig);
  
  return (
    <div className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all ${isSelected ? 'bg-nexus-primary/10 !border-nexus-primary/50' : ''}`}>
      <div className="col-span-2 text-right text-nexus-accent font-mono text-[14px] font-bold tracking-tighter">{pCode}</div>
      <div className="col-span-5 text-right flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <span className="text-white text-lg font-black ltr font-sans tracking-wide">{p.val}</span>
          <span className="text-xs text-nexus-accent font-bold px-1.5 py-0.5 bg-nexus-accent/10 rounded">{p.package}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 items-center">
          {p.type && <span className="text-blue-300 font-bold">{p.type}</span>}
          {p.watt && <span className="flex items-center gap-1"><i data-lucide="zap" className="w-3 h-3 text-yellow-500"></i>{p.watt}</span>}
          {p.tolerance && <span className="text-purple-400 font-bold">{p.tolerance}</span>}
          {p.tech && <span className="text-gray-500 border-x border-gray-700 px-2">{p.tech}</span>}
          {p.storage_location && (
            <span className="flex items-center gap-1 text-orange-300 bg-orange-500/10 px-1 rounded border border-orange-500/20">
              <i data-lucide="map-pin" className="w-3 h-3"></i>{p.storage_location}
            </span>
          )}
        </div>
      </div>
      <div className="col-span-1 text-center">
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${Number(p.quantity) < Number(p.min_quantity) ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {p.quantity}
        </span>
      </div>
      <div className="col-span-2 text-center text-xs text-amber-400 ltr font-mono">
        {(Number(p.toman_price) || 0).toLocaleString()}
      </div>
      <div className="col-span-2 flex justify-center gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(p); }} 
          disabled={!serverStatus} 
          title="ویرایش" 
          className="w-9 h-9 rounded-full bg-nexus-primary/20 text-nexus-primary hover:bg-nexus-primary hover:text-white flex items-center justify-center transition-all shadow-lg hover:shadow-primary/50 disabled:opacity-30"
        >
          <i data-lucide="pencil" className="w-5 h-5"></i>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} 
          disabled={!serverStatus} 
          title="حذف" 
          className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all disabled:opacity-30"
        >
          <i data-lucide="trash-2" className="w-5 h-5"></i>
        </button>
      </div>
    </div>
  );
});

/**
 * مودال تایید نهایی
 */
const SummaryModal = ({ isOpen, onClose, onConfirm, data, globalConfig }) => {
  if (!isOpen) return null;
  const fullCode = getPartCode(data, globalConfig);

  return (
    <ModalOverlay>
      <div className="glass-panel border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4 text-center border-b border-white/10 pb-3">پیش‌نمایش ثبت قطعه</h3>
        <div className="space-y-3 text-sm text-gray-300 mb-6">
          <div className="flex justify-between items-center bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
            <span className="text-blue-300 font-bold">کد ۱۲ کاراکتری:</span>
            <span className="text-white font-black font-mono tracking-widest">{fullCode}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>نوع:</span> <span className="text-white font-bold">{data.type}</span></div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>مقدار:</span> <span className="text-white font-bold ltr font-mono">{data.val} {data.unit}</span></div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>پکیج:</span> <span className="text-white font-bold">{data.pkg}</span></div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>تعداد:</span> <span className="text-emerald-400 font-bold ltr font-mono">{data.qty}</span></div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>قیمت واحد:</span> <span className="text-amber-400 font-bold ltr font-mono">{data.price_toman} تومان</span></div>
          <div className="flex justify-between items-center border-b border-white/5 pb-2"><span>فروشنده:</span> <span className="text-blue-300 font-bold">{data.vendor_name}</span></div>
          <div className="flex justify-between items-center"><span>محل نگهداری:</span> <span className="text-orange-300 font-bold">{data.location}</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition border border-white/5">بازگشت و اصلاح</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-nexus-primary hover:bg-indigo-600 text-white font-bold transition shadow-lg shadow-indigo-500/20">تایید و ثبت نهایی</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// =========================================================================
// کامپوننت اصلی صفحه (MAIN COMPONENT)
// =========================================================================

const EntryPage = ({ setView, serverStatus, user, globalConfig }) => {
  // =========================================================================
  // بخش منطق و توابع (LOGIC & FUNCTIONS)
  // =========================================================================

  const [formData, setFormData] = useState(() => getInitialFormData());
  const [partsList, setPartsList] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState({ val: '', pkg: '', loc: '', type: '', code: '' });
  const [errors, setErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const notify = useNotify();
  const dialog = useDialog();

  // =========================================================================
  /**
   * نام تابع: loadData
   * کارایی: بارگذاری لیست قطعات و لیست تامین‌کنندگان از سرور
   */
  // =========================================================================
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [partsRes, contactsRes] = await Promise.all([
        fetchAPI('/parts').catch(() => ({ ok: false })),
        fetchAPI('/contacts').catch(() => ({ ok: false }))
      ]);
      
      if (partsRes.ok) setPartsList(Array.isArray(partsRes.data) ? partsRes.data : []);
      if (contactsRes.ok) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
    } catch (e) {
      notify.show('خطا', 'مشکلی در بارگذاری اطلاعات پیش آمد.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadData(); }, [loadData]);

  // =========================================================================
  /**
   * نام تابع: resetForm
   * کارایی: پاک کردن فرم و تنظیم مقادیر پیش‌فرض بر اساس نوع قطعه انتخاب شده
   */
  // =========================================================================
  const resetForm = useCallback((type = "Resistor") => {
    const typeConfig = globalConfig?.[type] || globalConfig?.["Resistor"] || {};
    const defUnit = (typeConfig.units && typeConfig.units[0]) || "";
    setFormData({ ...getInitialFormData(type), unit: defUnit });
    setErrors({});
    setLinkInput("");
  }, [globalConfig]);

  // =========================================================================
  /**
   * متغیر محاسباتی: duplicates
   * کارایی: پیدا کردن قطعات تکراری در لیست موجود برای جلوگیری از ثبت تکراری (هشدار به کاربر)
   */
  // =========================================================================
  const duplicates = useMemo(() => {
    if (!formData.val || !formData.type) return [];
    const formFullVal = cleanText(formData.val + (formData.unit && formData.unit !== '-' ? formData.unit : ''));

    return partsList.filter(p => {
      if (formData.id && p.id === formData.id) return false;
      const pType = cleanText(p.type);
      const pVal = cleanText(p.val);
      if (pType !== cleanText(formData.type) || pVal !== formFullVal) return false;
      if (formData.pkg && p.package && cleanText(p.package) !== cleanText(formData.pkg)) return false;
      return true;
    });
  }, [formData.val, formData.unit, formData.pkg, formData.type, partsList, formData.id]);

  // =========================================================================
  /**
   * متغیر محاسباتی: filteredParts
   * کارایی: فیلتر کردن لیست قطعات نمایش داده شده بر اساس مقادیر ورودی در فیلد جستجو
   */
  // =========================================================================
  const filteredParts = useMemo(() => {
    const activeCategory = normalizeText(formData.type);
    const filterVal = normalizeText(filters.val);
    const filterPkg = normalizeText(filters.pkg);
    const filterLoc = normalizeText(filters.loc);
    const filterType = normalizeText(filters.type);
    const filterCode = normalizeText(filters.code);

    if (!Array.isArray(partsList)) return [];

    return partsList.filter(p => {
      if (!p) return false;
      const pVal = normalizeText(p.val);
      const pPkg = normalizeText(p.package);
      const pLoc = normalizeText(p.storage_location);
      const pType = normalizeText(p.type);
      const pCode = normalizeText(getPartCode(p, globalConfig));

      if (activeCategory && pType !== activeCategory) return false;
      if (filterVal && !pVal.includes(filterVal)) return false;
      if (filterPkg && !pPkg.includes(filterPkg)) return false;
      if (filterLoc && !pLoc.includes(filterLoc)) return false;
      if (filterType && !pType.includes(filterType)) return false;
      if (filterCode && !pCode.includes(filterCode)) return false;
      return true;
    });
  }, [partsList, filters, formData.type, globalConfig]);

  const vendorOptions = useMemo(() => {
    const names = contacts.map(c => c.name);
    if (formData.vendor_name && !names.includes(formData.vendor_name)) names.push(formData.vendor_name);
    return names;
  }, [contacts, formData.vendor_name]);

  const locationOptions = useMemo(() => {
    const generalConfig = globalConfig?.["General"];
    const rawLocs = generalConfig?.locations;
    const sharedLocs = Array.isArray(rawLocs) ? [...rawLocs] : [];
    if (formData.location && !sharedLocs.includes(formData.location)) sharedLocs.push(formData.location);
    return sharedLocs;
  }, [globalConfig, formData.location]);

  useLucide([filteredParts.length, formData.type, duplicates.length, formData.purchase_links.length, showSummary]);

  // =========================================================================
  /**
   * نام تابع: handleChange
   * کارایی: مدیریت تغییرات ورودی‌های فرم و به‌روزرسانی State با اعمال قوانین (مثل اعداد)
   */
  // =========================================================================
  const handleChange = useCallback((key, val) => {
    let processedValue = val;
    
    // مدیریت فیلدهای عددی و فرمت‌بندی
    if (key === 'qty' || key === 'min_qty') {
      processedValue = val.replace(/[^0-9]/g, '');
    } 
    else if (key === 'price_toman' || key === 'usd_rate') {
      const cleanNum = val.replace(/,/g, '');
      processedValue = formatNumberWithCommas(cleanNum);
    }

    setErrors(prev => ({ ...prev, [key]: false }));

    if (key === 'type') {
      const typeConfig = globalConfig?.[processedValue] || globalConfig?.["Resistor"] || {};
      const defaultUnit = (typeConfig.units && typeConfig.units.length > 0) ? typeConfig.units[0] : "";
      setFormData(prev => ({ 
        ...prev, 
        [key]: processedValue, 
        unit: defaultUnit, 
        watt: "", 
        pkg: "", 
        tech: "",
        list5: "", list6: "", list7: "", list8: "", list9: "", list10: ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [key]: processedValue }));
    }
  }, [globalConfig]);

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed || formData.purchase_links.length >= 5) return;
    if (formData.purchase_links.includes(trimmed)) {
      notify.show('تکراری', 'این لینک قبلاً اضافه شده است.', 'warning');
      return;
    }
    setFormData(prev => ({ ...prev, purchase_links: [...prev.purchase_links, trimmed] }));
    setLinkInput("");
  };

  const handleRemoveLink = (index) => {
    setFormData(prev => ({ ...prev, purchase_links: prev.purchase_links.filter((_, i) => i !== index) }));
  };

  // =========================================================================
  /**
   * نام تابع: handleSubmit
   * کارایی: اعتبارسنجی اولیه فرم قبل از نمایش خلاصه وضعیت
   */
  // =========================================================================
  const handleSubmit = () => {
    const newErrors = {};
    const typeConfig = globalConfig?.[formData.type] || {};

    // اعتبارسنجی اجباری‌ها
    if (!formData.val) newErrors.val = true;
    if (formData.qty === "" || Number(formData.qty) < 0) newErrors.qty = true;
    if (!formData.price_toman) newErrors.price_toman = true;
    if (!formData.vendor_name) newErrors.vendor_name = true;

    const locSetting = globalConfig?.["General"]?.fields?.['locations'];
    if ((locSetting ? locSetting.required : true) && !formData.location) newErrors.location = true;

    DYNAMIC_FIELDS_MAP.forEach(field => {
      const fConfig = typeConfig.fields?.[field.key];
      const isVisible = fConfig ? fConfig.visible : ['units', 'paramOptions', 'packages', 'techs'].includes(field.key);
      const isRequired = fConfig ? fConfig.required : ['units', 'packages'].includes(field.key);
      if (isVisible && isRequired && !formData[field.stateKey]) newErrors[field.stateKey] = true;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.show('خطای اعتبارسنجی', 'لطفاً فیلدهای الزامی (ستاره‌دار) را تکمیل کنید.', 'error');
      return;
    }
    setShowSummary(true);
  };

  // =========================================================================
  /**
   * نام تابع: handleFinalSubmit
   * کارایی: ارسال نهایی داده‌ها به سرور برای ذخیره (Save)
   */
  // =========================================================================
  const handleFinalSubmit = async () => {
    const fullVal = formData.val + (formData.unit && formData.unit !== "-" ? formData.unit : "");
    const payload = {
      ...formData,
      val: fullVal,
      qty: Number(formData.qty) || 0,
      min_qty: Number(formData.min_qty) || 1,
      price: String(formData.price_toman).replace(/,/g, ''),
      usd_rate: String(formData.usd_rate).replace(/,/g, ''),
      username: user.username
    };

    try {
      const { ok, data } = await fetchAPI('/save', { method: 'POST', body: payload });
      if (ok) {
        await loadData();
        resetForm(formData.type);
        notify.show('موفقیت', 'قطعه با موفقیت در انبار ذخیره شد.', 'success');
        setShowSummary(false);
      } else {
        notify.show('خطا', data.error || 'خطا در ذخیره اطلاعات', 'error');
      }
    } catch (e) {
      notify.show('خطای سرور', 'خطا در برقراری ارتباط با سرور.', 'error');
    }
  };

  // =========================================================================
  /**
   * نام تابع: handleEdit
   * کارایی: بارگذاری اطلاعات یک قطعه در فرم جهت ویرایش
   */
  // =========================================================================
  const handleEdit = useCallback((p) => {
    let category = p.type || "Resistor";
    const config = globalConfig?.[category] || globalConfig?.["Resistor"] || {};
    let u = (config.units && config.units[0]) || "";
    let v = p.val || "";
    
    if (config.units) {
      for (const unit of config.units) {
        if (v.endsWith(unit)) { 
          u = unit; 
          v = v.slice(0, -unit.length); 
          break; 
        }
      }
    }

    let links = [];
    try { 
      if (p.purchase_links) {
        const parsed = JSON.parse(p.purchase_links);
        links = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) { }

    setFormData({
      ...p,
      val: v,
      unit: u,
      tol: p.tolerance,
      pkg: p.package,
      type: category,
      tech: p.tech || "",
      watt: p.watt,
      date: p.buy_date,
      qty: p.quantity ?? "",
      price_toman: formatNumberWithCommas(p.toman_price),
      usd_rate: formatNumberWithCommas(p.usd_rate || ""),
      min_qty: p.min_quantity ?? "",
      location: p.storage_location || "",
      purchase_links: links,
      invoice_number: p.invoice_number || ""
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [globalConfig]);

  // =========================================================================
  /**
   * نام تابع: handleDelete
   * کارایی: حذف یک قطعه از سیستم پس از تایید کاربر
   */
  // =========================================================================
  const handleDelete = useCallback(async (id) => {
    const confirmed = await dialog.ask("حذف قطعه", "آیا از حذف این قطعه از انبار اطمینان دارید؟ این عمل غیرقابل بازگشت است.", "danger");
    if (confirmed) {
      try {
        const { ok } = await fetchAPI(`/delete/${id}`, { method: 'DELETE' });
        if (ok) {
          loadData();
          notify.show('حذف شد', 'قطعه با موفقیت حذف شد.', 'success');
        }
      } catch (e) {
        notify.show('خطا', 'مشکلی در حذف قطعه رخ داد.', 'error');
      }
    }
  }, [dialog, loadData, notify]);

  const currentConfig = globalConfig?.[formData.type] || globalConfig?.["Resistor"] || { units: [], paramOptions: [], packages: [], techs: [] };

  const getLabel = useCallback((key, defaultLabel) => {
    const isLoc = key === 'location';
    const targetConfig = isLoc ? globalConfig?.["General"] : currentConfig;
    const configKey = isLoc ? 'locations' : key;
    const fConfig = targetConfig?.fields?.[configKey];
    const label = fConfig?.label || defaultLabel;
    const isRequired = fConfig ? fConfig.required : ['units', 'packages', 'location'].includes(key);
    return label + (isRequired ? " *" : "");
  }, [currentConfig, globalConfig]);

  const isVisible = useCallback((key) => {
    const fConfig = currentConfig.fields?.[key];
    return fConfig ? fConfig.visible : ['units', 'paramOptions', 'packages', 'techs'].includes(key);
  }, [currentConfig]);

  // =========================================================================
  // بخش نمایش و رابط کاربری (VIEW / UI)
  // =========================================================================
  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} onConfirm={handleFinalSubmit} data={formData} globalConfig={globalConfig} />

        <header className="h-16 border-b border-white/5 flex items-center justify-end px-6 bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs text-nexus-accent font-bold">تعداد قطعات موجود: {partsList.length}</span>
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-nexus-primary animate-pulse'}`}></div>
          </div>
        </header>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* لیست قطعات */}
            <div className="col-span-12 lg:col-span-8 flex flex-col order-2 lg:order-1">
              <div className="glass-panel rounded-2xl flex flex-col overflow-hidden">
                <div className="p-3 border-b border-white/5 grid grid-cols-5 gap-3 bg-white/5">
                  <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="کد 12 رقمی..." value={filters.code} onChange={e => setFilters({ ...filters, code: e.target.value })} />
                  <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر مقدار..." value={filters.val} onChange={e => setFilters({ ...filters, val: e.target.value })} />
                  <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر پکیج..." value={filters.pkg} onChange={e => setFilters({ ...filters, pkg: e.target.value })} />
                  <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر آدرس..." value={filters.loc} onChange={e => setFilters({ ...filters, loc: e.target.value })} />
                  <input className="nexus-input w-full px-2 py-1 text-xs" placeholder="فیلتر نوع..." value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} />
                </div>

                <div className="grid grid-cols-12 gap-2 bg-black/30 p-3 border-b border-white/5 text-[11px] text-gray-400 font-bold text-center">
                  <div className="col-span-2 text-right pr-2">کد اختصاصی</div>
                  <div className="col-span-5 text-right">مشخصات فنی</div>
                  <div className="col-span-1">تعداد</div>
                  <div className="col-span-2">قیمت</div>
                  <div className="col-span-2">عملیات</div>
                </div>

                <div className="p-2 space-y-2 overflow-y-auto max-h-[800px] custom-scroll">
                  {filteredParts.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 text-sm">قطعه‌ای با این مشخصات یافت نشد.</div>
                  ) : (
                    filteredParts.map(p => (
                      <PartRow key={p.id} p={p} globalConfig={globalConfig} isSelected={formData.id === p.id} serverStatus={serverStatus} onEdit={handleEdit} onDelete={handleDelete} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* فرم ثبت/ویرایش */}
            <div className="col-span-12 lg:col-span-4 h-full order-1 lg:order-2">
              <div className="glass-panel border-white/10 rounded-2xl p-5 h-full flex flex-col shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nexus-primary to-purple-600"></div>

                <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
                  <span>{formData.id ? 'ویرایش قطعه' : 'ثبت قطعه جدید'}</span>
                  {formData.id && (
                    <button onClick={() => resetForm(formData.type)} className="text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded transition">انصراف</button>
                  )}
                </h2>

                {/* هشدار قطعات مشابه */}
                {duplicates.length > 0 && !formData.id && (
                  <div className="mb-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-3 text-yellow-400 font-bold text-sm border-b border-yellow-500/10 pb-2">
                      <i data-lucide="alert-triangle" className="w-4 h-4"></i>
                      <span>هشدار: قطعات مشابه یافت شد</span>
                      <span className="text-[10px] bg-yellow-500/20 px-2 py-0.5 rounded-full text-yellow-300 mr-auto">{duplicates.length} مورد</span>
                    </div>
                    <div className="grid gap-3 max-h-60 overflow-y-auto pr-1 custom-scroll">
                      {duplicates.map(d => (
                        <div key={d.id} className="bg-slate-900/50 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-1 h-full bg-yellow-500/30"></div>
                          <div className="flex justify-between items-start mb-2 pr-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{d.val} {d.unit}</span>
                                <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 rounded">{d.package}</span>
                              </div>
                              <div className="flex flex-col gap-1 text-[11px] text-gray-500">
                                <span className="flex items-center gap-1.5"><i data-lucide="map-pin" className="w-3 h-3 text-orange-400"></i><span className="text-gray-300">{d.storage_location}</span></span>
                                <span className="flex items-center gap-1.5"><i data-lucide="store" className="w-3 h-3 text-blue-400"></i><span>{d.vendor_name || 'فروشنده نامشخص'}</span></span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg">{d.quantity} عدد</span>
                              <span className="text-amber-500/60 text-[10px] font-mono ltr">{(Number(d.toman_price) || 0).toLocaleString()} T</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 pr-3">
                            <span className="text-[10px] text-gray-600 truncate max-w-[150px]">{d.tech || d.reason || '-'}</span>
                            <button onClick={() => handleEdit(d)} className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/5">
                              <span>انتخاب و ادغام</span>
                              <i data-lucide="check-circle-2" className="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pl-1 pr-1 custom-scroll overflow-y-auto max-h-[calc(100vh-250px)]">
                  <div className="flex flex-col">
                    <label className="text-nexus-accent text-xs mb-1 block font-bold">دسته‌بندی قطعه (Component Type)</label>
                    <select value={formData.type} onChange={e => handleChange('type', e.target.value)} disabled={!serverStatus} className="nexus-input w-full px-3 py-2 text-sm font-bold text-yellow-400 bg-slate-900/80 border-nexus-accent/30 appearance-none cursor-pointer">
                      {Object.keys(globalConfig).filter(k => k !== 'General').sort((a, b) => (globalConfig[b].priority || 0) - (globalConfig[a].priority || 0)).map(k => <option key={k} value={k}>{globalConfig[k].label}</option>)}
                    </select>
                  </div>

                  <div className="h-px bg-white/5 my-1"></div>

                  <div className="flex gap-3">
                    <NexusInput label="مقدار (Value) *" value={formData.val} onChange={e => handleChange('val', e.target.value)} placeholder="مثلا 100" className="flex-1" disabled={!serverStatus} error={errors.val} />
                    {isVisible('units') && <div className="flex-1"><NexusSelect label={getLabel('units', 'واحد')} options={currentConfig.units} value={formData.unit} onChange={e => handleChange('unit', e.target.value)} disabled={!serverStatus} error={errors.unit} /></div>}
                  </div>

                  <div className="flex gap-3">
                    {isVisible('paramOptions') && <NexusSelect label={getLabel('paramOptions', currentConfig.paramLabel)} options={currentConfig.paramOptions} value={formData.watt} onChange={e => handleChange('watt', e.target.value)} className="flex-1" disabled={!serverStatus} error={errors.watt} />}
                    <NexusSelect label={getLabel('tolerances', 'تولرانس')} options={currentConfig.tolerances || []} value={formData.tol} onChange={e => handleChange('tol', e.target.value)} className="flex-1" disabled={!serverStatus} error={errors.tol} />
                  </div>

                  <div className="flex gap-3">
                    {isVisible('packages') && <NexusSelect label={getLabel('packages', 'پکیج (Package)')} options={currentConfig.packages} value={formData.pkg} onChange={e => handleChange('pkg', e.target.value)} className="flex-1" disabled={!serverStatus} error={errors.pkg} />}
                    {isVisible('techs') && <div className="flex-1"><label className="text-gray-400 text-xs mb-1 block font-medium">{getLabel('techs', 'تکنولوژی/نوع دقیق')}</label><NexusSelect options={currentConfig.techs} value={formData.tech} onChange={e => handleChange('tech', e.target.value)} disabled={!serverStatus} error={errors.tech} /></div>}
                  </div>

                  {/* فیلدهای لیستی پویا */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {DYNAMIC_FIELDS_MAP.filter(f => f.key.startsWith('list')).map(field => {
                      if (!isVisible(field.key)) return null;
                      return <NexusSelect key={field.key} label={getLabel(field.key, field.label)} value={formData[field.stateKey]} options={currentConfig[field.key] || []} onChange={e => handleChange(field.stateKey, e.target.value)} disabled={!serverStatus} error={errors[field.stateKey]} />;
                    })}
                  </div>

                  <div className="h-px bg-white/5 my-2"></div>

                  <div className="flex gap-3">
                    <NexusInput label="تعداد *" type="text" inputMode="numeric" value={formData.qty} onChange={e => handleChange('qty', e.target.value)} onKeyPress={preventNonNumericInput} className="flex-1" disabled={!serverStatus} error={errors.qty} />
                    <NexusInput label="حداقل *" type="text" inputMode="numeric" value={formData.min_qty} onChange={e => handleChange('min_qty', e.target.value)} onKeyPress={preventNonNumericInput} className="flex-1" disabled={!serverStatus} error={errors.min_qty} />
                  </div>

                  <div className="flex gap-3">
                    <NexusInput label="قیمت واحد *" value={formData.price_toman} onChange={e => handleChange('price_toman', e.target.value)} disabled={!serverStatus} error={errors.price_toman} className="flex-1" />
                    <NexusInput label="نرخ دلار (تومان)" value={formData.usd_rate} onChange={e => handleChange('usd_rate', e.target.value)} disabled={!serverStatus} error={errors.usd_rate} className="flex-1" />
                  </div>

                  <div className="flex gap-3">
                    <NexusSelect label={getLabel('location', 'آدرس نگهداری')} value={formData.location} onChange={e => handleChange('location', e.target.value)} options={locationOptions} disabled={!serverStatus} error={errors.location} className="flex-1" />
                    <NexusSelect label="نام فروشنده *" value={formData.vendor_name} onChange={e => handleChange('vendor_name', e.target.value)} options={vendorOptions} disabled={!serverStatus} error={errors.vendor_name} className="flex-1" />
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1"><PersianDatePicker label="تاریخ خرید/فاکتور" value={formData.date} onChange={date => handleChange('date', date)} /></div>
                    <div className="flex-1"><NexusInput label="شماره فاکتور" value={formData.invoice_number} onChange={e => handleChange('invoice_number', e.target.value)} disabled={!serverStatus} placeholder="مثلاً ۱۲۳۴۵" /></div>
                  </div>

                  <NexusInput label="پروژه / دلیل خرید" value={formData.reason} onChange={e => handleChange('reason', e.target.value)} disabled={!serverStatus} />

                  {/* بخش لینک‌های خرید */}
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <label className="text-nexus-accent text-xs mb-2 block font-bold">لینک‌های خرید (اختیاری - حداکثر ۵ مورد)</label>
                    <div className="flex gap-2 mb-2">
                      <input className="nexus-input flex-1 px-3 py-2 text-xs ltr placeholder-gray-600" placeholder="https://..." value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLink()} />
                      <button onClick={handleAddLink} className="bg-nexus-primary hover:bg-indigo-600 text-white p-2 rounded-lg transition disabled:opacity-50" disabled={formData.purchase_links.length >= 5}><i data-lucide="plus" className="w-4 h-4"></i></button>
                    </div>
                    <div className="space-y-1.5">
                      {formData.purchase_links.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-xs group">
                          <a href={link} target="_blank" className="text-blue-400 truncate max-w-[200px] hover:underline" rel="noreferrer">{link}</a>
                          <button onClick={() => handleRemoveLink(idx)} className="text-gray-500 hover:text-red-400 transition"><i data-lucide="x" className="w-3.5 h-3.5"></i></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <button onClick={handleSubmit} disabled={!serverStatus || isLoading} className={`w-full h-11 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${formData.id ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 'bg-gradient-to-r from-nexus-primary to-purple-600'} disabled:opacity-50`}>
                    {isLoading ? (
                      <span className="flex items-center gap-2"><i className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></i> در حال پردازش...</span>
                    ) : (
                      <>
                        {serverStatus ? (formData.id ? 'ذخیره تغییرات' : 'ذخیره در انبار') : 'سرور قطع است'}
                        <i data-lucide={formData.id ? "save" : "plus-circle"} className="w-5 h-5"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

window.EntryPage = EntryPage;