import { useState, useRef, useEffect, useCallback } from "react";

const STATUS_CYCLE = ["To Do", "In Progress", "Done"];
const STATUS_STYLE = {
  "To Do":       { dot: "#555",    label: "#aaa",    bg: "transparent",           border: "#333" },
  "In Progress": { dot: "#4af0c4", label: "#4af0c4", bg: "rgba(74,240,196,0.08)", border: "rgba(74,240,196,0.3)" },
  "Done":        { dot: "#3de8ff", label: "#3de8ff", bg: "rgba(61,232,255,0.08)", border: "rgba(61,232,255,0.3)" },
};
const VERTICAL_COLORS = ["#ff6b35", "#4e8ef7", "#c45ef5", "#f7c948", "#3de8ff", "#ff4e8e"];
const LABEL_COLORS    = ["#4af0c4", "#3de8ff", "#a78bfa", "#f7c948", "#ff6b35", "#4e8ef7"];

const STORAGE_KEY = "hcs-seasia-tracker-v1";

const DEFAULT_VERTICALS = [
  { id:1, title:"SFVC Production House", milestone:"", collapsed:false, subtasks:[
    { id:1, name:"Deck for SFVC to share to stakeholders",          assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"Company Operating Agreement Alignment/Solidification", assignee:"", due:"", status:"To Do", blocked:false },
    { id:3, name:"Search for the Pearl of Asia",                    assignee:"", due:"", status:"To Do", blocked:false },
  ]},
  { id:2, title:"Casting Agency for SFVC", milestone:"", collapsed:false, subtasks:[
    { id:1, name:"Casting Services (producer)",                     assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"Casting Services (actor)",                        assignee:"", due:"", status:"To Do", blocked:false },
    { id:3, name:"Create collage of actors available for casting",  assignee:"", due:"", status:"To Do", blocked:false },
  ]},
  { id:3, title:"Class Integration / Education", milestone:"", collapsed:false, subtasks:[
    { id:1, name:"Collaborate with accredited class/school integration for Visa offerings", assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"ESL Specialized Acting Classes for VIPs",         assignee:"", due:"", status:"To Do", blocked:false },
  ]},
];

function getMaxId(verts) {
  let max = 300;
  verts.forEach(v => { v.subtasks.forEach(s => { if (s.id > max) max = s.id; }); if (v.id > max) max = v.id; });
  return max;
}

let uid = 300;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const migrated = parsed.map(v => ({ collapsed: false, ...v }));
      uid = getMaxId(migrated) + 1;
      return migrated;
    }
  } catch {}
  return DEFAULT_VERTICALS;
}

function saveState(verts) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(verts)); } catch {}
}

function getProgress(subtasks) {
  if (!subtasks.length) return 0;
  const done   = subtasks.filter(t => t.status === "Done").length;
  const inprog = subtasks.filter(t => t.status === "In Progress").length;
  return Math.round(((done + inprog * 0.5) / subtasks.length) * 100);
}

function getRAG(subtasks) {
  const pct        = getProgress(subtasks);
  const hasOverdue = subtasks.some(s => s.due && s.status !== "Done" && new Date(s.due) < new Date());
  const hasBlocked = subtasks.some(s => s.blocked);
  if (hasOverdue || hasBlocked || pct === 0) return "R";
  if (pct >= 67) return "G";
  return "A";
}

const RAG_STYLE = {
  R: { color: "#ff5f5f", label: "AT RISK" },
  A: { color: "#4af0c4", label: "IN PROGRESS" },
  G: { color: "#3de8ff", label: "ON TRACK" },
};

function InlineEdit({ value, placeholder, onChange, bright }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  const ref                   = useRef(null);
  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  const commit = () => { setEditing(false); onChange(val); };
  if (editing) return (
    <input ref={ref} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(value); setEditing(false); } }}
      style={{ background:"#111", border:"1px solid #333", color:"#fff", fontFamily:"'Barlow', sans-serif",
               fontSize:"13px", padding:"3px 7px", borderRadius:"3px", outline:"none", width:"100%",
               boxSizing:"border-box" }} />
  );
  return (
    <span title={value || placeholder}
      onClick={() => setEditing(true)}
      style={{ cursor:"text", color: value ? (bright || "#fff") : "#444", fontSize:"13px",
               fontFamily:"'Barlow', sans-serif", display:"block", overflow:"hidden",
               textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>
      {value || placeholder}
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLE[status];
  return (
    <button onClick={onClick} title="Cycle status"
      style={{ display:"flex", alignItems:"center", gap:"5px", background:s.bg,
               border:"1px solid "+s.border, borderRadius:"4px", padding:"3px 8px",
               cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:"11px", color:s.label,
                     fontWeight:600, letterSpacing:"0.06em" }}>{status.toUpperCase()}</span>
    </button>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ height:"4px", background:"#1a1a1a", borderRadius:"2px", overflow:"hidden" }}>
      <div style={{ height:"100%", width:pct+"%", background:color, borderRadius:"2px",
                    transition:"width 0.35s", boxShadow:"0 0 10px "+color+"66" }} />
    </div>
  );
}

