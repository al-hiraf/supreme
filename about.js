/* =====================================================================
   about.js — الصفحة التعريفية العامة للشركة
   - تقرأ settings/public وصور publicMedia من Firestore بدون تسجيل دخول
   - نموذج «طلب عرض سعر» يكتب في leads (القواعد تسمح بالإنشاء فقط وبحقول محددة)
   - كل النصوص تُدرج بـ textContent، فلا مجال لحقن HTML
   - ‎?preview يعرض الصفحة قبل نشرها (للمعاينة من داخل النظام)
   ===================================================================== */
(async function () {
  'use strict';
  const FB_VER = '12.18.0';
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const icon = (id, cls = 'i') => { const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', cls); const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#' + id); s.appendChild(u); return s; };
  const digits = (s) => String(s || '').replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  const preview = new URLSearchParams(location.search).has('preview');
  const B = window.BRAND || {}, BM = B.media || {}; // هوية هذه النسخة والصور الثابتة (brand.js)
  const soon = () => { $('page').hidden = true; $('footer').hidden = true; $('top').hidden = true; $('soon').hidden = false; };

  // الشريط العلوي يصبح داكناً بعد النزول
  const top = $('top');
  const onScroll = () => top.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const cfg = window.HIRAF_FIREBASE;
  if (!cfg || !cfg.apiKey || String(cfg.apiKey).startsWith('ضع')) { soon(); return; }
  let fs, db, p;
  try {
    const base = `https://www.gstatic.com/firebasejs/${FB_VER}`;
    const [app, f] = await Promise.all([import(`${base}/firebase-app.js`), import(`${base}/firebase-firestore.js`)]);
    fs = f; db = fs.getFirestore(app.initializeApp(cfg));
    const snap = await fs.getDoc(fs.doc(db, 'settings', 'public'));
    p = snap.exists() ? snap.data() : null;
  } catch (e) { console.warn(e); soon(); return; }
  if (!p || (!p.published && !preview)) { soon(); return; }
  if (!p.published) $('previewBar').hidden = false;
  const media = async (id) => { try { const s = await fs.getDoc(fs.doc(db, 'publicMedia', id)); const d = s.exists() && s.data().data; return typeof d === 'string' && /^data:image\/(jpeg|webp);base64,/.test(d) ? d : null; } catch { return null; } };

  const legal = p.companyName || B.legal || 'الحرف المتكاملة للمقاولات';
  const name = B.display || legal;
  document.title = p.tagline ? `${name} — ${p.tagline}` : name;
  $('brandName').textContent = name; $('footName').textContent = name; $('tbName').textContent = name;
  $('eyebrow').textContent = [B.eyebrow || 'مقاولات', p.city].filter(Boolean).join(' · ');

  // العنوان: الجزء بعد آخر فاصلة يُبرز باللون البرتقالي
  const tag = p.tagline || name, h1 = $('tagline');
  const cut = Math.max(tag.lastIndexOf('،'), tag.lastIndexOf('—'));
  if (cut > 0 && cut < tag.length - 2) { h1.append(tag.slice(0, cut + 1) + ' '); h1.append(el('em', null, tag.slice(cut + 1).trim())); } else h1.textContent = tag;
  const aboutParas = String(p.about || '').split('\n').map((s) => s.trim()).filter(Boolean);
  $('lead').textContent = p.lead || aboutParas[0] || '';

  const wa = p.whatsapp ? `https://wa.me/${encodeURIComponent(p.whatsapp)}` : '';
  if (wa) {
    const a = el('a', 'btn btn-ghost'); a.href = wa; a.target = '_blank'; a.rel = 'noopener'; a.append(icon('i-wa'), 'واتساب'); $('ctas').append(a);
    const f = $('waFloat'); f.href = wa; f.hidden = false;
  }

  /* ---------- الصورة الرئيسية أو مخطط الواجهة المرسوم ---------- */
  const visual = $('visual');
  const heroImg = (p.heroMedia ? await media('hero') : null) || BM.hero || null;
  if (heroImg) { const h = document.querySelector('.hero'); h.classList.add('photo'); h.style.backgroundImage = `url("${heroImg}")`; }
  else visual.append(drawElevation());

  /* ---------- الأرقام (تظهر فقط الأرقام التي أدخلتها المنشأة) ---------- */
  const stats = (Array.isArray(p.stats) ? p.stats : []).filter((s) => s && s.n && s.label).slice(0, 4);
  if (stats.length) {
    const box = $('statsBox'); box.style.setProperty('--n', stats.length);
    stats.forEach((s) => { const d = el('div', 'stat'); d.append(el('b', 'num', digits(s.n)), el('span', null, s.label)); box.append(d); });
    $('stats').hidden = false;
  }

  /* ---------- من نحن + جدول البيانات ---------- */
  $('aboutTitle').textContent = p.aboutTitle || name;
  $('aboutText').textContent = aboutParas.join('\n\n') || '';
  const values = (p.values || []).filter(Boolean);
  if (values.length) { const ul = $('values'); values.forEach((v) => ul.append(el('li', null, v))); ul.hidden = false; }
  if (p.vision) { $('vision').textContent = p.vision; $('visionBox').hidden = false; }
  if (p.mission) { $('mission').textContent = p.mission; $('missionBox').hidden = false; }
  if (p.vision || p.mission) { $('vm').hidden = false; if (!(p.vision && p.mission)) document.querySelector('.vm-grid').style.gridTemplateColumns = 'minmax(0,1fr)'; }
  if (p.message) { $('msgText').textContent = p.message; $('msgBy').textContent = p.messageBy || ''; $('msgSec').hidden = false; }
  const tb = $('tbList');
  [['المنشأة', legal], ['السجل التجاري', p.cr, true], ['الرقم الضريبي', p.vat, true], ['التصنيف', p.classification], ['المدينة', p.city]]
    .filter(([, v]) => v).forEach(([k, v, n]) => tb.append(el('dt', null, k), el('dd', n ? 'num' : null, v)));

  /* ---------- الخدمات ---------- */
  const ICONS = [[/درابزين|سلالم|درج/, 's-rail'], [/شباك|شبابيك|زجاج|سكاي|واجه|شاور|قواطع|شتر/, 's-window'], [/كهرب|انار|إنار|طاق/, 's-bolt'], [/سباك|صرف|مياه|خزان/, 's-drop'], [/نجار|باب|أبواب|ابواب|خشب|مطابخ/, 's-door'], [/دهان|ديكور|جبس|ورق/, 's-roller'],
    [/ترميم|صيان/, 's-wrench'], [/عزل/, 's-layers'], [/تكييف|تبريد/, 's-snow'], [/بلاط|سيراميك|رخام|أرضيات|ارضيات|تشطيب/, 's-tiles'],
    [/حديد|معدن|لحام|هنجر|ستيل/, 's-beam'], [/تصميم|مخطط|إشراف|اشراف|هندس/, 's-ruler'], [/عظم|خرسان|هيكل|إنشاء|انشاء|مقاولات|بناء|مبان/, 's-build']];
  const svcs = (p.services || []).filter(Boolean);
  if (svcs.length) {
    const box = $('svcList');
    svcs.forEach((t) => { const c = el('div', 'svc'); const ic = el('span', 'ic'); ic.append(icon((ICONS.find(([re]) => re.test(t)) || [0, 's-hat'])[1])); c.append(ic, el('b', null, t)); box.append(c); });
    $('services').hidden = false;
  } else document.querySelector('#nav a[href="#services"]').hidden = true;

  /* ---------- طريقة العمل ---------- */
  const steps = (p.process || []).filter(Boolean).slice(0, 8);
  if (steps.length) { const box = $('steps'); box.style.setProperty('--n', steps.length); if (steps.length > 6) box.classList.add('many'); steps.forEach((t) => { const d = el('div', 'step'); d.append(el('b', null, t)); box.append(d); }); $('process').hidden = false; }

  /* ---------- المشاريع (الصور تُحمّل بالتوازي) ---------- */
  const projs = (p.projects || []).filter((x) => x && x.name);
  if (projs.length) {
    const box = $('projList');
    projs.forEach((x) => {
      const card = el('article', 'proj'); const ph = el('div', 'ph empty'); ph.append(icon('s-build', 'i'));
      const body = el('div', 'body'); body.append(el('b', null, x.name));
      const meta = [x.client, x.place, x.year].filter(Boolean).join(' · '); if (meta) body.append(el('span', 'meta', meta));
      if (x.detail) body.append(el('p', null, x.detail));
      if (x.status) { const c = el('div', 'chips'); c.append(stPill(x.status)); body.append(c); }
      card.append(ph, body); box.append(card);
      if (x.media && x.key) media('p-' + x.key).then((src) => { if (!src) return; const img = el('img'); img.src = src; img.alt = x.name; ph.className = 'ph'; ph.replaceChildren(img); });
    });
    // جدول المشاريع (يظهر إن أُدخلت قيمة أو نطاق لمشروع واحد على الأقل)
    const tab = projs.filter((x) => x.value || x.scope);
    if (tab.length) {
      const tbody = $('ptable');
      tab.forEach((x) => { const tr = el('tr'); tr.append(el('td', null, x.name), el('td', null, [x.client, x.place].filter(Boolean).join(' — ') || '—'), el('td', 'money', x.value ? `${fmt(x.value)} ر.س` : '—'), el('td', null, x.scope || '—')); const td = el('td'); if (x.status) td.append(stPill(x.status)); tr.append(td); tbody.append(tr); });
      $('ptableWrap').hidden = false;
    }
    $('projects').hidden = false;
  } else document.querySelector('#nav a[href="#projects"]').hidden = true;

  /* ---------- المعرض والشهادات والشركاء ----------
     صور النظام (publicMedia) إن وُجدت، وإلا فالصور الثابتة للمنشأة من brand.js (مجلد media/) */
  const listOf = (arr, pre, textKey, max, fallback) => {
    const own = (arr || []).filter((x) => x && x.key).slice(0, max).map((x) => ({ text: x[textKey] || '', load: () => media(pre + x.key) }));
    return own.length ? own : (Array.isArray(fallback) ? fallback : []).filter((x) => x && x.src).slice(0, 40).map((x) => ({ text: x[textKey] || '', load: async () => x.src, lazy: true }));
  };
  const setImg = (img, src, lazy) => { if (lazy) img.loading = 'lazy'; img.decoding = 'async'; img.src = src; };
  const gal = listOf(p.gallery, 'g-', 'caption', 16, BM.gallery);
  if (gal.length) {
    const box = $('galList'); $('gallery').hidden = false;
    const LIMIT = 12; let cat = '', all = gal.length <= LIMIT;
    // يُظهر الصور حسب التصنيف المختار؛ في «الكل» تظهر أول ١٢ صورة حتى يضغط الزائر «عرض كل الصور»
    const apply = () => { let n = 0; box.querySelectorAll('figure').forEach((f) => { const ok = f.dataset.ready === '1' && (!cat || f.dataset.cat === cat); f.hidden = !ok || (!cat && !all && n >= LIMIT); if (ok) n++; }); more.hidden = !!cat || all; };
    const more = el('div', 'gal-more'); const mb = el('button', 'btn btn-ghost-dark', `عرض كل الصور (${gal.length})`); mb.type = 'button'; mb.addEventListener('click', () => { all = true; apply(); }); more.append(mb); more.hidden = true; box.after(more);
    // تصفية حسب الوصف عندما تتكرر الأوصاف (مثل أنواع المنتجات)
    const cats = [...new Set(gal.map((x) => x.text).filter(Boolean))];
    if (cats.length >= 3 && cats.length < gal.length) {
      const bar = el('div', 'gal-filter'); bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'تصفية الصور');
      ['', ...cats].forEach((c) => { const b = el('button', null, c || 'الكل'); b.type = 'button'; b.setAttribute('aria-pressed', String(!c)); b.addEventListener('click', () => { cat = c; bar.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); apply(); }); bar.append(b); });
      box.before(bar);
    }
    gal.forEach((x) => {
      const f = el('figure'); f.dataset.cat = x.text; f.hidden = true; box.append(f); // يحفظ الترتيب مهما اختلف وقت التحميل
      x.load().then((src) => { if (!src) { f.remove(); apply(); return; } const img = el('img'); setImg(img, src, x.lazy); img.alt = x.text || 'من أعمالنا'; f.append(img); if (x.text) f.append(el('figcaption', null, x.text)); f.addEventListener('click', () => zoom(src, x.text)); f.dataset.ready = '1'; apply(); });
    });
  } else document.querySelector('#nav a[href="#gallery"]').hidden = true;
  const certs = listOf(p.certs, 'c-', 'title', 12, BM.certs);
  if (certs.length) {
    const box = $('certList'); $('certsSec').hidden = false;
    certs.forEach((x) => { const c = el('div', 'cert'); const img = el('img'); img.alt = x.text || 'شهادة'; c.append(img, el('b', null, x.text || '')); box.append(c);
      x.load().then((src) => { if (src) { setImg(img, src, x.lazy); c.addEventListener('click', () => zoom(src, x.text)); } else c.remove(); }); });
  }
  const parts = listOf(p.partners, 'l-', 'name', 16, BM.partners);
  if (parts.length) {
    const box = $('partnerList'); $('partnersSec').hidden = false;
    parts.forEach((x) => { const c = el('div', 'partner'); const img = el('img'); img.alt = x.text || ''; c.append(img); if (x.text) c.append(el('span', null, x.text)); box.append(c);
      x.load().then((src) => { if (src) setImg(img, src, x.lazy); else img.remove(); }); });
  }

  /* ---------- التواصل ---------- */
  const cl = $('contactList');
  const item = (ic, label, text, href, ltr) => {
    const a = el(href ? 'a' : 'div'); if (href) { a.href = href; if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener'; } }
    const i = el('span', 'ic'); i.append(icon(ic)); const t = el('span'); t.append(el('small', null, label), el('span', ltr ? 'num' : null, text)); a.append(i, t); cl.append(a);
  };
  if (p.phone) item('i-phone', 'اتصل بنا', p.phone, `tel:${p.phone}`, true);
  if (p.whatsapp) item('i-wa', 'واتساب', '+' + p.whatsapp, wa, true);
  if (p.email) item('i-mail', 'البريد الإلكتروني', p.email, `mailto:${p.email}`, true);
  if (/^[A-Za-z0-9._]{1,30}$/.test(B.instagram || '')) item('i-ig', 'إنستغرام', '@' + B.instagram, `https://www.instagram.com/${B.instagram}/`, true);
  if (p.address || p.city) item('i-pin', 'العنوان', [p.address, p.city].filter(Boolean).join('، '), /^https:\/\//.test(p.mapUrl || '') ? p.mapUrl : '');

  /* ---------- نموذج طلب عرض السعر ---------- */
  if (p.leadForm !== false) {
    const form = $('quoteForm'), sel = $('qService'), msg = $('qMsgBox');
    [...svcs, 'أخرى'].forEach((s) => { const o = el('option', null, s); o.value = s; sel.append(o); });
    form.hidden = false;
    const say = (t, ok) => { msg.textContent = t; msg.className = 'form-msg ' + (ok ? 'ok' : 'err'); msg.hidden = false; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nm = $('qName').value.trim().slice(0, 80);
      const ph = digits($('qPhone').value).replace(/[\s-]/g, '');
      if (nm.length < 2) { say('اكتب اسمك', false); $('qName').focus(); return; }
      if (!/^[+]?[0-9]{9,14}$/.test(ph)) { say('رقم الجوال غير صحيح (مثال: 0501234567)', false); $('qPhone').focus(); return; }
      if ($('qWeb').value) { say('وصلنا طلبك، شكراً لك.', true); form.reset(); return; } // فخ الروبوتات
      let last = 0; try { last = Number(localStorage.getItem((B.storage || 'hiraf') + '.q') || 0); } catch { /* تخزين غير متاح */ }
      if (Date.now() - last < 120000) { say('أرسلت طلباً قبل قليل؛ سنتواصل معك قريباً.', true); return; }
      const btn = $('qBtn'); btn.disabled = true;
      try {
        await fs.addDoc(fs.collection(db, 'leads'), { name: nm, phone: ph, city: $('qCity').value.trim().slice(0, 40), workType: sel.value.slice(0, 80),
          message: $('qMsg').value.trim().slice(0, 800), status: 'new', at: fs.serverTimestamp() });
        try { localStorage.setItem((B.storage || 'hiraf') + '.q', String(Date.now())); } catch { /* لا شيء */ }
        form.reset(); say('وصلنا طلبك، وسيتواصل معك فريقنا قريباً. شكراً لك.', true);
      } catch (err) { console.warn(err); say('تعذّر الإرسال الآن. تواصل معنا هاتفياً أو عبر واتساب.', false); }
      finally { btn.disabled = false; }
    });
  }

  $('legal').textContent = [p.cr && `س.ت ${p.cr}`, p.vat && `الرقم الضريبي ${p.vat}`].filter(Boolean).join(' · ');
  $('page').hidden = false; $('footer').hidden = false;
  document.querySelectorAll('.draw .ln').forEach((ln, i) => { const L = Math.ceil(ln.getTotalLength ? ln.getTotalLength() : 800); ln.style.setProperty('--len', L); ln.style.setProperty('--d', `${Math.min(i * 0.05, 1.6)}s`); });

  function stPill(st) { return el('span', 'st-pill ' + (st === 'done' ? 'st-done' : 'st-run'), st === 'done' ? 'منجز' : 'قيد التنفيذ'); }
  function fmt(v) { const n = Number(digits(v).replace(/[^\d.]/g, '')); return Number.isFinite(n) && n > 0 ? n.toLocaleString('en') : digits(v); }
  function zoom(src, cap) {
    const o = el('div', 'lightbox'); o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', cap || 'صورة');
    const box = el('div'); const img = el('img'); img.src = src; img.alt = cap || ''; box.append(img); if (cap) box.append(el('p', null, cap)); o.append(box);
    const close = () => { o.remove(); removeEventListener('keydown', key); }; const key = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', close); addEventListener('keydown', key); document.body.append(o);
  }
  /** مخطط واجهة مبنى يُرسم تلقائياً (زخرفة بأسلوب المخططات الإنشائية) */
  function drawElevation() {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 540 460'); s.setAttribute('class', 'draw'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'رسم واجهة مبنى قيد الإنشاء');
    const P = (d, cls = '') => { const e = document.createElementNS(NS, 'path'); e.setAttribute('d', d); e.setAttribute('class', 'ln ' + cls); s.append(e); };
    const T = (x, y, t, anchor = 'start') => { const e = document.createElementNS(NS, 'text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('text-anchor', anchor); e.textContent = t; s.append(e); };
    const fill = document.createElementNS(NS, 'rect'); fill.setAttribute('x', 150); fill.setAttribute('y', 330); fill.setAttribute('width', 220); fill.setAttribute('height', 70); fill.setAttribute('class', 'fill'); s.append(fill);
    P('M20 400H520');                                   // منسوب الأرض
    P('M150 400V130H370V400');                          // الكتلة الرئيسية
    [330, 260, 190].forEach((y) => P(`M150 ${y}H370`));  // البلاطات
    for (let f = 0; f < 4; f++) for (let c = 0; c < 4; c++) { const x = 168 + c * 50, y = 146 + f * 70; if (!(f === 3 && (c === 1 || c === 2))) P(`M${x} ${y + 12}h32v34h-32z`); }
    P('M235 400v-52h50v52', 'ac');                      // المدخل
    P('M370 400V250H470V400'); P('M370 325H470'); P('M392 272h56v30h-56z'); P('M392 345h56v30h-56z');
    P('M95 400V52', 'ac'); P('M83 400V52'); for (let y = 64; y < 400; y += 24) P(`M83 ${y}l12 12M95 ${y}l-12 12`); // برج الرافعة
    P('M60 52H340', 'ac'); P('M60 40H95V52'); P('M89 40L150 52M89 40L60 52');   // الذراع
    P('M305 52V112'); P('M296 112h18v10h-18z', 'ac');   // الخطاف
    P('M500 400V130', 'dim'); P('M494 400h12M494 330h12M494 260h12M494 190h12M494 130h12', 'dim'); // خط المناسيب
    P('M150 425H370', 'dim'); P('M150 419v12M370 419v12', 'dim');
    [['±0.00', 400], ['+3.20', 330], ['+6.40', 260], ['+9.60', 190], ['+12.80', 130]].forEach(([t, y]) => T(512, y + 4, t));
    T(260, 448, 'واجهة أمامية', 'middle');
    return s;
  }
})();
