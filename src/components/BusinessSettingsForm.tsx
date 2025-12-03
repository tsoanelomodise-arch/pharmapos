import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Save, Loader2, Percent } from "lucide-react";
import { useBusinessSettings, useUpdateBusinessSettings } from "@/hooks/useBusinessSettings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function BusinessSettingsForm() {
  const { data: settings, isLoading } = useBusinessSettings();
  const updateSettings = useUpdateBusinessSettings();

  const [pharmacyName, setPharmacyName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [vatRate, setVatRate] = useState("15");
  const [vatInclusive, setVatInclusive] = useState(false);

  useEffect(() => {
    if (settings) {
      setPharmacyName(settings.pharmacy_name || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setEmail(settings.email || "");
      setVatNumber(settings.vat_number || "");
      setVatRate(settings.vat_rate?.toString() || "15");
      setVatInclusive(settings.vat_inclusive || false);
    }
  }, [settings]);

  const handleSave = () => {
    if (!settings?.id) return;
    
    const rate = parseFloat(vatRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return;
    }
    
    updateSettings.mutate({
      id: settings.id,
      pharmacy_name: pharmacyName.trim() || "Pharmacy",
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      vat_number: vatNumber.trim() || null,
      vat_rate: rate,
      vat_inclusive: vatInclusive,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Configure your pharmacy details for receipts and documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pharmacyName" className="flex items-center gap-2">
                Pharmacy Name
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your pharmacy's trading name as it will appear on receipts (e.g., "MediCare Pharmacy")</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="pharmacyName"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="Enter pharmacy name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                Phone Number
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Contact number for customer enquiries (e.g., "012 345 6789")</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                Email Address
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Business email for receipts and correspondence (e.g., "info@pharmacy.co.za")</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vatNumber" className="flex items-center gap-2">
                VAT Registration Number
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your SARS VAT registration number for tax invoices (e.g., "4123456789")</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="vatNumber"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="Enter VAT number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              Address
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Full physical address for receipts (e.g., "123 Main Road, Sandton, Johannesburg, 2196")</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter full address"
              rows={2}
            />
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              <h3 className="text-lg font-semibold">VAT Settings</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vatRate" className="flex items-center gap-2">
                  VAT Rate (%)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Standard VAT rate for calculations (e.g., "15" for 15%)</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  id="vatRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  placeholder="15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatInclusive" className="flex items-center gap-2">
                  Prices Include VAT
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>When ON, product prices already include VAT. When OFF, VAT is added on top of prices.</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="vatInclusive"
                    checked={vatInclusive}
                    onCheckedChange={setVatInclusive}
                  />
                  <span className="text-sm text-muted-foreground">
                    {vatInclusive ? "VAT Inclusive (prices include VAT)" : "VAT Exclusive (VAT added to prices)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
