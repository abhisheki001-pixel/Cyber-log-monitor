/* =========================================================================
   logs.js — Logic for logs.html (Live Security Logs page)
   -------------------------------------------------------------------------
   - Loads mock logs through CyberLogAPI
   - Applies client-side search/filter (this will later become query params
     sent to GET /api/logs instead of filtering an in-memory array)
   - Simple pagination
   - "Start/Pause Monitoring" simulates new log lines arriving, using
     setInterval — swap this for a WebSocket or polling call to Flask later
   ========================================================================= */

let allLogs = [];
let filteredLogs = [];
let currentPage = 1;
const PAGE_SIZE = 6;
let liveInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  loadLogs();

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("ipFilter").addEventListener("input", applyFilters);
  document.getElementById("userFilter").addEventListener("input", applyFilters);
  document.getElementById("severityFilter").addEventListener("change", applyFilters);
  document.getElementById("statusFilter").addEventListener("change", applyFilters);
  document.getElementById("resetFiltersBtn").addEventListener("click", resetFilters);

  document.getElementById("prevPageBtn").addEventListener("click", () => changePage(-1));
  document.getElementById("nextPageBtn").addEventListener("click", () => changePage(1));

  document.getElementById("startBtn").addEventListener("click", startMonitoring);
  document.getElementById("pauseBtn").addEventListener("click", pauseMonitoring);
  document.getElementById("clearBtn").addEventListener("click", clearView);
  document.getElementById("exportBtn").addEventListener("click", exportCsv);
});

function loadLogs() {
  document.getElementById("logsBody").innerHTML = `<tr><td colspan="7" class="state-msg">Loading security events…</td></tr>`;
  CyberLogAPI.getLogs().then((logs) => {
    allLogs = logs;
    applyFilters();
  });
}

function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const ip = document.getElementById("ipFilter").value.toLowerCase();
  const user = document.getElementById("userFilter").value.toLowerCase();
  const severity = document.getElementById("severityFilter").value;
  const status = document.getElementById("statusFilter").value;

  filteredLogs = allLogs.filter((log) => {
    const matchesSearch = !search || JSON.stringify(log).toLowerCase().includes(search);
    const matchesIp = !ip || log.ip.toLowerCase().includes(ip);
    const matchesUser = !user || log.username.toLowerCase().includes(user);
    const matchesSeverity = !severity || log.severity === severity;
    const matchesStatus = !status || log.status === status;
    return matchesSearch && matchesIp && matchesUser && matchesSeverity && matchesStatus;
  });

  currentPage = 1;
  renderLogsTable();
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("ipFilter").value = "";
  document.getElementById("userFilter").value = "";
  document.getElementById("severityFilter").value = "";
  document.getElementById("statusFilter").value = "";
  applyFilters();
}

function renderLogsTable() {
  const tbody = document.getElementById("logsBody");
  const pageInfo = document.getElementById("pageInfo");

  if (!filteredLogs.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="state-msg">No log events available for the selected filters.</td></tr>`;
    pageInfo.textContent = "Showing 0 of 0 logs";
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredLogs.slice(start, start + PAGE_SIZE);

  tbody.innerHTML = pageItems
    .map(
      (log) => `
      <tr>
        <td class="mono">${log.timestamp}</td>
        <td class="mono">${log.ip}</td>
        <td>${log.username}</td>
        <td>${log.eventType}</td>
        <td>${log.action}</td>
        <td>${log.status === "SUCCESS" ? statusPill("Success") : statusPill("Failed")}</td>
        <td>${severityBadge(log.severity)}</td>
      </tr>`
    )
    .join("");

  pageInfo.textContent = `Showing ${start + 1}-${Math.min(start + PAGE_SIZE, filteredLogs.length)} of ${filteredLogs.length} logs`;
}

function changePage(direction) {
  const maxPage = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  currentPage = Math.min(Math.max(1, currentPage + direction), maxPage);
  renderLogsTable();
}

/** Simulates new log entries streaming in every few seconds. */
function startMonitoring() {
  if (liveInterval) return;
  showToast("Live monitoring started");
  liveInterval = setInterval(() => {
    const sample = allLogs[Math.floor(Math.random() * allLogs.length)];
    const newLog = {
      ...sample,
      id: "LOG-" + Math.floor(Math.random() * 9000 + 1000),
      timestamp: new Date().toLocaleTimeString(),
    };
    allLogs.unshift(newLog);
    applyFilters();
  }, 4000);
}

function pauseMonitoring() {
  clearInterval(liveInterval);
  liveInterval = null;
  showToast("Live monitoring paused");
}

function clearView() {
  allLogs = [];
  filteredLogs = [];
  renderLogsTable();
}

/** Exports the currently filtered rows as a downloadable CSV file. */
function exportCsv() {
  if (!filteredLogs.length) {
    showToast("Nothing to export");
    return;
  }
  const header = "Timestamp,IP,Username,Event,Action,Status,Severity\n";
  const rows = filteredLogs
    .map((l) => [l.timestamp, l.ip, l.username, l.eventType, l.action, l.status, l.severity].join(","))
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "cyberlog-logs-export.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Logs exported as CSV");
}
