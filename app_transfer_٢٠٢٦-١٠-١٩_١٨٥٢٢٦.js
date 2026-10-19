(function () {
  'use strict';
  const RAW = window.T2_I18N, EXTRA = window.T2_EXTRA || {};
  const PACKS = {};
  Object.keys(RAW.PACKS).forEach(k => { PACKS[k] = Object.assign({}, RAW.PACKS[k], EXTRA[k] || {}); });
  const COUNTRIES = RAW.COUNTRIES;
  const WA_DEFAULT = '201090960743';
  const fullPhone = () => '+' + (country && CC[country] ? CC[country] : '') + document.getElementById('phone').value.replace(/\D/g, '');
  const WA_BY = { SA: '', AE: '' };               // per-country numbers (digits, intl). Empty = default.
  const FLAGS = { SA:'🇸🇦',EG:'🇪🇬',AE:'🇦🇪',KW:'🇰🇼',QA:'🇶🇦',BH:'🇧🇭',OM:'🇴🇲',JO:'🇯🇴',LB:'🇱🇧',SY:'🇸🇾',PS:'🇵🇸',IQ:'🇮🇶',YE:'🇾🇪',MA:'🇲🇦',DZ:'🇩🇿',TN:'🇹🇳',LY:'🇱🇾',SD:'🇸🇩',OTHER:'🌍' };
  const SVC = ['smm','web','ai','ads','pages'];
  const PLAT = { SA: 'سلة · زد · سناب شات · تيك توك', EG: 'ميتا · تيك توك · شوبيفاي', AE: 'ميتا · تيك توك · شوبيفاي · سناب شات', KW: 'سناب شات · إنستقرام · تيك توك', QA: 'ميتا · سناب شات · تيك توك', BH: 'ميتا · إنستقرام · سناب شات' };
  const CC = { SA: '966', EG: '20', AE: '971', KW: '965', QA: '974', BH: '973', OM: '968', JO: '962', LB: '961', SY: '963', PS: '970', IQ: '964', YE: '967', MA: '212', DZ: '213', TN: '216', LY: '218', SD: '249' };
  const GATE_CODES = ['SA','EG','AE','KW','QA','BH','OM','JO','IQ','MA','OTHER'];
  const VIDS = 3;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = { get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set(k,v){ try { localStorage.setItem(k,v); } catch (e) {} },
                  del(k){ try { localStorage.removeItem(k); } catch (e) {} } };

  // ----- state -----
  let lang = 'ar';
  let country = null;
  let theme = store.get('t2_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (!COUNTRIES.some(c => c.c === country)) country = null;
  let sel = [];                                    // selections live in memory only: cleared on reload and after sending

  const S = () => {
    if (lang === 'en') return PACKS.EN;
    const c = COUNTRIES.find(x => x.c === country);
    return PACKS[c ? c.pack : 'MSA'] || PACKS.MSA;
  };
  const cName = code => { const c = COUNTRIES.find(x => x.c === code); return c ? (lang === 'en' ? c.en : c.ar) : ''; };
  const waNum = () => (country && WA_BY[country]) || WA_DEFAULT;
  const label = id => {
    const s = S();
    if (id[0] === 'c') return s['s' + (Number(id.slice(1)) + 1) + '_t'];
    const [g, i] = id.slice(1).split('_').map(Number);
    return s.groups[g].i[i];
  };
  const setMeta = (name, val, attr) => {
    attr = attr || 'name';
    let m = document.querySelector(`meta[${attr}="${name}"]`);
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.appendChild(m); }
    m.setAttribute('content', val);
  };

  // ----- apply everything (language + dialect) -----
  function apply() {
    const s = S(), html = document.documentElement;
    html.lang = lang === 'en' ? 'en' : 'ar';
    html.dir = lang === 'en' ? 'ltr' : 'rtl';
    html.dataset.country = country || '';
    document.title = s.seo_title;
    setMeta('description', s.seo_desc);
    setMeta('og:title', s.seo_title, 'property');
    setMeta('og:description', s.seo_desc, 'property');
    setMeta('og:locale', lang === 'en' ? 'en_US' : 'ar', 'property');
    $$('[data-i]').forEach(el => { const v = s[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
    $$('option[data-i]').forEach(el => { el.textContent = s[el.dataset.i]; });
    const ov = (lang !== 'en' && country && window.T2_HERO && window.T2_HERO[country]) || null;
    if (ov) Object.keys(ov).forEach(k => { const el = document.querySelector('[data-i="' + k + '"]'); if (el) el.textContent = ov[k]; });
    const plat = (lang !== 'en' && country && PLAT[country]) || '';
    const pel = $('#platforms'); pel.textContent = plat; pel.hidden = !plat;
    $('#cc-show').textContent = '+' + (country && CC[country] ? CC[country] : '');
    $('#lang-btn').textContent = s.btn_lang;
    $('#theme-btn').textContent = theme === 'dark' ? '☀' : '☾';
    $('#theme-btn').setAttribute('aria-label', theme === 'dark' ? s.theme_off : s.theme_on);
    $('#theme-btn').setAttribute('aria-pressed', String(theme === 'dark'));
    $('#wa-footer').href = 'https://wa.me/' + waNum();
    $('#video-close').setAttribute('aria-label', s.close);
    $('#order-go').textContent = s.order_go;
    $$('[data-svc-title]').forEach(el => { el.textContent = s.svc_names[+el.dataset.svcTitle]; });
    $$('.vcard.soon .tag').forEach(el => { el.textContent = s.portfolio_soon; });
    $('#cdd-label').textContent = country ? cName(country) : s.country_pick;
    $('#cdd-flag').textContent = country ? FLAGS[country] : '🌍';
    $('#cdd-btn').classList.toggle('pulse', !country);
    renderCountryList();
    renderCore();
    renderGroups();
    renderSummary();
    renderProgress();
    paintChecks();
    applyBg();
    renderFormLabels();
  }

  function renderCountryList() {
    $('#cdd-list').innerHTML = COUNTRIES.map(c => `
      <li role="option" data-code="${c.c}" aria-selected="${c.c === country}">
        <span class="flag">${FLAGS[c.c] || '🌍'}</span><span>${lang === 'en' ? c.en : c.ar}</span></li>`).join('');
  }
  function renderCore() {
    const s = S();
    $('#core-list').innerHTML = [0,1,2,3,4].map(i => {
      const id = 'c' + i, on = sel.includes(id);
      return `<li class="pick tilt ${on ? 'on' : ''}" data-id="${id}">
        <label><input class="sr" type="checkbox" data-sel="${id}" ${on ? 'checked' : ''}>
          <img class="ico" alt="" data-ico="${i}"><span class="pick-num">0${i + 1}</span>
          <span class="pick-body"><h3>${s['s' + (i + 1) + '_t']}</h3><p>${s['s' + (i + 1) + '_d']}</p></span>
          <span class="tick" aria-hidden="true">✓</span></label></li>`;
    }).join('');
    bindTilt($$('#core-list .tilt'));
    loadIcons();
  }
  function renderGroups() {
    const s = S();
    $('#groups').innerHTML = s.groups.map((g, gi) => `
      <div class="group glass tilt"><h3>${g.t}</h3><ul class="chk">
        ${g.i.map((item, ii) => { const id = 'g' + gi + '_' + ii, on = sel.includes(id);
          return `<li><label class="chk-row ripple ${on ? 'on' : ''}"><input class="sr" type="checkbox" data-sel="${id}" ${on ? 'checked' : ''}>
          <span class="box" aria-hidden="true">✓</span><span>${item}</span></label></li>`; }).join('')}
      </ul></div>`).join('');
    bindTilt($$('#groups .tilt'));
  }
  function paintChecks() {
    $$('input[data-sel]').forEach(cb => {
      const on = sel.includes(cb.dataset.sel);
      cb.checked = on;
      const row = cb.closest('.pick, .chk-row');
      if (row) row.classList.toggle('on', on);
    });
  }
  function renderSummary() {
    const s = S();
    $('#sel-box').innerHTML = sel.length
      ? `<p class="t">${s.f_selected} (${sel.length})</p><ul>${sel.map(id => `<li>${label(id)}</li>`).join('')}</ul>`
      : `<p class="t">${s.f_selected}</p><p class="empty">${s.f_none}</p>`;
    const bar = $('#order-bar');
    bar.hidden = sel.length === 0;
    $('#order-count').textContent = `${sel.length} ${s.order_count}`;
  }

  // ----- selection -----
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches && t.matches('input[data-sel]')) {
      const id = t.dataset.sel;
      sel = t.checked ? [...sel.filter(x => x !== id), id] : sel.filter(x => x !== id);
      paintChecks(); renderSummary(); renderProgress();
    }
  });
  $('#sel-box').addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    const idx = Array.from(li.parentNode.children).indexOf(li);
    sel.splice(idx, 1); apply();
  });

  // ----- portfolio (built once; lazy videos) -----
  function buildPortfolio() {
    $('#pf-wrap').innerHTML = SVC.map((id, idx) => `
      <div class="pf"><h3 data-svc-title="${idx}"></h3><div class="videos">
        ${Array.from({ length: VIDS }, (_, n) => `
          <button class="vcard skel" type="button" data-src="videos/${id}/${n + 1}.mp4">
            <video muted playsinline preload="none" data-src="videos/${id}/${n + 1}.mp4"></video>
            <span class="play"><span class="btnp">▶</span></span><span class="tag">${n + 1}</span>
          </button>`).join('')}
      </div></div>`).join('');
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const v = en.target; v.src = v.dataset.src; v.preload = 'metadata'; obs.unobserve(v);
      });
    }, { rootMargin: '200px' }) : null;
    $$('#pf-wrap .vcard').forEach(card => {
      const v = card.querySelector('video');
      v.addEventListener('loadeddata', () => card.classList.remove('skel'));
      v.addEventListener('error', () => { card.classList.remove('skel'); card.classList.add('soon'); v.remove(); const tg = card.querySelector('.tag'); tg.textContent = S().portfolio_soon; });
      card.addEventListener('click', () => openVideo(card));
      if (io) io.observe(v); else v.src = v.dataset.src;
    });
  }
  function openVideo(card) {
    const p = $('#video-player'), msg = $('#video-msg');
    msg.hidden = true;
    p.onerror = () => { msg.textContent = S().portfolio_soon; msg.hidden = false; };
    p.src = card.dataset.src; $('#video-modal').hidden = false; p.play().catch(() => {});
  }
  function closeVideo() { const p = $('#video-player'); p.pause(); p.removeAttribute('src'); p.load(); $('#video-modal').hidden = true; }
  $('#video-close').addEventListener('click', closeVideo);
  $('#video-modal').addEventListener('click', e => { if (e.target.id === 'video-modal') closeVideo(); });

  // ----- country assets (optional; missing files are skipped, never break the page) -----
  const ICON_MAP = [4, 1, 5, 6, 3];   // which sticker is the icon of each core service row
  function probe(src, ok) { const im = new Image(); im.onload = () => ok(true); im.onerror = () => ok(false); im.src = src; }
  function findAsset(base, name, cb) {
    const map = { background: 'bg', 'hero-character': 'char' };
    const file = map[name] || (name.indexOf('sticker-') === 0 ? 's' + parseInt(name.slice(8), 10) : name);
    const cands = ['webp', 'png', 'jpg'].map(e => base + file + '.' + e);
    (function next(i) { if (i >= cands.length) return cb(null); probe(cands[i], ok => (ok ? cb(cands[i]) : next(i + 1))); })(0);
  }
  function assetBase() { return country ? 'assets/' + country.toLowerCase() + '/' : null; }
  function applyBg() {
    const bg = $('#country-bg'), base = assetBase();
    if (!base) { bg.style.removeProperty('--bg-img'); buildDecor(null); loadIcons(); return; }
    findAsset(base, 'background', src => bg.style.setProperty('--bg-img', src ? `url("${src}")` : 'none'));
    buildDecor(base);
    loadIcons();
  }
  function buildDecor(base) {
    const wrap = $('.decor');
    wrap.innerHTML = '<img class="d1" alt=""><img class="d2" alt=""><img class="d3" alt="">';
    const c = $('#char');
    const figs = { f1: 'sticker-01', f3: 'sticker-03', f6: 'sticker-06' };
    if (!base) { c.removeAttribute('src'); $$('.fig').forEach(f => f.removeAttribute('src')); return; }
    [['d1', 'sticker-02'], ['d2', 'sticker-04'], ['d3', 'sticker-05']].forEach(([cls, nm]) =>
      findAsset(base, nm, src => { if (src) wrap.querySelector('.' + cls).src = src; }));
    Object.keys(figs).forEach(cls => findAsset(base, figs[cls], src => { const el = $('.fig.' + cls); if (src) el.src = src; else el.removeAttribute('src'); }));
    findAsset(base, 'hero-character', src => { if (src) c.src = src; else c.removeAttribute('src'); });
  }
  function loadIcons() {
    const base = assetBase();
    $$('#core-list img.ico').forEach(im => {
      im.removeAttribute('src');
      if (!base) return;
      findAsset(base, 'sticker-0' + ICON_MAP[+im.dataset.ico], src => { if (src) im.src = src; });
    });
  }

  // ----- form: validation, progress, autosave -----
  const F = { pkg: $('#pkg'), name: $('#name'), biz: $('#biz'), phone: $('#phone'), notes: $('#notes') };
  function nameOk() { return F.name.value.trim().length >= 2; }
  function phoneOk() { return F.phone.value.replace(/\D/g, '').length >= 8; }
  function setErr(input, errEl, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    errEl.textContent = msg || '';
  }
  function validate(which) {
    const s = S();
    if (which !== 'phone') setErr(F.name, $('#name-err'), F.name.value.length && !nameOk() ? s.val_name : '');
    if (which !== 'name') setErr(F.phone, $('#phone-err'), F.phone.value.length && !phoneOk() ? s.val_phone : '');
  }
  function renderProgress() {
    const steps = [true, nameOk(), phoneOk(), sel.length > 0];
    const pct = Math.round(steps.filter(Boolean).length / steps.length * 100);
    $('#progress-bar').style.width = pct + '%';
    $('#progress-val').textContent = pct + '%';
    $('#progress-track').setAttribute('aria-valuenow', String(pct));
  }
  function renderFormLabels() { renderProgress(); }
  Object.values(F).forEach(el => {
    el.addEventListener('input', () => { save(); validate(el === F.phone ? 'phone' : el === F.name ? 'name' : ''); renderProgress(); });
    el.addEventListener('blur', () => validate(''));
  });
  function save() {}
  function restore() {
    let d = null; try { d = JSON.parse(store.get('t2_form') || 'null'); } catch (e) {}
    if (!d) return false;
    F.pkg.value = d.pkg || 'basic'; F.name.value = d.name || ''; F.biz.value = d.biz || ''; F.phone.value = d.phone || ''; F.notes.value = d.notes || '';
    return !!(d.name || d.phone || d.biz || d.notes);
  }

  // ----- WhatsApp message -----
  function buildMessage() {
    const s = S();
    const date = new Date().toLocaleString(lang === 'en' ? 'en-GB' : 'ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
    const pkgText = F.pkg.options[F.pkg.selectedIndex].textContent;
    const core = sel.filter(id => id[0] === 'c').map((id, i) => '  ' + (i + 1) + '. ' + label(id));
    const det = sel.filter(id => id[0] === 'g').map((id, i) => '  ' + (i + 1) + '. ' + label(id));
    return [
      '╔══════════════════════════╗',
      '   *T2 DIGITAL MARKETING AGENCY*',
      '        *' + s.wa_title + '*',
      '╚══════════════════════════╝', '',
      '┌─── 👤 *' + s.wa_client + '* ───┐',
      '  • *' + s.wa_name + ':* ' + F.name.value.trim(),
      '  • *' + s.wa_biz + ':* ' + (F.biz.value.trim() || '-'),
      '  • *' + s.wa_phone + ':* ' + fullPhone(),
      '  • *' + s.wa_country + ':* ' + (country ? FLAGS[country] + ' ' + cName(country) : '-'),
      '  • *' + s.wa_date + ':* ' + date,
      '└────────────────────┘', '', '///===================///', '',
      '┌─── 📦 *' + s.wa_package + '* ───┐', '  💎 *' + pkgText + '*', '└────────────────────┘', '', '///===================///', '',
      '┌─── 🚀 *' + s.wa_services + ' (' + sel.length + ')* ───┐',
      ...(core.length ? ['  📌 *' + (s.wa_svc_core || 'الخدمات الأساسية') + ':*', ...core] : []),
      ...(det.length ? ['  ✨ *' + (s.wa_svc_detail || 'الخدمات التفصيلية') + ':*', ...det] : []),
      '└────────────────────┘', '', '///===================///', '',
      '┌─── 📝 *' + s.wa_notes + '* ───┐', '  ' + (F.notes.value.trim() || '-'), '└────────────────────┘', '',
      '══════════════════════════',
      '✅ *' + (s.wa_footer || 'تم الإرسال عبر المنصة التفاعلية لـ T2') + '*'
    ].join('\n');
  }

  // ----- submit -----
  $('#quote-form').addEventListener('submit', e => {
    e.preventDefault();
    const s = S();
    validate('');
    if (!nameOk() || !phoneOk()) {
      toast(!nameOk() ? s.val_name : s.val_phone, 'err');
      (!nameOk() ? F.name : F.phone).focus();
      return;
    }
    if (!sel.length) { toast(s.f_err_svc, 'err'); $('#sel-box').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    window.open('https://wa.me/' + waNum() + '?text=' + encodeURIComponent(buildMessage()), '_blank', 'noopener');
    setTimeout(() => location.reload(), 900);   // full reset: new session, the gate shows again
    toast(s.toast_sent, 'ok');
    // reset after a successful send
    sel = [];
    F.name.value = ''; F.biz.value = ''; F.phone.value = ''; F.notes.value = ''; F.pkg.value = 'basic';

    apply();
    $$('input[data-sel]').forEach(cb => { cb.checked = false; });
  });

  // ----- toasts -----
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'err' ? ' err' : '');
    el.setAttribute('role', type === 'err' ? 'alert' : 'status');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(() => el.remove(), 4000);
  }

  // ----- country dropdown (no overlay) -----
  const cdd = $('#cdd'), cddBtn = $('#cdd-btn'), cddList = $('#cdd-list');
  let active = -1;
  function openDD() { cdd.classList.add('open'); cddBtn.setAttribute('aria-expanded', 'true'); active = Math.max(0, COUNTRIES.findIndex(c => c.c === country)); hl(); }
  function closeDD() { cdd.classList.remove('open'); cddBtn.setAttribute('aria-expanded', 'false'); }
  function hl() { const items = $$('li', cddList); items.forEach((li, i) => li.classList.toggle('active', i === active)); if (items[active]) cddList.scrollTop = items[active].offsetTop - 60; }
  function choose(code) { country = code; closeDD(); apply(); cddBtn.focus({ preventScroll: true }); }
  cddBtn.addEventListener('click', () => cdd.classList.contains('open') ? closeDD() : openDD());
  cddList.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(li.dataset.code); });
  cddBtn.addEventListener('keydown', e => {
    if (e.key === 'Escape') return closeDD();
    if (!['ArrowDown','ArrowUp','Enter',' '].includes(e.key)) return;
    e.preventDefault();
    if (!cdd.classList.contains('open')) return openDD();
    if (e.key === 'ArrowDown') { active = (active + 1) % COUNTRIES.length; hl(); }
    else if (e.key === 'ArrowUp') { active = (active - 1 + COUNTRIES.length) % COUNTRIES.length; hl(); }
    else choose(COUNTRIES[active].c);
  });
  document.addEventListener('pointerdown', e => { if (!cdd.contains(e.target)) closeDD(); });

  // ----- language + theme -----
  $('#lang-btn').addEventListener('click', () => { lang = lang === 'ar' ? 'en' : 'ar'; apply(); });
  $('#theme-btn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme; store.set('t2_theme', theme); apply();
  });

  // ----- mobile menu -----
  const nav = $('#nav'), menuBtn = $('#menu-btn');
  menuBtn.addEventListener('click', () => { const o = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(o)); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

  // ----- 3D tilt on hover (fine pointers only) -----
  function bindTilt(els) {
    if (reduce || matchMedia('(hover: none)').matches) return;
    els.forEach(el => {
      if (el.dataset.t) return; el.dataset.t = '1';
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateZ(14px)`;
        el.style.boxShadow = '0 30px 50px -20px var(--shadow)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; el.style.boxShadow = ''; });
    });
  }

  // ----- ripple -----
  document.addEventListener('pointerdown', e => {
    const host = e.target.closest('.ripple'); if (!host || reduce) return;
    const r = host.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.6, s = document.createElement('span');
    s.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.35);width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px;transform:scale(0);animation:rip .6s ease-out forwards`;
    host.style.position = host.style.position || 'relative'; host.style.overflow = 'hidden';
    host.appendChild(s); setTimeout(() => s.remove(), 650);
  });
  const ripStyle = document.createElement('style');
  ripStyle.textContent = '@keyframes rip{to{transform:scale(1);opacity:0}}';
  document.head.appendChild(ripStyle);

  // ----- logo 3D follows pointer; scroll effects -----
  const hero = $('#top'), heroLogo = $('#hero-logo');
  if (!reduce && matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = heroLogo.getBoundingClientRect();
      heroLogo.style.setProperty('--ry', ((e.clientX - r.left - r.width / 2) / r.width * 26).toFixed(2));
      heroLogo.style.setProperty('--rx', (-(e.clientY - r.top - r.height / 2) / r.height * 18).toFixed(2));
    });
    hero.addEventListener('pointerleave', () => { heroLogo.style.setProperty('--ry', 0); heroLogo.style.setProperty('--rx', 0); });
  }
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    $('#header').classList.toggle('scrolled', y > 8);
    if (!ticking && !reduce) {
      ticking = true;
      requestAnimationFrame(() => {
        $$('.decor img').forEach(im => { const sp = parseFloat(im.dataset.speed || 0) || 0.08; im.style.transform = `translate3d(0,${y * sp}px,0)`; });
        ticking = false;
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // reveal on scroll
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } }), { threshold: .12 });
    $$('.reveal').forEach(el => ro.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  // ----- country gate: shown on every load, nothing is remembered -----
  function buildGate() {
    const list = COUNTRIES.filter(c => GATE_CODES.indexOf(c.c) >= 0);
    const n = list.length;
    $('#wheel').innerHTML = list.map((c, i) => '<div class="w-item" style="transform: rotateY(' + (i * 360 / n) + 'deg) translateZ(var(--R))">' + FLAGS[c.c] + '</div>').join('');
    $('#gate-grid').innerHTML = list.map(c => '<button type="button" class="gate-btn" data-code="' + c.c + '"><span class="gf">' + FLAGS[c.c] + '</span><span>' + c.ar + '</span></button>').join('');
  }
  function openGate() { buildGate(); $('#country-gate').hidden = false; document.body.classList.add('gated'); }
  function closeGate() { $('#country-gate').hidden = true; document.body.classList.remove('gated'); }
  function pickFromGate(code) {
    const w = $('#wheel');
    w.classList.add('spin');
    setTimeout(() => { country = code; w.classList.remove('spin'); closeGate(); apply(); }, 700);
  }
  $('#gate-grid').addEventListener('click', e => { const b = e.target.closest('[data-code]'); if (b) pickFromGate(b.dataset.code); });
  $('#gate-en').addEventListener('click', () => { lang = 'en'; country = null; closeGate(); apply(); });
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });

  // ----- init -----
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  document.documentElement.dataset.theme = theme;
  buildPortfolio();
  apply();
  openGate();

})();
