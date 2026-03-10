import { useState, useMemo } from "react";
import { createOwner } from "../api";

/* ── Shared design tokens (must match App.jsx) ── */
const C = {
  green: "#00bd70", greenDk: "#00a35f", greenLt: "#e6f9f0", greenBg: "#f0fdf4",
  navy: "#1e2c55", navyLt: "#2a3d6e", navyDk: "#151f3d",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377", g800: "#2d3344",
  yellow: "#f59e0b", yellowBg: "#fef9e7",
  red: "#ef4444", redBg: "#fef2f2",
  blue: "#3b82f6", blueBg: "#eff6ff",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
  shadowLg: "0 4px 16px rgba(30,44,85,0.10)",
};
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };

const ROOF_TYPES = ["TPO", "PVC", "EPDM", "Modified Bitumen", "BUR", "Metal", "Acrylic Coating", "Silicone Coating", "SPF"];

const Field = ({ label, value, onChange, placeholder, type = "text", required, options, disabled }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.g600, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F.head, marginBottom: 6 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.g200}`, background: disabled ? C.g50 : C.white, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none" }}>
        <option value="">{placeholder || "Select..."}</option>
        {options.map(o => typeof o === "object" ? <option key={o.value} value={o.value}>{o.label}</option> : <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.g200}`, background: disabled ? C.g50 : C.white, fontSize: 14, fontFamily: F.body, color: C.navy, outline: "none", boxSizing: "border-box" }} />
    )}
  </div>
);

const ToggleBtn = ({ selected, onClick, children }) => (
  <button onClick={onClick} style={{
    flex: 1, padding: "16px 20px", borderRadius: 12,
    border: `2px solid ${selected ? C.green : C.g200}`,
    background: selected ? C.greenLt : C.white,
    color: selected ? C.greenDk : C.g600,
    fontSize: 14, fontWeight: 700, fontFamily: F.head,
    cursor: "pointer", transition: "all 0.15s ease",
    textAlign: "center",
  }}>{children}</button>
);

const StepIndicator = ({ step, total }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, flex: i < total - 1 ? 1 : 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, fontFamily: F.head,
          background: i < step ? C.green : i === step ? C.navy : C.g100,
          color: i <= step ? C.white : C.g400,
        }}>{i < step ? "✓" : i + 1}</div>
        {i < total - 1 && <div style={{ flex: 1, height: 2, background: i < step ? C.green : C.g200, borderRadius: 1 }} />}
      </div>
    ))}
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.head, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body }}>{value || "—"}</div>
  </div>
);

