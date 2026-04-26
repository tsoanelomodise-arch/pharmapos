import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Prescription } from "@/hooks/usePrescriptions";

interface MedicineLabelDialogProps {
  prescription: any;
}

export function MedicineLabelDialog({ prescription }: MedicineLabelDialogProps) {
  const [open, setOpen] = useState(false);
  const [dispensedBy, setDispensedBy] = useState<string>("N/A");

  useEffect(() => {
    const fetchDispensedBy = async () => {
      if (prescription.dispensed_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', prescription.dispensed_by)
          .single();
        
        if (profile?.full_name) {
          setDispensedBy(profile.full_name);
        } else {
          // Fallback: Get current user if they're the one who dispensed it
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id === prescription.dispensed_by && user?.email) {
            // Extract name from email (before @)
            const emailName = user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setDispensedBy(emailName);
          }
        }
      }
    };
    
    if (open) {
      fetchDispensedBy();
    }
  }, [open, prescription.dispensed_by]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelContent = document.getElementById('medicine-label-content');
    if (!labelContent) return;

    // Build the print document via DOM APIs and clone the rendered tree
    // instead of serialising/re-parsing HTML strings. This avoids XSS risk
    // if dynamic, unescaped content is ever added to the labels.
    const doc = printWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html>');
    doc.close();

    const titleEl = doc.createElement('title');
    titleEl.textContent = 'Medicine Labels';
    doc.head.appendChild(titleEl);

    const styleEl = doc.createElement('style');
    styleEl.textContent = `
      @media print {
        @page { size: 4in 3in; margin: 0.15in; }
        body { margin: 0; padding: 0; }
        .label-container { page-break-inside: avoid; page-break-after: always; }
        .label-container:last-child { page-break-after: avoid; }
      }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
      .label-container {
        width: 4in; height: 3in; border: 2px solid #000; border-radius: 8px;
        padding: 0.25in; display: flex; flex-direction: column;
        justify-content: space-between; margin-bottom: 0.2in;
      }
      .label-header { display: grid; grid-template-columns: 60% 40%; gap: 0.1in; margin-bottom: 0.1in; }
      .label-field { border-bottom: 1.5px solid #000; padding-bottom: 0.02in; margin-bottom: 0.02in; }
      .label-field-label { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.1; }
      .label-field-value { font-size: 9pt; margin-top: 0.02in; line-height: 1.1; }
      .medication-section { margin-bottom: 0.1in; }
      .medication-section .label-field-label { font-size: 9pt; }
      .dosage-grid { display: grid; grid-template-columns: 48% 48%; gap: 0.08in; margin-top: 0.08in; margin-bottom: 0.08in; }
      .dosage-item { display: flex; align-items: center; font-size: 8pt; line-height: 1.2; margin-bottom: 0.03in; }
      .dosage-line { border-bottom: 1.5px solid #000; width: 0.35in; display: inline-block; margin-right: 0.03in; }
      .doctor-section { margin-top: 0.08in; }
      .doctor-field { display: flex; align-items: center; font-size: 8pt; line-height: 1.1; }
      .doctor-line { flex: 1; border-bottom: 1.5px solid #000; margin-left: 0.03in; }
    `;
    doc.head.appendChild(styleEl);

    const clone = labelContent.cloneNode(true);
    doc.body.appendChild(doc.importNode(clone, true));

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Parse medications
  const medications = Array.isArray(prescription.medications) 
    ? prescription.medications 
    : typeof prescription.medications === 'string'
    ? [{ name: prescription.medications, dosage: '', frequency: '' }]
    : [prescription.medications];
  
  // Extract dosage form and frequency from medication data
  const getDosageAmount = (medication: any) => medication?.dosage || '';
  
  const getDosageForm = (medication: any) => {
    const form = medication?.dosage_form?.toLowerCase() || '';
    if (form === 'tablets') return 'Tablets';
    if (form === 'capsules') return 'Capsules';
    if (form === 'teaspoons') return 'Teaspoons';
    if (form === 'ml') return 'mL';
    return 'Tablets';
  };

  const getFrequencyDisplay = (medication: any) => {
    const freq = medication?.frequency || '';
    const frequencyMap: Record<string, { type: string; value: string }> = {
      'once_daily': { type: 'Times a day', value: '1' },
      'twice_daily': { type: 'Times a day', value: '2' },
      '3_times_daily': { type: 'Times a day', value: '3' },
      '4_times_daily': { type: 'Times a day', value: '4' },
      'every_4_hours': { type: 'Hours', value: '4' },
      'every_6_hours': { type: 'Hours', value: '6' },
      'every_8_hours': { type: 'Hours', value: '8' },
      'at_bedtime': { type: 'At bedtime', value: '✓' },
      'as_needed': { type: 'As needed', value: '✓' },
    };
    return frequencyMap[freq] || { type: 'Times a day', value: '3' };
  };

  const getTotalUnits = (medication: any) => medication?.quantity || '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Medicine Labels ({medications.length} {medications.length === 1 ? 'label' : 'labels'})</DialogTitle>
        </DialogHeader>

        <div id="medicine-label-content" className="space-y-4">
          {medications.map((medication, index) => (
            <div key={index} className="label-container border-2 border-foreground rounded-xl p-8">
              <div className="label-header">
                <div>
                  <div className="label-field">
                    <div className="label-field-label">PATIENT</div>
                    <div className="label-field-value">{prescription.customers?.name || 'N/A'}</div>
                  </div>
                </div>
                <div>
                  <div className="label-field">
                    <div className="label-field-label">DATE</div>
                    <div className="label-field-value">
                      {new Date(prescription.prescription_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="medication-section">
                <div className="label-field">
                  <div className="label-field-label">MEDICATION</div>
                  <div className="label-field-value">{medication?.name || 'N/A'}</div>
                </div>
              </div>

              <div className="dosage-grid">
                <div className="space-y-2">
                  <div className="dosage-item">
                    <span className="dosage-line">{getDosageAmount(medication)}</span>
                    <span className="ml-2">{getDosageForm(medication)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {getFrequencyDisplay(medication).type === 'Hours' && (
                    <div className="dosage-item">
                      <span>Every</span>
                      <span className="dosage-line mx-2">{getFrequencyDisplay(medication).value}</span>
                      <span>Hours</span>
                    </div>
                  )}
                  {getFrequencyDisplay(medication).type === 'At bedtime' && (
                    <div className="dosage-item">
                      <span className="dosage-line">✓</span>
                      <span className="ml-2">At bedtime</span>
                    </div>
                  )}
                  {getFrequencyDisplay(medication).type === 'Times a day' && (
                    <div className="dosage-item">
                      <span className="dosage-line">{getFrequencyDisplay(medication).value}</span>
                      <span className="ml-2">Times a day</span>
                    </div>
                  )}
                  {getFrequencyDisplay(medication).type === 'As needed' && (
                    <div className="dosage-item">
                      <span className="dosage-line">✓</span>
                      <span className="ml-2">As needed</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="medication-section" style={{ marginBottom: '0.08in' }}>
                  <div className="label-field">
                    <div className="label-field-label">TOTAL DISPENSED</div>
                    <div className="label-field-value">{getTotalUnits(medication)} {getDosageForm(medication)}</div>
                  </div>
                </div>

                <div className="doctor-section">
                  <div className="doctor-field">
                    <span className="font-bold">Dr.</span>
                    <span className="doctor-line">{prescription.doctor_name}</span>
                  </div>
                </div>

                {prescription.status === 'dispensed' && (
                  <div className="doctor-section" style={{ marginTop: '0.06in' }}>
                    <div className="doctor-field">
                      <span className="font-bold">Dispensed:</span>
                      <span className="doctor-line">{dispensedBy}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}