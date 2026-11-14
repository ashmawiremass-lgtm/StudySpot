/* =========================================================
   StudySpot – Study Room Booking | External JavaScript
   1 data · 2 helpers · 3 master page · 4 booking · 5 forms · 6 start-up
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   1. Data
   --------------------------------------------------------- */
const OPEN_HOUR = 8;     // 08:00
const CLOSE_HOUR = 22;   // 22:00

const ROOM_TYPES = {
  pod:     { label: "Quiet pod",        who: "1–2 people", img: "images/room-pod.jpg",
             text: "A small silent pod for focused solo study or a one-to-one session." },
  study:   { label: "Group study room", who: "4–6 people", img: "images/room-study.jpg",
             text: "A whiteboard room for project teams and exam revision groups." },
  meeting: { label: "Meeting room",     who: "8–12 people", img: "images/room-meeting.jpg",
             text: "A large room with a screen for presentations and club meetings." }
};

const ROOMS = [
  { id: "L110",  name: "Pod L110",   type: "pod",     seats: 2,  floor: 1, building: "Library",    tools: "Silent, power outlets" },
  { id: "L112",  name: "Pod L112",   type: "pod",     seats: 2,  floor: 1, building: "Library",    tools: "Silent, reading lamp" },
  { id: "L215",  name: "Room L215",  type: "study",   seats: 6,  floor: 2, building: "Library",    tools: "Whiteboard, Wi-Fi" },
  { id: "NB207", name: "Room NB207", type: "study",   seats: 4,  floor: 2, building: "North Bldg", tools: "Whiteboard, Wi-Fi" },
  { id: "NB210", name: "Room NB210", type: "study",   seats: 6,  floor: 2, building: "North Bldg", tools: "Whiteboard, screen" },
  { id: "NB301", name: "Hall NB301", type: "meeting", seats: 10, floor: 3, building: "North Bldg", tools: "Projector, whiteboard" },
  { id: "T101",  name: "Hall T101",  type: "meeting", seats: 12, floor: 1, building: "Technology", tools: "Smart screen, PCs" },
  { id: "T204",  name: "Room T204",  type: "meeting", seats: 8,  floor: 2, building: "Technology", tools: "Smart TV, Wi-Fi" }
];

const STORE = {
  users: "studyspot_users",
  session: "studyspot_session",
  bookings: "studyspot_bookings",
  search: "studyspot_search",      // last search (type, duration, date)
  pending: "studyspot_pending"     // room + time chosen before logging in
};

/* Buildings shown on the map (edit the query text to point at the exact place) */
const BUILDINGS = {
  "Library":    { query: "King Abdulaziz University Library, Jeddah",           note: "Quiet pods L110 and L112, group room L215." },
  "North Bldg": { query: "King Abdulaziz University North Building, Jeddah",    note: "Group rooms NB207 and NB210, meeting hall NB301." },
  "Technology": { query: "King Abdulaziz University Technology Building, Jeddah", note: "Meeting rooms T101 and T204." }
};

/* ---------------------------------------------------------
   2. Helpers
   --------------------------------------------------------- */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* storage blocked – page still works */ }
}

function $(selector, scope) { return (scope || document).querySelector(selector); }
function $all(selector, scope) { return Array.from((scope || document).querySelectorAll(selector)); }

function pad(n) { return String(n).padStart(2, "0"); }

function toISO(date) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function prettyDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

function hourLabel(h) { return pad(h) + ":00"; }

function showToast(message) {
  let toast = $("#toast");
  if (!toast) {
    toast = document.createElement("div");      // dynamic element
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { toast.classList.remove("show"); }, 2800);
}

function seedDemoUser() {
  const users = load(STORE.users, []);
  if (users.length === 0) {
    users.push({
      name: "Demo Student",
      studentId: "2000000",
      email: "demo@stu.kau.edu.sa",
      phone: "0500000000",
      password: "Demo@1234"
    });
    save(STORE.users, users);
  }
}

