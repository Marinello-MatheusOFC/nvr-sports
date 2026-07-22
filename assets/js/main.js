/* ============================================
   NVR SPORTS - Main Application
   ============================================ */

const App = {
  init() {
    Components.init();
    Animations.init();
    Animations.initRipple();
    this.initCountdown();
    this.initScrollTo();
    this.initLazyImages();
    this.initPasswordToggle();
    this.initPasswordStrength();
    this.initProfileNav();
    this.initEventTabs();
    this.initCategorySelect();

    // Remove loading
    window.addEventListener('load', () => {
      const loader = document.querySelector('.page-loader');
      if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => loader.remove(), 500);
      }
    });
  },

  /* ---- Hero Countdown ---- */
  initCountdown() {
    const countdownEl = document.querySelector('[data-countdown]');
    if (!countdownEl) return;

    const targetDate = countdownEl.dataset.countdown;

    const update = () => {
      const cd = Utils.getCountdown(targetDate);
      const items = countdownEl.querySelectorAll('.counter__number');
      if (items.length >= 4) {
        items[0].textContent = String(cd.days).padStart(2, '0');
        items[1].textContent = String(cd.hours).padStart(2, '0');
        items[2].textContent = String(cd.minutes).padStart(2, '0');
        items[3].textContent = String(cd.seconds).padStart(2, '0');
      }
    };

    update();
    setInterval(update, 1000);
  },

  /* ---- Scroll to anchor ---- */
  initScrollTo() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          e.preventDefault();
          const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;
          const top = target.offsetTop - navHeight - 20;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  },

  /* ---- Lazy load images ---- */
  initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '200px' }
    );

    images.forEach((img) => observer.observe(img));
  },

  /* ---- Password toggle ---- */
  initPasswordToggle() {
    document.querySelectorAll('[data-toggle-password]').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const target = document.querySelector(toggle.dataset.togglePassword);
        if (target) {
          const isPassword = target.type === 'password';
          target.type = isPassword ? 'text' : 'password';
          const icon = toggle.querySelector('i');
          if (icon) {
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
          }
        }
      });
    });
  },

  /* ---- Password Strength ---- */
  initPasswordStrength() {
    const input = document.querySelector('[data-password-strength]');
    if (!input) return;

    input.addEventListener('input', () => {
      const val = input.value;
      const bars = document.querySelectorAll('.password-strength__bar');
      const container = document.querySelector('.password-strength');

      let strength = 0;
      if (val.length >= 6) strength++;
      if (val.length >= 10) strength++;
      if (/[A-Z]/.test(val)) strength++;
      if (/[0-9]/.test(val)) strength++;
      if (/[^A-Za-z0-9]/.test(val)) strength++;

      container.classList.remove('password-strength--medium', 'password-strength--strong');
      if (strength >= 3) container.classList.add('password-strength--medium');
      if (strength >= 5) container.classList.add('password-strength--strong');

      bars.forEach((bar, i) => {
        bar.classList.toggle('active', i < strength);
      });
    });
  },

  /* ---- Profile Sidebar Nav ---- */
  initProfileNav() {
    const links = document.querySelectorAll('.profile-nav__link');
    if (!links.length) return;

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');

        const targetId = link.dataset.section;
        document.querySelectorAll('[data-section-content]').forEach((content) => {
          content.style.display = content.dataset.sectionContent === targetId ? '' : 'none';
        });
      });
    });
  },

  /* ---- Event Detail Tabs ---- */
  initEventTabs() {
    const tabs = document.querySelectorAll('.event-tab');
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.dataset.eventTab;
        document.querySelectorAll('[data-event-tab-content]').forEach((content) => {
          content.style.display = content.dataset.eventTabContent === target ? '' : 'none';
        });
      });
    });
  },

  /* ---- Category Selection ---- */
  initCategorySelect() {
    document.querySelectorAll('.category-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.category-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  },

};

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
