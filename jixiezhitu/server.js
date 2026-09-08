import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 简易 .env 加载
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '10mb' }));

/* ---------------- AI 配置 ---------------- */
const AI_BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const AI_KEY = process.env.OPENAI_API_KEY || '';
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function hasAI() {
  return !!AI_KEY;
}

async function callAI(messages, system) {
  if (!hasAI()) {
    return null;
  }
  const body = {
    model: AI_MODEL,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages.map((m) => ({ role: m.role, content: m.text || m.content || '' })),
    ],
    temperature: 0.6,
    max_tokens: 1200,
  };
  const res = await fetch(`${AI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`AI API ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

const FALLBACK = {
  chat: '（AI 服务尚未配置）请在项目根目录设置环境变量 OPENAI_API_KEY 后重启，即可获得真实智能回复。当前为演示模式。',
};

/* ---------------- 数据持久化（JSON 文件） ---------------- */
const DATA_DIR = path.join(__dirname, 'data');
const ERRORS_FILE = path.join(DATA_DIR, 'errors.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ERRORS_FILE)) fs.writeFileSync(ERRORS_FILE, '{}');
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
}
function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
ensureStore();

/* ---------------- AI 接口 ---------------- */
app.post('/api/chat', async (req, res) => {
  const { messages = [], context = '' } = req.body || {};
  const system = [
    '你是机械制图教学平台的 AI 答疑助手，也是企业资深审图工程师。',
    '请用专业、简洁、贴近企业工作场景的中文回答。',
    context ? `当前学习情境：${context}` : '',
  ].filter(Boolean).join('\n');
  try {
    const reply = await callAI(messages, system);
    if (reply === null) return res.json({ reply: FALLBACK.chat });
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ reply: 'AI 服务异常：' + e.message, error: true });
  }
});

app.post('/api/review', async (req, res) => {
  const { description = '', drawingText = '' } = req.body || {};
  const system = [
    '你是企业资深审图工程师，请依据机械制图国家标准与企业审图标准对图纸进行审核。',
    '输出 JSON（不要包含其他文字）：',
    '{"score":0-100,"summary":"总评","problems":[{"type":"错误类型","severity":"轻微/中等/严重","title":"问题标题","desc":"说明","standard":"对应标准","suggestion":"修改建议"}],"highlights":["亮点"]}',
  ].join('\n');
  const user = `图纸信息：${description}\n${drawingText ? '识别内容：' + drawingText : ''}`;
  try {
    const reply = await callAI([{ role: 'user', content: user }], system);
    if (reply === null) return res.json({ score: 75, summary: FALLBACK.chat, problems: [], highlights: [] });
    const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim());
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ score: 0, summary: 'AI 审图异常：' + e.message, problems: [], highlights: [] });
  }
});

app.post('/api/score', async (req, res) => {
  const { question = '', answer = '', standard = '' } = req.body || {};
  const system = [
    '你是职业技能等级证书与技能大赛的评分专家，评分标准与官方赛证评分标准严格对齐。',
    '输出 JSON（不要包含其他文字）：',
    '{"score":0-100,"grade":"优秀/良好/及格/需提升","detail":{"维度1":分值,"维度2":分值},"losses":["丢分点及改进方向"],"advice":"总体建议"}',
  ].join('\n');
  const user = `题目：${question}\n作答：${answer}\n评分标准：${standard || '官方赛证评分标准'}`;
  try {
    const reply = await callAI([{ role: 'user', content: user }], system);
    if (reply === null) return res.json({ score: 88, grade: '良好', detail: {}, losses: ['AI 服务未配置'], advice: FALLBACK.chat });
    res.json(JSON.parse(reply.replace(/```json|```/g, '').trim()));
  } catch (e) {
    res.status(500).json({ score: 0, grade: '需提升', detail: {}, losses: ['AI 评分异常：' + e.message], advice: '' });
  }
});

/* ---------------- 数据接口 ---------------- */
app.get('/api/errors', (req, res) => {
  res.json(readJSON(ERRORS_FILE, {}));
});
app.post('/api/errors', (req, res) => {
  const data = readJSON(ERRORS_FILE, {});
  Object.assign(data, req.body || {});
  writeJSON(ERRORS_FILE, data);
  res.json({ ok: true });
});

app.get('/api/users/:id', (req, res) => {
  const all = readJSON(USERS_FILE, {});
  res.json(all[req.params.id] || {});
});
app.post('/api/users/:id', (req, res) => {
  const all = readJSON(USERS_FILE, {});
  all[req.params.id] = req.body || {};
  writeJSON(USERS_FILE, all);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: hasAI(), model: AI_MODEL });
});

/* ---------------- 静态资源 + SPA ---------------- */
const STATIC_ROOT = __dirname;
app.use(express.static(STATIC_ROOT));

app.get('*', (req, res) => {
  const filePath = path.join(STATIC_ROOT, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(STATIC_ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[gongcheng-reboot3] server running at http://localhost:${PORT}`);
  console.log(`[gongcheng-reboot3] AI 模型: ${AI_MODEL}  已配置: ${hasAI() ? '是' : '否'}`);
  if (!hasAI()) {
    console.log('[gongcheng-reboot3] 提示: 设置环境变量 OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL 启用真实 AI');
  }
});
