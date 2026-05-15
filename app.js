// ============================================================
// MEDIROUTE — AI-POWERED EMERGENCY HEALTHCARE SIMULATION
// ============================================================

// ---- EXTENDED HOSPITAL DATA ----
const hospitals = [
  {
    id: 1,
    name: "City Central Hospital",
    distance: "0.4 km", distanceNum: 0.4,
    availability: "Available", load: 62,
    price: "Low", type: "Public",
    insurance: true,
    services: ["General Bed", "ICU", "Emergency"],
    beds: { general: 12, icu: 3, oxygen: 8 },
    address: "12 Central Avenue, Downtown",
    phone: "+1 (555) 100-2000",
    rating: "4.6", waitTime: "~8 min", waitNum: 8,
    ambulance: { id: "AMB-1041", driver: "Marcus T.", eta: "~6 min" }
  },
  {
    id: 2,
    name: "Mercy General Medical Center",
    distance: "1.1 km", distanceNum: 1.1,
    availability: "Available", load: 74,
    price: "Low", type: "Public",
    insurance: true,
    services: ["General Bed", "Emergency"],
    beds: { general: 7, icu: 0, oxygen: 4 },
    address: "88 Mercy Road, Westside",
    phone: "+1 (555) 200-3100",
    rating: "4.3", waitTime: "~15 min", waitNum: 15,
    ambulance: { id: "AMB-2033", driver: "Priya S.", eta: "~12 min" }
  },
  {
    id: 3,
    name: "Unity Health Institute",
    distance: "1.9 km", distanceNum: 1.9,
    availability: "Available", load: 48,
    price: "Mid", type: "Private",
    insurance: true,
    services: ["General Bed", "ICU", "Emergency"],
    beds: { general: 5, icu: 2, oxygen: 6 },
    address: "45 Unity Boulevard, Midtown",
    phone: "+1 (555) 300-4200",
    rating: "4.8", waitTime: "~5 min", waitNum: 5,
    ambulance: { id: "AMB-3017", driver: "James K.", eta: "~9 min" }
  },
  {
    id: 4,
    name: "St. Jude Trauma Center",
    distance: "0.2 km", distanceNum: 0.2,
    availability: "Busy", load: 91,
    price: "High", type: "Private",
    insurance: false,
    services: ["General Bed", "ICU", "Emergency"],
    beds: { general: 2, icu: 1, oxygen: 2 },
    address: "7 Jude Street, Northpark",
    phone: "+1 (555) 400-5300",
    rating: "4.9", waitTime: "~22 min", waitNum: 22,
    ambulance: { id: "AMB-4009", driver: "Chen W.", eta: "~4 min" }
  },
  {
    id: 5,
    name: "North Star Medical",
    distance: "3.5 km", distanceNum: 3.5,
    availability: "Available", load: 35,
    price: "Mid", type: "Private",
    insurance: true,
    services: ["General Bed", "ICU"],
    beds: { general: 9, icu: 4, oxygen: 10 },
    address: "200 North Star Lane, Uptown",
    phone: "+1 (555) 500-6400",
    rating: "4.5", waitTime: "~10 min", waitNum: 10,
    ambulance: { id: "AMB-5022", driver: "Aisha R.", eta: "~18 min" }
  },
  {
    id: 6,
    name: "Riverside Community Clinic",
    distance: "2.3 km", distanceNum: 2.3,
    availability: "Full", load: 100,
    price: "Low", type: "Public",
    insurance: true,
    services: ["General Bed"],
    beds: { general: 0, icu: 0, oxygen: 0 },
    address: "33 River Road, Eastside",
    phone: "+1 (555) 600-7500",
    rating: "4.1", waitTime: "N/A", waitNum: 999,
    ambulance: { id: "AMB-6011", driver: "N/A", eta: "N/A" }
  },
  {
    id: 7,
    name: "Apex Specialty Hospital",
    distance: "4.8 km", distanceNum: 4.8,
    availability: "Available", load: 28,
    price: "High", type: "Private",
    insurance: true,
    services: ["General Bed", "ICU", "Emergency"],
    beds: { general: 15, icu: 8, oxygen: 12 },
    address: "99 Apex Tower, Financial District",
    phone: "+1 (555) 700-8600",
    rating: "5.0", waitTime: "~3 min", waitNum: 3,
    ambulance: { id: "AMB-7005", driver: "Sofia L.", eta: "~20 min" }
  }
];

// ---- STATE ----
let currentScreen = "screen-home";
let previousResultsScreen = "screen-results";
let formData = { location: "" };
let bookingHospitalId = null;
let aiRecommendedId = null;

// ============================================================
// AI SCORING ENGINE
// Severity is determined INTERNALLY — never from user input.
// Internal rule: if any hospital has ICU beds free → treat as
// potential critical case and weight ICU availability higher.
// Weights: availability > load > distance > wait > cost
// ============================================================
function _inferSeverity() {
  // Simulate triage: if majority of nearby hospitals are busy/full → Red
  const busyCount = hospitals.filter(h => h.availability !== "Available").length;
  if (busyCount >= hospitals.length * 0.6) return "Red";
  if (busyCount >= hospitals.length * 0.35) return "Yellow";
  return "Green";
}