export default function AddClientWizard({ open, onClose, onSaved, warrantyDb }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Client Info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  // Step 2 — Warranty status
  const [hasWarranty, setHasWarranty] = useState(null);

  // Step 3 — Sections
  const [entireRoof, setEntireRoof] = useState(null);
  const [sectionCount, setSectionCount] = useState(1);
  const [sections, setSections] = useState([{ name: "Full Roof", type: "", sqFt: "" }]);

  // Step 4 — Warranty details per section
  const [sectionWarranties, setSectionWarranties] = useState([]);

  // Derived: distinct manufacturers from warranty_db
  const manufacturers = useMemo(() => {
    const set = new Set((warrantyDb || []).map(w => w.manufacturer).filter(Boolean));
    return [...set].sort();
  }, [warrantyDb]);

  if (!open) return null;

  const reset = () => {
    setStep(0); setClientName(""); setClientEmail(""); setClientPhone(""); setPropertyAddress("");
    setHasWarranty(null); setEntireRoof(null); setSectionCount(1);
    setSections([{ name: "Full Roof", type: "", sqFt: "" }]); setSectionWarranties([]);
  };

  const totalSteps = hasWarranty === false ? 3 : 5;

  const updateSection = (idx, key, val) => {
    const copy = [...sections];
    copy[idx] = { ...copy[idx], [key]: val };
    setSections(copy);
  };

  const updateWarranty = (idx, key, val) => {
    const copy = [...sectionWarranties];
    copy[idx] = { ...copy[idx], [key]: val };

    // Autofill when warrantyDbId changes
    if (key === "warrantyDbId" && val) {
      const match = (warrantyDb || []).find(w => w.id === val);
      if (match) {
        copy[idx].manufacturer = match.manufacturer;
        copy[idx].warrantyLength = match.term || "";
        copy[idx].maintenanceRequired = match.maintenanceRequired || "";
        copy[idx].referenceUrl = match.referenceUrl || "";
        copy[idx].inspFreq = match.inspFreq || "";
        copy[idx].inspBy = match.inspBy || "";
        copy[idx].wType = match.name || "";
      }
    }
    // When manufacturer changes, reset warranty selection
    if (key === "manufacturer") {
      copy[idx].warrantyDbId = "";
      copy[idx].warrantyLength = "";
      copy[idx].maintenanceRequired = "";
      copy[idx].referenceUrl = "";
      copy[idx].inspFreq = "";
      copy[idx].inspBy = "";
      copy[idx].wType = "";
    }
    setSectionWarranties(copy);
  };

  const getWarrantiesForManufacturer = (mfr) =>
    (warrantyDb || []).filter(w => w.manufacturer === mfr);

  // Handle next step
  const goNext = () => {
    if (step === 0) {
      if (!clientName || !clientEmail || !clientPhone || !propertyAddress) return;
      setStep(1);
    } else if (step === 1) {
      if (hasWarranty === null) return;
      if (hasWarranty === false) {
        setStep(4); // Jump to review for no-warranty path
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      if (entireRoof === null) return;
      // Build sections array
      let newSections;
      if (entireRoof) {
        newSections = [{ name: "Full Roof", type: "", sqFt: "" }];
      } else {
        const count = Math.max(1, sectionCount);
        newSections = Array.from({ length: count }, (_, i) => (
          sections[i] || { name: `Section ${String.fromCharCode(65 + i)}`, type: "", sqFt: "" }
        ));
      }
      setSections(newSections);
      // Initialize warranty data for each section
      setSectionWarranties(newSections.map((_, i) => sectionWarranties[i] || {
        manufacturer: "", warrantyDbId: "", yearInstalled: "", warrantyLength: "",
        maintenancePlan: false, repairSpend: "", coveredAmount: "",
        maintenanceRequired: "", referenceUrl: "", inspFreq: "", inspBy: "", wType: "",
      }));
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const goBack = () => {
    if (step === 4 && hasWarranty === false) { setStep(1); return; }
    if (step === 4) { setStep(3); return; }
    setStep(Math.max(0, step - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      };

      // Always create a property
      const prop = { name: propertyAddress, address: propertyAddress };

      if (hasWarranty && sections.length > 0) {
        prop.roofs = sections.map((sec, i) => {
          const w = sectionWarranties[i] || {};
          const yearInstalled = w.yearInstalled ? parseInt(w.yearInstalled) : null;
          const warrantyLength = w.warrantyLength ? parseInt(w.warrantyLength) : null;
          const startDate = yearInstalled ? `${yearInstalled}-01-01` : null;
          const endDate = yearInstalled && warrantyLength ? `${yearInstalled + warrantyLength}-01-01` : null;

          return {
            section: sec.name,
            type: sec.type || null,
            sqFt: sec.sqFt ? parseInt(sec.sqFt) : null,
            yearInstalled,
            warranty: {
              manufacturer: w.manufacturer || null,
              wType: w.wType || null,
              warrantyDbId: w.warrantyDbId || null,
              start: startDate,
              end: endDate,
              maintenancePlan: w.maintenancePlan || false,
              repairSpendLastYear: w.repairSpend ? parseFloat(w.repairSpend) : null,
              coveredAmount: w.coveredAmount ? parseFloat(w.coveredAmount) : null,
            },
          };
        });
      }

      data.properties = [prop];
      await createOwner(data);
      reset();
      onSaved();
      onClose();
    } catch (err) {
      alert("Error creating account: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return clientName && clientEmail && clientPhone && propertyAddress;
    if (step === 1) return hasWarranty !== null;
    if (step === 2) return entireRoof !== null && (entireRoof || sectionCount >= 1);
    return true;
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(30,44,85,0.45)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.white, borderRadius: 20, padding: 32, maxWidth: 680, width: "95vw",
        maxHeight: "90vh", overflowY: "auto", position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.navy, fontFamily: F.head, margin: 0 }}>
            {step === 0 ? "New Client" : step === 1 ? "Warranty Status" : step === 2 ? "Roof Sections" : step === 3 ? "Warranty Details" : "Review & Create"}
          </h2>
          <button onClick={() => { reset(); onClose(); }} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.g400 }}>×</button>
        </div>

        <StepIndicator step={step < 4 ? step : totalSteps - 1} total={totalSteps} />

        {/* ── Step 1: Client Info ── */}
        {step === 0 && <>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20, marginTop: 0 }}>
            Enter your client's basic information to get started.
          </p>
          <Field label="Client / Company Name" value={clientName} onChange={setClientName} placeholder="e.g. Riverside Properties LLC" required />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Email" value={clientEmail} onChange={setClientEmail} placeholder="john@example.com" type="email" required />
            <Field label="Phone" value={clientPhone} onChange={setClientPhone} placeholder="(555) 123-4567" required />
          </div>
          <Field label="Property Address" value={propertyAddress} onChange={setPropertyAddress} placeholder="e.g. 123 Main St, Suite 200, Dallas TX 75201" required />
        </>}

        {/* ── Step 2: Warranty Status ── */}
        {step === 1 && <>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20, marginTop: 0 }}>
            Is this property's roof currently under warranty?
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <ToggleBtn selected={hasWarranty === true} onClick={() => setHasWarranty(true)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div>Yes, Under Warranty</div>
            </ToggleBtn>
            <ToggleBtn selected={hasWarranty === false} onClick={() => setHasWarranty(false)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✗</div>
              <div>No Warranty</div>
            </ToggleBtn>
          </div>
          {hasWarranty === false && (
            <div style={{ padding: 16, borderRadius: 12, background: C.yellowBg, border: `1px solid ${C.yellow}`, fontSize: 13, color: "#92400e", fontFamily: F.body }}>
              No problem — we'll create the account with the property on file. You can add warranty details later.
            </div>
          )}
        </>}

        {/* ── Step 3: Roof Sections ── */}
        {step === 2 && <>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20, marginTop: 0 }}>
            Is the entire roof under one warranty, or does it have multiple sections?
          </p>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <ToggleBtn selected={entireRoof === true} onClick={() => { setEntireRoof(true); setSectionCount(1); }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>▣</div>
              <div>Entire Roof</div>
              <div style={{ fontSize: 11, color: C.g400, marginTop: 4 }}>One warranty covers everything</div>
            </ToggleBtn>
            <ToggleBtn selected={entireRoof === false} onClick={() => setEntireRoof(false)}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⊞</div>
              <div>Multiple Sections</div>
              <div style={{ fontSize: 11, color: C.g400, marginTop: 4 }}>Different areas, different warranties</div>
            </ToggleBtn>
          </div>

          {entireRoof === false && (
            <div style={{ marginBottom: 16 }}>
              <Field label="How many sections?" value={sectionCount} onChange={v => {
                const count = Math.max(1, Math.min(20, parseInt(v) || 1));
                setSectionCount(count);
                setSections(prev => {
                  const arr = Array.from({ length: count }, (_, i) => prev[i] || { name: `Section ${String.fromCharCode(65 + i)}`, type: "", sqFt: "" });
                  return arr;
                });
              }} type="number" placeholder="e.g. 3" />
            </div>
          )}

          {/* Section names */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 12 }}>Name your sections</div>
            {(entireRoof ? [sections[0] || { name: "Full Roof", type: "", sqFt: "" }] : sections).map((sec, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, border: `1.5px solid ${C.g100}`, marginBottom: 8, background: C.g50 }}>
                <Field label={`Section ${i + 1} Name`} value={sec.name} onChange={v => updateSection(i, "name", v)} placeholder={`e.g. Main Building - Section ${String.fromCharCode(65 + i)}`} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Roof Type" value={sec.type} onChange={v => updateSection(i, "type", v)} options={ROOF_TYPES} placeholder="Select type..." />
                  <Field label="Square Footage" value={sec.sqFt} onChange={v => updateSection(i, "sqFt", v)} type="number" placeholder="e.g. 25000" />
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ── Step 4: Warranty Details Per Section ── */}
        {step === 3 && <>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20, marginTop: 0 }}>
            Enter warranty details for each roof section. We'll autofill what we can.
          </p>
          {sections.map((sec, i) => {
            const w = sectionWarranties[i] || {};
            const mfrWarranties = getWarrantiesForManufacturer(w.manufacturer);
            return (
              <div key={i} style={{ padding: 20, borderRadius: 14, border: `1.5px solid ${C.g200}`, marginBottom: 16, background: C.g50 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 16 }}>
                  {sec.name} {sec.type ? `(${sec.type})` : ""}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Manufacturer" value={w.manufacturer || ""} onChange={v => updateWarranty(i, "manufacturer", v)}
                    options={manufacturers} placeholder="Select manufacturer..." required />
                  <Field label="Warranty Product" value={w.warrantyDbId || ""} onChange={v => updateWarranty(i, "warrantyDbId", v)}
                    options={mfrWarranties.map(mw => ({ value: mw.id, label: `${mw.name} (${mw.term}yr)` }))}
                    placeholder={w.manufacturer ? "Select warranty..." : "Select manufacturer first"} disabled={!w.manufacturer} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Year Installed" value={w.yearInstalled || ""} onChange={v => updateWarranty(i, "yearInstalled", v)} type="number" placeholder="e.g. 2020" />
                  <Field label="Warranty Length (years)" value={w.warrantyLength || ""} onChange={v => updateWarranty(i, "warrantyLength", v)} type="number" placeholder="e.g. 15" />
                </div>

                {/* Autofilled info from warranty_db */}
                {w.warrantyDbId && (
                  <div style={{ padding: 16, borderRadius: 10, background: C.blueBg, border: `1px solid ${C.blue}30`, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.head, marginBottom: 10 }}>
                      Auto-filled from Warranty Database
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <ReadOnlyField label="Maintenance Required" value={w.maintenanceRequired} />
                      <ReadOnlyField label="Inspection Frequency" value={w.inspFreq} />
                      <ReadOnlyField label="Inspected By" value={w.inspBy} />
                      {w.referenceUrl && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: F.head, marginBottom: 4 }}>Warranty Reference</div>
                          <a href={w.referenceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.blue, fontFamily: F.body, wordBreak: "break-all" }}>
                            View Full Warranty Details →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: F.body, cursor: "pointer" }}>
                    <input type="checkbox" checked={w.maintenancePlan || false} onChange={e => updateWarranty(i, "maintenancePlan", e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: C.green }} />
                    Currently have a maintenance plan?
                  </label>
                </div>

                <div style={{ borderTop: `1px solid ${C.g200}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.g400, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: F.head, marginBottom: 12 }}>Optional Financial Info</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Spent on Repairs Last Year ($)" value={w.repairSpend || ""} onChange={v => updateWarranty(i, "repairSpend", v)} type="number" placeholder="e.g. 5000" />
                    <Field label="Amount Covered ($)" value={w.coveredAmount || ""} onChange={v => updateWarranty(i, "coveredAmount", v)} type="number" placeholder="e.g. 3500" />
                  </div>
                </div>
              </div>
            );
          })}
        </>}

        {/* ── Step 5: Review ── */}
        {step === 4 && <>
          <p style={{ fontSize: 13, color: C.g600, fontFamily: F.body, marginBottom: 20, marginTop: 0 }}>
            Review the information below and create the account.
          </p>

          <div style={{ padding: 20, borderRadius: 14, background: C.g50, border: `1.5px solid ${C.g100}`, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 12 }}>Client Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <ReadOnlyField label="Name" value={clientName} />
              <ReadOnlyField label="Email" value={clientEmail} />
              <ReadOnlyField label="Phone" value={clientPhone} />
              <ReadOnlyField label="Address" value={propertyAddress} />
            </div>
          </div>

          {hasWarranty === false ? (
            <div style={{ padding: 16, borderRadius: 12, background: C.yellowBg, border: `1px solid ${C.yellow}`, fontSize: 13, color: "#92400e", fontFamily: F.body }}>
              No warranty — creating base account with property on file. You can add warranty details anytime.
            </div>
          ) : (
            sections.map((sec, i) => {
              const w = sectionWarranties[i] || {};
              return (
                <div key={i} style={{ padding: 20, borderRadius: 14, background: C.g50, border: `1.5px solid ${C.g100}`, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontFamily: F.head, marginBottom: 12 }}>
                    {sec.name} {sec.type && `· ${sec.type}`} {sec.sqFt && `· ${parseInt(sec.sqFt).toLocaleString()} sqft`}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <ReadOnlyField label="Manufacturer" value={w.manufacturer} />
                    <ReadOnlyField label="Year Installed" value={w.yearInstalled} />
                    <ReadOnlyField label="Warranty Term" value={w.warrantyLength ? `${w.warrantyLength} years` : "—"} />
                    <ReadOnlyField label="Maintenance Plan" value={w.maintenancePlan ? "Yes" : "No"} />
                    {w.repairSpend && <ReadOnlyField label="Repair Spend" value={`$${parseFloat(w.repairSpend).toLocaleString()}`} />}
                    {w.coveredAmount && <ReadOnlyField label="Covered" value={`$${parseFloat(w.coveredAmount).toLocaleString()}`} />}
                  </div>
                </div>
              );
            })
          )}
        </>}

        {/* ── Navigation Buttons ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.g100}` }}>
          <button onClick={step === 0 ? () => { reset(); onClose(); } : goBack} style={{
            padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.g200}`,
            background: C.white, fontSize: 13, fontWeight: 600, fontFamily: F.head,
            color: C.navy, cursor: "pointer",
          }}>{step === 0 ? "Cancel" : "Back"}</button>

          {step === 4 ? (
            <button onClick={handleSave} disabled={saving} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: saving ? C.g400 : C.green, fontSize: 13, fontWeight: 700,
              fontFamily: F.head, color: C.white, cursor: saving ? "wait" : "pointer",
            }}>{saving ? "Creating..." : "Create Account"}</button>
          ) : (
            <button onClick={goNext} disabled={!canProceed()} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: canProceed() ? C.green : C.g200, fontSize: 13, fontWeight: 700,
              fontFamily: F.head, color: canProceed() ? C.white : C.g400, cursor: canProceed() ? "pointer" : "not-allowed",
            }}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
