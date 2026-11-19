(() => {
  const loading = document.getElementById("loading");
  const errorPanel = document.getElementById("error");
  const errorDetail = document.getElementById("error-detail");
  const retry = document.getElementById("retry");

  const showError = (reason) => {
    if (document.documentElement.dataset.anatomyState === "ready") return;
    document.documentElement.dataset.anatomyState = "error";
    loading?.classList.add("hidden");
    if (errorDetail && reason instanceof Error && reason.message) {
      errorDetail.textContent = `Le moteur n’a pas démarré (${reason.message}). La liste musculaire reste disponible.`;
    }
    if (errorPanel) errorPanel.style.display = "grid";
  };

  const watchdog = window.setTimeout(() => {
    showError(new Error("délai de chargement dépassé"));
  }, 20000);

  window.bodyosBootReady = () => {
    window.clearTimeout(watchdog);
    document.documentElement.dataset.anatomyState = "ready";
    loading?.classList.add("hidden");
    if (errorPanel) errorPanel.style.display = "none";
  };

  window.bodyosBootError = (reason) => {
    window.clearTimeout(watchdog);
    showError(reason);
  };

  window.addEventListener("error", (event) => showError(event.error || new Error(event.message)));
  window.addEventListener("unhandledrejection", (event) => {
    showError(event.reason instanceof Error ? event.reason : new Error("erreur de chargement"));
  });
  retry?.addEventListener("click", () => window.location.reload());
})();
