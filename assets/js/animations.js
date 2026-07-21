/* ============================================
   NVR SPORTS - Scroll Reveal & Animations
   ============================================ */

const Animations = {
  init() {
    this.initScrollReveal();
    this.initCountUp();
    this.initParallax();
  },

  initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-stagger, .reveal--left, .reveal--right, .reveal--scale, .reveal--fade');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  },

  initCountUp() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.dataset.counted) {
            entry.target.dataset.counted = 'true';
            const target = parseInt(entry.target.dataset.count, 10);
            Utils.countUp(entry.target, target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  },

  initParallax() {
    const elements = document.querySelectorAll('[data-parallax]');
    if (!elements.length) return;

    window.addEventListener(
      'scroll',
      Utils.throttle(() => {
        const scrollY = window.scrollY;
        elements.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.3;
          const rect = el.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            el.style.transform = `translateY(${scrollY * speed}px)`;
          }
        });
      }, 16)
    );
  },

  // Ripple effect on buttons
  initRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const wave = document.createElement('span');
      wave.classList.add('ripple__wave');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      wave.style.width = wave.style.height = size + 'px';
      wave.style.left = e.clientX - rect.left - size / 2 + 'px';
      wave.style.top = e.clientY - rect.top - size / 2 + 'px';
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 600);
    });
  },
};
