# OBS-Win10-Background — Agent Guide

## What this is

A Windows 10 Fluent Design-style OBS livestream background template.  
Plain HTML/CSS/JS frontend + a Node.js config server.

## Quick start

```bash
npm install                 # needed — has adm-zip dependency
node src/server.js          # starts on port 3000, tries up to 3010 if busy
```

On Windows you can also double-click `启动服务器.bat`.

## Architecture

- **Entrypoint:** `src/server.js` — raw `http` module, no framework
- **Frontend:** `public/` — vanilla JS, no bundler, no build step
- **Server modules:**
  - `src/routes/` — API handlers (`config.js`, `version.js`, `update.js`)
  - `src/middleware/` — static file serving (`static.js`)
  - `src/config/` — config manager + app info (`manager.js`, `app-info.js`)
  - `src/utils/` — shared helpers (`file.js`, `http.js`, `version.js`, `app-path.js`, `restart.js`)
- **Scene page:** `/` → `public/index.html` — OBS browser source (display only)
- **Config page:** `/config` → `public/config.html` — full-page settings UI

## API endpoints

- `GET/POST /api/config` — read/save current profile config
- `POST /api/config/reset` — reset to defaults
- `GET /api/profiles` — list all profiles
- `POST /api/profiles/switch` — switch active profile (`{ profileId }`)
- `POST /api/profiles/create` — new profile (`{ name }`)
- `POST /api/profiles/rename` — rename (`{ profileId, newName }`)
- `POST /api/profiles/duplicate` — duplicate (`{ profileId }`)
- `POST /api/profiles/delete` — delete (`{ profileId }`)
- `GET /api/version` — app version + repo URL
- `GET /api/check-update` — check for new release on GitHub
- `POST /api/apply-update` — download + apply update (uses adm-zip)

## Config format

`configs/config.json` uses a multi-profile structure:
```json
{
  "currentProfile": "default",
  "profiles": {
    "default": { "name": "默认配置", "isDefault": true, "config": { ... } }
  }
}
```
Old flat config files (root dir, `src/config/`) are auto-migrated on first run.  
`isFirstLaunch` is a global field, not per-profile.

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
7. `utils/icon-picker.js`
8. `utils/event-binder.js`
9. `config-manager.js` (last — instantiates `ConfigManager` globally)

## Key shortcuts (config page only)

| Keys | Action |
|------|--------|
| `Ctrl+S` / `Cmd+S` | Save config |

Only `Ctrl+S` is implemented. The README lists older shortcuts (Ctrl+K, Esc, etc.) that no longer exist in the code.

## Gotchas

- **Segoe MDL2 Assets** font is Windows-only; icons use its unicode codepoints
- Server auto-opens browser to `/config` on start (Cross-platform: `start`/`open`/`xdg-open`)
- Port fallback: tries `PORT` env var, then 3000, incrementing up to 10 attempts
- No tests, no linter, no typechecker, no CI configured in this repo
- CSS variable `background-color: transparent` is required for OBS chroma key
- `configs/` dir and `configs/config.json` are gitignored; only `configs/config.default.json` is tracked
- `npm run build` packages as a standalone Windows exe via `pkg` (output to `dist/`)
