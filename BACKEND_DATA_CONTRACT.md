# Backend Data Contract

This document maps the current browser-storage model to backend entities. The
application currently stores shared JSON arrays in `localStorage`; it is not a
database and does not synchronize separate browsers or devices. Customer,
Mechanic, Admin, and Master Admin dashboards use the same browser storage as
their shared source of truth.

## Current record stores

| LocalStorage key | Current purpose | Backend mapping |
| --- | --- | --- |
| `motofix_users` | Registered accounts, credentials, roles, signup data | `users` / `accounts` |
| `motofix_master_employees` | Master Control employee records; often mirrors Admin/Mechanic accounts in `motofix_users` | Prefer one `users` table with role/status; avoid a second authoritative account table |
| `motofix_profiles` | Profile overrides keyed by normalized email (name/phone) | Columns on `users`, or a one-to-one `user_profiles` table |
| `motofix_appointments` | Canonical bookings, assigned jobs, status, service/parts snapshots, and transaction summary | `appointments` plus child tables for line items |
| `motofix_motorcycles` | Customer-owned motorcycle registry | `motorcycles` with `owner_user_id` |
| `motofix_services` | Service catalog and prices | `services` |
| `motofix_parts` | Inventory catalog and stock counts | `parts` plus `inventory_movements` |
| `motofix_permission_requests` | Account and completed-job approval workflows | `permission_requests` plus optional `permission_request_notes` |
| `motofix_notifications` | Cross-role notifications and read state | `notifications` plus recipient/read rows |
| `motofix_pending_parts` | Temporary Customer cart/request before booking | Session/cart draft; copy selected lines to an appointment, then discard |
| `motofix_login_aliases` | Login role aliases for built-in/demo accounts and edited customer emails | Transitional migration table; resolve to a canonical user ID |
| `motofix_replaced_emails` | Prevents a previous email from logging in after an email change | Transitional alias history; do not use email as permanent identity |
| `motofix_deleted_accounts` | Email tombstones for deleted built-in/demo accounts | Account status/audit record; do not identify accounts only by email |
| `motofix_bikes`, `motofix_inventory` | Legacy keys removed/cleared by current dashboard code | Do not migrate as active stores; verify any production browser data before cleanup |
| `motofix_current_user`, `userEmail`, `userRole`, `userFullName`, `isLoggedIn` | Browser login/session state | Server-managed session or signed access token; never trust client values for authorization |
| `motofix_signup_motorcycle_migrated:<email>` | One-time marker for moving signup bike fields onto the motorcycle registry | One-time data migration flag; not a normal domain table |

### Service catalog availability

- Services are retained when deactivated; Admin changes availability instead
  of deleting service records. Store an explicit `status` (`Available` or
  `Disabled`) and keep any legacy `active`/`available` flags consistent.
- Customer catalog requests use `GET /services?active=true`; the backend must
  return only services whose status is `Available`. LocalStorage-mode customer
  booking filters out services marked Disabled/inactive before rendering or
  submission.
- Admin service updates should use an authorized status update (for example
  `PATCH /services/:id` with `{ "status": "Disabled" }`) and return the updated
  service record so the Admin catalog can refresh without losing its identity.

## Relationships and current role flows

### Accounts and profiles

- Signup writes a Customer account to `motofix_users`; login reads it and uses
  the account role to route to the appropriate dashboard.
- Master Control creates employee records in `motofix_master_employees` and
  mirrors them into `motofix_users` for login and shared user management.
- Admin and Mechanic profile changes update the profile map and, where present,
  the matching account/employee record. Customer profile email changes also
  migrate references in appointments, motorcycles, notification audiences/read
  state, permission requests, aliases, and signup migration markers.
- Current joins use normalized email in many places. In the backend, assign an
  immutable `user_id`; treat email as a unique, editable login/contact field.
- Current signup stores plaintext passwords in localStorage for demonstration.
  The backend must store a strong password hash, never a plaintext password,
  and must enforce role authorization server-side.

### Appointments, jobs, and invoices

- Customer booking creates an appointment with an `A...` ID and writes it to
  `motofix_appointments`. Admin can also create appointments in the same store.
- Customer appointment lists and dashboard totals filter by `customerEmail`
  (legacy records may fall back to customer name). Customer transactions are
  derived from those same appointment records.
- Mechanic jobs are a filtered view of appointments. Mechanic status changes
  update the appointment, which Admin reporting and Customer tracking then read.
- Admin and Master Admin edit/cancel the same appointment records. A restricted
  edit or completed-job cancellation uses a permission request referencing the
  appointment ID.
- `mechanic` currently stores a mechanic display name, not a stable account ID.
  Convert it to `mechanic_user_id`; preserve a display-name snapshot only when
  needed for historical receipts.
