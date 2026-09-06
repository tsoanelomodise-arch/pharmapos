import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL')

interface LowStockItem {
  id: string
  name: string
  stock_quantity: number
  minimum_stock: number
  supplier_name: string | null
}

interface Profile {
  id: string
  email: string | null
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildEmailHtml(items: LowStockItem[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${item.stock_quantity}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${item.minimum_stock}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;">${item.supplier_name ? escapeHtml(item.supplier_name) : '—'}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PharmaPos Restock Alert</title>
  </head>
  <body style="font-family:Arial,sans-serif;color:#1e293b;">
    <h2 style="color:#0f172a;">PharmaPos Restock Alert</h2>
    <p>The following items are at or below their minimum stock level and may need replenishment.</p>
    <table style="border-collapse:collapse;width:100%;max-width:700px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Product</th>
          <th style="padding:8px;border:1px solid #e2e8f0;">Current Stock</th>
          <th style="padding:8px;border:1px solid #e2e8f0;">Minimum Stock</th>
          <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Preferred Supplier</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p style="margin-top:16px;font-size:12px;color:#64748b;">
      This alert was generated automatically by PharmaPos. You can review and restock items from Stock Control &gt; Restock.
    </p>
  </body>
</html>`
}

function buildEmailText(items: LowStockItem[]): string {
  const header = 'PharmaPos Restock Alert\n\nItems at or below minimum stock:\n\n'
  const rows = items
    .map(
      (item) =>
        `- ${item.name} | Current: ${item.stock_quantity} | Minimum: ${item.minimum_stock} | Supplier: ${item.supplier_name || '—'}`
    )
    .join('\n')
  return header + rows + '\n\nReview and restock from Stock Control > Restock.'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Optional cron secret to prevent public abuse
    const cronHeader = req.headers.get('x-cron-secret')
    if (CRON_SECRET && cronHeader !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Fetch low-stock products with primary supplier name
    const { data: lowStockProducts, error: productsError } = await admin
      .from('products')
      .select(
        `
        id,
        name,
        stock_quantity,
        minimum_stock,
        product_suppliers!inner(is_primary, suppliers(name))
      `
      )
      .lte('stock_quantity', 'minimum_stock')
      .order('name')

    if (productsError) throw productsError

    const items: LowStockItem[] = (lowStockProducts || []).map((p: any) => {
      const primary = Array.isArray(p.product_suppliers)
        ? p.product_suppliers.find((ps: any) => ps.is_primary)
        : null
      const supplierName = primary?.suppliers?.name ?? null
      return {
        id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        minimum_stock: p.minimum_stock,
        supplier_name: supplierName,
      }
    })

    if (items.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No items need restocking',
          recipient_count: 0,
          item_count: 0,
          emails_sent: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all user profiles with email
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, email')
      .not('email', 'is', null)

    if (profilesError) throw profilesError

    const recipients = (profiles || [])
      .map((p: any) => p.email)
      .filter((email): email is string => typeof email === 'string' && email.length > 0)

    let emailsSent = 0
    let emailStatus = 'skipped'

    if (recipients.length > 0 && RESEND_API_KEY && RESEND_FROM_EMAIL) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: recipients,
          subject: `PharmaPos Restock Alert — ${items.length} item${items.length === 1 ? '' : 's'} need attention`,
          html: buildEmailHtml(items),
          text: buildEmailText(items),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Resend returned ${response.status}: ${errorBody}`)
      }

      emailsSent = recipients.length
      emailStatus = 'sent'
    }

    // Log the alert run
    const { error: logError } = await admin.from('restock_alert_log').insert({
      recipient_count: recipients.length,
      item_count: items.length,
    })

    if (logError) {
      console.error('Failed to log restock alert:', logError)
    }

    return new Response(
      JSON.stringify({
        message: 'Restock alert processed',
        recipient_count: recipients.length,
        item_count: items.length,
        emails_sent: emailsSent,
        email_status: emailStatus,
        note: !RESEND_API_KEY || !RESEND_FROM_EMAIL
          ? 'Email not sent: RESEND_API_KEY and RESEND_FROM_EMAIL secrets are not configured.'
          : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('send-restock-alert error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
