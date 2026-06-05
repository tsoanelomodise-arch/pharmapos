# System-Wide Audit Trail

## Goal
Add a tamper-resistant, timestamped audit log of system activity, accessible read-only at **Reports → Audit Trail**. Owners and admins can view; nobody (not even via the app) can edit or delete entries.

## What gets logged
Whenever a user performs a meaningful action, an `audit_logs` row is inserted automatically via a Postgres trigger. Tracked tables and actions:

- **sales** — created, edited, deleted (POS transactions)
- **sale_items** — edited, deleted (line-item corrections)
- **prescriptions** — created, dispensed, deleted
- **products** — created, edited, deleted, stock changes
- **customers** — created, edited, deleted
- **doctors** — created, edited, deleted
- **suppliers** — created, edited, deleted
- **user_roles** — role granted, revoked
- **user_module_permissions** — module granted, revoked
- **business_settings** — updated
- **profiles** — updated (excluding self-only profile field edits)

Each entry stores: timestamp, actor (user id + name + role at the time), action (INSERT/UPDATE/DELETE), entity type, entity id, a short human-readable summary, and a JSON diff of changed fields.

## Audit Trail page (`/reports/audit-trail`)
- Reports submenu item "Audit Trail" (Owner/Admin only).
- Table columns: When • Who (name + role) • Action • Entity • Summary • Details (expandable JSON diff).
- Filters: date range (Today / 7 / 30 / Custom — matches the project's standard date filter pattern), actor, entity type, action type, free-text search on summary.
- Pagination (20/page) and CSV export of the filtered view.
- Strictly read-only — no edit/delete UI.

## Access rules
- Page route protected by an Owner/Admin role check (separate from module permissions, since this is a security-sensitive surface).
- Sidebar entry hidden for everyone else.

## System Updates
Append a new entry to `src/pages/SystemUpdates.tsx` (new feature).

---

## Technical details

### Database
New migration:

1. `audit_logs` table:
   - `id`, `created_at`
   - `actor_user_id uuid` (nullable for system actions)
   - `actor_name text`, `actor_role app_role` — snapshotted at write time
   - `action text` (`INSERT` / `UPDATE` / `DELETE`)
   - `entity_type text` (e.g. `sales`, `prescriptions`)
   - `entity_id uuid`
   - `summary text` — short human-readable line
   - `changes jsonb` — `{ before, after, diff_keys[] }`

2. GRANTs:
   - `GRANT SELECT ON public.audit_logs TO authenticated;`
   - `GRANT ALL ON public.audit_logs TO service_role;`
   - **No INSERT/UPDATE/DELETE to anon or authenticated** — only the trigger (SECURITY DEFINER) writes.

3. RLS:
   - Enable RLS.
   - SELECT policy: `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner')`.
   - No INSERT/UPDATE/DELETE policies → blocked from the API entirely.

4. Trigger function `public.log_audit_event()` (SECURITY DEFINER):
   - Resolves actor from `auth.uid()`, looks up name from `profiles` and primary role from `user_roles`.
   - Builds summary per table (e.g. `"Edited sale #1A2B3C: total R120.00 → R150.00"`).
   - Computes diff of changed columns for UPDATE.
   - Inserts into `audit_logs`. Never raises — failures are swallowed via `EXCEPTION WHEN OTHERS` so audit issues can't break user actions.

5. Attach `AFTER INSERT/UPDATE/DELETE` triggers on the tables listed above.

### Frontend
- New page `src/pages/AuditTrail.tsx` (lazy-loaded).
- New hook `src/hooks/useAuditLogs.ts` (react-query, filter params).
- Route in `src/App.tsx`: `/reports/audit-trail`, wrapped in a small `RoleProtectedRoute` (admin/owner) or inline guard.
- Sidebar update in `src/components/AppSidebar.tsx`: add a third sub-item under Reports, conditionally rendered when the user's role is admin/owner.
- CSV export reuses the project's existing pattern (client-side blob).

### Files touched
- `supabase/migrations/<timestamp>_audit_trail.sql` (new)
- `src/pages/AuditTrail.tsx` (new)
- `src/hooks/useAuditLogs.ts` (new)
- `src/App.tsx` (route)
- `src/components/AppSidebar.tsx` (submenu entry)
- `src/pages/SystemUpdates.tsx` (changelog entry)
- `src/pages/Help.tsx` + `src/utils/generateHelpPdf.ts` (brief Audit Trail section)