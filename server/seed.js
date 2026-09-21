import { migrateWorkspace } from "./workspace.js";
// Seed realistic demo data. Idempotent: users are seeded whenever the users
// table is empty; the domain data (resources/people/logs/etc.) is seeded
// whenever the resources table is empty. `force` wipes and reseeds everything.
import { hashPassword } from "./password.js";
import { migrateOperations } from "./upgrade.js";

// ---------------------------------------------------------------------------
// Users — 4 accounts with different roles / permissions
// ---------------------------------------------------------------------------
const USERS = [
  { username: "admin", password: "Admin@2026", name: "Haiyang Xu", role: "admin", email: "haiyang.xu@seatrium.com" },
  { username: "fsun", password: "Manager@2026", name: "Feiyong Sun", role: "manager", email: "feiyong.sun@seatrium.com" },
  { username: "mlim", password: "Analyst@2026", name: "Mary Lim", role: "analyst", email: "mary.lim@seatrium.com" },
  { username: "jtan", password: "Viewer@2026", name: "John Tan", role: "viewer", email: "john.tan@abc-engineering.com" },
];

// ---------------------------------------------------------------------------
// Devices / resources
// ---------------------------------------------------------------------------
function device(d) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    owner: d.owner,
    location: d.location,
    risk: d.risk,
    permission: d.permission,
    request_status: d.requestStatus,
    required_level: d.requiredLevel,
    serial_number: d.serial || "",
    manufacturer: d.manufacturer || "",
    model: d.model || "",
    ip_address: d.ip || "",
    os: d.os || "",
    last_seen: d.lastSeen || "",
    health: d.health || "Healthy",
  };
}

