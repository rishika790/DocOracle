// DocMind Enterprise — Global UI Interactions & Animations

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════
     NAV TOGGLE (Mobile)
     ══════════════════════════════════ */
  const navToggle = document.getElementById('nav-toggle');
  const navMenu   = document.querySelector('.navbar-nav');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
    });

    // Close on nav link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    });
  }

  /* ══════════════════════════════════
     ACTIVE NAV LINK
     ══════════════════════════════════ */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === path || (path === '/' && href === '/') || (path.startsWith('/reader') && href.includes('/reader')))) {
      link.classList.add('active');
    }
  });

  /* ══════════════════════════════════
     NAVBAR SCROLL EFFECT
     ══════════════════════════════════ */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        navbar.style.background = 'rgba(6, 13, 26, 0.97)';
        navbar.style.borderBottomColor = 'rgba(6, 182, 212, 0.18)';
      } else {
        navbar.style.background = '';
        navbar.style.borderBottomColor = '';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════
     FADE-UP INTERSECTION OBSERVER
     ══════════════════════════════════ */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ══════════════════════════════════
     ANIMATED METRIC COUNTERS
     ══════════════════════════════════ */
  const metricVals = document.querySelectorAll('.metric-value[data-target]');
  if (metricVals.length) {
    const counterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const dur    = 1600;
            const step   = Math.max(1, Math.floor(target / (dur / 16)));
            let current  = 0;

            const tick = () => {
              current = Math.min(current + step, target);
              el.textContent = current.toLocaleString();
              if (current < target) requestAnimationFrame(tick);
              else el.textContent = target.toLocaleString();
            };

            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    metricVals.forEach(el => counterObserver.observe(el));
  }

  /* ══════════════════════════════════
     ARCHITECTURE NODE STEP ANIMATION
     ══════════════════════════════════ */
  const archNodes = document.querySelectorAll('.arch-node');
  if (archNodes.length) {
    let currentIdx = 0;

    const cycleNodes = () => {
      archNodes.forEach((node, i) => {
        node.classList.remove('arch-node--active');
        if (i === currentIdx) {
          node.classList.add('arch-node--active');
        }
      });
      currentIdx = (currentIdx + 1) % archNodes.length;
    };

    // Initialize first
    archNodes[0]?.classList.add('arch-node--active');
    setInterval(cycleNodes, 1400);
  }

  /* ══════════════════════════════════
     SMOOTH ANCHOR SCROLL
     ══════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 68;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 24;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ══════════════════════════════════
     FEATURE CARD MAGNETIC HOVER
     ══════════════════════════════════ */
  document.querySelectorAll('.feature-card, .step-card, .metric-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 8;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 8;
      card.style.transform = `translateY(-5px) rotateX(${-y * 0.4}deg) rotateY(${x * 0.4}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ══════════════════════════════════
     ARCH PREVIEW CURSOR TYPEWRITER
     ══════════════════════════════════ */
  const cursor = document.querySelector('.arch-cursor');
  if (cursor) {
    const phrases = [
      'Based on the document, the key findings indicate…',
      'The methodology described in section 3 involves…',
      'Three main risks are identified on page 12…',
      'The executive summary concludes that…',
    ];
    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;

    const typeEffect = () => {
      const phrase = phrases[phraseIdx];

      if (!deleting) {
        cursor.dataset.text = phrase.slice(0, ++charIdx);
        cursor.textContent  = cursor.dataset.text;
        if (charIdx === phrase.length) {
          deleting = true;
          setTimeout(typeEffect, 2400);
          return;
        }
      } else {
        cursor.textContent = phrase.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting  = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
      }
      setTimeout(typeEffect, deleting ? 28 : 52);
    };

    setTimeout(typeEffect, 1000);
  }

  /* ══════════════════════════════════
     KEYBOARD SHORTCUT HINTS
     ══════════════════════════════════ */
  // Ctrl+K or Cmd+K → focus question input (on reader page)
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      const qi = document.getElementById('question-input');
      if (qi && !qi.disabled) {
        e.preventDefault();
        qi.focus();
      }
    }
    // Escape → blur / close mobile menu
    if (e.key === 'Escape') {
      document.activeElement?.blur();
      if (navMenu) {
        navMenu.classList.remove('open');
        navToggle?.setAttribute('aria-expanded', 'false');
        if (navToggle) navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      }
    }
  });

  /* ══════════════════════════════════
     GLOBAL ERROR BOUNDARY (unhandled promise rejections)
     ══════════════════════════════════ */
  window.addEventListener('unhandledrejection', event => {
    console.warn('Unhandled promise rejection:', event.reason);
  });

});
