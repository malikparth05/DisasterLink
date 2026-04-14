// ============================================================
// Warm Command — Frontend Application logic
// DisasterLink Project
// ============================================================

const API = 'http://localhost:3001/api';

// ---- State ----
let campsData      = [];
let inventoryData  = [];
let shortagesData  = [];
let volunteersData = [];
let familiesData   = [];
let auditData      = [];
let disastersData  = [];

// ============================================================
// NAVIGATION
// ============================================================
const sectionTitles = {
  dashboard: 'Mission Dashboard',
  disasters: 'Operation Disasters',
  camps:     'Relief Camps Monitor',
  families:  'Family Registry',
  inventory: 'Inventory & Shortages',
  register:  'Register Family',
  audit:     'Operational Audit Logs',
  volunteers:'Volunteer Taskings',
};

document.querySelectorAll('.nav-item').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const section = link.dataset.section;
    if (section) activateSection(section);
  });
});

function activateSection(section) {
  // Update Nav visual
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`[data-section="${section}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Switch Sections
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const activeSec = document.getElementById(`sec-${section}`);
  if (activeSec) activeSec.classList.add('active');

  // Update Topbar
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) pageTitle.textContent = sectionTitles[section] || 'Dashboard';

  // Data Loading logic
  if (section === 'dashboard') initDashboard();
  if (section === 'camps'     && campsData.length     === 0) loadCamps();
  if (section === 'inventory' && inventoryData.length  === 0) loadInventory();
  if (section === 'volunteers'&& volunteersData.length === 0) loadVolunteers();
  if (section === 'families'  && familiesData.length   === 0) loadFamilies();
  if (section === 'audit'     && auditData.length      === 0) loadAudit();
  if (section === 'disasters' && disastersData.length  === 0) loadDisasters();
}

// ============================================================
// CONNECTION STATUS
// ============================================================
async function checkHealth() {
  const dot   = document.querySelector('.conn-dot');
  const label = document.getElementById('connLabel');
  try {
    const r = await fetch(`${API}/health`);
    if (r.ok) {
      dot.className   = 'conn-dot online';
      label.textContent = 'ONLINE';
    } else throw new Error();
  } catch {
    dot.className   = 'conn-dot offline';
    label.textContent = 'OFFLINE';
  }
}

// ============================================================
// DASHBOARD LOGIC (MISSION HUB)
// ============================================================
async function initDashboard() {
  await Promise.all([
    loadStats(),
    loadSeverityAlerts(),
    loadCampPreviews()
  ]);
}

async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`);
    const stats = await res.json();
    
    // Mapping to new KPI elements
    const kpiCamps = document.getElementById('kpi-camps');
    const kpiOcc   = document.getElementById('kpi-occupancy');
    const kpiShort = document.getElementById('kpi-shortages');
    const kpiAid   = document.getElementById('kpi-aid');

    if (kpiCamps) kpiCamps.textContent = stats.total_camps || '0';
    if (kpiOcc) {
        const occ = stats.global_occupancy_pct || 0;
        kpiOcc.textContent = occ > 90 ? 'CRITICAL' : occ > 75 ? 'RISK' : 'NOMINAL';
        kpiOcc.style.color = occ > 90 ? '#c1272d' : occ > 75 ? '#f59e0b' : '#4ca388';
    }
    if (kpiShort) kpiShort.textContent = String(stats.critical_shortages || 0).padStart(2, '0');
    
    // Dynamically calculate 'Aid Today' based on distribution volume
    const distRes = await fetch(`${API}/volunteers`);
    const vols = await distRes.json();
    const totalAid = vols.reduce((sum, v) => sum + (v.units_distributed || 0), 0);
    if (kpiAid) kpiAid.textContent = num(totalAid);
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

