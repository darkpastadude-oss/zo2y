(() => {
  const DESKTOP_BREAKPOINT = 1025;
  const SIDEBAR_STORAGE_KEY = 'zo2y_home_sidebar_collapsed_v1';
  const REVIEW_ROTATE_MS = 6200;

  const reviewSlides = [
    {
      kicker: 'Movie Review',
      title: 'The Dark Knight',
      quote: 'Every rewatch still lands. Tight pacing, iconic performances, and high replay value.',
      author: '@cineflux',
      score: '9.5/10',
      image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
    },
    {
      kicker: 'Movie Review',
      title: 'The Return of the King',
      quote: 'Massive finale energy with emotional payoff. It still feels like event cinema.',
      author: '@epicframes',
      score: '9.3/10',
      image: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg'
    },
    {
      kicker: 'Game Review',
      title: 'Baldur\'s Gate 3',
      quote: 'The freedom is absurd in the best way. Choices have real consequence and payoff.',
      author: '@rollforstory',
      score: '9.8/10',
      image: 'https://upload.wikimedia.org/wikipedia/en/1/12/Baldur%27s_Gate_3_cover_art.jpg'
    },
    {
      kicker: 'Game Review',
      title: 'Elden Ring',
      quote: 'Unmatched exploration loop. The world design keeps rewarding curiosity.',
      author: '@bossrush',
      score: '9.4/10',
      image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg'
    },
    {
      kicker: 'Game Review',
      title: 'The Last of Us Part II',
      quote: 'Technical polish and strong art direction. Heavy, but expertly delivered.',
      author: '@storylineops',
      score: '9.0/10',
      image: 'https://upload.wikimedia.org/wikipedia/en/4/4f/The_Last_of_Us_Part_II_cover_art.jpg'
    }
  ];

  const imdbTopMovies = [
    {
      mediaType: 'movie',
      title: 'The Shawshank Redemption',
      subtitle: 'IMDb 9.3',
      extra: '#1 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
      href: 'https://www.imdb.com/title/tt0111161/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'The Godfather',
      subtitle: 'IMDb 9.2',
      extra: '#2 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
      href: 'https://www.imdb.com/title/tt0068646/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'The Dark Knight',
      subtitle: 'IMDb 9.0',
      extra: '#3 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      href: 'https://www.imdb.com/title/tt0468569/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'The Godfather Part II',
      subtitle: 'IMDb 9.0',
      extra: '#4 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg',
      href: 'https://www.imdb.com/title/tt0071562/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: '12 Angry Men',
      subtitle: 'IMDb 9.0',
      extra: '#5 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg',
      href: 'https://www.imdb.com/title/tt0050083/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'Schindler\'s List',
      subtitle: 'IMDb 9.0',
      extra: '#6 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
      href: 'https://www.imdb.com/title/tt0108052/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'The Return of the King',
      subtitle: 'IMDb 9.0',
      extra: '#7 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',
      href: 'https://www.imdb.com/title/tt0167260/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'Pulp Fiction',
      subtitle: 'IMDb 8.9',
      extra: '#8 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      href: 'https://www.imdb.com/title/tt0110912/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'The Good, the Bad and the Ugly',
      subtitle: 'IMDb 8.8',
      extra: '#9 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg',
      href: 'https://www.imdb.com/title/tt0060196/',
      disableLists: true
    },
    {
      mediaType: 'movie',
      title: 'Fight Club',
      subtitle: 'IMDb 8.8',
      extra: '#10 on IMDb Top 250',
      image: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      href: 'https://www.imdb.com/title/tt0137523/',
      disableLists: true
    }
  ];

  const awardWinningGames = [
    {
      mediaType: 'game',
      title: 'Baldur\'s Gate 3',
      subtitle: 'Game of the Year 2023',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/1/12/Baldur%27s_Gate_3_cover_art.jpg',
      href: 'https://www.metacritic.com/game/baldurs-gate-3/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Elden Ring',
      subtitle: 'Game of the Year 2022',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg',
      href: 'https://www.metacritic.com/game/elden-ring/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'It Takes Two',
      subtitle: 'Game of the Year 2021',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/a/a9/It_Takes_Two_cover_art.png',
      href: 'https://www.metacritic.com/game/it-takes-two/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'The Last of Us Part II',
      subtitle: 'Game of the Year 2020',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/4/4f/The_Last_of_Us_Part_II_cover_art.jpg',
      href: 'https://www.metacritic.com/game/the-last-of-us-part-ii/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Sekiro: Shadows Die Twice',
      subtitle: 'Game of the Year 2019',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/6/6e/Sekiro_art.jpg',
      href: 'https://www.metacritic.com/game/sekiro-shadows-die-twice/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Hades',
      subtitle: 'Best Indie 2020',
      extra: 'Golden Joystick Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg',
      href: 'https://www.metacritic.com/game/hades/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Disco Elysium',
      subtitle: 'Best Narrative 2019',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/0/0e/Disco_Elysium_Poster.jpeg',
      href: 'https://www.metacritic.com/game/disco-elysium/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Portal 2',
      subtitle: 'BAFTA Best Game',
      extra: 'Classic Winner',
      image: 'https://upload.wikimedia.org/wikipedia/en/f/f9/Portal2cover.jpg',
      href: 'https://www.metacritic.com/game/portal-2/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'The Legend of Zelda: TOTK',
      subtitle: 'Best Action/Adventure',
      extra: 'The Game Awards 2023',
      image: 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg',
      href: 'https://www.metacritic.com/game/the-legend-of-zelda-tears-of-the-kingdom/',
      disableLists: true
    },
    {
      mediaType: 'game',
      title: 'Red Dead Redemption 2',
      subtitle: 'Best Narrative 2018',
      extra: 'The Game Awards',
      image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
      href: 'https://www.metacritic.com/game/red-dead-redemption-2/',
      disableLists: true
    }
  ];

  function isDesktopViewport() {
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
  }

  function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!toggleBtn) return;

    const label = toggleBtn.querySelector('span');

    const applyState = (collapsed) => {
      document.body.classList.toggle('sidebar-collapsed', !!collapsed);
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      if (label) {
        label.textContent = collapsed ? 'Expand Menu' : 'Collapse Menu';
      }
    };

    let savedCollapsed = false;
    try {
      savedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1';
    } catch (_err) {}
    applyState(savedCollapsed);

    toggleBtn.addEventListener('click', () => {
      const nextCollapsed = !document.body.classList.contains('sidebar-collapsed');
      applyState(nextCollapsed);
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, nextCollapsed ? '1' : '0');
      } catch (_err) {}
    });
  }

  function initReviewSlideshow() {
    const backdropEl = document.getElementById('reviewStageBackdrop');
    const kickerEl = document.getElementById('reviewStageKicker');
    const titleEl = document.getElementById('reviewStageTitle');
    const quoteEl = document.getElementById('reviewStageQuote');
    const authorEl = document.getElementById('reviewStageAuthor');
    const scoreEl = document.getElementById('reviewStageScore');
    const dotsEl = document.getElementById('reviewSlideDots');
    const prevBtn = document.getElementById('reviewSlidePrev');
    const nextBtn = document.getElementById('reviewSlideNext');
    const stageCard = document.querySelector('.review-stage-card');

    if (!backdropEl || !kickerEl || !titleEl || !quoteEl || !authorEl || !scoreEl || !dotsEl || !prevBtn || !nextBtn || !stageCard) {
      return;
    }

    const totalSlides = reviewSlides.length;
    if (!totalSlides) return;

    let activeIndex = 0;
    let timerId = null;

    const renderDots = () => {
      dotsEl.innerHTML = reviewSlides
        .map((_, idx) => `
          <button
            class="review-dot${idx === activeIndex ? ' active' : ''}"
            type="button"
            data-review-dot="${idx}"
            aria-label="Go to review slide ${idx + 1}"></button>
        `)
        .join('');

      dotsEl.querySelectorAll('[data-review-dot]').forEach((dot) => {
        dot.addEventListener('click', () => {
          const targetIndex = Number(dot.getAttribute('data-review-dot'));
          if (!Number.isInteger(targetIndex)) return;
          showSlide(targetIndex, true);
        });
      });
    };

    const showSlide = (index, fromUser = false) => {
      activeIndex = (index + totalSlides) % totalSlides;
      const slide = reviewSlides[activeIndex];

      kickerEl.textContent = slide.kicker;
      titleEl.textContent = slide.title;
      quoteEl.textContent = `\"${slide.quote}\"`;
      authorEl.textContent = slide.author;
      scoreEl.textContent = slide.score;

      if (slide.image) {
        backdropEl.style.backgroundImage = `url(\"${slide.image}\")`;
      } else {
        backdropEl.style.backgroundImage = 'linear-gradient(140deg, #0f203f, #132347)';
      }

      renderDots();

      if (fromUser) {
        restartAutoRotate();
      }
    };

    const stopAutoRotate = () => {
      if (!timerId) return;
      window.clearInterval(timerId);
      timerId = null;
    };

    const restartAutoRotate = () => {
      stopAutoRotate();
      if (!isDesktopViewport()) return;
      timerId = window.setInterval(() => {
        showSlide(activeIndex + 1, false);
      }, REVIEW_ROTATE_MS);
    };

    prevBtn.addEventListener('click', () => showSlide(activeIndex - 1, true));
    nextBtn.addEventListener('click', () => showSlide(activeIndex + 1, true));

    stageCard.addEventListener('mouseenter', stopAutoRotate);
    stageCard.addEventListener('mouseleave', restartAutoRotate);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoRotate();
      } else {
        restartAutoRotate();
      }
    });

    window.addEventListener('resize', restartAutoRotate);

    showSlide(0, false);
    restartAutoRotate();
  }

  function renderCuratedRails(retriesLeft = 10) {
    if (typeof window.renderRail !== 'function') {
      if (retriesLeft <= 0) return;
      window.setTimeout(() => renderCuratedRails(retriesLeft - 1), 180);
      return;
    }

    window.renderRail('imdbTop10Rail', imdbTopMovies, { mediaType: 'movie' });
    window.renderRail('awardGamesRail', awardWinningGames, { mediaType: 'game' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initReviewSlideshow();
    renderCuratedRails();
  });
})();
