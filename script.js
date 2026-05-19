  (function() {

    // ── Nav scroll effect + floating button ──────────────────
    const nav = document.getElementById('nav');
    const floatBtn = document.getElementById('float-btn');
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 50);
      floatBtn.classList.toggle('visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Mobile menu ───────────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    function closeMenu() {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // ── IntersectionObserver animations ──────────────────────
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.aos').forEach(el => io.observe(el));

    // ── Counter animation ─────────────────────────────────────
    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el     = e.target;
        const end    = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        let cur = 0;
        const step   = end / (1400 / 16);
        const timer  = setInterval(() => {
          cur += step;
          if (cur >= end) { cur = end; clearInterval(timer); }
          el.textContent = Math.floor(cur) + suffix;
        }, 16);
        counterObs.unobserve(el);
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el));

    // ── Before/After drag slider ──────────────────────────────
    document.querySelectorAll('[data-ba]').forEach(card => {
      const after    = card.querySelector('.ba-after');
      const divider  = card.querySelector('.ba-divider');
      const handle   = card.querySelector('.ba-handle');
      const label    = card.querySelector('.ba-label');
      let isDragging = false;

      function setPosition(pct) {
        pct = Math.max(5, Math.min(95, pct));
        const p = pct + '%';
        after.style.clipPath    = `polygon(${p} 0%, 100% 0%, 100% 100%, ${p} 100%)`;
        divider.style.left      = p;
        handle.style.left       = p;
        if (label) label.style.opacity = '0';
      }

      function getPercent(clientX) {
        const rect = card.getBoundingClientRect();
        return ((clientX - rect.left) / rect.width) * 100;
      }

      card.addEventListener('mousedown', (e) => {
        isDragging = true;
        setPosition(getPercent(e.clientX));
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) setPosition(getPercent(e.clientX));
      });
      window.addEventListener('mouseup', () => { isDragging = false; });

      card.addEventListener('touchstart', (e) => {
        isDragging = true;
        setPosition(getPercent(e.touches[0].clientX));
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (isDragging) setPosition(getPercent(e.touches[0].clientX));
      }, { passive: true });
      window.addEventListener('touchend', () => { isDragging = false; });
    });

    // ── Smooth anchor scroll ──────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

  })();
