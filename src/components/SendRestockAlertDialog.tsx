import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Send, Loader2, Plus, X, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SendRestockAlertDialogProps {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showBadge?: boolean;
  buttonText?: string;
}

export function SendRestockAlertDialog({
  variant = "outline",
  size = "default",
  className = "",
  showBadge = true,
  buttonText = "Send Restock Alert",
}: SendRestockAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { data: lowStockProducts = [], isLoading: loadingProducts } = useLowStockProducts();

  // Initialize recipients with owner/target email
  const [recipients, setRecipients] = useState<string[]>(() => {
    return ["tsoanelomodise@gmail.com"];
  });
  const [customEmail, setCustomEmail] = useState("");

  // Calculate items and shortage totals directly from lowStockProducts
  const items = useMemo(() => {
    return lowStockProducts.map((product) => {
      const shortage = Math.max(0, (product.minimum_stock || 0) - (product.stock_quantity || 0));
      return {
        id: product.id,
        name: product.name,
        stock_quantity: product.stock_quantity ?? 0,
        minimum_stock: product.minimum_stock ?? 0,
        shortage,
      };
    });
  }, [lowStockProducts]);

  const totals = useMemo(() => {
    const totalCurrent = items.reduce((acc, i) => acc + i.stock_quantity, 0);
    const totalMin = items.reduce((acc, i) => acc + i.minimum_stock, 0);
    const totalDeficit = items.reduce((acc, i) => acc + i.shortage, 0);
    return {
      total_current_stock: totalCurrent,
      total_minimum_stock: totalMin,
      total_deficit: totalDeficit,
    };
  }, [items]);

  const handleAddRecipient = () => {
    const trimmed = customEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (recipients.includes(trimmed)) {
      toast.info("This email is already in the recipient list");
      return;
    }
    setRecipients((prev) => [...prev, trimmed]);
    setCustomEmail("");
  };

  const handleRemoveRecipient = (emailToRemove: string) => {
    if (recipients.length === 1) {
      toast.warning("At least one recipient email address is required");
      return;
    }
    setRecipients((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleSendAlert = async () => {
    if (recipients.length === 0) {
      toast.error("Please specify at least one recipient email address");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-restock-alert", {
        body: {
          action: "send",
          recipient_emails: recipients,
          trigger_source: "manual",
        },
      });

      if (error) throw error;

      if (data?.note) {
        toast.info(data.note, {
          duration: 6000,
          description: "Alert logged in system log.",
        });
      } else {
        toast.success(
          `Restock alert email sent to ${recipients.join(", ")}!`,
          {
            description: `Sent for ${data?.item_count || items.length} low-stock items. Total shortage: ${totals.total_deficit} units.`,
          }
        );
      }

      setOpen(false);
    } catch (err: any) {
      console.error("Error triggering restock alert:", err);
      toast.error(err.message || "Failed to trigger restock email alert");
    } finally {
      setSending(false);
    }
  };

  const lowStockCount = items.length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Mail className="h-4 w-4 mr-2 text-primary" />
          <span>{buttonText}</span>
          {showBadge && lowStockCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0">
              {lowStockCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Send Restock Alert Email</DialogTitle>
              <DialogDescription>
                Manually notify personnel responsible for restocking with the current inventory shortages.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loadingProducts ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gathering low-stock products...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 border rounded-lg bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items Needing Restock</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-destructive">{items.length}</span>
                  <span className="text-xs text-muted-foreground">products</span>
                </div>
              </div>

              <div className="p-3.5 border rounded-lg bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Shortage Deficit</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-orange-600">+{totals.total_deficit}</span>
                  <span className="text-xs text-muted-foreground">units needed</span>
                </div>
              </div>

              <div className="p-3.5 border rounded-lg bg-card">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Status Ratio</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-foreground">{totals.total_current_stock}</span>
                  <span className="text-xs text-muted-foreground">/ {totals.total_minimum_stock} min threshold</span>
                </div>
              </div>
            </div>

            {/* Recipients Section */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Target Recipients</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  (Emails that will receive the restock alert)
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-2.5 pr-1.5 py-1 text-xs flex items-center gap-1.5">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="rounded-full hover:bg-muted-foreground/20 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Remove recipient"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Add another email (e.g. manager@pharmacy.com)..."
                  className="h-8 text-xs"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRecipient();
                    }
                  }}
                />
                <Button size="sm" variant="secondary" className="h-8 px-3 text-xs" onClick={handleAddRecipient}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Email Items Table with Calculated Total Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Email Content Preview</span>
                <span className="text-xs text-muted-foreground">
                  Includes calculated total summary row
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-medium">All stock levels are optimal!</p>
                  <p className="text-xs text-muted-foreground">
                    There are currently no products at or below their minimum stock threshold.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="max-h-[220px]">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="font-semibold text-xs">Product</TableHead>
                          <TableHead className="font-semibold text-xs text-center">Current Stock</TableHead>
                          <TableHead className="font-semibold text-xs text-center">Min Stock</TableHead>
                          <TableHead className="font-semibold text-xs text-center">Shortage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} className="text-xs">
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className={`text-center font-bold ${item.stock_quantity === 0 ? "text-destructive" : "text-orange-600"}`}>
                              {item.stock_quantity}
                            </TableCell>
                            <TableCell className="text-center">{item.minimum_stock}</TableCell>
                            <TableCell className="text-center font-bold text-destructive">
                              +{item.shortage}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      {/* CALCULATED TOTAL ROW */}
                      <TableFooter className="bg-muted/80 font-bold border-t-2 border-border text-xs sticky bottom-0">
                        <TableRow>
                          <TableCell className="font-bold text-foreground">
                            TOTAL ({items.length} product{items.length === 1 ? "" : "s"})
                          </TableCell>
                          <TableCell className="text-center text-destructive font-bold">
                            {totals.total_current_stock}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {totals.total_minimum_stock}
                          </TableCell>
                          <TableCell className="text-center text-destructive font-bold">
                            +{totals.total_deficit}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendAlert}
            disabled={sending || recipients.length === 0}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Alert Email...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Alert Now ({recipients.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
