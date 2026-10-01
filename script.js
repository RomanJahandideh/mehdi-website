(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };

  /* ---------- Header: scroll state, progress, active link ---------- */
  const header = $('#siteHeader');
  const progress = $('.scroll-progress span');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    header.classList.toggle('is-scrolled', scrollY > 8);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.site-nav a[href^="#"]');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Mobile menu ---------- */
  const menuToggle = $('#menuToggle');
  const nav = $('#siteNav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.site-header')) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => revealer.observe(el));

  /* ---------- Count-up stats ---------- */
  if (!reduceMotion) {
    $$('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const start = performance.now();
      el.textContent = '0';
      const tick = (now) => {
        const t = Math.min((now - start) / 1100, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 300);
    });
  }

  /* ---------- Hero model viewer ---------- */
  const viewer = $('#viewer');
  const tabs = $$('[role="tab"]', $('.viewer-tabs'));
  const panels = $$('.viewer-panel');
  const captions = ['Clarity, from the first question', 'Structure everyone can read', 'Evidence behind every choice'];
  const indexEl = $('#viewerIndex');
  const captionEl = $('#viewerCaption');
  const bar = $('#viewerProgress');
  const playBtn = $('#viewerPlay');
  const DURATION = 7000;
  let current = 0;
  let playing = !reduceMotion;
  let hovering = false;
  let elapsed = 0;
  let last = performance.now();

  const show = (i, focus = false) => {
    current = (i + panels.length) % panels.length;
    panels.forEach((p, n) => {
      const active = n === current;
      p.hidden = !active;
      p.classList.toggle('is-active', active);
    });
    tabs.forEach((t, n) => {
      t.setAttribute('aria-selected', String(n === current));
      t.tabIndex = n === current ? 0 : -1;
    });
    if (focus) tabs[current].focus();
    indexEl.textContent = String(current + 1).padStart(2, '0');
    captionEl.textContent = captions[current];
    elapsed = 0;
  };

  const setPlaying = (state) => {
    playing = state;
    playBtn.textContent = state ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', state ? 'Pause slideshow' : 'Play slideshow');
    playBtn.setAttribute('aria-pressed', String(!state));
    if (!state) bar.style.transform = 'scaleX(0)';
  };

  const loop = (now) => {
    const dt = now - last;
    last = now;
    if (playing && !hovering && !document.hidden) {
      elapsed += dt;
      if (elapsed >= DURATION) show(current + 1);
      bar.style.transform = `scaleX(${elapsed / DURATION})`;
    }
    requestAnimationFrame(loop);
  };

  tabs.forEach((t, n) => t.addEventListener('click', () => show(n)));
  $('.viewer-tabs').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { show(current + 1, true); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { show(current - 1, true); e.preventDefault(); }
  });
  playBtn.addEventListener('click', () => setPlaying(!playing));
  viewer.addEventListener('mouseenter', () => { hovering = true; });
  viewer.addEventListener('mouseleave', () => { hovering = false; });
  viewer.addEventListener('focusin', () => { hovering = true; });
  viewer.addEventListener('focusout', () => { hovering = false; });

  // Swipe on touch devices
  let touchX = null;
  viewer.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  setPlaying(playing);
  show(0);
  requestAnimationFrame(loop);

  /* ---------- Expertise accordion ---------- */
  $$('.expertise-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.expertise-row');
      const open = !row.classList.contains('is-open');
      row.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Process stepper ---------- */
  const steps = [
    {
      title: 'Understand the real need',
      body: 'Stakeholder interviews, UX research and personas to gather functional and non-functional requirements, and to separate what people ask for from what they actually need.',
      out: ['Stakeholder & requirements list', 'Product personas', 'Product vision'],
    },
    {
      title: 'Make the system visible',
      body: 'Model how work flows and how the system behaves: BPMN 2.0 for business processes, UML 2.0 for behavior and structure, ERDs for data, and event storming to find the business domains.',
      out: ['As-is & to-be BPMN models', 'UML use case, activity & class diagrams', 'ERD data model'],
    },
    {
      title: 'Write it down so it can be built',
      body: 'Turn models into documentation developers can work from: SRS documents, use case specifications, user stories and a story map that orders the backlog by value, plus wireframes to make it concrete.',
      out: ['SRS & use case specifications', 'User stories & story map', 'Low- to high-fidelity wireframes'],
    },
    {
      title: 'Prove it does what it should',
      body: 'Close the loop with BDD-style acceptance criteria, test scenarios and test cases, and review sessions with design and development teams so requirements stay clear through delivery.',
      out: ['Acceptance criteria (Given / When / Then)', 'Test scenarios & test cases', 'Requirements review with the team'],
    },
  ];
  const stepBtns = $$('.process-steps button');
  const psPanel = $('#ps-panel');
  const setStep = (i, focus = false) => {
    const s = steps[i];
    stepBtns.forEach((b, n) => {
      b.setAttribute('aria-selected', String(n === i));
      b.tabIndex = n === i ? 0 : -1;
    });
    if (focus) stepBtns[i].focus();
    $('#psTitle').textContent = s.title;
    $('#psBody').textContent = s.body;
    const list = $('#psOut');
    list.replaceChildren(...s.out.map((t) => Object.assign(document.createElement('li'), { textContent: t })));
    psPanel.classList.remove('is-changing');
    void psPanel.offsetWidth;
    psPanel.classList.add('is-changing');
  };
  stepBtns.forEach((b, n) => b.addEventListener('click', () => setStep(n)));
  $('.process-steps').addEventListener('keydown', (e) => {
    const i = stepBtns.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight') { setStep((i + 1) % steps.length, true); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { setStep((i - 1 + steps.length) % steps.length, true); e.preventDefault(); }
  });

  /* ---------- Filters ---------- */
  const activate = (btns, btn) => btns.forEach((b) => {
    const on = b === btn;
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', String(on));
  });

  const expBtns = $$('[data-filter]');
  const items = $$('.timeline-item');
  expBtns.forEach((btn) => btn.addEventListener('click', () => {
    activate(expBtns, btn);
    const f = btn.dataset.filter;
    items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.type !== f));
  }));

  const toolBtns = $$('[data-tool]');
  const tools = $$('#toolGrid li');
  toolBtns.forEach((btn) => btn.addEventListener('click', () => {
    activate(toolBtns, btn);
    const f = btn.dataset.tool;
    tools.forEach((t) => t.classList.toggle('is-dim', f !== 'all' && t.dataset.cat !== f));
  }));

  /* ---------- Copy to clipboard ---------- */
  $$('.copy-btn').forEach((btn) => btn.addEventListener('click', async () => {
    const value = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = Object.assign(document.createElement('textarea'), { value });
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    btn.textContent = 'Copied';
    showToast(`Copied ${value}`);
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  }));

  /* ---------- Contact form to email (FormSubmit, mailto fallback) ---------- */
  const RECIPIENT = 'mehdivahabisani@gmail.com';
  const ENDPOINT = `https://formsubmit.co/ajax/${RECIPIENT}`;
  const form = $('#contactForm');
  const errorEl = $('#formError');
  const fields = form.elements;
  const submitBtn = $('#formSubmit');
  const submitLabel = submitBtn.innerHTML;
  const success = $('#formSuccess');
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const mailtoFallback = ({ topic, name, email, company, message }) => {
    const subject = `${topic} — from ${name}${company ? ` (${company})` : ''}`;
    const body = `Hi Mehdi,\n\n${message}\n\nBest,\n${name}${company ? `\n${company}` : ''}\n${email}`;
    window.location.href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const entry = {
      topic: data.get('topic'),
      name: data.get('name').trim(),
      email: data.get('email').trim(),
      company: data.get('company').trim(),
      message: data.get('message').trim(),
    };

    const invalid = {
      name: !entry.name,
      email: !emailOk(entry.email),
      message: !entry.message,
    };
    Object.entries(invalid).forEach(([k, bad]) => fields[k].classList.toggle('is-invalid', bad));
    const firstBad = Object.keys(invalid).find((k) => invalid[k]);
    if (firstBad) {
      errorEl.textContent = invalid.email && entry.email
        ? 'Please enter a valid email address so Mehdi can reply.'
        : 'Please add your name, email and a short message.';
      fields[firstBad].focus();
      return;
    }
    if (data.get('_honey')) return; // bot
    errorEl.textContent = '';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Portfolio enquiry: ${entry.topic} — ${entry.name}`,
          _replyto: entry.email,
          _template: 'table',
          _captcha: 'false',
          Topic: entry.topic,
          Name: entry.name,
          Email: entry.email,
          Company: entry.company || '—',
          Message: entry.message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.statusText);
      form.reset();
      form.classList.add('is-sent');
      success.hidden = false;
      success.focus();
    } catch (err) {
      console.warn('Form service failed, falling back to email app:', err);
      errorEl.textContent = 'Couldn’t send automatically, so your email app is opening with the message ready to send instead.';
      mailtoFallback(entry);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
    }
  });
  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
  $('#formReset').addEventListener('click', () => {
    form.classList.remove('is-sent');
    success.hidden = true;
    fields.name.focus();
  });

  $('#year').textContent = new Date().getFullYear();
})();
