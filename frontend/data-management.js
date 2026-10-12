const tableTitle = document.getElementById('tableTitle');
const recordHead = document.getElementById('recordHead');
const recordBody = document.getElementById('recordBody');
const recordSearch = document.getElementById('recordSearch');
const recordRange = document.getElementById('recordRange');
const databaseStatus = document.getElementById('databaseStatus');
const recordForm = document.getElementById('recordForm');
const editorPanel = document.getElementById('editorPanel');
const editorKicker = document.getElementById('editorKicker');
const editorTitle = document.getElementById('editorTitle');
const editorNote = document.getElementById('editorNote');
const toast = document.getElementById('toast');
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '5000' ? 'http://127.0.0.1:5000' : '';
const configs = {
  users: { title: 'Users', columns: ['id', 'name', 'email', 'created_at'], fields: [['name', 'Full name', 'text'], ['email', 'Email address', 'email'], ['password', 'Password', 'password']], notes: 'Passwords are write-only and are never displayed.' },
  menu_items: { title: 'Menu items', columns: ['id', 'name', 'category', 'price', 'restaurant', 'type'], fields: [['name', 'Item name', 'text'], ['price', 'Price (NPR)', 'number'], ['category', 'Category', 'text'], ['restaurant', 'Restaurant', 'text'], ['rating', 'Rating', 'text'], ['type', 'Food type', 'select']], notes: 'Edit the catalog details shown to customers.' },
  orders: { title: 'Orders', columns: ['id', 'customer_name', 'email', 'payment', 'total', 'created_at'], fields: [['id', 'Order ID', 'text'], ['customer_name', 'Customer name', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone', 'text'], ['address', 'Address', 'text'], ['city', 'City', 'text'], ['pin', 'PIN code', 'text'], ['payment', 'Payment method', 'text'], ['subtotal', 'Subtotal', 'number'], ['delivery', 'Delivery fee', 'number'], ['tax', 'Tax', 'number'], ['total', 'Total', 'number'], ['items', 'Items JSON', 'textarea']], notes: 'Orders can be corrected or removed from storage.' }
};
let selectedTable = 'users';
let records = {};
let editingId = null;

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600); }
function displayValue(value) { if (value === null || value === undefined || value === '') return '—'; if (typeof value === 'string' && value.length > 32) return `${escapeHtml(value.slice(0, 32))}…`; return escapeHtml(value); }
function formatHeader(column) { return column.replaceAll('_', ' '); }

function renderTable() {
  const config = configs[selectedTable];
  const query = recordSearch.value.trim().toLowerCase();
  const filtered = (records[selectedTable] || []).filter((row) => !query || JSON.stringify(row).toLowerCase().includes(query));
  tableTitle.textContent = config.title;
  recordHead.innerHTML = `<tr>${config.columns.map((column) => `<th>${formatHeader(column)}</th>`).join('')}<th>Actions</th></tr>`;
  recordBody.innerHTML = filtered.length ? filtered.map((row) => `<tr>${config.columns.map((column) => `<td title="${escapeHtml(row[column])}">${displayValue(column === 'price' || column === 'total' ? `₹${row[column]}` : row[column])}</td>`).join('')}<td><div class="action-cell"><button class="record-link" data-edit="${escapeHtml(row.id)}">Edit</button><button class="danger-action" data-delete="${escapeHtml(row.id)}">Delete</button></div></td></tr>`).join('') : `<tr><td class="table-state" colspan="${config.columns.length + 1}">No records match your search.</td></tr>`;
  recordRange.textContent = `Showing ${filtered.length} of ${(records[selectedTable] || []).length} records`;
  recordBody.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => openEditor(button.dataset.edit)));
  recordBody.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteRecord(button.dataset.delete)));
}

