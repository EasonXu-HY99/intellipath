import React, { useMemo, useState } from "react";

const iconMap = {
  overview: "🏠",
  ai: "🤖",
  search: "🔎",
  resources: "📍",
  audit: "🧾",
  settings: "⚙️",
  database: "🗄️",
  users: "👥",
  sparkles: "✨",
  platform: "🖥️",
  cloud: "☁️",
  activity: "📈",
  file: "📄",
  success: "✅",
  warning: "⚠️",
  menu: "☰",
  chevron: "›",
  lock: "🔒",
  map: "🗺️",
  pin: "📌",
};

const navItems = [
  { id: "overview", label: "Command Center", icon: iconMap.overview },
  { id: "ai", label: "AI Assistant", icon: iconMap.ai },
  { id: "search", label: "Central Search", icon: iconMap.search },
  { id: "resources", label: "Resource Tracking", icon: iconMap.resources },
  { id: "audit", label: "Audit Logs", icon: iconMap.audit },
  { id: "settings", label: "Settings", icon: iconMap.settings },
];

const resources = [
  { id: "AST-001", name: "Laptop-2491074", type: "Device", status: "Active", owner: "Feiyong Sun", location: "Tuas Yard", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 3 },
  { id: "AST-002", name: "Access Card-8812", type: "Badge", status: "Assigned", owner: "John Tan", location: "Main Gate", risk: "Low", permission: "Temporary Access", requestStatus: "Approved", requiredLevel: 2 },
  { id: "AST-003", name: "Pump Unit-A12", type: "Equipment", status: "Maintenance", owner: "Maintenance Team", location: "Workshop", risk: "Medium", permission: "Maintenance Access", requestStatus: "In Review", requiredLevel: 6 },
  { id: "AST-004", name: "Server-SG01", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 7 },
  { id: "AST-005", name: "CCTV-CAM-21", type: "Camera", status: "Offline", owner: "Security Team", location: "Gate 3", risk: "High", permission: "Security Team Only", requestStatus: "Escalated", requiredLevel: 5 },
];

const permissionRequests = [
  { step: "Request Submitted", owner: "Operations User", status: "Completed", note: "John Tan requested maintenance access for Pump Unit-A12." },
  { step: "Manager Review", owner: "Project Coordination Manager", status: "Completed", note: "Purpose and work order validated." },
  { step: "Permission Validation", owner: "System / Admin", status: "In Review", note: "Checking location, role, and access period." },
  { step: "Final Approval", owner: "Operations Admin", status: "Pending", note: "Awaiting approval before permission activation." },
  { step: "Access Activated", owner: "System", status: "Not Started", note: "Permission will be synced after approval." },
];

const people = [
  { id: "PER-00125", name: "John Tan", type: "Contractor", company: "ABC Engineering", site: "Tuas Yard", assignment: "Pump Unit-A12 Maintenance", status: "Active", validUntil: "2026-06-30", risk: "Low", cyberLevel: 6 },
  { id: "PER-00126", name: "Mary Lim", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "Operations Support", status: "Active", validUntil: "Permanent", risk: "Low", cyberLevel: 4 },
  { id: "PER-00127", name: "Alan Goh", type: "Contractor", company: "TechServe", site: "Tuas Yard", assignment: "Network Maintenance", status: "Expiring", validUntil: "2026-05-18", risk: "Medium", cyberLevel: 5 },
];

const selectedUser = people[0];

function canAccess(userLevel, requiredLevel) {
  return userLevel >= requiredLevel;
}

const levelRules = [
  { level: 7, scope: "Can access Level 1–7 resources, including restricted infrastructure." },
  { level: 6, scope: "Can access Level 1–6 resources. Cannot access Level 7 resources." },
  { level: 5, scope: "Can access Level 1–5 resources. Cannot access Level 6–7 resources." },
  { level: 4, scope: "Can access Level 1–4 resources. Cannot access Level 5–7 resources." },
  { level: 3, scope: "Can access Level 1–3 resources. Cannot access Level 4–7 resources." },
  { level: 2, scope: "Can access Level 1–2 resources. Cannot access Level 3–7 resources." },
  { level: 1, scope: "Can only access Level 1 resources." },
];

