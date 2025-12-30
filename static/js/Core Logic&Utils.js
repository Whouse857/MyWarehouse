/**
 * نام فایل: Core Logic&Utils.js
 * نویسنده: سرگلی
 * نسخه: V0.20
 * * کلیات عملکرد و توابع:
 * این فایل هسته مرکزی منطق‌های پایه، توابع کمکی (Utility Functions) و کانتکست‌های عمومی برنامه را تشکیل می‌دهد.
 * این فایل باید پیش از سایر اسکریپت‌ها بارگذاری شود تا ابزارهای سراسری در دسترس باشند.
 * * توابع و بخش‌های کلیدی:
 * 1. Contexts: ایجاد کانتکست‌های Notification و Dialog برای استفاده در سراسر برنامه.
 * 2. Helpers: توابع کمکی برای تبدیل تاریخ (شمسی/میلادی)، فرمت‌دهی اعداد و...
 * 3. fetchAPI: تابع مرکزی برای مدیریت درخواست‌های شبکه (HTTP Requests) به سمت سرور.
 * 4. useLucide: هوک سفارشی برای رندر کردن آیکون‌های Lucide.
 * 5. ErrorBoundary: کامپوننت مدیریت خطای React برای جلوگیری از کرش کردن کل برنامه.
 */

const { useState, useEffect, useMemo, useCallback, useRef, memo, createContext, useContext } = React;
const API_URL = "http://127.0.0.1:8090/api";

// =========================================================================
// بخش کانتکست‌ها (CONTEXTS)
// =========================================================================

const NotificationContext = createContext({ show: () => {} });
const DialogContext = createContext({ ask: () => Promise.resolve(false) });

// =========================================================================
/**
 * نام هوک: useNotify
 * کارایی: هوک سفارشی برای دسترسی آسان به سیستم اعلان‌ها (Notification)
 */
// =========================================================================
const useNotify = () => useContext(NotificationContext);

// =========================================================================
/**
 * نام هوک: useDialog
 * کارایی: هوک سفارشی برای دسترسی آسان به سیستم دیالوگ‌ها (تاییدیه/سوال)
 */
// =========================================================================
const useDialog = () => useContext(DialogContext);

// =========================================================================
// بخش توابع کمکی (HELPERS)
// =========================================================================

// =========================================================================
/**
 * نام تابع: getJalaliDate
 * کارایی: دریافت تاریخ جاری سیستم به صورت رشته شمسی
 */
// =========================================================================
const getJalaliDate = () => new Date().toLocaleDateString('fa-IR');

// =========================================================================
/**
 * نام تابع: toShamsi
 * کارایی: تبدیل یک رشته تاریخ میلادی به فرمت شمسی (فقط تاریخ)
 */
// =========================================================================
const toShamsi = (dateStr) => {
    if (!dateStr) return "-";
    try {
        if (/[آ-ی]/.test(dateStr) || !/^\d{4}/.test(dateStr)) return dateStr;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(date);
    } catch (e) { return dateStr; }
};

// =========================================================================
/**
 * نام تابع: toShamsiDateTime
 * کارایی: تبدیل یک رشته تاریخ میلادی به فرمت شمسی همراه با ساعت و دقیقه
 */
// =========================================================================
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

// =========================================================================
/**
 * نام تابع: formatNumberWithCommas
 * کارایی: جداسازی سه رقم سه رقم اعداد با کاما برای نمایش خواناتر
 */
// =========================================================================
const formatNumberWithCommas = (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

// =========================================================================
/**
 * نام تابع: fetchAPI
 * کارایی: تابع Wrapper برای مدیریت درخواست‌های Fetch به API با مدیریت خطا و هدرهای پیش‌فرض
 */
// =========================================================================
const fetchAPI = async (endpoint, { method = 'GET', body = null } = {}) => {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        return { ok: res.ok, data, status: res.status };
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// =========================================================================
/**
 * نام هوک: useLucide
 * کارایی: رندر مجدد آیکون‌های Lucide در صورت تغییر وابستگی‌ها (Dependencies)
 */
// =========================================================================
const useLucide = (dependencies) => {
    useEffect(() => {
        if (window.lucide) {
            const tid = setTimeout(() => window.lucide.createIcons(), 50);
            return () => clearTimeout(tid);
        }
    }, dependencies);
};

// =========================================================================
// بخش کامپوننت‌های پایه (BASE COMPONENTS)
// =========================================================================

// =========================================================================
/**
 * نام کامپوننت: ErrorBoundary
 * کارایی: مدیریت خطاهای React در سطح کامپوننت و نمایش پیام خطای کاربرپسند به جای سفید شدن صفحه
 */
// =========================================================================
class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
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

// =========================================================================
// اکسپورت‌های سراسری (GLOBAL EXPORTS)
// =========================================================================
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