function ColLabel({ children, color }) {
  return (
    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", fontWeight:700,
                   color:color, letterSpacing:"0.16em" }}>{children}</span>
  );
}

function exportToCSV(verts) {
  const rows = [["Vertical","Milestone","Task","Assignee","Due Date","Status","Blocked","Progress %"]];
  verts.forEach(v => {
    const pct = getProgress(v.subtasks);
    v.subtasks.forEach(s => {
      rows.push([
        '"'+v.title+'"',
        '"'+v.milestone+'"',
        '"'+s.name+'"',
        '"'+s.assignee+'"',
        '"'+s.due+'"',
        '"'+s.status+'"',
        s.blocked ? "Yes" : "No",
        pct+"%",
      ]);
    });
  });
  const csv  = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "hcs-seasia-roadmap.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [verts, setVerts]               = useState(loadState);
  const [showWorkload, setShowWorkload] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [dragInfo, setDragInfo]         = useState(null);

  useEffect(() => { saveState(verts); }, [verts]);

  const updateSub = (vi, si, field, val) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => j!==si ? s : { ...s, [field]:val })
    }));

  const cycleStatus = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => {
        if (j!==si) return s;
        const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(s.status)+1) % STATUS_CYCLE.length];
        return { ...s, status:next };
      })
    }));

  const toggleBlocked = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => j!==si ? s : { ...s, blocked:!s.blocked })
    }));

  const addSub = (vi) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: [...v.subtasks, { id:++uid, name:"New Subtask", assignee:"", due:"", status:"To Do", blocked:false }]
    }));

  const removeSub = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.filter((_,j) => j!==si)
    }));

  const updateTitle = (vi, val) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : { ...v, title:val }));

  const updateMilestone = (vi, val) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : { ...v, milestone:val }));

  const toggleCollapse = (vi) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : { ...v, collapsed:!v.collapsed }));

  const addVertical = () =>
    setVerts(prev => [...prev, {
      id: ++uid, title:"New Vertical", milestone:"", collapsed:false,
      subtasks:[{ id:++uid, name:"New Task", assignee:"", due:"", status:"To Do", blocked:false }]
    }]);

  const removeVertical = (vi) => {
    if (!window.confirm("Remove this entire vertical and all its tasks?")) return;
    setVerts(prev => prev.filter((_,i) => i!==vi));
  };

  const onDragStart = useCallback((vi, si) => setDragInfo({ vi, si }), []);
  const onDragOver  = useCallback((e, vi, si) => {
    e.preventDefault();
    if (!dragInfo || (dragInfo.vi === vi && dragInfo.si === si)) return;
    setVerts(prev => {
      if (dragInfo.vi !== vi) return prev;
      const newVerts = prev.map((v,i) => {
        if (i !== vi) return v;
        const subs = [...v.subtasks];
        const [moved] = subs.splice(dragInfo.si, 1);
        subs.splice(si, 0, moved);
        return { ...v, subtasks: subs };
      });
      setDragInfo({ vi, si });
      return newVerts;
    });
  }, [dragInfo]);
  const onDragEnd = useCallback(() => setDragInfo(null), []);

  const workloadMap = {};
  verts.forEach((v, vi) => {
    v.subtasks.forEach(s => {
      const who = (s.assignee || "").trim();
      if (!who) return;
      if (!workloadMap[who]) workloadMap[who] = [];
      workloadMap[who].push({ vertical:v.title, name:s.name, status:s.status, color:VERTICAL_COLORS[vi % VERTICAL_COLORS.length] });
    });
  });
  const workloadEntries = Object.entries(workloadMap).sort((a,b) => b[1].length - a[1].length);

  const totalTasks = verts.reduce((a,v) => a + v.subtasks.length, 0);
  const doneTasks  = verts.reduce((a,v) => a + v.subtasks.filter(s=>s.status==="Done").length, 0);
  const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const today = new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}).toUpperCase();
  const STATUS_FILTERS = ["All", "To Do", "In Progress", "Done", "Blocked", "Overdue"];

  const CSS = [
    "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap');",
    "* { box-sizing:border-box; margin:0; padding:0; }",
    ".row:hover { background:rgba(255,255,255,0.04) !important; }",
    ".row:hover .del { opacity:1 !important; }",
    ".drag-handle { cursor:grab; opacity:0.3; font-size:14px; padding:0 4px; user-select:none; }",
    ".drag-handle:hover { opacity:0.8; }",
    ".vert-card { background:#0a0a0a; border-radius:6px; overflow:hidden; display:flex; flex-direction:column; }",
    ".filter-btn { background:transparent; border:1px solid #222; color:#666; padding:4px 10px; border-radius:3px; cursor:pointer; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:0.08em; transition:all 0.15s; }",
    ".filter-btn.active { color:#fff; border-color:#4af0c4; background:rgba(74,240,196,0.1); }",
    ".filter-btn:hover { border-color:#555; color:#aaa; }",
    ".add-vert-btn { background:transparent; border:1px dashed #333; color:#555; padding:8px 18px; border-radius:4px; cursor:pointer; font-family:'Barlow Condensed'; font-size:12px; font-weight:700; letter-spacing:0.1em; transition:all 0.2s; white-space:nowrap; }",
    ".add-vert-btn:hover { border-color:#4af0c4; color:#4af0c4; }",
    ".export-btn { background:transparent; border:1px solid #333; color:#666; padding:6px 14px; border-radius:3px; cursor:pointer; font-family:'Barlow Condensed'; font-size:11px; font-weight:700; letter-spacing:0.1em; transition:all 0.15s; }",
    ".export-btn:hover { border-color:#3de8ff; color:#3de8ff; }",
    "@media (max-width:900px) { .vert-grid { grid-template-columns:1fr !important; } .header-row { flex-direction:column; gap:12px; align-items:flex-start !important; } }",
  ].join("\n");

  return (
    <div style={{ minHeight:"100vh", background:"#000", padding:"28px 22px", fontFamily:"'Barlow', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"28px", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#4af0c4", letterSpacing:"0.15em", marginBottom:"6px" }}>HCS OPERATIONS · {today}</div>
          <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:"32px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.04em", lineHeight:1 }}>SE Asia Expansion</h1>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"12px", color:"#4af0c4", letterSpacing:"0.12em", marginTop:"4px" }}>STRATEGIC ROADMAP</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"8px" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#4af0c4", letterSpacing:"0.15em", marginBottom:"2px" }}>OVERALL PROGRESS</div>
            <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"38px", fontWeight:700, color:"#fff", lineHeight:1 }}>{overallPct}<span style={{ fontSize:"18px", color:"#4af0c4" }}>%</span></div>
            <div style={{ fontFamily:"'Barlow'", fontSize:"12px", color:"#aaa", marginTop:"2px" }}>{doneTasks} of {totalTasks} tasks complete</div>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button className="export-btn" onClick={() => exportToCSV(verts)}>⬇ EXPORT CSV</button>
            <button className="add-vert-btn" onClick={addVertical}>+ ADD VERTICAL</button>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", color:"#555", letterSpacing:"0.12em", marginRight:"4px" }}>FILTER:</span>
        {STATUS_FILTERS.map(f => (
          <button key={f} className={"filter-btn"+(filterStatus===f?" active":"")} onClick={() => setFilterStatus(f)}>{f.toUpperCase()}</button>
        ))}
      </div>

      <div className="vert-grid" style={{ display:"grid", gridTemplateColumns:"repeat("+Math.min(verts.length,3)+",1fr)", gap:"14px", marginBottom:"20px" }}>
        {verts.map((v, vi) => {
          const pct   = getProgress(v.subtasks);
          const color = VERTICAL_COLORS[vi % VERTICAL_COLORS.length];
          const lc    = LABEL_COLORS[vi % LABEL_COLORS.length];
          const done  = v.subtasks.filter(s => s.status==="Done").length;
          const rag   = getRAG(v.subtasks);
          const r     = RAG_STYLE[rag];
          const filteredSubs = v.subtasks.filter(s => {
            if (filterStatus === "All") return true;
            if (filterStatus === "Blocked") return s.blocked;
            if (filterStatus === "Overdue") return s.due && s.status !== "Done" && new Date(s.due) < new Date();
            return s.status === filterStatus;
          });
          return (
            <div key={v.id} className="vert-card" style={{ border:"1px solid "+color+"44", borderLeft:"3px solid "+color }}>
              <div style={{ background:color+"0d", padding:"14px 16px", borderBottom:"1px solid "+color+"22" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <InlineEdit value={v.title} placeholder="Vertical title" onChange={val => updateTitle(vi, val)} bright={color} />
                  <div style={{ display:"flex", gap:"6px", alignItems:"center", flexShrink:0, marginLeft:"8px" }}>
                    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", fontWeight:700, color:r.color, letterSpacing:"0.1em", background:r.color+"18", border:"1px solid "+r.color, borderRadius:"3px", padding:"2px 6px" }}>{r.label}</span>
                    <button onClick={() => toggleCollapse(vi)} title={v.collapsed?"Expand":"Collapse"} style={{ background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:"14px", padding:"0 2px", lineHeight:1 }}>{v.collapsed ? "▶" : "▼"}</button>
                    <button onClick={() => removeVertical(vi)} title="Remove vertical" style={{ background:"none", border:"none", color:"#333", cursor:"pointer", fontSize:"16px", padding:"0 2px", lineHeight:1, transition:"color 0.15s" }} onMouseEnter={e=>e.target.style.color="#ff5f5f"} onMouseLeave={e=>e.target.style.color="#333"}>×</button>
                  </div>
                </div>
                <Bar pct={pct} color={color} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
                  <span style={{ fontFamily:"'Barlow'", fontSize:"12px", color:"#fff" }}><span style={{ fontWeight:600 }}>{pct}%</span> complete</span>
                  <span style={{ fontFamily:"'Barlow'", fontSize:"12px", color:"#666" }}>{done}/{v.subtasks.length} done</span>
                </div>
              </div>
              {v.collapsed && (<div style={{ padding:"10px 16px", color:"#555", fontFamily:"'Barlow'", fontSize:"12px", fontStyle:"italic", textAlign:"center" }}>{v.subtasks.length} tasks hidden · click ▶ to expand</div>)}
              {!v.collapsed && (
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 16px", borderBottom:"1px solid "+color+"22", background:"rgba(0,0,0,0.3)" }}>
                    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", fontWeight:700, color:lc, letterSpacing:"0.12em" }}>MILESTONE</span>
                    <input type="date" value={v.milestone} onChange={e => updateMilestone(vi, e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid "+color+"33", color: v.milestone ? "#fff" : "#444", cursor:"pointer", fontFamily:"'Barlow'", fontSize:"12px", outline:"none", flex:1, colorScheme:"dark" }} />
                    {v.milestone && (<span style={{ fontFamily:"'Barlow'", fontSize:"11px", color:lc }}>TARGET: {new Date(v.milestone+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>)}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"16px 1fr 72px 88px 82px 20px", gap:"6px", padding:"6px 16px", borderBottom:"1px solid "+color+"22" }}>
                    <span /><ColLabel color={lc}>TASK</ColLabel><ColLabel color={lc}>WHO</ColLabel><ColLabel color={lc}>DUE</ColLabel><ColLabel color={lc}>STATUS</ColLabel><span />
                  </div>
                  {filteredSubs.length === 0 && (<div style={{ padding:"14px 16px", color:"#444", fontFamily:"'Barlow'", fontSize:"12px", fontStyle:"italic", textAlign:"center" }}>No tasks match this filter.</div>)}
                  {filteredSubs.map((s) => {
                    const si = v.subtasks.indexOf(s);
                    const isOverdue = s.due && s.status !== "Done" && new Date(s.due) < new Date();
                    const isDragging = dragInfo && dragInfo.vi===vi && dragInfo.si===si;
                    return (
                      <div key={s.id} className="row" draggable onDragStart={() => onDragStart(vi, si)} onDragOver={e => onDragOver(e, vi, si)} onDragEnd={onDragEnd}
                        style={{ display:"grid", gridTemplateColumns:"16px 1fr 72px 88px 82px 20px", gap:"6px", alignItems:"center", padding:"8px 16px", borderBottom:"1px solid #111", background: s.blocked ? "rgba(255,95,95,0.04)" : isOverdue ? "rgba(255,107,53,0.04)" : "transparent", opacity: isDragging ? 0.4 : 1, transition:"opacity 0.15s" }}>
                        <span className="drag-handle" title="Drag to reorder">⠇</span>
                        <div style={{ display:"flex", alignItems:"center", gap:"5px", minWidth:0 }}>
                          <button className="del" onClick={() => removeSub(vi, si)} style={{ opacity:0, background:"none", color:"#ff5f5f", cursor:"pointer", fontSize:"15px", lineHeight:1, padding:0, flexShrink:0, border:"none", transition:"opacity 0.15s" }}>×</button>
                          <InlineEdit value={s.name} placeholder="task name" onChange={val => updateSub(vi, si, "name", val)} />
                        </div>
                        <InlineEdit value={s.assignee} placeholder="—" onChange={val => updateSub(vi, si, "assignee", val)} bright={lc} />
                        <input type="date" value={s.due} onChange={e => updateSub(vi, si, "due", e.target.value)} style={{ background:"transparent", border:"none", borderBottom:"1px solid "+(isOverdue?"#ff5f5f":"#333"), color: isOverdue ? "#ff5f5f" : s.due ? "#fff" : "#444", fontFamily:"'Barlow'", fontSize:"12px", outline:"none", width:"100%", cursor:"pointer", colorScheme:"dark" }} />
                        <StatusBadge status={s.status} onClick={() => cycleStatus(vi, si)} />
                        <button onClick={() => toggleBlocked(vi, si)} title={s.blocked?"Unblock":"Flag blocked"} style={{ opacity: s.blocked ? 1 : 0.2, background:"none", border:"none", cursor:"pointer", fontSize:"13px", padding:0, color:"#ff5f5f", transition:"opacity 0.15s" }}>⊘</button>
                      </div>
                    );
                  })}
                  <button onClick={() => addSub(vi)} style={{ background:"transparent", border:"none", color:lc, cursor:"pointer", fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", padding:"10px 16px", display:"block", width:"100%", textAlign:"left", transition:"opacity 0.15s" }} onMouseEnter={e=>e.target.style.opacity="0.7"} onMouseLeave={e=>e.target.style.opacity="1"}>+ ADD SUBTASK</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:"8px", marginBottom:"16px" }}>
        <button onClick={() => setShowWorkload(!showWorkload)} style={{ background:"transparent", border:"1px solid #1e1e1e", color:"#555", padding:"7px 14px", borderRadius:"3px", cursor:"pointer", fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, letterSpacing:"0.1em", transition:"all 0.15s" }} onMouseEnter={e=>e.currentTarget.style.borderColor="#333"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e1e"}>{showWorkload?"▲":"▼"} SHOW OWNER WORKLOAD</button>
        {showWorkload && (
          <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:"1px solid #141414" }}>
            {workloadEntries.length === 0 ? <div style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#aaa" }}>No assignees set. Add names to the WHO column above.</div>
              : workloadEntries.map(([who, tasks]) => (
                <div key={who} style={{ marginBottom:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"15px", fontWeight:700, color:"#fff" }}>{who}</span>
                    <span style={{ fontFamily:"'Barlow'", fontSize:"12px", color:"#aaa" }}>{tasks.length} task{tasks.length!==1?"s":""}</span>
                    <div style={{ flex:1, height:"1px", background:"#1a1a1a" }} />
                  </div>
                  {tasks.map((t, ti) => (
                    <div key={ti} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"6px 0", borderBottom:"1px solid #0f0f0f" }}>
                      <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:t.color, flexShrink:0 }} />
                      <span style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#fff", flex:1 }}>{t.name}</span>
                      <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#aaa" }}>{t.vertical}</span>
                      <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:STATUS_STYLE[t.status].label, fontWeight:700 }}>{t.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:"20px", paddingTop:"14px", borderTop:"1px solid #141414", alignItems:"center", flexWrap:"wrap" }}>
        {STATUS_CYCLE.map(s => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:STATUS_STYLE[s].dot }} />
            <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, color:"#aaa", letterSpacing:"0.08em" }}>{s.toUpperCase()}</span>
          </div>
        ))}
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#ff5f5f", fontWeight:700 }}>⊘ BLOCKED</span>
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#ff6b35", fontWeight:700 }}>! OVERDUE</span>
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", color:"#333", letterSpacing:"0.08em", marginLeft:"auto" }}>CLICK STATUS TO CYCLE · CLICK ANY FIELD TO EDIT · DRAG ⠇ TO REORDER · HOVER ROW TO DELETE</span>
      </div>
    </div>
  );
}