async function loadSeverityAlerts() {
    const list = document.getElementById('severityList');
    if (!list) return;

    try {
        const res = await fetch(`${API}/inventory`);
        const shortages = await res.json();
        
        if (shortages.length === 0) {
            list.innerHTML = '<p style="font-size:12px;color:var(--text-muted);padding:10px;">All systems nominal. No shortages detected.</p>';
            return;
        }

        // Take top 3 most critical
        list.innerHTML = shortages.slice(0, 3).map(s => {
            const isCrit = s.shortage_amount > (s.minimum_threshold * 0.5);
            return `
            <div class="severity-card ${isCrit ? 'severity-card--crit' : 'severity-card--warn'}">
              <div class="sev-icon ${isCrit ? 'sev-icon--red' : 'sev-icon--amber'}">
                ${s.category === 'Medical' ? '💊' : s.category === 'Food' ? '🍞' : '📦'}
              </div>
              <div class="sev-body">
                <h4>${isCrit ? 'Critical Low' : 'Warning'}: ${esc(s.resource_name)}</h4>
                <p>${esc(s.camp_name)} is below threshold by ${num(s.shortage_amount)} units.</p>
                <button class="sev-btn ${isCrit ? 'btn-red' : 'btn-amber'}">${isCrit ? 'Expedite Order' : 'Reallocate'}</button>
              </div>
            </div>`;
        }).join('');

    } catch (err) {
        console.error('Severity alerts failed:', err);
    }
}

async function loadCampPreviews() {
    const row = document.getElementById('campPreviewList');
    if (!row) return;

    try {
        const res = await fetch(`${API}/camps`);
        const camps = await res.json();

        row.className = 'kpi-row'; // Use kpi-row grid for alignment
        row.style.marginTop = '20px';
        row.style.gap = '10px';
        
        row.innerHTML = camps.slice(0, 3).map(c => `
        <div class="kpi-card" style="padding: 12px; border-radius: 12px;">
           <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">${esc(c.district)}</div>
           <div style="font-size: 14px; font-weight: 800; margin-bottom: 4px;">${esc(c.camp_name)}</div>
           <div style="font-size: 11px; font-weight: 600;">Occ: ${c.occupancy_percentage}%</div>
        </div>`).join('');
    } catch (err) {
        console.error('Camp previews failed:', err);
    }
}

// ============================================================
// DATA TABLES (REFACTORED RENDERERS)
// ============================================================
async function loadCamps() {
  try {
    const res = await fetch(`${API}/camps`);
    campsData = await res.json();
    renderCamps(campsData);
  } catch (err) { console.error(err); }
}

function renderCamps(data) {
  const tbody = document.getElementById('campsBody');
  if (!tbody) return;
  tbody.innerHTML = data.map(c => `
    <tr>
      <td><strong>${esc(c.camp_name)}</strong></td>
      <td>${esc(c.district)}</td>
      <td>${esc(c.managing_organization)}</td>
      <td>${num(c.current_occupancy)} / ${num(c.total_capacity)}</td>
      <td>
        <span class="badge ${c.occupancy_percentage > 90 ? 'badge--rose' : 'badge--verified'}">
          ${c.occupancy_percentage}%
        </span>
      </td>
    </tr>`).join('');
}

async function loadInventory() {
    try {
      const res = await fetch(`${API}/inventory`);
      shortagesData = await res.json();
      renderInventory(shortagesData);
    } catch (err) { console.error(err); }
}

