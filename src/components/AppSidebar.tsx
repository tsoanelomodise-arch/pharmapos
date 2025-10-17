import { Pill, ShoppingCart, Package, BarChart3, Users, Receipt, Settings, BookOpen } from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserModules, AppModule } from "@/hooks/useModulePermissions";

const navigationItems: { 
  title: string; 
  url: string; 
  icon: any; 
  module: AppModule 
}[] = [
  { title: "Dashboard", url: "/", icon: BarChart3, module: "dashboard" },
  { title: "Dispensing", url: "/dispensing", icon: Pill, module: "dispensing" },
  { title: "POS & Sales", url: "/pos", icon: ShoppingCart, module: "pos" },
  { title: "Debtors", url: "/debtors", icon: Users, module: "debtors" },
  { title: "Stock Control", url: "/stock", icon: Package, module: "stock" },
  { title: "Reports", url: "/reports", icon: Receipt, module: "reports" },
  { title: "Admin", url: "/management", icon: Settings, module: "management" },
  { title: "Help", url: "/help", icon: BookOpen, module: "help" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { data: userModules = [] } = useUserModules();

  // Filter navigation items based on user's module permissions
  const accessibleItems = navigationItems.filter(item => 
    userModules.includes(item.module)
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {state !== "collapsed" && (
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">PharmaPos</span>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}