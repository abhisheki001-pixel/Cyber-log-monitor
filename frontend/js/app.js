/* =========================================================================
   app.js — Shared UI behaviour, loaded on every page
   -------------------------------------------------------------------------
   Handles things that are the same regardless of which page you're on:
     - highlighting the active sidebar link
     - mobile sidebar (hamburger) open/close
     - light/dark theme toggle, remembered in localStorage
     - the "last updated" clock in the top bar
     - the notification bell dropdown, populated from mock alert data
   Page-specific rendering (cards, charts, tables) lives in each page's own
   JS file (dashboard.js, logs.js, alerts.js, ...).
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  highlightActiveNavLink();
  setupMobileSidebar();
  setupThemeToggle();
  tickLastUpdated();
  setupNotificationsDropdown();
});

/** Adds .active to whichever sidebar link matches the current file name. */
function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage) link.classList.add("active");
  });
}

/** Hamburger button shows/hides the sidebar on narrow screens. */
function setupMobileSidebar() {
  const toggleBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

  // Tapping outside the open sidebar closes it again (mobile only).
  document.addEventListener("click", (e) => {
    const isMobile = window.innerWidth <= 900;
    if (!isMobile || !sidebar.classList.contains("open")) return;
    if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
      sidebar.classList.remove("open");
    }
  });
}

/** Light/dark theme toggle. Preference is saved so it persists across pages. */
function setupThemeToggle() {
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeToggleBtn");
  const saved = localStorage.getItem("cyberlog-theme") || "dark";
  root.setAttribute("data-theme", saved);
  updateThemeIcon(themeBtn, saved);

  if (!themeBtn) return;
  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("cyberlog-theme", next);
    updateThemeIcon(themeBtn, next);
  });
}

function updateThemeIcon(btn, theme) {
  if (!btn) return;
  btn.textContent = theme === "dark" ? "☀" : "☾";
  btn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

/** Shows a live-updating "Last updated: HH:MM:SS" string in the top bar. */
function tickLastUpdated() {
  const el = document.getElementById("lastUpdated");
  if (!el) return;
  const render = () => {
    const now = new Date();
    el.textContent = "Last updated: " + now.toLocaleTimeString();
  };
  render();
  setInterval(render, 1000);
}

/** Notification bell: opens a dropdown built from the most severe open alerts. */
function setupNotificationsDropdown() {
  const bellBtn = document.getElementById("notifBell");
  const panel = document.getElementById("notifPanel");
  const list = document.getElementById("notifList");
  const countEl = document.getElementById("notifCount");
  if (!bellBtn || !panel || !list) return;

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== bellBtn) panel.classList.remove("open");
  });

  CyberLogAPI.getAlerts().then((alerts) => {
    const openAlerts = alerts.filter((a) => a.status !== "Resolved").slice(0, 5);
    countEl.textContent = openAlerts.length;
    countEl.style.display = openAlerts.length ? "block" : "none";

    if (!openAlerts.length) {
      list.innerHTML = `<div class="state-msg">No new notifications.</div>`;
      return;
    }
    list.innerHTML = openAlerts
      .map((a) => `
        <div class="notif-item">
          <span class="sev-dot" style="background:${severityColor(a.severity)}"></span>
          <div class="notif-text">
            <div><strong>${a.alertType}</strong></div>
            <div class="notif-time">${a.timestamp} · ${a.severity}</div>
          </div>
        </div>`)
      .join("");
  });
}

/** Shared helper: maps a severity string to its accent color (also used by charts). */
function severityColor(severity) {
  const map = {
    CRITICAL: "#ff5470", HIGH: "#ff9f45", MEDIUM: "#f4d35e", LOW: "#4d9de0", INFO: "#8b98a9",
  };
  return map[severity?.toUpperCase()] || "#8b98a9";
}

/** Shared helper: renders a severity badge span, reused by every table. */
function severityBadge(severity) {
  const s = (severity || "INFO").toUpperCase();
  const icons = { CRITICAL: "⛔", HIGH: "▲", MEDIUM: "●", LOW: "▾", INFO: "ℹ" };
  return `<span class="badge badge-${s.toLowerCase()}">${icons[s] || ""} ${s}</span>`;
}

/** Shared helper: renders a status pill (Open / Investigating / Resolved / etc). */
function statusPill(status) {
  const key = (status || "").toLowerCase().replace(/\s+/g, "-");
  return `<span class="status-pill status-${key}">● ${status}</span>`;
}

/* -------------------------------------------------------------------------
   Shared "Alert Details" modal — used by both the Dashboard and the
   Security Alerts page. Each page just needs the modal markup (see
   index.html / alerts.html) with id="alertModal" and calls
   openAlertModal("AL-001") from a [View] button's onclick.
   ------------------------------------------------------------------------- */
function openAlertModal(alertId) {
  const modal = document.getElementById("alertModal");
  if (!modal) return;

  CyberLogAPI.getAlertById(alertId).then((alert) => {
    if (!alert) return;
    modal.dataset.alertId = alert.alertId;
    document.getElementById("modalAlertType").textContent = alert.alertType;
    document.getElementById("modalSeverity").innerHTML = severityBadge(alert.severity);
    document.getElementById("modalTimestamp").textContent = alert.timestamp;
    document.getElementById("modalSourceIp").textContent = alert.sourceIp;
    document.getElementById("modalDestination").textContent = alert.destination || "—";
    document.getElementById("modalUsername").textContent = alert.username;
    document.getElementById("modalEventCount").textContent = alert.eventCount;
    document.getElementById("modalRule").textContent = alert.detectionRule;
    document.getElementById("modalStatus").innerHTML = statusPill(alert.status);
    document.getElementById("modalDescription").textContent = alert.description;
    document.getElementById("modalTimeline").innerHTML = alert.timeline
      .map((t) => `<li>${t.time} → ${t.text}</li>`)
      .join("");
    modal.classList.add("open");
  });
}

function closeAlertModal() {
  document.getElementById("alertModal")?.classList.remove("open");
}

/** Mock "update status" action used by Acknowledge / Investigate / Resolve. */
function updateAlertStatus(newStatus) {
  const modal = document.getElementById("alertModal");
  const alertId = modal?.dataset.alertId;
  if (!alertId) return;
  // NOTE: this only updates the in-memory mock array for this demo.
  // The Flask version will PATCH /api/alerts/<id> instead.
  CyberLogAPI.getAlertById(alertId).then((alert) => {
    if (alert) alert.status = newStatus;
    showToast(`${alertId} marked as ${newStatus}`);
    document.getElementById("modalStatus").innerHTML = statusPill(newStatus);
    document.dispatchEvent(new CustomEvent("alerts:changed"));
  });
}

/** Tiny toast helper, used after button actions like "Resolve" or "Export". */
function showToast(message) {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