/* ---------------------------------------------------------
   3. Master page behaviour (every page)
   --------------------------------------------------------- */
function initMenu() {
  const toggle = $(".menu-toggle");
  const nav = $("#main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "✕" : "☰";
  });
}

function markActiveLink() {
  const page = location.pathname.split("/").pop() || "index.html";
  $all(".menu a").forEach(function (link) {
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
}

function updateAuthLinks() {
  const session = load(STORE.session, null);
  const loginLink = $('.menu a[href="login.html"]');
  const signupLink = $('.menu a[href="signup.html"]');
  if (!session || !loginLink || !signupLink) return;
  loginLink.textContent = "Hi, " + session.name.split(" ")[0];
  loginLink.removeAttribute("href");
  signupLink.textContent = "Logout";
  signupLink.setAttribute("href", "#");
  signupLink.addEventListener("click", function (event) {
    event.preventDefault();
    localStorage.removeItem(STORE.session);
    location.href = "index.html";
  });
}

/* Keep image-map hot spots aligned when the picture is resized */
function fitImageMaps() {
  $all("img[usemap]").forEach(function (img) {
    const map = $(img.getAttribute("usemap"));
    const originalWidth = Number(img.dataset.origWidth) || 640;
    if (!map || !img.clientWidth) return;
    const ratio = img.clientWidth / originalWidth;
    $all("area", map).forEach(function (area) {
      if (!area.dataset.coords) area.dataset.coords = area.getAttribute("coords");
      const scaled = area.dataset.coords.split(",").map(function (n) {
        return Math.round(Number(n) * ratio);
      });
      area.setAttribute("coords", scaled.join(","));
    });
  });
}

function setFooterYear() {
  const el = $("#year");
  if (el) el.textContent = new Date().getFullYear();
}

/* Animated numbers (About page) – uses a while loop */
function initCounters() {
  const counters = $all("[data-count]");
  let i = 0;
  while (i < counters.length) {
    (function (el) {
      const target = Number(el.dataset.count);
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 20));
      const timer = setInterval(function () {
        current = Math.min(target, current + step);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 60);
    })(counters[i]);
    i++;
  }
}

/* ---------------------------------------------------------
   4. Booking (home page)
   Flow:  1 search  →  2 pick a time  →  3 confirm  →  My bookings
   --------------------------------------------------------- */
const appState = { search: null, pending: null };

function allBookings() { return load(STORE.bookings, []); }
function currentUser() { return load(STORE.session, null); }
function myBookings() {
  const user = currentUser();
  if (!user) return [];
  return allBookings().filter(function (b) { return b.owner === user.email; });
}

/* Slots taken by other students (simulated, always the same for a room/day/hour) */
function seededBusy(roomId, iso, hour) {
  let sum = 0;
  for (let i = 0; i < roomId.length; i++) sum += roomId.charCodeAt(i);
  return (sum + Number(iso.slice(-2)) * 3 + hour * 7) % 5 === 0;
}

function hourTaken(roomId, iso, hour) {
  if (seededBusy(roomId, iso, hour)) return true;
  return allBookings().some(function (b) {
    return b.roomId === roomId && b.date === iso && hour >= b.start && hour < b.start + b.dur;
  });
}

/* Start times that fit the chosen duration */
function availableStarts(roomId, iso, dur) {
  const starts = [];
  const now = new Date();
  const isToday = iso === toISO(now);
  for (let s = OPEN_HOUR; s + dur <= CLOSE_HOUR; s++) {
    if (isToday && s <= now.getHours()) continue;      // already started
    let free = true;
    for (let h = s; h < s + dur; h++) {
      if (hourTaken(roomId, iso, h)) { free = false; break; }
    }
    if (free) starts.push(s);
  }
  return starts;
}

function roomById(id) {
  return ROOMS.find(function (r) { return r.id === id; });
}

function showSearchError(text) {
  const box = $("#searchError");
  if (box) box.textContent = text;
}

function updateTypeHint() {
  const sel = $("#roomType");
  const hint = $("#typeHint");
  if (!sel || !hint) return;
  const info = ROOM_TYPES[sel.value];
  if (!info) { hint.hidden = true; return; }
  hint.hidden = false;
  $("#typeHintImg").src = info.img;
  $("#typeHintImg").alt = info.label;
  $("#typeHintText").textContent = info.label + " · " + info.who + ". " + info.text;
}

function runSearch() {
  const type = $("#roomType").value;
  const dur = Number($("#duration").value);
  const iso = $("#searchDate").value;
  showSearchError("");

  if (!iso) { showSearchError("Please choose a date."); return false; }
  if (iso < toISO(new Date())) { showSearchError("That date has passed. Choose today or a later date."); return false; }

  appState.search = { type: type, dur: dur, iso: iso };
  save(STORE.search, appState.search);
  renderResults();
  $("#results").scrollIntoView({ behavior: "smooth" });
  return true;
}

function renderResults() {
  const s = appState.search;
  const grid = $("#roomGrid");
  const msg = $("#resultMsg");
  if (!s || !grid) return;
  grid.innerHTML = "";

  const matches = ROOMS.filter(function (r) { return s.type === "any" || r.type === s.type; });
  let shown = 0;

  matches.forEach(function (room) {
    const starts = availableStarts(room.id, s.iso, s.dur);
    if (starts.length === 0) return;
    shown++;
    const info = ROOM_TYPES[room.type];
    const card = document.createElement("article");
    card.className = "room-card";
    card.innerHTML =
      '<img src="' + info.img + '" alt="' + info.label + ' ' + room.id + '">' +
      '<div class="room-body">' +
        '<div class="room-head"><h3>' + room.name + '</h3><span class="badge">' + room.seats + ' seats</span></div>' +
        '<p class="room-meta">' + room.building + ' · Floor ' + room.floor + ' · ' + room.tools + '</p>' +
        '<button type="button" class="map-btn">📍 Show on map</button>' +
        '<p class="times-label">Free start times</p>' +
        '<div class="time-chips"></div>' +
      '</div>';

    const chips = $(".time-chips", card);
    $(".map-btn", card).addEventListener("click", function () { showBuilding(room.building, true); });
    const LIMIT = 4;
    function addChip(hour) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "time-chip";
      b.textContent = hourLabel(hour);
      b.addEventListener("click", function () { openModal(room, hour); });
      chips.appendChild(b);
    }
    starts.slice(0, LIMIT).forEach(addChip);
    if (starts.length > LIMIT) {
      const more = document.createElement("button");
      more.type = "button";
      more.className = "more-btn";
      more.textContent = "+" + (starts.length - LIMIT) + " more";
      more.addEventListener("click", function () {
        more.remove();
        starts.slice(LIMIT).forEach(addChip);
      });
      chips.appendChild(more);
    }
    grid.appendChild(card);
  });

  const durText = s.dur + (s.dur === 1 ? " hour" : " hours");
  if (shown === 0) {
    msg.innerHTML = "";
    grid.innerHTML = '<div class="empty-box">No rooms are free for <strong>' + durText + '</strong> on ' +
      prettyDate(s.iso) + '. Try another date or a shorter time.</div>';
  } else {
    msg.innerHTML = "<strong>" + shown + " room" + (shown === 1 ? "" : "s") + "</strong> free for " + durText +
      " on <strong>" + prettyDate(s.iso) + "</strong>. Tap a start time to book.";
  }
}

