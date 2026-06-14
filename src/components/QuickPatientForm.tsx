import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const quickPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type QuickPatientFormData = z.infer<typeof quickPatientSchema>;

interface QuickPatientFormProps {
  onSuccess?: (customer: { id: string; name: string; phone?: string }) => void;
  triggerClassName?: string;
}

export function QuickPatientForm({ onSuccess, triggerClassName }: QuickPatientFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<QuickPatientFormData>({
    resolver: zodResolver(quickPatientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: QuickPatientFormData) => {
      const trimmedName = data.name.trim();
      const trimmedPhone = data.phone?.trim() || null;

      // Check for duplicate by name + phone
      if (trimmedPhone) {
        const { data: existing, error: checkError } = await supabase
          .from('customers')
          .select('id, name, phone')
          .ilike('name', trimmedName)
          .eq('phone', trimmedPhone)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          const err = new Error(`A patient named "${existing.name}" with this phone number already exists.`);
          (err as any).isDuplicate = true;
          (err as any).existingPatient = existing;
          throw err;
        }
      }

      const customerData = {
        name: trimmedName,
        phone: trimmedPhone,
        email: data.email || null,
        credit_limit: 0,
        current_balance: 0,
      };

      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select('id, name, phone')
        .single();
      
      if (error) throw error;
      return newCustomer;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-search'] });
      toast({ 
        title: "Patient registered successfully",
        description: `${newCustomer.name} has been added`
      });
      setOpen(false);
      form.reset();
      onSuccess?.(newCustomer);
    },
    onError: (error: any) => {
      if (error.isDuplicate) {
        toast({
          title: "Duplicate patient detected",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error registering patient",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: QuickPatientFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          <UserPlus className="h-4 w-4 mr-1" />
          New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Quick Patient Registration</DialogTitle>
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
                    <Input placeholder="Patient name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
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
                    <Input type="email" placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Register'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
