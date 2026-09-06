# Remote Stock Replenishment with Supplier Documents

Upgrade the existing low-stock restock flow so authorized users can replenish stock remotely, attaching the supplier invoice and delivery note as proof, in a single step.

## What you'll see

1. **New "Restock" role** — a dedicated role (assignable in User Management) that allows a user to restock inventory remotely, even without admin rights. Admins and owners keep this ability automatically.
2. **Documented restocking** — when restocking from the low-stock list, users with the restock role (or admin/owner) can:
   - Enter the supplier invoice number and delivery note number
   - Upload the invoice and delivery note files (photo or PDF)
   - Stock updates immediately on submit, exactly as today, but now each restock is tied to its source documents
3. **Restock history with documents** — the existing Restock History log shows the invoice/delivery note numbers and links to view or download the uploaded documents for each restock.
4. **Audit trail** — document uploads and restocks appear in the Audit Trail as they do today.

## Technical details

### Database (via migration tool, your approval required)
- Add `restock` to the `app_role` enum (roles live in the existing `user_roles` table)
- New table `restock_records`: supplier, invoice number, delivery note number, invoice file path, delivery note file path, notes, created by — one row per restock batch
- Link restocked items to the record (restock record id on `stock_movements`, or an items JSONB column)
- RLS: users with the `restock` role (plus admin/owner) can create records; admins/owners and the creator can view; no editing or deleting of records (immutable history)

### Storage
- New private bucket `restock-documents` for invoice/delivery note files
- RLS on `storage.objects` so only the restock role, admin, and owner can upload/read

### Frontend
- `src/components/RestockDialog.tsx`: add supplier selector, invoice number, delivery note number, and two file-upload inputs; shown to restock-role users, admins, and owners
- `src/hooks/useProducts.ts`: extend restock mutations to upload files and create the `restock_records` row alongside stock updates
- `src/components/RestockHistoryLog.tsx`: show invoice/delivery note details and document links
- `src/components/UserForm.tsx` / role dialog: add "Restock" as an assignable role
- `src/pages/SystemUpdates.tsx`: log the new version entry

### Security
- UI gating plus database-level enforcement: restock with documents requires the `restock` role or admin/owner — enforced in RLS, not just hidden in the UI
