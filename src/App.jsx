import { fetchAccounts, fetchWarrantyDb, fetchPricingStore, submitPricing as submitPricingApi, fetchAccessLogs, fetchInvoices, fetchInspections, fetchClaims } from "./api";
import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════
   ROOF WARRANTY MANAGEMENT APP — Roof MRI Branded
   Tabs: Accounts · Warranties · Access Log · Invoices · Inspections · Claims
   Design: Navy/Green/White — Poppins + Montserrat
   ═══════════════════════════════════════════════════════════════════ */

// ── COLORS ─────────────────────────────────────────────────────────
const C = {
  green: "#00bd70", greenDk: "#00a35f", greenLt: "#e6f9f0", greenBg: "#f0fdf4",
  navy: "#1e2c55", navyLt: "#2a3d6e", navyDk: "#151f3d",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377", g800: "#2d3344",
  yellow: "#f59e0b", yellowBg: "#fef9e7", yellowBdr: "#fbbf24",
  red: "#ef4444", redBg: "#fef2f2", redBdr: "#fca5a5",
  blue: "#3b82f6", blueBg: "#eff6ff",
  orange: "#f97316", orangeBg: "#fff7ed",
  purple: "#8b5cf6", purpleBg: "#f5f3ff",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
  shadowLg: "0 4px 16px rgba(30,44,85,0.10)",
  shadowXl: "0 12px 40px rgba(30,44,85,0.18)",
};

// ── FONTS ──────────────────────────────────────────────────────────
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };

// ── ICONS (SVG) ────────────────────────────────────────────────────
const Ic = {
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  chevR: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  chevD: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 18h6v4H9z"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  qr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="17"/><line x1="14" y1="21" x2="17" y2="21"/></svg>,
  dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  clip: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  cal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  flag: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  starEmpty: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  x: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};
// ── UTILITIES ──────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtMoney = (a) => `$${a.toLocaleString()}`;
const daysTo = (d) => Math.ceil((new Date(d) - new Date()) / 864e5);
const pctUsed = (s, e) => {
  const a = new Date(s).getTime(), b = new Date(e).getTime();
  return Math.min(100, Math.max(0, ((Date.now() - a) / (b - a)) * 100));
};

// (Data is now fetched from the API — see api.js)
// ── HELPERS ─────────────────────────────────────────────────────────
const allRoofs = (owners) => {
  const out = [];
  (owners || []).forEach(o => o.properties.forEach(p => p.roofs.forEach(r => out.push({ ...r, propName: p.name, propAddr: p.address, ownerName: o.name }))));
  return out;
};
const findRoof = (owners, id) => allRoofs(owners).find(r => r.id === id);

// ── BADGE ──────────────────────────────────────────────────────────
const badgeStyles = {
  active: { bg: C.greenLt, c: C.greenDk, dot: C.green },
  current: { bg: C.greenLt, c: C.greenDk, dot: C.green },
  completed: { bg: C.greenLt, c: C.greenDk, dot: C.green },
  approved: { bg: C.greenLt, c: C.greenDk, dot: C.green },
  paid: { bg: C.greenLt, c: C.greenDk, dot: C.green },
  warranty: { bg: C.blueBg, c: C.blue, dot: C.blue },
  "at-risk": { bg: C.yellowBg, c: "#b45309", dot: C.yellow },
  review: { bg: C.yellowBg, c: "#b45309", dot: C.yellow },
  "in-progress": { bg: C.blueBg, c: "#1d4ed8", dot: C.blue },
  scheduled: { bg: C.blueBg, c: "#1d4ed8", dot: C.blue },
  "expired-inspection": { bg: C.redBg, c: "#dc2626", dot: C.red },
  overdue: { bg: C.redBg, c: "#dc2626", dot: C.red },
  pending: { bg: C.g100, c: C.g600, dot: C.g400 },
};

const Badge = ({ status, label }) => {
  const s = badgeStyles[status] || badgeStyles.pending;
  const txt = label || status.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.c, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, fontFamily: F.head, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />{txt}
    </span>
  );
};

// ── KPI CARD ───────────────────────────────────────────────────────
const KPI = ({ label, value, icon, color, sub }) => (
  <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "18px 20px", boxShadow: C.shadow }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.head }}>{label}</span>
      <span style={{ color: color || C.green }}>{icon}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.g400, marginTop: 4, fontFamily: F.body }}>{sub}</div>}
  </div>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: 20, boxShadow: C.shadow, cursor: onClick ? "pointer" : "default", transition: "all 0.15s ease", ...style }}>{children}</div>
);

const Btn = ({ children, primary, small, onClick, style: s }) => (
  <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: small ? "6px 12px" : "10px 18px", borderRadius: 10, background: primary ? C.green : C.white, border: primary ? "none" : `1.5px solid ${C.g200}`, color: primary ? C.white : C.navy, fontSize: small ? 12 : 13, fontWeight: 700, fontFamily: F.head, cursor: "pointer", transition: "all 0.15s ease", ...s }}>{children}</button>
);

const Info = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: F.head }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{value}</div>
  </div>
);

const FormField = ({ label, value, onChange, placeholder, type = "text", required, options }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F.head, marginBottom: 6 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.g200}`, background: C.white, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none" }}>
        <option value="">{placeholder || "Select..."}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.g200}`, background: C.white, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none", boxSizing: "border-box" }} />
    )}
  </div>
);

