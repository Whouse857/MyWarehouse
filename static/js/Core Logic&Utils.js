// ====================================================================================================
// نسخه: 0.20
// فایل: Core Logic&Utils.js
// تهیه کننده: ------
//
// توضیحات کلی ماژول:
// این فایل حیاتی‌ترین بخش فرانت‌اند است که قبل از هر فایل دیگری بارگذاری می‌شود.
// 
// وظایف اصلی:
// ۱. تعریف کانتکست‌های سراسری (Context API) برای مدیریت اعلان‌ها و دیالوگ‌ها.
// ۲. تعریف ثابت‌های سیستم مانند آدرس پایه API.
// ۳. توابع کمکی (Utility Functions) برای تبدیل تاریخ شمسی، فرمت‌بندی پول و ...
// ۴. تابع اصلی fetchAPI برای مدیریت تمام درخواست‌های شبکه به سرور پایتون.
// ۵. کامپوننت مدیریت خطا (Error Boundary) برای جلوگیری از کرش کردن کل برنامه.
// ====================================================================================================

// استخراج تمام هوک‌های مورد نیاز از React و در دسترس قرار دادن آن‌ها
const { useState, useEffect, useMemo, useCallback, useRef, memo, createContext, useContext } = React;

// ----------------------------------------------------------------------------------------------------
// [تگ: پیکربندی شبکه]
// آدرس پایه سرور پایتون (Flask). تمام درخواست‌ها به این آدرس ارسال می‌شوند.
// اگر پورت سرور تغییر کند، فقط همین یک خط نیاز به ویرایش دارد.
// ----------------------------------------------------------------------------------------------------
const API_URL = "http://127.0.0.1:8090/api";

// ----------------------------------------------------------------------------------------------------
// [تگ: کانتکست‌های سراسری]
// ایجاد Context برای مدیریت stateهای جهانی بدون نیاز به prop drilling.
// - NotificationContext: برای نمایش پیام‌های Toast در هر جای برنامه.
// - DialogContext: برای نمایش پنجره‌های تایید (Confirm) در هر جای برنامه.
// ----------------------------------------------------------------------------------------------------
const NotificationContext = createContext({ show: () => {} });
const DialogContext = createContext({ ask: () => Promise.resolve(false) });

// هوک‌های سفارشی برای استفاده آسان‌تر از کانتکست‌ها
const useNotify = () => useContext(NotificationContext);
const useDialog = () => useContext(DialogContext);

// ----------------------------------------------------------------------------------------------------
// [تگ: توابع کمکی تاریخ و زمان]
// مجموعه توابعی برای کار با تاریخ شمسی و فرمت‌بندی زمان.
// ----------------------------------------------------------------------------------------------------

// دریافت تاریخ امروز به شمسی (مثلاً: ۱۴۰۳/۱۰/۱۰)
const getJalaliDate = () => new Date().toLocaleDateString('fa-IR');

// تبدیل یک رشته تاریخ میلادی به شمسی (فقط تاریخ)
const toShamsi = (dateStr) => {
    if (!dateStr) return "-";
    try {
        // اگر تاریخ از قبل شمسی است یا فرمت درستی ندارد، همان را برگردان
        if (/[آ-ی]/.test(dateStr) || !/^\d{4}/.test(dateStr)) return dateStr;
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(date);
    } catch (e) { return dateStr; }
};

// تبدیل تاریخ میلادی به شمسی همراه با ساعت و دقیقه
const toShamsiDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
        if (/[آ-ی]/.test(dateStr)) return dateStr;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch (e) { return dateStr; }
};

// ----------------------------------------------------------------------------------------------------
// [تگ: فرمت‌بندی پول]
// جدا کردن اعداد سه رقم سه رقم با کاما (مثلاً: ۱,۰۰۰,۰۰۰).
// از Regex برای جایگزینی استفاده می‌کند.
// ----------------------------------------------------------------------------------------------------
const formatNumberWithCommas = (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

// ----------------------------------------------------------------------------------------------------
// [تگ: مدیریت درخواست‌های شبکه]
// یک Wrapper هوشمند روی تابع fetch استاندارد جاوااسکریپت.
// این تابع هدرهای لازم (Content-Type) را تنظیم کرده و خطاها را مدیریت می‌کند.
// ----------------------------------------------------------------------------------------------------
const fetchAPI = async (endpoint, { method = 'GET', body = null } = {}) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    // اگر متدی غیر از GET باشد و بدنه داشته باشد، آن را به JSON تبدیل می‌کند
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        // تبدیل پاسخ سرور به JSON
        const data = await res.json();
        // بازگرداندن یک آبجکت استاندارد شامل وضعیت موفقیت، داده و کد وضعیت HTTP
        return { ok: res.ok, data, status: res.status };
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        // پرتاب خطا برای مدیریت در لایه بالاتر (مثلاً نمایش پیام خطا به کاربر)
        throw error;
    }
};

// ----------------------------------------------------------------------------------------------------
// [تگ: هوک مدیریت آیکون‌ها]
// این هوک اطمینان حاصل می‌کند که بعد از هر بار رندر شدن کامپوننت،
// کتابخانه Lucide اجرا شده و تگ‌های <i> را به SVG تبدیل می‌کند.
// ----------------------------------------------------------------------------------------------------
const useLucide = (dependencies) => {
    useEffect(() => {
        if (window.lucide) {
            // تاخیر کوچک برای اطمینان از اینکه DOM کاملاً بروز شده است
            const tid = setTimeout(() => window.lucide.createIcons(), 50);
            return () => clearTimeout(tid);
        }
    }, dependencies);
};

// ----------------------------------------------------------------------------------------------------
// [تگ: مدیریت خطای سراسری (Error Boundary)]
// یک کامپوننت کلاس (Class Component) که دور کل برنامه پیچیده می‌شود.
// اگر خطایی در رندرینگ کامپوننت‌های فرزند رخ دهد، به جای سفید شدن کل صفحه،
// یک پیام خطای دوستانه نمایش می‌دهد.
// ----------------------------------------------------------------------------------------------------
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    
    // متد چرخه حیات برای دریافت خطا
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    
    // لاگ کردن خطا در کنسول برای توسعه‌دهنده
    componentDidCatch(error, errorInfo) { console.error("React Error:", error, errorInfo); }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 text-center glass-panel rounded-2xl m-4">
                    <i data-lucide="alert-triangle" className="w-16 h-16 mb-4 opacity-50"></i>
                    <h2 className="text-xl font-bold mb-2">خطا در نمایش صفحه</h2>
                    <p className="text-sm opacity-70 mb-4 ltr font-mono bg-black/20 p-2 rounded">{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20 transition font-bold">تلاش مجدد</button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ----------------------------------------------------------------------------------------------------
// [تگ: اتصال به فضای جهانی]
// تمام توابع و متغیرهای تعریف شده به شیء window متصل می‌شوند تا
// در سایر فایل‌های اسکریپت (بدون نیاز به ماژول سیستم) قابل دسترس باشند.
// ----------------------------------------------------------------------------------------------------
window.NotificationContext = NotificationContext;
window.DialogContext = DialogContext;
window.useNotify = useNotify;
window.useDialog = useDialog;
window.getJalaliDate = getJalaliDate;
window.toShamsi = toShamsi;
window.toShamsiDateTime = toShamsiDateTime;
window.formatNumberWithCommas = formatNumberWithCommas;
window.fetchAPI = fetchAPI;
window.useLucide = useLucide;
window.ErrorBoundary = ErrorBoundary;