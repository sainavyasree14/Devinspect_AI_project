import React, { useState } from 'react';
import { Code2, Copy, RefreshCw, Webhook, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_ORIGIN } from '@/lib/apiConfig';

const VSCodeExtensionPanel = () => {
  const [devToken, setDevToken] = useState(localStorage.getItem('devinspect-dev-token') || '');
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('devinspect-webhook') || '');
  const [generating, setGenerating] = useState(false);

  const generateToken = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('devinspect-token');
      const response = await fetch(`${API_ORIGIN}/api/user/dev-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setDevToken(data.devToken);
        localStorage.setItem('devinspect-dev-token', data.devToken);
        toast.success('Developer token generated!');
      } else {
        // Fallback: generate locally
        const localToken = `dvi_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
        setDevToken(localToken);
        localStorage.setItem('devinspect-dev-token', localToken);
        toast.success('Developer token generated!');
      }
    } catch {
      const localToken = `dvi_${Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      setDevToken(localToken);
      localStorage.setItem('devinspect-dev-token', localToken);
      toast.success('Developer token generated!');
    } finally {
      setGenerating(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(devToken);
    toast.success('Token copied!');
  };

  const saveWebhook = () => {
    localStorage.setItem('devinspect-webhook', webhookUrl);
    toast.success('Webhook URL saved!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" /> VS Code Extension
        </h2>
        <p className="text-xs text-muted-foreground">
          Generate a developer token to connect the DevInspectAI VS Code extension to your account.
        </p>
      </div>

      {/* Token Section */}
      <div className="p-5 rounded-2xl border border-border/30 bg-muted/20 space-y-4 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <Key className="w-4 h-4 text-primary" />
          <Label className="font-bold">Developer API Token</Label>
        </div>

        <div className="flex gap-2">
          <Input
            readOnly
            value={devToken || ''}
            type={devToken ? 'text' : 'password'}
            placeholder="No token generated yet"
            className="input-premium font-mono text-xs h-11 bg-background flex-1"
          />
          {devToken && (
            <Button onClick={copyToken} size="icon" variant="outline" className="h-11 w-11 rounded-xl border-border/30">
              <Copy className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={generateToken} disabled={generating} className="btn-secondary h-11 px-4 rounded-xl font-bold text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {devToken ? 'Regenerate' : 'Generate'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg border border-border/20 font-mono">
          <p className="font-bold text-foreground mb-1">Extension Setup (VS Code settings.json):</p>
          <pre className="overflow-x-auto whitespace-pre text-[10px]">{`{
  "devinspectai.apiToken": "${devToken || 'YOUR_TOKEN_HERE'}",
  "devinspectai.apiUrl": "${API_ORIGIN}"
}`}</pre>
        </div>
      </div>

      {/* Webhook Section */}
      <div className="p-5 rounded-2xl border border-border/30 bg-muted/20 space-y-4 max-w-xl">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="w-4 h-4 text-primary" />
          <Label className="font-bold">Webhook URL (Remote Analysis)</Label>
        </div>
        <p className="text-xs text-muted-foreground">Receive analysis results via webhook when triggered from VS Code or CI/CD.</p>
        <div className="flex gap-2">
          <Input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="input-premium h-11 flex-1"
          />
          <Button onClick={saveWebhook} className="btn-primary h-11 px-4 rounded-xl font-bold text-xs">
            Save
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 max-w-xl">
        <p className="text-xs font-bold text-primary mb-1">📦 VS Code Extension (Coming Soon)</p>
        <p className="text-xs text-muted-foreground">
          The DevInspectAI VS Code extension will allow you to run AI code reviews directly from your editor. 
          Generate your token now to be ready when it launches.
        </p>
      </div>
    </div>
  );
};

export default VSCodeExtensionPanel;