function renderRoomTable() {
  const body = $("#roomTableBody");
  if (!body) return;
  body.innerHTML = "";
  for (let i = 0; i < ROOMS.length; i++) {
    const r = ROOMS[i];
    const row = document.createElement("tr");
    row.innerHTML = "<td>" + r.id + "</td><td>" + ROOM_TYPES[r.type].label + "</td><td>" + r.seats +
      "</td><td>" + r.building + ", floor " + r.floor + "</td><td>" + r.tools + "</td>";
    body.appendChild(row);
  }
}

function renderMyBookings() {
  const body = $("#bookingBody");
  if (!body) return;
  body.innerHTML = "";
  if (!currentUser()) {
    body.innerHTML = '<tr class="empty-row"><td colspan="5">Log in to see your bookings. <a href="login.html">Login</a></td></tr>';
    return;
  }
  const list = myBookings().slice().sort(function (x, y) {
    return (x.date + pad(x.start)).localeCompare(y.date + pad(y.start));
  });
  if (list.length === 0) {
    body.innerHTML = '<tr class="empty-row"><td colspan="5">No bookings yet. Use the search above to book your first room.</td></tr>';
    return;
  }
  list.forEach(function (b) {
    const room = roomById(b.roomId);
    const row = document.createElement("tr");
    row.innerHTML = "<td>" + room.name + "</td><td>" + prettyDate(b.date) + "</td><td>" +
      hourLabel(b.start) + " – " + hourLabel(b.start + b.dur) +
      (b.remind ? ' <span class="badge">⏰ ' + b.remind + " min</span>" : "") +
      "</td><td>" + room.building + '</td><td class="row-actions"></td>';
    const cell = row.lastElementChild;

    function addBtn(label, cls, handler) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = cls;
      btn.textContent = label;
      btn.addEventListener("click", handler);
      cell.appendChild(btn);
    }
    addBtn("Calendar", "mini-btn", function () { downloadICS(b); });
    addBtn("Map", "mini-btn", function () { showBuilding(room.building, true); });
    addBtn("Cancel", "cancel-btn", function () {
      const all = allBookings().filter(function (x) { return x.id !== b.id; });
      save(STORE.bookings, all);
      showToast("Booking cancelled");
      renderMyBookings();
      checkReminders();
      if (appState.search) renderResults();
    });
    body.appendChild(row);
  });
}