function scoreHospital(h, severity) {
  if (h.availability === "Full") return -1;

  let score = 100;

  // Load penalty
  score -= h.load * 0.4;
  // Distance penalty
  score -= h.distanceNum * 6;
  // Wait time penalty
  if (h.waitNum < 999) score -= h.waitNum * 0.8;

  // Severity-specific logic (internal)
  if (severity === "Red") {
    if (!h.services.includes("ICU")) score -= 40;
    if (!h.services.includes("Emergency")) score -= 30;
    if (h.availability === "Busy") score -= 25;
    if (h.beds.icu > 0) score += 20;
  } else if (severity === "Yellow") {
    if (h.availability === "Busy") score -= 10;
  }

  // Rating bonus
  score += parseFloat(h.rating) * 2;

  return score;
}

function getAIRecommendation() {
  const severity = _inferSeverity();
  const scored = hospitals
    .map(h => ({ h, score: scoreHospital(h, severity) }))
    .filter(x => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  return scored.length ? scored[0].h : null;
}

// ---- NAVIGATION ----
// Screens where the FAB must be hidden
const _FAB_HIDDEN_SCREENS = new Set([
  "screen-hospitals", "screen-detail", "screen-tracking",
  "screen-map", "screen-form", "screen-results",
  "screen-billing", "screen-payment", "screen-paylater",
  "screen-dashboard", "screen-analytics",
  "screen-profile", "screen-edit-profile", "screen-history",
  "screen-about", "screen-how", "screen-settings",
  "screen-terms", "screen-privacy",
]);

function navigate(screenId) {
  document.getElementById(currentScreen).classList.remove("active");
  document.getElementById(screenId).classList.add("active");
  currentScreen = screenId;
  window.scrollTo(0, 0);
  const fab = document.getElementById("fab-emergency");
  if (fab) fab.style.display = _FAB_HIDDEN_SCREENS.has(screenId) ? "none" : "flex";
}

// ---- POPUP ----
function openConfirmPopup() {
  document.getElementById("confirm-overlay").classList.remove("hidden");
}
function closeConfirmPopup() {
  document.getElementById("confirm-overlay").classList.add("hidden");
}
function confirmEmergency() {
  closeConfirmPopup();
  navigate("screen-form");
  // Auto-detect location silently
  useCurrentLocation();
}

// ---- LOCATION ----
function useCurrentLocation() {
  const status = document.getElementById("location-status");
  const input = document.getElementById("location-input");
  status.textContent = "Detecting location...";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {
        input.value = "Current Location (GPS)";
        status.textContent = "Location detected successfully.";
      },
      () => {
        input.value = "Downtown Medical District";
        status.textContent = "Could not access GPS. Using default area.";
      }
    );
  } else {
    input.value = "Downtown Medical District";
    status.textContent = "Geolocation not supported. Using default area.";
  }
}

// ---- PILL SELECTION (explore/detail screens only) ----
function selectPill(el) {
  const group = el.dataset.group;
  document.querySelectorAll(`.pill[data-group="${group}"]`).forEach(p => p.classList.remove("selected"));
  el.classList.add("selected");
}

// ---- EMERGENCY SUBMIT (one-tap, no user classification) ----
function submitEmergency() {
  const location = document.getElementById("location-input").value.trim();
  if (!location) {
    document.getElementById("location-input").focus();
    document.getElementById("location-status").textContent = "Please enter your location to continue.";
    return;
  }
  formData.location = location;
  dispatchEmergency();
}

// ---- EMERGENCY DISPATCH — AI handles everything internally ----
function dispatchEmergency() {
  const severity = _inferSeverity();

  // Score and rank all hospitals internally
  const ranked = hospitals
    .map(h => ({ h, score: scoreHospital(h, severity) }))
    .filter(x => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.h);

  aiRecommendedId = ranked.length ? ranked[0].id : null;

  const meta = document.getElementById("results-meta");
  meta.innerHTML = `
    <span>${ranked.length} hospitals matched near <strong>"${formData.location}"</strong></span>
    <span class="ai-dispatch-badge">AI Dispatched</span>
  `;

  const list = document.getElementById("results-list");
  list.innerHTML = ranked.map((h, i) => buildHospitalCard(h, "screen-results", i === 0)).join("");

  navigate("screen-results");
}

// ---- LEGACY submitForm kept for explore flow compatibility ----
function submitForm() { submitEmergency(); }
function showResults() { dispatchEmergency(); }

// ---- EXPLORE LIST ----
let _activeFilter = null;

function buildExploreList(list) {
  const el = document.getElementById("explore-list");
  el.innerHTML = (list || hospitals).map(h => buildHospitalCard(h, "screen-hospitals", false)).join("");
}

function toggleFilterPanel() {
  const panel = document.getElementById("filter-panel");
  const btn   = document.getElementById("filter-toggle-btn");
  panel.classList.toggle("hidden");
  btn.classList.toggle("filter-toggle-active");
}

function applyFilter(chip) {
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("filter-chip-active"));
  chip.classList.add("filter-chip-active");

  const f = chip.dataset.filter;
  _activeFilter = f;
  let result = [...hospitals];

  if (f === "distance") {
    result = result
      .filter(h => h.availability !== "Full")
      .sort((a, b) => a.distanceNum - b.distanceNum);
  } else if (f === "load") {
    result = result
      .filter(h => h.availability !== "Full")
      .sort((a, b) => a.load - b.load);
  } else if (f === "rating") {
    result = result.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  } else if (f === "Low" || f === "Mid" || f === "High") {
    result = result.filter(h => h.price === f);
  }

  buildExploreList(result);
}

