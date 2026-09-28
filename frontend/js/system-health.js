/* =========================================================================
   system-health.js — Logic for system-health.html
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  CyberLogAPI.getSystemStatus().then((status) => {
    renderHealthCards(status);
    renderPerformanceChart();
  });
});

function renderHealthCards(status) {
  const components = [
    { name: "Log Collector", ...status.logCollector },
    { name: "Detection Engine", ...status.detectionEngine },
    { name: "Database", ...status.database },
    { name: "Flask API", ...status.api },
    { name: "Dashboard", ...status.dashboard },
  ];

  document.getElementById("healthGrid").innerHTML = components
    .map((c) => {
      const isUp = ["Online", "Running", "Connected"].includes(c.status);
      return `
        <div class="card">
          <div class="card-head"><h3>${c.name}</h3>${isUp ? statusPill("Online") : statusPill("Offline")}</div>
          <div class="detail-grid">
            <div><div class="k">Status</div><div class="v">${c.status}</div></div>
            <div><div class="k">Last Checked</div><div class="v mono">${c.lastChecked}</div></div>
            <div><div class="k">Response Time</div><div class="v mono">${c.responseTime}</div></div>
            <div><div class="k">Error Count</div><div class="v">${c.errorCount}</div></div>
          </div>
        </div>`;
    })
    .join("");
}

function renderPerformanceChart() {
  const ctx = document.getElementById("perfChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["-10m", "-8m", "-6m", "-4m", "-2m", "Now"],
      datasets: [
        { label: "CPU %", data: [22, 28, 25, 31, 27, 24], borderColor: "#2bd9b9", tension: .3 },
        { label: "Memory %", data: [40, 42, 41, 45, 44, 43], borderColor: "#4d9de0", tension: .3 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { color: "#a9b4c4" } } },
      scales: {
        x: { ticks: { color: "#a9b4c4" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { ticks: { color: "#a9b4c4" }, grid: { color: "rgba(255,255,255,.06)" }, beginAtZero: true, max: 100 },
      },
    },
  });
}