function renderInventory(data) {
    const tbody = document.getElementById('inventoryBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(s => `
      <tr>
        <td>${esc(s.camp_name)}</td>
        <td><strong>${esc(s.resource_name)}</strong></td>
        <td>${num(s.quantity_available)}</td>
        <td>${num(s.minimum_threshold)}</td>
        <td><span class="badge badge--rose">-${num(s.shortage_amount)}</span></td>
      </tr>`).join('');
}

async function loadFamilies() {
    try {
      const res = await fetch(`${API}/families`);
      familiesData = await res.json();
      renderFamilies(familiesData);
    } catch (err) { console.error(err); }
}

function renderFamilies(data) {
    const tbody = document.getElementById('familiesBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(f => `
      <tr>
        <td><strong>${esc(f.head_of_family_name)}</strong></td>
        <td>${esc(f.camp_name || 'PENDING')}</td>
        <td>${f.total_members}</td>
        <td>${formatDate(f.registration_date)}</td>
        <td><span class="badge ${f.verification_status === 'Verified' ? 'badge--verified' : 'badge--pending'}">${f.verification_status}</span></td>
      </tr>`).join('');
}

async function loadAudit() {
    try {
      const res = await fetch(`${API}/audit`);
      auditData = await res.json();
      renderAudit(auditData);
    } catch (err) { console.error(err); }
}

function renderAudit(data) {
    const tbody = document.getElementById('auditBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(a => `
      <tr>
        <td style="font-size:12px; color:var(--text-muted)">${formatDateTime(a.log_timestamp)}</td>
        <td>${esc(a.camp_name)}</td>
        <td><span class="badge badge--pending">${esc(a.event_type)}</span></td>
        <td>${esc(a.description)}</td>
      </tr>`).join('');
}

async function loadVolunteers() {
  try {
    const res = await fetch(`${API}/volunteers`);
    volunteersData = await res.json();
    renderVolunteers(volunteersData);
  } catch (err) { console.error(err); }
}

function renderVolunteers(data) {
  const tbody = document.getElementById('volunteersBody');
  if (!tbody) return;
  tbody.innerHTML = data.map((v, i) => `
    <tr>
      <td><span class="badge badge--verified">${i+1}</span></td>
      <td><strong>${esc(v.full_name)}</strong></td>
      <td>${esc(v.specialization)}</td>
      <td>${num(v.total_distributions_handled)}</td>
      <td>${num(v.units_distributed)}</td>
    </tr>`).join('');
}

async function loadDisasters() {
    try {
      const res = await fetch(`${API}/disasters`);
      disastersData = await res.json();
      renderDisasters(disastersData);
    } catch (err) { console.error(err); }
}

function renderDisasters(data) {
    const tbody = document.getElementById('disastersBody');
    if (!tbody) return;
    tbody.innerHTML = data.map(d => `
      <tr>
        <td>${d.disaster_id}</td>
        <td><strong>${esc(d.name)}</strong></td>
        <td>${esc(d.type)}</td>
        <td><span class="badge ${d.severity_level === 'Critical' ? 'badge--rose' : 'badge--verified'}">${d.severity_level}</span></td>
        <td>${formatDate(d.start_date)}</td>
        <td>${esc(d.status)}</td>
      </tr>`).join('');
}

// ============================================================
// FORMS
// ============================================================
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const payload = {
    head_of_family:   this.f_head.value.trim(),
    total_members:    parseInt(this.f_members.value, 10),
    phone:            this.f_phone.value.trim(),
    disability_count: 0,
    under_5:          false,
    has_elderly:      false
  };

  try {
    const res  = await fetch(`${API}/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert('Registration Successful: ' + data.message);
      this.reset();
      activateSection('dashboard');
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) { alert('Network Error'); }
});

// ============================================================
// HELPERS
// ============================================================
function esc(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
}

