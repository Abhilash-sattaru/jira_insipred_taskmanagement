import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      roles: ["ADMIN", "MANAGER", "DEVELOPER"],
    },
    {
      to: "/dashboard/tasks",
      icon: ListTodo,
      label: "Tasks Board",
      roles: ["ADMIN", "MANAGER", "DEVELOPER"],
    },
    {
      to: "/dashboard/employees",
      icon: Users,
      label: "Employees",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      to: "/dashboard/users",
      icon: UserCog,
      label: "User Management",
      roles: ["ADMIN"],
    },
    {
      to: "/dashboard/analytics",
      icon: BarChart3,
      label: "Analytics",
      roles: ["ADMIN", "MANAGER"],
    },
    {
      to: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
      roles: ["ADMIN", "MANAGER", "DEVELOPER"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role as any))
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0",
        !collapsed && "shadow-lg"
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground text-sm">
                  UST Employee
                </h1>
                <p className="text-xs text-muted-foreground">Management</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md mx-auto">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 w-1 h-6 bg-sidebar-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  isActive ? "text-sidebar-primary" : "group-hover:scale-110"
                )}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {user?.employee?.name?.charAt(0) || "U"}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.employee?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.roles.join(", ")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-2 top-24 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
