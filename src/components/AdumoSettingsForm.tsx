import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, CheckCircle, AlertCircle, Wifi, RefreshCw, ExternalLink, Zap } from 'lucide-react';
import { useAdumoSettings } from '@/hooks/useAdumoSettings';
import { AdumoPaymentService } from '@/services/adumoService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdumoSettingsForm: React.FC = () => {
  const { settings, saveSettings } = useAdumoSettings();
  const [formData, setFormData] = useState(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveSettings(formData);
    toast.success('Adumo payment settings saved successfully');
  };

  const [isCreatingTestSale, setIsCreatingTestSale] = useState(false);

  const handleInitiateTestSale = async () => {
    setIsCreatingTestSale(true);
    try {
      // 1. Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to record a sale.");
        return;
      }

      // 2. Fetch a product to attach to the sale
      const { data: products } = await supabase
        .from('products')
        .select('id, name, unit_price, stock_quantity')
        .limit(1);

      const testProduct = products && products.length > 0 ? products[0] : null;
      const unitPrice = testProduct ? Number(testProduct.unit_price) : 125.00;
      const quantity = 1;
      const totalAmount = unitPrice * quantity;
      const testRef = `ADUMO-TEST-${Date.now().toString().slice(-6)}`;

      // 3. Process simulated terminal approval
      toast.info("Sending test transaction to Adumo terminal...");
      const result = await AdumoPaymentService.processTransaction(
        {
          reference: testRef,
          amount: totalAmount,
          customerName: "Test Patient (Adumo Demo)",
        },
        formData
      );

      if (!result.success) {
        toast.error(result.statusMessage || "Test transaction was declined");
        return;
      }

      // 4. Record the sale in the database
      const saleNotes = `POS Sale - card payment | Adumo Terminal: ${result.terminalId || 'ADUMO-01'} | Auth: ${result.authCode || '987654'} | Ref: ${result.reference} | Card: ${result.maskedPan || '************4123'}`;

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: totalAmount,
          discount_amount: 0,
          tax_amount: totalAmount * 0.15,
          payment_method: 'card',
          notes: saleNotes,
          processed_by: user.id,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // 5. If we have a product, insert sale_items
      if (testProduct && sale) {
        await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            product_id: testProduct.id,
            quantity: 1,
            unit_price: unitPrice,
            total_price: totalAmount,
          });
      }

      toast.success(`Test Adumo transaction recorded! Sale #${sale.id.slice(-8)} (Ref: ${testRef})`);
    } catch (err: any) {
      console.error('Error creating test adumo record', err);
      toast.error(err.message || "Failed to record test Adumo sale");
    } finally {
      setIsCreatingTestSale(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await AdumoPaymentService.testConnection(formData);
      setTestResult(res);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Error testing connection' });
      toast.error('Failed to communicate with Adumo');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Adumo Payment Integration
            </CardTitle>
            <CardDescription>
              Configure Adumo Connect smart card machines (PED) and Adumo Online Payment Gateway
            </CardDescription>
          </div>
          <Badge variant={formData.environment === 'production' ? 'default' : 'secondary'} className="uppercase">
            {formData.environment}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable / Mode row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-accent/20">
          <div className="space-y-0.5">
            <Label className="text-base font-semibold">Enable Adumo Payments</Label>
            <p className="text-sm text-muted-foreground">
              Allow cashiers to accept card payments via Adumo terminals directly on the POS
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adumo-env">Environment</Label>
            <Select
              value={formData.environment}
              onValueChange={(val) => handleChange('environment', val)}
            >
              <SelectTrigger id="adumo-env">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox / Virtual Simulator (Testing)</SelectItem>
                <SelectItem value="production">Production (Live Payments)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Sandbox mode simulates realistic terminal taps, PIN prompts, and banking approvals.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adumo-mode">Integration Type</Label>
            <Select
              value={formData.mode}
              onValueChange={(val) => handleChange('mode', val)}
            >
              <SelectTrigger id="adumo-mode">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terminal">Adumo Connect (Integrated In-store Terminal)</SelectItem>
                <SelectItem value="online">Adumo Online Gateway / Hosted Checkout</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Connect seamlessly pushes the exact cart total to the card machine.
            </p>
          </div>
        </div>

        {/* Terminal Configuration */}
        {formData.mode === 'terminal' && (
          <div className="p-4 border rounded-lg space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Wifi className="h-4 w-4 text-primary" />
              In-Store Terminal (PED) Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="terminal-id">Terminal Serial / ID</Label>
                <Input
                  id="terminal-id"
                  value={formData.terminalId}
                  onChange={(e) => handleChange('terminalId', e.target.value)}
                  placeholder="e.g. ADUMO-TERM-01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terminal-ip">Terminal LAN IP Address</Label>
                <Input
                  id="terminal-ip"
                  value={formData.terminalIp}
                  onChange={(e) => handleChange('terminalIp', e.target.value)}
                  placeholder="192.168.1.150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terminal-port">Bridge Port</Label>
                <Input
                  id="terminal-port"
                  value={formData.terminalPort}
                  onChange={(e) => handleChange('terminalPort', e.target.value)}
                  placeholder="8088"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="auto-slip"
                checked={formData.autoPrintCustomerSlip}
                onCheckedChange={(c) => handleChange('autoPrintCustomerSlip', c)}
              />
              <Label htmlFor="auto-slip" className="text-sm font-normal">
                Include Adumo card approval slip details automatically on pharmacy receipts
              </Label>
            </div>
          </div>
        )}

        {/* Merchant API Credentials */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Adumo Portal Credentials</h4>
            <a
              href="https://developers.adumoonline.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              Adumo Developer Portal
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-uid">Merchant UID</Label>
              <Input
                id="merchant-uid"
                value={formData.merchantUid}
                onChange={(e) => handleChange('merchantUid', e.target.value)}
                placeholder="Adumo Merchant ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-uid">Application UID</Label>
              <Input
                id="app-uid"
                value={formData.applicationUid}
                onChange={(e) => handleChange('applicationUid', e.target.value)}
                placeholder="Adumo Application ID"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="client-secret">Client Secret (API Key)</Label>
              <Input
                id="client-secret"
                type="password"
                value={formData.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                placeholder="Optional for LAN terminal; required for direct Online Gateway"
              />
            </div>
          </div>
        </div>

        {/* Test Result feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              testResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {testResult.ok ? <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
            <div>
              <p className="font-semibold">{testResult.ok ? 'Connection Verified' : 'Connection Failed'}</p>
              <p className="text-xs mt-0.5">{testResult.message}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing Connection...' : 'Test Adumo Connection'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleInitiateTestSale}
              disabled={isCreatingTestSale}
              className="w-full sm:w-auto border border-primary/30"
            >
              <Zap className={`h-4 w-4 mr-2 text-amber-500 ${isCreatingTestSale ? 'animate-bounce' : ''}`} />
              {isCreatingTestSale ? 'Simulating Terminal...' : 'Initiate Test Adumo Record'}
            </Button>
          </div>

          <Button type="button" onClick={handleSave} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Save Adumo Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