- `bike` / `motorcycle`, customer name/phone, service names, parts, and
  `transaction` are currently embedded snapshots. Customer motorcycles live in
  their own registry but appointments do not consistently reference a bike ID.
- Appointment statuses have legacy labels. Normalize to one enum (for example
  `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`, `Unpaid`) at
  the API boundary.
- Totals are currently sometimes formatted strings such as `₱...`; store money
  as integer minor units or fixed-precision decimal plus currency. The invoice
  is currently embedded as `transaction` with `INV-<appointmentId>`; a backend
  may expose a separate invoice table keyed by appointment ID.

### Motorcycles

- Customer motorcycle records have their own `id` and currently link to the
  owner through `ownerEmail`.
- Signup initially stores `moto_model` and `plate_number` on the account; a
  one-time migration copies those values into `motofix_motorcycles`.
- Use `motorcycles.owner_user_id` as a foreign key. If appointments need a
  particular registered motorcycle, add `appointments.motorcycle_id`; keep
  fields such as plate/model snapshots for historical accuracy if appropriate.

### Services, parts, and inventory

- Admin manages service catalog records in `motofix_services`; appointments
  store selected service names and price/total snapshots. A normalized backend
  should reference service IDs while retaining price-at-booking line items.
- Admin/Master Admin manage inventory in `motofix_parts`; SKU is the current
  lookup key for stock alerts and inventory detail navigation.
- Customer cart selections are temporarily staged in `motofix_pending_parts`
  and copied to `appointment.parts` when booking. Each part line can contain
  an SKU/ID, quantity, and `source` (`buy` or `bring`).
- When a Mechanic completes an appointment, only purchased (`buy`) parts are
  deducted. The current idempotency marker is each inventory part's
  `consumedAppointmentIds`; replace this with a stock-movement row uniquely
  constrained by `(appointment_id, part_id, movement_type)`.
- Low-stock notifications are generated when stock is at/below `reorderLevel`
  (default 10); zero stock is Out of Stock. Stock changes and completion must
  run in a server transaction to prevent overselling or duplicate deductions.

### Approvals and notifications

- Permission requests have an ID, `type`, `status`, requester identity/role,
  target identity, timestamps, optional `appointmentId`, proposed `changes`,
  `reason`, and `notes`. Current types include account create/edit/delete and
  completed-job edit/cancellation. Admin creates requests; Master Admin reviews
  them; decisions update the target account or appointment and notify relevant
  audiences.
- Notifications carry `audiences` (role-wide values such as `admin`, or
  account-specific values such as `mechanic:<name>` / `customer:<email>`),
  `readBy`, timestamps, a `destination`, and optional source IDs such as
  `appointmentId`, `permissionRequestId`, and `inventorySku`.
- Customer, Mechanic, Admin, and Master Admin each filter notifications by
  audience. Opening a notification marks it read for that role/account and
  routes by source ID. The shared cleanup deletes notifications older than 30
  days.
- Backend design: store notification content separately from recipients and
  reads, e.g. `notification_recipients(notification_id, user_id, read_at)`.
  Route using typed foreign keys/source fields, not message-text matching.

## Suggested relational schema

```text
users
  id PK, email UNIQUE, password_hash, role, status, name, phone, created_at, updated_at

motorcycles
  id PK, owner_user_id FK -> users.id, make, model, year, color, plate, mileage

services
  id PK, name, category, current_price, active

parts
  id PK, sku UNIQUE, name, category, stock, reorder_level, price, active

appointments
  id PK, customer_user_id FK -> users.id, motorcycle_id NULL FK -> motorcycles.id,
  mechanic_user_id NULL FK -> users.id, scheduled_at, status, notes, created_at, updated_at

appointment_services
  id PK, appointment_id FK -> appointments.id, service_id NULL FK -> services.id,
  name_snapshot, unit_price, quantity

appointment_parts
  id PK, appointment_id FK -> appointments.id, part_id NULL FK -> parts.id,
  sku_snapshot, name_snapshot, quantity, source, unit_price

invoices
  id PK, appointment_id UNIQUE FK -> appointments.id, subtotal, tax, total,
  currency, payment_status, issued_at

inventory_movements
  id PK, part_id FK -> parts.id, appointment_id NULL FK -> appointments.id,
  quantity_delta, movement_type, actor_user_id FK -> users.id, created_at

permission_requests
  id PK, type, status, requester_user_id FK -> users.id,
  target_user_id NULL FK -> users.id, appointment_id NULL FK -> appointments.id,
  payload_json, reason, requested_at, decided_by_user_id NULL FK -> users.id,
  decided_at NULL

permission_request_notes
  id PK, request_id FK -> permission_requests.id, author_user_id FK -> users.id,
  body, created_at

notifications
  id PK, title, message, destination, appointment_id NULL FK -> appointments.id,
  permission_request_id NULL FK -> permission_requests.id,
  part_id NULL FK -> parts.id, created_at, expires_at

notification_recipients
  notification_id FK -> notifications.id, user_id FK -> users.id,
  read_at NULL, PRIMARY KEY(notification_id, user_id)
```

