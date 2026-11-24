
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, Lead } from "@/lib/supabase";

const STATUSES = ["Bagong Inquiry","Kinausap","Nag-Follow Up","Nagbayad","Dead / Hindi Nag-reply"];
const SERVICES = ["Hair Rebond","Lash Extensions","Nail Extension","Facial","Hair Color","Manicure/Pedicure","Iba pa"];
const SOURCES = ["Facebook","TikTok","Walk-in","Shopee","Referral","Public Form"];
const DEMO: Lead[] = [
  {id:"d1",name:"Maria Santos",phone:"0917-123-4567",service:"Lash Extensions",source:"Facebook",budget:1500,notes:"Gusto bukas ng hapon",status:"Bagong Inquiry",created_at:new Date(Date.now()-30*60000).toISOString()},
  {id:"d2",name:"Juan Dela Cruz",phone:"0928-987-6543",service:"Hair Rebond",source:"TikTok",budget:2500,notes:"",status:"Bagong Inquiry",created_at:new Date(Date.now()-3*3600000).toISOString()},
  {id:"d3",name:"Angel Reyes",phone:"0905-111-2222",service:"Nail Extension",source:"Shopee",budget:1200,notes:"",status:"Kinausap",created_at:new Date(Date.now()-26*3600000).toISOString()},
  {id:"d4",name:"Kathleen Lim",phone:"0919-333-4444",service:"Facial",source:"Referral",budget:1800,notes:"",status:"Kinausap",created_at:new Date(Date.now()-2*86400000).toISOString()},
  {id:"d5",name:"Jessa Villanueva",phone:"0933-555-6666",service:"Hair Color",source:"Facebook",budget:3000,notes:"",status:"Nag-Follow Up",created_at:new Date(Date.now()-1*86400000).toISOString()},
  {id:"d6",name:"Rica Mendoza",phone:"0916-777-8888",service:"Lash Extensions",source:"Walk-in",budget:1500,notes:"",status:"Nagbayad",created_at:new Date(Date.now()-1*86400000).toISOString()},
  {id:"d7",name:"Paolo Garcia",phone:"0922-999-0000",service:"Hair Rebond",source:"Facebook",budget:2500,notes:"",status:"Nagbayad",created_at:new Date(Date.now()-3*86400000).toISOString()},
  {id:"d8",name:"Mika Torres",phone:"0956-222-3333",service:"Facial",source:"TikTok",budget:1800,notes:"No reply 3 days",status:"Dead / Hindi Nag-reply",created_at:new Date(Date.now()-4*86400000).toISOString()},
];

function timeAgo(iso:string){
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000); const hrs = Math.floor(diff/3600000); const days = Math.floor(diff/86400000);
  if(mins<60) return mins<=1?"just now":`${mins} mins ago`;
  if(hrs<24) return `${hrs} hr${hrs>1?"s":""} ago`;
  return `${days} day${days>1?"s":""} ago`;
}
function hoursSince(iso:string){ return (Date.now()-new Date(iso).getTime())/3600000; }

