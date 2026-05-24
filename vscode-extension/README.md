# DevInspectAI VS Code Extension

AI-powered code review directly inside VS Code.

## Setup

1. Generate your API token from **DevInspectAI → Settings → VS Code Extension**
2. Open VS Code `settings.json` (`Ctrl+Shift+P` → "Open User Settings JSON")
3. Add:

```json
{
  "devinspectai.apiToken": "YOUR_TOKEN_HERE",
  "devinspectai.apiUrl": "http://localhost:5000"
}
```

## Usage

- Right-click in any editor → **Analyze with DevInspectAI**
- Or open Command Palette (`Ctrl+Shift+P`) → **DevInspectAI: Analyze**
- Results appear in a side panel instantly

## Commands

| Command | Description |
|---|---|
| `DevInspectAI: Analyze` | Analyze the current file |
| `DevInspectAI: Verify API Token` | Test your token connection |

## Build

```bash
cd vscode-extension
npm install
npm run compile
# Package: npx vsce package
```