/* --- confirm modal --- */
function openModal(room, hour) {
  const s = appState.search;
  if (!currentUser()) {
    // remember the chosen room and time so nothing has to be picked again after login
    save(STORE.pending, { roomId: room.id, date: s.iso, start: hour, dur: s.dur });
    showToast("Log in to finish — we saved " + room.name + " at " + hourLabel(hour));
    setTimeout(function () { location.href = "login.html"; }, 1500);
    return;
  }
  appState.pending = { roomId: room.id, date: s.iso, start: hour, dur: s.dur };
  $("#mRoom").textContent = room.name + " · " + room.building;
  $("#mDate").textContent = prettyDate(s.iso);
  $("#mTime").textContent = hourLabel(hour) + " – " + hourLabel(hour + s.dur);
  $("#mSeats").textContent = room.seats + " people";
  if ($("#mRemind")) { $("#mRemind").checked = true; $("#mRemindMin").value = "15"; }
  $("#modalBackdrop").classList.add("show");
}

function closeModal() { $("#modalBackdrop").classList.remove("show"); }

function confirmBooking() {
  const p = appState.pending;
  if (!p) return;
  for (let h = p.start; h < p.start + p.dur; h++) {
    if (hourTaken(p.roomId, p.date, h)) {
      closeModal();
      showToast("Sorry, that time was just taken");
      renderResults();
      return;
    }
  }
  const user = currentUser();
  if (!user) { closeModal(); showToast("Please log in again"); return; }
  const wantsRemind = $("#mRemind") && $("#mRemind").checked;
  const remind = wantsRemind ? Number($("#mRemindMin").value) : 0;
  if (remind && "Notification" in window && Notification.permission === "default") {
    try { Notification.requestPermission(); } catch (e) { /* ignore */ }
  }
  const all = allBookings();
  all.push({
    id: "b" + Date.now() + Math.floor(Math.random() * 1000),
    owner: user.email, roomId: p.roomId, date: p.date, start: p.start, dur: p.dur,
    remind: remind, notified: false
  });
  save(STORE.bookings, all);
  closeModal();
  showToast("Booked " + roomById(p.roomId).name + " ✔" + (remind ? " · reminder " + remind + " min before" : ""));
  checkReminders();
  renderMyBookings();
  renderResults();
  $("#bookings").scrollIntoView({ behavior: "smooth" });
}

