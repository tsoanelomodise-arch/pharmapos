import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreditItem {
  saleItemId: string
  quantity: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401)
    const userId = claimsData.claims.sub as string

    const admin = createClient(SUPABASE_URL, SERVICE)

    // Role check: admin or owner
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
    const allowed = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'owner')
    if (!allowed) return json({ error: 'Forbidden — admin or owner only' }, 403)

    const body = await req.json().catch(() => null)
    const saleId: string | undefined = body?.saleId
    const reason: string | undefined = body?.reason
    const items: CreditItem[] = Array.isArray(body?.items) ? body.items : []
    if (!saleId || !reason || reason.trim().length < 3 || items.length === 0) {
      return json({ error: 'saleId, reason (min 3 chars), and at least one item are required' }, 400)
    }

    // Load original sale
    const { data: original, error: saleErr } = await admin
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single()
    if (saleErr || !original) return json({ error: 'Sale not found' }, 404)
    if (original.credit_note_for) return json({ error: 'Cannot credit a credit note' }, 400)
    if (original.payment_status === 'credited') return json({ error: 'Sale already fully credited' }, 400)

    // Load sale items
    const { data: saleItems, error: itemsErr } = await admin
      .from('sale_items')
      .select('*')
      .eq('sale_id', saleId)
    if (itemsErr || !saleItems) return json({ error: 'Could not load sale items' }, 500)

    // Compute already-credited quantities (sum of negative qty across linked credit notes)
    const { data: existingCredits } = await admin
      .from('sales')
      .select('id, sale_items(product_id, quantity)')
      .eq('credit_note_for', saleId)

    const creditedByProduct = new Map<string, number>()
    for (const cn of (existingCredits ?? []) as any[]) {
      for (const si of cn.sale_items ?? []) {
        creditedByProduct.set(si.product_id, (creditedByProduct.get(si.product_id) ?? 0) + Math.abs(si.quantity))
      }
    }

    // Validate requested quantities and build refund lines
    const refundLines: Array<{ saleItem: any; qty: number; lineTotal: number }> = []
    let refundSubtotal = 0
    for (const req of items) {
      const si = saleItems.find((s: any) => s.id === req.saleItemId)
      if (!si) return json({ error: `Sale item ${req.saleItemId} not in this sale` }, 400)
      const qty = Math.floor(Number(req.quantity))
      if (!Number.isFinite(qty) || qty <= 0) continue
      const alreadyCredited = creditedByProduct.get(si.product_id) ?? 0
      const remaining = si.quantity - alreadyCredited
      if (qty > remaining) {
        return json({ error: `Quantity ${qty} exceeds remaining ${remaining} for an item` }, 400)
      }
      const lineTotal = Number(si.unit_price) * qty
      refundSubtotal += lineTotal
      refundLines.push({ saleItem: si, qty, lineTotal })
    }
    if (refundLines.length === 0) return json({ error: 'No valid items to credit' }, 400)

    // Compute proportional VAT/discount from original
    const origSubtotal = saleItems.reduce((s: number, si: any) => s + Number(si.total_price), 0)
    const ratio = origSubtotal > 0 ? refundSubtotal / origSubtotal : 0
    const refundDiscount = Number(original.discount_amount ?? 0) * ratio
    const refundTax = Number(original.tax_amount ?? 0) * ratio
    // Mirror sign convention used in original totals
    const totalRefund = refundSubtotal - refundDiscount + (
      // if VAT was inclusive, total_amount already includes it; we still mirror tax_amount
      0
    ) + refundTax - refundTax + refundTax // simplified below
    // Compute total: original.total_amount = subtotal - discount + tax (exclusive) OR subtotal - discount (inclusive, tax already inside)
    // Detect mode: if original.total = origSubtotal - origDiscount, VAT was inclusive
    const origDiscount = Number(original.discount_amount ?? 0)
    const origTotal = Number(original.total_amount)
    const isInclusive = Math.abs(origTotal - (origSubtotal - origDiscount)) < 0.01
    const creditTotal = isInclusive
      ? (refundSubtotal - refundDiscount)
      : (refundSubtotal - refundDiscount + refundTax)

    // Insert credit-note sale
    const { data: creditNote, error: cnErr } = await admin
      .from('sales')
      .insert({
        customer_id: original.customer_id,
        prescription_id: null,
        total_amount: -Number(creditTotal.toFixed(2)),
        discount_amount: -Number(refundDiscount.toFixed(2)),
        tax_amount: -Number(refundTax.toFixed(2)),
        payment_method: original.payment_method,
        payment_status: 'completed',
        notes: `Credit note for #${String(saleId).slice(-8).toUpperCase()}: ${reason}`,
        processed_by: userId,
        credit_note_for: saleId,
        credit_reason: reason,
      })
      .select()
      .single()
    if (cnErr || !creditNote) return json({ error: cnErr?.message ?? 'Failed to create credit note' }, 500)

    // Insert negative sale_items
    const negativeItems = refundLines.map(({ saleItem, qty, lineTotal }) => ({
      sale_id: creditNote.id,
      product_id: saleItem.product_id,
      quantity: -qty,
      unit_price: Number(saleItem.unit_price),
      total_price: -Number(lineTotal.toFixed(2)),
    }))
    const { error: siErr } = await admin.from('sale_items').insert(negativeItems)
    if (siErr) return json({ error: siErr.message }, 500)

    // Restore stock + stock movement per line
    for (const { saleItem, qty } of refundLines) {
      const { data: prod } = await admin
        .from('products')
        .select('stock_quantity')
        .eq('id', saleItem.product_id)
        .single()
      if (prod) {
        await admin
          .from('products')
          .update({ stock_quantity: prod.stock_quantity + qty })
          .eq('id', saleItem.product_id)
      }
      await admin.from('stock_movements').insert({
        product_id: saleItem.product_id,
        movement_type: 'return',
        quantity: qty,
        reference_id: creditNote.id,
        notes: `Credit for sale #${String(saleId).slice(-8).toUpperCase()}: ${reason}`,
      })
    }

    // Determine if original is now fully credited
    let fullyCredited = true
    for (const si of saleItems as any[]) {
      const previously = creditedByProduct.get(si.product_id) ?? 0
      const justCredited = refundLines
        .filter((r) => r.saleItem.product_id === si.product_id)
        .reduce((s, r) => s + r.qty, 0)
      if (previously + justCredited < si.quantity) {
        fullyCredited = false
        break
      }
    }
    if (fullyCredited) {
      await admin
        .from('sales')
        .update({ payment_status: 'credited' })
        .eq('id', saleId)
    }

    return json({
      success: true,
      creditNoteId: creditNote.id,
      fullyCredited,
      refundTotal: Number(creditTotal.toFixed(2)),
    })
  } catch (e) {
    console.error('credit-sale error', e)
    return json({ error: (e as Error).message ?? 'Internal error' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}