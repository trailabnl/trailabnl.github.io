(function () {
  "use strict";

  const SELECTORS = {
    navToggle: ".nav-toggle",
    nav: ".primary-nav",
    navLinks: ".primary-nav a",
    carousels: ".carousel",
    teamGrid: "#team-grid",
    publicationsList: "#publications-list",
    backToTop: '.footer-link[href="#top"]',
  };

  function setupNav() {
    const toggle = document.querySelector(SELECTORS.navToggle);
    const nav = document.querySelector(SELECTORS.nav);
    if (!toggle || !nav) return;

    const closeNav = () => {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    };

    const openNav = () => {
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Close";
    };

    toggle.addEventListener("click", () => {
      const isOpen = document.body.classList.contains("nav-open");
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeNav();
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) {
        closeNav();
      }
    });
  }

  function setupBackToTop() {
    const backToTopLink = document.querySelector(SELECTORS.backToTop);
    if (!backToTopLink) return;

    backToTopLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Keep the URL hash meaningful without triggering a jump.
      if (history.replaceState) {
        history.replaceState(null, "", "#top");
      } else {
        location.hash = "#top";
      }
    });
  }

  async function fetchJson(url) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`Failed to fetch ${url}`, err);
      return [];
    }
  }

  function getItemsPerView(width) {
    if (width >= 1200) return 3;
    if (width >= 900) return 3;
    if (width >= 720) return 2;
    return 1;
  }

  function computeInitials(name) {
    if (!name) return "?";
    const parts = name
      .split(/\s+/)
      .map((p) => p.replace(/[^a-zA-Z]/g, ""))
      .filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function createCardSlide(item) {
    const slide = document.createElement("li");
    slide.className = "carousel-slide";

    const card = document.createElement("article");
    card.className = "card";

    const media = document.createElement("div");
    media.className = "card-media";
    if (item.image) {
      media.style.backgroundImage = `url("${item.image}")`;
    } else {
      media.style.backgroundImage =
        "linear-gradient(135deg, rgba(138,115,68,0.25), rgba(15,35,60,0.55))";
    }

    const body = document.createElement("div");
    body.className = "card-body";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.title || "Untitled";

    body.appendChild(title);

    if (item.date) {
      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = item.date;
      body.appendChild(meta);
    } else if (item.subtitle) {
      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = item.subtitle;
      body.appendChild(meta);
    }

    if (item.excerpt) {
      const text = document.createElement("p");
      text.className = "card-text";
      text.textContent = item.excerpt;
      body.appendChild(text);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const link = document.createElement("a");
    link.className = "button button--accent";
    link.textContent = item.ctaLabel || "Read More";
    link.href = item.url || "#";
    if (item.url && /^https?:\/\//.test(item.url)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    actions.appendChild(link);
    body.appendChild(actions);

    card.appendChild(media);
    card.appendChild(body);
    slide.appendChild(card);
    return slide;
  }

  function getTrackGap(trackEl) {
    const styles = window.getComputedStyle(trackEl);
    const gapValue = styles.gap || styles.columnGap || "0px";
    const parsed = parseFloat(gapValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function createCarouselController(carouselEl, items) {
    const track = carouselEl.querySelector(".carousel-track");
    const prevBtn = carouselEl.querySelector(".carousel-control.prev");
    const nextBtn = carouselEl.querySelector(".carousel-control.next");
    if (!track || !prevBtn || !nextBtn) return;

    track.innerHTML = "";
    items.forEach((item) => track.appendChild(createCardSlide(item)));

    const state = {
      index: 0,
      itemsPerView: 1,
      maxIndex: 0,
      slideWidth: 0,
      gap: 0,
    };

    function measure() {
      state.itemsPerView = getItemsPerView(window.innerWidth);
      carouselEl.style.setProperty("--items-per-view", String(state.itemsPerView));
      state.maxIndex = Math.max(0, items.length - state.itemsPerView);

      const firstSlide = track.querySelector(".carousel-slide");
      state.gap = getTrackGap(track);
      state.slideWidth = firstSlide ? firstSlide.getBoundingClientRect().width : 0;

      state.index = Math.min(state.index, state.maxIndex);
      update();
    }

    function updateControls() {
      const disabled = items.length <= state.itemsPerView;
      prevBtn.disabled = disabled;
      nextBtn.disabled = disabled;
      prevBtn.setAttribute("aria-disabled", String(disabled));
      nextBtn.setAttribute("aria-disabled", String(disabled));
      prevBtn.style.visibility = disabled ? "hidden" : "visible";
      nextBtn.style.visibility = disabled ? "hidden" : "visible";
    }

    function update() {
      const offset = state.index * (state.slideWidth + state.gap);
      track.style.transform = `translateX(${-offset}px)`;
      updateControls();
    }

    function next() {
      if (state.maxIndex === 0) return;
      state.index = state.index >= state.maxIndex ? 0 : state.index + 1;
      update();
    }

    function prev() {
      if (state.maxIndex === 0) return;
      state.index = state.index <= 0 ? state.maxIndex : state.index - 1;
      update();
    }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    carouselEl.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    });

    window.addEventListener("resize", () => {
      measure();
    });

    measure();
  }

  async function setupCarousels() {
    const carousels = Array.from(document.querySelectorAll(SELECTORS.carousels));
    await Promise.all(
      carousels.map(async (carouselEl) => {
        const source = carouselEl.getAttribute("data-source");
        if (!source) return;
        const items = await fetchJson(source);
        if (!Array.isArray(items) || items.length === 0) {
          const track = carouselEl.querySelector(".carousel-track");
          if (track) {
            const empty = document.createElement("li");
            empty.className = "carousel-slide";
            empty.innerHTML =
              '<article class="card"><div class="card-body"><h3 class="card-title">No items yet</h3><p class="card-text">Add content to the data source to populate this section.</p></div></article>';
            track.appendChild(empty);
          }
          return;
        }
        createCarouselController(carouselEl, items);
      })
    );
  }

  async function setupTeam() {
    const grid = document.querySelector(SELECTORS.teamGrid);
    if (!grid) return;
    const people = await fetchJson("data/team.json");
    if (!Array.isArray(people)) return;

    const fragment = document.createDocumentFragment();
    people.forEach((person) => {
      const card = document.createElement("article");
      card.className = "team-card";
      card.setAttribute("role", "listitem");

      const photo = document.createElement("div");
      photo.className = "team-photo";

      if (person.image) {
        photo.dataset.hasImage = "true";
        photo.style.backgroundImage = `url("${person.image}")`;
      } else {
        photo.dataset.hasImage = "false";
        photo.textContent = computeInitials(person.name);
      }

      const name = document.createElement("h3");
      name.className = "team-name";
      name.textContent = person.name || "Unknown";

      const role = document.createElement("p");
      role.className = "team-role";
      role.textContent = person.role || "";

      card.appendChild(photo);
      card.appendChild(name);
      card.appendChild(role);

      if (person.focus) {
        const focus = document.createElement("p");
        focus.className = "team-focus";
        focus.textContent = person.focus;
        card.appendChild(focus);
      }

      fragment.appendChild(card);
    });

    grid.innerHTML = "";
    grid.appendChild(fragment);
  }

  async function setupPublications() {
    const list = document.querySelector(SELECTORS.publicationsList);
    if (!list) return;
    const publications = await fetchJson("data/publications.json");
    if (!Array.isArray(publications)) return;

    const fragment = document.createDocumentFragment();
    publications.forEach((pub) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.textContent = pub.title || "Untitled publication";
      link.href = pub.url || "#";
      if (pub.url && /^https?:\/\//.test(pub.url)) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      li.appendChild(link);
      fragment.appendChild(li);
    });

    list.innerHTML = "";
    list.appendChild(fragment);
  }

  async function init() {
    setupNav();
    setupBackToTop();
    await Promise.all([setupCarousels(), setupTeam(), setupPublications()]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
