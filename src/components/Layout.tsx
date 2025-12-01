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
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between p-3 md:p-4 border-b gap-2">
            <div className="flex items-center min-w-0">
              <SidebarTrigger />
              <h1 className="ml-2 md:ml-4 text-lg md:text-xl font-semibold truncate">PharmaPOS</h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                {roleDisplay && (
                  <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                    {roleDisplay}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileOpen(true)}
                  className="text-muted-foreground hover:text-foreground px-2 md:px-3"
                >
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline truncate max-w-[120px]">{displayName}</span>
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="px-2 md:px-3">
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
          <div className="p-3 md:p-6">{children}</div>
        </main>
      </div>
      <ProfileSettingsDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </SidebarProvider>
  );
});