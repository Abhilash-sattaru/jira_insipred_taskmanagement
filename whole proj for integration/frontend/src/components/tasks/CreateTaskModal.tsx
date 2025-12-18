import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEmployees } from "@/lib/api";
import { useTasks } from "@/contexts/TaskContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { mockEmployees } from "@/data/mockData";
import { Priority } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const { user, token } = useAuth();
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
    } catch {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [employees, setEmployees] = useState(() => mockEmployees);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return setEmployees(mockEmployees);
      try {
        const data: any = await fetchEmployees(token || null);
        if (!mounted) return;
        if (Array.isArray(data)) {
          setEmployees(
            data.map((e: any) => ({
              ...e,
              e_id: String(e.e_id),
              mgr_id: e.mgr_id != null ? String(e.mgr_id) : undefined,
            }))
          );
        } else {
          setEmployees(mockEmployees);
        }
      } catch (err) {
        console.warn(
          "Failed to load employees for task assignment, using mock",
          err
        );
        if (mounted) setEmployees(mockEmployees);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const managers = employees.filter(
    (e) =>
      (e.designation || "").toLowerCase().includes("manager") ||
      (e.designation || "").toLowerCase().includes("lead")
  );

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
                setFormData((prev) => ({ ...prev, title: e.target.value }))
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
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
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
                  setFormData((prev) => ({ ...prev, priority: value }))
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
                  setFormData((prev) => ({
                    ...prev,
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
                  setFormData((prev) => ({ ...prev, assigned_to: value }))
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
                  setFormData((prev) => ({ ...prev, reviewer: value }))
                }
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select reviewer" />
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
