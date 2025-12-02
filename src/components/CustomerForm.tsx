import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, ChevronDown, ChevronRight, HeartPulse } from "lucide-react";
import { useUserModules } from "@/hooks/useModulePermissions";
import type { Customer } from "@/hooks/useCustomers";

// Common South African Medical Aid Schemes
const MEDICAL_AID_SCHEMES = [
  { name: "Discovery Health", code: "DH" },
  { name: "Bonitas", code: "BON" },
  { name: "Momentum Health", code: "MOM" },
  { name: "GEMS (Government)", code: "GEMS" },
  { name: "Medihelp", code: "MH" },
  { name: "Bestmed", code: "BM" },
  { name: "Fedhealth", code: "FH" },
  { name: "Medshield", code: "MS" },
  { name: "Sizwe Hosmed", code: "SH" },
  { name: "Profmed", code: "PM" },
  { name: "Keyhealth", code: "KH" },
  { name: "Liberty Health", code: "LH" },
  { name: "Bankmed", code: "BKM" },
  { name: "Polmed", code: "POL" },
  { name: "LA Health", code: "LA" },
  { name: "Selfmed", code: "SM" },
  { name: "CompCare", code: "CC" },
  { name: "Other", code: "OTH" },
];

const medicalAidSchema = z.object({
  scheme_name: z.string().optional(),
  scheme_code: z.string().optional(),
  plan_name: z.string().optional(),
  membership_number: z.string().optional(),
  dependent_code: z.string().optional(),
  id_number: z.string().optional(),
  is_principal_member: z.boolean().optional(),
  principal_member_name: z.string().optional(),
});

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  credit_limit: z.number().min(0, "Credit limit must be non-negative"),
  current_balance: z.number(),
  medical_aid: medicalAidSchema.optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [medicalAidOpen, setMedicalAidOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: userModules } = useUserModules();
  
  // Check if user has medical_aid permission
  const canViewMedicalAid = userModules?.includes('medical_aid');

  // Parse existing insurance_info if available
  const existingMedicalAid = customer?.insurance_info as {
    scheme_name?: string;
    scheme_code?: string;
    plan_name?: string;
    membership_number?: string;
    dependent_code?: string;
    id_number?: string;
    is_principal_member?: boolean;
    principal_member_name?: string;
  } | null;
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      date_of_birth: customer.date_of_birth || "",
      credit_limit: customer.credit_limit,
      current_balance: customer.current_balance,
      medical_aid: {
        scheme_name: existingMedicalAid?.scheme_name || "",
        scheme_code: existingMedicalAid?.scheme_code || "",
        plan_name: existingMedicalAid?.plan_name || "",
        membership_number: existingMedicalAid?.membership_number || "",
        dependent_code: existingMedicalAid?.dependent_code || "",
        id_number: existingMedicalAid?.id_number || "",
        is_principal_member: existingMedicalAid?.is_principal_member ?? true,
        principal_member_name: existingMedicalAid?.principal_member_name || "",
      },
    } : {
      name: "",
      phone: "",
      email: "",
      address: "",
      date_of_birth: "",
      credit_limit: 0,
      current_balance: 0,
      medical_aid: {
        scheme_name: "",
        scheme_code: "",
        plan_name: "",
        membership_number: "",
        dependent_code: "00",
        id_number: "",
        is_principal_member: true,
        principal_member_name: "",
      },
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      // Build insurance_info JSONB from medical_aid fields
      const hasMedicalAidData = data.medical_aid?.scheme_name || data.medical_aid?.membership_number;
      const insuranceInfo = hasMedicalAidData ? {
        scheme_name: data.medical_aid?.scheme_name || null,
        scheme_code: data.medical_aid?.scheme_code || null,
        plan_name: data.medical_aid?.plan_name || null,
        membership_number: data.medical_aid?.membership_number || null,
        dependent_code: data.medical_aid?.dependent_code || null,
        id_number: data.medical_aid?.id_number || null,
        is_principal_member: data.medical_aid?.is_principal_member ?? true,
        principal_member_name: data.medical_aid?.principal_member_name || null,
      } : null;

      const customerData = {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        date_of_birth: data.date_of_birth || null,
        credit_limit: data.credit_limit,
        current_balance: data.current_balance,
        insurance_info: insuranceInfo,
      };

      if (customer) {
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customers')
          .insert(customerData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-debt'] });
      toast({ 
        title: `Customer ${customer ? 'updated' : 'created'} successfully` 
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: `Error ${customer ? 'updating' : 'creating'} customer`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  const handleSchemeChange = (schemeName: string) => {
    const scheme = MEDICAL_AID_SCHEMES.find(s => s.name === schemeName);
    form.setValue("medical_aid.scheme_name", schemeName);
    form.setValue("medical_aid.scheme_code", scheme?.code || "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={customer ? "ghost" : "default"} size={customer ? "sm" : "default"}>
          {customer ? (
            <Edit2 className="h-4 w-4" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (R)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="current_balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance (R)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Medical Aid Section - Only visible to users with medical_aid permission */}
            {canViewMedicalAid && (
              <Collapsible open={medicalAidOpen} onOpenChange={setMedicalAidOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-primary" />
                      <span>Medical Aid Details</span>
                    </div>
                    {medicalAidOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="medical_aid.scheme_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Aid Scheme</FormLabel>
                        <Select
                          value={field.value || ""}
                          onValueChange={handleSchemeChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a scheme" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEDICAL_AID_SCHEMES.map((scheme) => (
                            <SelectItem key={scheme.code} value={scheme.name}>
                              {scheme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medical_aid.plan_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KeyCare Plus, Executive" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="medical_aid.membership_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medical_aid.dependent_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dependent Code</FormLabel>
                        <Select
                          value={field.value || "00"}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="00">00 - Principal Member</SelectItem>
                            <SelectItem value="01">01 - Spouse</SelectItem>
                            <SelectItem value="02">02 - Child 1</SelectItem>
                            <SelectItem value="03">03 - Child 2</SelectItem>
                            <SelectItem value="04">04 - Child 3</SelectItem>
                            <SelectItem value="05">05 - Child 4</SelectItem>
                            <SelectItem value="06">06 - Adult Dependent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="medical_aid.id_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SA ID Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="13 digit ID number" 
                          maxLength={13}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("medical_aid.dependent_code") !== "00" && (
                  <FormField
                    control={form.control}
                    name="medical_aid.principal_member_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal Member Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of main member" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CollapsibleContent>
            </Collapsible>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : (customer ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
