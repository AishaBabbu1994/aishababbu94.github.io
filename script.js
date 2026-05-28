/* --- HELPERS --- */
function getEl(id) { return document.getElementById(id); }

/* --- PROMPT DE FORMATEO PROFESIONAL CON EMOJIS --- */
function buildPrompt(text, mode, targetLang = 'english') {
  const base = `Actúa como un experto editor técnico y creativo. Tu objetivo es convertir el texto en un Markdown perfectamente ordenado, profesional y MUY ATRACTIVO visualmente.

REGLAS ORO:
1. EMOJIS OBLIGATORIOS: Incluye SIEMPRE emojis relevantes al inicio de cada título (#, ##, ###) y en los puntos clave de las listas.
2. Jerarquía Lógica: Usa títulos (#, ##, ###) de forma clara.
3. Justificación Visual: Asegura una línea en blanco entre párrafos, títulos y secciones.
4. Listas Limpias: Cada punto debe empezar con un emoji (ej: - 🚀 Punto importante).
5. Tablas Pro: Si hay datos tabulares, formatéalos en tablas Markdown alineadas.
6. Sin Charla: Responde SOLO con el código Markdown formateado.`;

  if (mode === 'markdown') {
    return `${base}\n\nTransforma el siguiente texto aplicando formato y emojis:\n\n${text}`;
  } else {
    const langs = { english: 'inglés', french: 'francés', italian: 'italiano', portuguese: 'portugués', german: 'alemán' };
    return `${base}\n\nTraduce al ${langs[targetLang] || 'inglés'} manteniendo el formato e incluyendo emojis:\n\n${text}`;
  }
}

/* --- LLAMADA A API (GROQ) --- */
async function callAI(prompt) {
  const apiKey = localStorage.getItem('textmagic_apikey') || getEl('apiKey').value;
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 3500
    })
  });

  if (!response.ok) throw new Error('La magia ha fallado (Error en API)');
  const data = await response.json();
  return data.choices[0].message.content;
}

/* --- PROCESAMIENTO PRINCIPAL --- */
async function processText() {
  const text = getEl('inputText').value.trim();
  if (!text) return showToast('✍️ Escribe algo primero', 'warning');

  getEl('loading').classList.remove('hidden');
  getEl('result').classList.add('hidden');
  getEl('progress-fill').style.width = '20%';

  try {
    const mode = document.querySelector('.mode-btn.active').dataset.mode;
    const lang = getEl('targetLang').value;
    
    const result = await callAI(buildPrompt(text, mode, lang));
    
    getEl('outputContent').textContent = result;
    
    // Sistema de puntuación ficticio
    const score = 90 + Math.floor(Math.random() * 10);
    getEl('scoreValue').textContent = score;
    getEl('scoreCircle').style.background = `conic-gradient(#10b981 ${score}%, #334155 ${score}%)`;
    
    getEl('result').classList.remove('hidden');
    getEl('scoreContainer').classList.remove('hidden');
    getEl('progress-fill').style.width = '100%';
    createConfetti();
    showToast('🎉 ¡Formateado con éxito!', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    setTimeout(() => getEl('loading').classList.add('hidden'), 500);
  }
}

/* --- EFECTOS Y EVENTOS --- */
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  if(localStorage.getItem('textmagic_apikey')) getEl('apiKey').value = localStorage.getItem('textmagic_apikey');
  getEl('apiKey').addEventListener('input', (e) => localStorage.setItem('textmagic_apikey', e.target.value));
  getEl('processBtn').addEventListener('click', processText);
  getEl('clearBtn').addEventListener('click', () => { getEl('inputText').value = ""; getEl('result').classList.add('hidden'); });
  getEl('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(getEl('outputContent').textContent);
    showToast('📋 Copiado al portapapeles', 'info');
  });

  getEl('downloadBtn').addEventListener('click', () => {
    const blob = new Blob([getEl('outputContent').textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "magic-text.md"; a.click();
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      getEl('translateOptions').classList.toggle('hidden', btn.dataset.mode !== 'translate');
    });
  });

  getEl('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    getEl('themeToggle').innerHTML = newTheme === 'dark' ? '🌙' : '☀️';
  });
});

function createParticles() {
  const container = getEl('particles');
  for (let i = 0; i < 15; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 5 + 5) + 's';
    container.appendChild(p);
  }
}

function createConfetti() {
  for (let i = 0; i < 30; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.backgroundColor = ['#8b5cf6', '#ec4899', '#10b981'][Math.floor(Math.random()*3)];
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

function showToast(msg, type) {
  const container = getEl('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
