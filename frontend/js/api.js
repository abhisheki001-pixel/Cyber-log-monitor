/* =========================================================================
   api.js — Data access layer
   -------------------------------------------------------------------------
   Every function here returns a Promise, exactly like a `fetch()` call
   would. Right now they resolve with mock/sample data after a short fake
   delay (to simulate network latency). When the Flask backend is ready,
   replace the BODY of each function with a real fetch call — the rest of
   the app (dashboard.js, logs.js, alerts.js, ...) calls these functions
   and never touches mock data directly, so no other file needs to change.

   Example of what a "real" version will look like:

     async function fetchAlerts() {
       const res = await fetch("/api/alerts");
       if (!res.ok) throw new Error("Failed to load alerts");
       return res.json();
     }

   Endpoint map (for the future Flask backend):
     GET /api/logs             -> getLogs()
     GET /api/logs/recent      -> getRecentLogs()
     GET /api/alerts           -> getAlerts()
     GET /api/alerts/<id>      -> getAlertById(id)
     GET /api/threats          -> getThreatRules()
     GET /api/users            -> getUsers()
     GET /api/ip/<ip>          -> getIpDetails(ip)
     GET /api/reports          -> getReportData(type, range)
     GET /api/system-status    -> getSystemStatus()
   ========================================================================= */

const MOCK_DELAY_MS = 250;