// ── CORPORATE BACKING TIERS ───────────────────────────────────────
const CORP_TIER = {
  "Sika Sarnafil": 5, "GAF": 5, "Carlisle": 5, "Carlisle (Henry)": 5,
  "Sherwin-Williams (UNIFLEX)": 5, "Polyglass (MAPEI)": 4,
  "Tropical (SOPREMA)": 4, "Firestone": 4, "Versico": 3,
  "GACO (Amrize)": 3, "American WeatherStar": 3, "APOC": 3,
  "KARNAK": 2, "Everest Systems": 2, "FAR (Fluid Applied Roofing)": 2,
};

// (Pricing data is now fetched from the API)

const getMedian = (arr) => {
  if (!arr || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getPricingSummary = (pricingStore, warrantyId) => {
  const data = pricingStore[warrantyId];
  if (!data) return { baseFee: null, psfFee: null, submissions: 0, sufficient: false };
  const activeBase = data.baseFee.filter(s => s.status === "active");
  const activePsf = data.psfFee.filter(s => s.status === "active");
  const count = Math.min(activeBase.length, activePsf.length);
  return {
    baseFee: count >= 3 ? getMedian(activeBase.map(s => s.amount)) : null,
    psfFee: count >= 3 ? getMedian(activePsf.map(s => s.amount)) : null,
    submissions: count,
    sufficient: count >= 3,
  };
};
const doSubmitPricing = async (pricingStore, setPricingStore, warrantyId, baseFee, psfFee) => {
  const now = new Date().toISOString();
  // Optimistic local update
  const newStore = { ...pricingStore };
  if (!newStore[warrantyId]) newStore[warrantyId] = { baseFee: [], psfFee: [] };
  if (baseFee > 0) newStore[warrantyId].baseFee.push({ amount: baseFee, submittedAt: now, status: "active" });
  if (psfFee > 0) newStore[warrantyId].psfFee.push({ amount: psfFee, submittedAt: now, status: "active" });
  setPricingStore(newStore);
  // Persist to API
  submitPricingApi({ warrantyId, baseFee, psfFee }).catch(err => console.warn("[API] Pricing submit error:", err));
};

// (WARRANTY_DB is now fetched from the API)

const Stars = ({ n, max = 10 }) => {
  const filled = Math.round(n / 2);
  return <span style={{ display: "inline-flex", gap: 2 }}>{[...Array(5)].map((_, i) => <span key={i} style={{ color: i < filled ? C.yellow : C.g200 }}>{i < filled ? Ic.star : Ic.starEmpty}</span>)}</span>;
};
// WarrantyAnalyzer – full 3-path wizard
function WarrantyAnalyzer({ open, onClose, WARRANTY_DB }) {
  const [path, setPath] = useState(null);
  const [step, setStep] = useState(0);
  const [propName, setPropName] = useState("");
  const [propAddr, setPropAddr] = useState("");
  const [propType, setPropType] = useState("Commercial");
  const [roofType, setRoofType] = useState("");
  const [roofAge, setRoofAge] = useState("");
  const [roofSqft, setRoofSqft] = useState("");
  const [roofMembrane, setRoofMembrane] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [compIds, setCompIds] = useState([]);
  const [compFilter, setCompFilter] = useState("");
  const [recMembrane, setRecMembrane] = useState("");
  const [recBudget, setRecBudget] = useState("mid");
  const [recTerm, setRecTerm] = useState(15);
  const [recResults, setRecResults] = useState(null);

  if (!open) return null;

  const reset = () => { setPath(null); setStep(0); setPropName(""); setPropAddr(""); setPropType("Commercial"); setRoofType(""); setRoofAge(""); setRoofSqft(""); setRoofMembrane(""); setSetupDone(false); setCompIds([]); setCompFilter(""); setRecMembrane(""); setRecBudget("mid"); setRecTerm(15); setRecResults(null); };

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 };
  const modal = { background: C.white, borderRadius: 20, padding: 32, maxWidth: 820, width: "95vw", maxHeight: "90vh", overflowY: "auto", position: "relative" };
  const closeModal = () => { reset(); onClose(); };

  // ---- PATH SELECTION ----
  if (!path) return (
    <div style={overlay} onClick={closeModal}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Warranty Analyzer</h2>
          <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
        </div>
        <p style={{ fontSize: 14, color: C.g600, fontFamily: F.body, marginBottom: 28 }}>Select a workflow to begin analyzing warranty options for your properties.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            { id: "setup", icon: Ic.accounts, title: "New Property Setup", desc: "Register a new property and configure roof sections for warranty tracking." },
            { id: "compare", icon: Ic.warranties, title: "Warranty Comparison", desc: "Compare up to 4 warranties side by side across key coverage dimensions." },
            { id: "recommend", icon: Ic.inspections, title: "Warranty Recommendation", desc: "Get AI-matched warranty suggestions based on roof profile and budget." }
          ].map(p => (
            <button key={p.id} onClick={() => setPath(p.id)} style={{ background: C.white, border: "2px solid " + C.g200, borderRadius: 14, padding: 20, textAlign: "left", cursor: "pointer", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = C.g50; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.g200; e.currentTarget.style.background = C.white; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: C.g600, fontFamily: F.body, lineHeight: 1.5 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ---- NEW PROPERTY SETUP ----
  if (path === "setup") {
    const setupSteps = ["Property Info", "Roof Details", "Confirm & Save"];
    const canNext = step === 0 ? propName && propAddr : step === 1 ? roofType && roofSqft && roofMembrane : true;

    if (setupDone) return (
      <div style={overlay} onClick={closeModal}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: F.head, marginBottom: 12 }}>Property Registered!</h2>
            <p style={{ fontSize: 14, color: C.g600, fontFamily: F.body, marginBottom: 8 }}><strong>{propName}</strong> at {propAddr}</p>
            <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 24 }}>{roofType} roof · {Number(roofSqft).toLocaleString()} sq ft · {roofMembrane} membrane</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn onClick={() => { reset(); setPath("recommend"); }}>Get Warranty Recommendation</Btn>
              <Btn secondary onClick={closeModal}>Done</Btn>
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div style={overlay} onClick={closeModal}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>{Ic.accounts} New Property Setup</h2>
            <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {setupSteps.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, background: i <= step ? C.green : C.g200, marginBottom: 6 }} />
                <span style={{ fontSize: 11, color: i <= step ? C.navy : C.g400, fontFamily: F.body, fontWeight: i === step ? 700 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
          {step === 0 && (
            <div style={{ display: "grid", gap: 16 }}>
              <FormField label="Property Name" value={propName} onChange={setPropName} placeholder="e.g. Riverside Medical Center" />
              <FormField label="Street Address" value={propAddr} onChange={setPropAddr} placeholder="e.g. 123 Main St, Nashville TN" />
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 4 }}>Property Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Commercial", "Industrial", "Institutional", "Multi-Family"].map(t => (
                    <button key={t} onClick={() => setPropType(t)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid " + (propType === t ? C.green : C.g200), background: propType === t ? C.g50 : C.white, color: propType === t ? C.navy : C.g600, fontFamily: F.body, fontSize: 12, fontWeight: propType === t ? 700 : 400, cursor: "pointer" }}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 4 }}>Roof System Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Flat/Low-Slope", "Metal Standing Seam", "Built-Up (BUR)", "Modified Bitumen", "Green Roof", "Steep Slope"].map(t => (
                    <button key={t} onClick={() => setRoofType(t)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid " + (roofType === t ? C.green : C.g200), background: roofType === t ? C.g50 : C.white, color: roofType === t ? C.navy : C.g600, fontFamily: F.body, fontSize: 12, fontWeight: roofType === t ? 700 : 400, cursor: "pointer" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField label="Roof Age (years)" value={roofAge} onChange={setRoofAge} placeholder="e.g. 5" />
                <FormField label="Total Sq Footage" value={roofSqft} onChange={setRoofSqft} placeholder="e.g. 45000" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 4 }}>Primary Membrane</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["TPO", "EPDM", "PVC", "Acrylic", "Silicone", "Asphaltic", "Metal"].map(m => (
                    <button key={m} onClick={() => setRoofMembrane(m)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid " + (roofMembrane === m ? C.green : C.g200), background: roofMembrane === m ? C.g50 : C.white, color: roofMembrane === m ? C.navy : C.g600, fontFamily: F.body, fontSize: 12, fontWeight: roofMembrane === m ? 700 : 400, cursor: "pointer" }}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div style={{ background: C.g50, borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 16 }}>Review Property Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, fontFamily: F.body }}>
                <Info label="Property Name" value={propName} />
                <Info label="Address" value={propAddr} />
                <Info label="Property Type" value={propType} />
                <Info label="Roof System" value={roofType} />
                <Info label="Roof Age" value={roofAge ? roofAge + " years" : "Not specified"} />
                <Info label="Square Footage" value={roofSqft ? Number(roofSqft).toLocaleString() + " sq ft" : "Not specified"} />
                <Info label="Membrane" value={roofMembrane} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <Btn secondary onClick={() => step === 0 ? setPath(null) : setStep(step - 1)}>{step === 0 ? "← Back to Menu" : "← Previous"}</Btn>
            {step < 2 ? (
              <Btn primary onClick={() => setStep(step + 1)} style={{ opacity: canNext ? 1 : 0.4, pointerEvents: canNext ? "auto" : "none" }}>Next →</Btn>
            ) : (
              <Btn primary onClick={() => setSetupDone(true)}>✅ Register Property</Btn>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- WARRANTY COMPARISON ----
  if (path === "compare") {
    const filtered = WARRANTY_DB.filter(w => !compFilter || w.name.toLowerCase().includes(compFilter.toLowerCase()) || (w.manufacturer || "").toLowerCase().includes(compFilter.toLowerCase()));
    const selected = WARRANTY_DB.filter(w => compIds.includes(w.id));
    const toggleComp = (id) => setCompIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);

    return (
      <div style={overlay} onClick={closeModal}>
        <div style={{...modal, maxWidth: 960}} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>{Ic.warranties} Warranty Comparison</h2>
            <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
          </div>

          {step === 0 ? (
            <div>
              <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 16 }}>Select up to 4 warranties to compare side by side.</p>
              <input value={compFilter} onChange={e => setCompFilter(e.target.value)} placeholder="Search warranties..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid " + C.g200, fontFamily: F.body, fontSize: 13, marginBottom: 16, boxSizing: "border-box" }} />
              <div style={{ maxHeight: 400, overflowY: "auto", display: "grid", gap: 8 }}>
                {filtered.map(w => (
                  <button key={w.id} onClick={() => toggleComp(w.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, border: "1.5px solid " + (compIds.includes(w.id) ? C.green : C.g200), background: compIds.includes(w.id) ? C.g50 : C.white, cursor: "pointer", textAlign: "left" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.name}</div>
                      <div style={{ fontSize: 11, color: C.g500, fontFamily: F.body }}>{w.manufacturer} · {w.term}yr · Rating: {w.rating}/10</div>
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: "2px solid " + (compIds.includes(w.id) ? C.green : C.g300), background: compIds.includes(w.id) ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 12, fontWeight: 700 }}>{compIds.includes(w.id) ? "✓" : ""}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <Btn secondary onClick={() => setPath(null)}>← Back</Btn>
                <Btn primary onClick={() => setStep(1)} style={{ opacity: compIds.length >= 2 ? 1 : 0.4, pointerEvents: compIds.length >= 2 ? "auto" : "none" }}>Compare {compIds.length} Warranties →</Btn>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.body, fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: C.g50 }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, borderBottom: "2px solid " + C.g200 }}>Feature</th>
                      {selected.map(w => <th key={w.id} style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: C.navy, borderBottom: "2px solid " + C.g200, minWidth: 140 }}>{w.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Manufacturer", fn: w => w.manufacturer },
                      { label: "Term", fn: w => w.term + " years" },
                      { label: "Rating", fn: w => w.rating + "/10" },
                      { label: "Labor Covered", fn: w => w.laborCovered ? "✅" : "❌" },
                      { label: "Material Covered", fn: w => w.materialCovered ? "✅" : "❌" },
                      { label: "Consequential", fn: w => w.consequential ? "✅" : "❌" },
                      { label: "Dollar Cap", fn: w => w.dollarCap || "N/A" },
                      { label: "Transferable", fn: w => w.transferable ? "✅" : "❌" },
                      { label: "Ponding Excluded", fn: w => w.pondingExcluded ? "⚠️ Yes" : "✅ No" },
                      { label: "Wind Limit", fn: w => w.windLimit || "Standard" },
                      { label: "Inspection Freq", fn: w => w.inspFreq || "N/A" },
                      { label: "Inspected By", fn: w => w.inspBy || "N/A" },
                      { label: "Membranes", fn: w => (w.membranes || []).join(", ") },
                      { label: "Best For", fn: w => w.bestFor || "N/A" },
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? C.white : C.g50 }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: C.navy, borderBottom: "1px solid " + C.g100 }}>{row.label}</td>
                        {selected.map(w => <td key={w.id} style={{ padding: "8px 12px", textAlign: "center", color: C.g700, borderBottom: "1px solid " + C.g100 }}>{row.fn(w)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
                <Btn secondary onClick={() => { setStep(0); setCompIds([]); }}>← Pick Different</Btn>
                <Btn secondary onClick={closeModal}>Done</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- WARRANTY RECOMMENDATION ----
  if (path === "recommend") {
    const membranes = [...new Set(WARRANTY_DB.flatMap(w => w.membranes || []))].sort();
    const getRecommendations = () => {
      let matches = WARRANTY_DB.filter(w => !recMembrane || (w.membranes || []).includes(recMembrane));
      if (recTerm) matches = matches.filter(w => w.term >= Number(recTerm) * 0.7);
      matches = matches.sort((a, b) => b.rating - a.rating).slice(0, 5);
      setRecResults(matches);
      setStep(1);
    };

    if (step === 0) return (
      <div style={overlay} onClick={closeModal}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>{Ic.inspections} Warranty Recommendation</h2>
            <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
          </div>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20 }}>Tell us about your roof and we will match the best warranty options from our database of {WARRANTY_DB.length}+ warranties.</p>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 6 }}>Primary Membrane Type</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {membranes.map(m => (
                  <button key={m} onClick={() => setRecMembrane(recMembrane === m ? "" : m)} style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid " + (recMembrane === m ? C.green : C.g200), background: recMembrane === m ? C.g50 : C.white, color: recMembrane === m ? C.navy : C.g600, fontFamily: F.body, fontSize: 12, fontWeight: recMembrane === m ? 700 : 400, cursor: "pointer" }}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 6 }}>Budget Range</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["low", "💰 Economy"], ["mid", "⭐ Mid-Range"], ["high", "💎 Premium"]].map(([v, lbl]) => (
                  <button key={v} onClick={() => setRecBudget(v)} style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1.5px solid " + (recBudget === v ? C.green : C.g200), background: recBudget === v ? C.g50 : C.white, color: recBudget === v ? C.navy : C.g600, fontFamily: F.body, fontSize: 12, fontWeight: recBudget === v ? 700 : 400, cursor: "pointer", textAlign: "center" }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.body, marginBottom: 6 }}>Minimum Term (years): {recTerm}</label>
              <input type="range" min={5} max={30} step={5} value={recTerm} onChange={e => setRecTerm(Number(e.target.value))} style={{ width: "100%", accentColor: C.green }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.g400, fontFamily: F.body }}><span>5yr</span><span>10yr</span><span>15yr</span><span>20yr</span><span>25yr</span><span>30yr</span></div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <Btn secondary onClick={() => setPath(null)}>← Back</Btn>
            <Btn primary onClick={getRecommendations}>Get Recommendations →</Btn>
          </div>
        </div>
      </div>
    );

    // Results view
    return (
      <div style={overlay} onClick={closeModal}>
        <div style={{...modal, maxWidth: 900}} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Top Warranty Matches</h2>
            <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
          </div>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20 }}>
            {recResults && recResults.length} warranties matched{recMembrane ? " for " + recMembrane + " membrane" : ""} with {recTerm}+ year term.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            {(recResults || []).map((w, i) => (
              <div key={w.id} style={{ border: "1.5px solid " + (i === 0 ? C.green : C.g200), borderRadius: 14, padding: 18, background: i === 0 ? C.g50 : C.white }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      {i === 0 && <span style={{ background: C.green, color: C.white, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: F.body }}>BEST MATCH</span>}
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{w.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.g500, fontFamily: F.body }}>{w.manufacturer} · {w.term}-year term</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Stars n={w.rating} />
                    <div style={{ fontSize: 11, color: C.g500, fontFamily: F.body }}>{w.rating}/10</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {w.laborCovered && <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.body }}>Labor ✓</span>}
                  {w.materialCovered && <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.body }}>Material ✓</span>}
                  {w.transferable && <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.body }}>Transferable</span>}
                  {w.consequential && <span style={{ background: "#fff3e0", color: "#e65100", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.body }}>Consequential</span>}
                  {!w.pondingExcluded && <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: F.body }}>Ponding OK</span>}
                </div>
                {w.bestFor && <div style={{ fontSize: 12, color: C.g600, fontFamily: F.body, fontStyle: "italic" }}>Best for: {w.bestFor}</div>}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <Btn secondary onClick={() => setStep(0)}>← Adjust Criteria</Btn>
            <Btn secondary onClick={closeModal}>Done</Btn>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function Accounts({ onSelectRoof, OWNERS }) {
  const [q, setQ] = useState("");
  const [exp, setExp] = useState({});
  const toggle = (id) => setExp(p => ({ ...p, [id]: !p[id] }));
  const owners = OWNERS || [];
  const fil = q ? owners.filter(o => o.name.toLowerCase().includes(q.toLowerCase()) || o.properties.some(p => p.name.toLowerCase().includes(q.toLowerCase()))) : owners;
  const compDot = (c) => {
    const col = c === "current" ? C.green : c === "at-risk" ? C.yellow : C.red;
    return <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block" }} />;
  };
  return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Account Management</h2>
      <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "4px 0 0" }}>Manage owners, property managers, and building portfolios</p></div>
      <Btn primary>{Ic.plus} Add Owner</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <KPI label="Owners" value={owners.length} icon={Ic.user} />
      <KPI label="Properties" value={owners.reduce((s,o)=>s+o.properties.length,0)} icon={Ic.building} color={C.navy} />
      <KPI label="Roof Sections" value={owners.reduce((s,o)=>s+o.properties.reduce((s2,p)=>s2+p.roofs.length,0),0)} icon={Ic.shield} />
    </div>
    <div style={{ position: "relative", marginBottom: 20 }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.g400 }}>{Ic.search}</span>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search owners, PMs, or properties..." style={{ width: "100%", padding: "12px 12px 12px 42px", borderRadius: 10, border: `1.5px solid ${C.g200}`, background: C.white, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none", boxSizing: "border-box" }} />
    </div>
    {fil.map(ow => <Card key={ow.id} style={{ marginBottom: 12 }}>
      <div onClick={() => toggle(ow.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.navy}10`, display: "flex", alignItems: "center", justifyContent: "center", color: C.navy }}>{Ic.building}</div>
          <div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{ow.name}</div>
          <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body }}>{ow.contact} · {ow.properties.length} properties</div></div>
        </div>
        <span style={{ color: C.g400 }}>{exp[ow.id] ? Ic.chevD : Ic.chevR}</span>
      </div>
      {exp[ow.id] && <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.g100}` }}>
        {ow.properties.map(p => <div key={p.id} style={{ marginBottom: 8, padding: "10px 14px", borderRadius: 10, background: C.g50 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{p.name}</div>
          <div style={{ fontSize: 11, color: C.g400, fontFamily: F.body }}>{p.address}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {p.roofs.map(r => <span key={r.id} onClick={() => onSelectRoof(r.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8, background: C.white, border: `1px solid ${C.g200}`, fontSize: 11, cursor: "pointer" }}>{compDot(r.warranty.compliance)} {r.section}</span>)}
          </div>
        </div>)}
      </div>}
    </Card>)}
  </div>;
}

