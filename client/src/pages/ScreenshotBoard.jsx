import {
  Activity,
  Bell,
  BookOpen,
  ChevronLeft,
  Filter,
  Grid2X2,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  BarChart3,
} from "lucide-react";

const columns = [
  {
    title: "Backlog",
    count: "1",
    points: "8 pts",
    color: "bg-slate-500",
    cards: [
      {
        id: "ORB-108",
        title: "WebSocket bridge adapter for distributed cloud deployments",
        priority: "High",
        tags: ["Backend", "Infrastructure"],
      },
    ],
  },
  {
    title: "To Do",
    count: "3",
    points: "5 pts",
    color: "bg-blue-500",
    cards: [
      { id: "ORB-TEST", title: "Notification test task" },
      { id: "ORB-106", title: "Add keyboard shortcuts", priority: "Low" },
    ],
  },
  {
    title: "In Progress",
    count: "2",
    points: "",
    color: "bg-amber-500",
    cards: [
      {
        id: "ORB-103",
        title: "Build collaborative rich text editor with live cursors",
        tags: ["Docs", "Collaboration"],
      },
    ],
  },
];

const people = [
  ["PV", "bg-indigo-500"],
  ["AR", "bg-cyan-500"],
  ["SC", "bg-emerald-500"],
  ["DK", "bg-amber-500"],
  ["ER", "bg-purple-500"],
];

function Avatar({ label, color, small = false }) {
  return (
    <span className={`${small ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"} ${color} inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-[#0b111d]`}>
      {label}
    </span>
  );
}

