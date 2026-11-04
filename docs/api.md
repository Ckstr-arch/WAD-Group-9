# PHP REST API v1

REST is the HTTP interface to the same PHP services used by native forms. It adds no required language, server framework, hosted service or build system. Base path is `/api/v1`; [OpenAPI JSON](../public/assets/openapi.json) is a static machine-readable description. Treat `app/api.php` and `app/community.php` as implementation truth. Regenerate the static description with `php bin/build-openapi.php` after a reviewed contract change, then inspect the output. This PHP-only generator does not require credentials, a database or an external build tool; regeneration is not needed to serve the app.

## Session and request contract

1. `GET /auth/session` initializes/reuses the cookie and returns safe identity plus `meta.csrf_token`. No bearer token is stored in the browser.
2. Every POST/PUT/PATCH/DELETE uses `Content-Type: application/json`, a JSON **object** (including `{}`), cookie credentials and `X-CSRF-Token`. Native fallback forms use their hidden CSRF field instead.
3. `POST /auth/login` takes `email,password`. If `data.requires_2fa` is true, the account is still pending authentication. Complete `POST /auth/2fa` with `code` before entering protected routes.
4. Session completion rotates state/token; use the response's fresh CSRF value for following mutations. Do not print values in evidence.
5. If a mutation includes Origin, it must match `APP_URL` exactly. Same-origin cookie behavior does not make CSRF unnecessary. Wildcard CORS is not enabled.

This edition uses `sportshub_backup_session`; cookie names rather than port alone prevent mixing with the original application's session. Cookies are HttpOnly/SameSite=Lax and Secure in production. Bodies are limited to64 KiB, scalar field values only, no unexpected fields/nested objects. Server/URL fixes privileged IDs and user identity.

Dates input as `YYYY-MM-DDTHH:MM` use **Asia/Colombo**; SQL datetimes are returned as `YYYY-MM-DD HH:MM:SS`. Do not assume UTC conversion or browser timezone guessing. A syntactically valid past/overlong/conflicting interval can still fail domain validation.

## Route map

Paths below are relative to `/api/v1`. Collection placeholders represent fixed allowlists, not arbitrary SQL identifiers.

| Methods | Paths | Access / purpose |
|---|---|---|
| GET | `/health`, `/auth/session` | Public DB readiness or session/CSRF bootstrap |
| POST | `/auth/register`, `/auth/login`, `/auth/2fa` | Student creation, password and pending-factor authentication |
| POST | `/auth/logout` | Authenticated sign-out |
| GET | `/me`, `/me/security` | Safe identity and 2FA status/count, never existing secret/recovery values |
| POST | `/me/2fa/setup` | Private temporary setup secret for current account |
| POST, DELETE | `/me/2fa` | Enroll/disable with password and second-factor proof |
| GET | `/clubs`, `/tournaments`, `/events`, `/resources` and `/{id}` detail | Public browse/detail |
| POST | `/clubs/{id}/memberships` | Apply for pending membership |
| POST | `/tournaments/{id}/registrations` | Individual tournament enrollment |
| POST | `/events/{id}/attendance` | Future session enrollment with approved club membership |
| POST | `/bookings` | Request future facility/equipment interval |
| GET | `/me/memberships`, `/me/registrations`, `/me/attendance`, `/me/bookings` | Own paginated history |
| DELETE | `/me/{collection}/{id}` | Cancel own eligible participation; cancelled bookings retained |
| GET | `/results`, `/standings` | Recorded match scores and generic club aggregates |
| GET, POST | `/admin/{entity}` | Admin list/create clubs/tournaments/events/resources |
| GET, PUT, DELETE | `/admin/{entity}/{id}` | Detail/full update/delete allowlisted record |
| GET | `/admin/memberships`, `/admin/bookings` | Admin request lists |
| PATCH | `/admin/memberships/{id}`, `/admin/bookings/{id}` | Review pending request |
| GET | `/admin/attendance` | Participant/session list |
| PATCH | `/admin/attendance/{id}` | Mark attendance after session start |
| GET | `/admin/reports`, `/admin/audit-logs` | Admin aggregates and audit history |