function clearFilter() {
  _activeFilter = null;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("filter-chip-active"));
  buildExploreList();
}

// ---- LOGOUT ----
function handleLogout() {
  closeDrawer();
  if (confirm("Are you sure you want to log out?")) {
    stopTrackingSimulation();
    navigate("screen-home");
  }
}

function buildHospitalCard(h, fromScreen, isRecommended) {
  const badgeClass = h.availability === "Available" ? "badge-available" : h.availability === "Busy" ? "badge-busy" : "badge-full";
  const priceClass = h.price === "Low" ? "price-low" : h.price === "Mid" ? "price-mid" : "price-high";
  const initials = h.name.split(" ").slice(0, 2).map(w => w[0]).join("");
  const loadColor = h.load >= 85 ? "#dc2626" : h.load >= 60 ? "#d97706" : "#16a34a";
  const recBadge = isRecommended ? `<span class="badge badge-ai-rec">AI Pick</span>` : "";
  const ratingVal = parseFloat(h.rating);
  const ratingColor = ratingVal >= 4.7 ? "var(--green)" : ratingVal >= 4.3 ? "#d97706" : "var(--gray-500)";
  return `
    <div class="hospital-card${isRecommended ? " card-recommended" : ""}" onclick="openDetail(${h.id}, '${fromScreen}')">
      <div class="card-img-row">
        <div class="card-img-placeholder">${initials}</div>
        <div class="card-top-info">
          <div class="card-top">
            <div class="card-name">${h.name}</div>
            <div style="display:flex;gap:5px;align-items:center;flex-shrink:0;">
              ${recBadge}
              <span class="badge ${badgeClass}">${h.availability}</span>
            </div>
          </div>
          <div class="card-meta">
            <span class="meta-item">${h.distance}</span>
            <span class="meta-dot"></span>
            <span class="meta-item ${priceClass}">${h.price} Cost</span>
            <span class="meta-dot"></span>
            <span class="meta-item card-rating" style="color:${ratingColor};">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="${ratingColor}" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ${h.rating}
            </span>
          </div>
          <div class="card-load-bar">
            <div class="card-load-fill" style="width:${h.load}%;background:${loadColor};"></div>
          </div>
          <div class="card-load-label">Load: ${h.load}%</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-service-tag">${h.services[0]}${h.services.length > 1 ? " +" + (h.services.length - 1) : ""}</span>
        <div class="card-action-btns" onclick="event.stopPropagation()">
          <button class="card-btn-call" onclick="alert('Calling ${h.name}...')">Call</button>
          <button class="card-btn-book" onclick="openBookPopup(${h.id})">Book</button>
        </div>
      </div>
    </div>
  `;
}

// ---- DETAIL PAGE ----
function openDetail(id, fromScreen) {
  const h = hospitals.find(x => x.id === id);
  if (!h) return;

  previousResultsScreen = fromScreen;
  document.getElementById("detail-back-btn").onclick = () => navigate(fromScreen);

  const availClass = h.availability === "Available" ? "detail-available" : h.availability === "Busy" ? "detail-busy" : "detail-full";
  const loadColor = h.load >= 85 ? "var(--red)" : h.load >= 60 ? "#d97706" : "var(--green)";
  const isRec = h.id === aiRecommendedId;

  // Hospital image colours keyed by id for visual variety
  const _imgColors = ["#dbeafe","#dcfce7","#fef9c3","#fce7f3","#ede9fe","#ffedd5","#f0fdf4"];
  const imgBg = _imgColors[(h.id - 1) % _imgColors.length];
  const imgAccent = ["#2563eb","#16a34a","#ca8a04","#db2777","#7c3aed","#ea580c","#15803d"][(h.id - 1) % 7];
  const initials = h.name.split(" ").slice(0, 2).map(w => w[0]).join("");

  document.getElementById("detail-content").innerHTML = `
    <div class="detail-img-hero" style="background:${imgBg};">
      <div class="detail-img-initials" style="color:${imgAccent};">${initials}</div>
      <div class="detail-img-type-tag">${h.type}</div>
    </div>

    <div class="detail-hero">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div>
          <div class="detail-name">${h.name}</div>
          <div class="detail-type">${h.type} Hospital &bull; ${h.address}</div>
        </div>
        ${isRec ? `<span class="badge badge-ai-rec" style="flex-shrink:0;margin-top:4px;">AI Pick</span>` : ""}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Availability &amp; Capacity</div>
      <div class="detail-row">
        <span class="detail-row-label">Status</span>
        <span class="detail-row-value ${availClass}">${h.availability}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">System Load</span>
        <span class="detail-row-value" style="color:${loadColor};font-weight:700;">${h.load}%</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">General Beds</span>
        <span class="detail-row-value">${h.beds.general} available</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">ICU Beds</span>
        <span class="detail-row-value">${h.beds.icu} available</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Oxygen Beds</span>
        <span class="detail-row-value">${h.beds.oxygen} available</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Est. Wait Time</span>
        <span class="detail-row-value">${h.waitTime}</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Assigned Ambulance</div>
      <div class="detail-row">
        <span class="detail-row-label">Unit ID</span>
        <span class="detail-row-value">${h.ambulance.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Driver</span>
        <span class="detail-row-value">${h.ambulance.driver}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Ambulance ETA</span>
        <span class="detail-row-value" style="color:var(--green);font-weight:700;">${h.ambulance.eta}</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Info</div>
      <div class="detail-row">
        <span class="detail-row-label">Distance</span>
        <span class="detail-row-value">${h.distance}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Cost Category</span>
        <span class="detail-row-value">${h.price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Insurance</span>
        <span class="detail-row-value" style="color:${h.insurance ? "var(--green)" : "var(--red)"};">${h.insurance ? "Accepted" : "Not Accepted"}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Rating</span>
        <span class="detail-row-value">${h.rating} / 5.0</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Services</span>
        <span class="detail-row-value">${h.services.join(", ")}</span>
      </div>
    </div>

    <div class="detail-actions">
      <button class="detail-btn-call" onclick="alert('Calling ${h.name}...')">Call</button>
      <button class="detail-btn-book" onclick="openBookPopup(${h.id})">Book Hospital</button>
    </div>
  `;

  navigate("screen-detail");
}

