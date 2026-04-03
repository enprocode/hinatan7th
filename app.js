// GitHub Pages (static) 向け：検索/フィルタ、現在位置ナビ

function setupNavCurrentSection() {
  const navLinks = Array.from(document.querySelectorAll('nav a.nav-link[href^="#"]'));
  if (!navLinks.length) return;

  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  let lastActiveId = '';

  const setActive = (id) => {
    if (!id || id === lastActiveId) return;
    lastActiveId = id;

    navLinks.forEach((a) => {
      const active = a.getAttribute('href') === `#${id}`;
      a.classList.toggle('is-active', active);
      if (active) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting && e.target && e.target.id)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
      if (visible[0]) setActive(visible[0].target.id);
    },
    { root: null, rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.15, 0.3, 0.5, 0.7, 1] }
  );

  sections.forEach((s) => observer.observe(s));

  // 初期状態（ハッシュ移動時）
  if (window.location.hash) {
    const id = window.location.hash.replace('#', '');
    setActive(id);
  } else {
    // 何もなければ最上部セクションへ寄せる
    const first = sections[0];
    if (first && first.id) setActive(first.id);
  }
}

function setupMapLazyLoad() {
  const containers = Array.from(document.querySelectorAll('[data-map-src]'));
  if (!containers.length) return;

  const loadMap = (container) => {
    if (container.dataset.mapLoaded === 'true') return;

    const iframeSrc = container.getAttribute('data-map-src');
    const title = container.getAttribute('data-map-title') || 'Google Map';
    if (!iframeSrc) return;

    const iframe = document.createElement('iframe');
    iframe.src = iframeSrc;
    iframe.title = title;
    iframe.setAttribute('allowfullscreen', '');
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

    container.appendChild(iframe);

    const fallback = container.querySelector('.map-fallback');
    if (fallback) fallback.remove();

    container.dataset.mapLoaded = 'true';
  };

  containers.forEach((container) => {
    const btn = container.querySelector('[data-map-show]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        loadMap(container);
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((en) => en.isIntersecting);
        if (hit) {
          loadMap(container);
          io.disconnect();
        }
      },
      { root: null, rootMargin: '0px 0px 350px 0px', threshold: 0 }
    );

    io.observe(container);
  });
}

function setupSpotFilter() {
  const searchInput = document.getElementById('spotSearch');
  const clearBtn = document.getElementById('spotClear');
  const resultsCount = document.getElementById('spotResultsCount');
  const noResults = document.getElementById('spotNoResults');
  const cards = Array.from(document.querySelectorAll('.spot-card[data-tags]'));
  const tagButtons = Array.from(document.querySelectorAll('[data-spot-tag]'));

  if (!searchInput || !cards.length || !tagButtons.length) return;

  // 検索用テキストを一度だけ生成
  cards.forEach((card) => {
    card.dataset.searchText = (card.innerText || '').toLowerCase();
  });

  const getSelectedTags = () => {
    return tagButtons
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.getAttribute('data-spot-tag'));
  };

  const apply = () => {
    const q = (searchInput.value || '').trim().toLowerCase();
    const selectedTags = getSelectedTags();

    let shown = 0;
    cards.forEach((card) => {
      const textOk = !q || (card.dataset.searchText || '').includes(q);
      const tags = (card.getAttribute('data-tags') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const tagOk = !selectedTags.length || selectedTags.some((t) => tags.includes(t));

      const match = textOk && tagOk;
      card.style.display = match ? '' : 'none';
      if (match) shown++;
    });

    if (resultsCount) resultsCount.textContent = `${shown}件表示`;
    if (noResults) noResults.hidden = shown !== 0;
  };

  searchInput.addEventListener('input', apply);

  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
      apply();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      tagButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      apply();
    });
  }

  // 初期反映
  apply();
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavCurrentSection();
  setupSpotFilter();
  setupMapLazyLoad();
});

