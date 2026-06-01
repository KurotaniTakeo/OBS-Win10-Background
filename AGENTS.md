# OBS-Win10-Background — Agent Guide

## What this is

A Windows 10 Fluent Design-style OBS livestream background template.  
Plain HTML/CSS/JS frontend + a zero-dependency Node.js config server.

## Quick start

```bash
node src/server.js          # starts on port 3000, tries up to 3010 if busy
```

No `npm install` needed — zero runtime dependencies.  
On Windows you can also double-click `启动服务器.bat`.

## Architecture

- **Entrypoint:** `src/server.js` — raw `http` module, no framework
- **Frontend:** `public/` — vanilla JS, no bundler, no build step
- **Scene page:** `/` → `public/index.html` — OBS browser source (display only)
- **Config page:** `/config` → `public/config.html` — full-page settings UI
- **Config API:** `GET/POST /api/config`, `POST /api/config/reset`
- **Config file:** `configs/config.json` (auto-created from `config.default.json`)
- Legacy config at project root is migrated automatically on first run

## Page structure

### Scene page (`/` — `index.html`)
Minimal page for OBS browser source. Loads config from API and renders sidebar/titlebar/icons.
- Bottom gear icon opens `/config` in a new tab
- No config editing UI, no keyboard shortcuts
- Only loads: `color-utils.js`, `config-applier.js`, `scene-init.js`

### Config page (`/config` — `config.html`)
Full-page settings UI with left navigation + right content layout.
- Left nav: 全局外观 / 侧栏设置 / 标题栏设置 / 关于
- Loads all JS modules for config editing
- Keyboard shortcut: `Ctrl+S` to save

## JS load order

### Scene page (index.html)
1. `utils/color-utils.js`
2. `utils/config-applier.js`
3. `scene-init.js` (loads config, applies to DOM, binds gear icon)

### Config page (config.html)
1. `utils/color-utils.js`
2. `utils/notification-manager.js`
3. `utils/dialog-manager.js`
4. `utils/api-service.js`
5. `utils/update-checker.js`
6. `utils/config-applier.js`
7. `utils/event-binder.js`
8. `config-manager.js` (last — instantiates `ConfigManager` globally)

## Key shortcuts (config page only)

| Keys | Action |
|------|--------|
| `Ctrl+S` | Save config |

## Gotchas

- **Segoe MDL2 Assets** font is Windows-only; icons use its unicode codepoints
- Server auto-opens browser to `/config` on start (Cross-platform: `start`/`open`/`xdg-open`)
- Port fallback: tries `PORT` env var, then 3000, incrementing up to 10 attempts
- No tests, no linter, no typechecker, no CI configured in this repo
- CSS variable `background-color: transparent` is required for OBS chroma key
