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
- **Config API:** `GET/POST /api/config`, `POST /api/config/reset`
- **Config file:** `src/config/config.json` (auto-created from `config.default.json`)
- Legacy config at project root is migrated automatically on first run

## JS load order (index.html is order-sensitive)

1. `utils/color-utils.js`
2. `utils/notification-manager.js`
3. `utils/dialog-manager.js`
4. `utils/api-service.js`
5. `utils/config-applier.js`
6. `utils/event-binder.js`
7. `config-manager.js` (last — instantiates `ConfigManager` globally)

## Key shortcuts (in the browser source)

| Keys | Action |
|------|--------|
| `Ctrl+K` / `Ctrl+Shift+O` | Toggle config panel |
| `Ctrl+S` | Save config |
| `Ctrl+C` | Copy OBS browser source URL (when no text selected) |
| `Esc` | Close config panel |

## Gotchas

- **Segoe MDL2 Assets** font is Windows-only; icons use its unicode codepoints
- Server auto-opens a browser on start (Cross-platform: `start`/`open`/`xdg-open`)
- Port fallback: tries `PORT` env var, then 3000, incrementing up to 10 attempts
- No tests, no linter, no typechecker, no CI configured in this repo
- CSS variable `background-color: transparent` is required for OBS chroma key