function Warranties({ selectedRoof, setSelectedRoof, OWNERS, pricingStore, setPricingStore, pricingLoading }) {
  const roofs = allRoofs(OWNERS);
  if (selectedRoof) {
    const r = findRoof(OWNERS, selectedRoof);
    if (!r) return null;
    const w = r.warranty;
    const p = pctUsed(w.start, w.end);
    const days = daysTo(w.nextInsp);
    return <div>
      <button onClick={() => setSelectedRoof(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.green, fontSize: 13, fontWeight: 700, fontFamily: F.head, cursor: "pointer", marginBottom: 20, padding: 0 }}>{Ic.back} All Warranties</button>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 4px" }}>{r.section}</h2>
      <div style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20 }}>{r.propName} · {r.propAddr}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KPI label="Manufacturer" value={w.manufacturer} icon={Ic.shield} />
        <KPI label="Type" value={w.wType} icon={Ic.file} color={C.blue} />
        <KPI label="Warranty Used" value={`${p.toFixed(0)}%`} icon={Ic.clock} color={p > 75 ? C.yellow : C.green} sub={`Expires ${fmtDate(w.end)}`} />
        <KPI label="Next Inspection" value={days > 0 ? `${days} days` : "OVERDUE"} icon={Ic.cal} color={days > 60 ? C.green : days > 0 ? C.yellow : C.red} sub={fmtDate(w.nextInsp)} />
      </div>
      <Card style={{ marginBottom: 12, borderLeft: `4px solid ${C.green}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: F.head, marginBottom: 8 }}>Coverage</div>
        {w.coverage.map((c,i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 13, color: C.g600, fontFamily: F.body }}><span style={{ color: C.green }}>{Ic.check}</span>{c}</div>)}
      </Card>
      <Card style={{ marginBottom: 12, borderLeft: `4px solid ${C.red}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, fontFamily: F.head, marginBottom: 8 }}>Exclusions</div>
        {w.exclusions.map((e,i) => <div key={i} style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 6 }}>✕ {e}</div>)}
      </Card>
      <Card style={{ borderLeft: `4px solid ${C.yellow}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", fontFamily: F.head, marginBottom: 8 }}>Requirements</div>
        {w.requirements.map((r2,i) => <div key={i} style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 6 }}>{Ic.alert} {r2}</div>)}
      </Card>
            {/* ---- Pricing Intelligence Section ---- */}
            <Card style={{ marginBottom: 12, borderLeft: `4px solid ${C.green}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: F.head, marginBottom: 8 }}>Pricing Intelligence</div>
              {pricingLoading ? (
                <div style={{ fontSize: 13, color: C.g400 }}>Loading pricing data...</div>
              ) : (() => {
                const summary = getPricingSummary(pricingStore, w.id);
                return summary && summary.submissions > 0 ? (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.g400, fontFamily: F.body }}>BASE FEE</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.head }}>${(summary.baseFee || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.g400, fontFamily: F.body }}>PSF RATE</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.head }}>${(summary.psfFee || 0).toFixed(2)}/sqft</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: C.g400, fontFamily: F.body }}>SUBMISSIONS</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{summary.submissions}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: C.g400, fontFamily: F.body }}>No pricing data yet for this warranty.</div>
                );
              })()}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.g200}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: F.head, marginBottom: 8 }}>Submit Pricing</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input id="baseFeeInput" type="number" placeholder="Base Fee ($)" style={{ padding: "6px 10px", border: `1px solid ${C.g200}`, borderRadius: 6, fontSize: 13, fontFamily: F.body, width: 120 }} />
                  <input id="psfInput" type="number" placeholder="PSF ($)" style={{ padding: "6px 10px", border: `1px solid ${C.g200}`, borderRadius: 6, fontSize: 13, fontFamily: F.body, width: 100 }} />
                  <button onClick={() => {
                    const baseEl = document.getElementById("baseFeeInput");
                    const psfEl = document.getElementById("psfInput");
                    const baseFee = parseFloat(baseEl?.value) || 0;
                    const psFee = parseFloat(psfEl?.value) || 0;
                    if (baseFee > 0 || psFee > 0) {
                      doSubmitPricing(pricingStore, setPricingStore, w.id, baseFee, psFee);
                      if (baseEl) baseEl.value = "";
                      if (psfEl) psfEl.value = "";
                    }
                  }} style={{ padding: "6px 14px", background: C.green, color: C.white, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: F.head, cursor: "pointer" }}>
                    Submit
                  </button>
                </div>
              </div>
            </Card>
    </div>;
  }
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 4px" }}>Warranty Dashboard</h2>
    <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "0 0 20px" }}>Track coverage, compliance, and inspection schedules</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <KPI label="Total Roofs" value={roofs.length} icon={Ic.shield} />
      <KPI label="Active" value={roofs.filter(r=>r.warranty.status==="active").length} icon={Ic.check} />
      <KPI label="At Risk" value={roofs.filter(r=>r.warranty.compliance==="at-risk"||r.warranty.compliance==="expired-inspection").length} icon={Ic.alert} color={C.red} />
    </div>
    {roofs.map(r => { const w=r.warranty; const p=pctUsed(w.start,w.end); return <Card key={r.id} onClick={() => setSelectedRoof(r.id)} style={{ marginBottom: 12, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{r.section}</div>
        <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body, marginTop: 2 }}>{r.propName} · {r.ownerName}</div></div>
        <Badge status={w.compliance} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: C.g600, fontFamily: F.body }}>
        <span>{w.manufacturer} {w.wType}</span><span>{r.type} · {r.sqFt.toLocaleString()} sqft</span>
      </div>
      <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: C.g100, overflow: "hidden" }}>
        <div style={{ width: `${p}%`, height: "100%", borderRadius: 3, background: p > 75 ? C.yellow : C.green }} />
      </div>
    </Card>; })}
  </div>;
}

