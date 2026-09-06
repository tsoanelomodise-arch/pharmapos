# Roadmap

## Completed
- Remote stock replenishment backend: restock_records table, stock_movements link, restock-documents bucket, RLS, restock role
- RestockDialog: supplier, invoice/delivery-note numbers, file uploads, single/bulk restock, show-all for admins
- RestockHistoryLog: supplier metadata, line items, signed document downloads
- send-restock-alert edge function: low-stock detection, all-user recipients, alert logging
- Cron schedule: Monday & Thursday 08:00 UTC
- Help/User guide and System Updates entries
- Typecheck and build passed

## In progress
- Configure email delivery for restock alerts using the user's verified email address instead of Resend default

## Pending
- Connect the chosen email provider (Gmail, Outlook, Brevo, or Mailgun) via connector or API key
- Update send-restock-alert to use the chosen provider
- Test email delivery
