import { useState, useEffect } from "react";
import { fetchContractorDashboard } from "../api";

const C = {
  green: "#00bd70", greenDk: "#00a35f", greenLt: "#e6f9f0",
  navy: "#1e2c55", navyLt: "#2a3d6e",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377",
  yellow: "#f59e0b", blue: "#3b82f6", blueBg: "#eff6ff", red: "#ef4444",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
};
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };
const fmtMoney = (a) => `$${(a || 0).toLocaleString()}`;

const KPI = ({ label, value, sub, color }) => (
  <div style={{ background: C.white, border: `1.5px solid ${C.g100}`, borderRadius: 14, padding: "18px 20px", boxShadow: C.shadow }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.head, marginBottom: 10 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: color || C.navy, fontFamily: F.head }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.g400, marginTop: 4, fontFamily: F.body }}>{sub}</div>}
  </div>
);

export default function ContractorDashboard({ onNavigate, onAddClient }) {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractorDashboard()
      .then(setData)
      .catch(() => setData({ kpis: {}, customers: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.g400, fontFamily: F.body }}>Loading dashboard...</div>;
  if (!data) return null;

  const { kpis, customers } = data;
  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: "0 0 4px" }}>Contractor Dashboard</h2>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, margin: 0 }}>Overview of all customers, properties, and warranty status</p>
        </div>
        <button onClick={onAddClient} style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10,
          background: C.green, border: "none", color: C.white, fontSize: 13, fontWeight: 700, fontFamily: F.head, cursor: "pointer",
        }}>+ New Client</button>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <KPI label="Customers" value={kpis.totalCustomers || 0} />
        <KPI label="Properties" value={kpis.totalProperties || 0} />
        <KPI label="Roof Sections" value={kpis.totalRoofs || 0} />
        <KPI label="Active Warranties" value={kpis.activeWarranties || 0} color={C.green} />
        <KPI label="Active Claims" value={kpis.activeClaims || 0} color={kpis.activeClaims > 0 ? C.yellow : C.navy} />
        <KPI label="Total Recovered" value={fmtMoney(kpis.totalRecovered)} color={C.green} />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          style={{ width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.g200}`, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Customer Table */}
      <div style={{ background: C.white, borderRadius: 14, border: `1.5px solid ${C.g100}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 20px", background: C.g50, borderBottom: `1px solid ${C.g100}`, fontSize: 11, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F.head }}>
          <span>Customer</span>
          <span>Properties</span>
          <span>Roofs</span>
          <span>Warranties</span>
          <span>Active Claims</span>
          <span>Recovered</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.g400, fontFamily: F.body, fontSize: 14 }}>
            {customers.length === 0 ? "No customers yet. Click \"+ New Client\" to get started." : "No customers match your search."}
          </div>
        ) : filtered.map(c => (
          <div key={c.id} onClick={() => onNavigate(`/customers/${c.id}`)} style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "14px 20px",
            borderBottom: `1px solid ${C.g100}`, cursor: "pointer", transition: "background 0.1s",
          }} onMouseEnter={e => e.currentTarget.style.background = C.g50} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head }}>{c.name}</div>
              {c.email && <div style={{ fontSize: 12, color: C.g400, fontFamily: F.body }}>{c.email}</div>}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, fontFamily: F.body, display: "flex", alignItems: "center" }}>{c.propertyCount}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.navy, fontFamily: F.body, display: "flex", alignItems: "center" }}>{c.roofCount}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.activeWarranties > 0 ? C.green : C.g400, fontFamily: F.body, display: "flex", alignItems: "center" }}>{c.activeWarranties}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: c.activeClaims > 0 ? C.yellow : C.g400, fontFamily: F.body, display: "flex", alignItems: "center" }}>{c.activeClaims}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.totalClaimed > 0 ? C.green : C.g400, fontFamily: F.body, display: "flex", alignItems: "center" }}>{fmtMoney(c.totalClaimed)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