const auditLogs = [
  { time: "09:58", user: "Haiyang Xu", action: "Updated maintenance assignment for John Tan", result: "Success" },
  { time: "09:55", user: "System", action: "Synced Microsoft Graph operational data", result: "Success" },
  { time: "09:50", user: "Admin", action: "Approved maintenance activity", result: "Success" },
  { time: "09:45", user: "John Tan", action: "Resource status updated", result: "Success" },
  { time: "09:40", user: "AI Assistant", action: "Generated operational summary", result: "Completed" },
  { time: "09:32", user: "System", action: "CCTV-CAM-21 health check failed", result: "Warning" },
];

const testCases = [
  { name: "Navigation has simplified module count", result: navItems.length === 6 ? "Passed" : "Failed" },
  { name: "Removed unused QR page", result: !navItems.some((item) => item.id === "qr") ? "Passed" : "Failed" },
  { name: "Resource table has demo assets", result: resources.length >= 5 ? "Passed" : "Failed" },
  { name: "Resource records include permission statements", result: resources.every((resource) => resource.permission && resource.requestStatus) ? "Passed" : "Failed" },
  { name: "Cybersecurity levels control resource access", result: canAccess(7, 7) && !canAccess(6, 7) && canAccess(6, 6) ? "Passed" : "Failed" },
  { name: "Permission request flow has progress steps", result: permissionRequests.length >= 5 ? "Passed" : "Failed" },
  { name: "All icons are local symbols", result: navItems.every((item) => typeof item.icon === "string") ? "Passed" : "Failed" },
  { name: "Search directory has people records", result: people.length >= 3 ? "Passed" : "Failed" },
  { name: "Audit log has activity records", result: auditLogs.length >= 5 ? "Passed" : "Failed" },
];

function Icon({ symbol, className = "", label }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} role="img" aria-label={label || symbol}>
      {symbol}
    </span>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}>{children}</div>;
}

