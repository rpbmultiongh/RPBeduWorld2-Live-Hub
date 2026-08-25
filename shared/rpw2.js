/* ============================================================
   RPBeduWorld2 Runtime Kit — rpw2.js v1.0
   Icons · Toasts · Modals · Storage · Theme · SFX · IO utils
   ============================================================ */
(function (global) {
  "use strict";
  const NS = "rpw2";
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- icons (inline SVG, stroke style) ---------------- */
  const P = {
    home: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
    trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
    plus: 'M12 5v14M5 12h14',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    play: 'M5 3l14 9-14 9V3z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    chevronDown: 'M6 9l6 6 6-6', chevronUp: 'M18 15l-6-6-6 6', chevronLeft: 'M15 18l-6-6 6-6', chevronRight: 'M9 18l6-6-6-6',
    edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z',
    folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    brain: 'M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17.5 2.5 2.5 0 0 1 3 13a2.5 2.5 0 0 1 .05-4A2.5 2.5 0 0 1 4.5 4.5a2.5 2.5 0 0 1 5-.5zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.54-2.94A2.5 2.5 0 0 0 21 13a2.5 2.5 0 0 0-.05-4 2.5 2.5 0 0 0-1.45-4.5 2.5 2.5 0 0 0-5-.5z',
    trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22h10c0-1.76-.85-3.25-2.03-3.79-.5-.23-.97-.66-.97-1.21v-2.34M18 2H6v7a6 6 0 0 0 12 0V2z',
    flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    shuffle: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
    award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
    image: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
    globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    volume: 'M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14'
  };
  function icon(name, size) {
    const d = P[name] || P.info;
    const s = size || 18;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* ---------------- escape / misc ---------------- */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  const now = () => new Date().toISOString();
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch (e) { return ""; } }

  /* ---------------- theme ---------------- */
  const theme = {
    get() { return localStorage.getItem(NS + ".theme") || "dark"; },
    set(t) {
      localStorage.setItem(NS + ".theme", t);
      document.documentElement.setAttribute("data-theme", t);
      $$(".rpw-theme-toggle").forEach(b => { b.innerHTML = icon(t === "dark" ? "sun" : "moon"); b.title = "Switch theme"; });
    },
    toggle() { this.set(this.get() === "dark" ? "light" : "dark"); this.sfx && RPW2.sfx.click(); },
    init() {
      document.documentElement.setAttribute("data-theme", this.get());
      $$(".rpw-theme-toggle").forEach(b => { b.classList.add("rpw-btn", "icon-only"); b.innerHTML = icon(this.get() === "dark" ? "sun" : "moon"); b.title = "Switch theme"; b.addEventListener("click", () => this.toggle()); });
    }
  };

  /* ---------------- storage ---------------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(NS + "." + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, val) { try { localStorage.setItem(NS + "." + key, JSON.stringify(val)); return true; } catch (e) { toast("Storage full — export & prune data", "err"); return false; } },
    remove(key) { localStorage.removeItem(NS + "." + key); },
    keys(prefix) {
      const out = [], p = NS + "." + (prefix || "");
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.indexOf(p) === 0) out.push(k.slice(p.length)); }
      return out;
    }
  };

  /* ---------------- toasts ---------------- */
  let toastWrap = null;
  function toast(msg, type) {
    if (!toastWrap) { toastWrap = document.createElement("div"); toastWrap.className = "rpw-toasts"; document.body.appendChild(toastWrap); }
    const el = document.createElement("div");
    el.className = "rpw-toast " + (type || "info");
    el.innerHTML = icon(type === "ok" ? "check" : type === "err" ? "x" : "info", 16) + "<span>" + escapeHtml(msg) + "</span>";
    toastWrap.appendChild(el);
    setTimeout(() => { el.classList.add("leaving"); setTimeout(() => el.remove(), 320); }, 3200);
  }

  /* ---------------- confirm modal ---------------- */
  function confirm(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const bd = document.createElement("div");
      bd.className = "rpw-modal-backdrop";
      bd.innerHTML =
        '<div class="rpw-modal" role="dialog" aria-modal="true">' +
        '<div class="rpw-modal-head"><h3>' + escapeHtml(opts.title || "Are you sure?") + '</h3></div>' +
        '<div class="rpw-modal-body"><p class="muted mb-3">' + escapeHtml(opts.message || "") + '</p>' +
        '<div class="row spread"><button class="rpw-btn ghost" data-a="no">Cancel</button>' +
        '<button class="rpw-btn ' + (opts.danger ? "danger" : "primary") + '" data-a="yes">' + escapeHtml(opts.yesLabel || "Confirm") + '</button></div></div></div>';
      const done = v => { bd.remove(); resolve(v); };
      bd.addEventListener("click", e => {
        if (e.target === bd) done(false);
        const a = e.target.closest("[data-a]");
        if (a) done(a.dataset.a === "yes");
      });
      document.body.appendChild(bd);
    });
  }

  /* ---------------- generic modal ---------------- */
  function modal(title, bodyHtml, onOpen) {
    const bd = document.createElement("div");
    bd.className = "rpw-modal-backdrop";
    bd.innerHTML = '<div class="rpw-modal" role="dialog" aria-modal="true">' +
      '<div class="rpw-modal-head"><h3>' + title + '</h3><button class="rpw-btn icon-only" data-x aria-label="Close">' + icon("x") + '</button></div>' +
      '<div class="rpw-modal-body">' + bodyHtml + '</div></div>';
    bd.addEventListener("click", e => { if (e.target === bd || e.target.closest("[data-x]")) bd.remove(); });
    document.body.appendChild(bd);
    if (onOpen) onOpen(bd);
    return { close: () => bd.remove(), el: bd };
  }

  /* ---------------- file IO ---------------- */
  function download(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  function pickFile(accept) {
    return new Promise(resolve => {
      const inp = document.createElement("input");
      inp.type = "file"; if (accept) inp.accept = accept;
      inp.onchange = () => resolve(inp.files[0] || null);
      inp.click();
    });
  }

  /* ---------------- WebAudio SFX ---------------- */
  let actx = null;
  function beep(freq, dur, type, vol, when) {
    try {
      actx = actx || new (global.AudioContext || global.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t = actx.currentTime + (when || 0);
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime((vol || 0.12) * (global.RPW2?sfx.volume:1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.05);
    } catch (e) { /* audio unavailable */ }
  }
  const sfx = {
    muted: store.get("sfx.muted", false),
    volume: Math.max(0, Math.min(1, store.get("sfx.volume", 1))),
    setVolume(v) { this.volume = Math.max(0, Math.min(1, +v || 0)); store.set("sfx.volume", this.volume); return this.volume; },
    play(name) {
      if (this.muted) return;
      const m = {
        click: () => beep(600, .06, "triangle", .05),
        ok: () => { beep(520, .1, "sine", .1); beep(780, .14, "sine", .1, .08); },
        err: () => { beep(220, .16, "square", .07); beep(160, .2, "square", .06, .1); },
        win: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, "triangle", .11, i * .11)),
        level: () => [392, 523, 659, 784].forEach((f, i) => beep(f, .13, "sine", .12, i * .09)),
        flip: () => beep(300, .05, "sine", .04)
      };
      m[name] && m[name]();
    },
    click() { this.play("click"); }, ok() { this.play("ok"); }, err() { this.play("err"); },
    win() { this.play("win"); }, level() { this.play("level"); },
    toggleMute() { this.muted = !this.muted; store.set("sfx.muted", this.muted); return this.muted; }
  };

  /* ---------------- accessibility: reduced motion ---------------- */
  const a11y = {
    reduced: store.get("a11y.rm", null),
    apply() {
      const r = this.reduced == null
        ? (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches)
        : !!this.reduced;
      document.documentElement.setAttribute("data-motion", r ? "reduced" : "full");
      return r;
    },
    set(v) { this.reduced = v; store.set("a11y.rm", v); return this.apply(); }
  };

/* ---------------- confetti ---------------- */
  function confetti(x, y) {
    if (document.documentElement.getAttribute("data-motion") === "reduced") return;
    const cv = document.createElement("canvas");
    Object.assign(cv.style, { position: "fixed", inset: 0, zIndex: 400, pointerEvents: "none" });
    cv.width = innerWidth; cv.height = innerHeight;
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d");
    const colors = ["#6c5ce7", "#00d2ff", "#2ecc71", "#f39c12", "#ff4d6d", "#fd79a8"];
    const parts = Array.from({ length: 130 }, () => ({
      x: x != null ? x : cv.width / 2, y: y != null ? y : cv.height * .38,
      vx: (Math.random() - .5) * 11, vy: Math.random() * -9 - 3,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      color: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(p => {
        p.vy += .28; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frames / 110);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (++frames < 115) requestAnimationFrame(tick); else cv.remove();
    })();
  }

  /* ---------------- boot wiring ---------------- */
  function initTopbar(appName, appIconName) {
    theme.init();
    const t = $(".rpw-app-title");
    if (t && appName) {
      if (appIconName) t.insertAdjacentHTML("afterbegin", '<span class="t-icon">' + icon(appIconName, 17) + "</span>");
      const label = document.createElement("span");
      label.textContent = appName; t.appendChild(label);
    }
    // mute toggle
    const acts = $(".rpw-topbar-actions");
    if (acts) {
      const mb = document.createElement("button");
      mb.className = "rpw-btn icon-only"; mb.title = "Toggle sound";
      mb.setAttribute("aria-label", "Toggle sound effects");
      const paint = () => { mb.innerHTML = icon(sfx.muted ? "volume" : "volume", 16); mb.style.opacity = sfx.muted ? .45 : 1; };
      paint(); mb.onclick = () => { sfx.toggleMute(); paint(); };
      acts.insertBefore(mb, acts.firstChild);
    }
  }

  // global "/" focuses search
  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      const s = $("[data-rpw-search]");
      if (s) { e.preventDefault(); s.focus(); }
    }
  });

  const RPW2 = { icon, escapeHtml, uid, now, fmtDate, toast, confirm, modal, download, pickFile, store, theme, sfx, a11y, confetti, initTopbar };
  try { RPW2.a11y.apply(); } catch (e) {}
  global.RPW2 = RPW2;
})(window);
