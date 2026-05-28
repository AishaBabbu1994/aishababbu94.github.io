/* --- HELPERS --- */
const getEl = (id) => document.getElementById(id);

/* --- PROMPT MÁGICO (Configuración de Formateo) --- */
function buildPrompt(text, mode, targetLang = 'english') {
  const instructions = `
  Actúa como un Senior Technical Writer y experto en Markdown Linter.
  Tu tarea es convertir el texto de entrada en un documento Markdown de alta calidad, siguiendo estas reglas:

  1. ESTRUCTURA: Usa una jerarquía de títulos lógica (#, ##, ###).
  2. LIMPIEZA: Elimina espacios dobles, arregla saltos de línea huérfanos.
  3. LISTAS: Asegura que cada item (- o 1.) tenga exactamente un espacio después del marcador.
  4. TABLAS: Si detectas datos tabulares, formatéalos en tablas Markdown perfectamente alineadas usando pipes (|) y guiones para la cabecera.
  5. ÉNFASIS: Usa negritas (**) para resaltar conceptos clave, pero no abuses.
  6. CÓDIGO: Envuelve fragmentos de código en bloques con su lenguaje correspondiente (ej: \`\`\`javascript).
  7. JUSTIFICACIÓN VISUAL: Asegura que haya una línea en blanco entre párrafos, títulos y bloques.
  8. NADA DE CHATS: No digas "Aquí tienes el texto", "Entendido" ni nada similar. Responde ÚNICAMENTE el código Markdown.

  ${mode === 'translate' ? `TRADUCCIÓN: Traduce el contenido íntegramente al idioma ${targetLang} manteniendo el formato.` : 'TAREA: Formatea el siguiente texto.'}
  `;

  return `${instructions.trim()}\n\nTEXTO A PROCESAR:\n${text}`;
}

/* --- LOGICA DE PROCESAMIENTO --- */
async function callAI(prompt) {
  const apiKey = localStorage.getItem('textmagic_apikey');
  if (!apiKey) throw new Error("Falta la API Key de Groq");

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Baja temperatura para mayor orden y menos creatividad
      max_tokens: 3000
    })
  });

  if (!response.ok) throw new Error("Error en la API de Groq");
  const data = await response.json();
  return data.choices[0].message.content;
}

async function processText() {
  const input = getEl('inputText').value.trim();
  if (!input) return alert("Escribe algo primero");

  getEl('loading').classList.remove('hidden');
  getEl('result').classList.add('hidden');
  getEl('progress-fill').style.width = "30%";

  try {
    const mode = document.querySelector('.mode-btn.active').dataset.mode;
    const lang = getEl('targetLang').value;

    // Si el texto es muy largo, cortarlo (aquí simplificado, pero funcional)
    const prompt = buildPrompt(input, mode, lang);
    const result = await callAI(prompt);

    getEl('outputContent').textContent = result;
    getEl('result').classList.remove('hidden');
    getEl('progress-fill').style.width = "100%";
    showToast("✨ Texto transformado con éxito", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    getEl('loading').classList.add('hidden');
  }
}

/* --- EVENTOS UI --- */
document.addEventListener('DOMContentLoaded', () => {
  // Cargar API Key guardada
  if (localStorage.getItem('textmagic_apikey')) {
    getEl('apiKey').value = localStorage.getItem('textmagic_apikey');
  }

  getEl('apiKey').addEventListener('change', (e) => {
    localStorage.setItem('textmagic_apikey', e.target.value);
  });

  getEl('processBtn').addEventListener('click', processText);

  getEl('clearBtn').addEventListener('click', () => {
    getEl('inputText').value = "";
    getEl('result').classList.add('hidden');
  });

  getEl('copyBtn').addEventListener('click', () => {
    const content = getEl('outputContent').textContent;
    navigator.clipboard.writeText(content);
    showToast("📋 Copiado al portapapeles", "info");
  });

  getEl('downloadBtn').addEventListener('click', () => {
    const blob = new Blob([getEl('outputContent').textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "texto-formateado.md";
    a.click();
  });

  // Selector de modo
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      getEl('translateOptions').classList.toggle('hidden', btn.dataset.mode !== 'translate');
    });
  });

  // Tema
  getEl('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    getEl('themeToggle').innerHTML = next === 'dark' ? '🌙' : '☀️';
  });
});

function showToast(msg, type) {
  const container = getEl('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
