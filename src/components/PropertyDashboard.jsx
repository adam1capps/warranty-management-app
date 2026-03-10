import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchPropertyDashboard, createClaimFromInvoice } from "../api";
import PhotoUpload from "./PhotoUpload";

const C = {
  green: "#00bd70", greenDk: "#00a35f", greenLt: "#e6f9f0",
  navy: "#1e2c55", navyLt: "#2a3d6e",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377",
  yellow: "#f59e0b", yellowBg: "#fef9e7", yellowBdr: "#fbbf24",
  blue: "#3b82f6", blueBg: "#eff6ff",
  red: "#ef4444", redBg: "#fef2f2",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
};
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };
const fmtMoney = (a) => `$${(a || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const Badge = ({ status }) => {
  const styles = {
    active: { bg: C.greenLt, c: C.greenDk }, current: { bg: C.greenLt, c: C.greenDk },
    completed: { bg: C.greenLt, c: C.greenDk }, approved: { bg: C.greenLt, c: C.greenDk }, paid: { bg: C.greenLt, c: C.greenDk },
    "in-progress": { bg: C.blueBg, c: C.blue }, scheduled: { bg: C.blueBg, c: C.blue },
    review: { bg: C.yellowBg, c: "#b45309" }, denied: { bg: C.redBg, c: C.red },
  };
  const s = styles[status] || { bg: C.g100, c: C.g600 };
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: F.head, background: s.bg, color: s.c }}>{(status || "unknown").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>;
};

const SectionTabs = ({ active, onChange, tabs }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.g50, borderRadius: 10, padding: 3 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
        background: active === t.id ? C.white : "transparent",
        color: active === t.id ? C.navy : C.g400,
        fontSize: 12, fontWeight: 700, fontFamily: F.head, cursor: "pointer",
        boxShadow: active === t.id ? C.shadow : "none",
      }}>{t.label} ({t.count})</button>
    ))}
  </div>
);

export default function PropertyDashboard({ onNavigate }) {
  const { propertyId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("warranties");
  const [expandedRoof, setExpandedRoof] = useState(null);

  const loadData = () => {
    fetchPropertyDashboard(propertyId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [propertyId]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.g400, fontFamily: F.body }}>Loading property...</div>;
  if (!data) return <div style={{ textAlign: "center", padding: 60, color: C.g400, fontFamily: F.body }}>Property not found.</div>;

  const { property, roofs, invoices, inspections, claims } = data;
  const activeWarranties = roofs.filter(r => r.warranty && r.warranty.status === "active").length;

  const handleFileClaimFromInvoice = async (invoiceId) => {
    try {
      await createClaimFromInvoice(invoiceId, {});
      loadData();
      alert("Claim filed successfully!");
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const tabs = [
    { id: "warranties", label: "Warranties", count: roofs.length },
    { id: "invoices", label: "Invoices", count: invoices.length },
    { id: "inspections", label: "Inspections", count: inspections.length },
    { id: "claims", label: "Claims", count: claims.length },
  ];

  return (
    <div>
      <button onClick={() => window.history.back()} style={{ background: "none", border: "none", color: C.blue, fontSize: 13, fontWeight: 600, fontFamily: F.head, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        ← Back
      </button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 4px" }}>{property.name}</h2>
        <div style={{ fontSize: 13, color: C.g600, fontFamily: F.body }}>{property.address || ""} · Owner: {property.ownerName}</div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 6 }}>Sections</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{roofs.length}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 6 }}>Active Warranties</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.green, fontFamily: F.head }}>{activeWarranties}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 6 }}>Total Invoiced</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{fmtMoney(invoices.reduce((s, i) => s + i.amount, 0))}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "14px 16px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 6 }}>Claimed</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: claims.filter(c => c.status === "approved").length > 0 ? C.green : C.navy, fontFamily: F.head }}>{fmtMoney(claims.filter(c => c.status === "approved").reduce((s, c) => s + c.amount, 0))}</div>
        </div>
      </div>

      {/* Content Tabs */}
      <SectionTabs active={activeTab} onChange={setActiveTab} tabs={tabs} />

      {/* Warranties / Roof Sections */}
      {activeTab === "warranties" && roofs.map(r => {
        const w = r.warranty || {};
        const expanded = expandedRoof === r.id;
        return (
          <div key={r.id} style={{ background: C.white, border: `1.5px solid ${expanded ? C.green : C.g100}`, borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: C.shadow }}>
            <div onClick={() => setExpandedRoof(expanded ? null : r.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{r.section}</div>
                <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body, marginTop: 2 }}>
                  {r.type || "—"} · {r.sqFt ? `${r.sqFt.toLocaleString()} sqft` : "—"} · Installed: {r.yearInstalled || (r.installed ? new Date(r.installed).getFullYear() : "—")}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {w.status && <Badge status={w.status} />}
                <span style={{ fontSize: 18, color: C.g400, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </div>
            </div>
            {expanded && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.g100}` }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Manufacturer</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.manufacturer || "—"}</div></div>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Type</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.wType || "—"}</div></div>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Term</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.start && w.end ? `${fmtDate(w.start)} — ${fmtDate(w.end)}` : "—"}</div></div>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Compliance</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.compliance || "—"}</div></div>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Next Inspection</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{fmtDate(w.nextInsp)}</div></div>
                  <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Maintenance Plan</div><div style={{ fontSize: 13, fontWeight: 600, color: w.maintenancePlan ? C.green : C.g400, fontFamily: F.body }}>{w.maintenancePlan ? "Yes" : "No"}</div></div>
                </div>
                {(w.repairSpendLastYear || w.coveredAmount) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, padding: 12, background: C.g50, borderRadius: 10 }}>
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Repair Spend Last Year</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.repairSpendLastYear ? fmtMoney(w.repairSpendLastYear) : "—"}</div></div>
                    <div><div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 3 }}>Covered Amount</div><div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{w.coveredAmount ? fmtMoney(w.coveredAmount) : "—"}</div></div>
                  </div>
                )}
                {/* Photos for this roof section */}
                <PhotoUpload entityType="roof" entityId={r.id} />
              </div>
            )}
          </div>
        );
      })}

      {/* Invoices */}
      {activeTab === "invoices" && (
        invoices.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.g400, fontFamily: F.body, background: C.white, borderRadius: 14, border: `1.5px solid ${C.g100}` }}>No invoices for this property.</div> :
        invoices.map(inv => {
          const roof = roofs.find(r => r.id === inv.roofId);
          const hasWarranty = roof && roof.warranty && roof.warranty.manufacturer;
          return (
            <div key={inv.id} style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: 16, marginBottom: 10, borderLeft: inv.flagged ? `4px solid ${C.yellow}` : `4px solid ${C.g200}`, boxShadow: C.shadow }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{inv.vendor}</div>
                  <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{inv.description} · {fmtDate(inv.date)}</div>
                  {roof && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 4 }}>{roof.section}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{fmtMoney(inv.amount)}</div>
                  <Badge status={inv.status} />
                </div>
              </div>
              {inv.flagged && inv.flagReason && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: C.yellowBg, borderRadius: 8, border: `1px solid ${C.yellowBdr}`, fontSize: 12, color: "#92400e" }}>{inv.flagReason}</div>
              )}
              {hasWarranty && (
                <button onClick={() => handleFileClaimFromInvoice(inv.id)} style={{
                  marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px",
                  borderRadius: 8, background: C.blueBg, border: `1px solid ${C.blue}30`, color: C.blue,
                  fontSize: 12, fontWeight: 700, fontFamily: F.head, cursor: "pointer",
                }}>File Claim from Invoice</button>
              )}
            </div>
          );
        })
      )}

      {/* Inspections */}
      {activeTab === "inspections" && (
        inspections.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.g400, fontFamily: F.body, background: C.white, borderRadius: 14, border: `1.5px solid ${C.g100}` }}>No inspections for this property.</div> :
        inspections.map(insp => (
          <div key={insp.id} style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{insp.inspector || insp.company || "Inspection"}</div>
                <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{insp.type || "General"} · {fmtDate(insp.date)}{insp.score ? ` · Score: ${insp.score}` : ""}</div>
              </div>
              <Badge status={insp.status} />
            </div>
            {insp.notes && <div style={{ fontSize: 12, color: C.g600, marginTop: 8 }}>{insp.notes}</div>}
            <div style={{ marginTop: 12 }}>
              <PhotoUpload entityType="inspection" entityId={insp.id} />
            </div>
          </div>
        ))
      )}

      {/* Claims */}
      {activeTab === "claims" && (
        claims.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: C.g400, fontFamily: F.body, background: C.white, borderRadius: 14, border: `1.5px solid ${C.g100}` }}>No claims for this property.</div> :
        claims.map(cl => (
          <div key={cl.id} style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: 16, marginBottom: 10, boxShadow: C.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{cl.manufacturer}</div>
                <div style={{ fontSize: 12, color: C.g400, marginTop: 2 }}>{cl.desc} · Filed: {fmtDate(cl.filed)}</div>
                {cl.invoiceId && <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginTop: 4 }}>Linked to Invoice</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{fmtMoney(cl.amount)}</div>
                <Badge status={cl.status} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <PhotoUpload entityType="claim" entityId={cl.id} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
