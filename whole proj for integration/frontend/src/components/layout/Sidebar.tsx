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
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 glass-card",
        !collapsed && "shadow-md"
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
              <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shadow-md overflow-hidden">
                <img
                  src="/ust-logo.svg"
                  alt="UST"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-semibold text-sidebar-foreground text-sm">
                  UST
                </h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center shadow-md mx-auto overflow-hidden">
            <img
              src="/ust-logo.svg"
              alt="UST"
              className="w-full h-full object-cover"
            />
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
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-180 group relative overflow-hidden",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/40"
              )}
            >
              {/* Decorative colored strip when active (visual only) */}
              <div
                aria-hidden
                className={cn(
                  "absolute left-0 top-2 bottom-2 w-1 rounded-r-lg",
                  isActive ? "bg-sidebar-primary" : ""
                )}
              />
              <div className="w-9 h-9 flex items-center justify-center rounded-md bg-sidebar-accent/10">
                <item.icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-150",
                    isActive ? "text-sidebar-primary" : "group-hover:scale-110"
                  )}
                />
              </div>
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
        className="absolute -right-3 top-24 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 border border-border shadow-md flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform"
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
