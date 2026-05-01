// ============================================================
// Warm Command — DisasterLink Frontend
// ============================================================

const API = `http://${window.location.hostname}:3001/api`;
const PAGE_SIZE = 15;

// ---- Raw data stores ----
let campsData      = [];
let shortagesData  = [];
let volunteersData = [];
let familiesData   = [];
let auditData      = [];
let disastersData  = [];
let selectedDisasterId = localStorage.getItem('dl_selected_disaster_id');

// ---- Filtered data for pagination ----
const filteredState = {};   // { section: filteredArray (pre-sort) }
const pageState     = {};   // { section: currentPage }
const sortState     = {};   // { section: { col, dir } }

// ---- Chart instances ----
const chartStore = {};
function destroyChart(k) { if (chartStore[k]) { chartStore[k].destroy(); delete chartStore[k]; } }

function getSelectedDisasterQuery() {
  return selectedDisasterId && selectedDisasterId !== 'all'
    ? `?disaster_id=${encodeURIComponent(selectedDisasterId)}`
    : '';
}

function apiUrl(path) {
  return `${API}${path}${getSelectedDisasterQuery()}`;
}

function persistSelectedDisaster(id) {
  selectedDisasterId = String(id);
  if (selectedDisasterId === 'all') localStorage.removeItem('dl_selected_disaster_id');
  else localStorage.setItem('dl_selected_disaster_id', selectedDisasterId);
}

function getActiveSection() {
  return document.querySelector('.section.active')?.id?.replace('sec-', '') || 'dashboard';
}

function getSelectedDisaster() {
  if (!disastersData.length) return null;
  return selectedDisasterId === 'all'
    ? null
    : disastersData.find(d => String(d.disaster_id) === String(selectedDisasterId)) || null;
}

// ============================================================
// PROFILE
// ============================================================
const DEFAULT_PROFILE = { name: 'Field Commander', role: 'Regional Operations' };

function loadProfile() {
  return JSON.parse(localStorage.getItem('dl_profile') || 'null') || DEFAULT_PROFILE;
}

function saveProfile(profile) {
  localStorage.setItem('dl_profile', JSON.stringify(profile));
}

function applyProfile() {
  const p = loadProfile();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=e6d5b8&color=634b30&bold=true`;

  ['profileDisplayName', 'profileDropdownName'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = p.name;
  });
  ['profileDisplayRole', 'profileDropdownRole'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = p.role;
  });
  ['profileAvatar', 'settingsAvatar'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.src = avatarUrl;
  });
  const dn = document.getElementById('settingsDisplayName');
  const dr = document.getElementById('settingsDisplayRole');
  if (dn) dn.textContent = p.name;
  if (dr) dr.textContent = p.role;

  // Pre-fill settings form
  const sn = document.getElementById('settingsName');
  const sr = document.getElementById('settingsRole');
  if (sn) sn.value = p.name;
  if (sr) sr.value = p.role;
}

function initProfileDropdown() {
  const wrap    = document.getElementById('profileWrap');
  const dropdown = document.getElementById('profileDropdown');
  if (!wrap || !dropdown) return;

  wrap.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    document.getElementById('disasterDropdown')?.classList.remove('open');
  });

  document.getElementById('editProfileBtn')?.addEventListener('click', () => {
    const p = loadProfile();
    document.getElementById('modalProfileName').value = p.name;
    document.getElementById('modalProfileRole').value = p.role;
    openModal('profileModal');
    dropdown.classList.remove('open');
  });

  document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
    const name = document.getElementById('modalProfileName').value.trim();
    const role = document.getElementById('modalProfileRole').value.trim();
    if (!name) return;
    saveProfile({ name, role });
    applyProfile();
    closeModal('profileModal');
    showToast('Profile updated successfully.');
  });

  // Settings form save
  document.getElementById('settingsProfileForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('settingsName').value.trim();
    const role = document.getElementById('settingsRole').value.trim();
    if (!name) return;
    saveProfile({ name, role });
    applyProfile();
    showToast('Profile saved.');
  });
}

// ============================================================
// DISASTER CONTEXT SELECTOR
// ============================================================
async function loadDisasterSelector() {
  try {
    if (!disastersData.length) {
      const res = await fetch(`${API}/disasters`);
      disastersData = await res.json();
    }

    const titleEl   = document.getElementById('activeDisasterTitle');
    const dropdownEl = document.getElementById('disasterDropdown');
    const wrap      = document.getElementById('disasterSelectorWrap');
    if (!titleEl || !dropdownEl || !wrap) return;

    const stored = localStorage.getItem('dl_selected_disaster_id');
    const active = disastersData.filter(d => d.status === 'Active');
    const defaultSelected = active[0] || disastersData[0] || null;
    const storedSelected = stored && stored !== 'all'
      ? disastersData.find(d => String(d.disaster_id) === String(stored))
      : null;
    const selected = stored === 'all'
      ? null
      : storedSelected || defaultSelected;

    persistSelectedDisaster(selected ? selected.disaster_id : 'all');

    if (selected) {
      titleEl.innerHTML = `${esc(selected.name)} <span class="selector-chevron">▾</span>`;
      updateHeroBanner(selected);
    } else {
      titleEl.innerHTML = `All Operations <span class="selector-chevron">▾</span>`;
    }

    const allItems = [
      `<div class="topbar-dropdown-item ${selectedDisasterId === 'all' ? 'item--active' : ''}" data-id="all">All Disasters</div>`,
      ...disastersData.map(d => `
        <div class="topbar-dropdown-item ${String(d.disaster_id) === String(selectedDisasterId) ? 'item--active' : ''}" data-id="${d.disaster_id}">
          <span>${esc(d.name)}</span>
          <span class="badge ${d.severity_level === 'Critical' ? 'badge--rose' : 'badge--amber'}" style="font-size:9px;padding:2px 6px">${d.severity_level}</span>
        </div>`)
    ];
    dropdownEl.innerHTML = allItems.join('');

    wrap.addEventListener('click', e => {
      e.stopPropagation();
      dropdownEl.classList.toggle('open');
      document.getElementById('profileDropdown')?.classList.remove('open');
    });

    dropdownEl.querySelectorAll('.topbar-dropdown-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        const id = item.dataset.id;
        if (id === 'all') {
          persistSelectedDisaster('all');
          titleEl.innerHTML = `All Operations <span class="selector-chevron">▾</span>`;
          const heroTag = document.getElementById('heroTag');
          const heroTitle = document.getElementById('heroTitle');
          const heroDesc = document.getElementById('heroDesc');
          if (heroTag) heroTag.textContent = 'All Operations';
          if (heroTitle) heroTitle.textContent = 'Operational Overview';
          if (heroDesc) heroDesc.textContent = 'Monitoring all disaster responses across camps, volunteers, families, and inventory.';
        } else {
          const d = disastersData.find(x => String(x.disaster_id) === id);
          if (d) {
            persistSelectedDisaster(d.disaster_id);
            titleEl.innerHTML = `${esc(d.name)} <span class="selector-chevron">▾</span>`;
            updateHeroBanner(d);
          }
        }
        dropdownEl.classList.remove('open');
        refreshScopedData().catch(err => console.error('Scoped refresh failed:', err));
      });
    });
  } catch (err) {
    console.error('Disaster selector failed:', err);
  }
}

function updateHeroBanner(d) {
  const tag  = document.getElementById('heroTag');
  const title = document.getElementById('heroTitle');
  const desc = document.getElementById('heroDesc');
  if (tag)   tag.textContent  = d.status === 'Active' ? '⚠ Active Event' : 'Resolved';
  if (title) title.textContent = d.name;
  if (desc)  desc.textContent  = `${d.type} — Severity: ${d.severity_level}. Started ${formatDate(d.start_date)}.`;
}

// ============================================================
// NAVIGATION
// ============================================================
const sectionTitles = {
  dashboard:  'Mission Dashboard',
  disasters:  'Operational Disasters',
  camps:      'Relief Camps Monitor',
  families:   'Family Registry',
  inventory:  'Inventory & Shortages',
  audit:      'Operational Audit Logs',
  volunteers: 'Volunteer Taskings',
  reports:    'Mission Reports',
  settings:   'Settings',
};

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;
    if (section) activateSection(section);
  });
});

function activateSection(section) {
  document.getElementById('globalSearch').value = '';
  document.getElementById('profileDropdown')?.classList.remove('open');
  document.getElementById('disasterDropdown')?.classList.remove('open');

  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sec-${section}`)?.classList.add('active');

  document.getElementById('pageTitle').textContent = sectionTitles[section] || '';

  if (section === 'dashboard')  initDashboard();
  else if (section === 'camps')      loadOrRestore('camps',      loadCamps,      renderCamps);
  else if (section === 'inventory')  loadOrRestore('inventory',  loadInventory,  renderInventory);
  else if (section === 'volunteers') loadOrRestoreVols();
  else if (section === 'families')   loadOrRestore('families',   loadFamilies,   renderFamilies);
  else if (section === 'audit')      loadOrRestore('audit',      loadAudit,      renderAudit);
  else if (section === 'disasters')  loadOrRestore('disasters',  loadDisasters,  renderDisasters);
  else if (section === 'reports')    loadReports();
  else if (section === 'settings')   loadSettings();

  initSectionSearch(section);
}

