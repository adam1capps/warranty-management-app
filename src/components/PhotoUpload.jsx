import { useState, useEffect, useRef } from "react";
import { fetchPhotos, uploadPhoto, deletePhoto } from "../api";

const C = {
  green: "#00bd70", greenLt: "#e6f9f0",
  navy: "#1e2c55",
  white: "#ffffff", g50: "#f8f9fb", g100: "#f0f2f5", g200: "#dde1e8",
  g400: "#9ba3b5", g600: "#5a6377",
  blue: "#3b82f6", blueBg: "#eff6ff",
  red: "#ef4444",
  shadow: "0 1px 3px rgba(30,44,85,0.06)",
};
const F = { head: "'Poppins', sans-serif", body: "'Montserrat', sans-serif" };

export default function PhotoUpload({ entityType, entityId }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    if (!entityType || !entityId) return;
    fetchPhotos(entityType, entityId).then(setPhotos).catch(() => setPhotos([]));
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        await uploadPhoto({ entityType, entityId, url: reader.result, caption: file.name });
        load();
        setUploading(false);
        setExpanded(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Upload failed: " + err.message);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await deletePhoto(id);
      load();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setExpanded(!expanded)} style={{
          background: "none", border: "none", fontSize: 12, fontWeight: 700, fontFamily: F.head,
          color: C.g400, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4,
        }}>
          📷 Photos ({photos.length}) {expanded ? "▲" : "▼"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          background: C.blueBg, border: `1px solid ${C.blue}30`, borderRadius: 6,
          padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: F.head,
          color: C.blue, cursor: uploading ? "wait" : "pointer",
        }}>{uploading ? "Uploading..." : "+ Add Photo"}</button>
      </div>

      {expanded && photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {photos.map(p => (
            <div key={p.id} style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.g200}` }}>
              <img src={p.url} alt={p.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => handleDelete(p.id)} style={{
                position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "none", color: C.white, fontSize: 10,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
