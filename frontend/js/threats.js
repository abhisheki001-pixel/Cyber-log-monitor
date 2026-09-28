/* =========================================================================
   threats.js — Logic for threats.html (Threat Detection Rules page)
   ========================================================================= */

let rules = [];

document.addEventListener("DOMContentLoaded", () => {
  CyberLogAPI.getThreatRules().then((data) => {
    rules = data;
    renderRules();
  });

  document.getElementById("addRuleBtn").addEventListener("click", () => {
    // In the full app this would open a form modal; kept simple for the demo.
    showToast("Rule editor will be wired up to the Flask backend later");
  });
});

function renderRules() {
  const tbody = document.getElementById("rulesBody");
  if (!rules.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="state-msg">No detection rules configured.</td></tr>`;
    return;
  }
  tbody.innerHTML = rules
    .map(
      (r, i) => `
      <tr>
        <td class="mono">${r.ruleId}</td>
        <td>${r.name}</td>
        <td>${r.description}</td>
        <td>${severityBadge(r.severity)}</td>
        <td class="mono">${r.threshold}</td>
        <td>${r.status === "Enabled" ? statusPill("Online") : statusPill("Offline")}</td>
        <td class="btn-group">
          <button class="btn btn-sm" onclick="toggleRule(${i})">${r.status === "Enabled" ? "Disable" : "Enable"}</button>
          <button class="btn btn-sm" onclick="editRule(${i})">Edit Rule</button>
        </td>
      </tr>`
    )
    .join("");
}

function toggleRule(index) {
  rules[index].status = rules[index].status === "Enabled" ? "Disabled" : "Enabled";
  showToast(`${rules[index].ruleId} ${rules[index].status.toLowerCase()}`);
  renderRules();
}

function editRule(index) {
  showToast(`Editing ${rules[index].ruleId} — hook this up to a form/modal`);
}
