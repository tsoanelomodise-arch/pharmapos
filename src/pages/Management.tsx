import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, UserPlus, Stethoscope, Users, Shield } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useDoctors, useDeleteDoctor } from "@/hooks/useDoctors";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { CustomerForm } from "@/components/CustomerForm";
import { DoctorForm } from "@/components/DoctorForm";
import { UserRoleDialog } from "@/components/UserRoleDialog";
import { ModulePermissionsManager } from "@/components/ModulePermissionsManager";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserModules } from "@/hooks/useModulePermissions";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Management() {
  const { data: role } = useUserRole();
  const { data: userModules = [] } = useUserModules();
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: doctors, isLoading: loadingDoctors } = useDoctors();
  const { data: users, isLoading: loadingUsers } = useUsers();
  const deleteDoctor = useDeleteDoctor();
  const deleteUser = useDeleteUser();

  const isAdmin = role && ['admin', 'manager', 'owner'].includes(role);
  const isOwner = role === 'owner';
  const canAccessPatients = userModules.includes('patients');
  const canAccessDoctors = userModules.includes('doctors');

  const filteredPatients = customers?.filter(customer =>
    customer.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(patientSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredDoctors = doctors?.filter(doctor =>
    doctor.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.license_number?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    doctor.specialization?.toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Management</h1>
        <p className="text-muted-foreground">
          {canAccessPatients || canAccessDoctors 
            ? "Manage patients and doctors" 
            : "User and module management"}
        </p>
      </div>

      <Tabs defaultValue={canAccessPatients ? "patients" : isOwner ? "users" : "patients"} className="w-full">
        <TabsList className={`grid w-full ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {canAccessPatients && (
            <TabsTrigger value="patients">
              <UserPlus className="h-4 w-4 mr-2" />
              Patients
            </TabsTrigger>
          )}
          {canAccessDoctors && (
            <TabsTrigger value="doctors">
              <Stethoscope className="h-4 w-4 mr-2" />
              Doctors
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Module Permissions
            </TabsTrigger>
          )}
        </TabsList>

        {canAccessPatients && (
          <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Patients Management</CardTitle>
                  <CardDescription>View and manage patient records</CardDescription>
                </div>
                <CustomerForm />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingCustomers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredPatients?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No patients found</TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients?.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.phone || "-"}</TableCell>
                          <TableCell>{customer.email || "-"}</TableCell>
                          <TableCell>R{customer.current_balance?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>R{customer.credit_limit?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell className="text-right">
                            <CustomerForm customer={customer} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {canAccessDoctors && (
          <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Doctors Management</CardTitle>
                  <CardDescription>View and manage doctor records</CardDescription>
                </div>
                <DoctorForm />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>License Number</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDoctors ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredDoctors?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No doctors found</TableCell>
                      </TableRow>
                    ) : (
                      filteredDoctors?.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell>{doctor.license_number || "-"}</TableCell>
                          <TableCell>{doctor.specialization || "-"}</TableCell>
                          <TableCell>{doctor.phone || "-"}</TableCell>
                          <TableCell>{doctor.email || "-"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <DoctorForm doctor={doctor} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {doctor.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDoctor.mutate(doctor.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="users" className="space-y-4">
          {!isOwner ? (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  Only owners can manage user accounts and roles.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage user roles and permissions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUsers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role ? (
                              <Badge variant={
                                user.role === 'owner' ? 'default' :
                                user.role === 'admin' || user.role === 'manager' ? 'secondary' :
                                'outline'
                              }>
                                {user.role}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No role</span>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(user.created_at), 'PP')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <UserRoleDialog user={user} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.full_name || user.email}? This will permanently remove their account and all associated data. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          )}
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Module Permissions</CardTitle>
                <CardDescription>
                  Control which modules each user can access. Owners always have full access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModulePermissionsManager />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
