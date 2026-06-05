## Goal

Let admins/owners control access to **subpages** (e.g. Transactions, Suppliers, Audit Trail, System Updates, Database Status) in the Module Permissions screen — not just top-level modules.

## Approach

Introduce a new set of granular subpage modules in the existing `app_module` enum and gate each subpage route + sidebar sub-item on its own module. Then surface them in `ModulePermissionsManager` grouped under their parent module for clarity.

### Subpages to make individually permissionable

| Parent module | New submodule | Route |
|---|---|---|
| pos | `transactions` | `/pos/transactions` |
| stock | `suppliers` | `/stock?tab=suppliers` |
| reports | `audit_trail` | `/reports/audit-trail` (replaces current role-only gate) |
| help | `system_updates` | `/help/updates` |
| help | `database_status` | `/help/database` |

(`stock_movement`, `orders`, `edit_transactions`, `medical_aid`, `settings` already exist as separate modules — left unchanged.)

### Changes

1. **Migration** — add the new values to the `app_module` enum: `transactions`, `suppliers`, `audit_trail`, `system_updates`, `database_status`. Update `get_user_modules()` so owners receive them automatically.

2. **`src/hooks/useModulePermissions.ts`** — extend the `AppModule` TypeScript union to include the new values.

3. **`src/App.tsx`** — change the `module=` prop on:
   - `/pos/transactions` → `transactions`
   - `/reports/audit-trail` → `audit_trail`
   - `/help/updates` → `system_updates`
   - `/help/database` → `database_status`
   
   Parent module access (e.g. `pos`, `reports`, `help`) is no longer required for the subpage; users granted only the subpage can still reach it directly.

4. **`src/components/AppSidebar.tsx`** —
   - Replace role-based gate on Audit Trail with `module: "audit_trail"`.
   - Add `module` to Transactions sub-item (`transactions`) and Suppliers sub-item (`suppliers`).
   - Sub-item filtering already honours `subItem.module`, so no logic change beyond the data.
   - Remove the now-unused `requiredRoles`/`useUserRole` plumbing here.

5. **`src/components/ModulePermissionsManager.tsx`** — extend `ALL_MODULES` with the new entries and group/label them as subpages (e.g. "Transactions (POS subpage)", "Suppliers (Stock subpage)", "Audit Trail (Reports subpage)", "System Updates (Help subpage)", "Database Status (Help subpage)") so admins can tick them per user.

6. **`src/components/ModuleProtectedRoute.tsx` & `src/components/SmartRedirect.tsx`** — add route mappings for the new modules so redirects work when a user has only a subpage permission.

7. **`src/pages/Help.tsx`** — if it links to System Updates / Database Status, those cards should hide when the user lacks the corresponding submodule (small conditional render).

8. **`src/pages/SystemUpdates.tsx`** — append a v1.4.1 entry: "Admins/owners can now grant per-subpage access (Transactions, Suppliers, Audit Trail, System Updates, Database Status) from Module Permissions."

### Backwards compatibility

Existing users keep their current parent-module permissions. To avoid silently losing access to subpages they previously could see, the migration will **backfill** the new submodule permissions for every non-owner user who already has the parent module:

- everyone with `pos` → also gets `transactions`
- everyone with `stock` → also gets `suppliers`
- everyone with `reports` → also gets `audit_trail` (admins/owners only — skip pharmacist/manager so we don't widen audit log access)
- everyone with `help` → also gets `system_updates` and `database_status`

Owners are unaffected — `get_user_modules` returns the full list for them.

### Out of scope

- No change to RLS on underlying tables; this is UI/navigation gating only.
- `stock_movement`, `edit_transactions`, `medical_aid`, `settings`, `orders` already work this way and are not touched.
