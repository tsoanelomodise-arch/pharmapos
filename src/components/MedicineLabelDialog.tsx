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

    const labelContent = document.getElementById('medicine-label-content')?.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medicine Label</title>
          <style>
            @media print {
              @page {
                size: 4in 3in;
                margin: 0.25in;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            
            .label-container {
              width: 4in;
              height: 3in;
              border: 2px solid #000;
              border-radius: 12px;
              padding: 0.4in;
              box-sizing: border-box;
              page-break-after: always;
            }
            
            .label-header {
              display: grid;
              grid-template-columns: 60% 40%;
              gap: 0.2in;
              margin-bottom: 0.2in;
            }
            
            .label-field {
              border-bottom: 2px solid #000;
              padding-bottom: 0.05in;
              margin-bottom: 0.05in;
            }
            
            .label-field-label {
              font-size: 11pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .label-field-value {
              font-size: 10pt;
              margin-top: 0.05in;
            }
            
            .medication-section {
              margin-bottom: 0.2in;
            }
            
            .medication-section .label-field-label {
              font-size: 11pt;
            }
            
            .dosage-grid {
              display: grid;
              grid-template-columns: 50% 50%;
              gap: 0.15in;
              margin-top: 0.1in;
            }
            
            .dosage-item {
              display: flex;
              align-items: center;
              font-size: 9pt;
            }
            
            .dosage-line {
              border-bottom: 1.5px solid #000;
              width: 0.4in;
              display: inline-block;
              margin-right: 0.05in;
            }
            
            .doctor-section {
              margin-top: 0.15in;
            }
            
            .doctor-field {
              display: flex;
              align-items: center;
              font-size: 10pt;
            }
            
            .doctor-line {
              flex: 1;
              border-bottom: 1.5px solid #000;
              margin-left: 0.05in;
            }
          </style>
        </head>
        <body>
          ${labelContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
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

  const firstMedication = medications[0];
  
  // Extract dosage form and frequency from medication data
  const getDosageForm = () => {
    const dosage = firstMedication?.dosage?.toLowerCase() || '';
    if (dosage.includes('tablet')) return 'Tablets';
    if (dosage.includes('capsule')) return 'Capsules';
    if (dosage.includes('teaspoon') || dosage.includes('syrup')) return 'Teaspoons';
    return 'Tablets';
  };

  const getFrequency = () => {
    const frequency = firstMedication?.frequency?.toLowerCase() || '';
    if (frequency.includes('hour')) return 'Hours';
    if (frequency.includes('bedtime')) return 'At bedtime';
    if (frequency.includes('daily') || frequency.includes('day')) return 'Times a day';
    if (frequency.includes('needed')) return 'As needed';
    return 'Times a day';
  };

  const extractQuantity = () => {
    const dosage = firstMedication?.dosage || '';
    const match = dosage.match(/(\d+)/);
    return match ? match[1] : '';
  };

  const extractFrequencyNumber = () => {
    const frequency = firstMedication?.frequency?.toLowerCase() || '';
    const match = frequency.match(/(\d+)/);
    return match ? match[1] : '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Medicine Label</DialogTitle>
        </DialogHeader>

        <div id="medicine-label-content">
          <div className="label-container border-2 border-foreground rounded-xl p-8">
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
                <div className="label-field-value">{firstMedication?.name || 'N/A'}</div>
              </div>
            </div>

            <div className="dosage-grid">
              <div className="space-y-2">
                <div className="dosage-item">
                  <span className="dosage-line">{getDosageForm() === 'Tablets' ? extractQuantity() : ''}</span>
                  <span className="ml-2">Tablets</span>
                </div>
                <div className="dosage-item">
                  <span className="dosage-line">{getDosageForm() === 'Capsules' ? extractQuantity() : ''}</span>
                  <span className="ml-2">Capsules</span>
                </div>
                <div className="dosage-item">
                  <span className="dosage-line">{getDosageForm() === 'Teaspoons' ? extractQuantity() : ''}</span>
                  <span className="ml-2">Teaspoons</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="dosage-item">
                  <span>Every</span>
                  <span className="dosage-line mx-2">{getFrequency() === 'Hours' ? extractFrequencyNumber() : ''}</span>
                  <span>Hours</span>
                </div>
                <div className="dosage-item">
                  <span className="dosage-line">{getFrequency() === 'At bedtime' ? '✓' : ''}</span>
                  <span className="ml-2">At bedtime</span>
                </div>
                <div className="dosage-item">
                  <span className="dosage-line">{getFrequency() === 'Times a day' ? extractFrequencyNumber() : ''}</span>
                  <span className="ml-2">Times a day</span>
                </div>
                <div className="dosage-item">
                  <span className="dosage-line">{getFrequency() === 'As needed' ? '✓' : ''}</span>
                  <span className="ml-2">As needed</span>
                </div>
              </div>
            </div>

            <div className="doctor-section">
              <div className="doctor-field">
                <span className="font-bold">Dr.</span>
                <span className="doctor-line">{prescription.doctor_name}</span>
              </div>
            </div>

            {prescription.status === 'dispensed' && (
              <div className="doctor-section" style={{ marginTop: '0.1in', fontSize: '9pt' }}>
                <div className="doctor-field">
                  <span className="font-bold">Dispensed By:</span>
                  <span className="doctor-line">{dispensedBy}</span>
                </div>
              </div>
            )}
          </div>
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