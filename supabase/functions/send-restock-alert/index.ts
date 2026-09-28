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
  cost_price?: number | null
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
  const totalCurrentStock = items.reduce((sum, item) => sum + (Number(item.stock_quantity) || 0), 0)
  const totalMinStock = items.reduce((sum, item) => sum + (Number(item.minimum_stock) || 0), 0)
  const totalDeficit = items.reduce(
    (sum, item) => sum + Math.max(0, (Number(item.minimum_stock) || 0) - (Number(item.stock_quantity) || 0)),
    0
  )

  const rows = items
    .map((item) => {
      const shortage = Math.max(0, (item.minimum_stock || 0) - (item.stock_quantity || 0))
      return `<tr>
          <td style="padding:10px 8px;border:1px solid #e2e8f0;font-size:14px;color:#0f172a;font-weight:500;">${escapeHtml(item.name)}</td>
          <td style="padding:10px 8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;color:${item.stock_quantity === 0 ? '#dc2626' : '#ea580c'};font-weight:600;">${item.stock_quantity}</td>
          <td style="padding:10px 8px;border:1px solid #e2e8f0;text-align:center;font-size:14px;color:#475569;">${item.minimum_stock}</td>
          <td style="padding:10px 8px;border:1px solid #e2e8f0;font-size:14px;color:#334155;">${item.supplier_name ? escapeHtml(item.supplier_name) : '—'}</td>
        </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>PharmaPos Restock Alert</title>
  </head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;background-color:#f8fafc;padding:20px;margin:0;">
    <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
        <h2 style="margin:0 0 4px 0;color:#0f172a;font-size:22px;">PharmaPos Restock Alert</h2>
        <p style="margin:0;color:#64748b;font-size:14px;">The following items are at or below their minimum stock level and require replenishment.</p>
      </div>

      <div style="margin:0 0 20px 0;padding:12px 16px;background:#fef2f2;border:1px solid #fee2e2;border-left:4px solid #ef4444;border-radius:6px;font-size:14px;color:#991b1b;">
        <strong>Action Required:</strong> <strong>${items.length} item${items.length === 1 ? '' : 's'}</strong> require restocking. Total shortage across inventory is <strong>${totalDeficit} units</strong>.
      </div>

      <table style="border-collapse:collapse;width:100%;max-width:700px;text-align:left;">
        <thead>
          <tr style="background:#f1f5f9;color:#334155;font-size:13px;text-transform:uppercase;letter-spacing:0.03em;">
            <th style="padding:10px 8px;border:1px solid #e2e8f0;text-align:left;">Product</th>
            <th style="padding:10px 8px;border:1px solid #e2e8f0;text-align:center;">Current Stock</th>
            <th style="padding:10px 8px;border:1px solid #e2e8f0;text-align:center;">Minimum Stock</th>
            <th style="padding:10px 8px;border:1px solid #e2e8f0;text-align:left;">Preferred Supplier</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <!-- CALCULATED TOTAL ROW -->
          <tr style="background:#f8fafc;font-weight:bold;border-top:2px solid #94a3b8;">
            <td style="padding:12px 8px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;font-size:14px;">
              TOTAL (${items.length} product${items.length === 1 ? '' : 's'})
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#dc2626;font-size:14px;">
              ${totalCurrentStock}
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#0f172a;font-size:14px;">
              ${totalMinStock}
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;font-size:13px;color:#475569;font-weight:600;">
              Shortage: +${totalDeficit} units
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc;font-weight:bold;border-top:2px solid #94a3b8;">
            <td style="padding:12px 8px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;font-size:14px;">
              TOTAL (${items.length} product${items.length === 1 ? '' : 's'})
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#dc2626;font-size:14px;">
              ${totalCurrentStock}
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;color:#0f172a;font-size:14px;">
              ${totalMinStock}
            </td>
            <td style="padding:12px 8px;border:1px solid #cbd5e1;font-size:13px;color:#475569;font-weight:600;">
              Shortage: +${totalDeficit} units
            </td>
          </tr>
        </tfoot>
      </table>

      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.5;">
        <p style="margin:0 0 4px 0;">This alert was generated by PharmaPos. You can review and perform replenishment from <strong>Stock Control &gt; Restock</strong>.</p>
        <p style="margin:0;">PharmaPos Pharmacy Management System</p>
      </div>
    </div>
  </body>
</html>`
}

function buildEmailText(items: LowStockItem[]): string {
  const header = 'PharmaPos Restock Alert\n\nItems at or below minimum stock:\n\n'
  const rows = items
    .map((item) => {
      return `- ${item.name} | Current: ${item.stock_quantity} | Minimum: ${item.minimum_stock} | Supplier: ${item.supplier_name || '—'}`
    })
    .join('\n')

  const totalCurrentStock = items.reduce((sum, item) => sum + (Number(item.stock_quantity) || 0), 0)
  const totalMinStock = items.reduce((sum, item) => sum + (Number(item.minimum_stock) || 0), 0)
  const totalDeficit = items.reduce(
    (sum, item) => sum + Math.max(0, (Number(item.minimum_stock) || 0) - (Number(item.stock_quantity) || 0)),
    0
  )

  const totals = `\n\n========================================\nTOTAL (${items.length} items):\n- Total Current Stock: ${totalCurrentStock}\n- Total Minimum Stock: ${totalMinStock}\n- Total Shortage Deficit: ${totalDeficit} units\n========================================\n\nReview and restock from Stock Control > Restock.`

  return header + rows + totals
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
  to: string[],
  bcc: string[] = [],
  subject: string,
  textBody: string,
  htmlBody: string
): string {
  const boundary = '----=_Part_' + Math.random().toString(36).substring(2)
  const lines = [
    `From: ${from}`,
    `To: ${to.join(', ')}`,
  ]
  if (bcc && bcc.length > 0) {
    lines.push(`Bcc: ${bcc.join(', ')}`)
  }
  lines.push(
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
  )
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
  to: string[],
  bcc: string[],
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<void> {
  const raw = createRawEmail(from, to, bcc, subject, textBody, htmlBody)
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
    let requestedRecipients: string[] | undefined
    let triggerSource = 'scheduled'
    let action = 'send'

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body?.action) action = body.action
        if (body?.trigger_source) triggerSource = body.trigger_source
        if (Array.isArray(body?.recipient_emails)) {
          requestedRecipients = body.recipient_emails
            .map((e: any) => String(e).trim().toLowerCase())
            .filter((e: string) => e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        }
      } catch (_) {}
    }

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
        cost_price,
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
          cost_price: p.cost_price,
          supplier_name: supplierName,
        }
      })

    const totalCurrentStock = items.reduce((sum, item) => sum + (Number(item.stock_quantity) || 0), 0)
    const totalMinStock = items.reduce((sum, item) => sum + (Number(item.minimum_stock) || 0), 0)
    const totalDeficit = items.reduce(
      (sum, item) => sum + Math.max(0, (Number(item.minimum_stock) || 0) - (Number(item.stock_quantity) || 0)),
      0
    )

    const isTargeted = requestedRecipients !== undefined || triggerSource === 'manual'

    // Resolve responsible recipients:
    let recipients: string[] = []

    if (isTargeted) {
      // STRICT REQUIREMENT: Only send to the target recipients specified in the manual trigger modal
      if (requestedRecipients && requestedRecipients.length > 0) {
        recipients = Array.from(new Set(requestedRecipients))
      }

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'No target recipient email addresses provided. Restock alerts will only be sent to explicitly selected targets.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Automated / Scheduled run only: query responsible users or fallback
      const { data: rolesData, error: rolesError } = await admin
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['restock', 'admin', 'owner', 'manager'])

      let recipientUserIds: string[] = []
      if (!rolesError && rolesData && rolesData.length > 0) {
        recipientUserIds = Array.from(new Set(rolesData.map((r: any) => r.user_id)))
      }

      if (recipientUserIds.length > 0) {
        const { data: responsibleProfiles, error: respError } = await admin
          .from('profiles')
          .select('id, email')
          .in('id', recipientUserIds)
          .not('email', 'is', null)

        if (!respError && responsibleProfiles) {
          recipients = responsibleProfiles
            .map((p: any) => p.email)
            .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)
        }
      }

      // Fallback: If no users with specific restock/admin roles have profiles with email, fetch all active profiles with email
      if (recipients.length === 0) {
        const { data: allProfiles, error: profilesError } = await admin
          .from('profiles')
          .select('id, email')
          .not('email', 'is', null)

        if (profilesError) throw profilesError

        recipients = (allProfiles || [])
          .map((p: any) => p.email)
          .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)
      }

      recipients = Array.from(new Set(recipients.map((e) => e.trim().toLowerCase())))
    }

    // If this was a preview request, return the calculated list, totals and recipients without sending
    if (action === 'preview') {
      return new Response(
        JSON.stringify({
          message: 'Restock alert preview generated',
          recipient_count: recipients.length,
          recipients,
          item_count: items.length,
          items,
          totals: {
            total_current_stock: totalCurrentStock,
            total_minimum_stock: totalMinStock,
            total_deficit: totalDeficit,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No items need restocking',
          recipient_count: recipients.length,
          recipients,
          item_count: 0,
          emails_sent: 0,
          totals: {
            total_current_stock: 0,
            total_minimum_stock: 0,
            total_deficit: 0,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let emailsSent = 0
    let emailStatus = 'skipped'
    let note: string | undefined

    if (recipients.length > 0 && LOVABLE_API_KEY && GOOGLE_MAIL_API_KEY) {
      const sender = await getGmailSenderEmail()
      const subject = `PharmaPos Restock Alert — ${items.length} item${items.length === 1 ? '' : 's'} need attention (Total Deficit: ${totalDeficit})`
      
      if (isTargeted) {
        // Direct email delivery strictly to the targeted email addresses specified in the UI modal (NO BCC, NO other users)
        await sendGmailEmail(sender, recipients, [], subject, buildEmailText(items), buildEmailHtml(items))
      } else {
        // Scheduled/system cron alert: send to sender with BCC to recipients
        await sendGmailEmail(sender, [sender], recipients, subject, buildEmailText(items), buildEmailHtml(items))
      }

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
        message: 'Restock alert processed successfully',
        recipient_count: recipients.length,
        recipients,
        item_count: items.length,
        totals: {
          total_current_stock: totalCurrentStock,
          total_minimum_stock: totalMinStock,
          total_deficit: totalDeficit,
        },
        emails_sent: emailsSent,
        email_status: emailStatus,
        trigger_source: triggerSource,
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
