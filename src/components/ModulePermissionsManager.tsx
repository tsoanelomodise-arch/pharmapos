import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Save } from "lucide-react";
import { useAllUserPermissions, useUpdateModulePermissions, AppModule } from "@/hooks/useModulePermissions";

const ALL_MODULES: { value: AppModule; label: string; description: string }[] = [
  { value: 'dashboard', label: 'Dashboard', description: 'View sales metrics and analytics' },
  { value: 'dispensing', label: 'Dispensing', description: 'Manage prescriptions' },
  { value: 'pos', label: 'Point of Sale', description: 'Process sales transactions' },
  { value: 'debtors', label: 'Debtors', description: 'Manage customer accounts' },
  { value: 'stock', label: 'Stock', description: 'Manage inventory' },
  { value: 'orders', label: 'Orders', description: 'Manage purchase orders and supplier ordering' },
  { value: 'reports', label: 'Reports', description: 'View and generate reports' },
  { value: 'management', label: 'Management', description: 'Manage users and settings' },
  { value: 'patients', label: 'Patient Management', description: 'View and manage patient records' },
  { value: 'doctors', label: 'Doctor Management', description: 'View and manage doctor records' },
  { value: 'help', label: 'Help', description: 'Access help documentation' },
];

export function ModulePermissionsManager() {
  const { data: users, isLoading } = useAllUserPermissions();
  const updatePermissions = useUpdateModulePermissions();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<AppModule[]>([]);

  const handleEditUser = (userId: string, currentPermissions: AppModule[]) => {
    setEditingUser(userId);
    setSelectedModules(currentPermissions);
  };

  const handleToggleModule = (module: AppModule) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const handleSave = (userId: string) => {
    updatePermissions.mutate(
      { userId, modules: selectedModules },
      {
        onSuccess: () => {
          setEditingUser(null);
          setSelectedModules([]);
        }
      }
    );
  };

  const handleCancel = () => {
    setEditingUser(null);
    setSelectedModules([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <Shield className="h-5 w-5 text-primary" />
        <div>
          Control which modules each user can access. Owners always have access to all modules.
        </div>
      </div>

      {users?.map((user) => (
        <Card key={user.id} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={user.role === 'owner' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {user.role}
                  </Badge>
                  {user.role === 'owner' && (
                    <span className="text-xs">• Full Access (Cannot be modified)</span>
                  )}
                </CardDescription>
              </div>
              {user.role !== 'owner' && (
                <div>
                  {editingUser === user.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(user.id)}
                        disabled={updatePermissions.isPending}
                      >
                        {updatePermissions.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={updatePermissions.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user.id, user.permissions)}
                    >
                      Edit Permissions
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          
          {user.role !== 'owner' && (
            <CardContent className="pt-6">
              {editingUser === user.id ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {ALL_MODULES.map((module) => (
                    <div
                      key={module.value}
                      className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`${user.id}-${module.value}`}
                        checked={selectedModules.includes(module.value)}
                        onCheckedChange={() => handleToggleModule(module.value)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`${user.id}-${module.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {module.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.length > 0 ? (
                    user.permissions.map((module) => {
                      const moduleInfo = ALL_MODULES.find(m => m.value === module);
                      return (
                        <Badge key={module} variant="outline" className="capitalize">
                          {moduleInfo?.label || module}
                        </Badge>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No module access granted</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}