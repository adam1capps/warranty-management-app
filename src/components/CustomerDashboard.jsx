import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchCustomerDashboard } from "../api";

const C = {
  green: "#00bd70", greenDk: "#00a35f", greenLt: "#e6f9f0",
  navy: "#1e2c55", navyLt: "#2a3d6e",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377",
  yellow: "#f59e0b", yellowBg: "#fef9e7", blue: "#3b82f6", blueBg: "#eff6ff",
  red: "#ef4444", redBg: "#fef2f2",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
};
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };
const fmtMoney = (a) => `$${(a || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const Badge = ({ status }) => {
  const styles = {
    active: { bg: C.greenLt, c: C.greenDk }, current: { bg: C.greenLt, c: C.greenDk },
    completed: { bg: C.greenLt, c: C.greenDk }, approved: { bg: C.greenLt, c: C.greenDk },
    "in-progress": { bg: C.blueBg, c: C.blue }, scheduled: { bg: C.blueBg, c: C.blue },
    review: { bg: C.yellowBg, c: "#b45309" }, denied: { bg: C.redBg, c: C.red },
  };
  const s = styles[status] || { bg: C.g100, c: C.g600 };
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: F.head, background: s.bg, color: s.c }}>{(status || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>;
};

export default function CustomerDashboard({ onNavigate }) {
  const { ownerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDashboard(ownerId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ownerId]);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.g400, fontFamily: F.body }}>Loading customer...</div>;
  if (!data) return <div style={{ textAlign: "center", padding: 60, color: C.g400, fontFamily: F.body }}>Customer not found.</div>;

  const { owner, properties, recentInspections, recentInvoices, claims } = data;
  const totalRoofs = properties.reduce((s, p) => s + p.roofs.length, 0);
  const activeWarranties = properties.reduce((s, p) => s + p.roofs.filter(r => r.warranty && r.warranty.status === "active").length, 0);

  return (
    <div>
      {/* Back + Header */}
      <button onClick={() => onNavigate("/dashboard")} style={{ background: "none", border: "none", color: C.blue, fontSize: 13, fontWeight: 600, fontFamily: F.head, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        ← Back to Dashboard
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 6px" }}>{owner.name}</h2>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: C.g600, fontFamily: F.body }}>
            {owner.email && <span>{owner.email}</span>}
            {owner.phone && <span>{owner.phone}</span>}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "16px 18px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 8 }}>Properties</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{properties.length}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "16px 18px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 8 }}>Roof Sections</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, fontFamily: F.head }}>{totalRoofs}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "16px 18px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 8 }}>Active Warranties</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green, fontFamily: F.head }}>{activeWarranties}</div>
        </div>
        <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "16px 18px", boxShadow: C.shadow }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", fontFamily: F.head, marginBottom: 8 }}>Active Claims</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: claims.filter(c => c.status === "in-progress").length > 0 ? C.yellow : C.navy, fontFamily: F.head }}>{claims.filter(c => c.status === "in-progress").length}</div>
        </div>
      </div>

      {/* Properties */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 12 }}>Properties</h3>
      {properties.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: C.g400, fontFamily: F.body, background: C.white, borderRadius: 14, border: `1.5px solid ${C.g100}` }}>No properties yet.</div>
      ) : properties.map(p => (
        <div key={p.id} onClick={() => onNavigate(`/properties/${p.id}`)} style={{
          background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: 20, marginBottom: 12,
          cursor: "pointer", boxShadow: C.shadow, transition: "all 0.15s",
        }} onMouseEnter={e => e.currentTarget.style.borderColor = C.green} onMouseLeave={e => e.currentTarget.style.borderColor = C.g100}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{p.name}</div>
              {p.address && <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body, marginTop: 2 }}>{p.address}</div>}
            </div>
            <span style={{ fontSize: 12, color: C.blue, fontWeight: 600, fontFamily: F.head }}>View →</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.roofs.map(r => (
              <div key={r.id} style={{ padding: "6px 12px", borderRadius: 8, background: C.g50, border: `1px solid ${C.g200}`, fontSize: 12, fontFamily: F.body }}>
                <span style={{ fontWeight: 700, color: C.navy }}>{r.section}</span>
                {r.warranty && r.warranty.status === "active" && <span style={{ marginLeft: 6, color: C.green, fontWeight: 700 }}>●</span>}
                {r.type && <span style={{ marginLeft: 6, color: C.g400 }}>{r.type}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
        {/* Recent Invoices */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 10 }}>Recent Invoices</h3>
          {recentInvoices.length === 0 ? <div style={{ fontSize: 13, color: C.g400, fontFamily: F.body }}>No invoices yet.</div> : recentInvoices.slice(0, 5).map(inv => (
            <div key={inv.id} style={{ padding: "10px 14px", borderRadius: 10, background: C.white, border: `1px solid ${C.g100}`, marginBottom: 6, fontSize: 13, fontFamily: F.body }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: C.navy }}>{inv.vendor}</span>
                <span style={{ fontWeight: 700, color: C.navy }}>{fmtMoney(inv.amount)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: C.g400, fontSize: 12 }}>{fmtDate(inv.date)}</span>
                <Badge status={inv.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Inspections */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 10 }}>Recent Inspections</h3>
          {recentInspections.length === 0 ? <div style={{ fontSize: 13, color: C.g400, fontFamily: F.body }}>No inspections yet.</div> : recentInspections.slice(0, 5).map(insp => (
            <div key={insp.id} style={{ padding: "10px 14px", borderRadius: 10, background: C.white, border: `1px solid ${C.g100}`, marginBottom: 6, fontSize: 13, fontFamily: F.body }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: C.navy }}>{insp.inspector || insp.company || "Inspection"}</span>
                <Badge status={insp.status} />
              </div>
              <span style={{ color: C.g400, fontSize: 12 }}>{fmtDate(insp.date)}{insp.score ? ` · Score: ${insp.score}` : ""}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Claims */}
      {claims.length > 0 && <>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginTop: 24, marginBottom: 10 }}>Claims</h3>
        {claims.map(cl => (
          <div key={cl.id} style={{ padding: "12px 16px", borderRadius: 10, background: C.white, border: `1px solid ${C.g100}`, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{cl.manufacturer}</span>
              <span style={{ fontSize: 12, color: C.g400, fontFamily: F.body, marginLeft: 10 }}>{fmtDate(cl.filed)}</span>
              {cl.desc && <div style={{ fontSize: 12, color: C.g600, fontFamily: F.body, marginTop: 2 }}>{cl.desc}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{fmtMoney(cl.amount)}</div>
              <Badge status={cl.status} />
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}