function initBooking() {
  const form = $("#searchForm");
  if (!form) return;

  const dateInput = $("#searchDate");
  const today = toISO(new Date());
  const last = new Date();
  last.setDate(last.getDate() + 14);
  dateInput.min = today;
  dateInput.max = toISO(last);

  // restore the last choices (they survive reloads and the login redirect)
  const saved = load(STORE.search, null);
  let start = { type: "any", dur: 1, iso: today };
  if (saved && (saved.type === "any" || ROOM_TYPES[saved.type]) && saved.dur >= 1 && saved.dur <= 3) {
    start = { type: saved.type, dur: saved.dur, iso: saved.iso >= today && saved.iso <= toISO(last) ? saved.iso : today };
  }
  $("#roomType").value = start.type;
  $("#duration").value = String(start.dur);
  dateInput.value = start.iso;

  // show some results straight away (any room, 1 hour, today)
  appState.search = start;
  ["#roomType", "#duration", "#searchDate"].forEach(function (sel) {
    $(sel).addEventListener("change", saveFormState);
  });

  $("#roomType").addEventListener("change", updateTypeHint);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch();
  });

  $("#modalClose").addEventListener("click", closeModal);
  $("#modalCancel").addEventListener("click", closeModal);
  $("#modalConfirm").addEventListener("click", confirmBooking);
  $("#modalBackdrop").addEventListener("click", function (event) {
    if (event.target.id === "modalBackdrop") closeModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeModal();
  });

  updateTypeHint();
  renderRoomTable();
  renderMyBookings();
  renderResults();
  initMap();
  resumePending();
}

/* ---------------------------------------------------------
   5. Forms (login + sign-up)
   --------------------------------------------------------- */
function setFieldState(input, ok, message) {
  const group = input.closest(".form-group");
  if (!group) return ok;
  const err = $(".error-msg", group);
  group.classList.toggle("invalid", !ok);
  group.classList.toggle("valid", ok);
  if (err) err.textContent = ok ? "" : message;
  return ok;
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

function showAlert(box, type, message) {
  box.className = "alert " + type + " show";
  box.textContent = message;
}

function initPasswordToggles() {
  $all(".pw-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const input = $("#" + btn.dataset.target);
      const hidden = input.type === "password";
      input.type = hidden ? "text" : "password";
      btn.textContent = hidden ? "🙈" : "👁";
    });
  });
}

function initLogin() {
  const form = $("#loginForm");
  if (!form) return;
  const email = $("#loginEmail");
  const password = $("#loginPassword");
  const alertBox = $("#loginAlert");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    alertBox.className = "alert";
    const emailVal = email.value.trim().toLowerCase();

    const okEmail = setFieldState(email, validEmail(emailVal), "Enter a valid email address.");
    const okPass = setFieldState(password, password.value.length >= 8, "Password must be at least 8 characters.");
    if (!okEmail || !okPass) return;

    const users = load(STORE.users, []);
    let found = null;
    for (let i = 0; i < users.length; i++) {
      if (users[i].email === emailVal && users[i].password === password.value) {
        found = users[i];
        break;
      }
    }

    if (found) {
      save(STORE.session, { name: found.name, email: found.email });
      const resume = load(STORE.pending, null);
      showAlert(alertBox, "success", "Welcome back, " + found.name.split(" ")[0] +
        (resume ? "! Taking you back to your room…" : "! Redirecting…"));
      setTimeout(function () { location.href = resume ? "index.html#results" : "index.html"; }, 1100);
    } else {
      showAlert(alertBox, "error", "Email or password is incorrect. New here? Create an account first.");
    }
  });

  email.addEventListener("input", function () {
    if (email.value) setFieldState(email, validEmail(email.value.trim()), "Enter a valid email address.");
  });
}

