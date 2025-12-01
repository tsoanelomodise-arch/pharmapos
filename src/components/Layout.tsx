import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { memo, useState } from "react";
import { ProfileSettingsDialog } from "@/components/ProfileSettingsDialog";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";

interface LayoutProps {
  children: React.ReactNode;
}

const roleDisplayNames: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Cashier',
  pharmacist: 'Pharmacist',
};

export const Layout = memo(function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: role } = useUserRole();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed Out',
      description: 'You have been successfully signed out.',
    });
  };

  const displayName = profile?.full_name || user?.email;
  const roleDisplay = role ? roleDisplayNames[role] || role : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 text-xl font-semibold">PharmaPOS</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {roleDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    {roleDisplay}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {displayName}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
      <ProfileSettingsDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </SidebarProvider>
  );
});