function App(){
  const params = useSearchParams();
  const isInquire = params.get("view")==="inquire";
  const [leads,setLeads] = useState<Lead[]>([]);
  const [loading,setLoading] = useState(true);
  const [pin,setPin] = useState("");
  const [unlocked,setUnlocked] = useState(false);
  const [savedPin,setSavedPin] = useState("1234");
  const [search,setSearch] = useState("");
  const [filter,setFilter] = useState("All");
  const [toast,setToast] = useState("");
  const [selected,setSelected] = useState<Lead|null>(null);
  const [copied,setCopied] = useState("");
  // forms
  const [f,setF] = useState({name:"",phone:"",service:"",source:"Facebook",budget:"",notes:""});
  const [pf,setPf] = useState({name:"",phone:"",service:"Lash Extensions",budget:"",notes:""});
  const [pfDone,setPfDone] = useState("");

  useEffect(()=>{ const p = localStorage.getItem("lcp_pin"); if(p) setSavedPin(p); if(localStorage.getItem("lcp_unlocked")==="1") setUnlocked(true); },[]);
  async function fetchLeads(){
    const {data,error} = await supabase.from("leads").select("*").order("created_at",{ascending:false});
    if(error){ setLeads(DEMO); } else if(!data||data.length===0){ setLeads(DEMO); } else setLeads(data as Lead[]);
    setLoading(false);
  }
  useEffect(()=>{ fetchLeads();
    const ch = supabase.channel("leads-ch").on("postgres_changes",{event:"*",schema:"public",table:"leads"},()=>{ fetchLeads(); }).subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  },[]);

  function showToast(m:string){ setToast(m); setTimeout(()=>setToast(""),3000); }
  async function saveLead(e:any){
    e.preventDefault(); if(!f.name.trim()) return alert("Lagay mo muna name");
    const payload = {name:f.name,phone:f.phone,service:f.service||"General Inquiry",source:f.source,budget:f.budget?Number(f.budget):null,notes:f.notes,status:"Bagong Inquiry"};
    const {error} = await supabase.from("leads").insert(payload);
    if(error){ setLeads(prev=>[{...payload,id:"tmp"+Date.now(),created_at:new Date().toISOString(),budget:payload.budget} as Lead,...prev]); }
    setF({name:"",phone:"",service:"",source:"Facebook",budget:"",notes:""}); showToast(`Na-save na si ${payload.name}!`); fetchLeads();
  }
  async function submitPublic(e:any){
    e.preventDefault(); if(!pf.name.trim()||!pf.phone.trim()) return alert("Name at Phone kailangan");
    const payload = {name:pf.name,phone:pf.phone,service:pf.service,source:"Public Form",budget:pf.budget?Number(pf.budget):null,notes:pf.notes,status:"Bagong Inquiry"};
    const {error} = await supabase.from("leads").insert(payload);
    if(error) return alert("May error. Try ulit o i-message mo kami directly. Error: "+error.message);
    setPfDone(pf.name); setPf({name:"",phone:"",service:"Lash Extensions",budget:"",notes:""});
  }
  async function updateStatus(lead:Lead,status:string){
    await supabase.from("leads").update({status}).eq("id",lead.id);
    setLeads(prev=>prev.map(l=>l.id===lead.id?{...l,status}:l));
  }
  async function deleteLead(id:string){ if(!confirm("Delete tong lead na to?")) return; await supabase.from("leads").delete().eq("id",id); setLeads(prev=>prev.filter(l=>l.id!==id)); }

  // PUBLIC FORM
  if(isInquire){
    if(pfDone) return (<div className="max-w-md mx-auto p-6 text-center pt-20"><div className="text-6xl mb-4">✅</div><h1 className="text-2xl font-bold">Na-receive na! Salamat {pfDone}!</h1><p className="mt-3 text-slate-600">Mag-message kami sa&apos;yo within 1 hour.</p><button onClick={()=>setPfDone("")} className="mt-6 w-full bg-[#10B981] text-white rounded-xl font-bold py-4">Mag-fill up ulit</button><p className="text-xs text-slate-400 mt-6">Hindi namin isi-share ang info mo.</p></div>);
    return (<div className="max-w-md mx-auto p-5 pb-20">
      <div className="text-center mt-6"><h1 className="text-3xl font-extrabold">Book / Mag-Inquire</h1><p className="text-slate-600 mt-2">Fill up lang, mag-message kami sa&apos;yo agad!</p></div>
      <form onSubmit={submitPublic} className="mt-6 space-y-4">
        <div><label className="font-bold">Pangalan *</label><input required value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})} placeholder="Juan Dela Cruz" className="w-full border rounded-xl p-4 mt-1"/></div>
        <div><label className="font-bold">Phone / FB Name *</label><input required value={pf.phone} onChange={e=>setPf({...pf,phone:e.target.value})} placeholder="0917-XXX-XXXX o FB Name" className="w-full border rounded-xl p-4 mt-1"/></div>
        <div><label className="font-bold">Anong service gusto mo?</label><select value={pf.service} onChange={e=>setPf({...pf,service:e.target.value})} className="w-full border rounded-xl p-4 mt-1">{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label className="font-bold">Budget (optional)</label><input type="number" value={pf.budget} onChange={e=>setPf({...pf,budget:e.target.value})} placeholder="1500" className="w-full border rounded-xl p-4 mt-1"/></div>
        <div><label className="font-bold">Notes / Gusto mong oras?</label><textarea value={pf.notes} onChange={e=>setPf({...pf,notes:e.target.value})} placeholder="Gusto ko bukas ng hapon..." className="w-full border rounded-xl p-4 mt-1"/></div>
        <button className="w-full bg-[#10B981] text-white rounded-xl font-bold text-lg py-4">SEND INQUIRY</button>
        <p className="text-center text-xs text-slate-400">Hindi namin isi-share ang info mo.</p>
      </form>
    </div>);
  }

  // PIN GATE
  if(!unlocked) return (<div className="max-w-sm mx-auto p-6 pt-24 text-center"><h1 className="text-2xl font-extrabold">Lead Catcher PH</h1><p className="text-slate-600 mt-1">Owner Dashboard - Enter PIN</p><input type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" className="w-full border rounded-xl p-4 mt-6 text-center text-2xl tracking-widest"/><button onClick={()=>{ if(pin===savedPin){ setUnlocked(true); localStorage.setItem("lcp_unlocked","1"); } else alert("Mali yung PIN, try ulit."); }} className="w-full bg-[#10B981] text-white rounded-xl font-bold py-4 mt-3">UNLOCK</button><p className="text-xs text-slate-400 mt-3">Default PIN: 1234 - palitan mo sa dashboard footer</p></div>);

  const today = leads.filter(l=> new Date(l.created_at).toDateString()===new Date().toDateString());
  const week = leads.filter(l=> Date.now()-new Date(l.created_at).getTime() < 7*86400000);
  const paid = leads.filter(l=>l.status==="Nagbayad").length;
  const conv = leads.length? Math.round(paid/leads.length*100):0;
  const lost = leads.filter(l=>l.status.startsWith("Dead")).length;
  const filtered = leads.filter(l=>{
    const q = search.toLowerCase();
    const match = !q || l.name.toLowerCase().includes(q) || l.service.toLowerCase().includes(q) || l.phone.toLowerCase().includes(q);
    const st = filter==="All" || l.status===filter;
    return match && st;
  }).sort((a,b)=>{
    const urg = (l:Lead)=> (l.status==="Kinausap"&&hoursSince(l.created_at)>24)?2 : (l.status==="Bagong Inquiry"&&hoursSince(l.created_at)>2)?1:0;
    return urg(b)-urg(a) || new Date(b.created_at).getTime()-new Date(a.created_at).getTime();
  });

  return (<div className="max-w-2xl mx-auto p-4 pb-24">
    <header className="pt-2"><h1 className="text-2xl font-extrabold">Lead Catcher <span className="text-[#10B981]">- Walang Lead na Mawawala</span></h1><p className="text-slate-600">50 inquiries? Lahat naka-save, lahat may follow-up.</p></header>
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-4 text-sm"><b>Customer Link mo:</b> add <code>?view=inquire</code> sa dulo ng Vercel link mo. Hal: your-app.vercel.app/?view=inquire - i-send sa Messenger / FB Bio / TikTok Bio</div>
    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Total Leads Today</p><p className="text-3xl font-extrabold">{today.length}</p></div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Total This Week</p><p className="text-3xl font-extrabold">{week.length}</p></div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Conversion Rate</p><p className="text-3xl font-extrabold text-[#10B981]">{conv}%</p><p className="text-xs">{paid} / {leads.length} nagbayad</p></div>
      <div className="bg-white border rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Lost Leads</p><p className="text-3xl font-extrabold text-red-500">{lost}</p></div>
    </div>
    {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white px-4 py-3 rounded-full z-50 text-sm shadow-lg">{toast}</div>}
    <form onSubmit={saveLead} className="bg-white border rounded-2xl p-4 mt-4 shadow-sm space-y-3">
      <h2 className="font-extrabold text-lg">+ Add Lead (Owner)</h2>
      <input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Name *" className="w-full border rounded-xl p-4"/>
      <input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} placeholder="Phone / FB Name" className="w-full border rounded-xl p-4"/>
      <input value={f.service} onChange={e=>setF({...f,service:e.target.value})} placeholder="Service Interested" className="w-full border rounded-xl p-4"/>
      <div className="flex gap-3"><select value={f.source} onChange={e=>setF({...f,source:e.target.value})} className="flex-1 border rounded-xl p-4">{SOURCES.map(s=><option key={s}>{s}</option>)}</select><input type="number" value={f.budget} onChange={e=>setF({...f,budget:e.target.value})} placeholder="Budget ₱" className="flex-1 border rounded-xl p-4"/></div>
      <textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Notes" className="w-full border rounded-xl p-4"/>
      <button className="w-full bg-[#10B981] text-white rounded-xl font-bold text-lg py-4">SAVE LEAD</button>
    </form>
    <div className="flex gap-2 mt-5"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name / service..." className="flex-1 border rounded-xl p-4"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="border rounded-xl p-4"><option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select><button onClick={fetchLeads} className="border rounded-xl px-4 font-bold">REFRESH</button></div>
    <div className="mt-4 space-y-3">{loading?<p className="text-center text-slate-400 py-8">Loading...</p>:filtered.length===0?<p className="text-center text-slate-400 py-8">Walang lead dito. Add ka muna.</p>:filtered.map(l=>{
      const isFollow = l.status==="Kinausap" && hoursSince(l.created_at)>24;
      const isReply = l.status==="Bagong Inquiry" && hoursSince(l.created_at)>2;
      return (<div key={l.id} className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between gap-2"><div><p className="font-extrabold text-lg">{l.name}</p><p className="text-sm text-slate-600">{l.service} • {l.phone}</p></div><span className="text-xs bg-slate-100 rounded-full px-3 py-1 h-fit">{l.source}</span></div>
        {l.source==="Public Form" && <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-1 font-bold">Galing sa Form</span>}
        {isFollow && <div className="mt-2 bg-red-100 text-red-700 font-bold text-sm rounded-lg px-3 py-2">🔴 FOLLOW-UP NA! - {timeAgo(l.created_at)}</div>}
        {isReply && <div className="mt-2 bg-orange-100 text-orange-700 font-bold text-sm rounded-lg px-3 py-2">🟡 REPLY AGAD!</div>}
        <div className="flex justify-between text-sm mt-3"><span>Budget: <b>{l.budget?`₱${Number(l.budget).toLocaleString()}`:"-"}</b></span><span className="text-slate-500">{timeAgo(l.created_at)}</span></div>
        {l.notes && <p className="text-sm text-slate-600 mt-1">Notes: {l.notes}</p>}
        <div className="flex gap-2 mt-3"><select value={l.status} onChange={e=>updateStatus(l,e.target.value)} className="flex-1 border rounded-xl p-3 font-bold">{STATUSES.map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>setSelected(l)} className="bg-[#0F172A] text-white rounded-xl px-4 font-bold">Message</button><button onClick={()=>deleteLead(l.id)} className="border rounded-xl px-3 text-red-500">✕</button></div>
      </div>);
    })}</div>
    <footer className="mt-8 text-center text-sm text-slate-500"><button onClick={()=>{ const np = prompt("Bagong PIN (4 digits):",savedPin); if(np){ setSavedPin(np); localStorage.setItem("lcp_pin",np); showToast("PIN updated!"); } }} className="underline">Palitan PIN</button> • <button onClick={()=>{ localStorage.removeItem("lcp_unlocked"); setUnlocked(false); }} className="underline">Lock Dashboard</button></footer>
    {selected && <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={()=>setSelected(null)}><div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-auto" onClick={e=>e.stopPropagation()}>
      <div className="flex justify-between"><h3 className="font-extrabold text-lg">Message kay {selected.name}</h3><button onClick={()=>setSelected(null)} className="text-xl px-2">✕</button></div>
      {[
        {t:"Template 1 - First Reply", m:`Hi ${selected.name}! Salamat sa pag-inquire about ${selected.service}. Available pa po kami. Gusto niyo po ba i-reserve ko kayo?`},
        {t:"Template 2 - Follow-up 24h", m:`Hi ${selected.name}! Follow-up ko lang po yung inquiry niyo kahapon. May slot pa po kami bukas, gusto niyo po ba?`},
        {t:"Template 3 - Closing", m:`Hi ${selected.name}! Last 2 slots na lang po for this week. I-reserve ko na po ba kayo?`},
      ].map((tpl,i)=>(<div key={i} className="border rounded-2xl p-4 mt-3"><p className="font-bold text-sm">{tpl.t}</p><p className="text-sm mt-1 text-slate-700">{tpl.m}</p><button onClick={()=>{ navigator.clipboard.writeText(tpl.m); setCopied(tpl.t); setTimeout(()=>setCopied(""),2000); }} className="w-full bg-[#10B981] text-white rounded-xl font-bold py-3 mt-3">{copied===tpl.t?"Na-copy na! ✅":"COPY"}</button></div>))}
    </div></div>}
  </div>);
}
export default function Page(){ return <Suspense><App/></Suspense>; }
