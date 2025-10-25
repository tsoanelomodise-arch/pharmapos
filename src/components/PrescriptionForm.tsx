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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCustomers, useCustomerSearch } from "@/hooks/useCustomers";
import { useDoctors, useDoctorSearch } from "@/hooks/useDoctors";
import { useProducts, useProductSearch } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit2, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorOpen, setDoctorOpen] = useState(false);
  const [medicationSearch, setMedicationSearch] = useState("");
  const [medicationOpen, setMedicationOpen] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<Array<{
    id: string;
    product_id: string;
    name: string;
    dosage?: string;
    dosage_form?: string;
    frequency?: string;
    duration?: string;
    unit_price: number;
    quantity: number;
  }>>([]);
  
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const { data: searchResults = [] } = useCustomerSearch(customerSearch);
  const { data: doctors = [] } = useDoctors();
  const { data: doctorSearchResults = [] } = useDoctorSearch(doctorSearch);
  const { data: products = [] } = useProducts();
  const { data: medicationSearchResults = [] } = useProductSearch(medicationSearch);
  
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

  // Initialize selected medications from prescription
  useState(() => {
    if (prescription && prescription.medications) {
      try {
        const meds = typeof prescription.medications === 'string' 
          ? JSON.parse(prescription.medications)
          : prescription.medications;
        if (Array.isArray(meds)) {
          setSelectedMedications(meds);
        }
      } catch (e) {
        // Handle parsing error silently
      }
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      const medications = selectedMedications.length > 0 
        ? selectedMedications 
        : [{
            name: data.medications,
            dosage: "",
            frequency: "",
            duration: ""
          }];

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
      setSelectedMedications([]);
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
              render={({ field }) => {
                const displayCustomers = customerSearch.length > 2 ? searchResults : customers;
                const selectedCustomer = customers.find(c => c.id === field.value);
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Patient *</FormLabel>
                    <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedCustomer 
                              ? `${selectedCustomer.name} ${selectedCustomer.phone ? `(${selectedCustomer.phone})` : ''}` 
                              : "Search for patient..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput 
                            placeholder="Search by name, phone, or email..." 
                            value={customerSearch}
                            onValueChange={setCustomerSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No patient found.</CommandEmpty>
                            <CommandGroup>
                              {displayCustomers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.name} ${customer.phone || ''} ${customer.email || ''}`}
                                  onSelect={() => {
                                    field.onChange(customer.id);
                                    setCustomerOpen(false);
                                    setCustomerSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      customer.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{customer.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {customer.phone && `Phone: ${customer.phone}`}
                                      {customer.email && ` | Email: ${customer.email}`}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="doctor_name"
              render={({ field }) => {
                const displayDoctors = doctorSearch.length > 2 ? doctorSearchResults : doctors;
                const selectedDoctor = doctors.find(d => d.name === field.value);
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Doctor *</FormLabel>
                    <Popover open={doctorOpen} onOpenChange={setDoctorOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedDoctor 
                              ? selectedDoctor.name
                              : field.value || "Search for doctor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search by name, license, specialization..." 
                            value={doctorSearch}
                            onValueChange={setDoctorSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No doctor found.</CommandEmpty>
                            <CommandGroup>
                              {displayDoctors.map((doctor) => (
                                <CommandItem
                                  key={doctor.id}
                                  value={`${doctor.name} ${doctor.license_number || ''} ${doctor.specialization || ''}`}
                                  onSelect={() => {
                                    field.onChange(doctor.name);
                                    form.setValue("doctor_license", doctor.license_number || "");
                                    setDoctorOpen(false);
                                    setDoctorSearch("");
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      doctor.name === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{doctor.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {doctor.specialization && `${doctor.specialization}`}
                                      {doctor.license_number && ` | License: ${doctor.license_number}`}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="doctor_license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor License</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <div className="space-y-2">
                    <Popover open={medicationOpen} onOpenChange={setMedicationOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                        >
                          Add medication from stock...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search medications by name or barcode..." 
                            value={medicationSearch}
                            onValueChange={setMedicationSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No medication found in stock.</CommandEmpty>
                            <CommandGroup>
                              {medicationSearchResults.map((product) => (
                                <CommandItem
                                  key={product.id}
                                  value={product.id}
                                   onSelect={() => {
                                     const newMed = {
                                       id: product.id,
                                       product_id: product.id,
                                       name: product.name,
                                       dosage: "",
                                       dosage_form: "tablets",
                                       frequency: "3_times_daily",
                                       duration: "",
                                       unit_price: product.unit_price,
                                       quantity: 1
                                     };
                                     setSelectedMedications([...selectedMedications, newMed]);
                                     field.onChange(JSON.stringify([...selectedMedications, newMed]));
                                     setMedicationOpen(false);
                                     setMedicationSearch("");
                                   }}
                                >
                                  <div className="flex flex-col w-full">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{product.name}</span>
                                      <Badge variant="secondary" className="ml-2">
                                        Stock: {product.stock_quantity}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {product.generic_name && `Generic: ${product.generic_name}`}
                                      {product.brand && ` | Brand: ${product.brand}`}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {selectedMedications.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {selectedMedications.map((med, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                              <div className="flex-1">
                               <div className="flex items-center justify-between mb-1">
                                 <span className="font-medium text-sm">{med.name}</span>
                                 <span className="text-xs text-muted-foreground">R{med.unit_price.toFixed(2)}</span>
                               </div>
                               <div className="grid grid-cols-2 gap-2 mt-1">
                                 <div className="col-span-2 grid grid-cols-2 gap-2">
                                   <Input
                                     type="number"
                                     placeholder="Dosage Amount"
                                     value={med.dosage || ""}
                                     onChange={(e) => {
                                       const updated = [...selectedMedications];
                                       updated[index].dosage = e.target.value;
                                       setSelectedMedications(updated);
                                       field.onChange(JSON.stringify(updated));
                                     }}
                                     className="text-xs h-8"
                                     min="0.5"
                                     step="0.5"
                                   />
                                   <Select
                                     value={med.dosage_form || "tablets"}
                                     onValueChange={(value) => {
                                       const updated = [...selectedMedications];
                                       updated[index].dosage_form = value;
                                       setSelectedMedications(updated);
                                       field.onChange(JSON.stringify(updated));
                                     }}
                                   >
                                     <SelectTrigger className="text-xs h-8">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="tablets">Tablets</SelectItem>
                                       <SelectItem value="capsules">Capsules</SelectItem>
                                       <SelectItem value="teaspoons">Teaspoons</SelectItem>
                                       <SelectItem value="ml">mL</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <Select
                                   value={med.frequency || "3_times_daily"}
                                   onValueChange={(value) => {
                                     const updated = [...selectedMedications];
                                     updated[index].frequency = value;
                                     setSelectedMedications(updated);
                                     field.onChange(JSON.stringify(updated));
                                   }}
                                 >
                                   <SelectTrigger className="text-xs h-8">
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="once_daily">Once daily</SelectItem>
                                     <SelectItem value="twice_daily">Twice daily</SelectItem>
                                     <SelectItem value="3_times_daily">3 times a day</SelectItem>
                                     <SelectItem value="4_times_daily">4 times a day</SelectItem>
                                     <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
                                     <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
                                     <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
                                     <SelectItem value="at_bedtime">At bedtime</SelectItem>
                                     <SelectItem value="as_needed">As needed</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <Input
                                   placeholder="Duration (e.g., 7 days)"
                                   value={med.duration || ""}
                                   onChange={(e) => {
                                     const updated = [...selectedMedications];
                                     updated[index].duration = e.target.value;
                                     setSelectedMedications(updated);
                                     field.onChange(JSON.stringify(updated));
                                   }}
                                   className="text-xs h-8"
                                 />
                                 <Input
                                   type="number"
                                   placeholder="Total Units"
                                   value={med.quantity || 1}
                                   onChange={(e) => {
                                     const updated = [...selectedMedications];
                                     updated[index].quantity = parseInt(e.target.value) || 1;
                                     setSelectedMedications(updated);
                                     field.onChange(JSON.stringify(updated));
                                   }}
                                   className="text-xs h-8"
                                   min="1"
                                 />
                               </div>
                             </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const updated = selectedMedications.filter((_, i) => i !== index);
                                setSelectedMedications(updated);
                                field.onChange(JSON.stringify(updated));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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