/* =========================================================================
   ip-analysis.js — Logic for ip-analysis.html
   -------------------------------------------------------------------------
   IMPORTANT: the "risk level" shown here is a system-generated indicator
   based on the detection engine's rules and sample data — it is NOT a
   claim that the IP is confirmed malicious. Always present it as such.
   ========================================================================= */

let ipChart = null;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("analyzeBtn").addEventListener("click", analyzeIp);
  document.getElementById("ipInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyzeIp();
  });
});

function analyzeIp() {
  const ip = document.getElementById("ipInput").value.trim();
  const results = document.getElementById("ipResults");
  if (!ip) {
    showToast("Enter an IP address first");
    return;
  }
  results.innerHTML = `<div class="state-msg">Loading security events…</div>`;

  CyberLogAPI.getIpDetails(ip).then((data) => {
    if (!data) {
      results.innerHTML = `<div class="card state-msg">No data found for ${ip}. Try 192.168.1.50, 203.0.113.9, or 10.0.0.25.</div>`;
      return;
    }
    renderIpResults(data);
  });
}

function riskStyles(level) {
  const map = {
    LOW: { bg: "rgba(77,157,224,.12)", color: "var(--sev-low)" },
    MEDIUM: { bg: "rgba(244,211,94,.12)", color: "var(--sev-medium)" },
    HIGH: { bg: "rgba(255,159,69,.12)", color: "var(--sev-high)" },
    CRITICAL: { bg: "rgba(255,84,112,.12)", color: "var(--sev-critical)" },
  };
  return map[level] || map.LOW;
}

function renderIpResults(data) {
  const results = document.getElementById("ipResults");
  const rs = riskStyles(data.riskLevel);

  results.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-head">
        <h3 class="mono">${data.ip}</h3>
        <span class="risk-pill" style="background:${rs.bg}; color:${rs.color};">
          System-generated risk indicator: ${data.riskLevel}
        </span>
      </div>
      <div class="detail-grid">
        <div><div class="k">Total Events</div><div class="v">${data.totalEvents}</div></div>
        <div><div class="k">Failed Logins</div><div class="v">${data.failedLogins}</div></div>
        <div><div class="k">Successful Logins</div><div class="v">${data.successfulLogins}</div></div>
        <div><div class="k">Alert Count</div><div class="v">${data.alertCount}</div></div>
        <div><div class="k">First Seen</div><div class="v">${data.firstSeen}</div></div>
        <div><div class="k">Last Seen</div><div class="v">${data.lastSeen}</div></div>
        <div><div class="k">Associated Users</div><div class="v">${data.associatedUsers.join(", ")}</div></div>
      </div>
      <p style="font-size:12px;color:var(--text-low);margin:0;">
        This risk level is calculated from detection-rule matches on sample data and is a starting point for
        investigation, not a confirmed verdict.
      </p>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-head"><h3>Activity for ${data.ip}</h3></div>
      <div class="chart-wrap"><canvas id="ipChart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Recent Events From This IP</h3></div>
      <div class="table-scroll">
        <table class="data-table">
          <thead><tr><th>Timestamp</th><th>Username</th><th>Event</th><th>Status</th><th>Severity</th></tr></thead>
          <tbody id="ipEventsBody"></tbody>
        </table>
      </div>
    </div>`;

  renderIpChart();
  renderIpEvents(data.ip);
}

function renderIpChart() {
  const ctx = document.getElementById("ipChart").getContext("2d");
  if (ipChart) ipChart.destroy();
  ipChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["-6h", "-5h", "-4h", "-3h", "-2h", "-1h", "Now"],
      datasets: [{ label: "Events", data: [2, 4, 1, 6, 9, 5, 3], backgroundColor: "#2bd9b9" }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#a9b4c4" }, grid: { display: false } },
        y: { ticks: { color: "#a9b4c4" }, grid: { color: "rgba(255,255,255,.06)" }, beginAtZero: true },
      },
    },
  });
}

function renderIpEvents(ip) {
  CyberLogAPI.getLogs().then((logs) => {
    const matches = logs.filter((l) => l.ip === ip);
    const tbody = document.getElementById("ipEventsBody");
    if (!matches.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="state-msg">No recent events found for this IP.</td></tr>`;
      return;
    }
    tbody.innerHTML = matches
      .map(
        (l) => `<tr>
          <td class="mono">${l.timestamp}</td><td>${l.username}</td><td>${l.eventType}</td>
          <td>${statusPill(l.status === "SUCCESS" ? "Success" : "Failed")}</td><td>${severityBadge(l.severity)}</td>
        </tr>`
      )
      .join("");
  });
}
