import React, { useState, useEffect } from 'react';
import { Code2, Copy, RefreshCw, Webhook, Key, CheckCircle2, Terminal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_ORIGIN } from '@/lib/apiConfig';

const VSCodeExtensionPanel = () => {
  const [devToken, setDevToken]       = useState('');
  const [tokenDate, setTokenDate]     = useState(null);
  const [webhookUrl, setWebhookUrl]   = useState(localStorage.getItem('devinspect-webhook') || '');
  const [generating, setGenerating]   = useState(false);
  const [copied, setCopied]           = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [connected, setConnected]     = useState(false);

  // Load persisted token on mount
  useEffect(() => {
    const saved = localStorage.getItem('devinspect-dev-token');
    const savedDate = localStorage.getItem('devinspect-dev-token-date');
    if (saved) { setDevToken(saved); setTokenDate(savedDate); }
  }, []);

  const generateToken = async () => {
    setGenerating(true);
    setConnected(false);
    try {
      const authToken = localStorage.getItem('devinspect-token');
      const res = await fetch(`${API_ORIGIN}/api/user/dev-token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const createdAt = data.createdAt || new Date().toISOString();
        setDevToken(data.devToken);
        setTokenDate(createdAt);
        localStorage.setItem('devinspect-dev-token', data.devToken);
        localStorage.setItem('devinspect-dev-token-date', createdAt);
        toast.success('Developer token generated!');
      } else {
        toast.error('Failed to generate token. Please try again.');
      }
    } catch {
      toast.error('Network error. Is the backend running?');
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = async () => {
    if (!devToken) return;
    await navigator.clipboard.writeText(devToken);
    setCopied(true);
    toast.success('Token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyToken = async () => {
    if (!devToken) return;
    setVerifying(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/vscode/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: devToken }),
      });
      const data = await res.json();
      if (data.valid) {
        setConnected(true);
        toast.success(`Token valid — connected as ${data.user?.name}`);
      } else {
        setConnected(false);
        toast.error('Token invalid. Please regenerate.');
      }
    } catch {
      toast.error('Could not verify token.');
    } finally {
      setVerifying(false);
    }
  };

  const saveWebhook = () => {
    localStorage.setItem('devinspect-webhook', webhookUrl);
    toast.success('Webhook URL saved!');
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
  };

  const maskedToken = devToken
    ? `${devToken.slice(0, 10)}${'•'.repeat(20)}${devToken.slice(-6)}`
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" /> VS Code Extension
        </h2>
        <p className="text-xs text-muted-foreground">
          Generate a developer token, install the extension, and analyze code directly from VS Code.
        </p>
      </div>

      {/* Token Section */}
      <div className="p-5 rounded-2xl border border-border/30 bg-muted/20 space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <Label className="font-bold">Developer API Token</Label>
          </div>
          {connected && (
            <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected
            </span>
          )}
        </div>

        {tokenDate && (
          <p className="text-xs text-muted-foreground">Generated on {formatDate(tokenDate)}</p>
        )}

        <div className="flex gap-2">
          <Input
            readOnly
            value={devToken ? maskedToken : ''}
            placeholder="No token generated yet"
            className="input-premium font-mono text-xs h-11 bg-background flex-1"
          />
          {devToken && (
            <Button
              onClick={copyToken}
              size="icon"
              variant="outline"
              className="h-11 w-11 rounded-xl border-border/30 shrink-0"
              title="Copy token"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
          <Button
            onClick={generateToken}
            disabled={generating}
            className="btn-secondary h-11 px-4 rounded-xl font-bold text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {devToken ? 'Regenerate' : 'Generate'}
          </Button>
        </div>

        {devToken && (
          <Button
            onClick={verifyToken}
            disabled={verifying}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-border/30 text-xs font-semibold gap-1.5"
          >
            <Zap className={`w-3.5 h-3.5 ${verifying ? 'animate-pulse' : ''}`} />
            {verifying ? 'Verifying…' : 'Verify Connection'}
          </Button>
        )}

        {/* settings.json snippet */}
        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/20 font-mono">
          <p className="font-bold text-foreground mb-1">settings.json (VS Code):</p>
          <pre className="overflow-x-auto whitespace-pre text-[10px]">{`{
  "devinspectai.apiToken": "${devToken || 'YOUR_TOKEN_HERE'}",
  "devinspectai.apiUrl": "${API_ORIGIN}"
}`}</pre>
        </div>
      </div>

      {/* Extension Setup Steps */}
      <div className="p-5 rounded-2xl border border-border/30 bg-muted/20 space-y-3 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-primary" />
          <Label className="font-bold">Extension Setup</Label>
        </div>
        <ol className="space-y-2 text-xs text-muted-foreground list-none">
          {[
            'Generate your API token above',
            'Open VS Code → Extensions → search "DevInspectAI"',
            'Install the DevInspectAI extension',
            'Open VS Code settings.json and paste the config snippet above',
            'Right-click any file → "Analyze with DevInspectAI"',
            'View AI results instantly in the side panel',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Webhook Section */}
      <div className="p-5 rounded-2xl border border-border/30 bg-muted/20 space-y-4 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="w-4 h-4 text-primary" />
          <Label className="font-bold">Webhook URL (CI/CD Integration)</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Receive analysis results via webhook from VS Code or GitHub Actions.
        </p>
        <div className="flex gap-2">
          <Input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="input-premium h-11 flex-1"
          />
          <Button onClick={saveWebhook} className="btn-primary h-11 px-4 rounded-xl font-bold text-xs shrink-0">
            Save
          </Button>
        </div>
      </div>

      {/* API Reference */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 max-w-xl space-y-2">
        <p className="text-xs font-bold text-primary">🔌 Extension API Endpoints</p>
        <div className="font-mono text-[10px] text-muted-foreground space-y-1">
          <p><span className="text-green-400">POST</span> {API_ORIGIN}/api/vscode/verify-token</p>
          <p><span className="text-green-400">POST</span> {API_ORIGIN}/api/vscode/connect</p>
          <p><span className="text-green-400">POST</span> {API_ORIGIN}/api/vscode/analyze</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          All analyze requests require <code className="bg-muted px-1 rounded">x-api-token: YOUR_TOKEN</code> header.
        </p>
      </div>
    </div>
  );
};

export default VSCodeExtensionPanel;