function initSectionSearch(section) {
  const searchInput = document.getElementById('globalSearch');
  if (!searchInput) return;

  searchInput.oninput = () => {
    const term = searchInput.value.toLowerCase().trim();
    const raw = getRaw(section);
    if (!term) {
      filteredState[section] = raw;
    } else {
      filteredState[section] = raw.filter(item => {
        return Object.values(item).some(val => 
          String(val || '').toLowerCase().includes(term)
        );
      });
    }
    pageState[section] = 1;
    const renderMap = { 
      camps: renderCamps, 
      disasters: renderDisasters, 
      families: renderFamilies, 
      volunteers: renderVolunteers, 
      audit: renderAudit, 
      inventory: renderInventory 
    };
    if (renderMap[section]) renderMap[section](filteredState[section]);
  };
}

function loadOrRestore(section, loader, renderer) {
  const raw = getRaw(section);
  if (!raw.length) loader();
  else { filteredState[section] = raw; renderer(raw); }
}

function loadOrRestoreVols() {
  if (!volunteersData.length) loadVolunteers();
  else {
    filteredState['volunteers'] = volunteersData;
    renderVolunteers(volunteersData);
    renderVolunteerSectionChart(volunteersData);
  }
}

function getRaw(section) {
  return { camps: campsData, inventory: shortagesData, families: familiesData, audit: auditData, disasters: disastersData, volunteers: volunteersData }[section] || [];
}