// ---- BOOKING FLOW ----
function openBookPopup(id) {
  bookingHospitalId = id;
  const h = hospitals.find(x => x.id === id);
  document.getElementById("book-confirm-text").textContent = `Book an ambulance to ${h ? h.name : "this hospital"}?`;
  document.getElementById("book-confirm-overlay").classList.remove("hidden");
}
function closeBookPopup() {
  document.getElementById("book-confirm-overlay").classList.add("hidden");
}
function confirmBooking() {
  closeBookPopup();
  document.getElementById("book-success-overlay").classList.remove("hidden");
}
function goToTracking() {
  document.getElementById("book-success-overlay").classList.add("hidden");
  const h = hospitals.find(x => x.id === bookingHospitalId);

  // Populate all tracking fields
  document.getElementById("tracking-hospital-name").textContent = h ? h.name : "—";
  document.getElementById("tracking-eta").textContent          = h ? h.waitTime : "~8 min";
  document.getElementById("tracking-driver").textContent       = h ? h.ambulance.driver : "—";
  document.getElementById("tracking-vehicle").textContent      = h ? h.ambulance.id : "—";
  document.getElementById("tracking-amb-eta").textContent      = h ? h.ambulance.eta : "—";

  // Seed map screen labels
  document.getElementById("mf-driver-val").textContent = h ? h.ambulance.driver : "—";
  document.getElementById("mf-amb-label").textContent  = h ? h.ambulance.id : "AMB";

  // Reset status to initial state
  _setTrackingStatus("enroute");

  navigate("screen-tracking");
  startTrackingSimulation(h ? h.waitNum : 8);
}

function openMapScreen() {
  navigate("screen-map");
}

// ============================================================
// AMBULANCE SIMULATION — realistic, slow, progressive
// ============================================================
//
// Waypoints match the SVG path in screen-map:
//   M 68,18  →  68,42  →  42,42  →  42,65  →  18,65  →  18,82
// Each segment has a real-world distance weight so speed feels
// proportional. Total journey = waitNum minutes (real-time).
//
// Waypoints match the SVG path in screen-map:
//   M 76,22  →  76,50  →  50,50  →  50,74  →  20,74  →  20,82
const _WAYPOINTS = [
  { x: 76, y: 22 },
  { x: 76, y: 50 },
  { x: 50, y: 50 },
  { x: 50, y: 74 },
  { x: 20, y: 74 },
  { x: 20, y: 82 },
];

// Pre-compute segment lengths so we can distribute time proportionally
function _segLengths() {
  const lens = [];
  for (let i = 0; i < _WAYPOINTS.length - 1; i++) {
    const dx = _WAYPOINTS[i+1].x - _WAYPOINTS[i].x;
    const dy = _WAYPOINTS[i+1].y - _WAYPOINTS[i].y;
    lens.push(Math.sqrt(dx*dx + dy*dy));
  }
  return lens;
}
const _SEG_LENS   = _segLengths();
const _TOTAL_LEN  = _SEG_LENS.reduce((a, b) => a + b, 0);

let _trackingTimer    = null;
let _trackingProgress = 0;   // 0..1 across the entire journey
const _TICK_MS        = 200; // update every 200ms — smooth but not heavy