/** Small helper so every mock function "feels" async like a real fetch. */
function resolveAfterDelay(data, delay = MOCK_DELAY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

/* ---------- MOCK DATA SETS ---------------------------------------------- */
/* Shapes below match the objects requested in the spec (Log, Alert, User,
   IP, SystemStatus) so backend JSON can be swapped in without renaming
   fields used elsewhere in the UI code. */

const MOCK_LOGS = [
  { id: "LOG-1042", timestamp: "09:52:10", ip: "192.168.1.10", username: "admin", eventType: "LOGIN", action: "Authentication", status: "SUCCESS", severity: "INFO" },
  { id: "LOG-1043", timestamp: "09:53:11", ip: "192.168.1.50", username: "admin", eventType: "LOGIN", action: "Authentication", status: "FAILED", severity: "MEDIUM" },
  { id: "LOG-1044", timestamp: "09:53:15", ip: "192.168.1.50", username: "admin", eventType: "LOGIN", action: "Authentication", status: "FAILED", severity: "MEDIUM" },
  { id: "LOG-1045", timestamp: "09:53:19", ip: "192.168.1.50", username: "admin", eventType: "LOGIN", action: "Authentication", status: "FAILED", severity: "HIGH" },
  { id: "LOG-1046", timestamp: "09:54:02", ip: "10.0.0.25", username: "user1", eventType: "LOGIN", action: "Authentication", status: "FAILED", severity: "MEDIUM" },
  { id: "LOG-1047", timestamp: "09:54:40", ip: "192.168.1.15", username: "user2", eventType: "LOGIN", action: "Authentication", status: "SUCCESS", severity: "INFO" },
  { id: "LOG-1048", timestamp: "09:55:03", ip: "203.0.113.9", username: "unknown", eventType: "LOGIN", action: "Authentication", status: "FAILED", severity: "HIGH" },
  { id: "LOG-1049", timestamp: "09:55:47", ip: "192.168.1.10", username: "admin", eventType: "PRIV_CHANGE", action: "Role Update", status: "SUCCESS", severity: "HIGH" },
  { id: "LOG-1050", timestamp: "09:56:12", ip: "10.0.0.25", username: "user1", eventType: "LOGOUT", action: "Session End", status: "SUCCESS", severity: "INFO" },
  { id: "LOG-1051", timestamp: "09:57:00", ip: "198.51.100.4", username: "sam", eventType: "LOGIN", action: "Authentication", status: "SUCCESS", severity: "INFO" },
];

const MOCK_ALERTS = [
  { alertId: "AL-001", timestamp: "09:45:21", alertType: "Brute Force Attempt", severity: "HIGH", sourceIp: "192.168.1.50", destination: "auth-server-01", username: "admin", description: "5 failed authentication attempts within a 60 second window.", detectionRule: "R001 — Multiple Failed Logins", status: "Open", eventCount: 5,
    timeline: [
      { time: "09:51:01", text: "Failed login" }, { time: "09:51:08", text: "Failed login" },
      { time: "09:51:15", text: "Failed login" }, { time: "09:51:23", text: "Failed login" },
      { time: "09:51:31", text: "Failed login" }, { time: "09:51:32", text: "Alert generated" },
    ] },
  { alertId: "AL-002", timestamp: "09:42:17", alertType: "Multiple Failed Login", severity: "MEDIUM", sourceIp: "10.0.0.25", destination: "auth-server-01", username: "user1", description: "Repeated failed logins from a single source IP.", detectionRule: "R001 — Multiple Failed Logins", status: "Investigating", eventCount: 3,
    timeline: [ { time: "09:41:50", text: "Failed login" }, { time: "09:42:05", text: "Failed login" }, { time: "09:42:17", text: "Alert generated" } ] },
  { alertId: "AL-003", timestamp: "09:39:05", alertType: "Unusual Login", severity: "LOW", sourceIp: "192.168.1.15", destination: "auth-server-02", username: "user2", description: "Login observed outside the user's typical activity window.", detectionRule: "R003 — Unusual Login Activity", status: "Resolved", eventCount: 1,
    timeline: [ { time: "09:39:05", text: "Login outside usual hours" } ] },
  { alertId: "AL-004", timestamp: "09:33:44", alertType: "Multiple Usernames from IP", severity: "MEDIUM", sourceIp: "203.0.113.9", destination: "auth-server-01", username: "multiple", description: "5 distinct usernames attempted from one IP within 5 minutes.", detectionRule: "R002 — Multiple Usernames from IP", status: "Open", eventCount: 5,
    timeline: [ { time: "09:30:10", text: "Login attempt: guest" }, { time: "09:31:02", text: "Login attempt: root" }, { time: "09:33:44", text: "Alert generated" } ] },
  { alertId: "AL-005", timestamp: "09:20:12", alertType: "Privilege Change", severity: "HIGH", sourceIp: "192.168.1.10", destination: "auth-server-01", username: "admin", description: "Account role elevated to administrator.", detectionRule: "R004 — Privilege Change", status: "Resolved", eventCount: 1,
    timeline: [ { time: "09:20:12", text: "Role changed to admin" } ] },
];

const MOCK_THREAT_RULES = [
  { ruleId: "R001", name: "Multiple Failed Logins", description: "Detect repeated authentication failures.", severity: "HIGH", threshold: "5 attempts / 60 sec", status: "Enabled" },
  { ruleId: "R002", name: "Multiple Usernames from IP", description: "Detect multiple account attempts from one source.", severity: "MEDIUM", threshold: "5 usernames / 5 min", status: "Enabled" },
  { ruleId: "R003", name: "Unusual Login Activity", description: "Detect authentication outside a user's usual pattern.", severity: "MEDIUM", threshold: "Configurable", status: "Enabled" },
  { ruleId: "R004", name: "Privilege Change", description: "Detect privilege or role-related account events.", severity: "HIGH", threshold: "Any occurrence", status: "Enabled" },
];

const MOCK_USERS = [
  { username: "admin", lastLogin: "09:55:47", loginCount: 214, failedAttempts: 3, associatedIps: ["192.168.1.10", "192.168.1.50"], status: "Active", risk: "MEDIUM" },
  { username: "user1", lastLogin: "09:56:12", loginCount: 87, failedAttempts: 1, associatedIps: ["10.0.0.25"], status: "Active", risk: "LOW" },
  { username: "user2", lastLogin: "09:54:40", loginCount: 42, failedAttempts: 0, associatedIps: ["192.168.1.15"], status: "Active", risk: "LOW" },
  { username: "sam", lastLogin: "09:57:00", loginCount: 12, failedAttempts: 0, associatedIps: ["198.51.100.4"], status: "Active", risk: "LOW" },
  { username: "unknown", lastLogin: "09:55:03", loginCount: 1, failedAttempts: 1, associatedIps: ["203.0.113.9"], status: "Flagged", risk: "HIGH" },
];

const MOCK_IPS = {
  "192.168.1.50": { ip: "192.168.1.50", riskLevel: "HIGH", totalEvents: 34, failedLogins: 12, successfulLogins: 4, firstSeen: "2026-09-20 08:14", lastSeen: "2026-09-27 09:53", associatedUsers: ["admin"], alertCount: 2 },
  "203.0.113.9": { ip: "203.0.113.9", riskLevel: "CRITICAL", totalEvents: 18, failedLogins: 15, successfulLogins: 0, firstSeen: "2026-09-27 09:20", lastSeen: "2026-09-27 09:55", associatedUsers: ["unknown", "guest", "root"], alertCount: 3 },
  "10.0.0.25": { ip: "10.0.0.25", riskLevel: "LOW", totalEvents: 51, failedLogins: 2, successfulLogins: 49, firstSeen: "2026-08-01 10:00", lastSeen: "2026-09-27 09:56", associatedUsers: ["user1"], alertCount: 1 },
};

const MOCK_SYSTEM_STATUS = {
  logCollector: { status: "Online", lastChecked: "09:55:10", responseTime: "12ms", errorCount: 0 },
  detectionEngine: { status: "Running", lastChecked: "09:55:10", responseTime: "8ms", errorCount: 0 },
  database: { status: "Connected", lastChecked: "09:55:10", responseTime: "4ms", errorCount: 0 },
  api: { status: "Online", lastChecked: "09:55:10", responseTime: "15ms", errorCount: 0 },
  dashboard: { status: "Online", lastChecked: "09:55:10", responseTime: "—", errorCount: 0 },
  lastUpdated: "09:55:10",
};

/* ---------- PUBLIC API FUNCTIONS ---------------------------------------- */
// Attach everything to a single namespace object so pages just call
// CyberLogAPI.getAlerts() etc. Avoids polluting the global scope.
const CyberLogAPI = {
  getLogs: () => resolveAfterDelay(MOCK_LOGS),
  getRecentLogs: (limit = 5) => resolveAfterDelay(MOCK_LOGS.slice(-limit).reverse()),

  getAlerts: () => resolveAfterDelay(MOCK_ALERTS),
  getAlertById: (id) => resolveAfterDelay(MOCK_ALERTS.find((a) => a.alertId === id) || null),

  getThreatRules: () => resolveAfterDelay(MOCK_THREAT_RULES),

  getUsers: () => resolveAfterDelay(MOCK_USERS),

  getIpDetails: (ip) => resolveAfterDelay(MOCK_IPS[ip] || null),

  getSystemStatus: () => resolveAfterDelay(MOCK_SYSTEM_STATUS),

  // Chart-friendly sample series for "Security Events Over Time"
  getEventsTimeSeries: (range = "24h") => {
    const labels24h = ["00:00","03:00","06:00","09:00","12:00","15:00","18:00","21:00"];
    const labels7d = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const labels30d = Array.from({ length: 10 }, (_, i) => `Day ${i * 3 + 1}`);
    const dataset = {
      "24h": { labels: labels24h, success: [120,90,60,220,310,280,190,140], failed: [10,8,4,35,42,30,20,14], suspicious: [1,0,1,6,9,5,3,2] },
      "7d":  { labels: labels7d,  success: [900,860,910,940,980,700,610], failed: [60,55,70,80,95,40,35], suspicious: [4,3,6,9,12,3,2] },
      "30d": { labels: labels30d, success: [3200,3400,3100,3600,3800,3500,3700,3900,4000,4100], failed: [180,200,190,240,260,230,250,270,300,290], suspicious: [12,15,10,18,22,19,20,24,26,28] },
    };
    return resolveAfterDelay(dataset[range] || dataset["24h"]);
  },

  // Sample series for "Threat Severity" doughnut chart
  getThreatSeverityBreakdown: () => resolveAfterDelay({ critical: 14, high: 32, medium: 51, low: 25, info: 5 }),

  getReportPreview: (type) => resolveAfterDelay({
    reportType: type,
    reportingPeriod: "Sep 20 – Sep 27, 2026",
    totalEvents: 12450,
    successfulLogins: 9800,
    failedLogins: 326,
    totalAlerts: 127,
    criticalAlerts: 14,
    highAlerts: 32,
    mediumAlerts: 51,
    lowAlerts: 30,
    topAlertTypes: ["Brute Force Attempt", "Multiple Failed Login", "Unusual Login"],
    topActiveIps: ["192.168.1.50", "10.0.0.25", "203.0.113.9"],
  }),
};
