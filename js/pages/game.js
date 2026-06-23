(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const els = {
    gallery: document.getElementById("gameGallery"),
    gallerySec: document.getElementById("gameGallerySection"),
    related: document.getElementById("gameRelated"),
    relatedSec: document.getElementById("gameRelatedSection"),
    aboutBody: document.getElementById("gameAboutBody"),
  };

  async function loadGame() {
    if (!id) {
      if (els.name) els.name.textContent = "Game not found";
      if (els.desc) els.desc.textContent = "No game ID provided.";
      return;
    }

    try {
      const res = await fetch(`/api/igdb/games/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Game not found");

      const game = await res.json();

      const config = {
        type: "game",
        typeLabel: "Game Spotlight",
        title: (game.name || "Unknown Game").replace(/\s*\(video game\)/i, ""),
        posterUrl: game.cover || "/images/fallback/game.svg",
        posterFit: "contain",
        backdropUrl: (() => {
          let backdrop = game.background_image || game.hero || "";
          if (!backdrop && game.screenshots && game.screenshots.length > 0) {
            backdrop = game.screenshots[0].image || game.screenshots[0] || "";
          }
          return backdrop || "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1600&q=80";
        })(),
        description:
          game.description || "Explore more details about this game.",
        metadata: [],
        actions: [
          {
            id: "gameSaveBtn",
            icon: "fa-solid fa-bookmark",
            label: "Add to List",
            primary: true,
          },
          {
            id: "gameFavoriteBtn",
            icon: "fa-solid fa-heart",
            label: "Favorite",
          },
        ],
      };

      if (game.released)
        config.metadata.push({
          type: "year",
          value: game.released.substring(0, 4),
        });
      if (game.platforms && game.platforms.length > 0)
        config.metadata.push({
          type: "platform",
          value:
            game.platforms
              .slice(0, 2)
              .map((p) => p.name || p)
              .join(", ") + (game.platforms.length > 2 ? "..." : ""),
        });
      if (game.developers && game.developers.length > 0)
        config.metadata.push({
          type: "developer",
          value: game.developers[0].name || game.developers[0],
        });
      if (game.genres && game.genres.length > 0)
        config.metadata.push({
          type: "genre",
          value: game.genres
            .slice(0, 2)
            .map((g) => g.name || g)
            .join(", "),
        });
      if (game.rating)
        config.metadata.push({
          type: "rating",
          value: Number(game.rating).toFixed(1),
        });

      if (game.website)
        config.actions.push({
          id: "gameWebsite",
          icon: "fa-solid fa-arrow-up-right-from-square",
          label: "Official Site",
          href: game.website,
        });

      if (window.renderUnifiedMediaHero) {
        window.renderUnifiedMediaHero(
          document.getElementById("unifiedHeroContainer"),
          config,
        );
        bindUnifiedListMenu(game, config);
      }

      if (els.aboutBody && game.description) {
        els.aboutBody.textContent = game.description;
      }

      // Populate quick facts grid
      const infoGrid = document.getElementById("gameInfoGrid");
      if (infoGrid) {
        let factsHtml = "";
        if (game.developers && game.developers.length > 0) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Developer</div><div class="elevated-detail-value">${game.developers.map((d) => d.name || d).join(", ")}</div></div>`;
        }
        if (game.publishers && game.publishers.length > 0) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Publisher</div><div class="elevated-detail-value">${game.publishers.map((p) => p.name || p).join(", ")}</div></div>`;
        }
        if (game.released) {
          factsHtml += `<div class="elevated-detail-item"><div class="elevated-detail-label">Release Date</div><div class="elevated-detail-value">${game.released}</div></div>`;
        }
        infoGrid.innerHTML = factsHtml;
      }

      // Populate screenshots gallery
      if (game.screenshots && game.screenshots.length > 0) {
        if (els.gallerySec) els.gallerySec.hidden = false;
        if (els.gallery) {
          const renderImgs = game.screenshots;
          els.gallery.classList.toggle("has-multiple", renderImgs.length > 1);
          els.gallery.innerHTML = renderImgs
            .map(
              (img, i) =>
                `<div class="elevated-gallery-item" data-index="${i}" ${i === 0 && renderImgs.length > 1 ? `data-remaining="${renderImgs.length - 1}"` : ""}><img src="${img.image || img}" loading="lazy" alt="Screenshot" onerror="this.style.display='none'"></div>`,
            )
            .join("");
          els.gallery.onclick = (e) => {
            const item = e.target.closest(".elevated-gallery-item");
            if (item && window.openGalleryLightbox) {
              window.openGalleryLightbox(
                renderImgs.map((i) => ({ url: i.image || i, caption: "" })),
                parseInt(item.getAttribute("data-index") || "0", 10),
              );
            }
          };
        }
      }

      // Social links
      const socialSec = document.getElementById("gameSocialSection");
      const socialGrid = document.getElementById("gameSocial");
      if (socialSec && socialGrid && (game.website || game.reddit_url)) {
        socialSec.hidden = false;
        let socialHtml = "";
        if (game.website)
          socialHtml += `<a href="${game.website}" target="_blank" class="elevated-social-link"><i class="fa-solid fa-globe"></i> Official Website</a>`;
        if (game.reddit_url)
          socialHtml += `<a href="${game.reddit_url}" target="_blank" class="elevated-social-link"><i class="fa-brands fa-reddit"></i> Reddit</a>`;
        socialGrid.innerHTML = socialHtml;
      }
    } catch (e) {
      console.error(e);
      if (els.desc && !els.desc.textContent)
        els.desc.textContent = "Failed to load game details.";
      if (els.name && !els.name.textContent)
        els.name.textContent = "Game Error";
    }
  }

  function bindUnifiedListMenu(game, config) {
    const saveBtn = document.getElementById("gameSaveBtn");
    if (!saveBtn || !window.initIndexStyleListMenu) return;

    window.initIndexStyleListMenu({
      mediaType: "game",
      itemIdAttr: "data-item-id",
      getVisibleItemIds: () => id ? [id] : [],
      getQuickStatusForItem: () => null,
      getItemFromCard: () => ({
        mediaType: "game",
        itemId: id,
        title: config.title,
        subtitle: "",
        posterUrl: config.posterUrl
      })
    });

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.openIndexStyleListMenu(saveBtn);
    });
  }

  document.addEventListener("DOMContentLoaded", loadGame);
})();
