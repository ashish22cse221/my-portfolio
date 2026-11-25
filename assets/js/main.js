/* =========================================================
   ASHISH CHOUDHURY — portfolio runtime
   All content comes from /content/site.json (edited via /admin)
   ========================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const safeUrl = (u) => (/^(https?:|mailto:|\/)/i.test(u || "") ? u : "");
  const host = (u) => { try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; } };
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- barcode (deterministic from text) ---------- */
  function barcode(text) {
    let seed = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    let x = 0, rects = "";
    while (x < 196) {
      const w = 1 + Math.floor(rnd() * 3);
      rects += `<rect x="${x}" y="0" width="${w}" height="20" fill="currentColor"/>`;
      x += w + 1 + Math.floor(rnd() * 3);
    }
    return `<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`;
  }
  const paintBarcodes = (root = document) => $$(".barcode", root).forEach((el) => { el.innerHTML = barcode(el.dataset.code || "AC23"); });

  /* ---------- fit giant type to its container ---------- */
  function fitAll() {
    $$(".fit").forEach((el) => {
      const parent = el.parentElement;
      const cs = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.display = "inline-block";
      el.style.fontSize = "100px";
      const w = el.getBoundingClientRect().width;
      el.style.display = "";
      if (w > 0) el.style.fontSize = `${(100 * avail / w) * 0.995}px`;
    });
  }

  /* ---------- launch screen → push-to-start ---------- */
  function runLaunch() {
    const launch = $("#launch"), loader = $("#loader");
    return new Promise((resolve) => {
      if (sessionStorage.getItem("ac-launched")) {
        launch.classList.add("skip"); loader.classList.add("skip"); return resolve(false);
      }
      document.documentElement.style.overflow = "hidden";
      const btn = $("#igniteBtn");
      const go = () => {
        removeEventListener("keydown", onKey);
        sessionStorage.setItem("ac-launched", "1");
        btn.classList.add("pressed"); $("#igniteLabel").textContent = "ON";
        launch.classList.add("firing");
        setTimeout(() => {
          launch.classList.add("gone");
          document.documentElement.style.overflow = "";
          setTimeout(() => launch.classList.add("skip"), 1000);
          resolve(true);
        }, reduced ? 0 : 750);
      };
      const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
      btn.addEventListener("click", go, { once: true });
      addEventListener("keydown", onKey);
      btn.focus({ preventScroll: true });
    });
  }

  /* ---------- loader: five red lights ---------- */
  function runLoader(play) {
    const loader = $("#loader");
    return new Promise((resolve) => {
      if (!play || reduced) { loader.classList.add("skip"); return resolve(); }
      const pods = $$(".pod", loader), gantry = $("#gantry");
      const text = $("#loaderText");
      const STEP = 620; // one pod per beat, like the real sequence
      pods.forEach((p, i) => setTimeout(() => {
        p.classList.add("on");
        gantry.style.setProperty("--lit", (i + 1) / pods.length);
        text.textContent = `${i + 1} / ${pods.length}`;
      }, 400 + i * STEP));
      const hold = 400 + pods.length * STEP + 500 + Math.random() * 900; // random hold before lights out
      setTimeout(() => {
        // reds out → all green → launch
        pods.forEach((p) => { p.classList.toggle("on", false); p.classList.add("go"); });
        gantry.classList.add("go");
        loader.classList.add("is-go");
        text.textContent = "GREEN · GO GO GO";
        text.classList.add("go");
        setTimeout(() => { loader.classList.add("done"); resolve(); setTimeout(() => loader.classList.add("skip"), 1000); }, 900);
      }, hold);
    });
  }

  /* ---------- status bar counter ---------- */
  function runStatus() {
    const pct = $("#pct"), cells = $$(".battery i");
    const dur = reduced ? 1 : 1600, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), v = 100 * (1 - Math.pow(1 - p, 3));
      pct.textContent = `${v.toFixed(1)}%`;
      cells.forEach((c, i) => c.classList.toggle("on", v >= (i + 1) * 20 - 10));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- render content ---------- */
  function bind(data) {
    const p = data.profile || {};
    const values = {
      ...p,
      statusText: p.available ? "OPEN TO PROJECTS" : "ON TRACK",
      contactHeadline: data.contact?.headline,
    };
    $$("[data-bind]").forEach((el) => {
      const v = values[el.dataset.bind];
      if (v !== undefined && v !== "") {
        el.textContent = (el.dataset.prefix || "") + v;
        if (el.dataset.text) el.dataset.text = el.textContent;
      }
    });
    $$("[data-bind-src]").forEach((el) => { const v = safeUrl(values[el.dataset.bindSrc]); if (v) el.src = v; });
    document.title = `${p.firstName} ${p.lastName} — ${p.role}`;
  }

  function renderProfile(data) {
    const p = data.profile || {}, ed = (data.education || [])[0];
    const rows = [
      ["Race no.", `#${p.number || "—"}`],
      ["Role", p.role],
      ["Team", p.team],
      ["Base", p.location],
      ["Class", ed ? `${ed.place.split(",")[0]} · ${ed.period}` : ""],
      ["Status", p.available ? "● Open to projects" : "Fully booked", p.available ? "live" : ""],
    ].filter((r) => r[1]);
    $("#specTable").innerHTML = rows.map(([k, v, c]) => `<div><dt>${esc(k)}</dt><dd class="${c || ""}">${esc(v)}</dd></div>`).join("");
    const tilt = [-6, 3, -2, 5, -4, 2, 6, -3, 4, -5, 1, -1];
    $("#interests").innerHTML = (p.interests || []).map((i, n) => `<li style="--r:${tilt[n % tilt.length]}deg">${esc(i)}</li>`).join("");
    $("#interests").addEventListener("click", (e) => { if (e.target.closest("li")) burst(e.clientX, e.clientY); });

    const list = (title, items) => items?.length ? `<div><h4>${esc(title)}</h4><ul>${items.join("")}</ul></div>` : "";
    $("#credentials").innerHTML =
      list("EDUCATION", (data.education || []).map((e) => `<li><b>${esc(e.title)}</b><br>${esc(e.place)} · ${esc(e.period)}${e.note ? ` · ${esc(e.note)}` : ""}</li>`)) +
      list("CERTIFICATIONS", (data.certifications || []).map((c) => `<li>${esc(c)}</li>`)) +
      list("POSITIONS & ACHIEVEMENTS", (data.positions || []).map((c) => `<li>${esc(c)}</li>`));
  }

  function linkBtns(pr, cls = "btn") {
    let out = "";
    if (safeUrl(pr.live)) out += `<a class="${cls} btn--red" href="${esc(pr.live)}" target="_blank" rel="noopener">Live <span>↗</span></a>`;
    if (safeUrl(pr.repo)) out += `<a class="${cls} btn--ghost" href="${esc(pr.repo)}" target="_blank" rel="noopener">Code <span>⌥</span></a>`;
    return out;
  }

  function renderProjects(data) {
    const all = data.projects || [];
    $("#featured").innerHTML = all.map((pr, i) => `
      <article class="feat reveal">
        ${i === 0 ? `<span class="hand-note">my fav build</span>` : ""}
        <div class="feat__info">
          <div class="feat__top"><span class="feat__pos">P${i + 1}</span><span class="feat__cat">${esc(pr.category)}</span></div>
          <h3 class="feat__title">${esc(pr.title)}</h3>
          <p class="feat__summary">${esc(pr.summary)}</p>
          ${pr.specs?.length ? `<div class="feat__specs">${pr.specs.slice(0, 3).map((s) => `<div><span>${esc(s.label)}</span><b>${esc(s.value)}</b></div>`).join("")}</div>` : ""}
          ${pr.tags?.length ? `<ul class="tags">${pr.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
          <div class="feat__actions">${linkBtns(pr)}</div>
        </div>
        <a class="feat__media" ${safeUrl(pr.live) ? `href="${esc(pr.live)}" target="_blank" rel="noopener"` : ""} aria-label="${esc(pr.title)} preview">
          ${safeUrl(pr.image) ? `<img src="${esc(pr.image)}" alt="${esc(pr.title)} screenshot" loading="lazy" />` : ""}
          <div class="feat__hud"><span><b>LIVE</b> ${esc(host(pr.live))}</span><span>CAM ${pad(i + 1)} · ONBOARD</span></div>
        </a>
      </article>`).join("");
  }

  function renderLaunch(data) {
    const l = data.launch || {};
    if (l.kicker) $("#launchKicker").textContent = l.kicker;
    if (l.button) $("#igniteLabel").textContent = l.button.toUpperCase();
    if (safeUrl(l.background)) $("#launchBg").style.backgroundImage = `url("${encodeURI(l.background)}")`;
  }

  /* ---------- comic bursts (stickers + badge easter egg) ---------- */
  const BURSTS = ["POW!", "VROOM!", "ZAP!", "KABOOM!", "BOOST!", "WHAM!", "DRS!", "GG!", "KAPOW!", "NITRO!"];
  function burst(x, y, word) {
    if (reduced) return;
    const el = document.createElement("span");
    el.className = "burst";
    el.textContent = word || BURSTS[Math.floor(Math.random() * BURSTS.length)];
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.setProperty("--r", `${Math.round(Math.random() * 24 - 12)}deg`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  function renderTimeline(data) {
    const xp = data.experience || [];
    $("#timeline").innerHTML = xp.map((x, i) => `
      <li class="lap reveal ${x.current ? "current" : ""}">
        <div>
          <div class="lap__num">LAP</div>
          <div class="lap__big">${pad(xp.length - i)}</div>
          <div class="lap__dates">${esc(x.start)} — ${esc(x.end)}</div>
        </div>
        <div>
          <h3 class="lap__role">${esc(x.role)}</h3>
          <p class="lap__company">${esc(x.company)}${x.location ? ` · ${esc(x.location)}` : ""}</p>
          ${x.current ? `<span class="live-badge"><span class="dot"></span>P1 · ON TRACK</span>` : ""}
        </div>
        <ul class="lap__points">${(x.points || []).map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
      </li>`).join("");
  }

  function renderTelemetry(data) {
    const skills = data.skills || [];
    const groups = {};
    skills.forEach((s) => (groups[s.group || "Core"] ||= []).push(+s.level || 0));
    const P = (a, r = 80) => [100 + r * Math.cos(a * Math.PI / 180), 100 + r * Math.sin(a * Math.PI / 180)];
    const [sx, sy] = P(150), [ex, ey] = P(30);
    const ticks = Array.from({ length: 11 }, (_, i) => { const a = 150 + i * 24, [x1, y1] = P(a, 92), [x2, y2] = P(a, 100); return `<line class="gauge__tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join("");
    const [nx, ny] = P(150, 64);
    $("#gauges").innerHTML = Object.entries(groups).map(([g, arr]) => {
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      return `
        <div class="gauge" data-value="${avg}">
          <svg viewBox="0 0 200 150" aria-hidden="true">
            ${ticks}
            <path class="gauge__track" d="M${sx} ${sy} A80 80 0 1 1 ${ex} ${ey}" pathLength="100"/>
            <path class="gauge__val" d="M${sx} ${sy} A80 80 0 1 1 ${ex} ${ey}" pathLength="100"/>
            <line class="gauge__needle" x1="100" y1="100" x2="${nx}" y2="${ny}"/>
            <circle cx="100" cy="100" r="6" fill="#3366ff"/>
          </svg>
          <div class="gauge__num" data-count="${avg}">0</div>
          <div class="gauge__label">${esc(g)}</div>
        </div>`;
    }).join("");

    $("#skills").innerHTML = skills.map((s) => `
      <div class="skill reveal" data-level="${+s.level || 0}">
        <span class="skill__name">${esc(s.name)}</span>
        <span class="skill__bar">${"<i></i>".repeat(20)}</span>
        <span class="skill__val" data-count="${+s.level || 0}">0</span>
      </div>`).join("");
  }

  function renderSocial(data) {
    const s = data.socials || {}, p = data.profile || {};
    const ig = safeUrl(s.instagram);
    if (ig) {
      $("#instaLink").href = ig;
      $("#instaHandle").textContent = (s.instagramHandle || "@instagram").toUpperCase();
    } else $("#instagram").remove();

    $("#instaGrid").innerHTML = (data.instagramPosts || []).filter((x) => safeUrl(x.image)).map((x) => `
      <a href="${esc(safeUrl(x.link) || ig)}" target="_blank" rel="noopener"><img src="${esc(x.image)}" alt="${esc(x.caption || "Instagram post")}" loading="lazy" /></a>`).join("");

    const links = [
      ["Instagram", ig], ["GitHub", safeUrl(s.github)], ["LinkedIn", safeUrl(s.linkedin)],
      ["Email", s.email ? `mailto:${s.email}` : ""],
    ].filter((l) => l[1]);
    $("#socialLinks").innerHTML = links.map(([n, u]) => `<a href="${esc(u)}" ${u.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${n}<span>↗</span></a>`).join("");

    const email = s.email || "";
    $("#emailText").textContent = email;
    $("#emailBtn").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(email); $("#emailHint").textContent = "COPIED TO CLIPBOARD ✓"; }
      catch { location.href = `mailto:${email}`; }
      setTimeout(() => ($("#emailHint").textContent = "CLICK TO COPY"), 2200);
    });

    const resume = safeUrl(p.resume);
    if (resume) { const b = $("#resumeBtn"); b.href = resume; b.hidden = false; }

    const form = $("#radioForm"), status = $("#formStatus");
    form.action = data.contact?.formEndpoint || "";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#sendBtn");
      btn.disabled = true; status.className = "form-status mono"; status.textContent = "TRANSMITTING…";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(res.status);
        form.reset(); status.classList.add("ok"); status.textContent = "COPY THAT — MESSAGE RECEIVED. I'LL RADIO BACK SOON.";
      } catch {
        status.classList.add("err"); status.textContent = `SIGNAL LOST. TRY AGAIN OR EMAIL ${email.toUpperCase()}`;
      } finally { btn.disabled = false; }
    });
  }

  function renderTicker(data) {
    const p = data.profile || {};
    const words = [p.tagline, ...(p.interests || []), p.role, "Lights Out"].filter(Boolean);
    const run = words.map((w) => `<span>${esc(w)}</span>`).join("");
    $("#ticker").innerHTML = run + run;
    const alt = ["Caution", "Hot parts", "Built not bought", "No cloud", "Solder & code", "Lap 03 in progress", "Handle with care"]
      .map((w) => `<span>${esc(w)}</span>`).join("");
    $("#ticker2").innerHTML = alt + alt;
  }


  /* ---------- extra sections: stats, services, process, trophies, toolbox ---------- */
  function renderExtras(data) {
    const stats = data.stats || [];
    const st = $("#stats");
    if (stats.length) st.innerHTML = stats.map((s, i) => `
      <div class="stat reveal" data-value="${esc(s.value)}">
        <span class="stat__idx mono">S${pad(i + 1)}</span>
        <b class="stat__num">${esc(s.value)}</b>
        <span class="stat__label mono">${esc(s.label)}</span>
      </div>`).join("");
    else st.remove();

    $("#serviceGrid").innerHTML = (data.services || []).map((s, i) => `
      <article class="service reveal">
        <span class="service__num">${pad(i + 1)}</span>
        <h3 class="service__title">${esc(s.title)}</h3>
        <p class="service__summary">${esc(s.summary)}</p>
        ${s.tags?.length ? `<ul class="tags">${s.tags.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <a class="service__cta mono" href="#radio">BOOK THIS BUILD →</a>
      </article>`).join("");

    $("#processTrack").innerHTML = (data.process || []).map((s, i, a) => `
      <li class="step reveal">
        <span class="step__lap mono">LAP ${pad(i + 1)}/${pad(a.length)}</span>
        <h3 class="step__title">${esc(s.title)}</h3>
        <p class="step__summary">${esc(s.summary)}</p>
        ${i === a.length - 1 ? `<span class="step__flag" aria-hidden="true"></span>` : ""}
      </li>`).join("");

    $("#trophyGrid").innerHTML = (data.trophies || []).map((s, i) => `
      <article class="trophy reveal">
        <span class="trophy__place">P${i + 1}</span>
        <h3 class="trophy__title">${esc(s.title)}</h3>
        <p class="trophy__note">${esc(s.note)}</p>
      </article>`).join("");

    const tilt = [-3, 2, -1, 3, -2, 1];
    $("#toolbox").innerHTML = (data.toolbox || []).map((x, i) => `<li style="--r:${tilt[i % tilt.length]}deg">${esc(x)}</li>`).join("");

    ["services", "process", "trophies"].forEach((id) => { if (!(data[id] || []).length) $(`#${id}`)?.remove(); });
  }
  function countStat(el) {
    const raw = el.dataset.value || "", m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
    if (!m || reduced) return;
    const target = parseFloat(m[1]), dec = (m[1].split(".")[1] || "").length, suf = m[2];
    const num = $(".stat__num", el), t0 = performance.now(), dur = 1300;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); num.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  /* ---------- in-view animations ---------- */
  function countUp(el) {
    const target = +el.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1400;
    const step = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  /* split hero name into letters for the drop-in entrance */
  function splitHero() {
    $$(".hero__name .giant, .hero__last .giant").forEach((el) => {
      const txt = el.textContent.trim();
      el.setAttribute("aria-label", txt);
      el.innerHTML = [...txt].map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${esc(c)}</span>`).join("");
    });
  }
  function observe() {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      // stagger siblings that reveal together
      if (!reduced && el.classList.contains("reveal")) {
        const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
        const d = Math.min(sibs.indexOf(el), 6) * 90;
        if (d) { el.style.transitionDelay = `${d}ms`; setTimeout(() => (el.style.transitionDelay = ""), d + 900); }
      }
      el.classList.add("in");
      if (el.classList.contains("skill")) {
        const on = Math.round((+el.dataset.level) / 5), cells = $$(".skill__bar i", el);
        cells.forEach((c, i) => i < on && setTimeout(() => { c.classList.add("on"); if (i === on - 1) c.classList.add("hi"); }, reduced ? 0 : i * 45));
        countUp($(".skill__val", el));
      }
      if (el.classList.contains("stat")) countStat(el);
      if (el.classList.contains("gauge")) {
        const v = +el.dataset.value;
        $(".gauge__val", el).style.strokeDasharray = `${v} 100`;
        $(".gauge__needle", el).style.transform = `rotate(${v * 2.4}deg)`;
        countUp($(".gauge__num", el));
      }
    }), { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal, .gauge").forEach((el) => io.observe(el));

    const links = $$(".nav__links a");
    const navIO = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
    }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => navIO.observe(s));
  }

  /* ---------- chrome: clock, menu, cursor ---------- */
  function chrome() {
    // easter egg: smash the AC badge
    $(".nav__logo").addEventListener("click", (e) => burst(e.clientX + 30, e.clientY + 40));
    // scroll progress bar under the nav
    const bar = $("#progressBar");
    if (bar) {
      let ticking = false;
      const upd = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
        ticking = false;
      };
      addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
      upd();
    }
    const clock = $("#clock");
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const lc = $("#launchClock");
    const tick = () => { clock.textContent = `IST ${fmt.format(new Date())}`; lc.textContent = clock.textContent; };
    tick(); setInterval(tick, 1000);
    const y = new Date().getFullYear();
    $("#year").textContent = y; $("#yy").textContent = String(y).slice(-2);

    const btn = $("#menuBtn"), nav = $("#navLinks");
    btn.addEventListener("click", () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
    $$("a", nav).forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); }));

    if (matchMedia("(pointer: fine)").matches && !reduced) {
      const cur = $(".cursor"); let x = innerWidth / 2, y2 = innerHeight / 2, cx = x, cy = y2;
      document.body.classList.add("has-cursor");
      addEventListener("mousemove", (e) => { x = e.clientX; y2 = e.clientY; });
      document.addEventListener("mouseover", (e) => cur.classList.toggle("hover", !!e.target.closest("a, button, input, textarea, .chips li")));
      const loop = () => { cx += (x - cx) * 0.22; cy += (y2 - cy) * 0.22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); };
      loop();
    }
  }

  /* ---------- boot ---------- */
  async function boot() {
    paintBarcodes();
    chrome();
    const loaderDone = runLaunch().then(runLoader);
    try {
      const res = await fetch("/content/site.json", { cache: "no-cache" });
      const data = await res.json();
      bind(data); renderLaunch(data); renderProfile(data); renderProjects(data); renderTimeline(data);
      renderTelemetry(data); renderSocial(data); renderTicker(data); renderExtras(data);
    } catch (err) {
      console.error("Could not load /content/site.json — serve the site over http(s).", err);
    }
    paintBarcodes();
    splitHero();
    await document.fonts.ready;
    fitAll();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(fitAll, 120); });
    observe();
    await loaderDone;
    document.body.classList.add("ready");
    runStatus();
  }
  boot();
})();
