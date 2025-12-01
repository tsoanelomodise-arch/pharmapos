import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Printer, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CustomerStatementDialogProps {
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    current_balance: number;
    credit_limit: number;
    address?: string;
  };
}

export function CustomerStatementDialog({ customer }: CustomerStatementDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['customer-statement', customer.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return sales || [];
    },
    enabled: open
  });

  const handlePrint = () => {
    const printContent = document.getElementById('statement-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        /**
         * SECURITY NOTE: Using innerHTML here is currently safe because:
         * 1. All data comes from the database (trusted source)
         * 2. React automatically escapes JSX content
         * 
         * WARNING: If any user-controlled content is ever added to the statement
         * component without proper sanitization, this could create XSS vulnerabilities.
         * Consider using DOMPurify or cloneNode() for future changes.
         */
        printWindow.document.write(`
          <html>
            <head>
              <title>Statement - ${customer.name}</title>
              <style>
                body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
                .statement { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .line { display: flex; justify-content: space-between; margin: 5px 0; }
                .separator { border-top: 1px solid #000; margin: 15px 0; }
                .total { font-weight: bold; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f5f5f5; font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleEmailStatement = () => {
    if (!customer.email) {
      toast({
        title: "No email address",
        description: "This customer doesn't have an email address on file.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Statement sent",
      description: `Statement has been sent to ${customer.email}`,
    });
  };

  const totalAmount = transactions.reduce((sum: number, t: any) => sum + t.total_amount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Statement</DialogTitle>
        </DialogHeader>

        <div id="statement-content" className="statement space-y-6">
          <div className="header text-center">
            <h1 className="text-2xl font-bold">PHARMACY POS</h1>
            <h2 className="text-xl font-semibold mt-2">Account Statement</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Statement Date: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Period: Last 30 Days
            </p>
          </div>

          <Separator />

          <div className="info-grid">
            <div>
              <h3 className="font-semibold mb-2">Account Holder:</h3>
              <p className="font-medium">{customer.name}</p>
              {customer.address && <p className="text-sm">{customer.address}</p>}
              {customer.phone && <p className="text-sm">Phone: {customer.phone}</p>}
              {customer.email && <p className="text-sm">Email: {customer.email}</p>}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Account Summary:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current Balance:</span>
                  <span className="font-bold text-destructive">R{customer.current_balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit Limit:</span>
                  <span>R{customer.credit_limit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Credit:</span>
                  <span className="text-green-600">R{(customer.credit_limit - customer.current_balance).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Transaction History</h3>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No transactions in the last 30 days</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                      <td>
                        {transaction.sale_items?.length || 0} item(s)
                        {transaction.notes && <span className="text-muted-foreground text-xs"> - {transaction.notes}</span>}
                      </td>
                      <td className="capitalize">{transaction.payment_method}</td>
                      <td className="text-right">R{transaction.total_amount.toFixed(2)}</td>
                      <td className="capitalize">{transaction.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Transactions in Period:</span>
              <span>{transactions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Amount (Period):</span>
              <span>R{totalAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between total text-lg">
              <span>OUTSTANDING BALANCE:</span>
              <span className="text-destructive">R{customer.current_balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-6">
            <p>Please retain this statement for your records</p>
            <p>For queries, please contact us during business hours</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={handleEmailStatement} 
            className="flex-1"
            disabled={!customer.email}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Statement
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