// ============================================================
// CONNECTION STATUS
// ============================================================
async function checkHealth() {
  const dot   = document.querySelector('.conn-dot');
  const label = document.getElementById('connLabel');
  try {
    const r = await fetch(`${API}/health`);
    if (r.ok) { dot.className = 'conn-dot online'; label.textContent = 'ONLINE'; return true; }
    throw new Error();
  } catch {
    dot.className = 'conn-dot offline'; label.textContent = 'OFFLINE'; return false;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function initDashboard() {
  await loadStats();
  loadSeverityAlerts();
  try {
    const [cr, dr, vr] = await Promise.all([
      fetch(apiUrl('/camps')), fetch(`${API}/disasters`), fetch(apiUrl('/volunteers'))
    ]);
    const [camps, disasters, vols] = await Promise.all([cr.json(), dr.json(), vr.json()]);
    campsData      = camps;
    disastersData  = disasters;
    volunteersData = vols;
    renderCampOccupancyChart(camps);
    const scopedDisasters = selectedDisasterId === 'all'
      ? disasters
      : disasters.filter(d => String(d.disaster_id) === String(selectedDisasterId));
    renderDisasterSeverityChart(scopedDisasters);
    renderVolunteerChart(vols);
  } catch (err) { console.error('Dashboard charts failed:', err); }
}

async function loadStats() {
  try {
    const stats = await fetch(apiUrl('/stats')).then(r => r.json());
    const el = id => document.getElementById(id);
    if (el('kpi-camps'))     el('kpi-camps').textContent     = stats.total_camps ?? '0';
    if (el('kpi-disasters')) el('kpi-disasters').textContent = stats.active_disasters ?? '0';
    if (el('kpi-shortages')) el('kpi-shortages').textContent = String(stats.critical_shortages || 0).padStart(2, '0');
    if (el('kpi-occupancy')) {
      const occ = parseFloat(stats.global_occupancy_pct) || 0;
      el('kpi-occupancy').textContent = occ > 90 ? 'CRITICAL' : occ > 75 ? 'RISK' : 'NOMINAL';
      el('kpi-occupancy').style.color = occ > 90 ? '#c1272d' : occ > 75 ? '#f59e0b' : '#4ca388';
      if (el('kpi-occ-pct')) el('kpi-occ-pct').textContent = occ + '%';
    }
  } catch (err) { console.error('Stats failed:', err); }
}

async function loadSeverityAlerts() {
  const list = document.getElementById('severityList');
  if (!list) return;
  try {
    const shortages = await fetch(apiUrl('/inventory')).then(r => r.json());
    if (!shortages.length) { list.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:10px">All systems nominal.</p>'; return; }
    const icon = cat => cat === 'Medical' ? '💊' : cat === 'Food' ? '🍞' : cat === 'Water' ? '💧' : '📦';
    list.innerHTML = shortages.slice(0, 4).map(s => {
      const crit = s.shortage_amount > s.minimum_threshold * 0.5;
      return `<div class="severity-card ${crit ? 'severity-card--crit' : 'severity-card--warn'}">
        <div class="sev-icon ${crit ? 'sev-icon--red' : 'sev-icon--amber'}">${icon(s.category)}</div>
        <div class="sev-body">
          <h4>${crit ? 'Critical' : 'Warning'}: ${esc(s.resource_name)}</h4>
          <p>${esc(s.camp_name)} — short by ${num(s.shortage_amount)} units.</p>
          <button class="sev-btn ${crit ? 'btn-red' : 'btn-amber'}" 
                  onclick="expediteOrder(${s.camp_id}, '${esc(s.resource_name)}', ${s.shortage_amount})">
            ${crit ? 'Expedite Order' : 'Reallocate'}
          </button>
        </div>
      </div>`;
    }).join('');
  } catch (err) { console.error('Severity alerts failed:', err); }
}

async function expediteOrder(campId, resourceName, amount) {
  try {
    const res = await fetch(`${API}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camp_id: campId,
        event_type: 'Supply_Alert',
        description: `EMERGENCY: Expedited request for ${amount} units of ${resourceName}.`
      })
    });
    const result = await res.json();
    if (result.success) {
      showToast(`Emergency order for ${resourceName} has been transmitted.`, 'success');
      loadAudit(); // Refresh logs if visible
    }
  } catch (err) {
    showToast('Failed to connect to logistics server.', 'error');
  }
}

async function refreshScopedData() {
  const activeSection = getActiveSection();
  ['camps', 'inventory', 'families', 'audit', 'volunteers'].forEach(section => {
    pageState[section] = 1;
  });

  await initDashboard();
  await Promise.all([loadFamilies(), loadInventory(), loadAudit()]);

  if (activeSection === 'reports') {
    await loadReports();
  }

  const filterFn = getActiveFilter();
  if (filterFn) filterFn();
}

// ============================================================
// DATA LOADERS
// ============================================================
async function loadCamps() {
  try { 
    campsData = await fetch(apiUrl('/camps')).then(r => r.json()); 
    filteredState['camps'] = campsData; 
    
    // Populate Districts
    const districts = [...new Set(campsData.map(c => c.district))].sort();
    const distSel = document.getElementById('campsDistrictFilter');
    if (distSel) {
      distSel.innerHTML = '<option value="">All Districts</option>' + 
        districts.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');
    }
    
    renderCamps(campsData); 
  } catch (e) { console.error(e); }
}
async function loadInventory() {
  try { shortagesData = await fetch(apiUrl('/inventory')).then(r => r.json()); filteredState['inventory'] = shortagesData; renderInventory(shortagesData); } catch (e) { console.error(e); }
}
async function loadFamilies() {
  try { familiesData = await fetch(apiUrl('/families')).then(r => r.json()); filteredState['families'] = familiesData; renderFamilies(familiesData); } catch (e) { console.error(e); }
}
async function loadAudit() {
  try { auditData = await fetch(apiUrl('/audit')).then(r => r.json()); filteredState['audit'] = auditData; renderAudit(auditData); } catch (e) { console.error(e); }
}
async function loadVolunteers() {
  try { volunteersData = await fetch(apiUrl('/volunteers')).then(r => r.json()); filteredState['volunteers'] = volunteersData; renderVolunteers(volunteersData); renderVolunteerSectionChart(volunteersData); } catch (e) { console.error(e); }
}
async function loadDisasters() {
  try { disastersData = await fetch(`${API}/disasters`).then(r => r.json()); filteredState['disasters'] = disastersData; renderDisasters(disastersData); } catch (e) { console.error(e); }
}

async function refreshAllData() {
  campsData = shortagesData = volunteersData = familiesData = auditData = disastersData = [];
  Object.keys(filteredState).forEach(k => delete filteredState[k]);
  Object.keys(pageState).forEach(k => delete pageState[k]);
  await refreshScopedData();
  showToast('All data refreshed.');
}

// ============================================================
// SORTING (per table)
// ============================================================
function applySort(data, section) {
  const ss = sortState[section];
  if (!ss) return data;
  return [...data].sort((a, b) => {
    let va = a[ss.col] ?? ''; let vb = b[ss.col] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return ss.dir === 'asc' ? cmp : -cmp;
  });
}

function bindSortHeaders(section) {
  const sec = document.getElementById(`sec-${section}`);
  if (!sec) return;
  sec.querySelectorAll('th.sortable').forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const col = th.dataset.col;
      const cur = sortState[section] || {};
      const dir = cur.col === col && cur.dir === 'asc' ? 'desc' : 'asc';
      sortState[section] = { col, dir };
      sec.querySelectorAll('th.sortable').forEach(h => {
        h.querySelector('.sort-icon').textContent = '↕';
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.querySelector('.sort-icon').textContent = dir === 'asc' ? '↑' : '↓';
      th.classList.add('sort-' + dir);
      // Re-render with current filtered data + new sort
      const renderMap = { camps: renderCamps, disasters: renderDisasters, families: renderFamilies, volunteers: renderVolunteers, audit: renderAudit, inventory: renderInventory };
      const data = filteredState[section] || getRaw(section);
      pageState[section] = 1;
      if (renderMap[section]) renderMap[section](data);
    });
  });
}

// ============================================================
// PAGINATION
// ============================================================
function paginate(data, section) {
  const page = pageState[section] || 1;
  return data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

function renderPager(id, total, section) {
  const el = document.getElementById(id);
  if (!el) return;
  const page = pageState[section] || 1;
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) { el.innerHTML = ''; return; }
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);
  el.innerHTML = `<div class="pager">
    <button class="pager-btn" onclick="changePage('${section}',${page-1})" ${page<=1?'disabled':''}>← Prev</button>
    <span class="pager-info">${start}–${end} of ${total}</span>
    <button class="pager-btn" onclick="changePage('${section}',${page+1})" ${page>=pages?'disabled':''}>Next →</button>
  </div>`;
}

window.changePage = function(section, page) {
  pageState[section] = page;
  const data = filteredState[section] || getRaw(section);
  ({ camps: renderCamps, disasters: renderDisasters, families: renderFamilies, volunteers: renderVolunteers, audit: renderAudit, inventory: renderInventory })[section]?.(data);
};

// ============================================================
// ROW DETAIL MODAL
// ============================================================
function bindRowClicks(section, dataArr) {
  const tbody = document.querySelector(`#sec-${section} tbody`);
  if (!tbody) return;
  tbody.querySelectorAll('tr.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.idx);
      showDetailModal(section, dataArr[idx]);
    });
  });
}

function showDetailModal(section, item) {
  if (!item) return;
  const defs = {
    camps: [
      ['Camp Name',      'camp_name'],
      ['District',       'district'],
      ['Organization',   'managing_organization'],
      ['Total Capacity', 'total_capacity'],
      ['Occupancy',      'current_occupancy'],
      ['Available Beds', 'available_beds'],
      ['Fill Rate',      'occupancy_percentage', v => v + '%'],
    ],
    disasters: [
      ['ID',          'disaster_id'],
      ['Name',        'name'],
      ['Type',        'type'],
      ['Severity',    'severity_level'],
      ['Start Date',  'start_date', formatDate],
      ['End Date',    'end_date',   formatDate],
      ['Status',      'status'],
    ],
    families: [
      ['Head of Family',   'head_of_family_name'],
      ['Camp',             'camp_name'],
      ['Total Members',    'total_members'],
      ['PWD Members',      'members_with_disability'],
      ['Has Elderly',      'has_elderly',          v => v ? 'Yes' : 'No'],
      ['Children Under 5', 'has_children_under_5', v => v ? 'Yes' : 'No'],
      ['Phone',            'contact_phone'],
      ['Registered',       'registration_date', formatDate],
      ['Status',           'verification_status'],
    ],
    volunteers: [
      ['Name',          'full_name'],
      ['Specialization','specialization'],
      ['Taskings',      'total_distributions_handled'],
      ['Units Handled', 'units_distributed'],
    ],
    audit: [
      ['Timestamp',   'log_timestamp', formatDateTime],
      ['Camp',        'camp_name'],
      ['Event Type',  'event_type'],
      ['Description', 'description'],
    ],
    inventory: [
      ['Camp',       'camp_name'],
      ['Resource',   'resource_name'],
      ['Category',   'category'],
      ['In Stock',   'quantity_available'],
      ['Threshold',  'minimum_threshold'],
      ['Shortage',   'shortage_amount'],
    ],
  };

  const rows = defs[section] || [];
  const title = { camps: 'Camp Details', disasters: 'Disaster Details', families: 'Family Record', volunteers: 'Volunteer Profile', audit: 'Log Entry', inventory: 'Inventory Alert' }[section] || 'Details';

  document.getElementById('detailTitle').textContent = title;
  document.getElementById('detailBody').innerHTML = `
    <div class="detail-grid">
      ${rows.map(([label, key, fmt]) => `
        <div class="detail-row">
          <span class="detail-label">${label}</span>
          <span class="detail-value">${fmt ? esc(String(fmt(item[key]) ?? '—')) : esc(String(item[key] ?? '—'))}</span>
        </div>
      `).join('')}
    </div>`;
  openModal('detailModal');
}

// ============================================================
// TABLE RENDERERS (with pagination + sort + row click)
// ============================================================
function renderCamps(data) {
  filteredState['camps'] = data;
  const sorted = applySort(data, 'camps');
  const paged  = paginate(sorted, 'camps');
  const tbody  = document.getElementById('campsBody');
  if (!tbody) return;
  if (!paged.length) { emptyRow(tbody, 6); } else {
    tbody.innerHTML = paged.map((c, i) => `
      <tr class="clickable-row" data-idx="${(pageState['camps']||1-1)*PAGE_SIZE+i}">
        <td><strong>${esc(c.camp_name)}</strong></td>
        <td>${esc(c.district)}</td>
        <td>${esc(c.managing_organization)}</td>
        <td>${num(c.current_occupancy)} / ${num(c.total_capacity)}</td>
        <td>${num(c.available_beds)}</td>
        <td><span class="badge ${c.occupancy_percentage>=90?'badge--rose':c.occupancy_percentage>=70?'badge--amber':'badge--verified'}">${c.occupancy_percentage}%</span></td>
      </tr>`).join('');
    bindRowClicks('camps', sorted);
  }
  renderPager('campsPager', sorted.length, 'camps');
  updateCount('campsCount', data.length, campsData.length);
}

function renderInventory(data) {
  filteredState['inventory'] = data;
  const sorted = applySort(data, 'inventory');
  const paged  = paginate(sorted, 'inventory');
  const tbody  = document.getElementById('inventoryBody');
  if (!tbody) return;
  if (!paged.length) { emptyRow(tbody, 6, 'No shortages detected.'); } else {
    tbody.innerHTML = paged.map((s, i) => `
      <tr class="clickable-row" data-idx="${(pageState['inventory']||1-1)*PAGE_SIZE+i}">
        <td>${esc(s.camp_name)}</td>
        <td><strong>${esc(s.resource_name)}</strong></td>
        <td>${esc(s.category)}</td>
        <td>${num(s.quantity_available)}</td>
        <td>${num(s.minimum_threshold)}</td>
        <td><span class="badge badge--rose">-${num(s.shortage_amount)}</span></td>
      </tr>`).join('');
    bindRowClicks('inventory', sorted);
  }
  renderPager('inventoryPager', sorted.length, 'inventory');
  updateCount('inventoryCount', data.length, shortagesData.length);
}

function renderFamilies(data) {
  filteredState['families'] = data;
  const sorted = applySort(data, 'families');
  const paged  = paginate(sorted, 'families');
  const tbody  = document.getElementById('familiesBody');
  if (!tbody) return;
  if (!paged.length) { emptyRow(tbody, 6); } else {
    tbody.innerHTML = paged.map((f, i) => {
      const flags = [
        f.has_elderly           ? '<span class="badge badge--amber" style="font-size:9px;padding:2px 6px">Elderly</span>' : '',
        f.has_children_under_5  ? '<span class="badge badge--amber" style="font-size:9px;padding:2px 6px">Under-5</span>' : '',
        f.members_with_disability > 0 ? '<span class="badge badge--pending" style="font-size:9px;padding:2px 6px">PWD</span>' : '',
      ].filter(Boolean).join(' ');
      return `<tr class="clickable-row" data-idx="${(pageState['families']||1-1)*PAGE_SIZE+i}">
        <td><strong>${esc(f.head_of_family_name)}</strong></td>
        <td>${esc(f.camp_name||'PENDING')}</td>
        <td>${f.total_members}</td>
        <td>${flags||'—'}</td>
        <td>${formatDate(f.registration_date)}</td>
        <td><span class="badge ${f.verification_status==='Verified'?'badge--verified':'badge--pending'}">${f.verification_status}</span></td>
      </tr>`;
    }).join('');
    bindRowClicks('families', sorted);
  }
  renderPager('familiesPager', sorted.length, 'families');
  updateCount('familiesCount', data.length, familiesData.length);
}

function renderAudit(data) {
  filteredState['audit'] = data;
  const sorted = applySort(data, 'audit');
  const paged  = paginate(sorted, 'audit');
  const tbody  = document.getElementById('auditBody');
  if (!tbody) return;
  const ec = { Registration:'badge--verified', Transfer_In:'badge--pending', Transfer_Out:'badge--pending', Supply_Alert:'badge--rose', Status_Change:'badge--amber' };
  if (!paged.length) { emptyRow(tbody, 4); } else {
    tbody.innerHTML = paged.map((a, i) => `
      <tr class="clickable-row" data-idx="${(pageState['audit']||1-1)*PAGE_SIZE+i}">
        <td style="font-size:12px;color:var(--text-muted)">${formatDateTime(a.log_timestamp)}</td>
        <td>${esc(a.camp_name)}</td>
        <td><span class="badge ${ec[a.event_type]||'badge--pending'}">${esc(a.event_type)}</span></td>
        <td style="font-size:12px">${esc(a.description)}</td>
      </tr>`).join('');
    bindRowClicks('audit', sorted);
  }
  renderPager('auditPager', sorted.length, 'audit');
  updateCount('auditCount', data.length, auditData.length);
}

function renderVolunteers(data) {
  filteredState['volunteers'] = data;
  const sorted = applySort(data, 'volunteers');
  const paged  = paginate(sorted, 'volunteers');
  const tbody  = document.getElementById('volunteersBody');
  if (!tbody) return;
  if (!paged.length) { emptyRow(tbody, 5); } else {
    const offset = ((pageState['volunteers']||1) - 1) * PAGE_SIZE;
    tbody.innerHTML = paged.map((v, i) => `
      <tr class="clickable-row" data-idx="${offset+i}">
        <td><span class="badge badge--verified">${offset+i+1}</span></td>
        <td><strong>${esc(v.full_name)}</strong></td>
        <td>${esc(v.specialization)||'—'}</td>
        <td>${num(v.total_distributions_handled)}</td>
        <td>${num(v.units_distributed)}</td>
      </tr>`).join('');
    bindRowClicks('volunteers', sorted);
  }
  renderPager('volunteersPager', sorted.length, 'volunteers');
  updateCount('volunteersCount', data.length, volunteersData.length);
}

function renderDisasters(data) {
  filteredState['disasters'] = data;
  const sorted = applySort(data, 'disasters');
  const paged  = paginate(sorted, 'disasters');
  const tbody  = document.getElementById('disastersBody');
  if (!tbody) return;
  
  if (!paged.length) { 
    emptyRow(tbody, 7); 
  } else {
    tbody.innerHTML = paged.map(d => {
      const isClosed = d.status === 'Closed';
      return `<tr>
        <td style="font-weight:700">${esc(d.name)}</td>
        <td><span class="badge badge--sand">${esc(d.type)}</span></td>
        <td><span class="badge badge--${(d.severity_level||'').toLowerCase()}">${esc(d.severity_level)}</span></td>
        <td>${formatDate(d.start_date)}</td>
        <td>${d.end_date ? formatDate(d.end_date) : '<span style="color:var(--text-muted)">Ongoing</span>'}</td>
        <td><span class="badge badge--${isClosed ? 'rose' : 'verified'}">${esc(d.status)}</span></td>
        <td>
          ${!isClosed ? `<button class="btn-hero btn-hero--brown btn-sm btn-close-mission" data-id="${d.disaster_id}">Close Mission</button>` : '—'}
        </td>
      </tr>`;
    }).join('');

    // Bind listeners
    tbody.querySelectorAll('.btn-close-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDisaster(btn.dataset.id);
      });
    });
  }
  
  renderPager('disastersPager', sorted.length, 'disasters');
  updateCount('disastersCount', data.length, disastersData.length);
}

