import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockUsers, mockEmployees } from "@/data/mockData";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchEmployees,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { User, Role } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCog,
  Shield,
  Briefcase,
  Code,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UsersPage: React.FC = () => {
  const auth = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [loadingUsers, setLoadingUsers] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        // Fetch users and employees then map backend User -> frontend User shape
        const [data, empData] = await Promise.all([
          fetchUsers(auth?.token || null),
          fetchEmployees(auth?.token || null).catch(() => null),
        ]);

        const employeesList: any[] = Array.isArray(empData)
          ? empData.map((e: any) => ({ ...e, e_id: String(e.e_id) }))
          : [];

        if (mounted && Array.isArray(data)) {
          const mapped = (data as any[]).map((u) => ({
            e_id: String(u.e_id),
            roles: u.role ? [String(u.role)] : [],
            status: u.status || "INACTIVE",
            employee: employeesList.find(
              (ee) => String(ee.e_id) === String(u.e_id)
            ) || // fallback minimal employee shape
            {
              e_id: String(u.e_id),
              name: `Emp ${u.e_id}`,
              email: "",
              designation: "",
              department: "",
            },
          }));
          setUsers(mapped as any);
        }
      } catch (err) {
        console.error("Failed to fetch users from API, using mock data:", err);
        toast({
          title: "Error fetching users",
          description: (err as any)?.message || String(err),
          variant: "destructive",
        });
        if (mounted) setUsers(mockUsers);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    // Only admin can fetch from API; otherwise keep mockUsers
    try {
      if (auth?.hasRole("ADMIN")) loadUsers();
    } catch {
      /* ignore */
    }
    return () => {
      mounted = false;
    };
  }, [auth]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 8;

  const q = (searchQuery || "").toLowerCase();
  const filteredUsers = users.filter((user) => {
    const empName = (user.employee?.name || "").toLowerCase();
    const idStr = String(user.e_id ?? "").toLowerCase();
    return empName.includes(q) || idStr.includes(q);
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [formData, setFormData] = useState<{
    e_id: string;
    roles: Role[];
    status: "ACTIVE" | "INACTIVE";
  }>({
    e_id: "",
    roles: ["DEVELOPER"],
    status: "ACTIVE",
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      e_id: user.e_id,
      roles: user.roles,
      status: user.status,
    });
    setEditModalOpen(true);
  };

  const handleAdd = () => {
    setFormData({
      e_id: "",
      roles: ["DEVELOPER"],
      status: "ACTIVE",
    });
    setAddModalOpen(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    if (!formData.e_id || formData.roles.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // convert e_id like 'EMP001' -> numeric id expected by backend
      const normalize = (id: string) => {
        if (!id) return null;
        const m = id.match(/(\d+)/);
        if (m) return Number(m[0]);
        if (/^[0-9]+$/.test(id)) return Number(id);
        return null;
      };

      if (auth?.hasRole("ADMIN")) {
        if (isEdit && selectedUser) {
          const payload: any = {
            role: formData.roles[0] as any,
            status: formData.status as any,
          };
          await updateUser(
            selectedUser.e_id as any,
            payload,
            auth?.token || null
          );
          // refresh list
          const data = await fetchUsers(auth?.token || null);
          setUsers(Array.isArray(data) ? (data as any) : mockUsers);
          toast({
            title: "User Updated",
            description: "User updated successfully",
          });
        } else {
          const numeric = normalize(formData.e_id);
          if (numeric === null) {
            toast({
              title: "Error",
              description: "Invalid Employee ID",
              variant: "destructive",
            });
            return;
          }
          const payload: any = {
            e_id: numeric,
            role: formData.roles[0] as any,
            password: "welcome123",
          };
          await createUser(payload, auth?.token || null);
          const data = await fetchUsers(auth?.token || null);
          setUsers(Array.isArray(data) ? (data as any) : mockUsers);
          toast({
            title: "User Added",
            description: "User added successfully",
          });
        }
      } else {
        // not admin - operate only locally
        if (isEdit && selectedUser) {
          setUsers((prev) =>
            prev.map((u) =>
              u.e_id === selectedUser.e_id
                ? { ...u, roles: formData.roles, status: formData.status }
                : u
            )
          );
        } else {
          const employee = mockEmployees.find((e) => e.e_id === formData.e_id);
          if (!employee) {
            toast({
              title: "Error",
              description: "Employee not found",
              variant: "destructive",
            });
            return;
          }
          setUsers((prev) => [
            ...prev,
            {
              e_id: formData.e_id,
              roles: formData.roles,
              status: formData.status,
              employee,
            },
          ]);
        }
        toast({
          title: isEdit ? "User Updated" : "User Added",
          description: "Operation completed locally",
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

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete this user?`)) return;
    try {
      if (auth?.hasRole("ADMIN")) {
        await deleteUser(user.e_id as any, auth?.token || null);
        const data = await fetchUsers(auth?.token || null);
        setUsers(Array.isArray(data) ? (data as any) : mockUsers);
      } else {
        setUsers((prev) => prev.filter((u) => u.e_id !== user.e_id));
      }
      toast({ title: "User Deleted", description: "User has been deleted" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || String(err),
        variant: "destructive",
      });
    }
  };

  const toggleRole = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-3 h-3" />;
      case "MANAGER":
        return <Briefcase className="w-3 h-3" />;
      case "DEVELOPER":
        return <Code className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "MANAGER":
        return "bg-warning/10 text-warning border-warning/30";
      case "DEVELOPER":
        return "bg-info/10 text-info border-info/30";
    }
  };

  const availableEmployees = mockEmployees.filter(
    (emp) => !users.some((u) => u.e_id === emp.e_id)
  );

  const UserForm = ({ isEdit }: { isEdit: boolean }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(isEdit);
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>
          Employee <span className="text-destructive">*</span>
        </Label>
        {isEdit ? (
          <Input
            value={selectedUser?.employee?.name || ""}
            disabled
            className="bg-secondary/50"
          />
        ) : (
          <Select
            value={formData.e_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, e_id: value }))
            }
          >
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.map((emp) => (
                <SelectItem key={emp.e_id} value={emp.e_id}>
                  {emp.name} ({emp.e_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label>
          Roles <span className="text-destructive">*</span>
        </Label>
        <div className="flex flex-wrap gap-3">
          {(["ADMIN", "MANAGER", "DEVELOPER"] as Role[]).map((role) => (
            <div
              key={role}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                formData.roles.includes(role)
                  ? getRoleColor(role)
                  : "bg-secondary/30 border-border text-muted-foreground"
              )}
              onClick={() => toggleRole(role)}
            >
              <Checkbox
                checked={formData.roles.includes(role)}
                onCheckedChange={() => toggleRole(role)}
              />
              <span className="flex items-center gap-1">
                {getRoleIcon(role)}
                {role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          Status <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.status}
          onValueChange={(value: "ACTIVE" | "INACTIVE") =>
            setFormData((prev) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger className="bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                Active
              </span>
            </SelectItem>
            <SelectItem value="INACTIVE">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Inactive
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            isEdit ? setEditModalOpen(false) : setAddModalOpen(false)
          }
        >
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
            "Add User"
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-secondary/50"
            />
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card className="glass border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {paginatedUsers.map((user, index) => (
                  <motion.tr
                    key={user.e_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.employee?.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.employee?.name.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.employee?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.employee?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-secondary px-2 py-1 rounded">
                        {user.e_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            className={cn("text-xs", getRoleColor(role))}
                          >
                            {getRoleIcon(role)}
                            <span className="ml-1">{role}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          user.status === "ACTIVE"
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        )}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
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
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm isEdit />
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm isEdit={false} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