function TaskCard({ card }) {
  return (
    <article className="min-h-[108px] rounded-xl border border-[#273248] bg-[#151d2b] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold tracking-wide text-[#71809b]">{card.id}</p>
        {card.priority && (
          <span className={`${card.priority === "High" ? "bg-[#493918] text-[#f7b91b]" : "bg-[#29344a] text-[#aebbd0]"} rounded-md px-2 py-1 text-[12px] font-semibold`}>
            {card.priority === "High" ? "! " : "↓ "}{card.priority}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-[16px] font-bold leading-[1.35] text-[#e8edf7]">{card.title}</h3>
      {card.tags && (
        <div className="mt-4 flex gap-2">
          {card.tags.map((tag) => (
            <span key={tag} className="rounded bg-[#222d40] px-2 py-1 text-[12px] text-[#9eabc1]">{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ScreenshotBoard() {
  return (
    <div className="flex h-screen min-w-[1100px] overflow-hidden bg-[#080d16] text-[#dce5f4]">
      <aside className="flex w-[293px] shrink-0 flex-col border-r border-[#1d2636] bg-[#0d121c]">
        <div className="flex h-[58px] items-center gap-3 border-b border-[#1d2636] px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#675cf6] to-[#08b6cc] text-xl font-bold text-white">◉</div>
          <span className="text-[21px] font-bold text-white">Orbit</span>
          <ChevronLeft className="ml-auto text-[#70809e]" size={20} />
        </div>

        <nav className="px-0 pt-6">
          <p className="px-7 text-[12px] font-semibold uppercase tracking-[0.13em] text-[#71809e]">Workspaces</p>
          <button className="mt-4 flex w-full items-center gap-4 px-7 py-3 text-[16px] text-[#9eabc3]"><Grid2X2 size={20} />Workspace Home</button>
          <button className="flex w-full items-center gap-4 border-y border-[#4e4ed2] bg-[#181c3b] px-7 py-3 text-[16px] text-white"><LayoutDashboard size={20} className="text-[#7d7aff]" />Kanban Board<span className="ml-auto rounded-full bg-[#6962f5] px-2.5 py-0.5 text-[12px] font-bold">9</span></button>
          <button className="flex w-full items-center gap-4 px-7 py-3 text-[16px] text-[#9eabc3]"><BookOpen size={20} />Collaborative Docs<span className="ml-auto rounded-full bg-[#223049] px-2.5 py-0.5 text-[12px] font-bold">2</span></button>
          <button className="flex w-full items-center gap-4 px-7 py-3 text-[16px] text-[#9eabc3]"><BarChart3 size={20} />Sprint Analytics</button>
        </nav>

        <div className="mt-7">
          <p className="px-7 text-[12px] font-semibold uppercase tracking-[0.13em] text-[#71809e]">Collaboration</p>
          <button className="mt-4 flex w-full items-center gap-4 px-7 py-3 text-[16px] text-[#9eabc3]"><MessageSquare size={20} />Team Chat<span className="ml-auto rounded-full bg-[#7069f7] px-2.5 py-0.5 text-[12px] font-bold text-white">Live</span></button>
        </div>

        <div className="mt-auto flex items-center gap-3 border-t border-[#1d2636] px-4 py-4">
          <div className="relative"><Avatar label="PV" color="bg-indigo-500" /><i className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0d121c] bg-emerald-400" /></div>
          <div><p className="text-[14px] font-bold text-white">Pravallika (You)</p><p className="text-[12px] text-[#8290aa]">Lead Architect</p></div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-[#080d16]">
        <header className="flex h-[58px] shrink-0 items-center gap-4 border-b border-[#1d2636] px-5">
          <div className="w-[142px] text-[16px] font-bold leading-tight text-white">42 —<br />Core<br />Engine</div>
          <span className="rounded-full bg-[#073d36] px-3 py-1 text-[12px] font-bold text-[#00c696]">Active</span>
          <div className="ml-4 flex h-9 w-[142px] items-center gap-2 rounded-xl border border-[#202c40] bg-[#111927] px-3 text-[14px] text-[#7f8ca5]"><Search size={17} />Search <kbd className="ml-auto rounded bg-[#202d42] px-1 text-[11px]">⌘K</kbd></div>
          <div className="flex items-center gap-2 rounded-full border border-[#075844] bg-[#092b29] px-3 py-1.5 text-[13px] text-[#0bd2a1]"><span className="h-2 w-2 rounded-full bg-[#00c696]" />Real-Time Ready · 1ms</div>
          <div className="ml-auto flex items-center -space-x-2">{people.map(([label, color]) => <Avatar key={label} label={label} color={color} small />)}</div>
          <button className="flex h-9 items-center gap-2 rounded-xl bg-[#635af5] px-4 text-[14px] font-bold text-white shadow-[0_5px_16px_rgba(99,90,245,0.35)]"><Plus size={19} />New Task</button>
          <button className="relative rounded-xl border border-[#263249] bg-[#141c2b] p-2 text-[#9eabc1]"><Bell size={20} /><span className="absolute right-1 top-0.5 text-[11px]">1</span></button>
          <button className="rounded-xl border border-[#263249] bg-[#141c2b] p-2 text-[#9eabc1]"><MessageSquare size={20} /></button>
        </header>

        <div className="flex items-center gap-3 px-7 py-6">
          <Filter size={20} className="text-[#71809b]" /><span className="text-[14px] text-[#71809b]">Filters:</span>
          {[["All Tasks (9)", true], ["My Assigned", false], ["Urgent / High", false], ["Core & Architecture", false]].map(([label, active]) => <button key={label} className={`${active ? "border-[#625cf4] bg-[#171943] text-white" : "border-[#222d41] bg-[#111927] text-[#9aa7bd]"} rounded-full border px-4 py-2 text-[13px]`}>{label}</button>)}
          <button className="ml-auto flex items-center gap-2 rounded-xl border border-[#263249] bg-[#141c2b] px-4 py-2 text-[13px] font-semibold text-white">🎉 Celebrate Sprint</button>
        </div>

        <section className="flex min-h-0 flex-1 gap-5 overflow-hidden px-7">
          {columns.map((column) => <div key={column.title} className="flex w-[375px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#202b3d] bg-[#0c121e]">
            <div className="flex h-[54px] items-center gap-3 border-b border-[#202b3d] px-4"><span className={`${column.color} h-2.5 w-2.5 rounded-full`} /><h2 className="text-[16px] font-bold text-[#e5eaf4]">{column.title}</h2><span className="rounded-full bg-[#202c40] px-2 py-0.5 text-[12px] font-bold text-[#8190aa]">{column.count}</span><span className="ml-auto text-[13px] text-[#71809b]">{column.points}</span></div>
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-3">{column.cards.map((card) => <TaskCard key={card.id} card={card} />)}</div>
            <button className="m-3 mt-0 flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-[#2b3548] text-[14px] text-[#a8b4c8]"><Plus size={18} />Add task</button>
          </div>)}
        </section>

        <footer className="mx-7 my-2 flex h-10 shrink-0 items-center gap-3 rounded-xl border border-[#202b3d] bg-[#141c2b] px-4 text-[13px]"><Activity size={18} className="text-[#7775ff]" /><strong>Live Sync Feed:</strong><span className="text-cyan-400">QA Bot</span><span className="text-[#8d9ab1]">created task</span><strong>ORB-TEST</strong><span className="ml-auto text-[#65738d]">Just now</span></footer>
      </main>
    </div>
  );
}