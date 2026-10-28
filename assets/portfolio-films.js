(() => {
  const setup = () => {
    const page = document.querySelector('#dc-root [data-page="portfolio"]');
    if (!page || page.dataset.filmsReady || !page.querySelector('dialog') || !page.querySelector('[data-film-open]')) return;
    page.dataset.filmsReady = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const videos = [...page.querySelectorAll('[data-portfolio-loop]')];
    const activate = video => {
      video.muted = true; video.loop = true; video.playsInline = true;
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => {});
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (isIntersecting && !reduced.matches) activate(target);
        else if (!isIntersecting) target.pause();
      });
    }, {rootMargin:'160px'}) : null;
    videos.forEach(video => { video.muted = true; video.loop = true; video.playsInline = true; observer?.observe(video); });
    reduced.addEventListener?.('change', () => {
      videos.forEach(video => { if (reduced.matches) video.pause(); else if (!observer) activate(video); });
      if (observer) videos.forEach(video => { observer.unobserve(video); observer.observe(video); });
    });
    const togglePreview = (button, video, label) => {
      if (video.paused) { activate(video); button.textContent = `Mettre en pause l’aperçu ${label}`; }
      else { video.pause(); button.textContent = `Lire l’aperçu ${label}`; }
    };
    page.querySelectorAll('[data-play-card]').forEach(button => button.addEventListener('click', () => togglePreview(button, button.closest('.pg-item').querySelector('video'), ({koryaa:'Koryaa', acasa:'Acasa', 'ejp-le-mag':'EJP Le Mag'})[button.dataset.playCard])));
    const dialog = page.querySelector('dialog');
    const full = dialog.querySelector('video');
    let trigger;
    page.querySelectorAll('[data-film-open]').forEach(button => button.addEventListener('click', event => {
      trigger = event.currentTarget;
      const name = trigger.dataset.filmOpen === 'acasa' ? 'acasa' : 'koryaa';
      const title = name === 'acasa' ? 'Acasa' : 'Koryaa';
      dialog.querySelector('#pg-dialog-title').textContent = `Film ${title}.`;
      full.setAttribute('aria-label', `Film ${title}`);
      full.poster = `assets/videos/${name}-poster.jpg`;
      const source = full.querySelector('source');
      source.src = name === 'acasa' ? 'assets/videos/acasa-full-web-hq.mp4' : 'assets/videos/koryaa-full-hq.mp4';
      full.load();
      dialog.showModal();
      dialog.querySelector('[data-film-close]').focus();
    }));
    dialog.querySelector('[data-film-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { full.pause(); trigger?.focus(); });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button,video[controls],a[href]')].filter(el => !el.disabled);
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    });
  };
  const setupHome = () => {
    const home = document.querySelector('#dc-root [data-page="accueil"]');
    const button = home?.querySelector('[data-home-preview-toggle]');
    if (!home || !button || home.dataset.homeFilmsReady) return;
    const videos = [...home.querySelectorAll('[data-home-preview]')];
    if (videos.length !== 2) return;
    home.dataset.homeFilmsReady = 'true';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let enabled = !reduced.matches;
    const visible = new Set();
    const updateButton = () => { button.textContent = enabled ? 'Mettre les aperçus en pause' : 'Lire les aperçus'; };
    const play = video => {
      video.muted = true; video.loop = true; video.playsInline = true;
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => { enabled = false; videos.forEach(item => item.pause()); updateButton(); });
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      entries.forEach(({target, isIntersecting}) => {
        if (isIntersecting) { visible.add(target); if (enabled) play(target); }
        else { visible.delete(target); target.pause(); }
      });
    }, {rootMargin:'120px'}) : null;
    videos.forEach(video => { video.muted = true; video.loop = true; video.playsInline = true; observer?.observe(video); });
    button.addEventListener('click', () => {
      enabled = !enabled; updateButton();
      videos.forEach(video => { if (!enabled) video.pause(); else if (!observer || visible.has(video)) play(video); });
    });
    reduced.addEventListener?.('change', () => {
      enabled = !reduced.matches; updateButton();
      videos.forEach(video => { if (!enabled) video.pause(); else if (!observer || visible.has(video)) play(video); });
    });
    updateButton();
  };
  const boot = () => { const refresh = () => { setup(); setupHome(); }; refresh(); new MutationObserver(refresh).observe(document.documentElement, {childList:true, subtree:true}); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