function renderForm(record = {}) {
  const config = configs[selectedTable];
  recordForm.innerHTML = config.fields.map(([key, label, type]) => {
    const value = record[key] ?? (key === 'items' ? '[]' : '');
    if (type === 'select') return `<div class="editor-field"><label for="field-${key}">${label}</label><select id="field-${key}" name="${key}"><option value="veg" ${value === 'veg' ? 'selected' : ''}>Vegetarian</option><option value="nonveg" ${value === 'nonveg' ? 'selected' : ''}>Non-vegetarian</option></select></div>`;
    if (type === 'textarea') return `<div class="editor-field"><label for="field-${key}">${label}</label><textarea id="field-${key}" name="${key}" spellcheck="false">${escapeHtml(typeof value === 'object' ? JSON.stringify(value, null, 2) : value)}</textarea></div>`;
    return `<div class="editor-field"><label for="field-${key}">${label}</label><input id="field-${key}" name="${key}" type="${type}" value="${escapeHtml(value)}" ${key === 'id' && editingId ? 'readonly' : ''} ${key === 'password' && editingId ? 'placeholder="Leave blank to keep current password"' : ''} /></div>`;
  }).join('');
}

function openEditor(id = null) {
  editingId = id;
  const record = id === null ? {} : (records[selectedTable] || []).find((item) => String(item.id) === String(id));
  editorPanel.classList.add('open');
  editorKicker.textContent = id === null ? 'New record' : 'Edit record';
  editorTitle.textContent = `${id === null ? 'Add' : 'Edit'} ${configs[selectedTable].title.toLowerCase().replace(/ items$/, ' item').replace(/s$/, '')}`;
  editorNote.textContent = configs[selectedTable].notes;
  renderForm(record);
  editorPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditor() { editingId = null; editorPanel.classList.remove('open'); recordForm.innerHTML = ''; }
async function loadRecords() {
  databaseStatus.textContent = 'Loading...';
  try {
    const response = await fetch(`${API_BASE}/api/database/records`);
    if (!response.ok) throw new Error();
    const data = await response.json(); records = data.tables; databaseStatus.textContent = 'Connected'; databaseStatus.style.color = '#43d998';
    Object.entries(records).forEach(([table, rows]) => { const id = table === 'menu_items' ? 'menuItems' : table; const count = document.getElementById(`${id}Count`); if (count) count.textContent = `${rows.length} records`; });
    renderTable();
  } catch (error) { databaseStatus.textContent = 'Offline'; databaseStatus.style.color = '#ff9b81'; recordBody.innerHTML = '<tr><td class="table-state" colspan="7">Could not load database records.</td></tr>'; }
}

async function saveRecord(event) {
  event.preventDefault();
  const formData = new FormData(recordForm);
  const payload = Object.fromEntries(formData.entries());
  if (selectedTable === 'menu_items') ['price'].forEach((key) => { payload[key] = Number(payload[key] || 0); });
  if (selectedTable === 'orders') { ['subtotal', 'delivery', 'tax', 'total'].forEach((key) => { payload[key] = Number(payload[key] || 0); }); try { payload.items = JSON.parse(payload.items || '[]'); } catch (error) { showToast('Items must contain valid JSON.'); return; } }
  if (selectedTable === 'users' && editingId && !payload.password) delete payload.password;
  const url = `${API_BASE}/api/database/manage/${selectedTable}${editingId ? `/${editingId}` : ''}`;
  const saveButton = document.getElementById('saveButton'); saveButton.disabled = true;
  try { const response = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Save failed.'); showToast('Record saved.'); closeEditor(); await loadRecords(); } catch (error) { showToast(error.message); } finally { saveButton.disabled = false; }
}

async function deleteRecord(id) {
  if (!window.confirm(`Delete this ${configs[selectedTable].title.toLowerCase().replace(/s$/, '')}? This cannot be undone.`)) return;
  try { const response = await fetch(`${API_BASE}/api/database/manage/${selectedTable}/${id}`, { method: 'DELETE' }); const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Delete failed.'); showToast('Record deleted.'); if (String(editingId) === String(id)) closeEditor(); await loadRecords(); } catch (error) { showToast(error.message); }
}

document.querySelectorAll('[data-table]').forEach((button) => button.addEventListener('click', () => { selectedTable = button.dataset.table; document.querySelectorAll('[data-table]').forEach((item) => item.classList.toggle('active', item.dataset.table === selectedTable)); recordSearch.value = ''; closeEditor(); renderTable(); }));
recordSearch.addEventListener('input', renderTable);
document.getElementById('addButton').addEventListener('click', () => openEditor());
document.getElementById('refreshButton').addEventListener('click', loadRecords);
document.getElementById('cancelButton').addEventListener('click', closeEditor);
document.getElementById('closeEditorButton').addEventListener('click', closeEditor);
recordForm.addEventListener('submit', saveRecord);
loadRecords();
