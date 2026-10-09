(() => {
  const sidebarMarkup = `
    <aside class="sidebar" id="sidebar">
      <a href="dashboard.html" class="sidebar-brand">
        <span class="brand-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20H9a4 4 0 0 1-3.8-5.3A4 4 0 0 1 7 7a3.5 3.5 0 0 1 5-3z"/><path d="M12 20h3a4 4 0 0 0 3.8-5.3A4 4 0 0 0 17 7a3.5 3.5 0 0 0-5-3z"/><path d="M12 4v16M8.5 9.5a2 2 0 0 0 2 2M15.5 9.5a2 2 0 0 1-2 2"/></svg></span>
        <span class="brand-name">English with ADHD</span>
        <span class="brand-subtitle">Output First</span>
      </a>
      <nav class="sidebar-nav" aria-label="Main navigation">
        <a href="dashboard.html" class="nav-link active"><span>⌂</span> Home</a>
        <a href="coursebook.html" class="nav-link"><span>◧</span> Coursebook</a>
        <a href="flashcards.html" class="nav-link"><span>◈</span> Flashcards</a>
        <a href="speaking.html" class="nav-link"><span>♫</span> Speaking</a>
        <a href="writing-journal.html" class="nav-link"><span>✎</span> Writing Journal</a>
        <a href="resources.html" class="nav-link"><span>↗</span> Resources</a>
      </nav>
    </aside>`;

  document.body.insertAdjacentHTML("afterbegin", sidebarMarkup);
  document.body.classList.add("sidebar-enabled");

  // Keep the audio state between the site's regular page loads. The player is
  // rebuilt on each page, while sessionStorage carries its position and state.
  const player = document.createElement("section");
  player.className = "site-music-player";
  player.setAttribute("aria-label", "Lo-fi music player");
  player.innerHTML = `
    <div class="music-player-heading"><span class="music-player-note" aria-hidden="true">♫</span>
      <div><strong>lo-fi corner</strong><span class="music-player-track">now playing: study beats</span></div>
    </div>
    <div class="music-player-controls">
      <button class="music-play-button" type="button" aria-label="Play music">▶</button>
      <span class="music-player-status" aria-live="polite">paused</span>
      <audio class="site-music-audio" src="audio/lofi.mp3" preload="metadata" loop></audio>
    </div>`;
  document.getElementById("sidebar").appendChild(player);

  const audio = player.querySelector("audio");
  const playButton = player.querySelector(".music-play-button");
  const status = player.querySelector(".music-player-status");
  const savedTime = Number(sessionStorage.getItem("lofi-player-time"));
  const wasPlaying = sessionStorage.getItem("lofi-player-playing") === "true";

  if (Number.isFinite(savedTime) && savedTime > 0) {
    audio.addEventListener("loadedmetadata", () => { audio.currentTime = savedTime; }, { once: true });
  }

  function updatePlayerState() {
    const isPlaying = !audio.paused;
    playButton.textContent = isPlaying ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
    status.textContent = isPlaying ? "playing" : "paused";
    sessionStorage.setItem("lofi-player-playing", String(isPlaying));
  }

  playButton.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); } catch (error) { status.textContent = "tap to play"; }
    } else {
      audio.pause();
    }
    updatePlayerState();
  });
  audio.addEventListener("play", updatePlayerState);
  audio.addEventListener("pause", updatePlayerState);
  audio.addEventListener("timeupdate", () => sessionStorage.setItem("lofi-player-time", String(audio.currentTime)));
  window.addEventListener("pagehide", () => {
    sessionStorage.setItem("lofi-player-time", String(audio.currentTime));
    sessionStorage.setItem("lofi-player-playing", String(!audio.paused));
  });
  updatePlayerState();
  if (wasPlaying) audio.play().catch(() => { status.textContent = "tap to resume"; });

  const toggle = document.createElement("button");
  toggle.className = "menu-toggle";
  toggle.id = "menuToggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Open navigation");
  toggle.setAttribute("aria-controls", "sidebar");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "☰";
  document.body.insertBefore(toggle, document.body.firstChild.nextSibling);

  const sidebar = document.getElementById("sidebar");
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";
  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === currentPage);
  });

  toggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  sidebar.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    });
  });

  // Switch between the app's pages without unloading the document. Keeping
  // this document alive also keeps the exact same audio element playing.
  const appPages = new Set([
    "dashboard.html", "coursebook.html", "flashcards.html", "speaking.html",
    "writing-journal.html", "pomodoro.html", "resources.html", "profile.html"
  ]);

  async function navigateTo(url, addHistory = true) {
    const pageName = url.pathname.split("/").pop();
    if (!appPages.has(pageName)) return;

    try {
      const response = await fetch(url.href);
      if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
      const nextDocument = new DOMParser().parseFromString(await response.text(), "text/html");
      const persistent = new Set([sidebar, toggle, player]);

      Array.from(document.body.children).forEach((child) => {
        if (!persistent.has(child)) child.remove();
      });
      Array.from(nextDocument.body.children).forEach((child) => {
        if (child.tagName !== "SCRIPT") document.body.appendChild(document.importNode(child, true));
      });

      document.body.classList.toggle("resource-page", pageName !== "dashboard.html");
      document.title = nextDocument.title;
      if (typeof updateAccountSummary === "function") updateAccountSummary();
      if (addHistory) history.pushState({}, "", url.href);
      sidebar.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === pageName);
      });
      sidebar.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");

      if (pageName === "dashboard.html") {
        if (!window.Home) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "js/home.js";
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        window.Home?.init();
        aplicarTemaSalvo();
        loadProfileData();
      } else {
        if (typeof renderizarPaginaRecurso !== "function") {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "js/resource-page.js";
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }
        renderizarPaginaRecurso();
      }
    } catch (error) {
      console.error("Could not switch app page without reloading:", error);
      window.location.href = url.href;
    }
  }

  window.navigateAppPage = (url) => navigateTo(new URL(url, window.location.href));

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !appPages.has(url.pathname.split("/").pop())) return;
    event.preventDefault();
    navigateTo(url);
  });

  window.addEventListener("popstate", () => navigateTo(new URL(window.location.href), false));
})();
