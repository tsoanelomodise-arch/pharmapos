import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, User, FileText, AlertTriangle, CheckCircle, Edit2 } from "lucide-react";
import { usePendingPrescriptions, usePrescriptions, useRecentPatients, useProcessPrescription } from "@/hooks/usePrescriptions";
import { useCustomerSearch } from "@/hooks/useCustomers";
import { useNavigate } from "react-router-dom";
import { PrescriptionForm } from "@/components/PrescriptionForm";
import { CustomerForm } from "@/components/CustomerForm";
import { MedicineLabelDialog } from "@/components/MedicineLabelDialog";

const Dispensing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const navigate = useNavigate();
  
  const { data: pendingPrescriptions = [], isLoading } = usePendingPrescriptions();
  const { data: allPrescriptions = [] } = usePrescriptions();
  const { data: patientResults = [] } = useCustomerSearch(patientSearch);
  const { data: recentPatients = [] } = useRecentPatients();
  const processPrescrition = useProcessPrescription();

  const handleProcessPrescription = (prescriptionId: string) => {
    processPrescrition.mutate(prescriptionId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pharmacy Dispensing</h1>
          <Badge variant="secondary">Loading...</Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pharmacy Dispensing</h1>
          <PrescriptionForm />
      </div>

      <Tabs defaultValue="prescriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="interactions">Drug Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="prescriptions" className="space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Prescriptions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by patient name, prescription number, or doctor..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" className="mt-6">
                  Advanced Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Prescription Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPrescriptions.map((prescription: any) => (
                  <div key={prescription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{prescription.customers?.name || 'Unknown Patient'}</h3>
                        <p className="text-sm text-muted-foreground">Phone: {prescription.customers?.phone || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          Dr. {prescription.doctor_name} - Rx #{prescription.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={prescription.status === 'pending' ? 'secondary' : 'default'}>
                        {prescription.status}
                      </Badge>
                      <MedicineLabelDialog prescription={prescription} />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProcessPrescription(prescription.id)}
                        disabled={processPrescrition.isPending}
                      >
                        {processPrescrition.isPending ? 'Processing...' : 'Process'}
                      </Button>
                      <PrescriptionForm prescription={prescription} />
                    </div>
                  </div>
                ))}
                
                {pendingPrescriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending prescriptions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="patient-search">Find Patient</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="patient-search"
                          placeholder="Search by name, phone, or email..."
                          className="pl-10"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                        />
                      </div>
                    </div>
                    <CustomerForm />
                  </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Recent Patients</h3>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                  <div className="space-y-3">
                    {patientResults.length > 0 ? (
                      patientResults.map((patient) => (
                        <div key={patient.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="h-6 w-6" />
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.phone ? `Phone: ${patient.phone}` : 'No phone'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {patient.current_balance > 0 ? `Owes R${patient.current_balance.toFixed(2)}` : 'No Balance'}
                            </Badge>
                            <Button size="sm" variant="outline">View</Button>
                          </div>
                        </div>
                      ))
                    ) : recentPatients.length > 0 ? (
                      recentPatients.map((patient) => (
                        <div key={patient.id} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="h-6 w-6" />
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.phone ? `Phone: ${patient.phone}` : 'No phone'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {patient.current_balance > 0 ? `Owes R${patient.current_balance.toFixed(2)}` : 'No Balance'}
                            </Badge>
                            <Button size="sm" variant="outline">View</Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="h-6 w-6" />
                          <div>
                            <p className="font-medium">No recent patients</p>
                            <p className="text-sm text-muted-foreground">Use search above to find patients</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Drug Interaction Checker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Active Warnings</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700">
                      <strong>Patient: Sarah Johnson</strong> - Warfarin + Aspirin interaction detected
                    </p>
                    <p className="text-sm text-yellow-600">
                      Risk: Increased bleeding tendency. Consider dose adjustment or alternative therapy.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-800">All Clear</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    <strong>Patient: Michael Brown</strong> - No drug interactions detected
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <h4 className="font-medium">Interaction History</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div 
                        className="flex justify-between cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                        onClick={() => navigate('/reports')}
                      >
                        <span>Total interactions checked today:</span>
                        <Badge variant="secondary">{allPrescriptions.length}</Badge>
                      </div>
                      <div 
                        className="flex justify-between cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                        onClick={() => navigate('/reports')}
                      >
                        <span>Warnings issued:</span>
                        <Badge variant="destructive">3</Badge>
                      </div>
                      <div 
                        className="flex justify-between cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                        onClick={() => navigate('/reports')}
                      >
                        <span>Contraindications prevented:</span>
                        <Badge variant="outline">1</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dispensing;