/* =========================================================================
   alerts.js — Logic for alerts.html (Security Alerts management page)
   ========================================================================= */

let allAlerts = [];

document.addEventListener("DOMContentLoaded", () => {
  loadAlerts();

  document.getElementById("severityFilter").addEventListener("change", renderAlertsTable);
  document.getElementById("statusFilter").addEventListener("change", renderAlertsTable);
  document.getElementById("ipFilter").addEventListener("input", renderAlertsTable);
  document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    document.getElementById("severityFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("ipFilter").value = "";
    renderAlertsTable();
  });

  // Refresh both the summary cards and the table whenever a status changes
  // (e.g. clicking "Resolve" inside the details modal).
  document.addEventListener("alerts:changed", () => {
    renderSummary();
    renderAlertsTable();
  });
});

function loadAlerts() {
  CyberLogAPI.getAlerts().then((alerts) => {
    allAlerts = alerts;
    renderSummary();
    renderAlertsTable();
  });
}

function renderSummary() {
  const total = allAlerts.length;
  const open = allAlerts.filter((a) => a.status === "Open").length;
  const investigating = allAlerts.filter((a) => a.status === "Investigating").length;
  const resolved = allAlerts.filter((a) => a.status === "Resolved").length;
  const critical = allAlerts.filter((a) => a.severity === "CRITICAL" || a.severity === "HIGH").length;

  const cards = [
    { label: "Total Alerts", value: total, tone: "" },
    { label: "Open", value: open, tone: "danger" },
    { label: "Investigating", value: investigating, tone: "warn" },
    { label: "Resolved", value: resolved, tone: "" },
    { label: "Critical / High", value: critical, tone: "danger" },
  ];
  document.getElementById("alertStatGrid").innerHTML = cards
    .map((c) => `
      <div class="stat-card ${c.tone}">
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`)
    .join("");
}

function renderAlertsTable() {
  const severity = document.getElementById("severityFilter").value;
  const status = document.getElementById("statusFilter").value;
  const ip = document.getElementById("ipFilter").value.toLowerCase();

  const rows = allAlerts.filter((a) =>
    (!severity || a.severity === severity) &&
    (!status || a.status === status) &&
    (!ip || a.sourceIp.toLowerCase().includes(ip))
  );

  const tbody = document.getElementById("alertsBody");
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="state-msg">No security alerts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      (a) => `
      <tr>
        <td class="mono">${a.alertId}</td>
        <td>${a.timestamp}</td>
        <td>${a.alertType}</td>
        <td>${severityBadge(a.severity)}</td>
        <td class="mono">${a.sourceIp}</td>
        <td>${a.username}</td>
        <td>${a.description}</td>
        <td>${statusPill(a.status)}</td>
        <td><button class="btn btn-sm" onclick="openAlertModal('${a.alertId}')">View Details</button></td>
      </tr>`
    )
    .join("");
}
