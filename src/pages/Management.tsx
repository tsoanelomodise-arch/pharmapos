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
import { Trash2, Search, UserPlus, Stethoscope, Users, Shield, KeyRound } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/hooks/useCustomers";
import { useDoctors, useDeleteDoctor } from "@/hooks/useDoctors";
import { useUsers, useDeleteUser, useResetUserPassword, useSetUserPassword, useUpdateUserProfile, useUpdateUserEmail } from "@/hooks/useUsers";
import { toast } from "sonner";
import { CustomerForm } from "@/components/CustomerForm";
import { DoctorForm } from "@/components/DoctorForm";
import { UserForm } from "@/components/UserForm";
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
  const deleteCustomer = useDeleteCustomer();
  const deleteDoctor = useDeleteDoctor();
  const deleteUser = useDeleteUser();
  const resetUserPassword = useResetUserPassword();
  const setUserPassword = useSetUserPassword();
  const updateUserProfile = useUpdateUserProfile();
  const updateUserEmail = useUpdateUserEmail();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");

  /**
   * SECURITY MODEL:
   * - These client-side role checks control UI visibility ONLY (UX optimization)
   * - Actual authorization is enforced by database RLS policies
   * - NEVER rely on these checks for security decisions
   * - All database mutations are validated server-side via RLS
   */
  const isAdmin = role && ['admin', 'manager', 'owner'].includes(role);
  const isOwner = role === 'owner';
  const canManageUsers = role && ['admin', 'owner'].includes(role);
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
      {/* Manual Password Change Dialog */}
      <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Update user details. Leave password blank to keep current.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password (optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Min. 6 characters if changing</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setNewPassword("");
              setNewUsername("");
              setNewEmail("");
              setSelectedUserForPassword(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!selectedUserForPassword) return;
                
                const hasUsernameChange = newUsername.trim() && newUsername.trim() !== selectedUserForPassword.fullName;
                const hasEmailChange = newEmail.trim() && newEmail.trim() !== selectedUserForPassword.email;
                const hasPasswordChange = newPassword.length >= 6;
                
                if (!hasUsernameChange && !hasEmailChange && !hasPasswordChange) {
                  toast.error("Please enter a new value to update");
                  return;
                }
                
                if (newPassword && newPassword.length < 6) {
                  toast.error("Password must be at least 6 characters");
                  return;
                }

                // Validate email format
                if (hasEmailChange) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(newEmail.trim())) {
                    toast.error("Please enter a valid email address");
                    return;
                  }
                }

                try {
                  if (hasUsernameChange) {
                    await updateUserProfile.mutateAsync({ 
                      userId: selectedUserForPassword.id, 
                      fullName: newUsername.trim() 
                    });
                  }

                  if (hasEmailChange) {
                    await updateUserEmail.mutateAsync({
                      userId: selectedUserForPassword.id,
                      newEmail: newEmail.trim()
                    });
                  }
                  
                  if (hasPasswordChange) {
                    await setUserPassword.mutateAsync({ 
                      userId: selectedUserForPassword.id, 
                      newPassword 
                    });
                  }
                  
                  setPasswordDialogOpen(false);
                  setNewPassword("");
                  setNewUsername("");
                  setNewEmail("");
                  setSelectedUserForPassword(null);
                } catch (error) {
                  // Error already handled by mutation
                }
              }}
              disabled={updateUserProfile.isPending || setUserPassword.isPending || updateUserEmail.isPending}
            >
              {(updateUserProfile.isPending || setUserPassword.isPending || updateUserEmail.isPending) ? 'Saving...' : 'Save Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {canAccessPatients || canAccessDoctors 
            ? "Manage patients and doctors" 
            : "User and module management"}
        </p>
      </div>

      <Tabs defaultValue={canAccessPatients ? "patients" : canManageUsers ? "users" : "patients"} className="w-full">
        <TabsList className={`flex w-full overflow-x-auto ${isOwner ? 'md:grid md:grid-cols-4' : canManageUsers ? 'md:grid md:grid-cols-3' : 'md:grid md:grid-cols-2'}`}>
          {canAccessPatients && (
            <TabsTrigger value="patients" className="flex-1 md:flex-initial text-xs sm:text-sm">
              <UserPlus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Patients</span>
              <span className="sm:hidden">Patients</span>
            </TabsTrigger>
          )}
          {canAccessDoctors && (
            <TabsTrigger value="doctors" className="flex-1 md:flex-initial text-xs sm:text-sm">
              <Stethoscope className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Doctors</span>
              <span className="sm:hidden">Doctors</span>
            </TabsTrigger>
          )}
          {canManageUsers && (
            <TabsTrigger value="users" className="flex-1 md:flex-initial text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="permissions" className="flex-1 md:flex-initial text-xs sm:text-sm">
              <Shield className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Module Permissions</span>
              <span className="sm:hidden">Permissions</span>
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
                          <TableCell className="text-right space-x-2">
                            <CustomerForm customer={customer} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {customer.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCustomer.mutate(customer.id)}
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

        {canManageUsers && (
          <TabsContent value="users" className="space-y-4">
          {!canManageUsers ? (
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  Only admins and owners can manage user accounts and roles.
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
                  <UserForm />
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
                      <TableHead>Username</TableHead>
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
                                {user.role === 'manager' ? 'Cashier' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">No role</span>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(user.created_at), 'PP')}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <UserRoleDialog user={user} />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              title="Edit User"
                              onClick={() => {
                                setSelectedUserForPassword({ id: user.id, fullName: user.full_name || '', email: user.email });
                                setNewUsername(user.full_name || '');
                                setNewEmail(user.email);
                                setPasswordDialogOpen(true);
                                setNewPassword("");
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Reset Password via Email">
                                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset User Password</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Send a password reset email to {user.email}? They will receive an email with instructions to reset their password.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => resetUserPassword.mutate(user.email)}
                                  >
                                    Send Reset Email
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
