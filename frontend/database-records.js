const tableTitle = document.getElementById('tableTitle');
const tableDescription = document.getElementById('tableDescription');
const recordHead = document.getElementById('recordHead');
const recordBody = document.getElementById('recordBody');
const recordSearch = document.getElementById('recordSearch');
const visibleCount = document.getElementById('visibleCount');
const recordRange = document.getElementById('recordRange');
const databaseStatus = document.getElementById('databaseStatus');
const lastUpdated = document.getElementById('lastUpdated');
const refreshButton = document.getElementById('refreshButton');
const recordModal = document.getElementById('recordModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '5000' ? 'http://127.0.0.1:5000' : '';
const tableConfig = {
  users: { title: 'Users', description: 'Accounts registered in Biteora.', columns: ['id', 'name', 'email', 'created_at'] },
  menu_items: { title: 'Menu items', description: 'Food and drinks available in the Biteora catalog.', columns: ['id', 'name', 'category', 'price', 'restaurant', 'type'] },
  orders: { title: 'Orders', description: 'Customer orders stored by the checkout flow.', columns: ['id', 'customer_name', 'email', 'payment', 'total', 'created_at'] }
};
let records = {};
let selectedTable = 'users';

function formatHeader(column) { return column.replaceAll('_', ' '); }
function formatCell(value, row, column) {
  if (value === null || value === undefined || value === '') return '<span class="muted-cell">—</span>';
  if (typeof value === 'object') return '<button class="record-link" data-record-id="' + escapeAttribute(row.id) + '">View JSON</button>';
  if (['price', 'total'].includes(column) && typeof value === 'number') return `₹${value}`;
  if (typeof value === 'string' && value.length > 38) return `${escapeHtml(value.slice(0, 38))}…`;
  if (columnIsStatus(value)) return `<span class="record-pill">${escapeHtml(String(value))}</span>`;
  return escapeHtml(String(value));
}
function columnIsStatus(value) { return ['veg', 'nonveg', 'cod', 'esewa', 'khalti'].includes(String(value).toLowerCase()); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, '&#096;'); }

function renderTable() {
  const config = tableConfig[selectedTable];
  const query = recordSearch.value.trim().toLowerCase();
  const filtered = (records[selectedTable] || []).filter((row) => !query || JSON.stringify(row).toLowerCase().includes(query));
  tableTitle.textContent = config.title;
  tableDescription.textContent = config.description;
  recordHead.innerHTML = `<tr>${config.columns.map((column) => `<th>${formatHeader(column)}</th>`).join('')}<th>Details</th></tr>`;
  recordBody.innerHTML = filtered.length ? filtered.map((row) => `<tr>${config.columns.map((column) => `<td title="${escapeAttribute(row[column] ?? '')}">${formatCell(row[column], row, column)}</td>`).join('')}<td><button class="record-link" data-record-id="${escapeAttribute(row.id)}">Inspect</button></td></tr>`).join('') : `<tr><td class="table-state" colspan="${config.columns.length + 1}">No records match your search.</td></tr>`;
  visibleCount.textContent = filtered.length;
  recordRange.textContent = `Showing ${filtered.length} of ${(records[selectedTable] || []).length} records`;
  recordBody.querySelectorAll('.record-link').forEach((button) => button.addEventListener('click', () => openRecord(button.dataset.recordId)));
}

function openRecord(id) {
  const record = (records[selectedTable] || []).find((item) => String(item.id) === String(id));
  if (!record) return;
  modalTitle.textContent = `${tableConfig[selectedTable].title} / ${id}`;
  modalContent.textContent = JSON.stringify(record, null, 2);
  recordModal.hidden = false;
}

async function loadRecords() {
  refreshButton.disabled = true;
  databaseStatus.textContent = 'Loading...';
  try {
    const response = await fetch(`${API_BASE}/api/database/records`);
    if (!response.ok) throw new Error('Database endpoint unavailable');
    const data = await response.json();
    records = data.tables;
    Object.entries(records).forEach(([table, rows]) => { const count = document.getElementById(`${table === 'menu_items' ? 'menuItems' : table}Count`); if (count) count.textContent = `${rows.length} records`; });
    databaseStatus.textContent = 'Connected';
    databaseStatus.style.color = '#43d998';
    lastUpdated.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    renderTable();
  } catch (error) {
    databaseStatus.textContent = 'Offline';
    databaseStatus.style.color = '#ff9b81';
    recordBody.innerHTML = `<tr><td class="table-state" colspan="7">Could not load records. Start Flask with <strong>python app.py</strong>.</td></tr>`;
  } finally { refreshButton.disabled = false; }
}

document.querySelectorAll('[data-table]').forEach((button) => button.addEventListener('click', () => {
  selectedTable = button.dataset.table;
  document.querySelectorAll('[data-table]').forEach((item) => item.classList.toggle('active', item.dataset.table === selectedTable));
  recordSearch.value = '';
  renderTable();
}));
recordSearch.addEventListener('input', renderTable);
refreshButton.addEventListener('click', loadRecords);
document.querySelectorAll('[data-close-modal]').forEach((element) => element.addEventListener('click', () => { recordModal.hidden = true; }));
loadRecords();