function IconBox({ symbol, dark = false }) {
  return (
    <div className={`${dark ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"} w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0`}>
      <Icon symbol={symbol} />
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Assigned: "bg-blue-50 text-blue-700 border-blue-200",
    Maintenance: "bg-amber-50 text-amber-700 border-amber-200",
    Offline: "bg-red-50 text-red-700 border-red-200",
    Success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Warning: "bg-amber-50 text-amber-700 border-amber-200",
    Completed: "bg-blue-50 text-blue-700 border-blue-200",
    Expiring: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "In Review": "bg-amber-50 text-amber-700 border-amber-200",
    Pending: "bg-blue-50 text-blue-700 border-blue-200",
    "Not Requested": "bg-slate-50 text-slate-700 border-slate-200",
    Escalated: "bg-red-50 text-red-700 border-red-200",
    "Not Started": "bg-slate-50 text-slate-700 border-slate-200",
    Passed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${map[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
      {status}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-red-50 text-red-700 border-red-200",
  };

  return <span className={`px-3 py-1 rounded-full text-xs border ${map[risk] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{risk}</span>;
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 mt-1 max-w-4xl">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Metric({ icon, title, value, note }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <IconBox symbol={icon} />
        <span className="text-xs text-slate-500">Live</span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        <p className="text-xs text-slate-500 mt-2">{note}</p>
      </div>
    </Card>
  );
}

function Overview() {
  const flow = [
    ["Users", iconMap.users],
    ["Platform", iconMap.platform],
    ["AI Layer", iconMap.ai],
    ["Operations", iconMap.activity],
    ["Systems", iconMap.cloud],
  ];

  return (
    <div>
      <SectionTitle
        title="Command Center"
        subtitle="Centralized operational visibility, AI assistance, resource tracking, audit visibility, and enterprise search."
        action={<button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Generate Daily Report</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={iconMap.database} title="Active Resources" value="428" note="97% availability across monitored systems" />
        <Metric icon={iconMap.users} title="Personnel On Site" value="96" note="18 contractors currently checked in" />
        <Metric icon={iconMap.activity} title="Daily Operations" value="142" note="Active operational activities today" />
        <Metric icon={iconMap.sparkles} title="AI Insights" value="28" note="AI-generated recommendations today" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Operational Flow</h2>
              <p className="text-sm text-slate-500">Users → Platform → AI Intelligence → Operations → Enterprise systems</p>
            </div>
            <Icon symbol={iconMap.sparkles} className="text-2xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
            {flow.map(([label, symbol], idx) => (
              <div key={label} className="relative">
                <div className="h-full rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center text-center min-h-[130px]">
                  <Icon symbol={symbol} className="text-3xl mb-3" />
                  <p className="font-semibold text-slate-900 text-sm">{label}</p>
                </div>
                {idx < flow.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center text-slate-400 z-10">
                    {iconMap.chevron}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Recommendations</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <p className="text-sm font-medium text-amber-900">Review maintenance request</p>
              <p className="text-xs text-amber-700 mt-1">Maintenance workflow requires manager review.</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-sm font-medium text-red-900">CCTV-CAM-21 offline</p>
              <p className="text-xs text-red-700 mt-1">Create maintenance escalation to Security Team.</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium text-blue-900">Resource utilization spike</p>
              <p className="text-xs text-blue-700 mt-1">AI recommends workload redistribution.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Built-In Demo Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {testCases.map((test) => (
            <div key={test.name} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <p className="text-sm font-medium text-slate-900">{test.name}</p>
              <div className="mt-3">
                <StatusBadge status={test.result} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AIAssistant() {
  const [prompt, setPrompt] = useState("Show John Tan resource assignment, cybersecurity level, and site location");

  return (
    <div>
      <SectionTitle title="AI Assistant" subtitle="Claude Code + Microsoft Copilot-style assistant for search, reporting, operational reasoning, and location awareness." />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <IconBox symbol={iconMap.ai} dark />
            <div>
              <h2 className="font-semibold text-slate-900">Ask IntelliPath AI</h2>
              <p className="text-sm text-slate-500">Search enterprise data, summarize operations, check cybersecurity level, and recommend actions.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-950 p-5 text-white min-h-[360px]">
            <div className="text-sm text-slate-400">User</div>
            <div className="mt-2 p-4 bg-slate-900 rounded-2xl border border-slate-800">{prompt}</div>

            <div className="mt-6 text-sm text-slate-400">AI Response</div>
            <div className="mt-2 p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <p><b>John Tan</b> is an active contractor from ABC Engineering assigned to Pump Unit-A12 maintenance.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-slate-800">Cybersecurity Level: <span className="text-emerald-300">Level {selectedUser.cyberLevel}</span></div>
                <div className="p-3 rounded-xl bg-slate-800">Pump Unit-A12 Required Level: <span className="text-amber-300">Level 6</span></div>
                <div className="p-3 rounded-xl bg-slate-800">Access Result: <span className="text-emerald-300">Allowed</span></div>
                <div className="p-3 rounded-xl bg-slate-800">Server-SG01 Required Level: <span className="text-red-300">Level 7 · Denied</span></div>
              </div>
              <p className="text-sm text-slate-300">Rule applied: Level 7 can access Level 7 and below. Level 6 can access Level 6 and below, but cannot access Level 7.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm" />
            <button className="px-5 py-3 rounded-xl bg-slate-900 text-white text-sm">Ask AI</button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick AI Actions</h2>
          <div className="space-y-3">
            {["Check cybersecurity level", "Show accessible resources", "Find denied resources", "Generate daily operations report", "Summarize resource status", "Generate management summary"].map((item) => (
              <button key={item} className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm flex items-center justify-between">
                {item}
                <span className="text-slate-400 text-xl">{iconMap.chevron}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900">Google Maps Location View</h2>
              <p className="text-sm text-slate-500 mt-1">Mock embedded map for site and resource location tracking.</p>
            </div>
            <Icon symbol={iconMap.map} className="text-2xl" />
          </div>

          <div className="relative h-80 rounded-3xl overflow-hidden border border-slate-200 bg-slate-200">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.28)_1px,transparent_1px)] bg-[size:42px_42px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-sky-50/70 to-slate-100/80" />
            <div className="absolute left-6 right-6 top-1/2 h-8 -translate-y-1/2 bg-slate-300/80 rounded-full border border-white" />
            <div className="absolute top-6 bottom-6 left-1/2 w-8 -translate-x-1/2 bg-slate-300/80 rounded-full border border-white" />
            <div className="absolute left-[18%] top-[22%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Main Gate</div>
            <div className="absolute left-[56%] top-[28%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Workshop</div>
            <div className="absolute left-[64%] top-[58%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Pump Unit-A12</div>
            <div className="absolute left-[32%] top-[62%] px-3 py-2 rounded-xl bg-white shadow text-xs font-medium text-slate-700">Admin Office</div>
            <div className="absolute left-[68%] top-[47%] w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-red-600 shadow-lg" />
            </div>
            <div className="absolute left-[6%] bottom-5 bg-white/95 rounded-2xl p-4 shadow border border-slate-200 w-72">
              <p className="text-xs text-slate-500">Selected Location</p>
              <p className="font-semibold text-slate-900 mt-1">Pump Unit-A12 · Workshop Zone</p>
              <p className="text-xs text-slate-500 mt-1">Tuas Yard · Maintenance area · Level 6 required</p>
            </div>
            <div className="absolute right-4 top-4 flex flex-col rounded-xl overflow-hidden shadow border border-slate-200">
              <button className="w-9 h-9 bg-white text-slate-800 font-bold">+</button>
              <button className="w-9 h-9 bg-white text-slate-800 font-bold border-t border-slate-200">−</button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Location Intelligence</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-900">Current Resource</p>
              <p className="mt-1">Pump Unit-A12</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="font-medium text-slate-900">Site</p>
              <p className="mt-1">Tuas Yard · Workshop Zone</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="font-medium text-emerald-900">Access Check</p>
              <p className="mt-1 text-emerald-700">John Tan Level 6 can access this Level 6 resource.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CentralSearch() {
  const cards = [
    ["Person Record", "John Tan · Contractor · ABC Engineering", iconMap.users],
    ["Assignment Record", "Pump Unit-A12 · Assigned to John Tan", iconMap.activity],
    ["Maintenance Record", "WO-2026-0512-002 · Pump Unit-A12 Maintenance", iconMap.file],
    ["Resource Record", "Pump Unit-A12 · Workshop · Maintenance", iconMap.database],
    ["Related SOP", "SOP-MAINT-003 · Pump Room Access Procedure", iconMap.file],
    ["AI Summary", "Maintenance activity aligns with current operational workload and resource planning.", iconMap.sparkles],
  ];

  return (
    <div>
      <SectionTitle title="Centralized Search" subtitle="One path to find people, resources, documents, maintenance records, operational data, and enterprise information." />

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-3 text-xl">{iconMap.search}</span>
            <input defaultValue="John Tan Pump Unit-A12 assignment" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200" />
          </div>
          <button className="px-6 py-3 rounded-xl bg-slate-900 text-white">Search</button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cards.map(([title, detail, symbol]) => (
          <Card key={title} className="p-5">
            <div className="flex items-start gap-4">
              <IconBox symbol={symbol} />
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{detail}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Resources() {
  return (
    <div>
      <SectionTitle
        title="Resource Tracking"
        subtitle="Track resources together with permission ownership, cybersecurity level, request status, approval flow, and operational usage."
        action={<button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">New Permission Request</button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Metric icon={iconMap.database} title="Tracked Resources" value="428" note="Assets, devices, tools, systems, and shared resources" />
        <Metric icon={iconMap.users} title="Active Permissions" value="96" note="Assigned to employees, contractors, and teams" />
        <Metric icon={iconMap.lock} title="Highest Level" value="7" note="Level 7 can access Level 7 and below" />
        <Metric icon={iconMap.activity} title="Pending Reviews" value="5" note="Permission requests awaiting validation" />
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h2 className="font-semibold text-slate-900">Cybersecurity Level Rule</h2>
            <p className="text-sm text-slate-500 mt-1">Access is granted only when the user cybersecurity level is equal to or higher than the resource required level.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
            {levelRules.map((rule) => (
              <div key={rule.level} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <p className="font-bold text-slate-900">L{rule.level}</p>
                <p className="text-[10px] text-slate-500 mt-1">Access ≤ {rule.level}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Resource & Permission Registry</h2>
            <p className="text-sm text-slate-500 mt-1">Shows resource ownership, permission statement, required cybersecurity level, and access result for {selectedUser.name}.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 text-sm rounded-xl border border-slate-200">Export</button>
            <button className="px-3 py-2 text-sm rounded-xl border border-slate-200">Sync Data</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1150px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["ID", "Resource", "Type", "Status", "Owner", "Location", "Permission Statement", "Required Level", "User Level", "Access Result", "Request Status"].map((header) => <th key={header} className="text-left p-4 font-medium">{header}</th>)}</tr>
            </thead>
            <tbody>
              {resources.map((resource) => {
                const allowed = canAccess(selectedUser.cyberLevel, resource.requiredLevel);
                return (
                  <tr key={resource.id} className="border-t border-slate-100 align-top">
                    <td className="p-4 font-medium">{resource.id}</td>
                    <td className="p-4">{resource.name}</td>
                    <td className="p-4">{resource.type}</td>
                    <td className="p-4"><StatusBadge status={resource.status} /></td>
                    <td className="p-4">{resource.owner}</td>
                    <td className="p-4">{resource.location}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{resource.permission}</div>
                      <div className="text-xs text-slate-500 mt-1">Defines who can use, approve, or maintain this resource.</div>
                    </td>
                    <td className="p-4"><span className="font-semibold text-slate-900">Level {resource.requiredLevel}</span></td>
                    <td className="p-4"><span className="font-semibold text-slate-900">Level {selectedUser.cyberLevel}</span></td>
                    <td className="p-4"><StatusBadge status={allowed ? "Approved" : "Escalated"} /></td>
                    <td className="p-4"><StatusBadge status={resource.requestStatus} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-6">
        <Card className="p-6 xl:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-semibold text-slate-900">Permission Request Flow</h3>
              <p className="text-sm text-slate-500 mt-1">Example: John Tan requesting maintenance permission for Pump Unit-A12.</p>
            </div>
            <StatusBadge status="In Review" />
          </div>

          <div className="space-y-4">
            {permissionRequests.map((request, index) => (
              <div key={request.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border ${request.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : request.status === "In Review" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                    {index + 1}
                  </div>
                  {index < permissionRequests.length - 1 && <div className="w-px h-12 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{request.step}</p>
                      <p className="text-xs text-slate-500">Owner: {request.owner}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{request.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Cybersecurity Access Statement</h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
            <p className="text-sm text-slate-700">
              <b>User:</b> John Tan<br />
              <b>User Level:</b> Level {selectedUser.cyberLevel}<br />
              <b>Resource:</b> Pump Unit-A12<br />
              <b>Required Level:</b> Level 6<br />
              <b>Access Result:</b> Allowed<br />
              <b>Rule:</b> User level must be equal to or higher than required resource level.
            </p>
          </div>
          <h3 className="font-semibold text-slate-900 mb-3">AI Insight</h3>
          <p className="text-sm text-slate-500">
            John Tan can access Level 6 and below resources. He can access Pump Unit-A12, but cannot access Server-SG01 because that resource requires Level 7 clearance.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Audit() {
  return (
    <div>
      <SectionTitle title="Audit Logs" subtitle="Track operational activity, AI actions, resource updates, and enterprise system events." action={<button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Export Logs</button>} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Time", "User", "Action", "Result"].map((header) => <th key={header} className="text-left p-4 font-medium">{header}</th>)}</tr>
            </thead>
            <tbody>
              {auditLogs.map((log, index) => (
                <tr key={`${log.time}-${index}`} className="border-t border-slate-100">
                  <td className="p-4 font-medium">{log.time}</td>
                  <td className="p-4">{log.user}</td>
                  <td className="p-4">{log.action}</td>
                  <td className="p-4"><StatusBadge status={log.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SettingsPage() {
  return (
    <div>
      <SectionTitle title="Settings" subtitle="Configure AI behavior, enterprise integrations, notifications, and operational preferences." />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card className="p-6">
          <h2 className="font-semibold mb-4">AI Engine</h2>
          <div className="space-y-3">
            {["Claude Code", "Microsoft Copilot", "OpenAI Codex"].map((engine, index) => (
              <label key={engine} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span>{engine}</span>
                <input type="checkbox" defaultChecked={index < 2} readOnly />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-4">Governance Controls</h2>
          <div className="space-y-3">
            {["Enable audit logs", "Restrict AI from sensitive data", "Enable AI operational recommendations", "Require admin approval for major data updates"].map((control) => (
              <label key={control} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                <span>{control}</span>
                <input type="checkbox" defaultChecked readOnly />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PeopleDirectory() {
  return (
    <Card className="p-6 mt-6">
      <h2 className="font-semibold text-slate-900 mb-4">People Directory Demo Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {people.map((person) => (
          <div key={person.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-sm text-slate-500">{person.type} · {person.company}</p>
              </div>
              <RiskBadge risk={person.risk} />
            </div>
            <div className="mt-4 text-sm text-slate-600 space-y-1">
              <p>Site: {person.site}</p>
              <p>Assignment: {person.assignment}</p>
              <p>Valid Until: {person.validUntil}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const pages = {
  overview: Overview,
  ai: AIAssistant,
  search: CentralSearch,
  resources: Resources,
  audit: Audit,
  settings: SettingsPage,
};

export default function IntelliPathFullGUI() {
  const [active, setActive] = useState("overview");
  const Page = useMemo(() => pages[active] || Overview, [active]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      <aside className="w-80 bg-slate-950 text-white min-h-screen p-5 hidden lg:block">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black">IP</div>
          <div>
            <h1 className="font-bold text-xl">IntelliPath</h1>
            <p className="text-xs text-slate-400">Smart Operations Platform</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-5">
          <p className="text-xs text-slate-400">AI Layer</p>
          <p className="font-semibold mt-1">Claude Code + Copilot</p>
          <p className="text-xs text-emerald-300 mt-2">● Connected</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${active === item.id ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}
            >
              <Icon symbol={item.icon} className="text-lg w-6" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl border border-slate-200"><Icon symbol={iconMap.menu} /></button>
            <div>
              <p className="text-sm text-slate-500">Enterprise Sandbox · Tuas Yard</p>
              <p className="font-semibold text-slate-900">Welcome, Haiyang Xu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">
              <Icon symbol={iconMap.success} /> All critical services operational
            </div>
            <button onClick={() => setActive("ai")} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Ask AI</button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <Page />
          {active === "search" && <PeopleDirectory />}
        </div>
      </main>
    </div>
  );
}