const PASSWORD_RULES = [
  { id: "len",    test: function (v) { return v.length >= 8; } },
  { id: "upper",  test: function (v) { return /[A-Z]/.test(v); } },
  { id: "lower",  test: function (v) { return /[a-z]/.test(v); } },
  { id: "digit",  test: function (v) { return /\d/.test(v); } },
  { id: "symbol", test: function (v) { return /[^A-Za-z0-9]/.test(v); } }
];

function updateStrength(value) {
  let passed = 0;
  PASSWORD_RULES.forEach(function (rule) {
    const li = $("#rule-" + rule.id);
    const ok = rule.test(value);
    if (ok) passed++;
    if (li) li.classList.toggle("ok", ok);
  });
  const bar = $("#strengthBar");
  if (bar) {
    bar.style.width = (passed / PASSWORD_RULES.length) * 100 + "%";
    if (passed <= 2) bar.style.background = "#c8402f";
    else if (passed <= 4) bar.style.background = "#f58a25";
    else bar.style.background = "#2e8b57";
  }
  return passed;
}

function initSignup() {
  const form = $("#signupForm");
  if (!form) return;
  const f = {
    name: $("#suName"), id: $("#suId"), email: $("#suEmail"), phone: $("#suPhone"),
    pass: $("#suPassword"), confirm: $("#suConfirm"), terms: $("#suTerms")
  };
  const alertBox = $("#signupAlert");

  f.pass.addEventListener("input", function () { updateStrength(f.pass.value); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    alertBox.className = "alert";
    const checks = [];

    checks.push(setFieldState(f.name, f.name.value.trim().split(/\s+/).length >= 2 && f.name.value.trim().length >= 5,
      "Enter your full name (first and last)."));
    checks.push(setFieldState(f.id, /^\d{7}$/.test(f.id.value.trim()), "Student ID must be exactly 7 digits."));
    checks.push(setFieldState(f.email, validEmail(f.email.value.trim()) && /@(stu\.)?kau\.edu\.sa$/i.test(f.email.value.trim()),
      "Use your KAU email (…@stu.kau.edu.sa)."));
    checks.push(setFieldState(f.phone, /^05\d{8}$/.test(f.phone.value.trim()), "Phone must be 10 digits and start with 05."));
    checks.push(setFieldState(f.pass, updateStrength(f.pass.value) === PASSWORD_RULES.length,
      "Password does not meet all the rules below."));
    checks.push(setFieldState(f.confirm, f.confirm.value !== "" && f.confirm.value === f.pass.value, "Passwords do not match."));

    const termsOk = f.terms.checked;
    $(".error-msg", f.terms.closest(".form-group")).textContent = termsOk ? "" : "You must accept the terms to continue.";
    checks.push(termsOk);

    if (checks.indexOf(false) !== -1) {
      showAlert(alertBox, "error", "Please fix the highlighted fields.");
      return;
    }

    const users = load(STORE.users, []);
    const emailVal = f.email.value.trim().toLowerCase();
    if (users.some(function (u) { return u.email === emailVal; })) {
      setFieldState(f.email, false, "This email is already registered.");
      showAlert(alertBox, "error", "An account with this email already exists.");
      return;
    }

    users.push({
      name: f.name.value.trim(),
      studentId: f.id.value.trim(),
      email: emailVal,
      phone: f.phone.value.trim(),
      password: f.pass.value
    });
    save(STORE.users, users);
    showAlert(alertBox, "success", "Account created! Taking you to the login page…");
    form.reset();
    updateStrength("");
    setTimeout(function () { location.href = "login.html"; }, 1400);
  });
}

