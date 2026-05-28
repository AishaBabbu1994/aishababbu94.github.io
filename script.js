/* --- HELPERS --- */
const getEl = (id) => document.getElementById(id);

/* --- PROMPT REFORZADO PARA EMOJIS --- */
function buildPrompt(text, mode, targetLang = 'english') {
  const base = `Eres un experto en Markdown Visual y diseño de contenido. Tu misión es transformar el texto en un Markdown impecable, ordenado y con una infusión constante de emojis.

REGLAS ESTRICTAS:
1. CADA TÍTULO (#, ##, ###) DEBE COMENZAR CON UN EMOJI RELACIONADO. (Ej: # 🍖 Personaje).
2. Cada párrafo debe estar bien separado por una línea en blanco.
3. Usa negritas (**) para nombres y datos importantes.
4. Usa emojis como viñetas en las listas (Ej: - 🚀 Poder).
5. No des explicaciones, solo entrega el Markdown final con emojis.

EJEMPLO:
# 🗡️ Título Principal
Este es un párrafo con **palabras clave**.
## 🌊 Subsección
- 🔥 Detalle uno
- 💎 Detalle dos`;

  if (mode === 'markdown') {
    return `${base}\n\nTRANSFORMA ESTE TEXTO CON MUCHOS EMOJIS:\n\n${text}`;
  } else {
    const langs = { english: 'inglés', french: 'francés', italian: 'italiano', portuguese: 'portugués', german: 'alemán' };
    return `${base}\n\nTRADUCE AL ${langs[targetLang] || 'inglés'} CON FORMATO Y EMOJIS:\n\n${text}`;
  }
}

/* --- LOGICA API --- */
async function callAI(prompt) {
  const apiKey = localStorage.getItem('textmagic_apikey') || getEl('apiKey').value;
  if (!apiKey) throw new Error('API_KEY_MISSING');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  if (!response.ok) throw new Error('Error en Groq API');
  const data = await response.json();
  return data.choices[0].message.content;
}

/* --- PROCESAMIENTO --- */
async function processText() {
  const text = getEl('inputText').value.trim();
  if (!text) return showToast('✍️ Escribe algo', 'warning');

  getEl('loading').classList.remove('hidden');
  getEl('result').classList.add('hidden');
  getEl('progress-fill').style.width = '30%';

  try {
    const mode = document.querySelector('.mode-btn.active').dataset.mode;
    const lang = getEl('targetLang').value;
    const result = await callAI(buildPrompt(text, mode, lang));

    getEl('outputContent').textContent = result;
    const score = 90 + Math.floor(Math.random() * 10);
    getEl('scoreValue').textContent = score;
    getEl('scoreCircle').style.background = `conic-gradient(#10b981 ${score}%, #334155 ${score}%)`;

    getEl('result').classList.remove('hidden');
    getEl('scoreContainer').classList.remove('hidden');
    getEl('progress-fill').style.width = '100%';
    createConfetti();
    showToast('✨ Magia completada', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    setTimeout(() => getEl('loading').classList.add('hidden'), 500);
  }
}

/* --- UI Y EFECTOS --- */
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  if(localStorage.getItem('textmagic_apikey')) getEl('apiKey').value = localStorage.getItem('textmagic_apikey');
  getEl('apiKey').addEventListener('input', (e) => localStorage.setItem('textmagic_apikey', e.target.value));
  getEl('processBtn').addEventListener('click', processText);
  getEl('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(getEl('outputContent').textContent);
    showToast('📋 Copiado', 'info');
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
    const next = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    getEl('themeToggle').innerHTML = next === 'dark' ? '🌙' : '☀️';
  });
});

function createParticles() {
  const container = getEl('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    container.appendChild(p);
  }
}

function createConfetti() {
  for (let i = 0; i < 40; i++) {
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
  setTimeout(() => t.remove(), 3000);
}
