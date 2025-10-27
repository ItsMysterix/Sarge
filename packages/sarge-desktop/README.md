# Sarge Desktop (Electron)

Offline-friendly desktop wrapper for Sarge: spawns the local backend (WS server) and Next.js UI, adds a system tray with quick controls.

- Auto-starts both servers and opens a window pointing at http://localhost:3000
- Tray menu: Show/Hide, Restart local server, Check for updates (local channel only), Quit
- Auto-update: optional local channel via SARGE_DESKTOP_UPDATE_URL returning {"version":"x.y.z"}
- CLI remains separate and usable; desktop just orchestrates local processes

## Dev

```sh
pnpm -w -r run build        # build app and backend
pnpm -F app build           # Next.js build
pnpm -F backend build       # backend build
pnpm -F sarge-desktop build # build electron main
pnpm -F sarge-desktop dev   # run electron
```

## Packaging

This scaffold focuses on local dev. For installers, wire electron-builder or forge as a follow-up.

## Tests

```sh
pnpm -F sarge-desktop test
```

A minimal smoke test ensures the desktop app process starts.
