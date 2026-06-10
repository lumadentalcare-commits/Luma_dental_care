/* LumaCare Dental Clinic — script.js */
(function () {
  'use strict';

  /* ===== NAVBAR SCROLL ===== */
  const navbar = document.getElementById('navbar');
  function handleNavScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* ===== MOBILE MENU ===== */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  function updateAvailability() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const currentTime = hours + minutes / 60;
    const availability = document.getElementById("nextAvailable");

    if (currentTime >= 10 && currentTime < 13) {
        availability.textContent = "Available Now";
    } 
    else if (currentTime >= 13 && currentTime < 16) {
        availability.textContent = "Today, 4:00 PM";
    } 
    else if (currentTime >= 16 && currentTime < 21) {
        availability.textContent = "Available Now";
    } 
    else if (currentTime >= 21) {
        availability.textContent = "Tomorrow, 10:00 AM";
    } 
    else {
        availability.textContent = "Today, 10:00 AM";
    }
}

updateAvailability();
setInterval(updateAvailability, 60000); // Update every minute

  // Close on link click
  navLinks.querySelectorAll('a, button').forEach(el =>
    el.addEventListener('click', () => {
      if (el.tagName === 'BUTTON' && el.classList.contains('nav-cta')) return;
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    })
  );

  // Mobile dropdown toggle
  document.querySelectorAll('.nav-item.has-drop').forEach(item => {
    item.querySelector('.drop-trigger').addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        item.classList.toggle('active');
      }
    });
  });

  /* ===== SCROLL REVEAL ===== */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ===== STAT COUNTERS ===== */
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.count;
      const duration = 1800;
      const start = performance.now();
      const animate = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(eased * target);
        el.textContent = target >= 1000 ? val.toLocaleString() + '+' : val;
        if (p < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(c => counterObs.observe(c));

  /* ===== FOOTER YEAR ===== */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ===== SCROLL TO TOP ===== */
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ===== VIEW MORE SERVICES ===== */
  const viewMoreBtn  = document.getElementById('viewMoreBtn');
  const viewMoreText = document.getElementById('viewMoreText');
  const viewMoreIcon = document.getElementById('viewMoreIcon');
  const hiddenCards  = document.querySelectorAll('.service-hidden');
  let servicesExpanded = false;

  viewMoreBtn.addEventListener('click', () => {
    servicesExpanded = !servicesExpanded;
    hiddenCards.forEach((card, i) => {
      if (servicesExpanded) {
        card.style.display = 'block';
        setTimeout(() => card.classList.add('show'), i * 80);
      } else {
        card.classList.remove('show');
        setTimeout(() => { card.style.display = 'none'; }, 400);
      }
    });
    viewMoreText.textContent = servicesExpanded ? 'View Less' : 'View More Services';
    viewMoreIcon.className   = servicesExpanded ? 'fa-solid fa-minus' : 'fa-solid fa-plus';
  });

  /* ===== DOCTORS MARQUEE ===== */
  (function initDoctorMarquee() {

    const outer = document.querySelector('.doctors-marquee-outer');
    const track = document.getElementById('doctorMarqueeTrack');
    if (!track || !outer) return;

    /* ── 1. Clone original cards for seamless infinite loop ── */
    Array.from(track.children).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    /* ── 2. Hand position control to JS; kill the CSS animation ── */
    track.style.animation = 'none';
    track.style.willChange = 'transform';

    /* ── 3. State ── */
    var SPEED        = 1.2;   // px per frame  ≈ 72 px/s at 60 fps
    var RESUME_DELAY = 800;   // ms before auto-scroll resumes after interaction

    var pos         = 0;      // current translateX offset (px)
    var paused      = false;  // true while user is hovering / has interacted
    var dragging    = false;  // true while pointer or touch is actively held
    var resumeTimer = null;

    /* Mouse drag */
    var mStartX   = 0;
    var mStartPos = 0;

    /* Touch drag */
    var tStartX   = 0;
    var tStartY   = 0;
    var tStartPos = 0;
    var tIsHoriz  = null;  // null = undecided | true = horiz | false = vert

    /* ── 4. Helpers ── */

    function halfWidth() {
      /* track contains original + clone set; half = one full set */
      return track.scrollWidth / 2;
    }

    function wrapPos(raw) {
      var h = halfWidth();
      if (h <= 0) return 0;
      return ((raw % h) + h) % h;
    }

    function paint() {
      track.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    function freeze() {
      paused = true;
      clearTimeout(resumeTimer);
    }

    function scheduleResume(delay) {
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, delay != null ? delay : RESUME_DELAY);
    }

    /* ── 5. RAF animation loop ── */
    function tick() {
      if (!paused && !dragging) {
        pos += SPEED;
        var h = halfWidth();
        if (h > 0 && pos >= h) pos -= h;
        paint();
      }
      requestAnimationFrame(tick);
    }

    /* ── 6. Mouse: hover pause + click-drag ── */

    outer.addEventListener('mouseenter', function () {
      freeze();
    });

    outer.addEventListener('mouseleave', function () {
      if (!dragging) scheduleResume();
    });

    outer.addEventListener('mousedown', function (e) {
      freeze();
      dragging  = true;
      mStartX   = e.clientX;
      mStartPos = pos;
      outer.style.cursor = 'grabbing';
      e.preventDefault(); /* prevent text selection */
    });

    /* Attach to document so drag survives leaving the element */
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      pos = wrapPos(mStartPos + (mStartX - e.clientX));
      paint();
    });

    document.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      outer.style.cursor = '';
      scheduleResume();
    });

    /* ── 7. Touch: swipe drag with direction detection ── */

    outer.addEventListener('touchstart', function (e) {
      freeze();
      tStartX   = e.touches[0].clientX;
      tStartY   = e.touches[0].clientY;
      tStartPos = pos;
      tIsHoriz  = null; /* reset direction lock for each new gesture */
    }, { passive: true });

    outer.addEventListener('touchmove', function (e) {
      var dx = e.touches[0].clientX - tStartX;
      var dy = e.touches[0].clientY - tStartY;

      /* Lock direction on first meaningful movement (>5 px) */
      if (tIsHoriz === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        tIsHoriz = Math.abs(dx) >= Math.abs(dy);
      }

      /* Vertical swipe → let the browser handle page scroll */
      if (!tIsHoriz) return;

      /* Horizontal swipe → we handle it; block page scroll */
      e.preventDefault();
      dragging = true;

      /* Finger moving right (dx > 0) means scroll backward → pos decreases */
      pos = wrapPos(tStartPos - dx);
      paint();
    }, { passive: false }); /* passive:false is required to call preventDefault */

    outer.addEventListener('touchend', function () {
      dragging = false;
      tIsHoriz = null;
      scheduleResume(600);
    });

    outer.addEventListener('touchcancel', function () {
      dragging = false;
      tIsHoriz = null;
      scheduleResume(600);
    });

    /* ── 8. Re-clamp position on resize ── */
    window.addEventListener('resize', function () {
      pos = wrapPos(pos);
    }, { passive: true });

    /* ── 9. Kick off ── */
    requestAnimationFrame(tick);

  })();

  /* ===== WHATSAPP FLOAT ===== */
  const waBtn   = document.getElementById('waBtn');
  const waPopup = document.getElementById('waPopup');
  const waClose = document.getElementById('waClose');

  function openWA()  { waPopup.classList.add('open'); waBtn.setAttribute('aria-expanded', 'true'); }
  function closeWA() { waPopup.classList.remove('open'); waBtn.setAttribute('aria-expanded', 'false'); }

  waBtn.addEventListener('click', () => waPopup.classList.contains('open') ? closeWA() : openWA());
  waClose.addEventListener('click', closeWA);

  document.addEventListener('click', e => {
    if (!waBtn.contains(e.target) && !waPopup.contains(e.target)) closeWA();
  });

  if (!sessionStorage.getItem('wa_seen')) {
    setTimeout(() => { openWA(); sessionStorage.setItem('wa_seen', '1'); }, 5000);
  }

  /* ===== BOOKING MODAL ===== */
  const modalOverlay     = document.getElementById('bookingModal');
  const modalCloseBtn    = document.getElementById('modalClose');
  const modalFormContent = document.getElementById('modalFormContent');
  const modalSuccess     = document.getElementById('modalSuccess');
  const modalDoneBtn     = document.getElementById('modalDoneBtn');
  const modalForm        = document.getElementById('modalForm');

  function openModal() {
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalFormContent.style.display = '';
    modalSuccess.style.display = 'none';
    stopConfetti();
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopConfetti();
  }

  const bookBtns = ['navBookBtn', 'heroBookBtn', 'servicesBookBtn']
    .map(id => document.getElementById(id)).filter(Boolean);
  bookBtns.forEach(btn => btn.addEventListener('click', openModal));

  modalCloseBtn.addEventListener('click', closeModal);
  modalDoneBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const mDateInput = document.getElementById('mDate');
  if (mDateInput) mDateInput.setAttribute('min', new Date().toISOString().split('T')[0]);

  modalForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(modalForm).entries());
    if (!data.mName || !data.mEmail || !data.mPhone || !data.mDept || !data.mDate) {
      shakeForm(modalForm);
      return;
    }
    modalFormContent.style.display = 'none';
    modalSuccess.style.display = '';
    runConfetti();
    modalForm.reset();
  });

  /* ===== APPOINTMENT SECTION FORM ===== */
  const apptForm  = document.getElementById('apptForm');
  const dateInput = document.getElementById('date');
  if (dateInput) dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);

  if (apptForm) {
    apptForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(apptForm).entries());
      if (!data.name || !data.phone || !data.email || !data.service || !data.date || !data.apptTime) {
        shakeForm(apptForm);
        return;
      }
      openModal();
      modalFormContent.style.display = 'none';
      modalSuccess.style.display = '';
      runConfetti();
      apptForm.reset();
    });
  }

  function shakeForm(form) {
    form.style.animation = 'none';
    form.offsetHeight;
    form.style.animation = 'shake .4s ease';
    setTimeout(() => form.style.animation = '', 400);
    form.querySelectorAll('[required]').forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = 'var(--danger)';
        input.addEventListener('input', () => input.style.borderColor = '', { once: true });
      }
    });
  }

  /* ===== FLOATING REVIEW POPUP ===== */
  const reviewPopup   = document.getElementById('review-popup');
  const reviewContent = document.getElementById('review-content');
  const closeReviewBtn = document.getElementById('close-review');

  const reviews = [
    { name: "Arrhat K.",       text: "Dental scaling was painless and smooth. Best clinic!", av: "AK" },
    { name: "Jayalakshmi R.", text: "Fully satisfied, my root canal was painless.",          av: "JL" },
    { name: "Naveen K.",      text: "Implant procedure was flawless. Dr. Emily is amazing!", av: "NK" },
    { name: "Priya S.",       text: "Very professional and hygienic clinic. Highly recommend!", av: "PS" }
  ];

  let currentIndex = 0;

  function updateReview() {
    if (!reviewPopup) return;
    reviewPopup.style.opacity = 0;
    setTimeout(() => {
      const r = reviews[currentIndex];
      reviewContent.innerHTML = `
        <div class="tc-stars">
          <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
        </div>
        <p>"${r.text}"</p>
        <div class="tc-author">
          <div class="tc-av">${r.av}</div>
          <div><strong>${r.name}</strong><br></div>
        </div>
      `;
      reviewPopup.style.opacity = 1;
      currentIndex = (currentIndex + 1) % reviews.length;
    }, 500);
  }

  if (closeReviewBtn) {
    closeReviewBtn.addEventListener('click', () => { reviewPopup.style.display = 'none'; });
  }

  if (reviewPopup) {
    setInterval(updateReview, 5000);
    updateReview();
  }

  /* ===== CONFETTI ===== */
  const canvas = document.getElementById('confettiCanvas');
  const ctx    = canvas ? canvas.getContext('2d') : null;
  let confettiRAF = null;
  let particles   = [];
  let cW = 0, cH = 0;

  function resizeCanvas() {
    if (!canvas) return;
    const box = canvas.parentElement.getBoundingClientRect();
    cW = canvas.width  = box.width;
    cH = canvas.height = box.height;
  }

  function spawnParticles(n = 100) {
    const colors = ['#9C27B0','#E91E63','#F48FB1','#F5A623','#F7C948','#ffffff'];
    particles = Array.from({ length: n }, () => ({
      x:   Math.random() * cW,
      y:  -10 - Math.random() * 50,
      r:   3 + Math.random() * 5,
      c:   colors[Math.floor(Math.random() * colors.length)],
      vx: -1.5 + Math.random() * 3,
      vy:  2 + Math.random() * 3,
      a:   1,
      rot: Math.random() * 360,
      rotV: -2 + Math.random() * 4
    }));
  }

  function drawConfetti() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cW, cH);
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.fillStyle   = p.c;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
      ctx.restore();
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.rotV;
      p.a   -= 0.008;
    });
    particles = particles.filter(p => p.y < cH + 20 && p.a > 0);
  }

  function animateConfetti() {
    drawConfetti();
    if (particles.length) confettiRAF = requestAnimationFrame(animateConfetti);
  }

  function runConfetti() {
    if (!canvas) return;
    resizeCanvas();
    spawnParticles(120);
    cancelAnimationFrame(confettiRAF);
    confettiRAF = requestAnimationFrame(animateConfetti);
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiRAF);
    particles = [];
    if (ctx) ctx.clearRect(0, 0, cW, cH);
  }

  window.addEventListener('resize', resizeCanvas);

  /* ===== SMOOTH ANCHOR LINKS ===== */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();

/* ===== SHAKE KEYFRAME (injected) ===== */
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(style);
})();