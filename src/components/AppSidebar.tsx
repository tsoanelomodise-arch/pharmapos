import { Pill, ShoppingCart, Package, BarChart3, Users, Receipt, Settings, BookOpen, Truck, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import pharmaposLogo from "@/assets/pharmapos-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserModules, AppModule } from "@/hooks/useModulePermissions";
import { useCanAccessFinancialData } from "@/hooks/useUserRole";

interface SubItem {
  title: string;
  url: string;
  icon: any;
}

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  module: AppModule;
  subItems?: SubItem[];
}

const navigationItems: NavigationItem[] = [
  { title: "Dashboard", url: "/", icon: BarChart3, module: "dashboard" },
  { title: "Dispensing", url: "/dispensing", icon: Pill, module: "dispensing" },
  { title: "POS & Sales", url: "/pos", icon: ShoppingCart, module: "pos" },
  { title: "Debtors", url: "/debtors", icon: Users, module: "debtors" },
  { 
    title: "Stock Control", 
    url: "/stock", 
    icon: Package, 
    module: "stock",
    subItems: [
      { title: "Suppliers", url: "/stock?tab=suppliers", icon: Truck },
    ]
  },
  { title: "Reports", url: "/reports", icon: Receipt, module: "reports" },
  { title: "Admin", url: "/management", icon: Settings, module: "management" },
  { title: "Help", url: "/help", icon: BookOpen, module: "help" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { data: userModules = [] } = useUserModules();
  const canAccessFinancialData = useCanAccessFinancialData();
  const location = useLocation();

  // Filter navigation items based on user's module permissions
  const accessibleItems = navigationItems.filter(item => 
    userModules.includes(item.module)
  );

  const isStockActive = location.pathname === "/stock";
  const isSuppliersActive = location.pathname === "/stock" && location.search.includes("tab=suppliers");
  const isInventoryActive = isStockActive && !isSuppliersActive;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="block">
          {state !== "collapsed" ? (
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <img src={pharmaposLogo} alt="PharmaPos" className="h-10 w-10" />
              <span className="font-bold text-xl text-sidebar-foreground">PHARMAPOS</span>
            </div>
          ) : (
            <div className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <img src={pharmaposLogo} alt="PharmaPos" className="h-8 w-8" />
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleItems.map((item) => {
                // Special handling for items with sub-items
                if (item.subItems && item.subItems.length > 0 && canAccessFinancialData) {
                  return (
                    <Collapsible key={item.title} defaultOpen={isStockActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          <SidebarMenuButton asChild className="flex-1">
                            <NavLink
                              to={item.url}
                              className={
                                isStockActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              {state !== "collapsed" && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                          {state !== "collapsed" && (
                            <CollapsibleTrigger asChild>
                              <button className="p-2 hover:bg-sidebar-accent/50 rounded-md">
                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to="/stock"
                                  className={
                                    isInventoryActive
                                      ? "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium"
                                      : "hover:bg-sidebar-accent/50"
                                  }
                                >
                                  <Package className="h-4 w-4" />
                                  {state !== "collapsed" && <span>Inventory</span>}
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={subItem.url}
                                    className={
                                      isSuppliersActive
                                        ? "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium"
                                        : "hover:bg-sidebar-accent/50"
                                    }
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    {state !== "collapsed" && <span>{subItem.title}</span>}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Regular menu items without sub-items
                return (
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
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}