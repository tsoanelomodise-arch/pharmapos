import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCreditSaleMutation } from "@/hooks/useCreditSale";

interface Props {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemRow {
  saleItemId: string;
  productId: string;
  name: string;
  unitPrice: number;
  originalQty: number;
  alreadyCredited: number;
  remaining: number;
  qtyToCredit: number;
}

export function CreditTransactionDialog({ saleId, open, onOpenChange }: Props) {
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([]);
  const credit = useCreditSaleMutation();

  const { data, isLoading } = useQuery({
    queryKey: ["credit-dialog", saleId],
    enabled: !!saleId && open,
    queryFn: async () => {
      const { data: sale, error: sErr } = await supabase
        .from("sales")
        .select("id, total_amount, payment_status, credit_note_for")
        .eq("id", saleId!)
        .single();
      if (sErr) throw sErr;

      const { data: items, error: iErr } = await supabase
        .from("sale_items")
        .select("id, product_id, quantity, unit_price, total_price, products(name)")
        .eq("sale_id", saleId!);
      if (iErr) throw iErr;

      const { data: creditNotes, error: cErr } = await supabase
        .from("sales")
        .select("id, sale_items(product_id, quantity)")
        .eq("credit_note_for", saleId!);
      if (cErr) throw cErr;

      const credited = new Map<string, number>();
      for (const cn of (creditNotes ?? []) as any[]) {
        for (const si of cn.sale_items ?? []) {
          credited.set(si.product_id, (credited.get(si.product_id) ?? 0) + Math.abs(si.quantity));
        }
      }
      return { sale, items: items ?? [], credited };
    },
  });

  useEffect(() => {
    if (!data) {
      setRows([]);
      return;
    }
    const next: ItemRow[] = (data.items as any[]).map((si) => {
      const alreadyCredited = data.credited.get(si.product_id) ?? 0;
      return {
        saleItemId: si.id,
        productId: si.product_id,
        name: si.products?.name ?? "Unknown",
        unitPrice: Number(si.unit_price),
        originalQty: si.quantity,
        alreadyCredited,
        remaining: si.quantity - alreadyCredited,
        qtyToCredit: 0,
      };
    });
    setRows(next);
    setReason("");
  }, [data]);

  const refundSubtotal = useMemo(
    () => rows.reduce((s, r) => s + r.qtyToCredit * r.unitPrice, 0),
    [rows],
  );

  const setQty = (id: string, qty: number) =>
    setRows((rs) =>
      rs.map((r) =>
        r.saleItemId === id
          ? { ...r, qtyToCredit: Math.max(0, Math.min(r.remaining, Math.floor(qty || 0))) }
          : r,
      ),
    );

  const creditAll = () => setRows((rs) => rs.map((r) => ({ ...r, qtyToCredit: r.remaining })));
  const clearAll = () => setRows((rs) => rs.map((r) => ({ ...r, qtyToCredit: 0 })));

  const handleConfirm = () => {
    if (!saleId) return;
    const items = rows
      .filter((r) => r.qtyToCredit > 0)
      .map((r) => ({ saleItemId: r.saleItemId, quantity: r.qtyToCredit }));
    credit.mutate(
      { saleId, reason: reason.trim(), items },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const canSubmit =
    reason.trim().length >= 3 &&
    rows.some((r) => r.qtyToCredit > 0) &&
    !credit.isPending;

  const hasAnyRemaining = rows.some((r) => r.remaining > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" /> Credit Transaction
          </DialogTitle>
          <DialogDescription>
            {saleId && <>Transaction #{saleId.slice(-8).toUpperCase()}. Select items to refund and restore to stock.</>}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading items…</div>
        ) : !hasAnyRemaining ? (
          <div className="py-8 text-center text-muted-foreground">
            All items in this transaction have already been credited.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{rows.length} line item(s)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={clearAll}>Clear</Button>
                <Button size="sm" variant="outline" onClick={creditAll}>Credit all remaining</Button>
              </div>
            </div>

            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {rows.map((r) => (
                <div key={r.saleItemId} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      R{r.unitPrice.toFixed(2)} · Original {r.originalQty}
                      {r.alreadyCredited > 0 && (
                        <> · <Badge variant="outline" className="ml-1">Credited {r.alreadyCredited}</Badge></>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`q-${r.saleItemId}`} className="text-xs text-muted-foreground">
                      Qty (max {r.remaining})
                    </Label>
                    <Input
                      id={`q-${r.saleItemId}`}
                      type="number"
                      min={0}
                      max={r.remaining}
                      disabled={r.remaining === 0}
                      value={r.qtyToCredit}
                      onChange={(e) => setQty(r.saleItemId, Number(e.target.value))}
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer return — wrong medication"
                rows={2}
              />
            </div>

            <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items to credit</span>
                <span>{rows.reduce((s, r) => s + r.qtyToCredit, 0)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Refund subtotal</span>
                <span className="text-destructive">- R{refundSubtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                VAT and discount are credited proportionally. Stock is restored automatically.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || !hasAnyRemaining}
            onClick={handleConfirm}
          >
            {credit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Credit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}