The schema is a starting point, not a requirement to copy every current field.
Keep canonical data normalized, retain snapshots for historical records, and
add audit/authorization rules on the server.

## Migration cautions

- Back up and profile existing LocalStorage data before importing it. Legacy
  fields and status spellings coexist; do not assume every record has all fields.
- Deduplicate mirrored `motofix_users` / `motofix_master_employees` records by
  normalized email during import, then assign one canonical user ID.
- Resolve old appointment mechanic names and customer names to account IDs
  before making the new foreign keys non-null. Keep unmatched historical rows
  and report them for manual review rather than silently assigning them.
- Convert formatted pesos to numeric amounts carefully; preserve cancelled job
  totals as zero and retain source snapshots for receipts.
- Retain existing appointment, request, and notification IDs or build an
  explicit old-ID-to-new-ID map so notifications and approval requests still
  open the correct records after migration.

## Suggested API boundaries

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me`,
  `PATCH /me`
- `GET/POST /appointments`, `GET/PATCH /appointments/:id`; enforce customer
  ownership, mechanic assignment, and Admin/Master Admin permissions on server
- `GET/POST/PATCH /motorcycles` scoped to the authenticated Customer
- `GET /services`; Admin-managed service create/update endpoints
- `GET /inventory`, Admin-managed part endpoints, and transactional
  `POST /appointments/:id/complete` for status plus stock movement
- `GET/POST /permission-requests`, Master Admin decision endpoint
- `GET /notifications`, `POST /notifications/:id/read`

All IDs and relationships must be validated server-side. Browser events such as
`motofix:appointments-updated`, `motofix:inventory-updated`, and
`motofix:notifications-updated` only refresh views in the current browser; they
are not substitutes for API persistence or real-time server events.

### Customer booking API integration

The Customer dashboard can use the REST API by setting
`window.MOTOFIX_API_BASE_URL` (for example, `"/api"`) before loading
`CUSTOMER UI/JAVASCRIPTS/Customer.js`. With this setting present, the customer
client uses cookie-backed requests with credentials for `GET /services?active=true`,
`GET /appointments`, `POST /appointments`, and
`PATCH /appointments/:id`. Service and appointment data are refreshed every
30 seconds while the dashboard is visible; service changes in the existing
same-browser Admin demo also propagate through the `motofix_services` storage
event. If the setting is absent, the app deliberately retains its existing
shared-LocalStorage demo behavior; that mode does not synchronize separate
browsers or devices.

The authenticated `GET /appointments` endpoint must return only records visible
to the signed-in customer and include their `customerEmail` for the customer
dashboard's client-side projection. On `POST /appointments`, the server must
derive the customer identity from the authenticated session, assign and return
the appointment ID, and validate service IDs, prices, availability, and
appointment ownership rather than trusting browser snapshots.

For an owning customer, `PATCH /appointments/:id` must atomically allow only a
strictly `Pending` appointment to transition to `Canceled`, update its related
transaction/invoice projection, and publish an Admin notification/event (for
example through the existing real-time channel). A customer may request
cancellation of a `Confirmed` appointment through
`POST /appointments/:id/cancellation-request`; the server must check ownership
and status, require and persist the customer's non-empty `reason`, create one
pending request, and notify Admin without changing the appointment status.
Admin review must use an authenticated endpoint to approve
or deny the request. Approval atomically cancels the appointment, records the
customer as the cancellation initiator and Admin as reviewer, updates the
transaction/invoice projection, notifies the customer, and publishes a
Master-Admin notification/event. Denial leaves the appointment unchanged and
notifies the customer. The server must persist cancellation attribution (for
direct pending cancellations, for example `canceled_by_user_id` plus a
role/name snapshot) from the authenticated session, not from client-supplied
identity fields; return attribution with the updated appointment so Customer
and Admin details can show who canceled it. Store the confirmed-booking request
and review decision in an appointment-linked cancellation-request record or
equivalent durable audit fields.
The browser's local notification event is used only by the LocalStorage demo and
is not a substitute for that server-side event.

Parts selected while a booking is still a draft are stored under a
customer-specific LocalStorage draft and included in the appointment's `parts`
payload at submit time. The server must validate stock and line items on
submission; it must not treat the browser draft as an authorized appointment.