/* ---------------------------------------------------------
   5b. Saved choices, map, reminders
   --------------------------------------------------------- */
function drop(key) {
  try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function saveFormState() {
  const type = $("#roomType"), dur = $("#duration"), date = $("#searchDate");
  if (!type || !dur || !date || !date.value) return;
  save(STORE.search, { type: type.value, dur: Number(dur.value), iso: date.value });
}

/* After login: reopen the confirm window for the room chosen before logging in */
function resumePending() {
  const p = load(STORE.pending, null);
  if (!p || !$("#searchForm") || !currentUser()) return;
  drop(STORE.pending);
  const room = roomById(p.roomId);
  if (!room || p.date < toISO(new Date())) {
    showToast("Your saved room is no longer available. Please search again.");
    return;
  }
  appState.search = { type: "any", dur: p.dur, iso: p.date };
  $("#roomType").value = "any";
  $("#duration").value = String(p.dur);
  $("#searchDate").value = p.date;
  save(STORE.search, appState.search);
  updateTypeHint();
  renderResults();
  if (availableStarts(room.id, p.date, p.dur).indexOf(p.start) === -1) {
    showToast("That time was just taken. Pick another start time for " + room.name + ".");
    return;
  }
  openModal(room, p.start);
}

/* Google Maps */
function showBuilding(name, scrollToMap) {
  const info = BUILDINGS[name];
  const frame = $("#mapFrame");
  if (!info || !frame) return;
  frame.src = "https://www.google.com/maps?q=" + encodeURIComponent(info.query) + "&output=embed";
  $("#mapTitle").textContent = name;
  $("#mapNote").textContent = info.note;
  $("#mapDirections").href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(info.query);
  $("#mapOpen").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(info.query);
  $all(".map-chip").forEach(function (chip) {
    chip.classList.toggle("active", chip.dataset.building === name);
  });
  if (scrollToMap) $("#map").scrollIntoView({ behavior: "smooth" });
}

function initMap() {
  const box = $("#mapChips");
  if (!box) return;
  Object.keys(BUILDINGS).forEach(function (name) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "map-chip";
    chip.dataset.building = name;
    chip.textContent = name;
    chip.addEventListener("click", function () { showBuilding(name, false); });
    box.appendChild(chip);
  });
  showBuilding("Library", false);
}

/* Reminders: banner on every page, optional browser notification, calendar file */
function bookingStart(b) {
  const d = new Date(b.date + "T00:00:00");
  d.setHours(b.start, 0, 0, 0);
  return d;
}
function bookingEnd(b) { return new Date(bookingStart(b).getTime() + b.dur * 3600000); }

function fireReminder(b) {
  const room = roomById(b.roomId);
  if (!room) return;
  const msg = room.name + " starts at " + hourLabel(b.start) + " (" + room.building + ", floor " + room.floor + ")";
  showToast("⏰ Reminder: " + msg);
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("StudySpot reminder", { body: msg, icon: "images/icon-192.png" });
    }
  } catch (e) { /* notifications are optional */ }
}