function startTrackingSimulation(waitMinutes) {
  stopTrackingSimulation();
  _trackingProgress = 0;

  // Total ticks to complete the journey = waitMinutes * 60s / (TICK_MS/1000)
  const totalTicks = (waitMinutes * 60 * 1000) / _TICK_MS;
  const progressPerTick = 1 / totalTicks;

  let tickCount = 0;

  _trackingTimer = setInterval(() => {
    tickCount++;
    _trackingProgress = Math.min(1, tickCount * progressPerTick);

    // --- Position ambulance along waypoint path ---
    const pos = _progressToPos(_trackingProgress);
    _setAmbulancePos(pos);

    // --- ETA countdown ---
    const remainingMs  = (1 - _trackingProgress) * waitMinutes * 60 * 1000;
    const remainingMin = remainingMs / 60000;
    const mins = Math.floor(remainingMin);
    const secs = Math.floor((remainingMin - mins) * 60);

    let etaStr;
    if (remainingMin > 1) {
      etaStr = `~${mins} min`;
    } else if (remainingMin > 0.05) {
      etaStr = `~${secs}s`;
    } else {
      etaStr = "Arriving...";
    }

    // Update both screens
    document.getElementById("tracking-eta").textContent     = etaStr;
    document.getElementById("tracking-amb-eta").textContent = etaStr;
    document.getElementById("mf-eta-val").textContent       = etaStr;

    // --- Progressive status ---
    if (_trackingProgress >= 1) {
      stopTrackingSimulation();
      _setTrackingStatus("arrived");
      document.getElementById("tracking-eta").textContent     = "Arrived";
      document.getElementById("tracking-amb-eta").textContent = "Arrived";
      document.getElementById("mf-eta-val").textContent       = "Arrived";
      _showBillingPrompt();
    } else if (_trackingProgress >= 0.82) {
      _setTrackingStatus("veryclose");
    } else if (_trackingProgress >= 0.55) {
      _setTrackingStatus("arriving");
    } else {
      _setTrackingStatus("enroute");
    }
  }, _TICK_MS);
}

// Convert 0..1 journey progress to {x,y} position on waypoint path
function _progressToPos(t) {
  const targetLen = t * _TOTAL_LEN;
  let accumulated = 0;
  for (let i = 0; i < _SEG_LENS.length; i++) {
    if (accumulated + _SEG_LENS[i] >= targetLen) {
      const segT = (targetLen - accumulated) / _SEG_LENS[i];
      const from = _WAYPOINTS[i];
      const to   = _WAYPOINTS[i + 1];
      return {
        x: from.x + (to.x - from.x) * segT,
        y: from.y + (to.y - from.y) * segT,
      };
    }
    accumulated += _SEG_LENS[i];
  }
  return _WAYPOINTS[_WAYPOINTS.length - 1];
}

function stopTrackingSimulation() {
  if (_trackingTimer) { clearInterval(_trackingTimer); _trackingTimer = null; }
}

function _setAmbulancePos(pos) {
  const el = document.getElementById("mf-ambulance");
  if (!el) return;
  el.style.left = pos.x + "%";
  el.style.top  = pos.y + "%";
}

