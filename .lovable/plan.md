# Remote Stock Replenishment with Supplier Documents

Upgrade the existing low-stock restock flow so authorized users can replenish stock remotely, attaching the supplier invoice and delivery note as proof, in a single step.

## What you'll see

1. **Twice-weekly restock alert email** — every Monday and Thursday morning the system checks stock levels and emails the restocking admins a list of every item at or below its minimum, with current and minimum quantities and the preferred supplier. If nothing needs restocking, no email is sent. This is the kick-off of the restocking process.
2. **New "Restock" role** — a dedicated role (assignable in User Management) that allows a user to restock inventory remotely, even without admin rights. Admins and owners keep this ability automatically. Restock-role users, admins and owners receive the alert email.
3. **Documented restocking** — when restocking from the low-stock list, users with the restock role (or admin/owner) can:
   - Enter the supplier invoice number and delivery note number
   - Upload the invoice and delivery note files (photo or PDF)
   - Stock updates immediately on submit, exactly as today, but now each restock is tied to its source documents
4. **Restock history with documents** — the existing Restock History log shows the invoice/delivery note numbers and links to view or download the uploaded documents for each restock.
5. **Audit trail** — document uploads and restocks appear in the Audit Trail as they do today.

## Before the email can send

The system has no verified sending address yet. To send the alert emails, an email domain must be set up (your existing pharmapos.wonderlandstudio.co.za can be used). I'll prompt you for this during the build; everything else works without it.


## Technical details

### Database (via migration tool, your approval required)
- Add `restock` to the `app_role` enum (roles live in the existing `user_roles` table)
- New table `restock_records`: supplier, invoice number, delivery note number, invoice file path, delivery note file path, notes, created by — one row per restock batch
- Link restocked items to the record (restock record id on `stock_movements`, or an items JSONB column)
- RLS: users with the `restock` role (plus admin/owner) can create records; admins/owners and the creator can view; no editing or deleting of records (immutable history)

### Storage
- New private bucket `restock-documents` for invoice/delivery note files
- RLS on `storage.objects` so only the restock role, admin, and owner can upload/read

### Scheduled restock alert email
- Email domain setup required first (custom domain `pharmapos.wonderlandstudio.co.za` available; no email domain is configured in the workspace yet)
- New edge function `send-restock-alert`: queries products where `stock_quantity <= minimum_stock`, resolves recipients (users with `restock` role, admin, or owner via `user_roles` + `profiles.email`), sends one branded HTML email listing product, current stock, minimum, and primary supplier; exits without sending when the list is empty
- Scheduled with `pg_cron` + `pg_net` twice weekly (Mon and Thu, 06:00 UTC / 08:00 SAST) calling the function URL
- New table `restock_alert_log` (sent_at, recipient count, item count) so sends are visible and repeat sends are avoidable; admin/owner read-only



### Frontend
- `src/components/RestockDialog.tsx`: add supplier selector, invoice number, delivery note number, and two file-upload inputs; shown to restock-role users, admins, and owners
- `src/hooks/useProducts.ts`: extend restock mutations to upload files and create the `restock_records` row alongside stock updates
- `src/components/RestockHistoryLog.tsx`: show invoice/delivery note details and document links
- `src/components/UserForm.tsx` / role dialog: add "Restock" as an assignable role
- `src/pages/SystemUpdates.tsx`: log the new version entry

### Security
- UI gating plus database-level enforcement: restock with documents requires the `restock` role or admin/owner — enforced in RLS, not just hidden in the UI
