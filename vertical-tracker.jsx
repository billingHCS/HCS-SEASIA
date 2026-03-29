import { useState, useRef, useEffect } from "react";

const STATUS_CYCLE = ["To Do", "In Progress", "Done"];
const STATUS_STYLE = {
  "To Do":       { dot: "#555",    label: "#aaa",    bg: "transparent",            border: "#333" },
  "In Progress": { dot: "#4af0c4", label: "#4af0c4", bg: "rgba(74,240,196,0.08)",  border: "rgba(74,240,196,0.3)" },
  "Done":        { dot: "#3de8ff", label: "#3de8ff", bg: "rgba(61,232,255,0.08)",  border: "rgba(61,232,255,0.3)" },
};
const VERTICAL_COLORS = ["#ff6b35", "#4e8ef7", "#c45ef5"];
const LABEL_COLORS = ["#4af0c4", "#3de8ff", "#a78bfa"];

let uid = 300;

const INITIAL_VERTICALS = [
  { id:1, title:"SFVC Production House", milestone:"", subtasks:[
    { id:1, name:"Deck for SFVC to share to stakeholders", assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"Company Operating Agreement Alignment/Solidification", assignee:"", due:"", status:"To Do", blocked:false },
  ]},
  { id:2, title:"Casting Agency for SFVC", milestone:"", subtasks:[
    { id:1, name:"Casting Services (producer)", assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"Casting Services (actor)", assignee:"", due:"", status:"To Do", blocked:false },
    { id:3, name:"Create collage of actors available for casting", assignee:"", due:"", status:"To Do", blocked:false },
  ]},
  { id:3, title:"Class Integration / Education", milestone:"", subtasks:[
    { id:1, name:"Collaborate with accredited class/school integration for Visa offerings", assignee:"", due:"", status:"To Do", blocked:false },
    { id:2, name:"ESL Specialized Acting Classes for VIPs", assignee:"", due:"", status:"To Do", blocked:false },
  ]},
];

function getProgress(subtasks) {
  if (!subtasks.length) return 0;
  const done = subtasks.filter(t => t.status === "Done").length;
  const inprog = subtasks.filter(t => t.status === "In Progress").length;
  return Math.round(((done + inprog * 0.5) / subtasks.length) * 100);
}

function getRAG(subtasks) {
  const pct = getProgress(subtasks);
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
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  const commit = () => { setEditing(false); onChange(val); };
  if (editing) return (
    <input ref={ref} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key==="Enter") commit(); if (e.key==="Escape") setEditing(false); }}
      style={{ background:"#111", border:"1px solid #333", color:"#fff", fontFamily:"'Barlow', sans-serif", fontSize:"13px", padding:"3px 7px", borderRadius:"3px", outline:"none", width:"100%" }}
    />
  );
  return (
    <span onClick={() => setEditing(true)} title="Click to edit"
      style={{ cursor:"text", color: val ? "#fff" : (bright || "#aaa"), fontFamily:"'Barlow', sans-serif", fontSize:"13px", borderBottom: val ? "none" : "1px dashed #333" }}>
      {val || placeholder}
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const s = STATUS_STYLE[status];
  return (
    <button onClick={onClick} title="Cycle status"
      style={{ display:"flex", alignItems:"center", gap:"5px", background:s.bg, border:`1px solid ${s.border}`, borderRadius:"4px", padding:"3px 8px", cursor:"pointer", whiteSpace:"nowrap" }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:"11px", color:s.label, fontWeight:600, letterSpacing:"0.06em" }}>{status.toUpperCase()}</span>
    </button>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ height:"4px", background:"#1a1a1a", borderRadius:"2px", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"2px", transition:"width 0.35s", boxShadow:`0 0 10px ${color}66` }} />
    </div>
  );
}

function ColLabel({ children, color }) {
  return (
    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", fontWeight:700, color: color, letterSpacing:"0.16em" }}>
      {children}
    </span>
  );
}

