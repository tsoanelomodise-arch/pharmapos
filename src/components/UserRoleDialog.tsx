import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserCog } from "lucide-react";
import { useUpdateUserRole, UserWithRole } from "@/hooks/useUsers";
import type { UserRole } from "@/hooks/useUserRole";

interface UserRoleDialogProps {
  user: UserWithRole;
}

const roles = [
  { value: "pharmacist", label: "Pharmacist" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Cashier" },
  { value: "owner", label: "Owner" },
  { value: "restock", label: "Restock" },
];

export function UserRoleDialog({ user }: UserRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role || "pharmacist");
  const updateUserRole = useUpdateUserRole();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateUserRole.mutateAsync({
      userId: user.id,
      role: selectedRole,
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <UserCog className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Role Permissions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pharmacist:</strong> Basic access to dispensing and POS</li>
                <li><strong>Admin:</strong> Full access to management features</li>
                <li><strong>Cashier:</strong> Admin access plus financial data</li>
                <li><strong>Owner:</strong> Full system access including user management</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateUserRole.isPending}>
              {updateUserRole.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