function renderReminderBar(next, now) {
  let bar = $("#reminderBar");
  if (!next || !roomById(next.roomId)) { if (bar) bar.hidden = true; return; }

  const room = roomById(next.roomId);
  const start = bookingStart(next);
  const mins = Math.round((start - now) / 60000);
  let text, soon = false;
  if (now >= start) {
    text = "Your booking is in progress: " + room.name + ", until " + hourLabel(next.start + next.dur);
    soon = true;
  } else if (mins <= 60) {
    text = "⏰ " + room.name + " starts in " + mins + " min (" + hourLabel(next.start) + ")";
    soon = true;
  } else {
    const when = next.date === toISO(now) ? "today" : prettyDate(next.date);
    text = "📅 Next booking: " + room.name + " · " + when + ", " + hourLabel(next.start) + " – " + hourLabel(next.start + next.dur);
  }

  const key = (next.id || next.roomId + next.date + next.start) + (soon ? "-soon" : "");
  let hiddenKey = null;
  try { hiddenKey = sessionStorage.getItem("studyspot_bar_closed"); } catch (e) { /* ignore */ }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "reminderBar";
    bar.className = "reminder-bar";
    bar.setAttribute("role", "status");
    bar.innerHTML = '<span class="rb-text"></span><a href="index.html#bookings">View</a>' +
      '<button type="button" class="rb-close" aria-label="Dismiss reminder">×</button>';
    const header = $(".site-header");
    if (header) header.insertAdjacentElement("afterend", bar); else document.body.prepend(bar);
    $(".rb-close", bar).addEventListener("click", function () {
      bar.hidden = true;
      try { sessionStorage.setItem("studyspot_bar_closed", bar.dataset.key); } catch (e) { /* ignore */ }
    });
  }
  bar.dataset.key = key;
  $(".rb-text", bar).textContent = text;
  bar.classList.toggle("soon", soon);
  bar.hidden = hiddenKey === key;
}

function checkReminders() {
  const user = currentUser();
  if (!user) { renderReminderBar(null, new Date()); return; }
  const now = new Date();
  const all = allBookings();
  let changed = false;
  all.forEach(function (b) {
    if (b.owner !== user.email || !b.remind || b.notified) return;
    const due = new Date(bookingStart(b).getTime() - b.remind * 60000);
    if (now >= due && now < bookingEnd(b)) {
      b.notified = true;
      changed = true;
      fireReminder(b);
    }
  });
  if (changed) save(STORE.bookings, all);
  const upcoming = all.filter(function (b) { return b.owner === user.email && bookingEnd(b) > now; })
    .sort(function (x, y) { return bookingStart(x) - bookingStart(y); });
  renderReminderBar(upcoming[0], now);
}

function downloadICS(b) {
  const room = roomById(b.roomId);
  const f = function (d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  };
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//StudySpot//Room booking//EN", "BEGIN:VEVENT",
    "UID:" + (b.id || b.roomId + b.date + b.start) + "@studyspot",
    "DTSTAMP:" + stamp, "DTSTART:" + f(bookingStart(b)), "DTEND:" + f(bookingEnd(b)),
    "SUMMARY:Study room " + room.name,
    "LOCATION:" + room.building + "\\, floor " + room.floor + "\\, King Abdulaziz University",
    "DESCRIPTION:Booked with StudySpot",
    "BEGIN:VALARM", "TRIGGER:-PT" + (b.remind || 15) + "M", "ACTION:DISPLAY", "DESCRIPTION:Your study room starts soon", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR"
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "studyspot-" + room.id + ".ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Calendar file downloaded");
}

function initReminders() {
  checkReminders();
  setInterval(checkReminders, 30000);
}

/* Stop the browser drawing a focus box on the clickable picture (the "white square") */
function calmImageMaps() {
  $all("area").forEach(function (area) {
    area.addEventListener("mousedown", function (event) { event.preventDefault(); });
    area.addEventListener("focus", function () { area.blur(); });
  });
}
window.addEventListener("pageshow", function () {
  if (document.activeElement && document.activeElement.tagName === "AREA") document.activeElement.blur();
});

/* ---------------------------------------------------------
   6. Start-up
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  seedDemoUser();
  initMenu();
  markActiveLink();
  updateAuthLinks();
  setFooterYear();
  initBooking();
  initPasswordToggles();
  initLogin();
  initSignup();
  initCounters();
  initReminders();
  calmImageMaps();
});

window.addEventListener("load", fitImageMaps);
window.addEventListener("resize", fitImageMaps);