export default function App() {
  const [verts, setVerts] = useState(INITIAL_VERTICALS);
  const [editTitle, setEditTitle] = useState(null);
  const [showWorkload, setShowWorkload] = useState(false);

  const updateSub = (vi, si, field, val) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => j!==si ? s : { ...s, [field]:val })
    }));

  const cycleStatus = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => j!==si ? s : {
        ...s, status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(s.status)+1) % STATUS_CYCLE.length]
      })
    }));

  const toggleBlocked = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.map((s,j) => j!==si ? s : { ...s, blocked: !s.blocked })
    }));

  const addSub = (vi) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: [...v.subtasks, { id:++uid, name:"New Subtask", assignee:"", due:"", status:"To Do", blocked:false }]
    }));

  const removeSub = (vi, si) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : {
      ...v, subtasks: v.subtasks.filter((_,j) => j!==si)
    }));

  const updateTitle = (vi, val) => {
    setVerts(prev => prev.map((v,i) => i!==vi ? v : { ...v, title:val }));
    setEditTitle(null);
  };

  const updateMilestone = (vi, val) =>
    setVerts(prev => prev.map((v,i) => i!==vi ? v : { ...v, milestone:val }));

  const workloadMap = {};
  verts.forEach((v, vi) => {
    v.subtasks.forEach(s => {
      const who = (s.assignee || "").trim();
      if (!who) return;
      if (!workloadMap[who]) workloadMap[who] = [];
      workloadMap[who].push({ vertical: v.title, name: s.name, status: s.status, color: VERTICAL_COLORS[vi] });
    });
  });
  const workloadEntries = Object.entries(workloadMap).sort((a,b) => b[1].length - a[1].length);

  const totalTasks = verts.reduce((a,v) => a + v.subtasks.length, 0);
  const doneTasks = verts.reduce((a,v) => a + v.subtasks.filter(s=>s.status==="Done").length, 0);
  const overallPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ minHeight:"100vh", background:"#000", padding:"28px 22px", fontFamily:"'Barlow', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Barlow:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .row:hover { background: rgba(255,255,255,0.04) !important; }
        .row:hover .del { opacity:1 !important; }
        .addbtn:hover { background: rgba(255,255,255,0.05) !important; color:#fff !important; }
        input[type=date]::-webkit-calendar-picker-indicator { filter:invert(0.8); cursor:pointer; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#222; }
      `}</style>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", borderBottom:"1px solid #1c1c1c", paddingBottom:"20px" }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:600, letterSpacing:"0.22em", color:"#4af0c4", marginBottom:"6px" }}>
            HCS OPERATIONS · {new Date().toDateString().toUpperCase()}
          </div>
          <h1 style={{ fontFamily:"'Barlow Condensed'", fontSize:"26px", fontWeight:700, color:"#fff", letterSpacing:"0.08em", textTransform:"uppercase", lineHeight:1 }}>
            SE Asia Expansion
          </h1>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"14px", fontWeight:600, color:"#3de8ff", letterSpacing:"0.18em", marginTop:"5px" }}>
            STRATEGIC ROADMAP
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, letterSpacing:"0.18em", color:"#4af0c4", marginBottom:"4px" }}>OVERALL PROGRESS</div>
          <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"44px", fontWeight:700, color:"#fff", lineHeight:1 }}>
            {overallPct}<span style={{ fontSize:"20px", color:"#4af0c4" }}>%</span>
          </div>
          <div style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#aaa", marginTop:"3px" }}>{doneTasks} of {totalTasks} tasks complete</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
        {verts.map((v, vi) => {
          const pct = getProgress(v.subtasks);
          const color = VERTICAL_COLORS[vi];
          const done = v.subtasks.filter(s => s.status==="Done").length;
          const rag = getRAG(v.subtasks);
          const r = RAG_STYLE[rag];
          return (
            <div key={v.id} style={{ background:"#0a0a0a", border:`1px solid ${color}44`, borderLeft:`3px solid ${color}`, borderRadius:"4px", padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"14px", fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.06em" }}>{v.title}</span>
                <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", fontWeight:700, color:r.color, letterSpacing:"0.1em", background:`${r.color}18`, border:`1px solid ${r.color}55`, borderRadius:"3px", padding:"2px 8px" }}>
                  {r.label}
                </span>
              </div>
              <Bar pct={pct} color={color} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"8px" }}>
                <span style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#fff" }}><span style={{ fontWeight:700 }}>{pct}%</span> complete</span>
                <span style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#bbb" }}>{done}/{v.subtasks.length} done</span>
              </div>
              {v.milestone && (
                <div style={{ marginTop:"6px", fontFamily:"'Barlow Condensed'", fontSize:"12px", fontWeight:600, color:color, letterSpacing:"0.06em" }}>
                  TARGET: {new Date(v.milestone+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task columns */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", alignItems:"start" }}>
        {verts.map((v, vi) => {
          const color = VERTICAL_COLORS[vi];
          const lc = LABEL_COLORS[vi];
          const pct = getProgress(v.subtasks);
          return (
            <div key={v.id} style={{ background:"#080808", border:"1px solid #1c1c1c", borderTop:`2px solid ${color}`, borderRadius:"4px", overflow:"hidden" }}>

              {/* Column header */}
              <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid #181818" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                  <div style={{ flex:1 }}><Bar pct={pct} color={color} /></div>
                  <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"14px", fontWeight:700, color:"#fff" }}>{pct}%</span>
                </div>

                {/* Milestone */}
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                  <ColLabel color={lc}>MILESTONE</ColLabel>
                  <input type="date" value={v.milestone} onChange={e => updateMilestone(vi, e.target.value)}
                    style={{ background:"transparent", border:"none", borderBottom:`1px solid ${color}66`, color: v.milestone ? "#fff" : lc, fontFamily:"'Barlow'", fontSize:"12px", padding:"0 2px", outline:"none", cursor:"pointer", flex:1 }} />
                </div>

                {/* Column header labels */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 72px 88px 82px 20px", gap:"6px" }}>
                  <ColLabel color={lc}>TASK</ColLabel>
                  <ColLabel color={lc}>WHO</ColLabel>
                  <ColLabel color={lc}>DUE</ColLabel>
                  <ColLabel color={lc}>STATUS</ColLabel>
                  <span />
                </div>
              </div>

              {/* Subtasks */}
              {v.subtasks.map((s, si) => {
                const isOverdue = s.due && s.status !== "Done" && new Date(s.due) < new Date();
                return (
                  <div key={s.id} className="row"
                    style={{ display:"grid", gridTemplateColumns:"1fr 72px 88px 82px 20px", gap:"6px", alignItems:"center", padding:"9px 16px", borderBottom:"1px solid #111", background: s.blocked ? "rgba(255,95,95,0.05)" : "transparent" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"5px", minWidth:0 }}>
                      <button className="del" onClick={() => removeSub(vi, si)}
                        style={{ opacity:0, background:"none", border:"none", color:"#ff5f5f", cursor:"pointer", fontSize:"15px", lineHeight:1, padding:0, flexShrink:0, transition:"opacity 0.12s" }}>×</button>
                      <InlineEdit value={s.name} placeholder="task name" onChange={val => updateSub(vi, si, "name", val)} />
                    </div>
                    <InlineEdit value={s.assignee} placeholder="—" onChange={val => updateSub(vi, si, "assignee", val)} bright={lc} />
                    <input type="date" value={s.due} onChange={e => updateSub(vi, si, "due", e.target.value)}
                      style={{ background:"transparent", border:"none", borderBottom:`1px solid ${isOverdue?"#ff5f5f":"#333"}`, color: isOverdue ? "#ff5f5f" : s.due ? "#fff" : lc, fontFamily:"'Barlow'", fontSize:"12px", padding:0, outline:"none", width:"100%", cursor:"pointer" }} />
                    <StatusBadge status={s.status} onClick={() => cycleStatus(vi, si)} />
                    <button onClick={() => toggleBlocked(vi, si)} title={s.blocked ? "Unblock" : "Flag blocked"}
                      style={{ opacity: s.blocked ? 1 : 0.2, background:"none", border:"none", cursor:"pointer", fontSize:"13px", padding:0, color:"#ff5f5f", transition:"opacity 0.12s", lineHeight:1 }}>⊘</button>
                  </div>
                );
              })}

              {v.subtasks.length < 15 &&
                <button className="addbtn" onClick={() => addSub(vi)}
                  style={{ display:"block", width:"100%", padding:"10px 16px", background:"transparent", border:"none", borderTop:"1px solid #151515", color: lc, fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                  + ADD SUBTASK
                </button>
              }
            </div>
          );
        })}
      </div>

      {/* Workload panel */}
      <div style={{ marginTop:"20px" }}>
        <button onClick={() => setShowWorkload(p => !p)}
          style={{ background:"transparent", border:"1px solid #333", borderRadius:"4px", color:"#aaa", fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, letterSpacing:"0.14em", padding:"8px 16px", cursor:"pointer" }}>
          {showWorkload ? "▲ HIDE" : "▼ SHOW"} OWNER WORKLOAD
        </button>

        {showWorkload && (
          <div style={{ marginTop:"10px", background:"#080808", border:"1px solid #1c1c1c", borderRadius:"4px", padding:"18px 20px" }}>
            <div style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, color:"#4af0c4", letterSpacing:"0.2em", marginBottom:"16px" }}>OWNER WORKLOAD</div>
            {workloadEntries.length === 0
              ? <div style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#aaa" }}>No assignees set. Add names to the WHO column above.</div>
              : workloadEntries.map(([who, tasks]) => (
                <div key={who} style={{ marginBottom:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
                    <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"15px", fontWeight:700, color:"#fff", letterSpacing:"0.04em" }}>{who}</span>
                    <span style={{ fontFamily:"'Barlow'", fontSize:"12px", color:"#aaa" }}>{tasks.length} task{tasks.length!==1?"s":""}</span>
                    <div style={{ flex:1, height:"1px", background:"#1a1a1a" }} />
                  </div>
                  {tasks.map((t, ti) => (
                    <div key={ti} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"6px 0", borderBottom:"1px solid #0f0f0f" }}>
                      <span style={{ width:"4px", height:"4px", borderRadius:"50%", background:t.color, flexShrink:0 }} />
                      <span style={{ fontFamily:"'Barlow'", fontSize:"13px", color:"#fff", flex:1 }}>{t.name}</span>
                      <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#aaa", letterSpacing:"0.04em" }}>{t.vertical}</span>
                      <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:STATUS_STYLE[t.status].label, fontWeight:700 }}>{t.status.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:"20px", marginTop:"16px", paddingTop:"14px", borderTop:"1px solid #141414", alignItems:"center", flexWrap:"wrap" }}>
        {STATUS_CYCLE.map(s => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:STATUS_STYLE[s].dot }} />
            <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", fontWeight:700, color:"#aaa", letterSpacing:"0.08em" }}>{s.toUpperCase()}</span>
          </div>
        ))}
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"11px", color:"#ff5f5f", fontWeight:700 }}>⊘ BLOCKED</span>
        <span style={{ fontFamily:"'Barlow Condensed'", fontSize:"10px", color:"#555", letterSpacing:"0.08em", marginLeft:"auto" }}>
          CLICK STATUS TO CYCLE · CLICK ANY FIELD TO EDIT · HOVER ROW TO DELETE
        </span>
      </div>
    </div>
  );
}
