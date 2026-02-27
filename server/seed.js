import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const client = await pool.connect();
  try {
    // Run schema
    const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
    await client.query(schema);
    console.log("Schema created.");

    // Clear existing data (idempotent re-seed)
    await client.query(`
      TRUNCATE claim_events, claims, inspections, invoices, access_logs,
               pricing_submissions, warranty_db, roof_warranties, roofs,
               properties, property_managers, owners CASCADE
    `);

    // ── OWNERS ──
    const owners = [
      { id: "own-1", name: "Vanderbilt Capital Partners", contact: "Richard Vanderbilt III", email: "rvanderbilt@vcpartners.com", phone: "(615) 555-0100", notes: "Owns 12 commercial properties across Middle TN. Long-term hold strategy." },
      { id: "own-2", name: "Greenway Health Systems", contact: "Dr. Marcia Langford", email: "mlangford@greenwayhealthsys.com", phone: "(615) 555-0300", notes: "Healthcare REIT. Extremely sensitive to leaks — medical equipment and patient safety." },
      { id: "own-3", name: "Summit Retail Holdings", contact: "James Thornton", email: "jthornton@summitretail.com", phone: "(615) 555-0400", notes: "Strip mall portfolio. Price-sensitive, but understands warranty value after losing coverage on Cool Springs location." },
    ];
    for (const o of owners) {
      await client.query("INSERT INTO owners (id,name,contact,email,phone,notes) VALUES ($1,$2,$3,$4,$5,$6)", [o.id, o.name, o.contact, o.email, o.phone, o.notes]);
    }

    // ── PROPERTY MANAGERS ──
    const pms = [
      { id: "pm-1", owner_id: "own-1", name: "Cornerstone Property Management", contact: "Sarah Mitchell", email: "smitchell@cornerstonepm.com", phone: "(615) 555-0150", notes: "Manages 6 of VCP's Nashville properties" },
      { id: "pm-2", owner_id: "own-3", name: "Alliance Facility Services", contact: "Mike Rodriguez", email: "mrodriguez@alliancefs.com", phone: "(615) 555-0450", notes: "Handles all maintenance for Summit's retail portfolio" },
    ];
    for (const pm of pms) {
      await client.query("INSERT INTO property_managers (id,owner_id,name,contact,email,phone,notes) VALUES ($1,$2,$3,$4,$5,$6,$7)", [pm.id, pm.owner_id, pm.name, pm.contact, pm.email, pm.phone, pm.notes]);
    }

    // ── PROPERTIES ──
    const props = [
      { id: "prop-1", owner_id: "own-1", managed_by: "pm-1", name: "Riverside Office Complex", address: "1420 Commerce Blvd, Nashville, TN" },
      { id: "prop-2", owner_id: "own-1", managed_by: "pm-1", name: "Commerce Park Building A", address: "2200 West End Ave, Nashville, TN" },
      { id: "prop-3", owner_id: "own-2", managed_by: null, name: "Greenway Medical Center", address: "800 Medical Center Dr, Franklin, TN" },
      { id: "prop-4", owner_id: "own-3", managed_by: "pm-2", name: "Harding Pike Shopping Center", address: "4500 Harding Pike, Nashville, TN" },
      { id: "prop-5", owner_id: "own-3", managed_by: "pm-2", name: "Nolensville Road Plaza", address: "3200 Nolensville Rd, Nashville, TN" },
    ];
    for (const p of props) {
      await client.query("INSERT INTO properties (id,owner_id,managed_by,name,address) VALUES ($1,$2,$3,$4,$5)", [p.id, p.owner_id, p.managed_by, p.name, p.address]);
    }

    // ── ROOFS + WARRANTIES ──
    const roofsData = [
      { id: "r-1a", property_id: "prop-1", section: "Main Building — Flat", sq_ft: 22000, type: "TPO", installed: "2019-06-15",
        warranty: { manufacturer: "GAF", w_type: "NDL (No Dollar Limit)", start_date: "2019-06-15", end_date: "2039-06-15", status: "active", compliance: "current", next_insp: "2026-06-15", last_insp: "2025-12-10",
          coverage: ["Membrane material defects","Manufacturing flaws","Seam failure","Flashing defects"],
          exclusions: ["Foot traffic damage","Acts of God (wind >74mph)","Unauthorized modifications","Ponding water >48hrs"],
          requirements: ["Biannual inspection by certified contractor","Maintain drainage systems","Report damage within 30 days","No unauthorized penetrations"] }},
      { id: "r-1b", property_id: "prop-1", section: "Warehouse Wing", sq_ft: 35000, type: "EPDM", installed: "2017-03-20",
        warranty: { manufacturer: "Carlisle", w_type: "Material Only", start_date: "2017-03-20", end_date: "2032-03-20", status: "active", compliance: "at-risk", next_insp: "2026-03-20", last_insp: "2024-09-15",
          coverage: ["Membrane material defects","Adhesive failure"],
          exclusions: ["Workmanship","Foot traffic damage","Chemical exposure","Ponding water"],
          requirements: ["Annual inspection","Maintain all flashings","Professional repairs only"] }},
      { id: "r-2a", property_id: "prop-2", section: "Full Roof", sq_ft: 18000, type: "TPO", installed: "2021-04-10",
        warranty: { manufacturer: "GAF", w_type: "NDL (No Dollar Limit)", start_date: "2021-04-10", end_date: "2041-04-10", status: "active", compliance: "current", next_insp: "2026-10-10", last_insp: "2025-10-08",
          coverage: ["Material defects","Manufacturing flaws","Membrane failure"],
          exclusions: ["Foot traffic","Acts of God","Unauthorized modifications"],
          requirements: ["Biannual inspection","Maintain drainage","30-day damage reporting"] }},
      { id: "r-3a", property_id: "prop-3", section: "East Wing", sq_ft: 45000, type: "PVC", installed: "2020-09-01",
        warranty: { manufacturer: "Sika Sarnafil", w_type: "Full System", start_date: "2020-09-01", end_date: "2040-09-01", status: "active", compliance: "current", next_insp: "2026-09-01", last_insp: "2025-08-20",
          coverage: ["Full system warranty","Material and labor","Consequential damages up to $500K"],
          exclusions: ["Acts of God","Third-party damage","Unauthorized modifications"],
          requirements: ["Annual manufacturer inspection","Maintain rooftop equipment pads","Quarterly drain cleaning"] }},
      { id: "r-3b", property_id: "prop-3", section: "West Wing", sq_ft: 38000, type: "TPO", installed: "2018-11-15",
        warranty: { manufacturer: "Versico", w_type: "Material + Labor", start_date: "2018-11-15", end_date: "2033-11-15", status: "active", compliance: "at-risk", next_insp: "2026-05-15", last_insp: "2024-11-20",
          coverage: ["Membrane defects","Seam failure","Labor for warranty repairs"],
          exclusions: ["Ponding water","Foot traffic","HVAC damage"],
          requirements: ["Biannual inspection","No rooftop storage","Report leaks within 14 days"] }},
      { id: "r-4a", property_id: "prop-4", section: "Main Retail Strip", sq_ft: 52000, type: "Modified Bitumen", installed: "2015-08-10",
        warranty: { manufacturer: "Firestone", w_type: "Material Only", start_date: "2015-08-10", end_date: "2030-08-10", status: "active", compliance: "expired-inspection", next_insp: "2025-08-10", last_insp: "2023-08-15",
          coverage: ["Membrane material defects only"],
          exclusions: ["All workmanship","Ponding","Foot traffic","HVAC discharge"],
          requirements: ["Annual certified inspection","Professional repairs within 30 days of discovery"] }},
      { id: "r-5a", property_id: "prop-5", section: "Full Roof", sq_ft: 28000, type: "TPO", installed: "2022-03-15",
        warranty: { manufacturer: "GAF", w_type: "NDL", start_date: "2022-03-15", end_date: "2042-03-15", status: "active", compliance: "current", next_insp: "2026-09-15", last_insp: "2025-09-10",
          coverage: ["Full membrane coverage","Manufacturing defects","Seam integrity"],
          exclusions: ["Foot traffic","Unauthorized penetrations","Wind >74mph"],
          requirements: ["Biannual inspection","Maintain drainage","30-day reporting"] }},
    ];
    for (const r of roofsData) {
      await client.query("INSERT INTO roofs (id,property_id,section,sq_ft,type,installed) VALUES ($1,$2,$3,$4,$5,$6)", [r.id, r.property_id, r.section, r.sq_ft, r.type, r.installed]);
      const w = r.warranty;
      await client.query(
        "INSERT INTO roof_warranties (roof_id,manufacturer,w_type,start_date,end_date,status,compliance,next_insp,last_insp,coverage,exclusions,requirements) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [r.id, w.manufacturer, w.w_type, w.start_date, w.end_date, w.status, w.compliance, w.next_insp, w.last_insp, JSON.stringify(w.coverage), JSON.stringify(w.exclusions), JSON.stringify(w.requirements)]
      );
    }

    // ── WARRANTY DATABASE (37 options) ──
    const warrantyDb = [
      { id:"w-gaf-ndl",category:"Single-Ply",manufacturer:"GAF",name:"NDL (No Dollar Limit)",membranes:["TPO","PVC"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"None",inspFreq:"Biannual",inspBy:"GAF-certified contractor",transferable:true,pondingExcluded:true,windLimit:"74 mph",strengths:["No dollar cap on repairs","Longest coverage in TPO market","Transferable to new owner"],weaknesses:["Strict biannual inspection requirement","Must use GAF-certified contractors","Ponding water excluded"],bestFor:"Long-term hold properties needing maximum coverage",rating:9 },
      { id:"w-gaf-sl",category:"Single-Ply",manufacturer:"GAF",name:"Silver Pledge",membranes:["TPO","PVC"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"$50/sqft",inspFreq:"Biannual",inspBy:"GAF-certified contractor",transferable:true,pondingExcluded:true,windLimit:"74 mph",strengths:["Solid mid-tier coverage","Labor included","Transferable"],weaknesses:["Dollar cap limits exposure","Same inspection requirements as NDL"],bestFor:"Budget-conscious owners wanting labor coverage",rating:7 },
      { id:"w-carlisle-mo",category:"Single-Ply",manufacturer:"Carlisle",name:"Material Only",membranes:["TPO","EPDM","PVC"],term:15,laborCovered:false,materialCovered:true,consequential:false,dollarCap:"Material value only",inspFreq:"Annual",inspBy:"Any licensed contractor",transferable:false,pondingExcluded:true,windLimit:"55 mph",strengths:["Lower cost warranty","Flexible inspection requirements","Wide membrane compatibility"],weaknesses:["No labor coverage at all","Not transferable","Lower wind threshold"],bestFor:"Cost-sensitive projects with reliable contractors",rating:5 },
      { id:"w-carlisle-psa",category:"Single-Ply",manufacturer:"Carlisle",name:"Platinum Shield",membranes:["TPO","EPDM","PVC"],term:20,laborCovered:true,materialCovered:true,consequential:true,dollarCap:"None",inspFreq:"Annual",inspBy:"Carlisle-authorized",transferable:true,pondingExcluded:false,windLimit:"80 mph",strengths:["Covers consequential damages","Ponding NOT excluded","Higher wind threshold","Transferable"],weaknesses:["Premium pricing","Must use Carlisle-authorized contractors only"],bestFor:"High-value properties where leak consequences are severe",rating:9 },
      { id:"w-versico-ml",category:"Single-Ply",manufacturer:"Versico",name:"Material + Labor",membranes:["TPO","EPDM"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"$40/sqft",inspFreq:"Biannual",inspBy:"Versico-authorized",transferable:true,pondingExcluded:true,windLimit:"60 mph",strengths:["Good mid-range coverage","Labor included","Reasonable dollar cap"],weaknesses:["Lower wind rating","Biannual inspections required"],bestFor:"Mid-market properties with standard exposure",rating:6 },
      { id:"w-sika-fs",category:"Single-Ply",manufacturer:"Sika Sarnafil",name:"Full System",membranes:["PVC"],term:20,laborCovered:true,materialCovered:true,consequential:true,dollarCap:"Up to $500K",inspFreq:"Annual",inspBy:"Manufacturer direct",transferable:true,pondingExcluded:false,windLimit:"90 mph",strengths:["Consequential damage coverage up to $500K","Manufacturer-direct inspections","Highest wind rating","Ponding not excluded"],weaknesses:["PVC only","Premium cost","Manufacturer controls inspections"],bestFor:"Healthcare, data centers, critical facilities",rating:10 },
      { id:"w-firestone-mo",category:"Single-Ply",manufacturer:"Firestone",name:"Material Only",membranes:["TPO","EPDM","Modified Bitumen"],term:15,laborCovered:false,materialCovered:true,consequential:false,dollarCap:"Material value",inspFreq:"Annual",inspBy:"Any licensed",transferable:false,pondingExcluded:true,windLimit:"55 mph",strengths:["Wide membrane compatibility","Flexible contractor requirements"],weaknesses:["No labor","Not transferable","Material-only limits real protection"],bestFor:"Basic coverage on budget retrofits",rating:4 },
      { id:"c-gaco-sil-lm",category:"Coating",manufacturer:"GACO (Amrize)",name:"Silicone L&M NDL",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL on leak repairs",inspFreq:"Annual",inspBy:"Licensed GACO Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["NDL on leak repairs","Ponding water NOT excluded (silicone)","Up to 20-year terms available","50-yr material-only option unique in industry"],weaknesses:["Transfer fee + 60-day notice required","30-day leak notification window","Disputes governed by TN law"],bestFor:"Ponding-prone roofs needing long-term NDL coating warranty",rating:9 },
      { id:"c-gaco-sil-mo",category:"Coating",manufacturer:"GACO (Amrize)",name:"Silicone Material Only 50-yr",membranes:["Silicone"],term:50,laborCovered:false,materialCovered:true,consequential:false,dollarCap:"Replacement product",inspFreq:"Annual",inspBy:"N/A",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["50-year term unique in coating industry","Ponding NOT excluded","Low-cost warranty option"],weaknesses:["No labor coverage","Material replacement only"],bestFor:"Budget projects wanting longest material guarantee available",rating:6 },
      { id:"c-gaco-acr-lm",category:"Coating",manufacturer:"GACO (Amrize)",name:"Acrylic L&M NDL",membranes:["Acrylic"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL on leak repairs",inspFreq:"Annual",inspBy:"Licensed GACO Applicator",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["NDL on leak repairs","Up to 20-year terms","Transferable"],weaknesses:["Ponding water excluded","Must use GACO licensed applicator"],bestFor:"Well-drained roofs needing acrylic restoration with NDL coverage",rating:7 },
      { id:"c-gaco-ure-lm",category:"Coating",manufacturer:"GACO (Amrize)",name:"Urethane L&M NDL",membranes:["Urethane"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL on leak repairs",inspFreq:"Annual",inspBy:"Licensed GACO Applicator",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["NDL on leak repairs","Urethane durability + impact resistance","Up to 20-year terms"],weaknesses:["Ponding water excluded","Must use GACO licensed applicator"],bestFor:"High-traffic roofs needing durable urethane system with NDL",rating:7 },
      { id:"c-aws-sil-ndl",category:"Coating",manufacturer:"American WeatherStar",name:"Silicone NDL System",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL",inspFreq:"Annual (contractor-performed for 20-yr)",inspBy:"Platinum/Platinum Elite Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["NDL coverage","Ponding NOT excluded","Renewable within 30 days of expiration","StarGard+ extension available"],weaknesses:["Third-party inspection required","Must use Platinum-tier contractor","Transfer requires inspection + approval"],bestFor:"Premium silicone restoration with renewable NDL coverage",rating:9 },
      { id:"c-aws-uas-ndl",category:"Coating",manufacturer:"American WeatherStar",name:"Ure-A-Sil NDL System",membranes:["Urethane","Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL",inspFreq:"Annual",inspBy:"Platinum/Platinum Elite Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Flagship system combining urethane strength + silicone UV resistance","NDL coverage","Ponding NOT excluded (silicone topcoat)"],weaknesses:["Premium contractor tier required","Multi-coat application"],bestFor:"Maximum durability with urethane base and silicone topcoat",rating:9 },
      { id:"c-aws-acr-ndl",category:"Coating",manufacturer:"American WeatherStar",name:"Met-A-Gard Acrylic NDL",membranes:["Acrylic"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"NDL",inspFreq:"Annual",inspBy:"Platinum Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Metal roof specific system","NDL coverage","Transferable"],weaknesses:["Ponding water excluded","Metal roofs only","Max 15-year term"],bestFor:"Metal roof restoration with acrylic coating",rating:7 },
      { id:"c-sw-sil-lm",category:"Coating",manufacturer:"Sherwin-Williams (UNIFLEX)",name:"UNIGUARD Silicone System",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"UNIFLEX Authorized Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Backed by multi-billion dollar Sherwin-Williams","4,600+ locations nationwide","Ponding NOT excluded","Up to 20-year terms"],weaknesses:["Must use UNIFLEX Authorized Contractor","Dollar cap not published as NDL"],bestFor:"Owners wanting blue-chip corporate backing on coating warranty",rating:8 },
      { id:"c-sw-acr-lm",category:"Coating",manufacturer:"Sherwin-Williams (UNIFLEX)",name:"UNIGUARD Acrylic System",membranes:["Acrylic"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"UNIFLEX Authorized Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Sherwin-Williams corporate backing","Can extend warranty with additional applications","Transferable"],weaknesses:["Ponding water excluded","Max 15-year term for acrylic"],bestFor:"Well-drained roofs with corporate-grade warranty backing",rating:7 },
      { id:"c-sw-ure-lm",category:"Coating",manufacturer:"Sherwin-Williams (UNIFLEX)",name:"UNIGUARD Urethane System",membranes:["Urethane"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"UNIFLEX Authorized Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Single-component aliphatic moisture curing","Sherwin-Williams backing","Transferable"],weaknesses:["Ponding water excluded","Max 15-year term"],bestFor:"Urethane restoration backed by major manufacturer",rating:7 },
      { id:"c-gaf-sil-lm",category:"Coating",manufacturer:"GAF",name:"Silicone Coating L&M",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"GAF Certified Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Standard Industries backing","Ponding NOT excluded","Up to 20-year terms","High Solid option allows single-coat application"],weaknesses:["Must use GAF Certified Contractor","Standard Unisil requires min 2 coats"],bestFor:"Silicone restoration through established GAF contractor network",rating:8 },
      { id:"c-gaf-acr-lm",category:"Coating",manufacturer:"GAF",name:"HydroStop Acrylic L&M",membranes:["Acrylic"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"GAF Certified Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Premium HydroStop system up to 20 years","GAF/Standard Industries backing","Transferable"],weaknesses:["Ponding water excluded","Standard acrylic limited to 10/15-yr"],bestFor:"Premium acrylic restoration through GAF network",rating:8 },
      { id:"c-trop-sil-lm",category:"Coating",manufacturer:"Tropical (SOPREMA)",name:"Eterna-Sil Silicone System",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual (Care & Maintenance Specs)",inspBy:"Tropical Authorized Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["SOPREMA Group backing (integrated Jan 2026)","Can be applied over ponding water","100% silicone solvent-free","Title 24 compliant, CRRC rated"],weaknesses:["Separate warranty application per building","Must use Tropical Authorized Contractor"],bestFor:"Silicone restoration backed by global SOPREMA group",rating:8 },
      { id:"c-trop-acr-lm",category:"Coating",manufacturer:"Tropical (SOPREMA)",name:"Acrylic System",membranes:["Acrylic"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Tropical Authorized Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["SOPREMA Group backing","Transferable"],weaknesses:["Ponding water excluded","Max 15-year term","Separate warranty per building"],bestFor:"Acrylic restoration with international manufacturer support",rating:7 },
      { id:"c-henry-sil-gs",category:"Coating",manufacturer:"Carlisle (Henry)",name:"Pro-Grade 988 Gold Seal",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Henry Authorized Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["DPUR patent for dirt resistance","Rain-safe in 15 min","50+ mils single coat capability","Carlisle Companies backing","Warranty portal available"],weaknesses:["Must use Henry Authorized Applicator"],bestFor:"Premium silicone with patented dirt-resistance technology",rating:9 },
      { id:"c-henry-sil-mp",category:"Coating",manufacturer:"Carlisle (Henry)",name:"Pro-Grade 988 Materials-Plus",membranes:["Silicone"],term:15,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Materials + labor for affected areas",inspFreq:"Annual",inspBy:"Henry Authorized Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Covers materials and labor for affected areas","Ponding NOT excluded","Lower cost than Gold Seal"],weaknesses:["Not full NDL","Coverage limited to affected areas"],bestFor:"Mid-tier silicone warranty with Henry's DPUR technology",rating:7 },
      { id:"c-henry-acr-gs",category:"Coating",manufacturer:"Carlisle (Henry)",name:"Pro-Grade 280 Acrylic Gold Seal",membranes:["Acrylic"],term:12,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Henry Authorized Applicator",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Carlisle Companies backing","Resists chalking, mildew, fungi","Warranty portal"],weaknesses:["Ponding water excluded","Max 12-year term shorter than competitors"],bestFor:"Acrylic restoration with Carlisle backing where drainage is adequate",rating:6 },
      { id:"c-apoc-sil-mo",category:"Coating",manufacturer:"APOC",name:"576 Premium Silicone Lifetime",membranes:["Silicone"],term:99,laborCovered:false,materialCovered:true,consequential:false,dollarCap:"Replacement product (prorated)",inspFreq:"N/A",inspBy:"N/A",transferable:false,pondingExcluded:false,windLimit:"Per terms",strengths:["Lifetime material warranty unique in market","Rain-safe in 15 min","Exceeds ASTM D6694/D7281","Title 24 and CRRC certified"],weaknesses:["Material only, no labor","Prorated replacement","Not transferable"],bestFor:"Budget projects wanting longest material-only silicone guarantee",rating:5 },
      { id:"c-apoc-acr-258",category:"Coating",manufacturer:"APOC",name:"258 Energy-Armor Ultra 20-yr",membranes:["Acrylic"],term:20,laborCovered:false,materialCovered:true,consequential:false,dollarCap:"Replacement product (prorated)",inspFreq:"N/A",inspBy:"N/A",transferable:false,pondingExcluded:true,windLimit:"Per terms",strengths:["20-year material warranty on acrylic","Premium formulation"],weaknesses:["Material only","Ponding excluded","Prorated","Not transferable"],bestFor:"Budget acrylic projects needing extended material coverage",rating:4 },
      { id:"c-apoc-sys-lm",category:"Coating",manufacturer:"APOC",name:"System L&M Warranty",membranes:["Silicone","Acrylic","Urethane"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"APOC Certified Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Full L&M system warranty available","Founded 1913, #1 US asphalt/acrylic producer","Multi-chemistry options"],weaknesses:["30-day written notice for claims","Must use APOC Certified Applicator"],bestFor:"Full system coating warranty from established manufacturer",rating:7 },
      { id:"c-karnak-sil-lm",category:"Coating",manufacturer:"KARNAK",name:"Karna-Sil Silicone L&M",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Q Applicator Program",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Ponding NOT excluded","NSF rated for potable rainwater","Woman-owned certified","SRI 110 initial / 86 aged"],weaknesses:["Pre-approval required","Inspection after payment","5-10 day processing","Smaller manufacturer footprint"],bestFor:"Sustainability-focused projects or potable rainwater applications",rating:7 },
      { id:"c-karnak-acr-lm",category:"Coating",manufacturer:"KARNAK",name:"Acrylic/Silicone L&M",membranes:["Acrylic","Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Q Applicator Program",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Separate forms for metal vs non-metal substrates","Up to 20-year terms","NSF rated"],weaknesses:["Smaller manufacturer","Pre-approval process required"],bestFor:"Metal or non-metal substrates needing specialty coating warranty",rating:6 },
      { id:"c-poly-sil-lm",category:"Coating",manufacturer:"Polyglass (MAPEI)",name:"Polybrite Silicone L&M",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Min 2x/yr per NRCA/RCMA",inspBy:"Polyglass Registered Contractor",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["MAPEI Group backing","Ponding NOT excluded for Polybrite","Up to 20-year terms","Open Year option available"],weaknesses:["$500 transfer fee + costs","30-day advance notice for transfers","Semi-annual inspections required","Excludes consequential damages and attorney fees"],bestFor:"Silicone restoration backed by global MAPEI group",rating:8 },
      { id:"c-poly-acr-lm",category:"Coating",manufacturer:"Polyglass (MAPEI)",name:"Acrylic Fast-Dry L&M",membranes:["Acrylic"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Min 2x/yr",inspBy:"Polyglass Registered Contractor",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["MAPEI Group backing","Fast-dry formulations","Up to 20-year terms"],weaknesses:["Ponding/lack of drainage excluded","$500 transfer fee","Semi-annual inspections"],bestFor:"Acrylic restoration with international manufacturer backing",rating:7 },
      { id:"c-everest-sil-lm",category:"Coating",manufacturer:"Everest Systems",name:"Silkoxy Silicone L&M",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Everest Certified Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Alkoxy high-solids, no primer needed in most apps","Ponding NOT excluded","Houston TX manufacturing","Up to 20-year terms"],weaknesses:["Smaller manufacturer","Must use Everest Certified Applicator"],bestFor:"Primer-free silicone application with full L&M warranty",rating:8 },
      { id:"c-everest-acr-lm",category:"Coating",manufacturer:"Everest Systems",name:"EverCoat Acrylic L&M",membranes:["Acrylic"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Everest Certified Applicator",transferable:true,pondingExcluded:true,windLimit:"Per terms",strengths:["Plasticizer-free formulation","High-tensile option (EverCoat HT)","Fluorostar PVDF topcoat for 10-yr color-fast","Up to 20-year terms"],weaknesses:["Ponding water excluded","Smaller manufacturer footprint"],bestFor:"Premium acrylic with color-fast PVDF topcoat option",rating:7 },
      { id:"c-everest-ure-lm",category:"Coating",manufacturer:"Everest Systems",name:"EverMax/EverSol Urethane L&M",membranes:["Urethane"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"Everest Certified Applicator",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["EverMax FR for fire-resistant polyurea","Eco-Level self-leveling for ponding areas","Extreme weather protection","Up to 20-year terms"],weaknesses:["Specialty application required","Must use Everest Certified Applicator"],bestFor:"Extreme weather or fire-resistant coating applications",rating:8 },
      { id:"c-far-sil-lm",category:"Coating",manufacturer:"FAR (Fluid Applied Roofing)",name:"ProSil Silicone L&M",membranes:["Silicone"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"FAR Certified Contractor/Inspector",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["Ponding NOT excluded","Up to 20-year terms","FAR Certified Inspector program","Alkoxy and high-solids options"],weaknesses:["Newer manufacturer","Must use FAR Certified Contractor"],bestFor:"Silicone restoration with dedicated inspector certification program",rating:7 },
      { id:"c-far-hybrid-lm",category:"Coating",manufacturer:"FAR (Fluid Applied Roofing)",name:"FiberSeal PU-Acrylic Hybrid L&M",membranes:["Urethane","Acrylic"],term:20,laborCovered:true,materialCovered:true,consequential:false,dollarCap:"Per warranty terms",inspFreq:"Annual",inspBy:"FAR Certified Contractor/Inspector",transferable:true,pondingExcluded:false,windLimit:"Per terms",strengths:["IRE People's Choice Award 2025 & 2026","PU-Acrylic hybrid resists ponding","Up to 20-year terms"],weaknesses:["Newer manufacturer","Hybrid chemistry less established"],bestFor:"Innovative hybrid coating for ponding-prone roofs",rating:7 },
    ];
    for (const w of warrantyDb) {
      await client.query(
        `INSERT INTO warranty_db (id,category,manufacturer,name,membranes,term,labor_covered,material_covered,consequential,dollar_cap,insp_freq,insp_by,transferable,ponding_excluded,wind_limit,strengths,weaknesses,best_for,rating)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [w.id,w.category,w.manufacturer,w.name,JSON.stringify(w.membranes),w.term,w.laborCovered,w.materialCovered,w.consequential,w.dollarCap,w.inspFreq,w.inspBy,w.transferable,w.pondingExcluded,w.windLimit,JSON.stringify(w.strengths),JSON.stringify(w.weaknesses),w.bestFor,w.rating]
      );
    }

    // ── PRICING SEED DATA ──
    const pricingSeed = [
      // w-gaf-ndl base fees
      { warranty_id:"w-gaf-ndl",fee_type:"base",amount:2500,submitted_at:"2025-11-01T00:00:00Z" },
      { warranty_id:"w-gaf-ndl",fee_type:"base",amount:2800,submitted_at:"2025-12-15T00:00:00Z" },
      { warranty_id:"w-gaf-ndl",fee_type:"base",amount:2650,submitted_at:"2026-01-20T00:00:00Z" },
      // w-gaf-ndl psf fees
      { warranty_id:"w-gaf-ndl",fee_type:"psf",amount:0.08,submitted_at:"2025-11-01T00:00:00Z" },
      { warranty_id:"w-gaf-ndl",fee_type:"psf",amount:0.09,submitted_at:"2025-12-15T00:00:00Z" },
      { warranty_id:"w-gaf-ndl",fee_type:"psf",amount:0.085,submitted_at:"2026-01-20T00:00:00Z" },
      // c-gaco-sil-lm
      { warranty_id:"c-gaco-sil-lm",fee_type:"base",amount:1800,submitted_at:"2025-10-10T00:00:00Z" },
      { warranty_id:"c-gaco-sil-lm",fee_type:"base",amount:2100,submitted_at:"2025-11-22T00:00:00Z" },
      { warranty_id:"c-gaco-sil-lm",fee_type:"base",amount:1950,submitted_at:"2026-01-05T00:00:00Z" },
      { warranty_id:"c-gaco-sil-lm",fee_type:"psf",amount:0.06,submitted_at:"2025-10-10T00:00:00Z" },
      { warranty_id:"c-gaco-sil-lm",fee_type:"psf",amount:0.07,submitted_at:"2025-11-22T00:00:00Z" },
      { warranty_id:"c-gaco-sil-lm",fee_type:"psf",amount:0.065,submitted_at:"2026-01-05T00:00:00Z" },
      // c-henry-sil-gs
      { warranty_id:"c-henry-sil-gs",fee_type:"base",amount:2200,submitted_at:"2025-12-01T00:00:00Z" },
      { warranty_id:"c-henry-sil-gs",fee_type:"base",amount:2400,submitted_at:"2026-01-10T00:00:00Z" },
      { warranty_id:"c-henry-sil-gs",fee_type:"psf",amount:0.07,submitted_at:"2025-12-01T00:00:00Z" },
      { warranty_id:"c-henry-sil-gs",fee_type:"psf",amount:0.075,submitted_at:"2026-01-10T00:00:00Z" },
      // w-sika-fs
      { warranty_id:"w-sika-fs",fee_type:"base",amount:4500,submitted_at:"2025-09-15T00:00:00Z" },
      { warranty_id:"w-sika-fs",fee_type:"base",amount:5000,submitted_at:"2025-11-10T00:00:00Z" },
      { warranty_id:"w-sika-fs",fee_type:"base",amount:4800,submitted_at:"2026-02-01T00:00:00Z" },
      { warranty_id:"w-sika-fs",fee_type:"psf",amount:0.14,submitted_at:"2025-09-15T00:00:00Z" },
      { warranty_id:"w-sika-fs",fee_type:"psf",amount:0.15,submitted_at:"2025-11-10T00:00:00Z" },
      { warranty_id:"w-sika-fs",fee_type:"psf",amount:0.145,submitted_at:"2026-02-01T00:00:00Z" },
    ];
    for (const p of pricingSeed) {
      await client.query(
        "INSERT INTO pricing_submissions (warranty_id,fee_type,amount,status,submitted_at) VALUES ($1,$2,$3,'active',$4)",
        [p.warranty_id, p.fee_type, p.amount, p.submitted_at]
      );
    }

    // ── ACCESS LOGS ──
    const accessLogs = [
      { id:"al-1",roof_id:"r-1a",person:"Mike Torres",company:"Nashville HVAC Pro",purpose:"HVAC unit service",date:"2025-12-08T09:30:00",duration:"2.5 hrs",notes:"Routine condenser service. Used ladder at NE access." },
      { id:"al-2",roof_id:"r-1a",person:"Unknown",company:"Unknown",purpose:"Unauthorized access",date:"2025-12-12T14:15:00",duration:"Unknown",notes:"QR not scanned. Camera showed individual on roof near HVAC unit." },
      { id:"al-3",roof_id:"r-1a",person:"Billy Hargrove",company:"Riverland Roofing",purpose:"MRI moisture scan",date:"2025-12-18T08:00:00",duration:"3 hrs",notes:"Full scan completed. Puncture found near NE HVAC unit." },
      { id:"al-4",roof_id:"r-3a",person:"David Kim",company:"Greenway Facilities",purpose:"Drain inspection",date:"2026-01-05T10:00:00",duration:"45 min",notes:"Quarterly drain cleaning per warranty requirements." },
      { id:"al-5",roof_id:"r-4a",person:"Jeff Simmons",company:"Pinnacle Signs",purpose:"Sign installation",date:"2025-11-20T13:00:00",duration:"4 hrs",notes:"New tenant signage. Penetrations made without contractor notification." },
      { id:"al-6",roof_id:"r-1b",person:"Sarah Mitchell",company:"Cornerstone PM",purpose:"Annual walkthrough",date:"2026-01-15T11:00:00",duration:"1 hr",notes:"PM inspection. Noted ponding near drain #3." },
    ];
    for (const a of accessLogs) {
      await client.query("INSERT INTO access_logs (id,roof_id,person,company,purpose,date,duration,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [a.id,a.roof_id,a.person,a.company,a.purpose,a.date,a.duration,a.notes]);
    }

    // ── INVOICES ──
    const invoices = [
      { id:"inv-1",roof_id:"r-1a",vendor:"Riverland Roofing",date:"2025-12-20",amount:4200,desc:"Seam repair — NE section near HVAC",flagged:true,flagReason:"Seam separation may be covered under GAF NDL warranty",status:"review" },
      { id:"inv-2",roof_id:"r-1b",vendor:"Acme Roofing",date:"2025-10-15",amount:1800,desc:"Flashing repair — west parapet",flagged:false,flagReason:null,status:"paid" },
      { id:"inv-3",roof_id:"r-3b",vendor:"Quality Roof Repair",date:"2025-09-22",amount:6500,desc:"Membrane patch — 200 sqft area",flagged:true,flagReason:"Membrane defect may fall under Versico Material + Labor coverage",status:"review" },
      { id:"inv-4",roof_id:"r-4a",vendor:"Pinnacle Roofing",date:"2025-11-30",amount:3200,desc:"Emergency leak repair — tenant space",flagged:true,flagReason:"Leak may be linked to unauthorized sign penetration — third-party liability, not warranty",status:"review" },
      { id:"inv-5",roof_id:"r-5a",vendor:"Riverland Roofing",date:"2026-01-10",amount:950,desc:"Drain basket replacement x3",flagged:false,flagReason:null,status:"paid" },
      { id:"inv-6",roof_id:"r-3a",vendor:"Sika Sarnafil Direct",date:"2025-07-18",amount:0,desc:"Warranty repair — manufacturer dispatched crew",flagged:false,flagReason:null,status:"warranty" },
    ];
    for (const inv of invoices) {
      await client.query("INSERT INTO invoices (id,roof_id,vendor,date,amount,description,flagged,flag_reason,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [inv.id,inv.roof_id,inv.vendor,inv.date,inv.amount,inv.desc,inv.flagged,inv.flagReason,inv.status]);
    }

    // ── INSPECTIONS ──
    const inspections = [
      { id:"insp-1",roof_id:"r-1a",date:"2025-12-10",inspector:"Billy Hargrove",company:"Riverland Roofing",type:"Biannual + MRI Scan",status:"completed",score:87,photos:24,moistureData:true,notes:"Puncture found near NE HVAC. Seam wear on south section. Drains clear." },
      { id:"insp-2",roof_id:"r-3a",date:"2025-08-20",inspector:"Adam G.",company:"Roof MRI",type:"Annual + MRI Scan",status:"completed",score:94,photos:18,moistureData:true,notes:"Excellent condition. All drains clear. No moisture detected." },
      { id:"insp-3",roof_id:"r-1a",date:"2026-06-15",inspector:"TBD",company:"TBD",type:"Biannual",status:"scheduled",score:null,photos:0,moistureData:false,notes:"Due per GAF NDL requirements." },
      { id:"insp-4",roof_id:"r-4a",date:"2025-08-10",inspector:"—",company:"—",type:"Annual",status:"overdue",score:null,photos:0,moistureData:false,notes:"OVERDUE. Last inspection Aug 2023. Warranty compliance at risk." },
      { id:"insp-5",roof_id:"r-1b",date:"2026-03-20",inspector:"TBD",company:"TBD",type:"Annual",status:"scheduled",score:null,photos:0,moistureData:false,notes:"Carlisle requires annual inspection." },
    ];
    for (const insp of inspections) {
      await client.query("INSERT INTO inspections (id,roof_id,date,inspector,company,type,status,score,photos,moisture_data,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [insp.id,insp.roof_id,insp.date,insp.inspector,insp.company,insp.type,insp.status,insp.score,insp.photos,insp.moistureData,insp.notes]);
    }

    // ── CLAIMS ──
    const claims = [
      { id:"cl-1",roof_id:"r-3b",manufacturer:"Versico",filed:"2025-10-01",amount:3200,status:"approved",desc:"Membrane delamination — 200 sqft area, west section",
        timeline:[
          { date:"2025-10-01",event:"Claim filed with Versico. Included MRI scan data, photos, and inspection report." },
          { date:"2025-10-08",event:"Versico acknowledged receipt. Assigned claim #VER-2025-4412." },
          { date:"2025-10-22",event:"Versico field rep inspected. Confirmed manufacturing defect in membrane batch." },
          { date:"2025-11-05",event:"Claim approved. $3,200 repair authorized under Material + Labor warranty." },
          { date:"2025-11-18",event:"Repair completed by Versico-authorized contractor." },
        ] },
      { id:"cl-2",roof_id:"r-1a",manufacturer:"GAF",filed:"2026-01-10",amount:4200,status:"in-progress",desc:"Seam separation near HVAC unit — potential third-party cause",
        timeline:[
          { date:"2026-01-10",event:"Claim filed with GAF. Included MRI scan showing moisture at seam, QR access log showing unauthorized roof access 12/12." },
          { date:"2026-01-15",event:"GAF acknowledged. Requested additional documentation on HVAC contractor visits." },
          { date:"2026-01-28",event:"Submitted HVAC service records and QR access log timeline. Awaiting field inspection." },
        ] },
    ];
    for (const cl of claims) {
      await client.query("INSERT INTO claims (id,roof_id,manufacturer,filed,amount,status,description) VALUES ($1,$2,$3,$4,$5,$6,$7)", [cl.id,cl.roof_id,cl.manufacturer,cl.filed,cl.amount,cl.status,cl.desc]);
      for (let i = 0; i < cl.timeline.length; i++) {
        await client.query("INSERT INTO claim_events (claim_id,date,event,sort_order) VALUES ($1,$2,$3,$4)", [cl.id, cl.timeline[i].date, cl.timeline[i].event, i]);
      }
    }

    console.log("Seed complete! All data loaded.");
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
