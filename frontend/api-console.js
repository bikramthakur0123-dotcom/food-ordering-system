const methodSelect = document.getElementById('methodSelect');
const urlInput = document.getElementById('urlInput');
const bodyInput = document.getElementById('bodyInput');
const sendButton = document.getElementById('sendButton');
const responseOutput = document.getElementById('responseOutput');
const responseMeta = document.getElementById('responseMeta');
const responseTime = document.getElementById('responseTime');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const requestTitle = document.getElementById('requestTitle');
const toast = document.getElementById('toast');
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = isLocalFrontend && window.location.port !== '5000' ? 'http://127.0.0.1:5000' : '';
let history = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function prettyJson(value) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function selectEndpoint(button) {
  document.querySelectorAll('.endpoint-item').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  methodSelect.value = button.dataset.method;
  urlInput.value = button.dataset.path;
  bodyInput.value = button.dataset.body ? JSON.stringify(JSON.parse(button.dataset.body), null, 2) : '';
  requestTitle.textContent = button.querySelector('strong').textContent;
}

document.querySelectorAll('.endpoint-item').forEach((button) => {
  button.addEventListener('click', () => selectEndpoint(button));
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-panel').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}Panel`).classList.add('active');
  });
});

function renderHistory() {
  historyCount.textContent = `${history.length} request${history.length === 1 ? '' : 's'}`;
  if (!history.length) {
    historyList.innerHTML = '<div class="history-empty">Your recent requests will be listed here.</div>';
    return;
  }
  historyList.innerHTML = history.map((entry) => `
    <div class="history-entry">
      <span class="method ${entry.method.toLowerCase()}">${entry.method}</span>
      <span><strong>${entry.path}</strong><small>${entry.time} ms · ${entry.statusText}</small></span>
      <span class="history-status">${entry.status}</span>
    </div>`).join('');
}

async function sendRequest() {
  const method = methodSelect.value;
  const path = urlInput.value.trim();
  const target = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const startedAt = performance.now();
  const headers = { Accept: 'application/json' };
  const authValue = document.getElementById('authInput').value.trim();
  if (authValue) headers.Authorization = authValue;

  let requestBody;
  if (bodyInput.value.trim() && !['GET', 'HEAD'].includes(method)) {
    try {
      requestBody = JSON.stringify(JSON.parse(bodyInput.value));
      headers['Content-Type'] = document.getElementById('contentTypeInput').value || 'application/json';
    } catch (error) {
      showToast('Body must contain valid JSON.');
      return;
    }
  }

  sendButton.disabled = true;
  sendButton.innerHTML = '<span>Sending...</span><span>…</span>';
  responseMeta.innerHTML = '<span class="response-placeholder">Waiting for server response...</span>';
  responseOutput.innerHTML = '<code>// Sending request...</code>';
  try {
    const response = await fetch(target, { method, headers, body: requestBody });
    const elapsed = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    const statusClass = response.ok ? 'success' : 'error';
    responseTime.textContent = `${elapsed} ms`;
    responseMeta.innerHTML = `<span class="status-badge ${statusClass}">${response.status} ${response.statusText || ''}</span><span>${contentType || 'text/plain'}</span><span>${new Date().toLocaleTimeString()}</span>`;
    responseOutput.innerHTML = `<code>${escapeHtml(prettyJson(data))}</code>`;
    history.unshift({ method, path, time: elapsed, status: response.status, statusText: response.statusText || 'Response' });
    history = history.slice(0, 8);
    renderHistory();
  } catch (error) {
    const elapsed = Math.round(performance.now() - startedAt);
    responseTime.textContent = `${elapsed} ms`;
    responseMeta.innerHTML = '<span class="status-badge error">Network error</span><span>Could not reach the API server</span>';
    responseOutput.innerHTML = `<code>${escapeHtml(error.message)}\n\nStart Flask with: python app.py</code>`;
    showToast('Request failed. Is the Flask server running?');
  } finally {
    sendButton.disabled = false;
    sendButton.innerHTML = '<span>Send request</span><span>↗</span>';
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

sendButton.addEventListener('click', sendRequest);
document.getElementById('newRequestButton').addEventListener('click', () => {
  methodSelect.value = 'GET';
  urlInput.value = '/api/health';
  bodyInput.value = '';
  requestTitle.textContent = 'New request';
  showToast('New request ready.');
});
document.getElementById('clearHistoryButton').addEventListener('click', () => { history = []; renderHistory(); showToast('Request history cleared.'); });
document.getElementById('copyResponseButton').addEventListener('click', async () => {
  await navigator.clipboard.writeText(responseOutput.textContent);
  showToast('Response copied to clipboard.');
});

async function checkServer() {
  const status = document.getElementById('serverStatus');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    status.textContent = response.ok ? 'Connected' : 'Unavailable';
    status.style.color = response.ok ? '#43d998' : '#ff9b81';
  } catch (error) {
    status.textContent = 'Offline';
    status.style.color = '#ff9b81';
  }
}

renderHistory();
checkServer();
