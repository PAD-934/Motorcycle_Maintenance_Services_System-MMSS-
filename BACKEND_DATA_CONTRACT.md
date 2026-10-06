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