async function closeDisaster(id) {
  if (!confirm('Are you sure you want to close this disaster mission? This will set the end date to today.')) return;
  try {
    const res = await fetch(`${API}/disasters/${id}/close`, { method: 'PATCH' });
    const result = await res.json();
    if (result.success) {
      showToast(result.message);
      // Force reload disasters to update UI
      disastersData = []; 
      await loadDisasters();
      await loadDisasterSelector();
    } else {
      showToast(result.error || 'Failed to close disaster', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
}
window.closeDisaster = closeDisaster;

// ============================================================
// CHARTS
// ============================================================
function renderCampOccupancyChart(camps) {
  destroyChart('campOcc');
  const ctx = document.getElementById('campOccChart');
  if (!ctx || !camps.length) return;
  const sorted = [...camps].sort((a, b) => b.occupancy_percentage - a.occupancy_percentage).slice(0, 7);
  const colors = sorted.map(c => c.occupancy_percentage >= 90 ? '#c1272d' : c.occupancy_percentage >= 70 ? '#f59e0b' : '#4ca388');
  chartStore['campOcc'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: sorted.map(c => c.camp_name.length > 18 ? c.camp_name.slice(0,16)+'…' : c.camp_name), datasets: [{ label: 'Fill %', data: sorted.map(c => c.occupancy_percentage), backgroundColor: colors, borderRadius: 6, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { max: 100, grid: { color: '#f2f2f5' }, ticks: { callback: v => v+'%', font: { size: 10 } } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
  });
}

function renderDisasterSeverityChart(disasters) {
  destroyChart('disasterSev');
  const ctx = document.getElementById('disasterSevChart');
  if (!ctx || !disasters.length) return;
  const counts = {}; disasters.forEach(d => { counts[d.severity_level] = (counts[d.severity_level]||0)+1; });
  const labels = Object.keys(counts);
  const cmap = { Critical: '#c1272d', Severe: '#e55b1f', High: '#f59e0b', Moderate: '#3b82f6', Low: '#4ca388' };
  chartStore['disasterSev'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: labels.map(l => counts[l]), backgroundColor: labels.map(l => cmap[l]||'#8e8e93'), borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10, boxWidth: 10 } } } }
  });
}

