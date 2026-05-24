import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalysisFinding {
  line: number | null;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

interface AnalysisResult {
  score: number;
  language: string;
  summary: string;
  bugs: AnalysisFinding[];
  security: AnalysisFinding[];
  quality: AnalysisFinding[];
  suggestions: string[];
  explanation: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getConfig() {
  const cfg = vscode.workspace.getConfiguration('devinspectai');
  return {
    apiToken: cfg.get<string>('apiToken', '').trim(),
    apiUrl:   cfg.get<string>('apiUrl', 'http://localhost:5000').replace(/\/+$/, ''),
  };
}

function httpPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const payload  = JSON.stringify(body);
    const isHttps  = parsed.protocol === 'https:';
    const lib      = isHttps ? https : http;

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port:     parsed.port || (isHttps ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   'POST',
        headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function detectLanguage(doc: vscode.TextDocument): string {
  return doc.languageId || 'unknown';
}

function severityColor(s: string): string {
  if (s === 'high')   return '#f87171';
  if (s === 'medium') return '#fb923c';
  return '#facc15';
}

function scoreColor(score: number): string {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#fb923c';
  return '#f87171';
}

// ── Webview HTML ──────────────────────────────────────────────────────────────
function buildWebviewHtml(result: AnalysisResult, fileName: string): string {
  const findingRows = (items: AnalysisFinding[]) =>
    items.length === 0
      ? '<p style="color:#6b7280;font-size:12px;margin:4px 0">None found ✓</p>'
      : items
          .map(
            (f) =>
              `<div style="display:flex;gap:8px;align-items:flex-start;margin:4px 0">
                <span style="color:${severityColor(f.severity)};font-size:10px;font-weight:700;min-width:44px;padding-top:1px">${f.severity.toUpperCase()}</span>
                <span style="color:#d1d5db;font-size:12px">${f.line ? `<span style="color:#9ca3af">[L${f.line}]</span> ` : ''}${escHtml(f.message)}</span>
              </div>`
          )
          .join('');

  const suggestionRows = result.suggestions
    .map((s) => `<li style="color:#d1d5db;font-size:12px;margin:3px 0">${escHtml(s)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DevInspectAI</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f14;color:#e5e7eb;padding:20px;line-height:1.5}
  h1{font-size:16px;font-weight:700;color:#fff;margin-bottom:4px}
  .sub{font-size:11px;color:#6b7280;margin-bottom:20px}
  .score-ring{display:flex;align-items:center;gap:16px;background:#1a1a24;border-radius:12px;padding:16px;margin-bottom:16px;border:1px solid #2d2d3d}
  .score-num{font-size:42px;font-weight:800;color:${scoreColor(result.score)}}
  .score-label{font-size:11px;color:#9ca3af}
  .summary{font-size:13px;color:#d1d5db}
  .section{background:#1a1a24;border-radius:10px;padding:14px;margin-bottom:12px;border:1px solid #2d2d3d}
  .section-title{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
  .explanation{font-size:12px;color:#d1d5db;line-height:1.6}
  ul{padding-left:16px}
</style>
</head>
<body>
<h1>🔍 DevInspectAI Analysis</h1>
<p class="sub">${escHtml(fileName)} · ${escHtml(result.language)}</p>

<div class="score-ring">
  <div>
    <div class="score-num">${result.score}</div>
    <div class="score-label">Quality Score</div>
  </div>
  <p class="summary">${escHtml(result.summary)}</p>
</div>

<div class="section">
  <div class="section-title">🐛 Bugs (${result.bugs.length})</div>
  ${findingRows(result.bugs)}
</div>

<div class="section">
  <div class="section-title">🔒 Security (${result.security.length})</div>
  ${findingRows(result.security)}
</div>

<div class="section">
  <div class="section-title">✨ Code Quality (${result.quality.length})</div>
  ${findingRows(result.quality)}
</div>

${result.suggestions.length > 0 ? `
<div class="section">
  <div class="section-title">💡 Suggestions</div>
  <ul>${suggestionRows}</ul>
</div>` : ''}

<div class="section">
  <div class="section-title">🤖 AI Explanation</div>
  <p class="explanation">${escHtml(result.explanation)}</p>
</div>
</body>
</html>`;
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Extension Activation ──────────────────────────────────────────────────────
export function activate(context: vscode.ExtensionContext) {
  // Status bar item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.text = '$(code) DevInspectAI';
  statusBar.tooltip = 'Click to analyze current file';
  statusBar.command = 'devinspectai.analyze';
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Verify token on startup if configured
  const { apiToken } = getConfig();
  if (apiToken) {
    statusBar.text = '$(sync~spin) DevInspectAI';
    verifyTokenSilent(apiToken, getConfig().apiUrl).then((ok) => {
      statusBar.text = ok ? '$(check) DevInspectAI ✅' : '$(warning) DevInspectAI';
    });
  }

  // ── Command: Analyze ────────────────────────────────────────────────────────
  const analyzeCmd = vscode.commands.registerCommand('devinspectai.analyze', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('DevInspectAI: Open a file to analyze.');
      return;
    }

    const { apiToken, apiUrl } = getConfig();
    if (!apiToken) {
      const action = await vscode.window.showErrorMessage(
        'DevInspectAI: No API token configured.',
        'Open Settings'
      );
      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'devinspectai.apiToken');
      }
      return;
    }

    const doc      = editor.document;
    const code     = doc.getText();
    const language = detectLanguage(doc);
    const fileName = doc.fileName.split(/[\\/]/).pop() || 'unknown';

    statusBar.text = '$(sync~spin) Analyzing…';

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'DevInspectAI: Analyzing…', cancellable: false },
      async () => {
        try {
          const raw = await httpPost(
            `${apiUrl}/api/vscode/analyze`,
            { code, language, fileName },
            { 'x-api-token': apiToken }
          );

          const json = JSON.parse(raw);
          if (!json.success) throw new Error(json.error || 'Analysis failed');

          const result: AnalysisResult = json.analysis;

          // Show webview panel
          const panel = vscode.window.createWebviewPanel(
            'devinspectai',
            `DevInspectAI — ${fileName}`,
            vscode.ViewColumn.Beside,
            { enableScripts: false }
          );
          panel.webview.html = buildWebviewHtml(result, fileName);

          statusBar.text = `$(check) Score: ${result.score}/100`;
          vscode.window.showInformationMessage(
            `DevInspectAI: Score ${result.score}/100 — ${result.summary}`
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          statusBar.text = '$(warning) DevInspectAI';
          vscode.window.showErrorMessage(`DevInspectAI: ${msg}`);
        }
      }
    );
  });

  // ── Command: Verify Token ───────────────────────────────────────────────────
  const verifyCmd = vscode.commands.registerCommand('devinspectai.verifyToken', async () => {
    const { apiToken, apiUrl } = getConfig();
    if (!apiToken) {
      vscode.window.showErrorMessage('DevInspectAI: No API token set in settings.');
      return;
    }
    statusBar.text = '$(sync~spin) Verifying…';
    const ok = await verifyTokenSilent(apiToken, apiUrl);
    if (ok) {
      statusBar.text = '$(check) DevInspectAI ✅';
      vscode.window.showInformationMessage('DevInspectAI: Token verified — Connected ✅');
    } else {
      statusBar.text = '$(warning) DevInspectAI';
      vscode.window.showErrorMessage('DevInspectAI: Token invalid. Please regenerate from the website.');
    }
  });

  context.subscriptions.push(analyzeCmd, verifyCmd);
}

async function verifyTokenSilent(token: string, apiUrl: string): Promise<boolean> {
  try {
    const raw  = await httpPost(`${apiUrl}/api/vscode/verify-token`, { token }, {});
    const json = JSON.parse(raw);
    return json.valid === true;
  } catch {
    return false;
  }
}

export function deactivate() {}
