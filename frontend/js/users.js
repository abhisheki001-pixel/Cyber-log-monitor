/* =========================================================================
   users.js — Logic for users.html (User Activity page)
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  CyberLogAPI.getUsers().then((users) => {
    renderUserSummary(users);
    renderUsersTable(users);
  });
});

function renderUserSummary(users) {
  const total = users.length;
  const active = users.filter((u) => u.status === "Active").length;
  const suspicious = users.filter((u) => u.risk === "HIGH").length;
  const withFailures = users.filter((u) => u.failedAttempts > 0).length;

  const cards = [
    { label: "Total Users", value: total },
    { label: "Active Users", value: active },
    { label: "Suspicious Users", value: suspicious, tone: "danger" },
    { label: "Users With Failed Attempts", value: withFailures, tone: "warn" },
  ];
  document.getElementById("userStatGrid").innerHTML = cards
    .map((c) => `<div class="stat-card ${c.tone || ""}"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`)
    .join("");
}

function renderUsersTable(users) {
  const tbody = document.getElementById("usersBody");
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="state-msg">No user activity recorded.</td></tr>`;
    return;
  }
  tbody.innerHTML = users
    .map(
      (u) => `
      <tr>
        <td>${u.username}</td>
        <td class="mono">${u.lastLogin}</td>
        <td>${u.loginCount}</td>
        <td>${u.failedAttempts}</td>
        <td class="mono">${u.associatedIps[0]}${u.associatedIps.length > 1 ? " +" + (u.associatedIps.length - 1) : ""}</td>
        <td>${severityBadge(u.risk)}</td>
        <td>${u.status === "Active" ? statusPill("Online") : statusPill("Offline")}</td>
        <td><button class="btn btn-sm" onclick="viewUser('${u.username}')">View Activity</button></td>
      </tr>`
    )
    .join("");
}

function viewUser(username) {
  // A dedicated detail modal/page can be added the same way the alert
  // details modal works — kept as a toast here to stay within scope.
  showToast(`Opening activity history for "${username}"`);
}