Public lists support search `q` and applicable fields: sport for clubs/tournaments, status for tournaments, kind for events/resources, club_id/tournament_id for events. Results/standings can filter tournament_id. JSON collections use page/per_page, default 20 and maximum 100. Aggregate reports/standings are not paginated. A missing page result is an empty array, not a missing-resource 404.

## Mutation payloads

| Command | Data fields / rules |
|---|---|
| Registration | `name,email,student_id,faculty,password`; password 12–128 bytes, valid email/ID, no role assignment |
| Login / factor verification | `email,password` / `code` |
| 2FA setup | `{}`; secret only shown privately to current account |
| Enable/disable 2FA | `password,code`; recovery codes returned once on enrollment |
| Club | `name,sport,description,coach,location,capacity`; sport max 60 characters matches schema |
| Tournament | `name,sport,description,location,starts_at,ends_at,registration_deadline,capacity,status`; ordered dates, deadline no later than start |
| Event | `title,club_id,kind,location,starts_at,ends_at`; optional `tournament_id,opponent,home_score,away_score`; scores paired/nonnegative and only with match/opponent |
| Resource | `name,kind,description,location`; kind facility/equipment |
| Booking | `resource_id,starts_at,ends_at,purpose`; future, ≤4h, no pending/approved collision |
| Membership/booking review | `status=approved|rejected`; only pending |
| Attendance | `status=attended`; after session start |
| Join/register/cancel/delete | `{}`; route supplies IDs, except 2FA deletion requires factors |

PUT is a complete record replacement under this API's validation, not an arbitrary partial PATCH. Creating ordinary resources returns201 and a readable Location where applicable. Other statuses depend on actual route/operation; do not infer that every POST means a successful account login.

## Club community

All routes require an administrator or approved membership in that exact club. Leaving revokes access on the next request. Member roster omits email, student ID and authentication fields.

| Method | Path | Meaning |
|---|---|---|
| GET | `/clubs/{club}/community`, `/clubs/{club}/members` | Summary / paginated approved-member roster |
| GET, POST | `/clubs/{club}/posts` | Visible feed / create `{body}` |
| GET, PATCH, DELETE | `/clubs/{club}/posts/{post}` | Read visible / author edit `{body}` / own-or-admin deletion |
| GET, POST | `.../{post}/comments` | Paginated comments / create `{body}` |
| DELETE | `.../{post}/comments/{comment}` | Own-or-admin remove |
| PUT, DELETE | `.../{post}/reaction` | Desired one-reaction state / remove own |
| POST | `.../{post}/reports` | One private `{reason}` per member/post |
| GET | `/admin/community` | Moderation queue; status reported/visible/hidden or omitted for all nondeleted |
| GET | `/admin/community/posts/{post}/reports` | Private report details |
| PATCH | `/admin/community/posts/{post}` | `{status: visible|hidden,reason}` and report resolution |

Post body 1–5000 characters; comment 1–2000; reason 1–500. Validated text is still escaped when rendered. HTML feed shows 10 posts/page and latest 20 comments/post; API pagination is separate. Repeated PUT reaction remains one row; repeated report is409. Editing hidden text cannot restore it. Administrator hide/restore retains content; deletion erases body/children and leaves a tombstone that cannot be restored.

## Responses and errors

Success has `data` and `meta`; metadata includes opaque request ID, fresh CSRF and optional redirect/pagination. Error has `error.status`, `error.message`, and metadata. Never log secret-bearing envelopes from 2FA setup/enrollment.

| Status | Interpretation |
|---|---|
| 400 | Malformed JSON/object |
| 401 | Not authenticated, invalid login/factor or expired challenge |
| 403 | Wrong role/club access, CSRF or Origin |
| 404 | Missing route/resource, unavailable post or not-owned record |
| 405 | Wrong method; read Allow header |
| 409 | State conflict, including repeated/ineligible cancellation or duplicate report |
| 413 / 415 | Body too large / wrong Content-Type |
| 422 | Field/domain validation: dates, capacity, overlap, duplicate enrollment, unknown field |
| 429 | Throttled; Retry-After 900 seconds |
| 500 / 503 | Unexpected/server/database failure; inspect private logs by request context |

Native expired CSRF forms use 419, distinct from REST's 403. Generic error output must not reveal SQL, private settings or stack traces. A lost network response does not prove the command failed: inspect current state before retrying a mutation that may already have committed.
