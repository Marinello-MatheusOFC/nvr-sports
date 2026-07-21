/* ============================================
   NVR SPORTS - Interactive Components
   ============================================ */

const Components = {
  init() {
    this.initNavbar();
    this.initMobileMenu();
    this.initModals();
    this.initToasts();
    this.initTabs();
    this.initFAQ();
    this.initDropdowns();
    this.initFilters();
    this.initFormValidation();
    this.initMasks();
    this.initCheckboxes();
    this.initCheckout();
  },

  /* ---- Navbar ---- */
  initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', Utils.throttle(handleScroll, 50));
    handleScroll();
  },

  /* ---- Mobile Menu ---- */
  initMobileMenu() {
    const toggle = document.querySelector('.navbar__mobile-toggle');
    const menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    menu.querySelectorAll('.mobile-menu__link').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  },

  /* ---- Modals ---- */
  initModals() {
    // Open modal
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-modal]');
      if (trigger) {
        e.preventDefault();
        const modalId = trigger.dataset.modal;
        this.openModal(modalId);
      }
    });

    // Close modal
    document.addEventListener('click', (e) => {
      if (
        e.target.classList.contains('modal-overlay') ||
        e.target.closest('.modal__close')
      ) {
        const overlay = e.target.closest('.modal-overlay') || e.target.closest('.modal').parentElement;
        if (overlay) this.closeModal(overlay.id);
      }
    });

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) this.closeModal(activeModal.id);
      }
    });
  },

  openModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /* ---- Toasts ---- */
  initToasts() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.classList.add('toast-container');
      document.body.appendChild(container);
    }
  },

  showToast({ type = 'info', title = '', message = '', duration = 4000 }) {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill',
    };

    const toast = document.createElement('div');
    toast.classList.add('toast', `toast--${type}`);
    toast.innerHTML = `
      <div class="toast__icon">
        <i class="bi ${icons[type] || icons.info}"></i>
      </div>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        ${message ? `<div class="toast__message">${message}</div>` : ''}
      </div>
      <button class="toast__close" aria-label="Fechar">
        <i class="bi bi-x"></i>
      </button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentElement) {
          toast.classList.add('removing');
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }
  },

  /* ---- Tabs ---- */
  initTabs() {
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;

      const group = tab.closest('.tabs');
      if (!group) return;

      const targetId = tab.dataset.tab;

      group.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      if (targetId) {
        const container = group.closest('.section, .container, .profile-card, .profile-content');
        if (container) {
          container.querySelectorAll('[data-tab-content]').forEach((content) => {
            content.style.display = content.dataset.tabContent === targetId ? '' : 'none';
          });
        }
      }
    });
  },

  /* ---- FAQ ---- */
  initFAQ() {
    document.querySelectorAll('.faq-item__question').forEach((question) => {
      question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        const isActive = item.classList.contains('active');

        // Close all
        item.closest('.faq-list, .container')
          ?.querySelectorAll('.faq-item')
          .forEach((faq) => faq.classList.remove('active'));

        if (!isActive) item.classList.add('active');
      });
    });
  },

  /* ---- Dropdowns ---- */
  initDropdowns() {
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-dropdown]');
      if (trigger) {
        e.stopPropagation();
        const dropdown = trigger.closest('.dropdown');
        dropdown.classList.toggle('active');
      }
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.active').forEach((d) => {
        d.classList.remove('active');
      });
    });
  },

  /* ---- Filters ---- */
  initFilters() {
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const group = chip.closest('.filter-chips');
        if (!group.hasAttribute('data-multi')) {
          group.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        }
        chip.classList.toggle('active');
      });
    });
  },

  /* ---- Form Validation ---- */
  initFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        let valid = true;

        form.querySelectorAll('[required]').forEach((input) => {
          const group = input.closest('.form-group');
          const errorEl = group?.querySelector('.form-error');

          if (!input.value.trim()) {
            valid = false;
            input.classList.add('form-input--error');
            if (errorEl) errorEl.style.display = 'flex';
          } else {
            input.classList.remove('form-input--error');
            if (errorEl) errorEl.style.display = 'none';
          }

          if (input.type === 'email' && input.value && !Utils.validateEmail(input.value)) {
            valid = false;
            input.classList.add('form-input--error');
            if (errorEl) {
              errorEl.style.display = 'flex';
              errorEl.textContent = 'E-mail inválido';
            }
          }
        });

        if (!valid) e.preventDefault();
      });

      // Live validation
      form.querySelectorAll('[required]').forEach((input) => {
        input.addEventListener('blur', () => {
          const group = input.closest('.form-group');
          const errorEl = group?.querySelector('.form-error');

          if (input.value.trim()) {
            input.classList.remove('form-input--error');
            input.classList.add('form-input--success');
            if (errorEl) errorEl.style.display = 'none';
          }
        });

        input.addEventListener('input', () => {
          input.classList.remove('form-input--error');
        });
      });
    });
  },

  /* ---- Input Masks ---- */
  initMasks() {
    document.querySelectorAll('[data-mask-cpf]').forEach((input) => {
      input.addEventListener('input', () => {
        input.value = Utils.maskCPF(input.value);
      });
    });

    document.querySelectorAll('[data-mask-phone]').forEach((input) => {
      input.addEventListener('input', () => {
        input.value = Utils.maskPhone(input.value);
      });
    });

    document.querySelectorAll('[data-mask-cep]').forEach((input) => {
      input.addEventListener('input', () => {
        input.value = Utils.maskCEP(input.value);
      });
    });
  },

  /* ---- Custom Checkboxes ---- */
  initCheckboxes() {
    document.querySelectorAll('.custom-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('click', () => {
        checkbox.classList.toggle('checked');
        const input = checkbox.querySelector('input[type="checkbox"]');
        if (input) input.checked = checkbox.classList.contains('checked');
      });
    });
  },

  /* ---- Checkout Steps ---- */
  initCheckout() {
    const checkoutEl = document.querySelector('.checkout-steps');
    if (!checkoutEl) return;

    let currentStep = 0;
    const steps = checkoutEl.querySelectorAll('.step');
    const nextBtns = document.querySelectorAll('[data-next-step]');
    const prevBtns = document.querySelectorAll('[data-prev-step]');

    const updateSteps = () => {
      steps.forEach((step, i) => {
        step.classList.remove('active', 'completed');
        if (i < currentStep) step.classList.add('completed');
        if (i === currentStep) step.classList.add('active');
      });

      document.querySelectorAll('[data-step-content]').forEach((content) => {
        content.style.display =
          parseInt(content.dataset.stepContent) === currentStep ? '' : 'none';
      });

      // Update progress bar
      const progress = document.querySelector('.checkout-steps .progress__bar');
      if (progress) {
        progress.style.width = ((currentStep + 1) / steps.length) * 100 + '%';
      }
    };

    nextBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentStep < steps.length - 1) {
          currentStep++;
          updateSteps();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    prevBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--;
          updateSteps();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    updateSteps();
  },
};
