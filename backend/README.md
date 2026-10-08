# MotoFix PHP/MySQL Backend Preparation

This folder is a backend foundation for the current LocalStorage-based demo. The frontend is intentionally **not switched to the API yet**. When ready, migrate one feature at a time using `js/api-client.js` and the API contract below.

## Requirements

- XAMPP with Apache and MySQL/MariaDB
- PHP 8.1 or newer with `pdo_mysql` enabled
- MySQL 8.0+ or a compatible MariaDB release
- phpMyAdmin (included in XAMPP)

## Local setup

1. Start Apache and MySQL from the XAMPP control panel.
2. Open phpMyAdmin and import `backend/database/schema.sql`. It creates the `motofix` database and tables.
3. Import `backend/database/seed_catalog.sql` to load the demo services and parts. Re-importing the seed is safe for matching service codes and SKUs.
4. Copy `backend/config.example.php` to `backend/config.php` and enter the local database credentials. `backend/config.php` is ignored by Git and must never be committed.
5. Keep the PHP document root configured so `backend/config.php` is not web-accessible. The included `backend/.htaccess` also denies direct access to configuration/bootstrap files when Apache allows overrides.
6. With the project folder under `htdocs`, check:

   `http://localhost/<project-folder>/backend/public/api/v1/health.php`

   A configured database returns JSON with `status: ok` and `database: connected`. A missing config or database returns a generic error; details go to the PHP error log.

For PHP's development server, run from the project root:

```powershell
php -S 127.0.0.1:8000 -t backend/public
```

The development server exposes only the API public directory. Serve the frontend from the same origin or configure an explicit allow-listed origin before using cross-origin requests.

## Configuration

`backend/config.example.php` is a local-only template. The PDO bootstrap uses exception mode, associative fetches, and native prepared statements. Use a dedicated MySQL user with only the permissions the app needs; do not use the XAMPP root account in production. Keep production debug output off, use HTTPS, and store credentials outside the public web root.

## Data model

- `users`: customer, mechanic, sub-admin (`admin`), and General Admin (`master_admin`) identities. Store only `password_hash()` output.
- `motorcycles`: customer-owned bikes and odometer/modification data.
- `services`, `parts`: service catalog and inventory; stock is numeric and status is derived from quantity.
- `appointments`, `appointment_services`, `appointment_parts`: bookings, assigned mechanics, and price/name snapshots so historical records stay accurate.
- `parts_requests`, `parts_request_items`: customer parts requests before/after booking.
- `invoices`, `invoice_items`, `payments`: transaction and receipt history.
- `inventory_movements`: traceable stock adjustments and appointment usage.
- `account_change_requests`: General Admin approval workflow for account changes.
- `notifications`, `notification_recipients`: per-user delivery/read state; do not store only role-wide read state.
- `audit_logs`: important account, appointment, and inventory actions.

## Current LocalStorage migration map

- `motofix_users` → `users`; migrate only after hashing passwords. Existing demo passwords are plain text and must not be copied into production.
- `motofix_account_directory` → `users` profile/role records; it is not an authentication source of truth.
- `motofix_disabled_accounts` → `users.is_active = 0`.
- `motofix_appointments` → `appointments` plus `appointment_services` and `appointment_parts`.
- `motofix_bikes` → `motorcycles`.
- `motofix_services` → `services`.
- `motofix_parts` → `parts`; record future stock changes in `inventory_movements`.
- `motofix_pending_parts` and `motofix_pending_parts_request_id` → `parts_requests` and `parts_request_items`.
- `userTransactions` and admin invoice records → `invoices`, `invoice_items`, and `payments`.
- `motofix_notifications` → `notifications` and `notification_recipients`.
- `motofix_account_requests` → `account_change_requests`.

Before cutover, export each LocalStorage key as JSON, normalize and validate the records, resolve duplicate emails/plates/SKUs, then import in dependency order. Keep the old data export as a backup and perform a reconciliation of row counts and totals.

## API contract to implement next

All successful responses should be JSON. Use consistent errors such as `{ "error": "validation_error", "message": "..." }`; validate all input server-side and authorize every record against the signed-in user/role.

| Route                                                     | Purpose                                       | Access                                                     |
| --------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `POST /auth/register.php`                                 | Customer signup with `password_hash()`        | Public, rate-limited                                       |
| `POST /auth/login.php`                                    | `password_verify()` and secure session cookie | Public, rate-limited                                       |
| `POST /auth/logout.php`, `GET /auth/me.php`               | End/read the current session                  | Signed in                                                  |
| `GET /services.php`, `GET /parts.php`                     | Active catalog and stock                      | Signed in/public catalog policy                            |
| `GET /appointments.php`, `POST /appointments.php`         | Customer bookings                             | Customer; admin can list all                               |
| `PATCH /appointments/{id}.php`                            | Status or mechanic assignment                 | Admin/General Admin; mechanic status only on assigned jobs |
| `GET /admin/account-change-requests.php`                  | Review account requests                       | General Admin only                                         |
| `POST /admin/account-change-requests.php`                 | Submit an account change request              | Sub-Admin                                                  |
| `GET /notifications.php`, `PATCH /notifications/{id}.php` | Per-user feed/read state                      | Signed in; recipient only                                  |

Use secure, `HttpOnly`, `SameSite` session cookies (and CSRF protection for state-changing requests); do not put session tokens/passwords in LocalStorage. Enforce role checks on the PHP server even when the UI hides controls. Use database transactions for appointment assignment, invoice/payment writes, account approval, and stock movement.

## Frontend migration order

1. Load `js/api-client.js` from an ES module and verify `api.health()`.
2. Implement server registration/login/session endpoints, then replace `js/login.js` and `js/signup.js` LocalStorage authentication.
3. Replace the mock in `js/database-connection.js`, then migrate services and inventory reads/writes.
4. Migrate appointments and mechanic assignment; enforce schedule conflicts in SQL transactions.
5. Migrate account approvals, invoices, notifications, and per-user read receipts.
6. Remove LocalStorage as the source of truth only after every dashboard is API-backed and data has been reconciled.

`js/api-client.js` provides a common JSON request/error boundary and route helpers. It is prepared for the migration but is not loaded by the current demo pages.