// Status states: enroute | arriving | veryclose | arrived
let _lastStatus = "";
function _setTrackingStatus(state) {
  if (state === _lastStatus) return;
  _lastStatus = state;

  const titleEl  = document.getElementById("tracking-status-title");
  const subEl    = document.getElementById("tracking-status-sub");
  const statusEl = document.getElementById("tracking-status-text");
  const mapSt    = document.getElementById("mf-status-val");
  const ringEl   = document.getElementById("tracking-pulse-ring");
  const cardEl   = document.getElementById("tracking-status-card");

  const states = {
    enroute:   { title: "Ambulance is on the way",   sub: "Stay calm. Help is coming to you.",          status: "En Route",      color: "#16a34a", ring: "#2563eb" },
    arriving:  { title: "Ambulance is arriving soon", sub: "Your ambulance is getting close.",           status: "Arriving Soon", color: "#d97706", ring: "#d97706" },
    veryclose: { title: "Ambulance is very close",    sub: "Please be ready at your location.",          status: "Very Close",    color: "#dc2626", ring: "#dc2626" },
    arrived:   { title: "Ambulance has arrived",      sub: "Your ambulance is outside. Please proceed.", status: "Arrived",       color: "#16a34a", ring: "#16a34a" },
  };

  const s = states[state] || states.enroute;
  if (titleEl)  titleEl.textContent  = s.title;
  if (subEl)    subEl.textContent    = s.sub;
  if (statusEl) { statusEl.textContent = s.status; statusEl.style.color = s.color; }
  if (mapSt)    { mapSt.textContent    = s.status; mapSt.style.color    = s.color; }
  if (ringEl)   ringEl.style.background = state === "arrived"
    ? "rgba(22,163,74,0.2)"
    : `rgba(${state === "enroute" ? "37,99,235" : state === "arriving" ? "217,119,6" : "220,38,38"},0.15)`;
  if (cardEl && state === "arrived") {
    cardEl.style.background = "linear-gradient(135deg,#14532d,#16a34a)";
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  const active = bookingHospitalId ? hospitals.find(x => x.id === bookingHospitalId) : null;

  // Active booking card
  const activeEl = document.getElementById("dash-active-booking");
  if (active) {
    activeEl.innerHTML = `
      <div class="detail-row">
        <span class="detail-row-label">Hospital</span>
        <span class="detail-row-value">${active.name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">Ambulance</span>
        <span class="detail-row-value">${active.ambulance.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-row-label">ETA</span>
        <span class="detail-row-value" style="color:var(--green);font-weight:700;">${active.ambulance.eta}</span>
      </div>
      <div class="detail-row" style="border:none;">
        <span class="detail-row-label">Status</span>
        <span class="detail-row-value" style="color:var(--green);font-weight:700;">En Route</span>
      </div>
      <button class="detail-btn-book" style="margin-top:12px;width:100%;" onclick="navigate('screen-tracking')">View Live Tracking</button>
    `;
  } else {
    activeEl.innerHTML = `<p class="page-text" style="text-align:center;padding:12px 0;">No active booking. Tap Emergency to begin.</p>`;
  }
}

// ---- ANALYTICS SCREEN ----
function renderAnalytics() {
  // Peak hours bar chart (simulated)
  const hours = [
    { label: "00–04", val: 12 }, { label: "04–08", val: 18 },
    { label: "08–12", val: 65 }, { label: "12–16", val: 48 },
    { label: "16–20", val: 82 }, { label: "20–24", val: 55 }
  ];
  const max = Math.max(...hours.map(h => h.val));
  const barsHtml = hours.map(h => `
    <div class="analytics-bar-col">
      <div class="analytics-bar-wrap">
        <div class="analytics-bar-fill" style="height:${Math.round((h.val / max) * 100)}%;background:${h.val === max ? "var(--red)" : "var(--blue)"};"></div>
      </div>
      <span class="analytics-bar-label">${h.label}</span>
    </div>
  `).join("");
  document.getElementById("analytics-peak-chart").innerHTML = barsHtml;

  // Demand zones heatmap (visual placeholder)
  const zones = [
    { name: "Downtown", level: "High", color: "#fca5a5" },
    { name: "Westside", level: "Medium", color: "#fde68a" },
    { name: "Midtown", level: "High", color: "#fca5a5" },
    { name: "Northpark", level: "Low", color: "#bbf7d0" },
    { name: "Uptown", level: "Low", color: "#bbf7d0" },
    { name: "Eastside", level: "Medium", color: "#fde68a" },
  ];
  document.getElementById("analytics-heatmap").innerHTML = zones.map(z => `
    <div class="heatmap-zone" style="background:${z.color};">
      <span class="heatmap-zone-name">${z.name}</span>
      <span class="heatmap-zone-level">${z.level}</span>
    </div>
  `).join("");
}

// ---- PROFILE STATE ----
const userProfile = {
  name: "Aryan Khan",
  displayName: "Aryan",
  username: "aryan_khan",
  email: "aryan.khan@gmail.com",
  phone: "+91 98765 43210",
  address: "Kolkata, West Bengal, India"
};

function getInitials(name) {
  return name.split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function renderProfile() {
  const p = userProfile;
  const initials = getInitials(p.name);
  document.getElementById("profile-avatar-display").textContent = initials;
  document.getElementById("profile-display-name").textContent = p.name;
  document.getElementById("profile-username-display").textContent = "@" + p.username;
  document.getElementById("profile-email-display").textContent = p.email;
  document.getElementById("pv-name").textContent = p.name;
  document.getElementById("pv-displayname").textContent = p.displayName;
  document.getElementById("pv-username").textContent = "@" + p.username;
  document.getElementById("pv-email").textContent = p.email;
  document.getElementById("pv-phone").textContent = p.phone;
  document.getElementById("pv-address").textContent = p.address;
  document.querySelector(".drawer-profile-name").textContent = p.name;
  document.querySelector(".drawer-profile-email").textContent = p.email;
  document.querySelector(".drawer-avatar").textContent = initials;
}

function openEditProfile() {
  const p = userProfile;
  document.getElementById("edit-name").value = p.name;
  document.getElementById("edit-displayname").value = p.displayName;
  document.getElementById("edit-username").value = p.username;
  document.getElementById("edit-email").value = p.email;
  document.getElementById("edit-phone").value = p.phone;
  document.getElementById("edit-address").value = p.address;
  document.getElementById("edit-avatar-preview").textContent = getInitials(p.name);
  navigate("screen-edit-profile");
}

function saveProfile() {
  const name = document.getElementById("edit-name").value.trim();
  const displayName = document.getElementById("edit-displayname").value.trim();
  const username = document.getElementById("edit-username").value.trim().replace(/^@/, "");
  const email = document.getElementById("edit-email").value.trim();
  const phone = document.getElementById("edit-phone").value.trim();
  const address = document.getElementById("edit-address").value.trim();
  if (!name) { document.getElementById("edit-name").focus(); return; }
  if (!email) { document.getElementById("edit-email").focus(); return; }
  userProfile.name = name;
  userProfile.displayName = displayName || name;
  userProfile.username = username || userProfile.username;
  userProfile.email = email;
  userProfile.phone = phone;
  userProfile.address = address;
  renderProfile();
  navigate("screen-profile");
}

// ---- NAV DRAWER ----
function openDrawer() {
  document.getElementById("nav-drawer").classList.add("open");
  document.getElementById("drawer-backdrop").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  document.getElementById("nav-drawer").classList.remove("open");
  document.getElementById("drawer-backdrop").classList.remove("open");
  document.body.style.overflow = "";
}
function drawerNavigate(screenId) {
  closeDrawer();
  document.querySelectorAll(".drawer-item").forEach(el => el.classList.remove("active-item"));
  const map = {
    "screen-home": 0, "screen-dashboard": 1, "screen-profile": 2,
    "screen-history": 3, "screen-analytics": 4,
    "screen-about": 5, "screen-how": 6, "screen-settings": 7
  };
  const items = document.querySelectorAll(".drawer-item");
  if (map[screenId] !== undefined) items[map[screenId]].classList.add("active-item");
  if (screenId === "screen-dashboard") renderDashboard();
  if (screenId === "screen-analytics") renderAnalytics();
  navigate(screenId);
}

// ---- SETTINGS: LANGUAGE ----
function selectLang(code) {
  document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("selected-lang"));
  document.getElementById("lang-" + code).classList.add("selected-lang");
}

// ---- SEARCH (EXPLORE) ----
document.querySelector(".search-input").addEventListener("input", function () {
  const q = this.value.toLowerCase();
  const base = _activeFilter && (_activeFilter === "Low" || _activeFilter === "Mid" || _activeFilter === "High")
    ? hospitals.filter(h => h.price === _activeFilter)
    : [...hospitals];
  const result = base.filter(h => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q));
  buildExploreList(result);
});

