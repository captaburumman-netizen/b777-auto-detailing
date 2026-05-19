/* ═══════════════════════════════════════
   B777 Auto Detailing — Booking App
   Replace FORMSPREE_ID with your actual
   Formspree form ID to enable submissions.
═══════════════════════════════════════ */
(function () {
  'use strict';

  const FORMSPREE_ID = 'xdajkpov';

  // ── Data ──────────────────────────────────────────────────
  const SERVICES = [
    { id: 'basic',    name: 'Basic Wash Service', tier: 'Exterior + Interior', basePrice: 120 },
    { id: 'exterior', name: 'Exterior Detail',    tier: 'Exterior Only',       basePrice: 79  },
    { id: 'interior', name: 'Interior Detail',    tier: 'Interior Only',       basePrice: 179 },
    { id: 'complete', name: 'Complete Detail',    tier: 'Full Detail',         basePrice: 299 },
  ];

  const VEHICLE_TYPES = [
    { id: 'sedan',     label: 'Sedan / Coupe',       surcharge: 0  },
    { id: 'suv',       label: 'SUV / Crossover',     surcharge: 20 },
    { id: 'truck',     label: 'Truck / Pickup',      surcharge: 20 },
    { id: 'van',       label: 'Van / Minivan',       surcharge: 30 },
    { id: 'oversized', label: 'Oversized / Lifted',  surcharge: 40 },
  ];

  const ADDONS = [
    { id: 'pet_hair',   name: 'Pet Hair Removal',           price: 50  },
    { id: 'headlights', name: 'Headlight Restoration',      price: 120 },
    { id: 'shampoo',    name: 'Shampoo Carpets & Seats',    price: 50  },
    { id: 'steam',      name: 'Steam Carpets & Seats',      price: 30  },
    { id: 'clay',       name: 'Clay Bar Treatment',         price: 50  },
    { id: 'engine',     name: 'Engine Bay Cleaning',        price: 75  },
    { id: 'ceramic',    name: 'Spray Ceramic Sealant',      price: 40  },
  ];

  const TIME_SLOTS = [
    { id: '0800', label: '8:00 AM' }, { id: '0900', label: '9:00 AM' },
    { id: '1000', label: '10:00 AM' }, { id: '1100', label: '11:00 AM' },
    { id: '1200', label: '12:00 PM' }, { id: '1300', label: '1:00 PM' },
    { id: '1400', label: '2:00 PM' },  { id: '1500', label: '3:00 PM' },
    { id: '1600', label: '4:00 PM' },
  ];

  const TOTAL_STEPS = 6;

  // ── State ─────────────────────────────────────────────────
  const s = {
    step: 1,
    service: null, vehicleType: null,
    vMake: '', vModel: '', vCondition: 'normal', vNotes: '',
    addons: new Set(),
    calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
    date: null, time: null,
    firstName: '', lastName: '', phone: '', email: '',
    address: '', city: '', zip: '', notes: '',
    agreed: false,
  };

  // ── Helpers ───────────────────────────────────────────────
  function calcTotal() {
    const svc = SERVICES.find(x => x.id === s.service);
    const vt  = VEHICLE_TYPES.find(x => x.id === s.vehicleType);
    let total = svc ? svc.basePrice : 0;
    if (vt) total += vt.surcharge;
    s.addons.forEach(id => { const a = ADDONS.find(x => x.id === id); if (a) total += a.price; });
    return total;
  }

  function fmtDate(d) {
    if (!d) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function fmtTime(id) {
    const t = TIME_SLOTS.find(x => x.id === id);
    return t ? t.label : '—';
  }

  function unavailableSlots(date) {
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const out = new Set();
    TIME_SLOTS.forEach((slot, i) => {
      if (((seed * 31 + i * 17 + 7) * 13) % 100 < 25) out.add(slot.id);
    });
    return out;
  }

  // ── DOM shortcuts ─────────────────────────────────────────
  const app  = document.getElementById('booking-app');
  const $    = sel => app.querySelector(sel);
  const $$   = sel => app.querySelectorAll(sel);

  // ── Render ────────────────────────────────────────────────
  function render() {
    // Progress
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const item = $$(`.bk-step-item[data-step="${i}"]`)[0];
      const conn = $$(`.bk-connector[data-after="${i}"]`)[0];
      if (!item) continue;
      item.classList.toggle('active', i === s.step);
      item.classList.toggle('done',   i < s.step);
      if (conn) conn.classList.toggle('done', i < s.step);
    }
    // Panels
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const p = $(`#step-${i}`);
      if (p) p.classList.toggle('active', i === s.step);
    }
    // Nav
    const back = $('#bk-back');
    const next = $('#bk-next');
    if (back) back.style.visibility = s.step === 1 ? 'hidden' : 'visible';
    if (next) next.textContent = s.step === TOTAL_STEPS ? 'Confirm Booking' : 'Continue →';
    // Sidebar
    renderSidebar();
    // Clear error
    const err = $('#bk-error');
    if (err) err.classList.remove('show');
  }

  function renderSidebar() {
    const body = $('#summary-body');
    const totEl = $('#summary-total');
    if (!body) return;

    const svc = SERVICES.find(x => x.id === s.service);
    const vt  = VEHICLE_TYPES.find(x => x.id === s.vehicleType);

    if (!svc) {
      body.innerHTML = '<p class="bk-sum-empty">Select a service to see your summary</p>';
      if (totEl) totEl.textContent = '$0';
      return;
    }

    let html = `<div class="bk-sum-line"><span class="sl">${svc.name}</span><span class="sv">$${svc.basePrice}</span></div>`;
    if (vt && vt.surcharge > 0)
      html += `<div class="bk-sum-line"><span class="sl">${vt.label}</span><span class="sv">+$${vt.surcharge}</span></div>`;
    s.addons.forEach(id => {
      const a = ADDONS.find(x => x.id === id);
      if (a) html += `<div class="bk-sum-line"><span class="sl">${a.name}</span><span class="sv">+$${a.price}</span></div>`;
    });
    if (s.date) html += `<div class="bk-sum-line"><span class="sl">Date</span><span class="sv">${fmtDate(s.date)}</span></div>`;
    if (s.time) html += `<div class="bk-sum-line"><span class="sl">Time</span><span class="sv">${fmtTime(s.time)}</span></div>`;

    body.innerHTML = html;
    if (totEl) totEl.textContent = `$${calcTotal()}`;
  }

  // ── Calendar ──────────────────────────────────────────────
  function renderCalendar() {
    const grid  = $('#cal-grid');
    const title = $('#cal-title');
    if (!grid) return;

    const today = new Date(); today.setHours(0,0,0,0);
    const minDate = new Date(today); minDate.setDate(minDate.getDate() + 1);
    const { calYear: yr, calMonth: mo } = s;

    if (title) title.textContent = new Date(yr, mo, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const firstDay    = new Date(yr, mo, 1).getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();

    const hdrs = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    let html = hdrs.map(h => `<div class="bk-cal-day-hd">${h}</div>`).join('');

    for (let i = 0; i < firstDay; i++) html += '<div class="bk-cal-day empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(yr, mo, d);
      const isSun  = date.getDay() === 0;
      const isPast = date < minDate;
      const isToday = date.toDateString() === today.toDateString();
      const isSel   = s.date && date.toDateString() === s.date.toDateString();

      let cls = 'bk-cal-day';
      if (isSun || isPast) cls += ' dis';
      if (isToday) cls += ' today';
      if (isSel)   cls += ' sel';

      html += `<div class="${cls}" data-ts="${date.getTime()}">${d}</div>`;
    }

    grid.innerHTML = html;
    grid.querySelectorAll('.bk-cal-day:not(.dis):not(.empty)').forEach(el => {
      el.addEventListener('click', () => {
        s.date = new Date(parseInt(el.dataset.ts));
        s.time = null;
        renderCalendar();
        renderTimeSlots();
        renderSidebar();
      });
    });
  }

  function renderTimeSlots() {
    const wrap = $('#time-slots-wrap');
    if (!wrap) return;
    if (!s.date) {
      wrap.innerHTML = '<p style="color:var(--muted);font-size:0.86rem;">Select a date above to see available times.</p>';
      return;
    }
    const unavail = unavailableSlots(s.date);
    let html = '<div class="bk-time-label">Available Times</div><div class="bk-slots-grid">';
    TIME_SLOTS.forEach(slot => {
      const na  = unavail.has(slot.id);
      const sel = s.time === slot.id;
      html += `<button class="bk-slot${na ? ' unavail' : ''}${sel ? ' sel' : ''}" data-slot="${slot.id}"${na ? ' disabled' : ''}>${slot.label}</button>`;
    });
    html += '</div>';
    wrap.innerHTML = html;
    wrap.querySelectorAll('.bk-slot:not(.unavail)').forEach(btn => {
      btn.addEventListener('click', () => { s.time = btn.dataset.slot; renderTimeSlots(); renderSidebar(); });
    });
  }

  // ── Review ────────────────────────────────────────────────
  function renderReview() {
    const el  = $('#review-content');
    if (!el) return;
    const svc = SERVICES.find(x => x.id === s.service);
    const vt  = VEHICLE_TYPES.find(x => x.id === s.vehicleType);
    const total = calcTotal();

    let addonRows = '';
    s.addons.forEach(id => {
      const a = ADDONS.find(x => x.id === id);
      if (a) addonRows += row(a.name, `+$${a.price}`);
    });

    el.innerHTML = `
      <div class="bk-review-section">
        <div class="bk-rev-title">Service &amp; Pricing</div>
        ${row(svc ? svc.name : '—', `$${svc ? svc.basePrice : 0}`)}
        ${vt ? row(`${vt.label} surcharge`, vt.surcharge > 0 ? `+$${vt.surcharge}` : 'Included') : ''}
        ${addonRows}
        <div class="bk-rev-row" style="padding-top:8px">
          <span class="rl" style="color:var(--white);font-weight:600">Estimated Total</span>
          <span class="rv" style="color:var(--gold);font-family:var(--font-h);font-size:1.2rem;font-weight:900">$${total}</span>
        </div>
      </div>
      <div class="bk-review-section">
        <div class="bk-rev-title">Vehicle</div>
        ${row('Make / Model', `${s.vMake} ${s.vModel}`)}
        ${row('Type', vt ? vt.label : '—')}
        ${row('Condition', s.vCondition.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()))}
        ${s.vNotes ? row('Notes', s.vNotes) : ''}
      </div>
      <div class="bk-review-section">
        <div class="bk-rev-title">Appointment</div>
        ${row('Date', fmtDate(s.date))}
        ${row('Time', fmtTime(s.time))}
        ${row('Address', `${s.address}, ${s.city}, OK ${s.zip}`)}
      </div>
      <div class="bk-review-section">
        <div class="bk-rev-title">Contact</div>
        ${row('Name', `${s.firstName} ${s.lastName}`)}
        ${row('Phone', s.phone)}
        ${row('Email', s.email)}
        ${s.notes ? row('Special instructions', s.notes) : ''}
      </div>
      <label class="bk-terms">
        <input type="checkbox" id="bk-terms-check" ${s.agreed ? 'checked' : ''}>
        <span class="bk-terms-text">I understand that prices may vary slightly based on actual vehicle condition. Appointment confirmed upon receipt of a confirmation text or email from B777 Auto Detailing.</span>
      </label>`;

    $('#bk-terms-check').addEventListener('change', e => { s.agreed = e.target.checked; });
  }

  function row(label, value) {
    return `<div class="bk-rev-row"><span class="rl">${label}</span><span class="rv">${value}</span></div>`;
  }

  // ── Validation ────────────────────────────────────────────
  function validate() {
    const errEl = $('#bk-error');
    const fail  = msg => { if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); } return false; };
    if (errEl) errEl.classList.remove('show');

    if (s.step === 1 && !s.service)      return fail('Please select a service to continue.');
    if (s.step === 2) {
      if (!s.vehicleType)                return fail('Please select your vehicle type.');
      if (!s.vMake.trim())               return fail('Please enter your vehicle make (e.g. Toyota).');
      if (!s.vModel.trim())              return fail('Please enter your vehicle model (e.g. Camry).');
    }
    if (s.step === 4) {
      if (!s.date)                       return fail('Please select a date.');
      if (!s.time)                       return fail('Please select a time slot.');
    }
    if (s.step === 5) {
      if (!s.firstName.trim())           return fail('Please enter your first name.');
      if (!s.lastName.trim())            return fail('Please enter your last name.');
      if (!/^[\d\s\-().+]{10,}$/.test(s.phone.replace(/\s/g,''))) return fail('Please enter a valid phone number.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))            return fail('Please enter a valid email address.');
      if (!s.address.trim())             return fail('Please enter your service address.');
      if (!s.city.trim())                return fail('Please enter your city.');
      if (!s.zip.trim())                 return fail('Please enter your ZIP code.');
    }
    if (s.step === 6 && !s.agreed)       return fail('Please agree to the terms to confirm your booking.');
    return true;
  }

  // ── Submission ────────────────────────────────────────────
  async function submitBooking() {
    const svc  = SERVICES.find(x => x.id === s.service);
    const vt   = VEHICLE_TYPES.find(x => x.id === s.vehicleType);
    const addons = Array.from(s.addons).map(id => ADDONS.find(x => x.id === id)?.name).filter(Boolean).join(', ');

    const payload = {
      service:   svc?.name,
      vehicle:   `${s.vMake} ${s.vModel} (${vt?.label})`,
      condition: s.vCondition,
      addons:    addons || 'None',
      date:      fmtDate(s.date),
      time:      fmtTime(s.time),
      address:   `${s.address}, ${s.city}, OK ${s.zip}`,
      name:      `${s.firstName} ${s.lastName}`,
      phone:     s.phone,
      email:     s.email,
      notes:     s.notes || 'None',
      total:     `$${calcTotal()}`,
    };

    if (FORMSPREE_ID === 'YOUR_FORM_ID') {
      // Demo mode — show success without network call
      showSuccess(); return;
    }

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) showSuccess();
      else throw new Error();
    } catch {
      const errEl = $('#bk-error');
      if (errEl) { errEl.textContent = 'Something went wrong. Please call us at 572-205-6012.'; errEl.classList.add('show'); }
      $('#bk-next').disabled = false;
      $('#bk-next').textContent = 'Confirm Booking';
    }
  }

  function showSuccess() {
    const svc = SERVICES.find(x => x.id === s.service);
    $('#bk-app-body').hidden = true;
    const success = $('#bk-success');
    success.hidden = false;
    const det = $('#success-details');
    if (det) det.innerHTML = `
      ${row('Service', svc?.name || '—')}
      ${row('Date', fmtDate(s.date))}
      ${row('Time', fmtTime(s.time))}
      ${row('Address', `${s.address}, ${s.city}`)}
      <div class="bk-rev-row" style="margin-top:4px">
        <span class="rl" style="color:var(--white);font-weight:600">Total</span>
        <span class="rv" style="color:var(--gold);font-weight:700">$${calcTotal()}</span>
      </div>`;
  }

  // ── Event bindings ────────────────────────────────────────
  function bindAll() {
    // Step 1 — service cards
    $$('.bk-svc-card').forEach(card => {
      card.addEventListener('click', () => {
        s.service = card.dataset.service;
        $$('.bk-svc-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        renderSidebar();
      });
    });

    // Step 2 — vehicle type buttons
    $$('.bk-vtype-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        s.vehicleType = btn.dataset.vtype;
        $$('.bk-vtype-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        renderSidebar();
      });
    });

    // Step 2 — vehicle text fields
    [['#veh-make', 'vMake'], ['#veh-model', 'vModel'], ['#veh-notes', 'vNotes']].forEach(([sel, key]) => {
      const el = $(sel); if (el) el.addEventListener('input', e => { s[key] = e.target.value; });
    });
    const condSel = $('#veh-condition');
    if (condSel) condSel.addEventListener('change', e => { s.vCondition = e.target.value; });

    // Step 3 — add-on cards
    $$('.bk-addon-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.addon;
        if (s.addons.has(id)) { s.addons.delete(id); card.classList.remove('selected'); }
        else                  { s.addons.add(id);    card.classList.add('selected');    }
        renderSidebar();
      });
    });

    // Step 4 — calendar nav
    $('#cal-prev')?.addEventListener('click', () => {
      s.calMonth--; if (s.calMonth < 0) { s.calMonth = 11; s.calYear--; }
      renderCalendar();
    });
    $('#cal-next')?.addEventListener('click', () => {
      s.calMonth++; if (s.calMonth > 11) { s.calMonth = 0; s.calYear++; }
      renderCalendar();
    });

    // Step 5 — contact fields
    [
      ['#contact-first', 'firstName'], ['#contact-last', 'lastName'],
      ['#contact-phone', 'phone'],     ['#contact-email', 'email'],
      ['#contact-addr',  'address'],   ['#contact-city',  'city'],
      ['#contact-zip',   'zip'],       ['#contact-notes', 'notes'],
    ].forEach(([sel, key]) => {
      const el = $(sel); if (el) el.addEventListener('input', e => { s[key] = e.target.value; });
    });

    // Nav buttons
    $('#bk-back')?.addEventListener('click', () => {
      if (s.step > 1) { s.step--; render(); scrollToApp(); }
    });

    $('#bk-next')?.addEventListener('click', async () => {
      if (!validate()) return;
      if (s.step === TOTAL_STEPS) {
        const btn = $('#bk-next');
        btn.disabled = true; btn.textContent = 'Submitting…';
        await submitBooking();
        return;
      }
      s.step++;
      if (s.step === 4) { renderCalendar(); renderTimeSlots(); }
      if (s.step === 6) renderReview();
      render();
      scrollToApp();
    });
  }

  function scrollToApp() {
    app.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Init ──────────────────────────────────────────────────
  if (!app) return;
  bindAll();
  render();

})();
