import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEmployees, fetchMyEmployees } from "@/lib/api";
import { useTasks } from "@/contexts/TaskContext";
import { useNotifications } from "@/contexts/NotificationContext";
// removed mockEmployees import — use backend API only
import { Priority } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
<DialogDescription>
  Create a new task and assign to team members or reviewers.
</DialogDescription>;
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user, token, hasRole } = useAuth();
  const { addTask } = useTasks();
  const { addNotification } = useNotifications();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Priority,
    assigned_to: "",
    reviewer: "",
    expected_closure: "",
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        // No auth token: cannot load employees from backend. Leave lists empty.
        setEmployees([]);
        setReviewers([]);
        return;
      }

      try {
        // fetch assigned-to candidates
        let data: any[] = [];
        if (hasRole("MANAGER")) {
          data = await fetchMyEmployees(token || null);
        } else if (hasRole("ADMIN")) {
          data = await fetchEmployees(token || null);
        } else {
          // not manager or admin: do not call admin-only endpoint
          data = [];
        }

        if (!mounted) return;
        const mapped = Array.isArray(data)
          ? data.map((e: any) => ({
              ...e,
              e_id: String(e.e_id),
              mgr_id: e.mgr_id != null ? String(e.mgr_id) : undefined,
            }))
          : [];

        if (hasRole("MANAGER") && user?.e_id) {
          const userDigits = (String(user.e_id).match(/(\d+)/) || [])[0];
          const idVariants = new Set<string>();
          idVariants.add(String(user.e_id));
          if (userDigits) {
            const n = String(Number(userDigits));
            idVariants.add(n);
            idVariants.add(`EMP${String(Number(n)).padStart(3, "0")}`);
          }
          if (user.employee?.e_id) idVariants.add(String(user.employee.e_id));

          const filtered = mapped.filter((emp: any) => {
            const mgr = emp.mgr_id != null ? String(emp.mgr_id) : "";
            for (const v of idVariants) {
              if (!v) continue;
              if (mgr === v) return true;
            }
            return false;
          });
          setEmployees(filtered);
        } else {
          setEmployees(mapped);
        }

        // build reviewers: try to fetch full list to get all managers (admin only)
        try {
          if (hasRole("ADMIN")) {
            const full: any = await fetchEmployees(token || null);
            if (Array.isArray(full)) {
              const fullMapped = full.map((e: any) => ({
                ...e,
                e_id: String(e.e_id),
                mgr_id: e.mgr_id != null ? String(e.mgr_id) : undefined,
              }));
              let mgrs = fullMapped.filter(
                (emp: any) =>
                  (emp.designation || "").toLowerCase().includes("manager") ||
                  (emp.designation || "").toLowerCase().includes("lead")
              );
              if (hasRole("MANAGER") && user?.e_id) {
                const existing = new Set(mgrs.map((m: any) => String(m.e_id)));
                if (!existing.has(String(user.e_id))) {
                  mgrs.unshift({
                    e_id: String(user.e_id),
                    name: user.employee?.name || `Manager ${user.e_id}`,
                    designation: user.employee?.designation || "Manager",
                  });
                }
              }
              const seen = new Set<string>();
              const deduped = mgrs.filter((m: any) => {
                if (seen.has(String(m.e_id))) return false;
                seen.add(String(m.e_id));
                return true;
              });
              setReviewers(deduped);
            }
          } else {
            // Non-admins should not call the admin endpoint. Derive reviewers from the
            // already-fetched mapped list (if any) to avoid 403 responses.
            const mgrs = mapped.filter(
              (emp: any) =>
                (emp.designation || "").toLowerCase().includes("manager") ||
                (emp.designation || "").toLowerCase().includes("lead")
            );
            if (hasRole("MANAGER") && user?.e_id) {
              const exists = mgrs.some(
                (m: any) => String(m.e_id) === String(user.e_id)
              );
              if (!exists) {
                mgrs.unshift({
                  e_id: String(user.e_id),
                  name: user.employee?.name || `Manager ${user.e_id}`,
                  designation: user.employee?.designation || "Manager",
                });
              }
            }
            const seen = new Set<string>();
            const deduped = mgrs.filter((m: any) => {
              if (seen.has(String(m.e_id))) return false;
              seen.add(String(m.e_id));
              return true;
            });
            setReviewers(deduped);
          }
        } catch (err) {
          // fallback: try to use /api/users to derive manager list if /api/employees is forbidden
          if (hasRole("ADMIN")) {
            try {
              const udata: any = await (
                await import("@/lib/api")
              ).fetchUsers(token || null);
              if (Array.isArray(udata)) {
                const mgrsFromUsers = udata
                  .filter(
                    (u: any) =>
                      Array.isArray(u.roles) && u.roles.includes("MANAGER")
                  )
                  .map((u: any) => ({
                    e_id: String(u.e_id),
                    name: u.employee?.name || u.name || `Manager ${u.e_id}`,
                    designation: u.employee?.designation || "Manager",
                  }));
                if (hasRole("MANAGER") && user?.e_id) {
                  const existing = new Set(
                    mgrsFromUsers.map((m: any) => String(m.e_id))
                  );
                  if (!existing.has(String(user.e_id))) {
                    mgrsFromUsers.unshift({
                      e_id: String(user.e_id),
                      name: user.employee?.name || `Manager ${user.e_id}`,
                      designation: user.employee?.designation || "Manager",
                    });
                  }
                }
                const seen = new Set<string>();
                const deduped = mgrsFromUsers.filter((m: any) => {
                  if (seen.has(String(m.e_id))) return false;
                  seen.add(String(m.e_id));
                  return true;
                });
                setReviewers(deduped);
                return;
              }
            } catch (uerr) {
              console.debug(
                "CreateTaskModal: fetchUsers fallback failed",
                uerr
              );
            }
          }
          // fallback derive from mapped
          const mgrs = mapped.filter(
            (emp: any) =>
              (emp.designation || "").toLowerCase().includes("manager") ||
              (emp.designation || "").toLowerCase().includes("lead")
          );
          if (hasRole("MANAGER") && user?.e_id) {
            const exists = mgrs.some(
              (m: any) => String(m.e_id) === String(user.e_id)
            );
            if (!exists) {
              mgrs.unshift({
                e_id: String(user.e_id),
                name: user.employee?.name || `Manager ${user.e_id}`,
                designation: user.employee?.designation || "Manager",
              });
            }
          }
          const seen = new Set<string>();
          const deduped = mgrs.filter((m: any) => {
            if (seen.has(String(m.e_id))) return false;
            seen.add(String(m.e_id));
            return true;
          });
          setReviewers(deduped);
        }
      } catch (err) {
        console.error(
          "CreateTaskModal: Failed to load employees for task assignment",
          err,
          { token, user }
        );
        if (!mounted) return;
        // show explicit toast so user knows why dropdowns may be empty
        toast({
          title: "Failed to load employees",
          description:
            "Could not load employee list from server. Please ensure you are logged in with sufficient permissions.",
          variant: "destructive",
        });
        setEmployees([]);
        setReviewers([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, hasRole, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.expected_closure
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      addTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "TO_DO",
        created_by: user?.e_id || "",
        assigned_to: formData.assigned_to || undefined,
        assigned_by: formData.assigned_to ? user?.e_id : undefined,
        assigned_at: formData.assigned_to
          ? new Date().toISOString()
          : undefined,
        reviewer: formData.reviewer || undefined,
        expected_closure: formData.expected_closure,
      });
      if (formData.assigned_to) {
        addNotification({
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned "${formData.title}"`,
        });
      }
      toast({
        title: "Task Created",
        description: "Task has been created successfully",
      });
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        assigned_to: "",
        reviewer: "",
        expected_closure: "",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const managerCandidates = reviewers; // reviewers is the list of managers to show in reviewer dropdown

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="bg-secondary/50 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value: Priority) =>
                  setFormData((p) => ({ ...p, priority: value }))
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_closure">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="expected_closure"
                type="date"
                value={formData.expected_closure}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    expected_closure: e.target.value,
                  }))
                }
                className="bg-secondary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) =>
                  setFormData((p) => ({ ...p, assigned_to: value }))
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.e_id} value={String(emp.e_id)}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select
                value={formData.reviewer}
                onValueChange={(value) =>
                  setFormData((p) => ({ ...p, reviewer: value }))
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {managerCandidates.map((mgr: any) => (
                    <SelectItem key={mgr.e_id} value={String(mgr.e_id)}>
                      {mgr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskModal;
