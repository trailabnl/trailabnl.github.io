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

    if (item.url) {
      const actions = document.createElement("div");
      actions.className = "card-actions";

      const link = document.createElement("a");
      link.className = "button button--accent";
      link.textContent = item.ctaLabel || "Read More";
      link.href = item.url;
      if (/^https?:\/\//.test(item.url)) {
        link.target = "_blank";
        link.rel = "noreferrer";
      }
      actions.appendChild(link);
      body.appendChild(actions);
    }

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

    const state = {
      index: 0,
      itemsPerView: 1,
      slideWidth: 0,
      gap: 0,
      cloneCount: 0,
      transitioning: false,
    };

    function buildSlides() {
      track.innerHTML = "";
      state.itemsPerView = getItemsPerView(window.innerWidth);
      carouselEl.style.setProperty("--items-per-view", String(state.itemsPerView));

      var disabled = items.length <= state.itemsPerView;
      prevBtn.style.visibility = disabled ? "hidden" : "visible";
      nextBtn.style.visibility = disabled ? "hidden" : "visible";
      if (disabled) {
        items.forEach((item) => track.appendChild(createCardSlide(item)));
        track.style.transform = "translateX(0px)";
        return;
      }

      state.cloneCount = state.itemsPerView;

      // Clones at the end (first N items)
      var endClones = [];
      for (var i = 0; i < state.cloneCount; i++) {
        endClones.push(items[i % items.length]);
      }
      // Clones at the start (last N items)
      var startClones = [];
      for (var i = 0; i < state.cloneCount; i++) {
        startClones.push(items[items.length - state.cloneCount + i]);
      }

      startClones.forEach((item) => {
        var slide = createCardSlide(item);
        slide.setAttribute("aria-hidden", "true");
        track.appendChild(slide);
      });
      items.forEach((item) => track.appendChild(createCardSlide(item)));
      endClones.forEach((item) => {
        var slide = createCardSlide(item);
        slide.setAttribute("aria-hidden", "true");
        track.appendChild(slide);
      });

      state.gap = getTrackGap(track);
      var firstSlide = track.querySelector(".carousel-slide");
      state.slideWidth = firstSlide ? firstSlide.getBoundingClientRect().width : 0;

      // Start at the first real slide
      state.index = state.cloneCount;
      jumpTo(state.index);
    }

    function jumpTo(idx) {
      track.style.transition = "none";
      var offset = idx * (state.slideWidth + state.gap);
      track.style.transform = "translateX(" + -offset + "px)";
      // Force reflow so the jump is instant
      track.offsetHeight;
      track.style.transition = "";
    }

    function slideTo(idx) {
      state.transitioning = true;
      state.index = idx;
      var offset = idx * (state.slideWidth + state.gap);
      track.style.transform = "translateX(" + -offset + "px)";
    }

    function onTransitionEnd() {
      state.transitioning = false;
      // If we're on a clone, silently jump to the real slide
      if (state.index >= state.cloneCount + items.length) {
        state.index = state.cloneCount + (state.index - state.cloneCount - items.length);
        jumpTo(state.index);
      } else if (state.index < state.cloneCount) {
        state.index = state.cloneCount + items.length - (state.cloneCount - state.index);
        jumpTo(state.index);
      }
    }

    function next() {
      if (state.transitioning || items.length <= state.itemsPerView) return;
      slideTo(state.index + 1);
    }

    function prev() {
      if (state.transitioning || items.length <= state.itemsPerView) return;
      slideTo(state.index - 1);
    }

    track.addEventListener("transitionend", onTransitionEnd);
    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    carouselEl.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") prev();
      if (event.key === "ArrowRight") next();
    });

    window.addEventListener("resize", () => {
      buildSlides();
    });

    buildSlides();
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
      const wrapper = document.createElement("article");
      wrapper.className = "team-card";
      wrapper.setAttribute("role", "listitem");

      const inner = document.createElement("div");
      inner.className = "team-card-inner";

      // Front face
      const front = document.createElement("div");
      front.className = "team-card-front";

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

      front.appendChild(photo);
      front.appendChild(name);
      front.appendChild(role);

      // Back face
      const back = document.createElement("div");
      back.className = "team-card-back";

      const backName = document.createElement("h3");
      backName.className = "team-name";
      backName.textContent = person.name || "Unknown";

      const quote = document.createElement("p");
      quote.className = "team-quote";
      quote.textContent = person.quote ? `"${person.quote}"` : "";

      back.appendChild(backName);
      back.appendChild(quote);

      inner.appendChild(front);
      inner.appendChild(back);
      wrapper.appendChild(inner);
      fragment.appendChild(wrapper);
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
