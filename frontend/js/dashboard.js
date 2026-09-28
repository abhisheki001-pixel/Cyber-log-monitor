/* =========================================================================
   dashboard.js — Logic for index.html (Security Overview page)
   -------------------------------------------------------------------------
   Everything here reads through CyberLogAPI (see api.js), never touching
   mock arrays directly, so swapping in a real Flask API later only means
   editing api.js.
   ========================================================================= */

let eventsChart = null;
let severityChart = null;

document.addEventListener("DOMContentLoaded", () => {
  renderSummaryCards();
  renderEventsChart("24h");
  renderSeverityChart();
  renderRecentAlerts();

  document.getElementById("refreshBtn")?.addEventListener("click", () => {
    showToast("Refreshing dashboard data…");
    renderSummaryCards();
    renderRecentAlerts();
  });

  // Range filter buttons above the events chart
  document.querySelectorAll("[data-range]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-range]").forEach((b) => b.classList.remove("btn-primary"));
      btn.classList.add("btn-primary");
      renderEventsChart(btn.dataset.range);
    });
  });

  // Re-render the alert table if an alert's status changed in the modal
  document.addEventListener("alerts:changed", renderRecentAlerts);
});

function renderSummaryCards() {
  // Sample summary numbers per the spec. A Flask version would fetch these
  // from something like GET /api/system-status or a dedicated summary endpoint.
  const stats = [
    { icon: "📊", label: "Total Events", value: "12,450", trend: "+8.4%", up: true, desc: "Events processed" },
    { icon: "🚨", label: "Security Alerts", value: "127", trend: "+12", up: true, tone: "warn" },
    { icon: "⛔", label: "Critical Alerts", value: "14", trend: "Requires attention", tone: "danger" },
    { icon: "🔑", label: "Failed Logins", value: "326", trend: "Authentication failures", tone: "warn" },
    { icon: "🌐", label: "Suspicious IPs", value: "18", trend: "Flagged addresses", tone: "danger" },
    { icon: "👤", label: "Active Users", value: "42", trend: "Generating events", tone: "" },
  ];

  const grid = document.getElementById("statGrid");
  grid.innerHTML = stats
    .map(
      (s) => `
      <div class="stat-card ${s.tone || ""}">
        <div class="stat-icon">${s.icon}</div>
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
        <div class="stat-trend ${s.up ? "up" : ""}">${s.trend}</div>
      </div>`
    )
    .join("");
}

function renderEventsChart(range) {
  CyberLogAPI.getEventsTimeSeries(range).then((data) => {
    const ctx = document.getElementById("eventsChart").getContext("2d");
    const config = {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          { label: "Successful Logins", data: data.success, borderColor: "#35d07f", backgroundColor: "rgba(53,208,127,.1)", tension: .3, fill: true },
          { label: "Failed Logins", data: data.failed, borderColor: "#f4d35e", backgroundColor: "rgba(244,211,94,.1)", tension: .3, fill: true },
          { label: "Suspicious Events", data: data.suspicious, borderColor: "#ff5470", backgroundColor: "rgba(255,84,112,.1)", tension: .3, fill: true },
        ],
      },
      options: chartBaseOptions(),
    };
    if (eventsChart) eventsChart.destroy();
    eventsChart = new Chart(ctx, config);
  });
}

function renderSeverityChart() {
  CyberLogAPI.getThreatSeverityBreakdown().then((data) => {
    const ctx = document.getElementById("severityChart").getContext("2d");
    if (severityChart) severityChart.destroy();
    severityChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Critical", "High", "Medium", "Low", "Informational"],
        datasets: [{
          data: [data.critical, data.high, data.medium, data.low, data.info],
          backgroundColor: ["#ff5470", "#ff9f45", "#f4d35e", "#4d9de0", "#8b98a9"],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { color: getComputedStyle(document.body).getPropertyValue("--text-mid") } } },
      },
    });
  });
}

function renderRecentAlerts() {
  const tbody = document.getElementById("recentAlertsBody");
  tbody.innerHTML = `<tr><td colspan="8" class="state-msg">Loading security events…</td></tr>`;

  CyberLogAPI.getAlerts().then((alerts) => {
    if (!alerts.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="state-msg">No security alerts found.</td></tr>`;
      return;
    }
    tbody.innerHTML = alerts
      .slice(0, 5)
      .map(
        (a) => `
        <tr>
          <td class="mono">${a.alertId}</td>
          <td>${a.timestamp}</td>
          <td>${severityBadge(a.severity)}</td>
          <td>${a.alertType}</td>
          <td class="mono">${a.sourceIp}</td>
          <td>${a.username}</td>
          <td>${statusPill(a.status)}</td>
          <td><button class="btn btn-sm" onclick="openAlertModal('${a.alertId}')">View</button></td>
        </tr>`
      )
      .join("");
  });
}

/** Shared Chart.js option set so every line/bar chart looks consistent. */
function chartBaseOptions() {
  const mutedColor = getComputedStyle(document.body).getPropertyValue("--text-mid") || "#a9b4c4";
  const gridColor = "rgba(255,255,255,0.06)";
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { position: "bottom", labels: { color: mutedColor } } },
    scales: {
      x: { ticks: { color: mutedColor }, grid: { color: gridColor } },
      y: { ticks: { color: mutedColor }, grid: { color: gridColor }, beginAtZero: true },
    },
  };
}
