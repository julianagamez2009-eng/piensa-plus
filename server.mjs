import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const ROOT = join(process.cwd(), 'public');

function send(res, status, data, type='application/json; charset=utf-8') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control':'no-store'});
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
async function readBody(req) {
  let raw='';
  for await (const chunk of req) { raw += chunk; if (raw.length > 20000) throw new Error('La solicitud es demasiado larga.'); }
  return JSON.parse(raw || '{}');
}
function extractText(data) {
  if (data.output_text) return data.output_text.trim();
  for (const item of data.output || []) for (const c of item.content || []) if (c.type === 'output_text' && c.text) return c.text.trim();
  return '';
}
const instructions = `Eres PIENSA+, un tutor académico que enseña mediante preguntas orientadoras (método socrático). Tu objetivo es fortalecer autonomía, pensamiento crítico y aprendizaje. NUNCA des la respuesta final ni resuelvas el ejercicio por el estudiante. No inventes datos. Haz UNA sola pregunta breve, clara y adaptada al nivel del estudiante por turno. Usa el idioma del estudiante (normalmente español). Parte el problema en pasos pequeños. Si la respuesta del estudiante es incorrecta, no lo juzgues ni reveles la solución: identifica amablemente qué debe revisar y formula una pregunta que lo ayude a corregirse. Si responde bien, reconoce brevemente el avance y formula la siguiente pregunta. Cuando ya haya razonado lo suficiente, pídele que redacte su propia conclusión; no la redactes por él. Mantén un tono amable, claro y apropiado para estudiantes universitarios de primeros semestres. Devuelve únicamente el texto que verá el estudiante, sin etiquetas ni análisis interno.`;

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'POST' && url.pathname === '/api/coach') {
    if (!API_KEY) return send(res, 503, {error:'La conexión con la IA todavía no está configurada. Falta agregar OPENAI_API_KEY en el servidor.'});
    try {
      const body = await readBody(req);
      const { question, subject='Detectar automáticamente', level='Estoy empezando', history=[] } = body;
      if (typeof question !== 'string' || !question.trim()) return send(res,400,{error:'Escribe una pregunta académica.'});
      if (!Array.isArray(history) || history.length > 14) return send(res,400,{error:'Historial de conversación no válido.'});
      const transcript = history.map((m,i)=>`${m.role === 'assistant' ? 'PIENSA+' : 'ESTUDIANTE'}: ${String(m.content || '').slice(0,1800)}`).join('\n');
      const input = `Materia: ${String(subject).slice(0,80)}\nNivel indicado: ${String(level).slice(0,80)}\nPregunta o ejercicio original: ${question.slice(0,3000)}\n\nConversación hasta ahora:\n${transcript || '(Es el primer turno. Formula la primera pregunta orientadora.)'}\n\nResponde con el siguiente paso pedagógico: una sola pregunta orientadora adaptada a lo anterior. No reveles la solución.`;
      const apiRes = await fetch('https://api.openai.com/v1/responses', {
        method:'POST',
        headers:{'Authorization':`Bearer ${API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:MODEL,instructions,input,max_output_tokens:220})
      });
      const data = await apiRes.json();
      if (!apiRes.ok) {
        const msg = data?.error?.message || 'No se pudo contactar al servicio de IA.';
        return send(res,502,{error:msg});
      }
      const text = extractText(data);
      if (!text) return send(res,502,{error:'La IA no devolvió una pregunta. Inténtalo de nuevo.'});
      return send(res,200,{message:text});
    } catch (e) {
      return send(res,400,{error:e.message || 'Ocurrió un error al procesar la solicitud.'});
    }
  }
  if (req.method === 'GET') {
    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const safe = normalize(requested).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
    try {
      const file = await readFile(join(ROOT,safe));
      const ext = extname(safe);
      const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
      return send(res,200,file,types[ext] || 'application/octet-stream');
    } catch { return send(res,404,'No encontrado','text/plain; charset=utf-8'); }
  }
  send(res,405,{error:'Método no permitido.'});
});
server.listen(PORT,()=>console.log(`PIENSA+ disponible en http://localhost:${PORT}`));
