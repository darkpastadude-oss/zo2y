(() => {
  const supabaseConfig = window.__ZO2Y_SUPABASE_CONFIG || {};
  const SUPABASE_URL =
    String(supabaseConfig.url || "").trim() || "__SUPABASE_URL__";
  const SUPABASE_KEY = String(supabaseConfig.key || "").trim();
  const FALLBACK_BADGE = "/file.svg";
  const FALLBACK_IMAGE = "/newlogo.webp";

  const state = {
    supabase: null,
    currentUser: null,
    favorites: new Set(),
    team: null,
    localBadgeMap: {},
    roster: [],
    related: [],
  };

  const ui = {
    body: document.body,
    infoGrid: document.getElementById("teamInfoGrid"),
    social: document.getElementById("teamSocial"),
    socialSection: document.getElementById("teamSocialSection"),
    mediaGrid: document.getElementById("teamMediaGrid"),
    mediaEmpty: document.getElementById("teamMediaEmpty"),
    mediaSection: document.getElementById("teamMediaSection"),
    roster: document.getElementById("teamRoster"),
    rosterSection: document.getElementById("teamRosterSection"),
    related: document.getElementById("teamRelated"),
    relatedSection: document.getElementById("teamRelatedSection"),
    trailer: document.getElementById("teamTrailer"),
    trailerSection: document.getElementById("teamTrailerSection"),
    toast: document.getElementById("teamToast"),
    actionCard: document.getElementById("teamActionCard"),
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toHttps(url) {
    const text = String(url || "").trim();
    if (!text) return "";
    if (text.startsWith("//")) return `https:${text}`;
    if (text.startsWith("http://"))
      return text.replace(/^http:\/\//i, "https://");
    return text;
  }

  function normalizeExternalUrl(url) {
    const text = String(url || "").trim();
    if (!text) return "";
    if (text.startsWith("//")) return `https:${text}`;
    if (/^https?:\/\//i.test(text)) return toHttps(text);
    return `https://${text.replace(/^\/+/, "")}`;
  }

  function normalizeTeamName(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]+/g, "")
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function showToast(message, type = "info") {
    if (!ui.toast) return;
    ui.toast.textContent = message;
    ui.toast.classList.toggle("is-error", type === "error");
    ui.toast.classList.toggle("is-success", type === "success");
    ui.toast.classList.add("show");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      ui.toast.classList.remove("show");
    }, 2400);
  }

  function scoreTeamMatch(raw, criteria = {}) {
    if (!raw || typeof raw !== "object") return -1;
    let score = 0;
    const nameNeedle = normalizeTeamName(criteria.name || "");
    const teamName = normalizeTeamName(raw.strTeam || "");
    if (nameNeedle) {
      if (teamName === nameNeedle) score += 6;
      else if (teamName.includes(nameNeedle) || nameNeedle.includes(teamName))
        score += 3;
    }
    const leagueNeedle = normalizeTeamName(criteria.league || "");
    const teamLeague = normalizeTeamName(raw.strLeague || "");
    if (leagueNeedle) {
      if (teamLeague === leagueNeedle) score += 3;
      else if (
        teamLeague.includes(leagueNeedle) ||
        leagueNeedle.includes(teamLeague)
      )
        score += 1;
    }
    const sportNeedle = normalizeTeamName(criteria.sport || "");
    const teamSport = normalizeTeamName(raw.strSport || "");
    if (sportNeedle) {
      if (teamSport === sportNeedle) score += 2;
      else if (
        teamSport.includes(sportNeedle) ||
        sportNeedle.includes(teamSport)
      )
        score += 1;
    }
    const countryNeedle = normalizeTeamName(criteria.country || "");
    const teamCountry = normalizeTeamName(raw.strCountry || "");
    if (countryNeedle) {
      if (teamCountry === countryNeedle) score += 2;
      else if (
        teamCountry.includes(countryNeedle) ||
        countryNeedle.includes(teamCountry)
      )
        score += 1;
    }
    return score;
  }

  function pickBestTeamMatch(teams, criteria) {
    const list = Array.isArray(teams) ? teams : [];
    if (!list.length) return null;
    let best = list[0];
    let bestScore = scoreTeamMatch(best, criteria);
    list.slice(1).forEach((team) => {
      const score = scoreTeamMatch(team, criteria);
      if (score > bestScore) {
        best = team;
        bestScore = score;
      }
    });
    return best;
  }

  function mapTeam(raw) {
    if (!raw || typeof raw !== "object") return null;
    const name = String(raw.strTeam || "").trim();
    const id = String(raw.idTeam || name || "").trim();
    if (!name || !id) return null;
    return {
      id,
      name,
      sport: String(raw.strSport || "").trim(),
      league: String(raw.strLeague || "").trim(),
      country: String(raw.strCountry || "").trim(),
      formedYear: String(raw.intFormedYear || "").trim(),
      stadium: String(raw.strStadium || "").trim(),
      stadiumLocation: String(raw.strStadiumLocation || "").trim(),
      stadiumCapacity: String(raw.intStadiumCapacity || "").trim(),
      description: String(
        raw.strDescriptionEN || raw.strDescription || "",
      ).trim(),
      manager: String(raw.strManager || "").trim(),
      badge: String(raw.strBadge || raw.strTeamBadge || "").trim(),
      banner: String(raw.strBanner || "").trim(),
      fanart: String(raw.strFanart1 || "").trim(),
      fanarts: [
        String(raw.strFanart1 || "").trim(),
        String(raw.strFanart2 || "").trim(),
        String(raw.strFanart3 || "").trim(),
        String(raw.strFanart4 || "").trim(),
      ].filter(Boolean),
      stadiumThumb: String(raw.strStadiumThumb || "").trim(),
      jersey:
        String(raw.strEquipment || "").trim() ||
        String(raw.strJersey || "").trim(),
      website: normalizeExternalUrl(raw.strWebsite || ""),
      facebook: normalizeExternalUrl(raw.strFacebook || ""),
      twitter: normalizeExternalUrl(raw.strTwitter || ""),
      instagram: normalizeExternalUrl(raw.strInstagram || ""),
      youtube: normalizeExternalUrl(raw.strYoutube || ""),
      raw,
    };
  }

  function formatNumber(value) {
    const num = Number(String(value || "").replace(/[^\d]/g, ""));
    if (!Number.isFinite(num) || !num) return "-";
    return num.toLocaleString("en-US");
  }

  function updateSaveButton(isSaved) {
    const btn = document.getElementById("teamSaveBtn");
    if (!btn) return;
    btn.classList.toggle("elevated-btn-saved", !!isSaved);
    btn.classList.toggle("elevated-btn-primary", !isSaved);
    const icon = isSaved ? "fa-solid fa-check" : "fa-solid fa-bookmark";
    const text = isSaved ? "saved" : "add to list";
    btn.innerHTML = `<i class="${icon}"></i><span>${text}</span>`;
    btn.setAttribute("aria-pressed", isSaved ? "true" : "false");
  }

  function openListMenuFromCard() {
    if (ui.actionCard && window.openIndexStyleListMenu) {
      window.openIndexStyleListMenu(ui.actionCard);
    }
  }

  function initMenuBridge() {
    if (typeof window.initIndexStyleListMenu !== "function") return;
    window.initIndexStyleListMenu({
      mediaType: "sports",
      getCurrentUser: () => state.currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) =>
        showToast(message, isError ? "error" : "success"),
    });
    if (
      window.ListUtils &&
      typeof window.ListUtils.bindGlobalListUx === "function"
    ) {
      window.ListUtils.bindGlobalListUx();
    }
  }

  function getSportIcon(sport) {
    const norm = String(sport || "")
      .toLowerCase()
      .trim();
    if (norm.includes("football") || norm.includes("soccer"))
      return "fa-futbol";
    if (
      norm.includes("motor") ||
      norm.includes("f1") ||
      norm.includes("racing")
    )
      return "fa-flag-checkered";
    if (norm.includes("basket")) return "fa-basketball";
    if (norm.includes("american") || norm.includes("nfl")) return "fa-football";
    if (norm.includes("base")) return "fa-baseball";
    if (norm.includes("hockey") || norm.includes("ice"))
      return "fa-hockey-puck";
    if (norm.includes("mma") || norm.includes("ufc")) return "fa-user-ninja";
    if (norm.includes("boxing") || norm.includes("kick")) return "fa-mitten";
    return "fa-trophy";
  }

  function renderInfoGrid(team) {
    if (!ui.infoGrid) return;
    const cards = [];
    if (team.league) {
      cards.push({
        icon: "fa-trophy",
        label: "League",
        value: escapeHtml(team.league),
      });
    }
    if (team.sport) {
      cards.push({
        icon: getSportIcon(team.sport),
        label: "Sport",
        value: escapeHtml(team.sport),
      });
    }
    if (team.country) {
      cards.push({
        icon: "fa-flag",
        label: "Country",
        value: escapeHtml(team.country),
      });
    }
    if (team.formedYear) {
      cards.push({
        icon: "fa-calendar",
        label: "Founded",
        value: escapeHtml(team.formedYear),
      });
    }
    if (team.stadium) {
      cards.push({
        icon: "fa-building",
        label: "Stadium",
        value: escapeHtml(team.stadium),
      });
    }
    if (team.stadiumLocation) {
      cards.push({
        icon: "fa-location-dot",
        label: "Stadium location",
        value: escapeHtml(team.stadiumLocation),
      });
    }
    if (team.stadiumCapacity) {
      cards.push({
        icon: "fa-people-group",
        label: "Capacity",
        value: formatNumber(team.stadiumCapacity),
      });
    }
    if (team.manager) {
      cards.push({
        icon: "fa-whistle",
        label: "Manager",
        value: escapeHtml(team.manager),
      });
    }
    if (team.website) {
      cards.push({
        icon: "fa-globe",
        label: "Website",
        value: `<a href="${escapeHtml(team.website)}" target="_blank" rel="noopener">${escapeHtml(team.website.replace(/^https?:\/\//, ""))}</a>`,
      });
    }

    if (!cards.length) {
      ui.infoGrid.innerHTML = `
        <div class="elevated-detail-card">
          <span class="elevated-detail-title"><i class="fa-solid fa-circle-info"></i> Status</span>
          <span class="elevated-detail-value">No additional details available yet.</span>
        </div>
      `;
      return;
    }
    ui.infoGrid.innerHTML = cards
      .map(
        (c) => `
      <div class="elevated-detail-card">
        <span class="elevated-detail-title"><i class="fa-solid ${c.icon}"></i> ${escapeHtml(c.label)}</span>
        <span class="elevated-detail-value">${c.value}</span>
      </div>
    `,
      )
      .join("");
  }

  function renderSocialLinks(team) {
    if (!ui.social || !ui.socialSection) return;
    const links = [];
    if (team.website)
      links.push({ href: team.website, icon: "fa-globe", label: "Website" });
    if (team.facebook)
      links.push({
        href: team.facebook,
        icon: "fa-facebook",
        label: "Facebook",
      });
    if (team.twitter)
      links.push({ href: team.twitter, icon: "fa-twitter", label: "Twitter" });
    if (team.instagram)
      links.push({
        href: team.instagram,
        icon: "fa-instagram",
        label: "Instagram",
      });
    if (team.youtube)
      links.push({ href: team.youtube, icon: "fa-youtube", label: "YouTube" });

    if (!links.length) {
      ui.socialSection.hidden = true;
      return;
    }
    ui.socialSection.hidden = false;
    ui.social.innerHTML = links
      .map(
        (link) => `
      <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
        <i class="fa-brands ${escapeHtml(link.icon)}"></i>
        <span>${escapeHtml(link.label)}</span>
      </a>
    `,
      )
      .join("");
  }

  function renderMedia(team) {
    if (!ui.mediaGrid || !ui.mediaEmpty) return;
    const items = [];
    const seen = new Set();
    const addMedia = (url, contain = false, label = "") => {
      const safeUrl = String(url || "").trim();
      if (!safeUrl || seen.has(safeUrl)) return;
      seen.add(safeUrl);
      items.push({ url: safeUrl, contain, label });
    };

    addMedia(team.fanart, false, "Fanart");
    (team.fanarts || [])
      .slice(1)
      .forEach((url) => addMedia(url, false, "Fanart"));
    addMedia(team.stadiumThumb, false, "Stadium");
    addMedia(team.banner, true, "Banner");
    addMedia(team.jersey, true, "Kit");
    addMedia(team.badge, true, "Badge");

    ui.mediaGrid.innerHTML = "";
    if (!items.length) {
      ui.mediaEmpty.hidden = false;
      return;
    }
    ui.mediaEmpty.hidden = true;
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = `elevated-media-item${item.contain ? " contain" : ""}`;
      card.innerHTML = `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.label || "Team media")}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';" />${item.label ? `<span class="elevated-media-label">${escapeHtml(item.label)}</span>` : ""}`;
      fragment.appendChild(card);
    });
    ui.mediaGrid.appendChild(fragment);
  }

  function extractRoster(raw) {
    if (!raw || typeof raw !== "object") return [];
    const players = [];
    for (let i = 1; i <= 11; i += 1) {
      const nameKey = `strPlayer${i}`;
      const posKey = `strPosition${i}`;
      const numKey = `strNumber${i}`;
      const name = String(raw[nameKey] || "").trim();
      if (!name) continue;
      const position = String(raw[posKey] || "").trim();
      const number = String(raw[numKey] || "").trim();
      const thumb =
        String(raw[`strThumb${i}`] || "").trim() ||
        String(raw.strThumb || "").trim();
      const id = String(
        raw[`idPlayer${i}`] || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      );
      players.push({
        id,
        name,
        position: position || "Player",
        number: number || "",
        thumb,
      });
    }
    return players;
  }

  function renderRoster() {
    if (!ui.roster || !ui.rosterSection) return;
    if (!state.roster.length) {
      ui.rosterSection.hidden = true;
      return;
    }
    ui.rosterSection.hidden = false;
    ui.roster.innerHTML = state.roster
      .slice(0, 16)
      .map((p) => {
        const initials = (p.name || "P")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")
          .toUpperCase();
        const sub = [p.number && `#${p.number}`, p.position]
          .filter(Boolean)
          .join(" \u00B7 ");
        const thumb = p.thumb;
        return `
        <div class="elevated-person-card" title="${escapeHtml(p.name)}">
          <span class="elevated-person-avatar">
            ${thumb ? `<img src="${escapeHtml(thumb)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.outerHTML='<i class=\'fa-solid fa-user\' style=\'color:var(--dt-text-3);font-size:1.1rem\'></i>';">` : escapeHtml(initials)}
          </span>
          <span class="elevated-person-body">
            <span class="elevated-person-name">${escapeHtml(p.name)}</span>
            <span class="elevated-person-role">${escapeHtml(sub)}</span>
          </span>
        </div>
      `;
      })
      .join("");
  }

  function renderRelated() {
    if (!ui.related || !ui.relatedSection) return;
    if (!state.related.length) {
      ui.relatedSection.hidden = true;
      return;
    }
    ui.relatedSection.hidden = false;
    ui.related.innerHTML = state.related
      .slice(0, 6)
      .map((team) => {
        const sub =
          [team.league, team.sport].filter(Boolean).join(" \u00B7 ") || "Team";
        const hrefParams = new URLSearchParams();
        hrefParams.set("team", team.name);
        if (team.league) hrefParams.set("league", team.league);
        if (team.sport) hrefParams.set("sport", team.sport);
        if (team.country) hrefParams.set("country", team.country);
        return `
        <a class="elevated-related-card" href="team.html?${hrefParams.toString()}">
          <span class="elevated-related-thumb">
            ${team.badge ? `<img src="${escapeHtml(team.badge)}" alt="${escapeHtml(team.name)}" loading="lazy" onerror="this.outerHTML='<i class=\\'fa-solid fa-shield-halved\\' style=\\'color:var(--dt-text-3);font-size:1.2rem\\'></i>';">` : `<i class="fa-solid ${getSportIcon(team.sport)}" style="color:var(--dt-text-3);font-size:1rem"></i>`}
          </span>
          <span class="elevated-related-body">
            <span class="elevated-related-name">${escapeHtml(team.name)}</span>
            <span class="elevated-related-meta">${escapeHtml(sub)}</span>
          </span>
        </a>
      `;
      })
      .join("");
  }

  async function fetchRelatedTeams(team) {
    if (!team?.sport) {
      state.related = [];
      return;
    }
    const supabase = state.supabase;
    if (!supabase) return;
    try {
      let query = supabase
        .from("teams")
        .select("id,name,sport,league,logo_url")
        .ilike("sport", team.sport)
        .neq("id", team.id);
      if (team.league) {
        query = query.ilike("league", team.league);
      }
      const { data, error } = await query.limit(8);
      if (error || !data || !data.length) {
        state.related = [];
        return;
      }
      state.related = data.map((row) => ({
        id: row.id,
        name: row.name,
        sport: row.sport || team.sport,
        league: row.league || "",
        badge: row.logo_url || "",
      }));
    } catch (_err) {
      state.related = [];
    }
  }

  function searchYouTubeForTeam(query) {
    if (!query) return null;
    try {
      const q = encodeURIComponent(String(query));
      return `https://www.youtube.com/results?search_query=${q}`;
    } catch (_e) {
      return null;
    }
  }

  function loadTeamTrailer(team) {
    if (!ui.trailer || !ui.trailerSection) return;
    if (!team || !team.name) {
      ui.trailerSection.hidden = true;
      return;
    }
    const sport = team.sport ? ` ${team.sport}` : "";
    const query = `${team.name}${sport} highlights`.trim();
    const searchUrl = searchYouTubeForTeam(query);
    ui.trailerSection.hidden = false;
    ui.trailer.innerHTML = `
      <div class="elevated-trailer-empty">
        <i class="fa-brands fa-youtube"></i>
        <span>no embedded video available for this team</span>
        <a class="elevated-trailer-cta" href="${escapeHtml(searchUrl || "#")}" target="_blank" rel="noopener">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> search youtube
        </a>
      </div>
    `;
  }

  function renderTeamHeroConfig(team, wiki) {
    const container = document.getElementById("unifiedHeroContainer");
    if (!container) return;

    const config = {
      type: "team",
      title: team.name || "Team",
      description: team.description || "",
      posterUrl: team.badge || FALLBACK_BADGE,
      posterFit: "contain",
      backdropUrl: "",
      metadata: [],
      actions: [],
    };

    const isLogoUrl = (url) => {
      if (!url) return false;
      const u = String(url).toLowerCase();
      const teamBadge = String(team.badge || "").toLowerCase();
      if (teamBadge && (u.includes(teamBadge) || teamBadge.includes(u)))
        return true;
      return (
        /logo|icon|wordmark|seal|flag|svg|coat|emblem|badge|crest|monogram|trademark/.test(
          u,
        ) || /\.(svg)$/i.test(u)
      );
    };

    const pickFirstNonLogo = (...candidates) => {
      for (const c of candidates) {
        if (!c) continue;
        if (Array.isArray(c)) {
          const found = c.find((x) => x && !isLogoUrl(x));
          if (found) return found;
        } else if (!isLogoUrl(c)) {
          return c;
        }
      }
      return null;
    };

    const backdrop = pickFirstNonLogo(
      team.banner,
      team.fanart,
      team.stadiumThumb,
      team.wikiPhoto,
      team.wikiHero,
      wiki ? wiki.photoImage || wiki.heroImage || wiki.thumbnail : null,
    );
    const SPORT_BACKDROPS = [
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1461896836934-bd45ba8a002c?auto=format&fit=crop&w=1920&q=80",
    ];
    const sportFallback = SPORT_BACKDROPS[Math.abs(team.name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % SPORT_BACKDROPS.length];

    config.backdropUrl =
      backdrop || sportFallback;

    if (team.league)
      config.metadata.push({
        type: "genre",
        value: team.league,
        icon: "fa-solid fa-trophy",
      });
    if (team.sport)
      config.metadata.push({
        type: "genre",
        value: team.sport,
        icon: "fa-solid " + getSportIcon(team.sport),
      });
    if (team.country)
      config.metadata.push({
        type: "location",
        value: team.country,
        icon: "fa-solid fa-flag",
      });
    if (team.formedYear)
      config.metadata.push({
        type: "year",
        value: `founded ${team.formedYear}`,
        icon: "fa-solid fa-calendar",
      });

    config.actions.push({
      id: "teamSaveBtn",
      icon: "fa-solid fa-bookmark",
      label: "add to list",
      primary: true,
    });
    if (team.website) {
      config.actions.push({
        id: "teamWebsite",
        icon: "fa-solid fa-arrow-up-right-from-square",
        label: "visit website",
        href: team.website,
      });
    }

    if (window.renderUnifiedMediaHero) {
      window.renderUnifiedMediaHero(container, config);
      bindUnifiedListMenu(team, config);
    }
  }

  function bindUnifiedListMenu(team, config) {
    const saveBtn = document.getElementById("teamSaveBtn");
    if (!saveBtn || !window.initIndexStyleListMenu) return;

    window.initIndexStyleListMenu({
      mediaType: "sports",
      itemIdAttr: "data-item-id",
      getVisibleItemIds: () => (team.id ? [team.id] : []),
      getQuickStatusForItem: () => null,
      getCurrentUser: () => state.currentUser,
      ensureClient: ensureSupabase,
      toggleDefaultList,
      notify: (message, isError) =>
        showToast(message, isError ? "error" : "success"),
      getItemFromCard: () => ({
        mediaType: "sports",
        itemId: team.id,
        title: config.title,
        subtitle: "",
        posterUrl: config.posterUrl,
      }),
    });

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.openIndexStyleListMenu(saveBtn);
    });
  }

  function setHero(team, wiki) {
    if (ui.body) ui.body.dataset.elevatedCategory = "team";
    document.body.dataset.navPage = "sports";
    document.title = `Zo2y - ${team.name}`;

    if (ui.actionCard) {
      ui.actionCard.setAttribute("data-item-id", team.id || "");
      ui.actionCard.setAttribute("data-title", team.name || "");
      ui.actionCard.setAttribute(
        "data-subtitle",
        team.league || team.sport || "",
      );
      if (team.badge) ui.actionCard.setAttribute("data-list-image", team.badge);
      const titleEl = ui.actionCard.querySelector(".card-title");
      if (titleEl) titleEl.textContent = team.name || "";
      const metaEl = ui.actionCard.querySelector(".card-meta");
      if (metaEl) metaEl.textContent = team.league || team.sport || "";
      const img = ui.actionCard.querySelector("img");
      if (img && team.badge) img.src = team.badge;
    }

    renderTeamHeroConfig(team, wiki);

    renderInfoGrid(team);
    renderSocialLinks(team);
    renderMedia(team);
    renderRoster();
    renderRelated();
  }

  async function ensureSupabase() {
    if (state.supabase) return state.supabase;
    if (window.__ZO2Y_SUPABASE_CLIENT) {
      state.supabase = window.__ZO2Y_SUPABASE_CLIENT;
      return state.supabase;
    }
    for (let i = 0; i < 20; i += 1) {
      if (window.supabase?.createClient) {
        state.supabase = window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY,
          {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: false,
            },
          },
        );
        window.__ZO2Y_SUPABASE_CLIENT = state.supabase;
        return state.supabase;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return null;
  }

  async function initAuth() {
    if (!state.supabase) return;
    try {
      const { data } = await state.supabase.auth.getUser();
      state.currentUser = data?.user || null;
      if (state.currentUser) await loadFavoriteStatus();
      state.supabase.auth.onAuthStateChange((_event, session) => {
        state.currentUser = session?.user || null;
        if (state.currentUser) {
          loadFavoriteStatus().catch(() => {});
        } else {
          state.favorites = new Set();
          updateSaveButton(false);
        }
      });
    } catch (_err) {
      state.currentUser = null;
    }
  }

  async function loadFavoriteStatus() {
    if (!state.supabase || !state.currentUser || !state.team) return;
    const { data, error } = await state.supabase
      .from("user_favorite_teams")
      .select("team_id")
      .eq("user_id", state.currentUser.id)
      .eq("team_id", state.team.id)
      .maybeSingle();

    if (error) return;
    const isSaved = !!data?.team_id;
    state.favorites = new Set(isSaved ? [state.team.id] : []);
    updateSaveButton(isSaved);
  }

  async function saveTeam(team) {
    if (!state.supabase || !state.currentUser) return false;
    const payload = {
      id: team.id,
      name: team.name,
      sport: team.sport || null,
      league: team.league || null,
      logo_url: team.badge || null,
      banner_url: team.banner || null,
      stadium: team.stadium || null,
      stadium_url: team.stadiumThumb || null,
      jersey_url: team.jersey || null,
      fanart_url: team.fanart || null,
    };

    const { error: teamError } = await state.supabase
      .from("teams")
      .upsert(payload, { onConflict: "id" });

    if (teamError) {
      console.error("Team upsert error", teamError);
      return false;
    }

    const { error: favoriteError } = await state.supabase
      .from("user_favorite_teams")
      .upsert(
        { user_id: state.currentUser.id, team_id: team.id },
        { onConflict: "user_id,team_id" },
      );

    if (favoriteError) {
      console.error("Favorite upsert error", favoriteError);
      return false;
    }

    return true;
  }

  async function removeTeam(teamId) {
    if (!state.supabase || !state.currentUser) return false;
    const { error } = await state.supabase
      .from("user_favorite_teams")
      .delete()
      .eq("user_id", state.currentUser.id)
      .eq("team_id", teamId);
    if (error) {
      console.error("Favorite delete error", error);
      return false;
    }
    return true;
  }

  async function toggleDefaultList({ itemId, listType, nextSaved }) {
    const client = await ensureSupabase();
    if (!client) return false;
    if (!state.currentUser?.id) return false;
    if (!itemId || !listType) return false;
    const isFavorite = String(listType).toLowerCase() === "favorites";
    if (nextSaved) {
      if (isFavorite) {
        state.favorites.add(itemId);
        return await saveTeam({ id: itemId });
      }
      return true;
    }
    if (isFavorite) {
      state.favorites.delete(itemId);
      return await removeTeam(itemId);
    }
    return true;
  }

  async function toggleFavorite() {
    if (!state.team?.id) return;
    if (!state.currentUser) {
      showToast("Sign in to save teams.", "error");
      return;
    }
    const isSaved = state.favorites.has(state.team.id);
    if (isSaved) {
      const ok = await removeTeam(state.team.id);
      if (ok) {
        state.favorites.delete(state.team.id);
        showToast("Removed from favorites.", "success");
      } else {
        showToast("Unable to remove team.", "error");
      }
    } else {
      const ok = await saveTeam(state.team);
      if (ok) {
        state.favorites.add(state.team.id);
        showToast("Team saved to your profile.", "success");
      } else {
        showToast("Unable to save team.", "error");
      }
    }
    updateSaveButton(state.favorites.has(state.team.id));
  }

  async function fetchSportsDB(endpoint, params = {}, timeoutMs = 10000) {
    if (
      window.ZO2Y_SPORTSDB &&
      typeof window.ZO2Y_SPORTSDB.request === "function"
    ) {
      return await window.ZO2Y_SPORTSDB.request(endpoint, params, timeoutMs);
    }
    const SPORTSDB_BASE = "/api/sportsdb";
    const url = new URL(`${SPORTSDB_BASE}/${endpoint}`, window.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (_err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchWikipedia(teamName) {
    const wc = window.__zo2yWikiCache;
    if (wc) {
      const cached = await wc.getWiki(teamName);
      if (cached) return cached;
    }
    try {
      let title = "";
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName)}&format=json&origin=*&srlimit=3`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const results = searchData?.query?.search || [];
      if (results.length) {
        const normalized = teamName.toLowerCase();
        const exact = results.find(
          (r) => String(r.title || "").toLowerCase() === normalized,
        );
        title = exact ? exact.title : results[0].title;
      }
      if (!title) {
        const fbUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(teamName + " football club")}&format=json&origin=*&srlimit=1`;
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();
        const fbResults = fbData?.query?.search || [];
        if (fbResults.length) title = fbResults[0].title;
      }
      if (!title) return null;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();

      let logoImage = "";
      try {
        const pageImagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=400&format=json&origin=*`;
        const piRes = await fetch(pageImagesUrl);
        if (piRes.ok) {
          const piData = await piRes.json();
          const pages = piData?.query?.pages
            ? Object.values(piData.query.pages)
            : [];
          pages.forEach((p) => {
            if (!logoImage && p.original && p.original.source)
              logoImage = p.original.source;
          });
        }
      } catch (_e) {}

      let photoImage = "";
      try {
        const imagesRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=40&format=json&origin=*`,
        );
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const pages = imagesData?.query?.pages
            ? Object.values(imagesData.query.pages)
            : [];
          const titles = [];
          pages.forEach((p) =>
            (p.images || []).forEach((img) => titles.push(img.title || "")),
          );
          const SKIP =
            /logo|icon|wordmark|seal|flag|svg|map\s*of|locator|wikidata|comm\.svg|coat|emblem|building|headquarters|factory|office|person|people|ceo|founder|portrait|signature|trademark|monogram|badge|crest|chart|graph|diagram/i;
          const candidates = titles.filter(
            (t) =>
              /\.(jpg|jpeg|JPG|JPEG|webp|WEBP)$/i.test(t) && !SKIP.test(t),
          );
          const PRODUCT_BOOST =
            /stadium|arena|ground|pitch|field|court|kit|jersey|shirt|uniform|players?|team|lineup|squad|training|match|game|action|celebration|trophy|\b\d{4}\b/i;
          const ranked = candidates.slice().sort((a, b) => {
            const aScore = PRODUCT_BOOST.test(a) ? 0 : 1;
            const bScore = PRODUCT_BOOST.test(b) ? 0 : 1;
            return aScore - bScore;
          });
          const slice = ranked.slice(0, 8);
          if (slice.length) {
            const urlsRes = await fetch(
              `https://en.wikipedia.org/w/api.php?action=query&titles=${slice.map(encodeURIComponent).join("|")}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1920&format=json&origin=*`,
            );
            if (urlsRes.ok) {
              const urlsData = await urlsRes.json();
              const urlPages = urlsData?.query?.pages
                ? Object.values(urlsData.query.pages)
                : [];
              let bestPhoto = null;
              let bestWidth = 0;
              for (const p of urlPages) {
                const info = p.imageinfo && p.imageinfo[0];
                if (info && info.url && info.width >= 400 && info.width > bestWidth) {
                  bestWidth = info.width;
                  bestPhoto = info.url;
                }
              }
              if (bestPhoto) photoImage = bestPhoto;
            }
          }
        }
      } catch (_e) {}

      const result = {
        title: summaryData.title || title,
        description: summaryData.extract || "",
        thumbnail: summaryData.thumbnail?.source || "",
        heroImage:
          summaryData.originalimage?.source ||
          summaryData.thumbnail?.source ||
          "",
        photoImage,
        logoImage,
        url: summaryData.content_urls?.desktop?.page || "",
        wikiSource: title,
      };
      if (wc) wc.setWiki(teamName, result);
      return result;
    } catch (_err) {
      if (wc) wc.setWiki(teamName, null);
      return null;
    }
  }

  async function loadLocalManifest() {
    try {
      const res = await fetch("/assets/sports-badges/local-manifest.json", {
        cache: "force-cache",
      });
      if (!res.ok) return;
      state.localBadgeMap = await res.json();
    } catch (_err) {
      state.localBadgeMap = {};
    }
  }

  function getLocalBadge(teamName) {
    if (!teamName) return "";
    const nameKey = teamName.toLowerCase().trim();
    if (state.localBadgeMap[teamName]) return state.localBadgeMap[teamName];
    if (state.localBadgeMap[nameKey]) return state.localBadgeMap[nameKey];
    return "";
  }

  async function loadTeam() {
    const params = new URLSearchParams(window.location.search);
    const teamIdRaw = params.get("id");
    const teamId = /^\d+$/.test(String(teamIdRaw || "").trim())
      ? String(teamIdRaw || "").trim()
      : "";
    const teamName = params.get("team");
    const teamLeague = params.get("league");
    const teamSport = params.get("sport");
    const teamCountry = params.get("country");
    const criteria = {
      name: teamName,
      league: teamLeague,
      sport: teamSport,
      country: teamCountry,
    };

    await loadLocalManifest();

    let localTeam = null;

    const localBadge = getLocalBadge(teamName);

    if (state.supabase && teamName) {
      try {
        const { data } = await state.supabase
          .from("teams")
          .select("*")
          .ilike("name", teamName)
          .limit(1)
          .maybeSingle();

        if (data) {
          localTeam = {
            id: data.id || teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: data.name || teamName,
            sport: data.sport || teamSport || "",
            league: data.league || teamLeague || "",
            country: teamCountry || "",
            formedYear: "",
            stadium: data.stadium || "",
            stadiumLocation: "",
            stadiumCapacity: "",
            description: "",
            badge: localBadge || data.logo_url || "",
            banner: data.banner_url || "",
            fanart: data.fanart_url || "",
            fanarts: [],
            stadiumThumb: data.stadium_url || "",
            jersey: data.jersey_url || "",
            website: "",
            facebook: "",
            twitter: "",
            instagram: "",
            youtube: "",
            manager: "",
          };
        }
      } catch (_err) {
        console.warn("Failed to load from Supabase:", _err);
      }
    }

    if (!localTeam && teamName) {
      let fallbackId = teamName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      let fallbackSport = teamSport || "Football";
      let fallbackLeague = teamLeague || "";
      if (state.supabase) {
        try {
          const { data: existing } = await state.supabase
            .from("teams")
            .select("id,sport,league")
            .ilike("name", teamName)
            .limit(1)
            .maybeSingle();
          if (existing) {
            fallbackId = existing.id || fallbackId;
            fallbackSport = existing.sport || fallbackSport;
            fallbackLeague = existing.league || fallbackLeague;
          }
        } catch (_) {}
      }
      localTeam = {
        id: fallbackId,
        name: teamName,
        sport: fallbackSport,
        league: fallbackLeague,
        country: teamCountry || "",
        formedYear: "",
        stadium: "",
        stadiumLocation: "",
        stadiumCapacity: "",
        description: "",
        badge: localBadge || "",
        banner: "",
        fanart: "",
        fanarts: [],
        stadiumThumb: "",
        jersey: "",
        website: "",
        facebook: "",
        twitter: "",
        instagram: "",
        youtube: "",
        manager: "",
      };
    }

    let sportsdbRaw = null;
    if (teamName) {
      let payload = null;
      if (teamId) {
        payload = await fetchSportsDB("lookupteam.php", { id: teamId });
      }
      if (!payload?.teams?.length) {
        payload = await fetchSportsDB("searchteams.php", { t: teamName });
      }
      const teams = Array.isArray(payload?.teams) ? payload.teams : [];
      if (teams.length) {
        const best = pickBestTeamMatch(teams, criteria);
        sportsdbRaw = best || teams[0];
        const mapped = mapTeam(sportsdbRaw);
        if (mapped && !localTeam) {
          localTeam = {
            id: mapped.id,
            name: mapped.name,
            sport: mapped.sport,
            league: mapped.league,
            country: mapped.country,
            formedYear: mapped.formedYear,
            stadium: mapped.stadium,
            stadiumLocation: mapped.stadiumLocation,
            stadiumCapacity: mapped.stadiumCapacity,
            description: mapped.description,
            manager: mapped.manager,
            badge: mapped.badge,
            banner: "",
            fanart: "",
            fanarts: mapped.fanarts,
            stadiumThumb: mapped.stadiumThumb,
            jersey: mapped.jersey,
            website: mapped.website,
            facebook: mapped.facebook,
            twitter: mapped.twitter,
            instagram: mapped.instagram,
            youtube: mapped.youtube,
          };
        } else if (mapped && localTeam) {
          if (!localTeam.badge) localTeam.badge = mapped.badge;
          if (!localTeam.stadium) localTeam.stadium = mapped.stadium;
          if (!localTeam.stadiumLocation)
            localTeam.stadiumLocation = mapped.stadiumLocation;
          if (!localTeam.stadiumCapacity)
            localTeam.stadiumCapacity = mapped.stadiumCapacity;
          if (!localTeam.description) localTeam.description = mapped.description;
          if (!localTeam.manager) localTeam.manager = mapped.manager;
          if (!localTeam.formedYear) localTeam.formedYear = mapped.formedYear;
          if (!localTeam.website) localTeam.website = mapped.website;
          if (!localTeam.facebook) localTeam.facebook = mapped.facebook;
          if (!localTeam.twitter) localTeam.twitter = mapped.twitter;
          if (!localTeam.instagram) localTeam.instagram = mapped.instagram;
          if (!localTeam.youtube) localTeam.youtube = mapped.youtube;
          if (!localTeam.fanarts?.length) localTeam.fanarts = mapped.fanarts;
          if (!localTeam.jersey) localTeam.jersey = mapped.jersey;
        }
      }
    }

    let wikiData = null;
    if (teamName) {
      wikiData = await fetchWikipedia(teamName);
      if (wikiData && localTeam) {
        if (wikiData.description) {
          localTeam.description = localTeam.description
            ? `${localTeam.description}\n\n${wikiData.description}`
            : wikiData.description;
        }
        if (!localTeam.website && wikiData.url)
          localTeam.website = wikiData.url;
        if (!localTeam.badge && wikiData.logoImage)
          localTeam.badge = wikiData.logoImage;
        if (!localTeam.badge && wikiData.thumbnail)
          localTeam.badge = wikiData.thumbnail;
        if (wikiData.photoImage) localTeam.wikiPhoto = wikiData.photoImage;
        if (wikiData.heroImage) localTeam.wikiHero = wikiData.heroImage;
        if (wikiData.wikiSource) localTeam.wikiTitle = wikiData.wikiSource;
      }
    }

    const team = localTeam;

    if (!team) {
      document.title = "Zo2y - Team not found";
      return;
    }

    state.team = team;
    setHero(team, wikiData);

    state.roster = extractRoster(sportsdbRaw);
    renderRoster();

    fetchRelatedTeams(team)
      .then(() => renderRelated())
      .catch(() => {});

    loadTeamTrailer(team);

    if (state.supabase && localTeam) {
      try {
        let saveId = team.id;
        const { data: existingRow } = await state.supabase
          .from("teams")
          .select("id")
          .ilike("name", team.name)
          .limit(1)
          .maybeSingle();
        if (existingRow?.id) saveId = existingRow.id;

        await state.supabase.from("teams").upsert(
          {
            id: saveId,
            name: team.name,
            sport: team.sport || null,
            league: team.league || null,
            logo_url: team.badge || null,
            banner_url: team.banner || null,
            stadium: team.stadium || null,
            stadium_url: team.stadiumThumb || null,
            jersey_url: team.jersey || null,
            fanart_url: team.fanart || null,
          },
          { onConflict: "id" },
        );
      } catch (_err) {
        console.warn("Failed to save team data:", _err);
      }
    }

    await loadFavoriteStatus().catch(() => {});
  }

  /* ---------- Reviews ---------- */
  let currentRating = 0;
  let editingReviewId = null;
  let reviews = [];
  let currentSort = 'latest';

  function renderReviewStats() {
    const statsEl = document.getElementById('reviewsStats');
    if (!statsEl) return;
    const count = reviews.length;
    if (!count) {
      statsEl.innerHTML = `
        <div class="reviews-big">
          <div class="reviews-big-value">—<span class="reviews-big-denom">/5</span></div>
          <div class="reviews-big-stars" aria-hidden="true">
            <i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i><i class="fa-regular fa-star"></i>
          </div>
          <div class="reviews-big-count">be the first to review</div>
        </div>`;
      return;
    }
    const avg = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / count;
    const dist = {5:0,4:0,3:0,2:0,1:0};
    reviews.forEach(r => { const rt = Math.max(1,Math.min(5,Number(r.rating||0))); dist[rt]++; });
    const fullStars = Math.round(avg);
    let starsHtml = '';
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) starsHtml += '<i class="fa-solid fa-star"></i>';
      else if (i === fullStars && avg % 1 >= 0.75) starsHtml += '<i class="fa-solid fa-star"></i>';
      else if (i === fullStars && avg % 1 >= 0.25) starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
      else starsHtml += '<i class="fa-regular fa-star"></i>';
    }
    statsEl.innerHTML = `
      <div class="reviews-big">
        <div class="reviews-big-value">${avg.toFixed(1)}<span class="reviews-big-denom">/5</span></div>
        <div class="reviews-big-stars" aria-hidden="true">${starsHtml}</div>
        <div class="reviews-big-count">${count} review${count !== 1 ? 's' : ''}</div>
      </div>
      <div class="reviews-bars">
        ${[5,4,3,2,1].map(n => {
          const pct = count ? Math.round((dist[n]/count)*100) : 0;
          return `<div class="reviews-bar-row"><span class="label">${n}★</span><div class="reviews-bar"><div class="reviews-bar-fill" style="width:${pct}%"></div></div><span class="count">${dist[n]}</span></div>`;
        }).join('')}
      </div>`;
  }

  function renderReviewCards() {
    const list = document.getElementById('reviewsList');
    if (!list) return;
    if (!reviews.length) {
      list.innerHTML = '<div class="reviews-empty">No reviews yet. Be the first to share your thoughts!</div>';
      return;
    }
    const sorted = [...reviews].sort((a, b) => {
      if (currentSort === 'highest') return Number(b.rating||0) - Number(a.rating||0);
      if (currentSort === 'lowest') return Number(a.rating||0) - Number(b.rating||0);
      return new Date(b.created_at||0) - new Date(a.created_at||0);
    });
    list.innerHTML = sorted.map(r => {
      const mine = state.currentUser && String(state.currentUser.id) === String(r.user_id);
      const d = new Date(r.created_at || '');
      const dateText = Number.isFinite(d.getTime()) ? d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '';
      const stars = Array.from({length:5},(_,i) => i < Number(r.rating||0) ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>').join('');
      return `<article class="review-card" data-review-id="${escapeHtml(r.id)}">
        <div class="review-head"><div><div class="review-user">${escapeHtml(r.user_display_name || 'User')}</div><div class="review-date">${escapeHtml(dateText)}</div></div><div class="review-stars-display">${stars}</div></div>
        <div class="review-comment">${escapeHtml(r.comment || 'No comment.')}</div>
        ${mine ? `<div class="review-actions"><button type="button" data-act="edit" data-id="${escapeHtml(r.id)}">Edit</button><button type="button" data-act="del" data-id="${escapeHtml(r.id)}">Delete</button></div>` : ''}
      </article>`;
    }).join('');
  }

  function updateStarDisplay() {
    const stars = document.querySelectorAll('.stars-rating .star');
    stars.forEach(star => {
      const r = Number(star.dataset.rating || 0);
      star.classList.toggle('on', r <= currentRating);
    });
    const label = document.getElementById('ratingText');
    if (label) {
      const labels = ['','Poor','Fair','Good','Very Good','Excellent'];
      label.textContent = currentRating ? labels[currentRating] : 'Select your rating';
    }
  }

  function resetReviewForm() {
    editingReviewId = null;
    currentRating = 0;
    updateStarDisplay();
    const ta = document.getElementById('review-comment');
    if (ta) ta.value = '';
    const cc = document.getElementById('charCount');
    if (cc) cc.textContent = '0';
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    const submitText = document.querySelector('.submit-review-btn .btn-text');
    if (submitText) submitText.textContent = 'Submit Review';
  }

  function syncReviewFormVisibility() {
    const form = document.getElementById('review-form');
    const prompt = document.getElementById('auth-prompt');
    const section = document.getElementById('reviews-section');
    if (!form || !prompt) return;
    if (state.currentUser) {
      form.classList.remove('hidden');
      prompt.classList.add('hidden');
      if (section) section.hidden = false;
    } else {
      form.classList.add('hidden');
      prompt.classList.remove('hidden');
      if (reviews.length === 0 && section) section.hidden = true;
    }
  }

  async function loadReviews() {
    const list = document.getElementById('reviewsList');
    const stats = document.getElementById('reviewsStats');
    const section = document.getElementById('reviews-section');
    if (!list || !stats) return;
    list.innerHTML = '<div class="reviews-loading">Loading reviews...</div>';
    if (!state.supabase || !state.team) return;
    try {
      const { data, error } = await state.supabase
        .from('team_reviews')
        .select('*')
        .eq('team_name', state.team.name)
        .order('created_at', { ascending: false });
      if (error) {
        list.innerHTML = '<div class="reviews-empty">Error loading reviews.</div>';
        return;
      }
      reviews = data || [];
      if (!reviews.length && !state.currentUser) {
        if (section) section.hidden = true;
        return;
      }
      if (section) section.hidden = false;
      renderReviewStats();
      renderReviewCards();
    } catch (_e) {
      list.innerHTML = '<div class="reviews-empty">Error loading reviews.</div>';
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!state.currentUser || !state.team) return;
    if (!currentRating) { showToast('Please select a rating', 'error'); return; }
    const ta = document.getElementById('review-comment');
    const comment = ta ? ta.value.trim() : '';
    const submitText = document.querySelector('.submit-review-btn .btn-text');
    if (submitText) submitText.textContent = 'Saving...';
    try {
      if (editingReviewId) {
        const { error } = await state.supabase.from('team_reviews').update({ rating: currentRating, comment, updated_at: new Date().toISOString() }).eq('id', editingReviewId);
        if (error) throw error;
      } else {
        const { error } = await state.supabase.from('team_reviews').upsert({
          team_name: state.team.name,
          user_id: state.currentUser.id,
          user_display_name: state.currentUser.user_metadata?.username || state.currentUser.email || 'User',
          rating: currentRating,
          comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,team_name' });
        if (error) throw error;
      }
    } catch (e) {
      showToast('Could not save review', 'error');
      if (submitText) submitText.textContent = 'Submit Review';
      return;
    }
    resetReviewForm();
    await loadReviews();
    showToast(editingReviewId ? 'Review updated' : 'Review submitted', 'success');
  }

  function wireReviewEvents() {
    const form = document.getElementById('review-form');
    if (form) form.addEventListener('submit', submitReview);
    const cancelBtn = document.querySelector('.cancel-edit-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', resetReviewForm);
    const starsEl = document.querySelector('.stars-rating');
    if (starsEl) {
      starsEl.addEventListener('click', e => {
        const star = e.target.closest('.star');
        if (!star) return;
        currentRating = Number(star.dataset.rating || 0);
        updateStarDisplay();
      });
    }
    const ta = document.getElementById('review-comment');
    if (ta) {
      ta.addEventListener('input', () => {
        const cc = document.getElementById('charCount');
        if (cc) cc.textContent = String(ta.value.length);
      });
    }
    const sortSel = document.getElementById('sortSelect');
    if (sortSel) {
      sortSel.addEventListener('change', e => {
        currentSort = e.target.value;
        renderReviewCards();
      });
    }
    const list = document.getElementById('reviewsList');
    if (list) {
      list.addEventListener('click', async e => {
        const btn = e.target.closest('button[data-act]');
        if (!btn || !list.contains(btn)) return;
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        if (act === 'edit') {
          const review = reviews.find(r => String(r.id) === String(id));
          if (!review) return;
          editingReviewId = id;
          currentRating = Number(review.rating || 0);
          updateStarDisplay();
          const textarea = document.getElementById('review-comment');
          if (textarea) textarea.value = review.comment || '';
          const submitText = document.querySelector('.submit-review-btn .btn-text');
          if (submitText) submitText.textContent = 'Update Review';
          if (cancelBtn) cancelBtn.classList.remove('hidden');
        }
        if (act === 'del') {
          if (!window.confirm('Delete this review?')) return;
          const { error } = await state.supabase.from('team_reviews').delete().eq('id', id).eq('user_id', state.currentUser.id);
          if (!error) { await loadReviews(); showToast('Review deleted', 'success'); }
        }
      });
    }
  }

  async function init() {
    if (ui.body) ui.body.dataset.elevatedCategory = "team";
    await ensureSupabase();
    await initAuth();
    initMenuBridge();
    wireReviewEvents();
    syncReviewFormVisibility();
    const saveBtn = document.getElementById("teamSaveBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", (event) => {
        event.preventDefault();
        openListMenuFromCard();
      });
    }
    await loadTeam();
    await loadReviews();
  }

  init().catch(() => {
    showToast("Unable to load team details.", "error");
  });
})();