function renderVolunteerChart(vols) {
  destroyChart('volPerf');
  const ctx = document.getElementById('impactChart');
  if (!ctx || !vols.length) return;
  const top6 = vols.slice(0, 6);
  chartStore['volPerf'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: top6.map(v => v.full_name.split(' ')[0]), datasets: [
      { label: 'Units Distributed', data: top6.map(v => parseFloat(v.units_distributed)||0), backgroundColor: '#634b30', borderRadius: 6, borderSkipped: false },
      { label: 'Taskings', data: top6.map(v => v.total_distributions_handled||0), backgroundColor: 'rgba(99,75,48,.25)', borderRadius: 6, borderSkipped: false }
    ] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { font: { size: 10 }, boxWidth: 10 } } }, scales: { y: { beginAtZero: true, grid: { color: '#f2f2f5' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
  });
}

function renderVolunteerSectionChart(vols) {
  destroyChart('volSection');
  const ctx = document.getElementById('volunteerPerfChart');
  if (!ctx || !vols.length) return;
  const top5 = vols.slice(0, 5);
  const browns = ['#634b30','#7a5c41','#9e7c5a','#c4a882','#e6d5b8'];
  chartStore['volSection'] = new Chart(ctx, {
    type: 'bar',
    data: { labels: top5.map(v => v.full_name), datasets: [{ label: 'Aid Units', data: top5.map(v => parseFloat(v.units_distributed)||0), backgroundColor: browns, borderRadius: 8, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { color: '#f2f2f5' }, ticks: { font: { size: 10 } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
  });
}

// ============================================================
// REPORTS
// ============================================================
async function loadReports() {
  try {
    const [fams, resources, camps] = await Promise.all([
      familiesData.length ? familiesData : fetch(apiUrl('/families')).then(r=>r.json()),
      fetch(apiUrl('/resources/summary')).then(r=>r.json()),
      campsData.length ? campsData : fetch(apiUrl('/camps')).then(r=>r.json()),
    ]);
    if (!familiesData.length) familiesData = fams;
    if (!campsData.length) campsData = camps;

    const totalFamilies = fams.length;
    const totalMembers  = fams.reduce((s,f) => s + (f.total_members||0), 0);
    const vulnerable    = fams.filter(f => f.has_elderly || f.has_children_under_5 || f.members_with_disability > 0).length;
    const verified      = fams.filter(f => f.verification_status === 'Verified').length;

    document.getElementById('reportKpis').innerHTML = `
      <div class="kpi-card"><div class="kpi-head"><div class="kpi-icon-wrap kpi-icon--sand"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div></div><div class="kpi-body"><div class="kpi-info-label">Families Registered</div><div class="kpi-info-value">${totalFamilies}</div></div></div>
      <div class="kpi-card"><div class="kpi-head"><div class="kpi-icon-wrap kpi-icon--blue"></div></div><div class="kpi-body"><div class="kpi-info-label">Total Members</div><div class="kpi-info-value">${num(totalMembers)}</div></div></div>
      <div class="kpi-card"><div class="kpi-head"><div class="kpi-icon-wrap kpi-icon--rose"></div></div><div class="kpi-body"><div class="kpi-info-label">Vulnerable Families</div><div class="kpi-info-value">${vulnerable}</div></div></div>
      <div class="kpi-card"><div class="kpi-head"><div class="kpi-icon-wrap kpi-icon--emerald"></div></div><div class="kpi-body"><div class="kpi-info-label">Verified</div><div class="kpi-info-value">${verified}</div></div></div>
    `;

    destroyChart('reportRes');
    const rctx = document.getElementById('reportResourceChart');
    if (rctx && resources.length) {
      chartStore['reportRes'] = new Chart(rctx, {
        type: 'bar',
        data: { labels: resources.map(r => r.category), datasets: [{ label: 'Total Stock', data: resources.map(r => r.total_quantity), backgroundColor: '#634b30', borderRadius: 8, borderSkipped: false }] },
        options: { animation: false, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#f2f2f5' }, ticks: { font: { size: 11 } } }, x: { grid: { display: false }, ticks: { font: { size: 11 } } } } }
      });
    }

    destroyChart('reportVuln');
    const vctx = document.getElementById('reportVulnChart');
    if (vctx) {
      const elderly  = fams.filter(f => f.has_elderly).length;
      const under5   = fams.filter(f => f.has_children_under_5).length;
      const pwd      = fams.filter(f => f.members_with_disability > 0).length;
      const noFlag   = fams.filter(f => !f.has_elderly && !f.has_children_under_5 && !f.members_with_disability).length;
      chartStore['reportVuln'] = new Chart(vctx, {
        type: 'doughnut',
        data: { labels: ['With Elderly','Children<5','PWD','No Flag'], datasets: [{ data: [elderly, under5, pwd, noFlag], backgroundColor: ['#f59e0b','#3b82f6','#c1272d','#4ca388'], borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }] },
        options: { animation: false, responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12, boxWidth: 12 } } } }
      });
    }
  } catch (err) { console.error('Reports failed:', err); }
}

// ============================================================
// SETTINGS
// ============================================================
async function loadSettings() {
  applyProfile();
  const api   = document.getElementById('settingsApiStatus');
  const db    = document.getElementById('settingsDbStatus');
  const count = document.getElementById('settingsRecordCount');
  try {
    const r = await fetch(`${API}/health`);
    if (r.ok) {
      if (api) { api.textContent = 'Online'; api.className = 'badge badge--verified'; }
      if (db)  { db.textContent  = 'Connected'; db.className = 'badge badge--verified'; }
    } else throw new Error();
  } catch {
    if (api) { api.textContent = 'Offline'; api.className = 'badge badge--rose'; }
    if (db)  { db.textContent  = 'Disconnected'; db.className = 'badge badge--rose'; }
  }
  if (count) {
    const total = campsData.length + familiesData.length + volunteersData.length + disastersData.length + auditData.length;
    count.textContent = total ? `${total} rows loaded` : '— (navigate to sections to load)';
  }
}

// ============================================================
// FILTERS (search + dropdown combined)
// ============================================================
const getSearch = () => (document.getElementById('globalSearch')?.value || '').toLowerCase().trim();
const getVal    = id => (document.getElementById(id)?.value || '');
const match     = (f, q) => !q || String(f||'').toLowerCase().includes(q);

function filterCamps() {
  const q = getSearch(); const sort = getVal('campsSortSelect'); const dist = getVal('campsDistrictFilter');
  let f = campsData.filter(c => (match(c.camp_name,q)||match(c.district,q)) && (!dist || c.district === dist));
  if (sort==='id_desc') f.sort((a,b)=>b.camp_id - a.camp_id);
  if (sort==='fill_desc') f.sort((a,b)=>b.occupancy_percentage-a.occupancy_percentage);
  if (sort==='fill_asc')  f.sort((a,b)=>a.occupancy_percentage-b.occupancy_percentage);
  pageState['camps']=1; renderCamps(f);
}
function filterDisasters() {
  const q=getSearch(), sev=getVal('disastersSeverityFilter'), st=getVal('disastersStatusFilter');
  const f=disastersData.filter(d=>(match(d.name,q)||match(d.type,q))&&(!sev||d.severity_level===sev)&&(!st||d.status===st));
  f.sort((a,b)=>b.disaster_id - a.disaster_id);
  pageState['disasters']=1; renderDisasters(f);
}
function filterFamilies() {
  const q=getSearch(), verif=getVal('familiesVerifFilter'), vuln=document.getElementById('familiesVulnerableFilter')?.checked;
  const f=familiesData.filter(fa=>(match(fa.head_of_family_name,q)||match(fa.camp_name,q)||match(fa.contact_phone,q))&&(!verif||fa.verification_status===verif)&&(!vuln||fa.has_elderly||fa.has_children_under_5));
  f.sort((a,b)=>b.family_id - a.family_id);
  pageState['families']=1; renderFamilies(f);
}
function filterVolunteers() {
  const q=getSearch(), spec=getVal('volunteersSpecFilter');
  const f=volunteersData.filter(v=>(match(v.full_name,q)||match(v.specialization,q)) && (!spec || v.specialization === spec));
  f.sort((a,b)=>b.volunteer_id - a.volunteer_id);
  pageState['volunteers']=1; renderVolunteers(f);
}
function filterAudit() {
  const q=getSearch(), type=getVal('auditTypeFilter');
  const f=auditData.filter(a=>(match(a.camp_name,q)||match(a.event_type,q)||match(a.description,q))&&(!type||a.event_type===type));
  pageState['audit']=1; renderAudit(f);
}
function filterInventory() {
  const q=getSearch(), cat=getVal('inventoryCategoryFilter');
  const f=shortagesData.filter(s=>(match(s.camp_name,q)||match(s.resource_name,q)||match(s.category,q)) && (!cat || s.category === cat));
  pageState['inventory']=1; renderInventory(f);
}

function getActiveFilter() {
  const active = document.querySelector('.section.active');
  if (!active) return null;
  return { 'sec-camps':filterCamps,'sec-disasters':filterDisasters,'sec-families':filterFamilies,'sec-volunteers':filterVolunteers,'sec-audit':filterAudit,'sec-inventory':filterInventory }[active.id]||null;
}

function initSearch() {
  document.getElementById('globalSearch')?.addEventListener('input', () => { const fn=getActiveFilter(); if(fn) fn(); });
}

function initSectionFilters() {
  document.getElementById('campsDistrictFilter')?.addEventListener('change', filterCamps);
  document.getElementById('campsSortSelect')?.addEventListener('change', filterCamps);
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', filterInventory);
  document.getElementById('disastersSeverityFilter')?.addEventListener('change', filterDisasters);
  document.getElementById('disastersStatusFilter')?.addEventListener('change', filterDisasters);
  document.getElementById('familiesVerifFilter')?.addEventListener('change', filterFamilies);
  document.getElementById('familiesVulnerableFilter')?.addEventListener('change', filterFamilies);
  document.getElementById('volunteersSpecFilter')?.addEventListener('change', filterVolunteers);
  document.getElementById('auditTypeFilter')?.addEventListener('change', filterAudit);
}

// ============================================================
// FAMILY REGISTRATION
// ============================================================
// ============================================================
// CRUD OPERATIONS
// ============================================================
window.openAddModal = async function(section) {
  const titleMap = {
    camps: 'Add New Relief Camp',
    inventory: 'Add Inventory Item',
    disasters: 'Register New Disaster',
    families: 'Register New Family',
    volunteers: 'Register New Volunteer'
  };

  document.getElementById('addModalTitle').textContent = titleMap[section] || 'Add Entry';
  const fieldsContainer = document.getElementById('addModalFields');
  fieldsContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Loading operational data…</div>';
  
  openModal('addModal');

  try {
    // Prefetch dependencies
    const [camps, resources, disasters] = await Promise.all([
      fetch(`${API}/camps`).then(r => r.json()),
      fetch(`${API}/resources/summary`).then(r => r.json()), // Assuming this gives categories/names
      fetch(`${API}/disasters`).then(r => r.json())
    ]);

    let html = '';
    const curDisId = selectedDisasterId === 'all' ? '' : selectedDisasterId;

    if (section === 'camps') {
      html = `
        <div class="form-field"><label>Camp Name</label><input type="text" name="name" placeholder="e.g. Hope Center Alpha" required></div>
        <div class="form-field"><label>District</label><input type="text" name="district" placeholder="e.g. Kathmandu" required></div>
        <div class="form-field"><label>Total Capacity</label><input type="number" name="total_capacity" value="500" required></div>
        <div class="form-field"><label>Disaster Context</label>
          <select name="disaster_id" class="filter-select" style="width:100%">
            ${disasters.map(d => `<option value="${d.disaster_id}" ${String(d.disaster_id) === String(curDisId) ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Managing Organization</label>
          <select name="managing_org_id" class="filter-select" style="width:100%">
            <option value="1">Red Cross Society</option>
            <option value="2">UNICEF Operations</option>
            <option value="3">Government Relief Dept</option>
          </select>
        </div>
      `;
    } else if (section === 'inventory') {
      html = `
        <div class="form-field"><label>Target Camp</label>
          <select name="camp_id" class="filter-select" style="width:100%">
            ${camps.map(c => `<option value="${c.camp_id}">${esc(c.camp_name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Resource Type</label>
          <select name="resource_id" class="filter-select" style="width:100%">
            <option value="1">Medical Kits (Standard)</option>
            <option value="2">Emergency Food Rations</option>
            <option value="3">Potable Water (20L)</option>
            <option value="4">Sanitation Supplies</option>
          </select>
        </div>
        <div class="form-field"><label>Quantity to Add</label><input type="number" name="quantity_available" value="100" required></div>
        <div class="form-field"><label>Minimum Threshold Alert</label><input type="number" name="minimum_threshold" value="50" required></div>
      `;
    } else if (section === 'disasters') {
      html = `
        <div class="form-field"><label>Disaster Name</label><input type="text" name="name" placeholder="e.g. 2024 Monsoon Flood" required></div>
        <div class="form-field"><label>Type</label><input type="text" name="type" placeholder="Flood / Fire / Earthquake" required></div>
        <div class="form-field"><label>Severity</label>
          <select class="filter-select" name="severity_level" style="width:100%">
            <option>Low</option><option>Moderate</option><option>High</option><option value="Critical">Critical (Immediate Response)</option>
          </select>
        </div>
        <div class="form-field"><label>Start Date</label><input type="date" name="start_date" value="${new Date().toISOString().split('T')[0]}" required></div>
      `;
    } else if (section === 'families') {
      html = `
        <div class="form-field"><label>Head of Family Name</label><input type="text" name="head_of_family_name" required></div>
        <div class="form-field"><label>Assigned Relief Camp</label>
          <select name="camp_id" class="filter-select" style="width:100%">
            ${camps.map(c => `<option value="${c.camp_id}">${esc(c.camp_name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Total Members</label><input type="number" name="total_members" value="1" required></div>
        <div class="form-field"><label>Contact Phone</label><input type="tel" name="contact_phone"></div>
        <div style="display:flex;gap:20px;margin-bottom:15px;margin-top:10px">
          <label class="filter-toggle"><input type="checkbox" name="has_elderly"> Has Elderly</label>
          <label class="filter-toggle"><input type="checkbox" name="has_children_under_5"> Under-5</label>
        </div>
      `;
    } else if (section === 'volunteers') {
      html = `
        <div class="form-field"><label>Full Name</label><input type="text" name="full_name" required></div>
        <div class="form-field"><label>Specialization</label><input type="text" name="specialization" placeholder="e.g. Medical, Logistics"></div>
        <div class="form-field"><label>Contact Email</label><input type="email" name="email"></div>
        <div class="form-field"><label>Deployment Location</label>
          <select name="deployed_camp_id" class="filter-select" style="width:100%">
            <option value="">None (Standby)</option>
            ${camps.map(c => `<option value="${c.camp_id}">${esc(c.camp_name)}</option>`).join('')}
          </select>
        </div>
      `;
    }

    fieldsContainer.innerHTML = html;
    document.getElementById('addEntryForm').dataset.section = section;
  } catch (err) {
    fieldsContainer.innerHTML = `<div class="toast toast--error toast--visible" style="position:static">Failed to load dependencies. Please check API.</div>`;
  }
};

document.getElementById('addEntryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const section = form.dataset.section;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    data[cb.name] = cb.checked;
  });

  try {
    const res = await fetch(`${API}/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Data added successfully');
      closeModal('addModal');
      const loaders = { camps: loadCamps, inventory: loadInventory, disasters: loadDisasters, families: loadFamilies, volunteers: loadVolunteers };
      if (loaders[section]) await loaders[section]();
      if (section === 'disasters') await loadDisasterSelector();
    } else {
      showToast(result.error || 'Failed to add data', 'error');
    }
  } catch (err) {
    showToast('Network error', 'error');
  }
});

// ============================================================
// HELPERS
// ============================================================
function esc(str) {
  if (str==null) return '';
  return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}
function num(val) { if(val==null) return '—'; const n=parseFloat(val); return isNaN(n)?'—':n.toLocaleString(); }
function formatDate(val) { if(!val) return '—'; return new Date(val).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function formatDateTime(val) { if(!val) return '—'; return new Date(val).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }

function openModal(id) { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast--${type} toast--visible`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => { t.classList.remove('toast--visible'); setTimeout(() => t.remove(), 300); }, 3000);
}

function updateCount(id, current, total) {
  const el = document.getElementById(id);
  if (el) el.textContent = current === total ? `Total: ${total}` : `${current} of ${total} results`;
}

function emptyRow(tbody, cols, msg = 'No records found.') {
  tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:40px;color:var(--text-muted)">${msg}</td></tr>`;
}

// ============================================================
// INITIALIZATION
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  applyProfile();
  initProfileDropdown();
  await loadDisasterSelector();
  const online = await checkHealth();
  if (online) {
    await initDashboard();
  }
  
  initSearch();
  initSectionFilters();

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
  });
  
  document.getElementById('closeBrief')?.addEventListener('click', () => closeModal('briefModal'));
  document.getElementById('agreeBrief')?.addEventListener('click', () => closeModal('briefModal'));
  document.getElementById('briefBtn')?.addEventListener('click', () => openModal('briefModal'));

  ['camps', 'inventory', 'disasters', 'families', 'volunteers', 'audit'].forEach(bindSortHeaders);
});
