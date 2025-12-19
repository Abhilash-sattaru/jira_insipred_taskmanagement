import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Employee } from "@/types";
// mock data removed; use backend API only
import {
  fetchEmployees,
  fetchMyEmployees,
  fetchUsers,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  Mail,
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const EmployeesPage: React.FC = () => {
  const { user, hasRole, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 8;

  // employees loaded from API
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);
  const [usersList, setUsersList] = React.useState<any[]>([]);

  const mountedRef = useRef(true);

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    try {
      let data: any[] = [];
      if (hasRole("ADMIN")) {
        data = await fetchEmployees(token || null);
      } else {
        data = await fetchMyEmployees(token || null);
      }

      // Normalize backend records to frontend `Employee` shape (strings for e_id/mgr_id)
      if (mountedRef.current && Array.isArray(data)) {
        const normalized = data.map((e: any) => ({
          e_id:
            e.e_id != null ? String(e.e_id) : e.id != null ? String(e.id) : "",
          name: e.name || e.full_name || "",
          email: e.email || "",
          designation: e.designation || e.position || "",
          mgr_id:
            e.mgr_id != null
              ? String(e.mgr_id)
              : e.manager_id != null
              ? String(e.manager_id)
              : undefined,
          avatar: e.avatar || e.profile_picture || "",
          department: e.department || e.dept || "",
        })) as Employee[];
        setEmployees(normalized);
        // if admin, fetch users to compute active user stats
        if (hasRole("ADMIN")) {
          try {
            const udata: any = await fetchUsers(token || null);
            if (Array.isArray(udata)) {
              setUsersList(
                udata.map((u: any) => ({
                  ...u,
                  e_id: String(u.e_id),
                  status: u.status || "INACTIVE",
                }))
              );
            }
          } catch (e) {
            // ignore users fetch failures
          }
        }
      }
    } catch (err) {
      // API failed — show error and keep list empty
      console.error("Failed to fetch employees from API:", err);
      toast({
        title: "Error fetching employees",
        description: (err as any)?.message || String(err),
        variant: "destructive",
      });
      if (mountedRef.current) {
        setEmployees([]);
      }
    } finally {
      if (mountedRef.current) setLoadingEmployees(false);
    }
  }, [hasRole, user, token]);

  React.useEffect(() => {
    mountedRef.current = true;
    loadEmployees();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEmployees]);

  // Apply search filter
  const filtered = employees.filter(
    (emp) =>
      (emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.designation || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEmployees = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // form state is now managed inside EmployeeForm to avoid parent re-renders

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setAddModalOpen(true);
  };

  // onSave will be called from the modal form with a payload object
  const handleSave = async (isEdit: boolean, payload: any) => {
    if (!payload.name || !payload.email || !payload.designation) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Frontend validation: backend enforces company email domain
    if (!String(payload.email).toLowerCase().endsWith("@ust.com")) {
      toast({
        title: "Invalid Email",
        description: "Email must belong to @ust.com domain",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && selectedEmployee) {
        const res = await updateEmployee(
          selectedEmployee.e_id as any,
          payload,
          token || null
        );
        // refresh canonical server list after successful update
        await loadEmployees();
        toast({
          title: "Employee Updated",
          description: `${res.name} updated successfully`,
        });
      } else {
        const res = await createEmployee(payload, token || null);
        // refresh canonical server list after successful create
        await loadEmployees();
        toast({
          title: "Employee Added",
          description: `${res.name} added successfully`,
        });
      }
      setEditModalOpen(false);
      setAddModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.name}?`))
      return;

    try {
      await deleteEmployee(employee.e_id as any, token || null);
      // refresh canonical server list after delete
      await loadEmployees();
      toast({
        title: "Employee Deleted",
        description: `${employee.name} has been deleted`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || String(err),
        variant: "destructive",
      });
    }
  };

  // Determine managers more flexibly: any designation containing "manager" or "lead"
  const managers = employees.filter((e) => {
    const d = (e.designation || "").toLowerCase();
    return /manager|lead/.test(d);
  });

  const EmployeeForm = ({
    isEdit,
    initial,
    onSave,
    onCancel,
  }: {
    isEdit: boolean;
    initial?: Partial<Employee> | null;
    onSave: (isEdit: boolean, payload: any) => void;
    onCancel: () => void;
  }) => {
    const [local, setLocal] = React.useState<Partial<Employee>>(() => ({
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      designation: initial?.designation ?? "",
      department: initial?.department ?? "",
      // normalize mgr_id to string for the Select component
      mgr_id: initial?.mgr_id != null ? String(initial?.mgr_id) : "",
    }));

    // when initial changes (opening form for different employee), reset local state
    React.useEffect(() => {
      setLocal({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        designation: initial?.designation ?? "",
        department: initial?.department ?? "",
        mgr_id: initial?.mgr_id ?? "",
      });
    }, [initial]);

    const submit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(isEdit, {
        name: (local.name || "").trim(),
        email: (local.email || "").trim(),
        designation: (local.designation || "").trim(),
        // convert mgr_id back to number for backend if it's a numeric string
        mgr_id: local.mgr_id
          ? isNaN(Number(local.mgr_id))
            ? local.mgr_id
            : Number(local.mgr_id)
          : null,
      });
    };

    return (
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={local.name ?? ""}
              onChange={(e) =>
                setLocal((p) => ({ ...p, name: e.target.value }))
              }
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={local.email ?? ""}
              onChange={(e) =>
                setLocal((p) => ({ ...p, email: e.target.value }))
              }
              className="bg-secondary/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Designation <span className="text-destructive">*</span>
            </Label>
            <Input
              value={local.designation ?? ""}
              onChange={(e) =>
                setLocal((p) => ({ ...p, designation: e.target.value }))
              }
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={local.department ?? ""}
              onValueChange={(value) =>
                setLocal((p) => ({ ...p, department: value }))
              }
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Manager</Label>
          <Select
            value={local.mgr_id ?? ""}
            onValueChange={(value) =>
              setLocal((p) => ({ ...p, mgr_id: value }))
            }
          >
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map((mgr) => (
                <SelectItem key={mgr.e_id} value={String(mgr.e_id)}>
                  {mgr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update"
            ) : (
              "Add Employee"
            )}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Employees
          </h1>
          <p className="text-muted-foreground">Manage employee information</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-secondary/50"
            />
          </div>
          {hasRole("ADMIN") && (
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          )}
        </div>
      </div>
      {/* No mock data UI — employees come from backend only */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Employees",
            value: employees.length,
            icon: Users,
          },
          {
            label: "Engineering",
            value: employees.filter((e) => e.department === "Engineering")
              .length,
            icon: Building2,
          },
          {
            label: "Managers",
            value: managers.length,
            icon: (props: any) => (
              <img src="/ust-logo.svg" alt="UST" {...props} />
            ),
          },
          {
            label: "Active",
            value: usersList.length
              ? usersList.filter((u: any) => u.status === "ACTIVE").length
              : employees.length,
            icon: Users,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Employees Table */}
      <Card className="glass border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                {hasRole("ADMIN") && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {paginatedEmployees.map((employee, index) => {
                  // lookup manager from loaded employees
                  const manager = employees.find(
                    (e) => String(e.e_id) === String(employee.mgr_id)
                  );
                  return (
                    <motion.tr
                      key={employee.e_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={employee.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {employee.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {employee.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {employee.designation}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {employee.department || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {manager?.name || "N/A"}
                        </span>
                      </TableCell>
                      {hasRole("ADMIN") && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(employee)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, employees.length)} of{" "}
              {employees.length} employees
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            isEdit
            initial={selectedEmployee}
            onSave={handleSave}
            onCancel={() => setEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            isEdit={false}
            initial={null}
            onSave={handleSave}
            onCancel={() => setAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
