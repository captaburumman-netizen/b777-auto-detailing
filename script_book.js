  (function() {

    // Mobile menu
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

    // Scroll animations
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.aos').forEach(el => io.observe(el));

  })();
