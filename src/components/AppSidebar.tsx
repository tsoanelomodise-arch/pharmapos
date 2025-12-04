import { Pill, ShoppingCart, Package, BarChart3, Users, Receipt, Settings, BookOpen, Truck, ChevronDown, ClipboardList, UserPlus, Stethoscope } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import pharmaposLogo from "@/assets/pharmapos-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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

interface SubItem {
  title: string;
  url: string;
  icon: any;
  module?: AppModule;
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
  { 
    title: "POS & Sales", 
    url: "/pos", 
    icon: ShoppingCart, 
    module: "pos",
    subItems: [
      { title: "Point of Sale", url: "/pos", icon: ShoppingCart },
      { title: "Transactions", url: "/pos/transactions", icon: Receipt },
    ]
  },
  { title: "Debtors", url: "/debtors", icon: Users, module: "debtors" },
  { 
    title: "Customers", 
    url: "/patients", 
    icon: Users, 
    module: "patients",
    subItems: [
      { title: "Patients", url: "/patients", icon: UserPlus, module: "patients" },
      { title: "Doctors", url: "/doctors", icon: Stethoscope, module: "doctors" },
    ]
  },
  { 
    title: "Stock Control", 
    url: "/stock", 
    icon: Package, 
    module: "stock",
    subItems: [
      { title: "Suppliers", url: "/stock?tab=suppliers", icon: Truck },
      { title: "Orders", url: "/orders", icon: ClipboardList, module: "orders" },
    ]
  },
  { title: "Reports", url: "/reports", icon: Receipt, module: "reports" },
  { title: "Admin", url: "/management", icon: Settings, module: "management" },
  { title: "Help", url: "/help", icon: BookOpen, module: "help" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { data: userModules = [] } = useUserModules();
  const location = useLocation();

  // Filter navigation items based on user's module permissions
  const accessibleItems = navigationItems.filter(item => 
    userModules.includes(item.module)
  );

  const isStockActive = location.pathname === "/stock";
  const isOrdersActive = location.pathname === "/orders";
  const isSuppliersActive = location.pathname === "/stock" && location.search.includes("tab=suppliers");
  const isInventoryActive = isStockActive && !isSuppliersActive;
  const isStockSectionActive = isStockActive || isOrdersActive;
  
  const isPatientsActive = location.pathname === "/patients";
  const isDoctorsActive = location.pathname === "/doctors";
  const isCustomersSectionActive = isPatientsActive || isDoctorsActive;

  const isPOSActive = location.pathname === "/pos";
  const isTransactionsActive = location.pathname === "/pos/transactions";
  const isPOSSectionActive = isPOSActive || isTransactionsActive;

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
                if (item.subItems && item.subItems.length > 0) {
                  // Filter sub-items based on module permissions
                  const accessibleSubItems = item.subItems.filter(subItem => 
                    !subItem.module || userModules.includes(subItem.module)
                  );
                  
                  // Only show expandable menu if there are accessible sub-items
                  const hasAccessibleSubItems = accessibleSubItems.length > 0;
                  
                  // Determine if this section is active
                  const isSectionActive = item.title === "Stock Control" 
                    ? isStockSectionActive 
                    : item.title === "Customers" 
                      ? isCustomersSectionActive 
                      : item.title === "POS & Sales"
                        ? isPOSSectionActive
                        : false;
                  
                  return (
                    <Collapsible key={item.title} defaultOpen={isSectionActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <div className="flex items-center w-full">
                          <SidebarMenuButton asChild className="flex-1">
                            <NavLink
                              to={item.url}
                              className={
                                isSectionActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/50"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              {state !== "collapsed" && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                          {state !== "collapsed" && hasAccessibleSubItems && (
                            <CollapsibleTrigger asChild>
                              <button className="p-2 hover:bg-sidebar-accent/50 rounded-md">
                                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                              </button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        {hasAccessibleSubItems && (
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {/* Special handling for Stock Control - show Inventory first */}
                              {item.title === "Stock Control" && (
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
                              )}
                              {accessibleSubItems.map((subItem) => {
                                // Determine active state for each sub-item
                                let isSubActive = false;
                                if (subItem.url === "/orders") {
                                  isSubActive = isOrdersActive;
                                } else if (subItem.url.includes("tab=suppliers")) {
                                  isSubActive = isSuppliersActive;
                                } else if (subItem.url === "/patients") {
                                  isSubActive = isPatientsActive;
                                } else if (subItem.url === "/doctors") {
                                  isSubActive = isDoctorsActive;
                                } else if (subItem.url === "/pos" && !subItem.url.includes("transactions")) {
                                  isSubActive = isPOSActive && !isTransactionsActive;
                                } else if (subItem.url === "/pos/transactions") {
                                  isSubActive = isTransactionsActive;
                                }
                                
                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink
                                        to={subItem.url}
                                        className={
                                          isSubActive
                                            ? "bg-sidebar-accent/50 text-sidebar-accent-foreground font-medium"
                                            : "hover:bg-sidebar-accent/50"
                                        }
                                      >
                                        <subItem.icon className="h-4 w-4" />
                                        {state !== "collapsed" && <span>{subItem.title}</span>}
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        )}
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