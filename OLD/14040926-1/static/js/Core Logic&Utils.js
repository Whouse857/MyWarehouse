// [TAG: CORE]
// منطق‌های پایه، توابع کمکی و کانتکست‌ها
// این فایل باید قبل از بقیه لود شود.

const { useState, useEffect, useMemo, useCallback, useRef, memo, createContext, useContext } = React;
const API_URL = "http://127.0.0.1:8090/api";

// --- Contexts ---
const NotificationContext = createContext({ show: () => {} });
const DialogContext = createContext({ ask: () => Promise.resolve(false) });

const useNotify = () => useContext(NotificationContext);
const useDialog = () => useContext(DialogContext);

// --- Helpers ---
const getJalaliDate = () => new Date().toLocaleDateString('fa-IR');

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

const formatNumberWithCommas = (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";

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

// هوک بهینه‌شده برای آیکون‌ها
const useLucide = (dependencies) => {
    useEffect(() => {
        if (window.lucide) {
            const tid = setTimeout(() => window.lucide.createIcons(), 50);
            return () => clearTimeout(tid);
        }
    }, dependencies || []);
};

// Global Error Boundary
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

// Export globally for other scripts
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