function AccessLog({ ACCESS_LOGS, OWNERS }) {
  return <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Roof Access Log</h2>
      <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "4px 0 0" }}>QR-based tracking of everyone who goes on the roof</p></div>
      <Btn primary>{Ic.qr} Generate QR Code</Btn>
    </div>
    {(ACCESS_LOGS || []).map(log => { const r=findRoof(OWNERS, log.roofId); const isU=log.person==="Unknown"; return <Card key={log.id} style={{ marginBottom: 10, borderLeft: isU ? `4px solid ${C.red}` : `4px solid ${C.g200}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div><span style={{ fontSize: 14, fontWeight: 700, color: isU ? C.red : C.navy, fontFamily: F.head }}>{log.person}</span>
        {isU && <Badge status="overdue" label="Unauthorized" />}
        <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body, marginTop: 2 }}>{log.company} · {log.purpose}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{fmtDate(log.date)}</div><div style={{ fontSize: 11, color: C.g400 }}>{log.duration}</div></div>
      </div>
      {r && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 8 }}>{r.section} · {r.propName}</div>}
      {log.notes && <div style={{ fontSize: 12, color: C.g600, marginTop: 6, padding: "8px 12px", background: C.g50, borderRadius: 8 }}>{log.notes}</div>}
    </Card>; })}
  </div>;
}

function InvoicesTab({ INVOICES, OWNERS }) {
  const invoices = INVOICES || [];
  const flagged = invoices.filter(i => i.flagged);
  const potentialRecovery = flagged.reduce((s, i) => s + i.amount, 0);
  return <div>
    <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 4px" }}>Invoice Tracker</h2>
    <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "0 0 20px" }}>Upload, tag, and flag invoices against warranty coverage</p>
    {potentialRecovery > 0 && <div style={{ background: C.yellowBg, border: `1.5px solid ${C.yellowBdr}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ color: C.yellow }}>{Ic.alert}</span>
      <div><div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", fontFamily: F.head }}>Potential Warranty Recovery: {fmtMoney(potentialRecovery)}</div>
      <div style={{ fontSize: 12, color: "#b45309" }}>{flagged.length} invoices flagged for review</div></div>
    </div>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <KPI label="Total Invoices" value={invoices.length} icon={Ic.file} />
      <KPI label="Flagged" value={flagged.length} icon={Ic.flag} color={C.yellow} />
      <KPI label="Potential Recovery" value={fmtMoney(potentialRecovery)} icon={Ic.dollar} color={C.green} />
    </div>
    {invoices.map(inv => { const r=findRoof(OWNERS, inv.roofId); return <Card key={inv.id} style={{ marginBottom: 10, borderLeft: inv.flagged ? `4px solid ${C.yellow}` : `4px solid ${C.g200}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{inv.vendor}</div>
        <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{inv.desc}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{inv.amount > 0 ? fmtMoney(inv.amount) : "—"}</div><Badge status={inv.status} /></div>
      </div>
      {r && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 8 }}>{r.section} · {r.propName}</div>}
      {inv.flagged && <div style={{ marginTop: 10, padding: "10px 14px", background: C.yellowBg, borderRadius: 8, border: `1px solid ${C.yellowBdr}`, display: "flex", gap: 8 }}>
        <span style={{ color: C.yellow }}>{Ic.flag}</span><span style={{ fontSize: 12, color: "#92400e" }}>{inv.flagReason}</span>
      </div>}
    </Card>; })}
  </div>;
}

function InspectionsTab({ INSPECTIONS, OWNERS }) {
  const inspections = INSPECTIONS || [];
  const upcoming = inspections.filter(i => i.status === "scheduled" || i.status === "overdue");
  const completed = inspections.filter(i => i.status === "completed");
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
      <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Inspection Manager</h2>
      <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "4px 0 0" }}>Schedule, track, and document warranty-required inspections</p></div>
      <Btn primary>{Ic.plus} Schedule Inspection</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <KPI label="Upcoming" value={upcoming.length} icon={Ic.cal} color={C.blue} />
      <KPI label="Overdue" value={inspections.filter(i=>i.status==="overdue").length} icon={Ic.alert} color={C.red} />
      <KPI label="Completed" value={completed.length} icon={Ic.check} />
    </div>
    {upcoming.map(insp => { const r=findRoof(OWNERS, insp.roofId); const days=daysTo(insp.date); return <Card key={insp.id} style={{ marginBottom: 10, borderLeft: insp.status==="overdue" ? `4px solid ${C.red}` : `4px solid ${C.blue}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{insp.type}</div>
        {r && <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{r.section} · {r.propName}</div>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: days<0?C.red:C.navy }}>{days<0 ? `${Math.abs(days)} days overdue` : `${days} days`}</div><Badge status={insp.status} /></div>
      </div>
      <div style={{ fontSize: 12, color: C.g600, marginTop: 8 }}>{insp.notes}</div>
    </Card>; })}
    {completed.map(insp => { const r=findRoof(OWNERS, insp.roofId); return <Card key={insp.id} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{insp.type}</div>
        {r && <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{r.section} · {r.propName}</div>}
        <div style={{ fontSize: 12, color: C.g600, marginTop: 4 }}>{insp.inspector} ({insp.company}) · {fmtDate(insp.date)}</div></div>
        <Badge status="completed" />
      </div>
      {insp.score && <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <span style={{ padding: "6px 14px", borderRadius: 8, background: insp.score>=90?C.greenLt:C.yellowBg, fontSize: 13, fontWeight: 700, color: insp.score>=90?C.greenDk:"#b45309" }}>Score: {insp.score}/100</span>
        {insp.photos>0 && <span style={{ padding: "6px 14px", borderRadius: 8, background: C.g100, fontSize: 12 }}>{insp.photos} photos</span>}
        {insp.moistureData && <span style={{ padding: "6px 14px", borderRadius: 8, background: C.greenLt, fontSize: 12, color: C.greenDk }}>MRI Data ✓</span>}
      </div>}
      <div style={{ fontSize: 12, color: C.g600, marginTop: 8 }}>{insp.notes}</div>
    </Card>; })}
  </div>;
}

function ClaimsTab({ CLAIMS, OWNERS }) {
  const claims = CLAIMS || [];
  const recovered = claims.filter(c=>c.status==="approved").reduce((s,c)=>s+c.amount,0);
  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
      <div><h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>Warranty Claims</h2>
      <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: "4px 0 0" }}>Initiate, track, and resolve manufacturer warranty claims</p></div>
      <Btn primary>{Ic.plus} File Claim</Btn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
      <KPI label="Total Claims" value={claims.length} icon={Ic.file} />
      <KPI label="In Progress" value={claims.filter(c=>c.status==="in-progress").length} icon={Ic.clock} color={C.blue} />
      <KPI label="Recovered" value={fmtMoney(recovered)} icon={Ic.dollar} color={C.green} />
    </div>
    {claims.map(claim => { const r=findRoof(OWNERS, claim.roofId); return <Card key={claim.id} style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{claim.manufacturer} Claim</div>
        <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{claim.desc}</div>
        {r && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 6 }}>{r.section} · {r.propName}</div>}</div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 18, fontWeight: 800, color: claim.status==="approved"?C.green:C.navy, fontFamily: F.head }}>{fmtMoney(claim.amount)}</div><Badge status={claim.status} /></div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: F.head, marginBottom: 8 }}>Timeline</div>
      <div style={{ paddingLeft: 20, borderLeft: `2px solid ${C.g200}` }}>
        {claim.timeline.map((e,i) => <div key={i} style={{ position: "relative", paddingBottom: i<claim.timeline.length-1?16:0 }}>
          <div style={{ position: "absolute", left: -25, top: 4, width: 12, height: 12, borderRadius: 6, background: i===claim.timeline.length-1?C.green:C.white, border: `2px solid ${i===claim.timeline.length-1?C.green:C.g200}` }} />
          <div style={{ fontSize: 11, color: C.g400, marginBottom: 2 }}>{fmtDate(e.date)}</div>
          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.5 }}>{e.event}</div>
        </div>)}
      </div>
    </Card>; })}
  </div>;
}

