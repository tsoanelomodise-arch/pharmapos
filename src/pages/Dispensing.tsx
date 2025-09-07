import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, User, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const Dispensing = () => {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pharmacy Dispensing</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Prescription
        </Button>
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Sarah Johnson</h3>
                      <p className="text-sm text-muted-foreground">ID: 8501234567890</p>
                      <p className="text-sm text-muted-foreground">Dr. Smith - Rx #12345</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Waiting</Badge>
                    <Badge variant="outline">Medical Aid</Badge>
                    <Button size="sm">Process</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Michael Brown</h3>
                      <p className="text-sm text-muted-foreground">ID: 7802156789012</p>
                      <p className="text-sm text-muted-foreground">Dr. Jones - Rx #12346</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default">In Progress</Badge>
                    <Badge variant="outline">Cash</Badge>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <Button size="sm" variant="outline">Continue</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Lisa Davis</h3>
                      <p className="text-sm text-muted-foreground">ID: 9203098765432</p>
                      <p className="text-sm text-muted-foreground">Dr. Wilson - Rx #12347</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
                    <Badge variant="outline">Discovery</Badge>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Button size="sm">Collect</Button>
                  </div>
                </div>
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
                        placeholder="Search by name, ID number, or medical aid number..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Patient
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Recent Patients</h3>
                    <Button variant="outline" size="sm">View All</Button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6" />
                        <div>
                          <p className="font-medium">Sarah Johnson</p>
                          <p className="text-sm text-muted-foreground">Last visit: Today</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Discovery</Badge>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6" />
                        <div>
                          <p className="font-medium">Michael Brown</p>
                          <p className="text-sm text-muted-foreground">Last visit: Yesterday</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Cash Patient</Badge>
                        <Button size="sm" variant="outline">View</Button>
                      </div>
                    </div>
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
                      <div className="flex justify-between">
                        <span>Total interactions checked today:</span>
                        <Badge variant="secondary">45</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Warnings issued:</span>
                        <Badge variant="destructive">3</Badge>
                      </div>
                      <div className="flex justify-between">
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