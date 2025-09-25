import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomers } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2 } from "lucide-react";
import type { Prescription } from "@/hooks/usePrescriptions";

const prescriptionSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  doctor_name: z.string().min(1, "Doctor name is required"),
  doctor_license: z.string().optional(),
  prescription_date: z.string().min(1, "Prescription date is required"),
  medications: z.string().min(1, "Medications are required"),
  status: z.enum(["pending", "dispensed", "cancelled"]),
  notes: z.string().optional(),
});

type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

interface PrescriptionFormProps {
  prescription?: Prescription;
  onSuccess?: () => void;
}

export function PrescriptionForm({ prescription, onSuccess }: PrescriptionFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  
  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: prescription ? {
      customer_id: prescription.customer_id,
      doctor_name: prescription.doctor_name,
      doctor_license: prescription.doctor_license || "",
      prescription_date: prescription.prescription_date,
      medications: typeof prescription.medications === 'string' 
        ? prescription.medications 
        : JSON.stringify(prescription.medications),
      status: prescription.status as "pending" | "dispensed" | "cancelled",
      notes: prescription.notes || "",
    } : {
      customer_id: "",
      doctor_name: "",
      doctor_license: "",
      prescription_date: new Date().toISOString().split('T')[0],
      medications: "",
      status: "pending" as const,
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      let medications;
      try {
        // Try to parse as JSON first, if it fails, treat as string
        medications = JSON.parse(data.medications);
      } catch {
        // If parsing fails, create a simple medication object
        medications = [{
          name: data.medications,
          dosage: "",
          frequency: "",
          duration: ""
        }];
      }

      const prescriptionData = {
        customer_id: data.customer_id,
        doctor_name: data.doctor_name,
        doctor_license: data.doctor_license || null,
        prescription_date: data.prescription_date,
        medications,
        status: data.status,
        notes: data.notes || null,
      };

      if (prescription) {
        const { error } = await supabase
          .from('prescriptions')
          .update(prescriptionData)
          .eq('id', prescription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prescriptions')
          .insert(prescriptionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['todays-prescriptions'] });
      toast({ 
        title: `Prescription ${prescription ? 'updated' : 'created'} successfully` 
      });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: `Error ${prescription ? 'updating' : 'creating'} prescription`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={prescription ? "ghost" : "default"} size={prescription ? "sm" : "default"}>
          {prescription ? (
            <Edit2 className="h-4 w-4" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              New Prescription
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{prescription ? 'Edit Prescription' : 'Add New Prescription'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.phone && `(${customer.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="doctor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="doctor_license"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor License</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prescription_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescription Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medications *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter medication details (one per line or as JSON)"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="dispensed">Dispensed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : (prescription ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}