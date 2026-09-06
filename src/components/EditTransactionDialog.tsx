import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SaleWithDetails, useUpdateSaleMutation } from "@/hooks/useSales";
import { useUserRole } from "@/hooks/useUserRole";

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface EditTransactionDialogProps {
  sale: SaleWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ sale, open, onOpenChange }: EditTransactionDialogProps) {
  const updateSale = useUpdateSaleMutation();
  
  const { data: role } = useUserRole();
  const canEditDate = role === 'admin' || role === 'owner';

  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>("");

  useEffect(() => {
    if (sale) {
      setPaymentMethod(sale.payment_method);
      setPaymentStatus(sale.payment_status);
      setDiscountAmount(sale.discount_amount?.toString() || "0");
      setNotes(sale.notes || "");
      setTransactionDate(toLocalInputValue(sale.created_at));
    }
  }, [sale]);

  const handleSave = () => {
    if (!sale) return;
    
    updateSale.mutate(
      {
        saleId: sale.id,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'credit' | 'insurance',
        paymentStatus,
        discountAmount: parseFloat(discountAmount) || 0,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Transaction #{sale.id.slice(-8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger id="paymentStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="discount">Discount Amount (R)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this transaction..."
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Customer:</strong> {sale.customer?.name || "Walk-in"}</p>
            <p><strong>Total:</strong> R{sale.total_amount.toFixed(2)}</p>
            <p><strong>Items:</strong> {sale.items_count}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateSale.isPending}>
            {updateSale.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}