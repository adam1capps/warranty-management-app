/**
 * API Client for Roof MRI Warranty Management App
 * Connects to the Express/PostgreSQL backend on Render.
 */

const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

/** Fetch full account hierarchy (owners → PMs, properties → roofs → warranties) */
export const fetchAccounts = () => request("/accounts");

/** Fetch the warranty options database (37 items) */
export const fetchWarrantyDb = () => request("/warranties");

/** Fetch pricing store (grouped by warranty ID) */
export const fetchPricingStore = () => request("/pricing");

/** Submit a new pricing entry */
export const submitPricing = (data) =>
  request("/pricing", { method: "POST", body: JSON.stringify(data) });

/** Fetch access logs */
export const fetchAccessLogs = () => request("/access-logs");

/** Fetch invoices */
export const fetchInvoices = () => request("/invoices");

/** Fetch inspections */
export const fetchInspections = () => request("/inspections");

/** Fetch claims with timelines */
export const fetchClaims = () => request("/claims");
