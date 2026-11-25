"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Lead = {
  id: number;
  name: string;
  phone: string;
  fb_link?: string | null;
  service: string;
  source: string;
  budget?: number | null;
  notes?: string | null;
  status: string;
  created_at: string;
};

export default function Home() {
  const [view, setView] = useState<"owner" | "inquire">("owner");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fbLink, setFbLink] = useState("");
  const [service, setService] = useState("Nail Extension");
  const [source, setSource] = useState("Facebook");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "inquire") setView("inquire");
    fetchLeads();
    const channel = supabase
      .channel("leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchLeads() {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("Lagay mo muna Pangalan mo");
    if (!phone.trim()) return alert("Lagay mo muna Phone Number mo - required yan para ma-contact ka namin");
    // FB Link is OPTIONAL - no validation
    setSending(true);
    const { error } = await supabase.from("leads").insert([{
      name: name.trim(),
      phone: phone.trim(),
      fb_link: fbLink.trim() || null,
      service,
      source: view === "inquire" ? "Public Form" : source,
      budget: budget ? Number(budget) : null,
      notes: notes.trim() || null,
      status: "Bagong Inquiry",
    }]);
    setSending(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    alert("Salamat! Na-save na inquiry mo. Reply kami agad!");
    setName(""); setPhone(""); setFbLink(""); setBudget(""); setNotes("");
    if (view === "inquire") return;
    fetchLeads();
  }

  async function updateStatus(id: number, status: string) {
    await supabase.from("leads").update({ status }).eq("id", id);
    fetchLeads();
  }

  async function deleteLead(id: number) {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    fetchLeads();
  }

  // Stats
  const today = new Date().toDateString();
  const todayLeads = leads.filter(l => new Date(l.created_at).toDateString() === today);
  const weekLeads = leads.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  const paid = leads.filter(l => l.status === "Nagbayad").length;
  const conversion = leads.length ? Math.round((paid / leads.length) * 100) : 0;
  const lost = leads.filter(l => l.status === "Dead").length;

  const filtered = leads.filter(l => {
    const matchSearch = (l.name + " " + l.phone + " " + (l.fb_link || "") + " " + l.service).toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || l.status === filter;
    return matchSearch && matchFilter;
  });

  function getBadge(l: Lead) {
    const hours = (Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60);
    if (l.status === "Bagong Inquiry" && hours > 2) return { text: "REPLY AGAD!", color: "#F97316" };
    if (l.status === "Kinausap" && hours > 24) return { text: "FOLLOW-UP NA!", color: "#EF4444" };
    return null;
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: 12, border: "1px solid #E2E8F0", borderRadius: 12, background: "white", fontSize: 16, boxSizing: "border-box" };
  const cardStyle: React.CSSProperties = { background: "white", borderRadius: 16, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };

  // ===== CLIENT FORM VIEW =====
  if (view === "inquire") {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: 16, fontFamily: "system-ui, sans-serif", color: "#0F172A" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Mag-Inquire</h1>
            <p style={{ color: "#64748B", margin: "6px 0 0" }}>30 seconds lang, reply kami agad!</p>
          </div>
          <form onSubmit={handleSubmit} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Pangalan *</label>
              <input style={inputStyle} placeholder="Hal. Rosa Castro" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Phone Number *</label>
              <input style={inputStyle} placeholder="Hal. 09676706327" value={phone} onChange={e => setPhone(e.target.value)} required type="tel" />
              <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>Dito ka namin i-contact. Required to para hindi ka mawala.</p>
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Anong service gusto mo?</label>
              <select style={inputStyle} value={service} onChange={e => setService(e.target.value)}>
                <option>Nail Extension</option>
                <option>Softgel</option>
                <option>Manicure / Pedicure</option>
                <option>Lash Extension</option>
                <option>Brow / Lash Lift</option>
                <option>Hair / Makeup</option>
                <option>Printing / Custom</option>
                <option>Iba pa</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Budget (Optional)</label>
              <input style={inputStyle} placeholder="Hal. 2000" value={budget} onChange={e => setBudget(e.target.value)} type="number" />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>FB Link (Optional)</label>
              <input style={inputStyle} placeholder="Hal. facebook.com/rosa.castro" value={fbLink} onChange={e => setFbLink(e.target.value)} />
              <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>Optional lang, pwede i-skip. Phone lang okay na.</p>
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 14 }}>Notes (Optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Hal. Gusto ko bukas 9am..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button disabled={sending} type="submit" style={{ background: "#10B981", color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 16, minHeight: 48, cursor: "pointer" }}>
              {sending ? "Sine-send..." : "SEND INQUIRY"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#94A3B8", margin: 0 }}>Hindi namin i-share ang number mo.</p>
          </form>
        </div>
      </div>
    );
  }

  // ===== OWNER DASHBOARD VIEW =====
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: 16, fontFamily: "system-ui, sans-serif", color: "#0F172A" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ background: "#0F172A", color: "white", borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Lead Catcher</h1>
          <p style={{ margin: "4px 0 0", opacity: 0.85 }}>Walang Lead na Mawawala</p>
          <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.7 }}>50 inquiries? Lahat naka-save, lahat may follow-up.</p>
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.1)", padding: 10, borderRadius: 10, fontSize: 13 }}>
            Client link: <b>lead-catcher-ph-wewt.vercel.app/?view=inquire</b> — i-send mo sa clients
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={cardStyle}><div style={{ fontSize: 12, color: "#64748B" }}>Total Leads Today</div><div style={{ fontSize: 28, fontWeight: 800 }}>{todayLeads.length}</div></div>
          <div style={cardStyle}><div style={{ fontSize: 12, color: "#64748B" }}>Total This Week</div><div style={{ fontSize: 28, fontWeight: 800 }}>{weekLeads.length}</div></div>
          <div style={cardStyle}><div style={{ fontSize: 12, color: "#64748B" }}>Conversion Rate</div><div style={{ fontSize: 22, fontWeight: 800 }}>{conversion}% — {paid} / {leads.length} nagbayad</div></div>
          <div style={cardStyle}><div style={{ fontSize: 12, color: "#64748B" }}>Lost Leads</div><div style={{ fontSize: 28, fontWeight: 800, color: "#EF4444" }}>{lost}</div></div>
        </div>

        <form onSubmit={handleSubmit} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>+ Add Lead (Owner)</h2>
          <input style={inputStyle} placeholder="Pangalan *" value={name} onChange={e => setName(e.target.value)} required />
          <input style={inputStyle} placeholder="Phone Number * - Hal. 09676706327" value={phone} onChange={e => setPhone(e.target.value)} required type="tel" />
          <input style={inputStyle} placeholder="FB Link (Optional) - Hal. facebook.com/rosa.castro" value={fbLink} onChange={e => setFbLink(e.target.value)} />
          <select style={inputStyle} value={service} onChange={e => setService(e.target.value)}>
            <option>Nail Extension</option><option>Softgel</option><option>Manicure / Pedicure</option><option>Lash Extension</option><option>Brow / Lash Lift</option><option>Hair / Makeup</option><option>Printing / Custom</option><option>Iba pa</option>
          </select>
          <select style={inputStyle} value={source} onChange={e => setSource(e.target.value)}>
            <option>Facebook</option><option>TikTok</option><option>Walk-in</option><option>【entity-Shopee¦canonical_name=Shopee】</option><option>Referral</option><option>Public Form</option>
          </select>
          <input style={inputStyle} placeholder="Budget" value={budget} onChange={e => setBudget(e.target.value)} type="number" />
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <button disabled={sending} type="submit" style={{ background: "#10B981", color: "white", border: "none", padding: 14, borderRadius: 12, fontWeight: 800, fontSize: 16, minHeight: 48 }}>{sending ? "Saving..." : "SAVE LEAD"}</button>
        </form>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="Search name / phone / service..." value={search} onChange={e => setSearch(e.target.value)} />
          <select style={{ ...inputStyle, width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option><option>Bagong Inquiry</option><option>Kinausap</option><option>Nag-Follow Up</option><option>Nagbayad</option><option>Dead</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? <p>Loading...</p> : filtered.length === 0 ? <p style={{ textAlign: "center", color: "#64748B" }}>Walang leads pa. Mag-add ka muna.</p> : filtered.map(l => {
            const badge = getBadge(l);
            return (
              <div key={l.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{l.name}</div>
                    <div style={{ fontSize: 13, color: "#334155" }}>{l.service} • {l.source}</div>
                    <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>📞 {l.phone}</div>
                    {l.fb_link && <a href={l.fb_link.startsWith("http") ? l.fb_link : `https://${l.fb_link}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#2563EB" }}>🔗 {l.fb_link}</a>}
                    <div style={{ fontSize: 12, color: "#64748B" }}>{new Date(l.created_at).toLocaleString()} • Budget: {l.budget ? `₱${l.budget}` : "—"}</div>
                    {l.notes && <div style={{ fontSize: 13, marginTop: 4 }}>📝 {l.notes}</div>}
                    {l.source === "Public Form" && <span style={{ fontSize: 11, background: "#DBEAFE", color: "#1D4ED8", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Galing sa Form</span>}
                  </div>
                  <button onClick={() => deleteLead(l.id)} style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 12 }}>Delete</button>
                </div>
                {badge && <div style={{ marginTop: 8, background: badge.color, color: "white", padding: "6px 10px", borderRadius: 8, fontWeight: 800, fontSize: 12, display: "inline-block" }}>{badge.text}</div>}
                <select value={l.status} onChange={e => updateStatus(l.id, e.target.value)} style={{ ...inputStyle, marginTop: 10 }}>
                  <option>Bagong Inquiry</option><option>Kinausap</option><option>Nag-Follow Up</option><option>Nagbayad</option><option>Dead</option>
                </select>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(`Hi ${l.name}! Kamusta, naka-receive kami ng inquiry mo for ${l.service}. Available ka pa ba?`)} style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>COPY: Follow-up</button>
                  <button onClick={() => navigator.clipboard.writeText(`Hi ${l.name}! Ready ka na ba magpa-book for ${l.service}?`)} style={{ background: "#FFF7ED", border: "1px solid #FDBA74", padding: "8px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>COPY: Book Now</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
