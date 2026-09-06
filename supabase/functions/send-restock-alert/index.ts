import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
const GOOGLE_MAIL_API_KEY = Deno.env.get('GOOGLE_MAIL_API_KEY')

const GMAIL_GATEWAY = 'https://connector-gateway.lovable.dev/google_mail/gmail/v1'

interface LowStockItem {
  id: string
  name: string
  stock_quantity: number
  minimum_stock: number
  supplier_name: string | null
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

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function mimeHeader(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value
  return `=?UTF-8?B?${base64UrlEncode(value)}?=`
}

function createRawEmail(
  from: string,
  to: string,
  bcc: string[],
  subject: string,
  textBody: string,
  htmlBody: string
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2)
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Bcc: ${bcc.join(', ')}`,
    `Subject: ${mimeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
  ]
  return base64UrlEncode(lines.join('\r\n'))
}

async function getGmailSenderEmail(): Promise<string> {
  const response = await fetch(`${GMAIL_GATEWAY}/users/me/profile`, {
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY!,
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gmail profile fetch failed [${response.status}]: ${body}`)
  }
  const profile = await response.json()
  return profile.emailAddress
}

async function sendGmailEmail(
  from: string,
  bcc: string[],
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<void> {
  const raw = createRawEmail(from, from, bcc, subject, textBody, htmlBody)
  const response = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GOOGLE_MAIL_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gmail send failed [${response.status}]: ${body}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Fetch products with primary supplier name and filter low stock in code
    const { data: products, error: productsError } = await admin
      .from('products')
      .select(
        `
        id,
        name,
        stock_quantity,
        minimum_stock,
        product_suppliers(is_primary, suppliers(name))
      `
      )
      .order('name')

    if (productsError) throw productsError

    const items: LowStockItem[] = (products || [])
      .filter((p: any) => (p.stock_quantity || 0) <= (p.minimum_stock || 0))
      .map((p: any) => {
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
    let note: string | undefined

    if (recipients.length > 0 && LOVABLE_API_KEY && GOOGLE_MAIL_API_KEY) {
      const sender = await getGmailSenderEmail()
      const subject = `PharmaPos Restock Alert — ${items.length} item${items.length === 1 ? '' : 's'} need attention`
      await sendGmailEmail(sender, recipients, subject, buildEmailText(items), buildEmailHtml(items))
      emailsSent = recipients.length
      emailStatus = 'sent'
    } else if (recipients.length > 0) {
      note = 'Email not sent: Gmail connector is not linked or secrets are missing.'
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
        note,
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
