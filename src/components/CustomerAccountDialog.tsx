import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, DollarSign, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CustomerAccountDialogProps {
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    current_balance: number;
    credit_limit: number;
  };
}

export function CustomerAccountDialog({ customer }: CustomerAccountDialogProps) {
  const [open, setOpen] = useState(false);

  // Log customer access when dialog opens
  useEffect(() => {
    if (open) {
      const logAccess = async () => {
        await supabase.rpc('log_customer_access', {
          _customer_id: customer.id,
          _access_type: 'view',
          _notes: 'Viewed account details dialog'
        });
      };
      logAccess();
    }
  }, [open, customer.id]);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['customer-transactions', customer.id],
    queryFn: async () => {
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            products (name)
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return sales || [];
    },
    enabled: open
  });

  const availableCredit = customer.credit_limit - customer.current_balance;
  const creditUtilization = (customer.current_balance / customer.credit_limit) * 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Details - {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  R{customer.current_balance.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Credit Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{customer.credit_limit.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R{availableCredit.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credit Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Credit Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Utilization Rate</span>
                  <span className="font-medium">{creditUtilization.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      creditUtilization > 80 ? 'bg-destructive' : 
                      creditUtilization > 50 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {customer.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{customer.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No transactions found</div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.sale_items?.length || 0} items • {transaction.payment_method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">R{transaction.total_amount.toFixed(2)}</p>
                        <Badge variant={transaction.payment_status === 'completed' ? 'secondary' : 'destructive'}>
                          {transaction.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
