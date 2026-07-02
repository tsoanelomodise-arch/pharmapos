## Goal
Add a "Send WhatsApp Receipt" button to the Receipt dialog that delivers a formatted text summary of the receipt to the customer's phone number via Twilio's WhatsApp API.

## Prerequisites
1. The user must connect a Twilio workspace connection to this project via `standard_connectors--connect` with `connector_id: twilio`.
2. The Twilio phone number used must be WhatsApp-enabled.

## Plan

### 1. Edge Function: `send-whatsapp-receipt`
Create `supabase/functions/send-whatsapp-receipt/index.ts`.
- Validate JWT and verify the caller is authenticated.
- Accept `sale_id` in the request body.
- Fetch the sale, `sale_items` (with `products.name`), `customers.phone`, and `business_settings` from Supabase.
- Format a concise but complete WhatsApp text receipt using WhatsApp bold formatting (`*text*`).
  - Header: pharmacy name, date, transaction number
  - Patient name
  - Line items: `name x qty @ unit price = total`
  - Totals: subtotal, discount, VAT, total
  - Payment method, cash paid, change
  - Footer: thank you message
- Normalize the customer's phone number to E.164 format (e.g. `0821234567` -> `+278212345678` for South Africa).
- Call the Twilio connector gateway at `https://connector-gateway.lovable.dev/twilio/Messages.json`.
  - `From`: the Twilio WhatsApp number (e.g. `whatsapp:+14155551234`)
  - `To`: the customer's WhatsApp number (e.g. `whatsapp:+278212345678`)
  - `Body`: the formatted receipt text
- Return `{ success: true }` or a clear error.

### 2. Frontend: ReceiptDialog Button
In `src/components/ReceiptDialog.tsx`:
- Add a `MessageSquare` (or WhatsApp icon) button labeled "Send WhatsApp" alongside Print and Download.
- Only show the button when:
  - The sale has a `customers.phone` value.
  - The sale is completed (not a draft/credit).
- On click, call the edge function via `supabase.functions.invoke('send-whatsapp-receipt', { body: { sale_id: saleData.id } })`.
- Show a loading state, then a toast on success ("Receipt sent to +27...") or failure.

### 3. Phone Number Normalization
Implement a small utility function to handle common South African phone number formats:
- Strip non-digit characters.
- If the number starts with `0` and has 10 digits, replace `0` with `+27`.
- If it already starts with `+`, keep it as-is.
- Otherwise, return null and surface an error toast.

### 4. System Updates Log
Append a new changelog entry in `src/pages/SystemUpdates.tsx` documenting the feature.

## Technical Notes
- The Twilio connector gateway uses `application/x-www-form-urlencoded`, not JSON, for the POST body.
- Max Twilio WhatsApp message body is ~1600 characters. If a receipt exceeds this, the formatter should truncate item details gracefully or split into two messages (simpler: warn if too long and send a shorter summary).
- CORS headers required on the edge function for browser invocation.
- No new npm dependencies needed on the frontend.