// ---- INIT ----
buildExploreList();
renderProfile();

// ============================================================
// BILLING & PAYMENT SYSTEM
// ============================================================
// BILLING & PAYMENT SYSTEM
// ============================================================
const _BILLING_COSTS = {
  ambulance: 1500,
  consult:   900,
};
const _TOTAL_BILL = _BILLING_COSTS.ambulance + _BILLING_COSTS.consult; // ₹2,400

// Payment state: null | 'pending' | 'paid' | 'overdue'
let _paymentStatus   = null;
let _overdueTimer    = null;
let _currentCaseId   = null;
let _currentCaseData = null;

// ---- Show billing prompt modal on arrival ----
function _showBillingPrompt() {
  document.getElementById("billing-prompt-overlay").classList.remove("hidden");
}
function closeBillingPrompt() {
  document.getElementById("billing-prompt-overlay").classList.add("hidden");
}

// ---- Open billing screen ----
function openBilling() {
  const h = bookingHospitalId ? hospitals.find(x => x.id === bookingHospitalId) : null;
  if (!_currentCaseId) {
    _currentCaseId = "MR-EMG-" + String(Math.floor(1000 + Math.random() * 9000));
  }
  _currentCaseData = {
    hospitalName: h ? h.name : "—",
    distance:     h ? h.distance : "—",
    ambId:        h ? h.ambulance.id : "—",
    driver:       h ? h.ambulance.driver : "—",
  };

  document.getElementById("billing-case-id").textContent          = "Case #" + _currentCaseId;
  document.getElementById("billing-hospital-name").textContent     = _currentCaseData.hospitalName;
  document.getElementById("billing-hospital-distance").textContent = _currentCaseData.distance;
  document.getElementById("billing-amb-id").textContent            = _currentCaseData.ambId;
  document.getElementById("billing-amb-driver").textContent        = _currentCaseData.driver;
  document.getElementById("bill-ambulance").textContent            = "₹" + _BILLING_COSTS.ambulance.toLocaleString("en-IN");
  document.getElementById("bill-consult").textContent              = "₹" + _BILLING_COSTS.consult.toLocaleString("en-IN");
  document.getElementById("bill-total").textContent                = "₹" + _TOTAL_BILL.toLocaleString("en-IN");
  _setPayStatusPill("pending");

  navigate("screen-billing");
}

// ---- Navigate to Pay Now screen ----
function goToPayNow() {
  // Sync total display on payment screen
  document.getElementById("payment-total-display").textContent = "₹" + _TOTAL_BILL.toLocaleString("en-IN");
  // Reset payment screen to method-selection state
  document.getElementById("payment-method-section").classList.remove("hidden");
  document.getElementById("billing-paid-msg").classList.add("hidden");
  const btn = document.getElementById("confirm-pay-btn");
  if (btn) { btn.textContent = "Confirm Payment"; btn.disabled = false; }
  // Reset method selection to first option
  document.querySelectorAll(".pay-method-option").forEach(el => el.classList.remove("selected-pay-method"));
  const first = document.querySelector(".pay-method-option");
  if (first) first.classList.add("selected-pay-method");
  navigate("screen-payment");
}

// ---- Navigate to Pay Later policy screen ----
function goToPayLater() {
  navigate("screen-paylater");
}

// ---- Payment method selection ----
function selectPayMethod(radio) {
  document.querySelectorAll(".pay-method-option").forEach(el => el.classList.remove("selected-pay-method"));
  radio.closest(".pay-method-option").classList.add("selected-pay-method");
}

// ---- Confirm Pay Now ----
function confirmPayNow() {
  const method = document.querySelector("input[name='pay-method']:checked");
  const methodValue = method ? method.value : "upi";
  const methodLabel = { upi: "UPI", card: "Debit / Credit Card", cash: "Cash at Hospital" }[methodValue] || "Payment";

  const btn = document.getElementById("confirm-pay-btn");
  // Step 1: show processing — hide method options, disable button
  btn.textContent = "Processing...";
  btn.disabled = true;
  document.getElementById("billing-paid-msg").classList.add("hidden");

  setTimeout(() => {
    _paymentStatus = "paid";
    _clearOverdueTimer();

    // Step 2: hide method section, show success
    document.getElementById("payment-method-section").classList.add("hidden");
    document.getElementById("billing-paid-msg").classList.remove("hidden");

    // Cash special case
    const subEl = document.getElementById("billing-paid-method");
    if (methodValue === "cash") {
      subEl.textContent = "Payment will be collected at the hospital.";
    } else {
      subEl.textContent = methodLabel + " payment confirmed.";
    }

    _setPayStatusPill("paid");
    _updatePaymentStatusUI();

    // Reset button for potential re-entry
    btn.textContent = "Confirm Payment";
    btn.disabled = false;
  }, 1800);
}