const RESOURCES = [
  device({ id: "AST-001", name: "Laptop-2491074", type: "Laptop", status: "Active", owner: "Feiyong Sun", location: "Tuas Yard", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 3, serial: "DL-2491074", manufacturer: "Dell", model: "Latitude 5540", ip: "10.24.15.31", os: "Windows 11 Enterprise", lastSeen: "2026-08-24 08:14", health: "Healthy" }),
  device({ id: "AST-002", name: "Laptop-2488120", type: "Laptop", status: "Active", owner: "Mary Lim", location: "Main Office", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 3, serial: "HP-2488120", manufacturer: "HP", model: "EliteBook 840 G10", ip: "10.24.12.18", os: "Windows 11 Enterprise", lastSeen: "2026-08-24 09:02", health: "Healthy" }),
  device({ id: "AST-003", name: "Laptop-2477315", type: "Laptop", status: "Active", owner: "Sarah Chen", location: "Main Office", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 6, serial: "LN-2477315", manufacturer: "Lenovo", model: "ThinkPad X1 Carbon", ip: "10.24.12.44", os: "Ubuntu 24.04 LTS", lastSeen: "2026-08-24 08:47", health: "Healthy" }),
  device({ id: "AST-004", name: "Laptop-2465098", type: "Laptop", status: "Maintenance", owner: "Kelvin Teo", location: "Tuas Yard", risk: "Medium", permission: "Assigned", requestStatus: "In Review", requiredLevel: 4, serial: "DL-2465098", manufacturer: "Dell", model: "Latitude 5430", ip: "10.24.15.77", os: "Windows 10 Enterprise", lastSeen: "2026-08-23 17:20", health: "Warning" }),
  device({ id: "AST-005", name: "Laptop-2459387", type: "Laptop", status: "Active", owner: "Emily Wong", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 7, serial: "HP-2459387", manufacturer: "HP", model: "ZBook Firefly G10", ip: "10.24.20.9", os: "Windows 11 Enterprise", lastSeen: "2026-08-24 08:31", health: "Healthy" }),
  device({ id: "AST-006", name: "Laptop-2448201", type: "Laptop", status: "Active", owner: "Priya Nair", location: "Main Office", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 5, serial: "LN-2448201", manufacturer: "Lenovo", model: "ThinkPad T14", ip: "10.24.12.51", os: "Windows 11 Enterprise", lastSeen: "2026-08-24 07:58", health: "Healthy" }),
  device({ id: "AST-007", name: "Laptop-2436612", type: "Laptop", status: "Active", owner: "Tan Wei Ming", location: "Tuas Yard", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 6, serial: "DL-2436612", manufacturer: "Dell", model: "Precision 5680", ip: "10.24.15.82", os: "Windows 11 Enterprise", lastSeen: "2026-08-24 08:20", health: "Healthy" }),

  device({ id: "SRV-001", name: "Server-SG01", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 7, serial: "PE-R750-0001", manufacturer: "Dell", model: "PowerEdge R750", ip: "10.24.20.11", os: "Windows Server 2022", lastSeen: "2026-08-24 09:15", health: "Healthy" }),
  device({ id: "SRV-002", name: "Server-SG02", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 7, serial: "HP-DL380-021", manufacturer: "HPE", model: "ProLiant DL380 Gen11", ip: "10.24.20.12", os: "Windows Server 2022", lastSeen: "2026-08-24 09:15", health: "Healthy" }),
  device({ id: "SRV-003", name: "Server-BAK-01", type: "Server", status: "Maintenance", owner: "Infrastructure", location: "Data Room", risk: "Medium", permission: "Restricted", requestStatus: "In Review", requiredLevel: 6, serial: "PE-R540-018", manufacturer: "Dell", model: "PowerEdge R540", ip: "10.24.20.15", os: "Ubuntu 22.04 LTS", lastSeen: "2026-08-23 22:40", health: "Warning" }),
  device({ id: "SRV-004", name: "Server-APP-03", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 6, serial: "PE-R650-009", manufacturer: "Dell", model: "PowerEdge R650", ip: "10.24.20.21", os: "Ubuntu 24.04 LTS", lastSeen: "2026-08-24 09:14", health: "Healthy" }),
  device({ id: "SRV-005", name: "Server-DMZ-01", type: "Server", status: "Active", owner: "Security Team", location: "Data Room", risk: "Medium", permission: "Security Team Only", requestStatus: "Not Requested", requiredLevel: 7, serial: "HP-DL325-005", manufacturer: "HPE", model: "ProLiant DL325 Gen11", ip: "172.16.0.5", os: "Rocky Linux 9", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "SRV-006", name: "Server-NAS-01", type: "Server", status: "Active", owner: "Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 6, serial: "SN-RS3621-01", manufacturer: "Synology", model: "RackStation RS3621xs+", ip: "10.24.20.30", os: "DSM 7.2", lastSeen: "2026-08-24 09:15", health: "Healthy" }),

  device({ id: "CCTV-001", name: "CCTV-CAM-21", type: "Camera", status: "Offline", owner: "Security Team", location: "Gate 3", risk: "High", permission: "Security Team Only", requestStatus: "Escalated", requiredLevel: 5, serial: "HK-2CD-8821", manufacturer: "Hikvision", model: "DS-2CD2186G2-ISU", ip: "10.24.30.21", os: "Firmware 5.7.12", lastSeen: "2026-08-23 03:44", health: "Critical" }),
  device({ id: "CCTV-002", name: "CCTV-CAM-14", type: "Camera", status: "Active", owner: "Security Team", location: "Main Gate", risk: "Low", permission: "Security Team Only", requestStatus: "Approved", requiredLevel: 5, serial: "AX-P3228-014", manufacturer: "Axis", model: "P3228-LVE", ip: "10.24.30.14", os: "Firmware 11.4", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "CCTV-003", name: "CCTV-CAM-08", type: "Camera", status: "Active", owner: "Security Team", location: "Workshop A", risk: "Low", permission: "Security Team Only", requestStatus: "Approved", requiredLevel: 5, serial: "BS-FLEX-008", manufacturer: "Bosch", model: "FLEXIDOME IP 4000i", ip: "10.24.30.8", os: "Firmware 8.90", lastSeen: "2026-08-24 09:15", health: "Healthy" }),
  device({ id: "CCTV-004", name: "CCTV-CAM-27", type: "Camera", status: "Active", owner: "Security Team", location: "Dry Dock", risk: "Medium", permission: "Security Team Only", requestStatus: "Approved", requiredLevel: 5, serial: "HK-2CD-9027", manufacturer: "Hikvision", model: "DS-2CD2T87G2-L", ip: "10.24.30.27", os: "Firmware 5.7.12", lastSeen: "2026-08-24 09:15", health: "Healthy" }),
  device({ id: "CCTV-005", name: "CCTV-CAM-33", type: "Camera", status: "Maintenance", owner: "Security Team", location: "Warehouse B", risk: "Medium", permission: "Security Team Only", requestStatus: "In Review", requiredLevel: 5, serial: "AX-P3255-033", manufacturer: "Axis", model: "P3255-LVE", ip: "10.24.30.33", os: "Firmware 11.3", lastSeen: "2026-08-22 18:05", health: "Warning" }),

  device({ id: "NET-001", name: "Switch-Core-01", type: "Network", status: "Active", owner: "IT Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 6, serial: "CS-9300-001", manufacturer: "Cisco", model: "Catalyst 9300", ip: "10.24.0.1", os: "IOS-XE 17.9", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "NET-002", name: "Router-Edge-01", type: "Network", status: "Active", owner: "IT Infrastructure", location: "Data Room", risk: "Low", permission: "Restricted", requestStatus: "Not Requested", requiredLevel: 6, serial: "CS-ISR4431-01", manufacturer: "Cisco", model: "ISR 4431", ip: "10.24.0.254", os: "IOS-XE 17.9", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "NET-003", name: "Firewall-PA-01", type: "Network", status: "Active", owner: "Security Team", location: "Data Room", risk: "Low", permission: "Security Team Only", requestStatus: "Not Requested", requiredLevel: 7, serial: "PA-440-0001", manufacturer: "Palo Alto", model: "PA-440", ip: "10.24.0.253", os: "PAN-OS 11.1", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "NET-004", name: "Firewall-FG-02", type: "Network", status: "Active", owner: "Security Team", location: "Tuas Yard", risk: "Medium", permission: "Security Team Only", requestStatus: "Not Requested", requiredLevel: 7, serial: "FG-100F-002", manufacturer: "Fortinet", model: "FortiGate 100F", ip: "10.24.5.1", os: "FortiOS 7.4", lastSeen: "2026-08-24 09:15", health: "Healthy" }),
  device({ id: "NET-005", name: "AP-Yard-12", type: "Network", status: "Active", owner: "IT Infrastructure", location: "Workshop B", risk: "Low", permission: "Assigned", requestStatus: "Approved", requiredLevel: 4, serial: "UB-U6-0012", manufacturer: "Ubiquiti", model: "UniFi U6-LR", ip: "10.24.40.12", os: "UniFi OS 3.2", lastSeen: "2026-08-24 09:14", health: "Healthy" }),

  device({ id: "IND-001", name: "Pump Unit-A12", type: "Equipment", status: "Maintenance", owner: "Maintenance Team", location: "Workshop", risk: "Medium", permission: "Maintenance Access", requestStatus: "In Review", requiredLevel: 6, serial: "PUMP-A12-2019", manufacturer: "KSB", model: "Etanorm 150-315", ip: "10.24.50.12", os: "PLC Controller v4.2", lastSeen: "2026-08-24 08:55", health: "Warning" }),
  device({ id: "IND-002", name: "Pump Unit-B07", type: "Equipment", status: "Active", owner: "Maintenance Team", location: "Workshop", risk: "Low", permission: "Maintenance Access", requestStatus: "Approved", requiredLevel: 6, serial: "PUMP-B07-2021", manufacturer: "Grundfos", model: "NK 125-250", ip: "10.24.50.7", os: "PLC Controller v4.2", lastSeen: "2026-08-24 08:58", health: "Healthy" }),
  device({ id: "IND-003", name: "Compressor-C02", type: "Equipment", status: "Active", owner: "Maintenance Team", location: "Workshop C", risk: "Medium", permission: "Maintenance Access", requestStatus: "Approved", requiredLevel: 6, serial: "COMP-C02-2018", manufacturer: "Atlas Copco", model: "GA 90", ip: "10.24.50.22", os: "Elektronikon v3.1", lastSeen: "2026-08-24 08:41", health: "Healthy" }),
  device({ id: "IND-004", name: "Gantry-Crane-GC03", type: "Equipment", status: "Active", owner: "Production Team", location: "Dry Dock", risk: "High", permission: "Operator Only", requestStatus: "Approved", requiredLevel: 5, serial: "GC-03-2015", manufacturer: "Liebherr", model: "TCC 78000", ip: "10.24.50.3", os: "LIDAT v2.8", lastSeen: "2026-08-24 08:33", health: "Healthy" }),
  device({ id: "IND-005", name: "Welding-Machine-WM14", type: "Equipment", status: "Active", owner: "Production Team", location: "Workshop B", risk: "Medium", permission: "Operator Only", requestStatus: "Approved", requiredLevel: 4, serial: "WM-014-2022", manufacturer: "Lincoln Electric", model: "Power Wave S500", ip: "10.24.50.14", os: "CheckPoint v1.6", lastSeen: "2026-08-24 08:12", health: "Healthy" }),
  device({ id: "IND-006", name: "CNC-Machine-CNC07", type: "Equipment", status: "Maintenance", owner: "Production Team", location: "Workshop A", risk: "Medium", permission: "Operator Only", requestStatus: "In Review", requiredLevel: 5, serial: "CNC-07-2019", manufacturer: "Mazak", model: "VARIAXIS i-600", ip: "10.24.50.6", os: "Mazatrol v8.0", lastSeen: "2026-08-23 16:22", health: "Warning" }),

  device({ id: "ACC-001", name: "Access Card-8812", type: "Badge", status: "Assigned", owner: "John Tan", location: "Main Gate", risk: "Low", permission: "Temporary Access", requestStatus: "Approved", requiredLevel: 2, serial: "HID-0008812", manufacturer: "HID", model: "iCLASS SE 3506", ip: "", os: "N/A", lastSeen: "2026-08-24 07:44", health: "Healthy" }),
  device({ id: "ACC-002", name: "Access Card-7721", type: "Badge", status: "Assigned", owner: "Feiyong Sun", location: "Main Gate", risk: "Low", permission: "Permanent Access", requestStatus: "Approved", requiredLevel: 7, serial: "HID-0007721", manufacturer: "HID", model: "iCLASS SE 3506", ip: "", os: "N/A", lastSeen: "2026-08-24 08:15", health: "Healthy" }),
  device({ id: "ACC-003", name: "Card-Reader-Gate1", type: "Access Control", status: "Active", owner: "Security Team", location: "Gate 1", risk: "Low", permission: "Security Team Only", requestStatus: "Approved", requiredLevel: 5, serial: "HID-RPK40-001", manufacturer: "HID", model: "RPK40", ip: "10.24.30.101", os: "Firmware 2.4", lastSeen: "2026-08-24 09:16", health: "Healthy" }),
  device({ id: "ACC-004", name: "Turnstile-MainGate", type: "Access Control", status: "Active", owner: "Security Team", location: "Main Gate", risk: "Low", permission: "Security Team Only", requestStatus: "Approved", requiredLevel: 5, serial: "TS-MG-2020", manufacturer: "Boon Edam", model: "Trilock 60", ip: "10.24.30.100", os: "Firmware 3.1", lastSeen: "2026-08-24 09:16", health: "Healthy" }),

  device({ id: "PRN-001", name: "Printer-Admin-01", type: "Printer", status: "Active", owner: "Admin Office", location: "Admin Office", risk: "Low", permission: "Shared", requestStatus: "Approved", requiredLevel: 3, serial: "HP-M404-001", manufacturer: "HP", model: "LaserJet Pro M404dn", ip: "10.24.12.90", os: "Firmware 4.9", lastSeen: "2026-08-24 08:05", health: "Healthy" }),
  device({ id: "TAB-001", name: "Tablet-Prod-05", type: "Tablet", status: "Active", owner: "Production Team", location: "Workshop A", risk: "Medium", permission: "Assigned", requestStatus: "Approved", requiredLevel: 4, serial: "IP-IPAD9-005", manufacturer: "Apple", model: "iPad 9th Gen", ip: "10.24.45.5", os: "iPadOS 18", lastSeen: "2026-08-24 08:50", health: "Healthy" }),
];

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const PEOPLE = [
  { id: "PER-00125", name: "John Tan", type: "Contractor", company: "ABC Engineering", site: "Tuas Yard", assignment: "Pump Unit-A12 Maintenance", status: "Active", valid_until: "2026-06-30", risk: "Low", cyber_level: 6, department: "Mechanical Maintenance", email: "john.tan@abc-engineering.com" },
  { id: "PER-00126", name: "Mary Lim", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "Operations Support", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 4, department: "Operations", email: "mary.lim@seatrium.com" },
  { id: "PER-00127", name: "Alan Goh", type: "Contractor", company: "TechServe", site: "Tuas Yard", assignment: "Network Maintenance", status: "Expiring", valid_until: "2026-05-18", risk: "Medium", cyber_level: 5, department: "IT Infrastructure", email: "alan.goh@techserve.com.sg" },
  { id: "PER-00128", name: "Feiyong Sun", type: "Employee", company: "Seatrium", site: "Tuas Yard", assignment: "Operations Manager", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 7, department: "Operations", email: "feiyong.sun@seatrium.com" },
  { id: "PER-00129", name: "Priya Nair", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "HSE Coordinator", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 5, department: "HSE", email: "priya.nair@seatrium.com" },
  { id: "PER-00130", name: "Muhammad Rizky", type: "Contractor", company: "Batam Engineering", site: "Tuas Yard", assignment: "Structural Welding", status: "Active", valid_until: "2026-09-30", risk: "Medium", cyber_level: 4, department: "Production", email: "rizky@batam-eng.co.id" },
  { id: "PER-00131", name: "Tan Wei Ming", type: "Employee", company: "Seatrium", site: "Tuas Yard", assignment: "Electrical Engineer", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 6, department: "Engineering", email: "weiming.tan@seatrium.com" },
  { id: "PER-00132", name: "Sarah Chen", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "Cybersecurity Analyst", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 6, department: "Cybersecurity", email: "sarah.chen@seatrium.com" },
  { id: "PER-00133", name: "David Ong", type: "Employee", company: "Seatrium", site: "Tuas Yard", assignment: "Crane Operator", status: "Active", valid_until: "Permanent", risk: "Medium", cyber_level: 4, department: "Production", email: "david.ong@seatrium.com" },
  { id: "PER-00134", name: "Nurul Aisyah", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "HR Executive", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 3, department: "HR", email: "nurul.aisyah@seatrium.com" },
  { id: "PER-00135", name: "Lim Kah Wee", type: "Contractor", company: "OTM Services", site: "Tuas Yard", assignment: "Scaffolding Supervisor", status: "Active", valid_until: "2026-08-31", risk: "Medium", cyber_level: 5, department: "Construction", email: "kahwee.lim@otm.com.sg" },
  { id: "PER-00136", name: "Ganesh Kumar", type: "Employee", company: "Seatrium", site: "Tuas Yard", assignment: "QA Inspector", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 5, department: "Quality", email: "ganesh.kumar@seatrium.com" },
  { id: "PER-00137", name: "Emily Wong", type: "Employee", company: "Seatrium", site: "Data Room", assignment: "Systems Administrator", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 7, department: "IT Infrastructure", email: "emily.wong@seatrium.com" },
  { id: "PER-00138", name: "Kelvin Teo", type: "Employee", company: "Seatrium", site: "Tuas Yard", assignment: "Production Supervisor", status: "Active", valid_until: "Permanent", risk: "Medium", cyber_level: 5, department: "Production", email: "kelvin.teo@seatrium.com" },
  { id: "PER-00139", name: "Aisyah Rahman", type: "Employee", company: "Seatrium", site: "Main Office", assignment: "Procurement Officer", status: "Active", valid_until: "Permanent", risk: "Low", cyber_level: 3, department: "Procurement", email: "aisyah.rahman@seatrium.com" },
  { id: "PER-00140", name: "Jason Lee", type: "Contractor", company: "MarineTech", site: "Tuas Yard", assignment: "Pipe Fitting", status: "Expiring", valid_until: "2026-07-15", risk: "Medium", cyber_level: 4, department: "Piping", email: "jason.lee@marinetech.sg" },
];

const PERMISSION_STEPS = [
  { step: "Request Submitted", owner: "Operations User", status: "Completed", note: "John Tan requested maintenance access for Pump Unit-A12." },
  { step: "Manager Review", owner: "Project Coordination Manager", status: "Completed", note: "Purpose and work order validated." },
  { step: "Permission Validation", owner: "System / Admin", status: "In Review", note: "Checking location, role, and access period." },
  { step: "Final Approval", owner: "Operations Admin", status: "Pending", note: "Awaiting approval before permission activation." },
  { step: "Access Activated", owner: "System", status: "Not Started", note: "Permission will be synced after approval." },
];

const RECOMMENDATIONS = [
  { severity: "warning", title: "Review maintenance request", detail: "Maintenance workflow for Pump Unit-A12 requires manager review." },
  { severity: "danger", title: "CCTV-CAM-21 offline", detail: "Camera at Gate 3 lost connectivity. Create an escalation to the Security Team." },
  { severity: "info", title: "Server-BAK-01 storage pressure", detail: "Backup server is at 89% capacity. Recommend adding a disk before the next backup window." },
];

const LEVEL_RULES = [
  { level: 7, scope: "Can access Level 1–7 resources, including restricted infrastructure." },
  { level: 6, scope: "Can access Level 1–6 resources. Cannot access Level 7 resources." },
  { level: 5, scope: "Can access Level 1–5 resources. Cannot access Level 6–7 resources." },
  { level: 4, scope: "Can access Level 1–4 resources. Cannot access Level 5–7 resources." },
  { level: 3, scope: "Can access Level 1–3 resources. Cannot access Level 4–7 resources." },
  { level: 2, scope: "Can access Level 1–2 resources. Cannot access Level 3–7 resources." },
  { level: 1, scope: "Can only access Level 1 resources." },
];

const SETTINGS = {
  "metric.activeResources": "42",
  "metric.activeResourcesNote": "97% availability across monitored systems",
  "metric.personnelOnSite": "96",
  "metric.personnelOnSiteNote": "18 contractors currently checked in",
  "metric.dailyOperations": "142",
  "metric.dailyOperationsNote": "Active operational activities today",
  "metric.aiInsights": "28",
  "metric.aiInsightsNote": "AI-generated recommendations today",
  "metric.activePermissions": "96",
  "metric.highestLevel": "7",
  engines: JSON.stringify([
    { name: "Claude Code", enabled: true },
    { name: "Microsoft Copilot", enabled: true },
    { name: "OpenAI Codex", enabled: false },
  ]),
  governance: JSON.stringify([
    { name: "Enable audit logs", enabled: true },
    { name: "Restrict AI from sensitive data", enabled: true },
    { name: "Enable AI operational recommendations", enabled: true },
    { name: "Require admin approval for major data updates", enabled: true },
  ]),
};

const AUDIT_LOGS = [
  { time: "2026-08-24 09:58", user: "Haiyang Xu", action: "Signed in to IntelliPath", result: "Success", category: "auth" },
  { time: "2026-08-24 09:56", user: "System", action: "Synced Microsoft Graph operational data", result: "Success", category: "system" },
  { time: "2026-08-24 09:50", user: "Feiyong Sun", action: "Approved maintenance activity WO-2026-0812-002", result: "Success", category: "permission" },
  { time: "2026-08-24 09:45", user: "John Tan", action: "Updated resource status for Pump Unit-A12", result: "Success", category: "resource" },
  { time: "2026-08-24 09:40", user: "AI Assistant", action: "Generated operational summary for the morning brief", result: "Completed", category: "ai" },
  { time: "2026-08-24 09:32", user: "System", action: "CCTV-CAM-21 health check failed (timeout)", result: "Warning", category: "system" },
  { time: "2026-08-24 09:18", user: "Mary Lim", action: "Searched 'Pump Unit-A12 maintenance history'", result: "Success", category: "search" },
  { time: "2026-08-24 08:57", user: "Alan Goh", action: "Updated firmware on Switch-Core-01", result: "Success", category: "resource" },
  { time: "2026-08-24 08:40", user: "Sarah Chen", action: "Reviewed failed login attempts for Server-DMZ-01", result: "Success", category: "auth" },
  { time: "2026-08-24 08:22", user: "System", action: "Scheduled backup completed for Server-NAS-01", result: "Success", category: "system" },
  { time: "2026-08-24 08:05", user: "Haiyang Xu", action: "Created resource record for Tablet-Prod-05", result: "Success", category: "resource" },
  { time: "2026-08-24 07:52", user: "Feiyong Sun", action: "Submitted permission request for Pump Unit-A12", result: "Success", category: "permission" },
  { time: "2026-08-24 07:30", user: "System", action: "Rotated TLS certificates for intellipath.seatrium.internal", result: "Success", category: "system" },
  { time: "2026-08-23 23:59", user: "System", action: "Generated daily operations report", result: "Completed", category: "ai" },
  { time: "2026-08-23 18:15", user: "Mary Lim", action: "Exported resource registry to CSV", result: "Success", category: "resource" },
  { time: "2026-08-23 17:40", user: "John Tan", action: "Requested temporary access to Workshop B", result: "Success", category: "permission" },
  { time: "2026-08-23 16:55", user: "System", action: "Detected repeated login failures on Laptop-2465098", result: "Warning", category: "auth" },
  { time: "2026-08-23 15:20", user: "Sarah Chen", action: "Updated cybersecurity level rule documentation", result: "Success", category: "settings" },
  { time: "2026-08-23 14:05", user: "Feiyong Sun", action: "Approved access for contractor Alan Goh", result: "Success", category: "permission" },
  { time: "2026-08-23 11:30", user: "AI Assistant", action: "Generated management summary for weekly review", result: "Completed", category: "ai" },
];

const SYSTEM_LOGS = [
  { timestamp: "2026-08-24 09:58:12", deviceId: "SRV-001", deviceName: "Server-SG01", source: "EventLog", eventType: "Health check", severity: "info", message: "CPU 14%, memory 41%, all services operational." },
  { timestamp: "2026-08-24 09:55:40", deviceId: "NET-003", deviceName: "Firewall-PA-01", source: "PAN-OS", eventType: "Threat", severity: "warning", message: "Blocked 3 inbound connection attempts from 185.220.101.34." },
  { timestamp: "2026-08-24 09:48:03", deviceId: "CCTV-001", deviceName: "CCTV-CAM-21", source: "Camera", eventType: "Connectivity", severity: "critical", message: "Device unreachable — last heartbeat 03:44 (timeout 6h)." },
  { timestamp: "2026-08-24 09:32:51", deviceId: "SRV-003", deviceName: "Server-BAK-01", source: "EventLog", eventType: "Disk", severity: "warning", message: "Volume /backup at 89% capacity." },
  { timestamp: "2026-08-24 09:21:18", deviceId: "NET-001", deviceName: "Switch-Core-01", source: "IOS-XE", eventType: "Config", severity: "info", message: "Configuration saved by Alan Goh (firmware update)." },
  { timestamp: "2026-08-24 09:10:44", deviceId: "IND-002", deviceName: "Pump Unit-B07", source: "PLC", eventType: "Operational", severity: "info", message: "Flow rate nominal (1420 L/min), vibration within limits." },
  { timestamp: "2026-08-24 08:58:37", deviceId: "IND-001", deviceName: "Pump Unit-A12", source: "PLC", eventType: "Operational", severity: "warning", message: "Bearing temperature 78°C — approaching maintenance threshold." },
  { timestamp: "2026-08-24 08:47:20", deviceId: "ACC-004", deviceName: "Turnstile-MainGate", source: "Access", eventType: "Access", severity: "info", message: "Granted entry: John Tan (temporary badge, zone Tuas Yard)." },
  { timestamp: "2026-08-24 08:44:05", deviceId: "ACC-004", deviceName: "Turnstile-MainGate", source: "Access", eventType: "Access", severity: "warning", message: "Denied entry: unknown badge 0x7F3A9C (Gate 1)." },
  { timestamp: "2026-08-24 08:31:19", deviceId: "SRV-002", deviceName: "Server-SG02", source: "EventLog", eventType: "Auth", severity: "warning", message: "5 failed sign-in attempts for user 'svc.backup'." },
  { timestamp: "2026-08-24 08:12:02", deviceId: "IND-005", deviceName: "Welding-Machine-WM14", source: "CheckPoint", eventType: "Operational", severity: "info", message: "Weld cycle #22841 completed, parameters recorded." },
  { timestamp: "2026-08-24 07:59:48", deviceId: "CCTV-002", deviceName: "CCTV-CAM-14", source: "Camera", eventType: "Connectivity", severity: "info", message: "Recording resumed after scheduled maintenance window." },
  { timestamp: "2026-08-24 07:44:30", deviceId: "NET-005", deviceName: "AP-Yard-12", source: "UniFi", eventType: "Client", severity: "info", message: "34 wireless clients associated, channel 36 (5 GHz)." },
  { timestamp: "2026-08-23 23:59:01", deviceId: "SRV-006", deviceName: "Server-NAS-01", source: "Backup", eventType: "Backup", severity: "info", message: "Nightly backup completed — 412 GB in 3h 12m." },
  { timestamp: "2026-08-23 22:40:22", deviceId: "SRV-003", deviceName: "Server-BAK-01", source: "EventLog", eventType: "Disk", severity: "warning", message: "Smart array predicted failure on physical disk 3." },
  { timestamp: "2026-08-23 18:05:17", deviceId: "CCTV-005", deviceName: "CCTV-CAM-33", source: "Camera", eventType: "Connectivity", severity: "warning", message: "Intermittent packet loss (4.2%) on uplink." },
  { timestamp: "2026-08-23 16:55:09", deviceId: "AST-004", deviceName: "Laptop-2465098", source: "EDR", eventType: "Threat", severity: "warning", message: "Endpoint quarantined suspicious file 'invoice_scan.exe'." },
  { timestamp: "2026-08-23 14:30:44", deviceId: "NET-004", deviceName: "Firewall-FG-02", source: "FortiOS", eventType: "Threat", severity: "info", message: "Web filter blocked category 'malware' for client 10.24.15.82." },
  { timestamp: "2026-08-23 11:02:30", deviceId: "IND-004", deviceName: "Gantry-Crane-GC03", source: "LIDAT", eventType: "Operational", severity: "info", message: "Lift #883 completed: 210 t, wind 6.4 m/s within limits." },
];

export function seedDatabase(db, { force = false } = {}) {
  const usersExist = db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0;
  const resourcesExist = db.prepare("SELECT COUNT(*) AS n FROM resources").get().n > 0;

  if (force) {
    if (db.prepare("SELECT name FROM sqlite_master WHERE name='uploads'").get()) db.exec("DELETE FROM uploads;");
    if (db.prepare("SELECT name FROM sqlite_master WHERE name='knowledge_records'").get()) db.exec('DELETE FROM knowledge_records; DELETE FROM operation_migrations;');
    db.exec(
      "DELETE FROM permission_steps; DELETE FROM permission_requests; DELETE FROM resources; DELETE FROM people; DELETE FROM audit_logs; DELETE FROM ai_recommendations; DELETE FROM settings; DELETE FROM level_rules; DELETE FROM system_logs; DELETE FROM sessions; DELETE FROM users;"
    );
  }

  const seeded = [];
  if (force || !usersExist) {
    seedUsers(db);
    seeded.push("users");
  }
  if (force || !resourcesExist) {
    seedDomain(db);
    seeded.push("domain");
  }
  return { seeded: seeded.length > 0, domains: seeded };
}

function seedUsers(db) {
  const ins = db.prepare(
    "INSERT INTO users (username, password_hash, name, role, email) VALUES (?, ?, ?, ?, ?)"
  );
  for (const u of USERS) {
    ins.run(u.username, hashPassword(u.password), u.name, u.role, u.email);
  }
}

function seedDomain(db) {
  const insResource = db.prepare(
    "INSERT INTO resources (id, name, type, status, owner, location, risk, permission, request_status, required_level, serial_number, manufacturer, model, ip_address, os, last_seen, health) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const r of RESOURCES) {
    insResource.run(r.id, r.name, r.type, r.status, r.owner, r.location, r.risk, r.permission, r.request_status, r.required_level, r.serial_number, r.manufacturer, r.model, r.ip_address, r.os, r.last_seen, r.health);
  }

  const insPerson = db.prepare(
    "INSERT INTO people (id, name, type, company, site, assignment, status, valid_until, risk, cyber_level, department, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  for (const p of PEOPLE) {
    insPerson.run(p.id, p.name, p.type, p.company, p.site, p.assignment, p.status, p.valid_until, p.risk, p.cyber_level, p.department, p.email);
  }

  const insRequest = db.prepare(
    "INSERT INTO permission_requests (resource_id, requester_id, title, overall_status) VALUES (?, ?, ?, ?)"
  );
  const req1 = insRequest.run("IND-001", "PER-00125", "Maintenance access for Pump Unit-A12", "In Review");
  const req2 = insRequest.run("CCTV-005", "PER-00127", "Camera maintenance access for Warehouse B", "Pending");

  const insStep = db.prepare(
    "INSERT INTO permission_steps (request_id, step, owner, status, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  PERMISSION_STEPS.forEach((s, i) => insStep.run(Number(req1.lastInsertRowid), s.step, s.owner, s.status, s.note, i + 1));
  [
    { step: "Request Submitted", owner: "Operations User", status: "Completed", note: "Alan Goh requested camera maintenance access for Warehouse B." },
    { step: "Manager Review", owner: "Project Coordination Manager", status: "Completed", note: "Work order WO-2026-0814-011 validated." },
    { step: "Permission Validation", owner: "System / Admin", status: "Pending", note: "Verifying Security Team clearance." },
  ].forEach((s, i) => insStep.run(Number(req2.lastInsertRowid), s.step, s.owner, s.status, s.note, i + 1));

  const insAudit = db.prepare(
    "INSERT INTO audit_logs (time, user, action, result, category) VALUES (?, ?, ?, ?, ?)"
  );
  for (const a of AUDIT_LOGS) insAudit.run(a.time, a.user, a.action, a.result, a.category);

  const insSys = db.prepare(
    "INSERT INTO system_logs (timestamp, device_id, device_name, source, event_type, severity, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  for (const s of SYSTEM_LOGS) insSys.run(s.timestamp, s.deviceId, s.deviceName, s.source, s.eventType, s.severity, s.message);

  const insRec = db.prepare(
    "INSERT INTO ai_recommendations (severity, title, detail) VALUES (?, ?, ?)"
  );
  for (const r of RECOMMENDATIONS) insRec.run(r.severity, r.title, r.detail);

  const insRule = db.prepare("INSERT INTO level_rules (level, scope) VALUES (?, ?)");
  for (const r of LEVEL_RULES) insRule.run(r.level, r.scope);

  const insSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(SETTINGS)) insSetting.run(key, value);
}

// Allow `npm run seed` to force-reset demo data.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { DatabaseSync } = await import("node:sqlite");
  const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "intellipath.db");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  const result = seedDatabase(db, { force: true });
  migrateOperations(db);
  migrateWorkspace(db);
  console.log(`Seed ${result.seeded ? "complete" : "skipped"} -> ${DB_PATH}`);
  db.close();
}
