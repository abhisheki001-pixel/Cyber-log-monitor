/* =========================================================================
   settings.js — Logic for settings.html
   -------------------------------------------------------------------------
   The form fields here are intentionally plain inputs/toggles with no
   validation wired up yet — once the Flask backend exists, this file
   should collect the field values and POST them to something like
   PUT /api/settings, then show a toast on success/failure.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    showToast("Settings saved (mock — connect this to the Flask backend)");
  });
});