function num(val) {
    if (val == null) return '—';
    const n = parseFloat(val);
    return isNaN(n) ? '—' : n.toLocaleString();
}

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatDateTime(val) {
    if (!val) return '—';
    return new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query === '') {
            // Reset all tables to full data
            if (campsData.length > 0) renderCamps(campsData);
            if (familiesData.length > 0) renderFamilies(familiesData);
            if (volunteersData.length > 0) renderVolunteers(volunteersData);
            if (disastersData.length > 0) renderDisasters(disastersData);
            if (shortagesData.length > 0) renderInventory(shortagesData);
            if (auditData.length > 0) renderAudit(auditData);
            return;
        }

        // Search across current section
        const activeSection = document.querySelector('.section.active');
        if (!activeSection) return;

        const sectionId = activeSection.id;
        let filteredData = [];

        if (sectionId === 'sec-camps' && campsData.length > 0) {
            filteredData = campsData.filter(c =>
                c.camp_name.toLowerCase().includes(query) ||
                c.district.toLowerCase().includes(query) ||
                c.managing_organization.toLowerCase().includes(query)
            );
            renderCamps(filteredData);
            showSearchFeedback(filteredData.length, 'camps');
        } else if (sectionId === 'sec-families' && familiesData.length > 0) {
            filteredData = familiesData.filter(f =>
                f.head_of_family_name.toLowerCase().includes(query) ||
                (f.camp_name && f.camp_name.toLowerCase().includes(query)) ||
                f.contact_phone.toLowerCase().includes(query)
            );
            renderFamilies(filteredData);
            showSearchFeedback(filteredData.length, 'families');
        } else if (sectionId === 'sec-volunteers' && volunteersData.length > 0) {
            filteredData = volunteersData.filter(v =>
                v.full_name.toLowerCase().includes(query) ||
                (v.specialization && v.specialization.toLowerCase().includes(query))
            );
            renderVolunteers(filteredData);
            showSearchFeedback(filteredData.length, 'volunteers');
        } else if (sectionId === 'sec-disasters' && disastersData.length > 0) {
            filteredData = disastersData.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.type.toLowerCase().includes(query) ||
                d.severity_level.toLowerCase().includes(query)
            );
            renderDisasters(filteredData);
            showSearchFeedback(filteredData.length, 'disasters');
        } else if (sectionId === 'sec-inventory' && shortagesData.length > 0) {
            filteredData = shortagesData.filter(s =>
                s.camp_name.toLowerCase().includes(query) ||
                s.resource_name.toLowerCase().includes(query) ||
                s.category.toLowerCase().includes(query)
            );
            renderInventory(filteredData);
            showSearchFeedback(filteredData.length, 'items');
        } else if (sectionId === 'sec-audit' && auditData.length > 0) {
            filteredData = auditData.filter(a =>
                a.camp_name.toLowerCase().includes(query) ||
                a.event_type.toLowerCase().includes(query) ||
                a.description.toLowerCase().includes(query)
            );
            renderAudit(filteredData);
            showSearchFeedback(filteredData.length, 'logs');
        }
    });
}

function showSearchFeedback(count, itemType) {
    const tbody = document.querySelector('.section.active tbody');
    if (!tbody) return;

    if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="100" style="text-align: center; padding: 40px; color: var(--text-muted);">
            <div style="font-size: 14px; font-weight: 700;">No results found</div>
            <div style="font-size: 12px; margin-top: 8px;">Try a different search term</div>
        </td></tr>`;
    }
}

// ============================================================
// INIT
// ============================================================
(async () => {
    await checkHealth();
    await initDashboard();
    initBriefModal();
    initImpactChart();
    initSearch();
})();

// ============================================================
// MISSION IMPACT NARRATIVE (Problem/Resolution Modal)
// ============================================================
function initBriefModal() {
    const modal = document.getElementById('briefModal');
    const openBtn = document.querySelector('.btn-hero--white'); // Operational Brief button
    const closeBtn = document.getElementById('closeBrief');
    const agreeBtn = document.getElementById('agreeBrief');

    if (openBtn) openBtn.onclick = () => modal.classList.add('active');
    
    const close = () => modal.classList.remove('active');
    if (closeBtn) closeBtn.onclick = close;
    if (agreeBtn) agreeBtn.onclick = close;

    // Close on backdrop click
    modal.onclick = (e) => { if (e.target === modal) close(); };
}

// ============================================================
// DATA VISUALIZATION (Chart.js Impact Chart)
// ============================================================
function initImpactChart() {
    const ctx = document.getElementById('impactChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],
            datasets: [{
                label: 'Cumulative Aid Distributions',
                data: [120, 350, 680, 920, 1150, 1420, 1747], // Reflecting our 1.5k+ scale
                borderColor: '#634b30',
                backgroundColor: 'rgba(99, 75, 48, 0.1)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}
