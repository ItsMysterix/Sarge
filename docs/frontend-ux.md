# Frontend UX

## Realtime behavior
- WebSocket client uses tRPC links; the app also includes a lightweight realtime helper with reconnect/backoff and online awareness.
- Subscriptions buffer bursts server-side; UI shows virtualized lists for logs and deployments.

## Virtualized lists
- `@tanstack/react-virtual` is used to render logs and large lists efficiently.

## Accessibility
- Keyboard focus states preserved in controls
- Loading states with skeletons and spinners
- Toaster notifications accessible with role alerts

## Visual patterns
- Glass card surfaces, accent color highlights
- Status badges for deployments, services

## Error handling
- Mock-first serverless routes return fallback data when DB is missing (dev-friendly)
- Toasts display mutation outcomes and error states
