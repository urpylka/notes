const examples = {
  sequence: `sequenceDiagram
    autonumber
    participant User as Пользователь
    participant UI as Browser UI
    participant API as Backend API
    participant DB as Database

    User->>UI: Нажимает кнопку
    UI->>API: POST /api/example
    API->>DB: Проверить и сохранить
    DB-->>API: OK
    API-->>UI: 201 Created
    UI-->>User: Показать результат`,
  flowchart: `flowchart TD
    A[Получили запрос] --> B{Данные валидны?}
    B -- Да --> C[Выполнить действие]
    B -- Нет --> D[Показать ошибку]
    C --> E[Вернуть результат]`,
  state: `stateDiagram-v2
    [*] --> Created
    Created --> Authorized: TOTP verified
    Authorized --> Paid: Pay
    Authorized --> Expired: TTL expired
    Paid --> [*]
    Expired --> [*]`,
};

const editor = document.getElementById('diagram-source');
const preview = document.getElementById('diagram-preview');
const message = document.getElementById('message');
const exportSvgButton = document.getElementById('export-svg');
const exportJpegButton = document.getElementById('export-jpeg');
const downloadSourceButton = document.getElementById('download-source');
const copySvgButton = document.getElementById('copy-svg');
const fileInput = document.getElementById('file-input');
const filenameInput = document.getElementById('filename');
const themeSelect = document.getElementById('theme');
const fitToggle = document.getElementById('fit-width');

let renderId = 0;
let currentSvg = '';
let renderTimer = null;

function setMessage(text, type = 'info') {
  message.textContent = text;
  message.dataset.type = type;
}

function setExportState(enabled) {
  exportSvgButton.disabled = !enabled;
  exportJpegButton.disabled = !enabled;
  copySvgButton.disabled = !enabled;
}

function sanitizeFilename(value, fallback) {
  const cleaned = String(value || '')
    .trim()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

function currentBaseName() {
  return sanitizeFilename(filenameInput.value, 'mermaid-diagram');
}

function buildSvgDocument(svgText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.documentElement;

  if (!svg || svg.nodeName.toLowerCase() !== 'svg') {
    throw new Error('Rendered output is not an SVG document.');
  }

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  if (!svg.getAttribute('width') || !svg.getAttribute('height')) {
    const viewBox = parseViewBox(svg);
    svg.setAttribute('width', String(Math.ceil(viewBox.width)));
    svg.setAttribute('height', String(Math.ceil(viewBox.height)));
  }

  return new XMLSerializer().serializeToString(svg);
}

function parseViewBox(svg) {
  const viewBox = String(svg.getAttribute('viewBox') || '').trim();
  const parts = viewBox.split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  }

  const width = parseDimension(svg.getAttribute('width'), 1000);
  const height = parseDimension(svg.getAttribute('height'), 700);
  return { x: 0, y: 0, width, height };
}

function parseDimension(value, fallback) {
  const parsed = Number.parseFloat(String(value || '').replace('px', ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function triggerDownload(filename, href) {
  const element = document.createElement('a');
  element.download = filename;
  element.href = href;
  document.body.appendChild(element);
  element.click();
  element.remove();
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  triggerDownload(filename, url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderDiagram() {
  const source = editor.value.trim();
  renderId += 1;
  const localRenderId = renderId;
  currentSvg = '';
  setExportState(false);

  if (!source) {
    preview.innerHTML = '<div class="empty-state">Введите Mermaid код слева.</div>';
    setMessage('Ожидаю Mermaid код.', 'info');
    return;
  }

  try {
    if (!window.mermaid) {
      throw new Error('Mermaid library did not load. Check the CDN request in the browser console.');
    }

    window.mermaid.initialize({
      startOnLoad: false,
      theme: themeSelect.value,
      securityLevel: 'strict',
    });

    const result = await window.mermaid.render(`mermaid-diagram-${Date.now()}-${localRenderId}`, source);
    if (localRenderId !== renderId) return;

    currentSvg = buildSvgDocument(result.svg);
    preview.innerHTML = currentSvg;
    preview.classList.toggle('is-fit', fitToggle.checked);
    setExportState(true);
    setMessage('Диаграмма построена.', 'success');
  } catch (error) {
    if (localRenderId !== renderId) return;
    preview.innerHTML = '<div class="empty-state empty-state--error">Mermaid не смог построить диаграмму.</div>';
    setMessage(error && error.message ? error.message : 'Ошибка рендера Mermaid.', 'error');
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderDiagram, 250);
}

function loadExample(name) {
  editor.value = examples[name] || examples.sequence;
  filenameInput.value = `${name}-diagram`;
  scheduleRender();
}

function exportSvg() {
  if (!currentSvg) return;
  downloadBlob(
    `${currentBaseName()}.svg`,
    new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' }),
  );
}

function exportJpeg() {
  if (!currentSvg) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(currentSvg, 'image/svg+xml');
  const svg = doc.documentElement;
  const box = parseViewBox(svg);
  const scale = 2;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const image = new Image();
  const svgBlob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  canvas.width = Math.ceil(box.width * scale);
  canvas.height = Math.ceil(box.height * scale);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  image.onload = () => {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    triggerDownload(`${currentBaseName()}.jpg`, canvas.toDataURL('image/jpeg', 0.92));
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
    setMessage('Не удалось экспортировать JPEG из текущего SVG.', 'error');
  };

  image.src = url;
}

function downloadSource() {
  downloadBlob(
    `${currentBaseName()}.mmd`,
    new Blob([editor.value], { type: 'text/plain;charset=utf-8' }),
  );
}

async function copySvg() {
  if (!currentSvg || !navigator.clipboard) return;
  await navigator.clipboard.writeText(currentSvg);
  setMessage('SVG скопирован в буфер обмена.', 'success');
}

async function openSourceFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    editor.value = await file.text();
    filenameInput.value = sanitizeFilename(file.name, 'mermaid-diagram');
    setMessage(`Открыт файл ${file.name}.`, 'info');
    scheduleRender();
  } catch (error) {
    setMessage(error && error.message ? error.message : 'Не удалось открыть файл.', 'error');
  } finally {
    fileInput.value = '';
  }
}

function initializeTool() {
  editor.addEventListener('input', scheduleRender);
  fileInput.addEventListener('change', openSourceFile);
  themeSelect.addEventListener('change', renderDiagram);
  exportSvgButton.addEventListener('click', exportSvg);
  exportJpegButton.addEventListener('click', exportJpeg);
  downloadSourceButton.addEventListener('click', downloadSource);
  copySvgButton.addEventListener('click', () => {
    copySvg().catch((error) => {
      setMessage(error && error.message ? error.message : 'Не удалось скопировать SVG.', 'error');
    });
  });

  fitToggle.addEventListener('change', () => {
    preview.classList.toggle('is-fit', fitToggle.checked);
  });

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => loadExample(button.dataset.example));
  });

  loadExample('sequence');
}

initializeTool();
