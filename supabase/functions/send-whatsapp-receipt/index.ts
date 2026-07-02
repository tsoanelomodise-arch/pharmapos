import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const admin = createClient(SUPABASE_URL, SERVICE)

    const body = await req.json().catch(() => null)
    const saleId: string | undefined = body?.sale_id
    if (!saleId) {
      return new Response(
        JSON.stringify({ error: 'sale_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch sale with items, customer, and processor
    const { data: sale, error: saleErr } = await admin
      .from('sales')
      .select('*, sale_items(*, products(name, generic_name)), customers(name, phone)')
      .eq('id', saleId)
      .single()
    if (saleErr || !sale) {
      return new Response(
        JSON.stringify({ error: 'Sale not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerPhone = sale.customers?.phone
    if (!customerPhone) {
      return new Response(
        JSON.stringify({ error: 'Customer has no phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: businessSettings } = await admin
      .from('business_settings')
      .select('*')
      .limit(1)
      .single()

    const { data: processor } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', sale.processed_by)
      .single()

    // Normalize phone number to E.164
    const normalizedPhone = normalizePhone(customerPhone)
    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ error: 'Invalid customer phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM')
    if (!fromNumber) {
      return new Response(
        JSON.stringify({ error: 'TWILIO_WHATSAPP_FROM is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch credit notes for this sale
    const { data: creditNotes } = await admin
      .from('sales')
      .select('id, created_at, credit_reason, total_amount, sale_items(quantity, unit_price, total_price, products(name))')
      .eq('credit_note_for', saleId)
      .order('created_at', { ascending: true })

    // Format receipt text
    const receiptText = formatReceipt(sale, businessSettings, processor?.full_name, creditNotes ?? [])

    // Check length and fall back to summary if too long
    const finalText = receiptText.length > 1500 ? formatShortReceipt(sale, businessSettings) : receiptText

    // Send via Twilio gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY')
    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Twilio is not connected. Please connect Twilio in project settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const gatewayRes = await fetch('https://connector-gateway.lovable.dev/twilio/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TWILIO_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${fromNumber}`,
        To: `whatsapp:${normalizedPhone}`,
        Body: finalText,
      }).toString(),
    })

    const gatewayData = await gatewayRes.json().catch(() => ({}))
    if (!gatewayRes.ok) {
      return new Response(
        JSON.stringify({ error: `Twilio error: ${JSON.stringify(gatewayData)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: gatewayData.sid }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('send-whatsapp-receipt error', e)
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  // South African: 0821234567 -> +27821234567
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+27${digits.slice(1)}`
  }
  if (digits.length === 11 && digits.startsWith('27')) {
    return `+${digits}`
  }
  if (phone.trim().startsWith('+')) {
    const afterPlus = phone.trim().slice(1).replace(/\D/g, '')
    if (afterPlus.length >= 10) return `+${afterPlus}`
  }
  // Generic fallback for numbers that already start with country code
  if (digits.length > 10 && !digits.startsWith('0')) {
    return `+${digits}`
  }
  return null
}

function formatReceipt(
  sale: any,
  businessSettings: any,
  processorName: string | null,
  creditNotes: any[]
): string {
  const pharmacyName = businessSettings?.pharmacy_name || 'PharmaPos'
  const date = new Date(sale.created_at).toLocaleString('en-ZA')
  const txn = sale.id.slice(-8).toUpperCase()

  let text = `*${pharmacyName}*\n`
  text += `Receipt #${txn}\n`
  text += `${date}\n\n`

  if (sale.customers?.name) {
    text += `Patient: ${sale.customers.name}\n\n`
  }

  text += `*Items:*\n`
  for (const item of (sale.sale_items || [])) {
    const name = item.products?.name || 'Item'
    const line = `${name} x${item.quantity} @ R${Number(item.unit_price).toFixed(2)}`
    text += `${line} = R${Number(item.total_price).toFixed(2)}\n`
  }

  text += `\n`
  const vatRate = businessSettings?.vat_rate ?? 15
  const vatInclusive = businessSettings?.vat_inclusive ?? true

  if (vatInclusive) {
    if (sale.discount_amount > 0) {
      text += `Discount: -R${Number(sale.discount_amount).toFixed(2)}\n`
    }
    text += `*Total: R${Number(sale.total_amount).toFixed(2)}*\n`
    text += `(Includes R${Number(sale.tax_amount).toFixed(2)} VAT @ ${vatRate}%)\n`
  } else {
    const subtotal = Number(sale.total_amount) - Number(sale.tax_amount) + Number(sale.discount_amount)
    text += `Subtotal: R${subtotal.toFixed(2)}\n`
    if (sale.discount_amount > 0) {
      text += `Discount: -R${Number(sale.discount_amount).toFixed(2)}\n`
    }
    text += `VAT (${vatRate}%): R${Number(sale.tax_amount).toFixed(2)}\n`
    text += `*Total: R${Number(sale.total_amount).toFixed(2)}*\n`
  }

  text += `\n`
  text += `Payment: ${String(sale.payment_method || '').toUpperCase()}\n`
  if (sale.payment_method === 'cash' && sale.cash_paid != null) {
    text += `Cash Paid: R${Number(sale.cash_paid).toFixed(2)}\n`
    if (sale.change_given) {
      text += `Change: R${Number(sale.change_given).toFixed(2)}\n`
    }
  }
  text += `Status: ${String(sale.payment_status || '').toUpperCase()}\n`
  if (processorName) {
    text += `Served by: ${processorName}\n`
  }

  if (creditNotes.length > 0) {
    text += `\n*Credit Notes:*\n`
    for (const cn of creditNotes) {
      text += `${new Date(cn.created_at).toLocaleString('en-ZA')} — R${Number(cn.total_amount).toFixed(2)}\n`
      for (const si of (cn.sale_items || [])) {
        text += `  ${Math.abs(si.quantity)} x ${si.products?.name || 'Item'} = R${Number(si.total_price).toFixed(2)}\n`
      }
      if (cn.credit_reason) {
        text += `  Reason: ${cn.credit_reason}\n`
      }
    }
  }

  if (sale.notes) {
    text += `\nNotes: ${sale.notes}\n`
  }

  text += `\nThank you for your business!`

  return text
}

function formatShortReceipt(sale: any, businessSettings: any): string {
  const pharmacyName = businessSettings?.pharmacy_name || 'PharmaPos'
  const date = new Date(sale.created_at).toLocaleString('en-ZA')
  const txn = sale.id.slice(-8).toUpperCase()

  let text = `*${pharmacyName}*\n`
  text += `Receipt #${txn}\n`
  text += `${date}\n\n`

  if (sale.customers?.name) {
    text += `Patient: ${sale.customers.name}\n\n`
  }

  text += `*Total: R${Number(sale.total_amount).toFixed(2)}*\n`
  text += `Items: ${(sale.sale_items || []).length}\n`
  text += `Payment: ${String(sale.payment_method || '').toUpperCase()}\n\n`
  text += `Thank you for your business!`

  return text
}
