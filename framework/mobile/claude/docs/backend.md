# Backend Integration — {{PROJECT_NAME}}

Contracts between the mobile app and the backend. If the project owns its own backend, most of this belongs in that backend's docs — this file is just the mobile-side view of the integration.

## API contracts

- **Base URL**: <staging> / <prod>.
- **Auth**: <JWT / OAuth / session>. Refresh flow: <describe>.
- **Error shape**: `{ message: string, code?: string, ... }`. Client branches on `code` where available, otherwise on HTTP status.

## Endpoints used by the app

<!-- List each endpoint + how the app uses it. Template:

### GET /api/<resource>
- **Purpose**: <what the app fetches>.
- **Cached**: yes / no / <TTL>.
- **Called from**: <screen or hook name>.
- **Owner on backend**: <team / repo>.

-->

## Offline behavior

- **Reads**: served from cache when offline. <Stale strategy — TTL / last-sync timestamp>.
- **Writes**: queued in <local DB / AsyncStorage> and retried on reconnection. <Conflict resolution strategy>.
- **User feedback**: offline banner + pending-actions count.

## Push notifications

- **Provider**: <APNs + FCM / OneSignal / Firebase Cloud Messaging>.
- **Token registration**: <when + endpoint>.
- **Payload format**: `{ type, entity, entityId, data }`. Branch on `type` client-side.
- **Deep-link payloads**: handled by `<module>` — opens the matching screen.

## Analytics / telemetry

- **Tool**: <Amplitude / Mixpanel / Firebase Analytics / internal>.
- **Events tracked**: <link to event catalog or list>.
- **PII rules**: never log user emails / phone / names. Use anonymous user IDs.

## Crash reporting

- **Tool**: <Sentry / Crashlytics>.
- **Symbolication**: <how / when uploaded>.