const TABS = [
  { id: "accounts", label: "Accounts", icon: Ic.building },
  { id: "warranties", label: "Warranties", icon: Ic.shield },
  { id: "access", label: "Access Log", icon: Ic.qr },
  { id: "invoices", label: "Invoices", icon: Ic.dollar },
  { id: "inspections", label: "Inspections", icon: Ic.cal },
  { id: "claims", label: "Claims", icon: Ic.file },
];

export default function App() {
  const [tab, setTab] = useState("accounts");
  const [selectedRoof, setSelectedRoof] = useState(null);
  const [analyzerOpen, setAnalyzerOpen] = useState(false);

  // ── API State ──
  const [owners, setOwners] = useState([]);
  const [warrantyDb, setWarrantyDb] = useState([]);
  const [pricingStore, setPricingStore] = useState({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [accessLogs, setAccessLogs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAccounts().catch(() => []),
      fetchWarrantyDb().catch(() => []),
      fetchPricingStore().catch(() => ({})),
      fetchAccessLogs().catch(() => []),
      fetchInvoices().catch(() => []),
      fetchInspections().catch(() => []),
      fetchClaims().catch(() => []),
    ]).then(([acc, wdb, pricing, logs, inv, insp, cl]) => {
      setOwners(acc);
      setWarrantyDb(wdb);
      setPricingStore(pricing);
      setAccessLogs(logs);
      setInvoices(inv);
      setInspections(insp);
      setClaims(cl);
      setLoading(false);
    });
  }, []);

  const onSelectRoof = (roofId) => { setSelectedRoof(roofId); setTab("warranties"); };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.g50, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.body }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span style={{ color: C.white, fontFamily: F.head, fontWeight: 800, fontSize: 18 }}>MRI</span>
        </div>
        <div style={{ fontSize: 14, color: C.g600, fontFamily: F.body }}>Loading Warranty Manager...</div>
      </div>
    </div>
  );

  return <div style={{ minHeight: "100vh", background: C.g50, fontFamily: F.body }}>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <WarrantyAnalyzer open={analyzerOpen} onClose={() => setAnalyzerOpen(false)} WARRANTY_DB={warrantyDb} />
    <div style={{ background: C.navy, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: C.white, fontFamily: F.head, fontWeight: 800, fontSize: 14 }}>MRI</span>
        </div>
        <div><div style={{ fontSize: 14, fontWeight: 800, color: C.white, fontFamily: F.head }}>Warranty Manager</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: F.body }}>Roof MRI Certified Platform</div></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{Ic.user} <span>Riverland Roofing</span></div>
    </div>
    <div style={{ background: C.white, borderBottom: `1.5px solid ${C.g100}`, display: "flex", overflowX: "auto", padding: "0 32px" }}>
      {TABS.map(t => <button key={t.id} onClick={() => { setTab(t.id); if(t.id!=="warranties") setSelectedRoof(null); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: tab===t.id?700:500, fontFamily: F.head, color: tab===t.id?C.green:C.g400, borderBottom: tab===t.id?`2.5px solid ${C.green}`:"2.5px solid transparent", whiteSpace: "nowrap" }}>{t.icon}{t.label}</button>)}
    </div>
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
      {tab === "accounts" && <Accounts onSelectRoof={onSelectRoof} OWNERS={owners} />}
      {tab === "warranties" && <Warranties selectedRoof={selectedRoof} setSelectedRoof={setSelectedRoof} OWNERS={owners} pricingStore={pricingStore} setPricingStore={setPricingStore} pricingLoading={pricingLoading} />}
      {tab === "access" && <AccessLog ACCESS_LOGS={accessLogs} OWNERS={owners} />}
      {tab === "invoices" && <InvoicesTab INVOICES={invoices} OWNERS={owners} />}
      {tab === "inspections" && <InspectionsTab INSPECTIONS={inspections} OWNERS={owners} />}
      {tab === "claims" && <ClaimsTab CLAIMS={claims} OWNERS={owners} />}
    </div>
    <button onClick={() => setAnalyzerOpen(true)} style={{ position: "fixed", bottom: 24, right: 24, display: "flex", alignItems: "center", gap: 8, padding: "14px 22px", borderRadius: 16, background: C.green, border: "none", color: C.white, fontSize: 13, fontWeight: 700, fontFamily: F.head, cursor: "pointer", boxShadow: `0 4px 20px ${C.green}50`, zIndex: 100 }}>{Ic.zap} Warranty Analyzer</button>
  </div>;
}