// ---- Confirm Pay Later (from policy screen) ----
function confirmPayLater() {
  _paymentStatus = "pending";
  _setPayStatusPill("pending");
  _updatePaymentStatusUI(); // shows blue pending banner on home, NOT red

  // Overdue timer: 30s simulates 24h
  _clearOverdueTimer();
  _overdueTimer = setTimeout(() => {
    _paymentStatus = "overdue";
    _updatePaymentStatusUI(); // only NOW shows red overdue banner
  }, 30000);

  completeEmergencyCase();
}

function _clearOverdueTimer() {
  if (_overdueTimer) { clearTimeout(_overdueTimer); _overdueTimer = null; }
}

function _setPayStatusPill(status) {
  const pill = document.getElementById("billing-pay-status-pill");
  if (!pill) return;
  const map = {
    pending: { text: "Pending Payment", cls: "pill-pending" },
    paid:    { text: "Paid",            cls: "pill-paid"    },
    overdue: { text: "Overdue",         cls: "pill-overdue" },
  };
  const s = map[status] || map.pending;
  pill.textContent = s.text;
  pill.className = "billing-pay-status-pill " + s.cls;
}

// ---- Update all status indicators ----
function _updatePaymentStatusUI() {
  const status = _paymentStatus;

  // Profile payment status
  const profileStatus = document.getElementById("profile-payment-status");
  const overdueWarning = document.getElementById("profile-overdue-warning");
  if (profileStatus) {
    const badges = {
      paid:    '<span class="pay-status-badge pay-status-paid">Paid</span>',
      pending: '<span class="pay-status-badge pay-status-pending">Pending — Due within 24h</span>',
      overdue: '<span class="pay-status-badge pay-status-overdue">Overdue</span>',
    };
    profileStatus.innerHTML = badges[status] || '<span class="pay-status-badge pay-status-clear">No Outstanding Bills</span>';
  }
  if (overdueWarning) {
    overdueWarning.classList.toggle("hidden", status !== "overdue");
  }

  // History current case
  _renderCurrentCaseInHistory();

  // Overdue: restrict booking button on home
  _applyOverdueRestrictions();
}

function _renderCurrentCaseInHistory() {
  const el = document.getElementById("history-current-case");
  if (!el || !_currentCaseId) return;
  const status = _paymentStatus;
  const badgeMap = {
    paid:    '<span class="pay-status-badge pay-status-paid">Paid</span>',
    pending: '<span class="pay-status-badge pay-status-pending">Pending</span>',
    overdue: '<span class="pay-status-badge pay-status-overdue">Overdue</span>',
  };
  const today = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  el.innerHTML = `
    <div class="history-card history-card-current">
      <div class="history-top">
        <div class="history-hospital">${_currentCaseData ? _currentCaseData.hospitalName : "—"}</div>
        <span class="history-badge badge-completed">Completed</span>
      </div>
      <div class="history-meta">Emergency &bull; ${today}</div>
      <div class="history-row-bottom">
        <span class="history-id">Case #${_currentCaseId}</span>
        ${badgeMap[status] || ""}
      </div>
    </div>
  `;
}

function _applyOverdueRestrictions() {
  const pendingBanner = document.getElementById("pending-home-banner");
  const overdueBanner = document.getElementById("overdue-home-banner");
  const homeMain = document.querySelector("#screen-home .home-main");
  if (!homeMain) return;

  // --- PENDING: blue soft reminder ---
  if (_paymentStatus === "pending") {
    if (!pendingBanner) {
      const b = document.createElement("div");
      b.id = "pending-home-banner";
      b.className = "pending-home-banner";
      b.innerHTML = `
        <div class="pending-banner-text">Payment due within 24 hours for your recent emergency service.</div>
        <button class="pending-banner-btn" onclick="openBilling()">Pay Now</button>
      `;
      homeMain.prepend(b);
    }
    if (overdueBanner) overdueBanner.remove();

  // --- OVERDUE: red warning ---
  } else if (_paymentStatus === "overdue") {
    if (pendingBanner) pendingBanner.remove();
    if (!overdueBanner) {
      const b = document.createElement("div");
      b.id = "overdue-home-banner";
      b.className = "overdue-home-banner";
      b.innerHTML = `
        <div class="overdue-banner-text">You have an unpaid emergency bill. Some features may be restricted.</div>
        <button class="overdue-banner-btn" onclick="openBilling()">Pay Now</button>
      `;
      homeMain.prepend(b);
    }

  // --- PAID or null: remove both ---
  } else {
    if (pendingBanner) pendingBanner.remove();
    if (overdueBanner) overdueBanner.remove();
  }
}

// ---- Complete case ----
function completeEmergencyCase() {
  if (_paymentStatus !== "paid") {
    _updatePaymentStatusUI();
  }
  bookingHospitalId = null;
  aiRecommendedId   = null;
  formData          = { location: "" };
  _lastStatus       = "";
  navigate("screen-home");
}

// Legacy — kept for compatibility
function selectBillingOption(radio) {
  document.querySelectorAll(".billing-option").forEach(el => el.classList.remove("selected-option"));
  if (radio && radio.closest) radio.closest(".billing-option").classList.add("selected-option");
}
