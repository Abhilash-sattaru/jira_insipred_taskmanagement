import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TaskContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Task, TaskStatus } from "@/types";
import {
  mockEmployees,
  getEmployeesByManager,
  mockUsers,
  getEmployeeById,
} from "@/data/mockData";
import { fetchEmployees } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";
import {
  Calendar,
  User,
  Clock,
  MessageSquare,
  Send,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  open,
  onOpenChange,
}) => {
  const { user, hasRole } = useAuth();
  const { updateTaskStatus, addRemark, deleteTask, updateTask } = useTasks();
  const { addNotification } = useNotifications();
  const [newRemark, setNewRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employees, setEmployees] = useState(() => mockEmployees);
  const assignee = employees.find(
    (e) => String(e.e_id) === String(task.assigned_to)
  );
  const reviewer = employees.find(
    (e) => String(e.e_id) === String(task.reviewer)
  );
  const creator = employees.find(
    (e) => String(e.e_id) === String(task.created_by)
  );

  // Manager-specific lists and local state for editable fields
  const managerId =
    (user?.employee?.e_id as string) || (user?.e_id as string) || undefined;
  const teamMembers = managerId ? getEmployeesByManager(String(managerId)) : [];
  const managers = mockUsers
    .filter((u) => u.roles.includes("MANAGER"))
    .map((u) => u.employee)
    .filter(Boolean) as any[];

  // load employees from API for accurate names
  const { token } = useAuth();
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const data: any = await fetchEmployees(token || null);
        if (!mounted) return;
        if (Array.isArray(data)) {
          setEmployees(data.map((e: any) => ({ ...e, e_id: String(e.e_id) })));
        }
      } catch (err) {
        // ignore and keep mock
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(
    task.assigned_to
  );
  const [selectedReviewer, setSelectedReviewer] = useState<string | undefined>(
    task.reviewer
  );
  const [selectedDueDate, setSelectedDueDate] = useState<string | undefined>(
    task.expected_closure ? task.expected_closure.split("T")[0] : undefined
  );

  const expectedClosureDate = task.expected_closure
    ? new Date(task.expected_closure)
    : null;
  const isExpectedClosureValid = expectedClosureDate
    ? !isNaN(expectedClosureDate.getTime()) && isValid(expectedClosureDate)
    : false;

  const actualClosureDate = task.actual_closure
    ? new Date(task.actual_closure)
    : null;
  const isActualClosureValid = actualClosureDate
    ? !isNaN(actualClosureDate.getTime()) && isValid(actualClosureDate)
    : false;

  const updatedAtDate = task.updated_at ? new Date(task.updated_at) : null;
  const isUpdatedAtValid = updatedAtDate
    ? !isNaN(updatedAtDate.getTime()) && isValid(updatedAtDate)
    : false;

  const getPriorityIcon = () => {
    switch (task.priority) {
      case "HIGH":
        return <ArrowUp className="w-4 h-4" />;
      case "MEDIUM":
        return <ArrowRight className="w-4 h-4" />;
      case "LOW":
        return <ArrowDown className="w-4 h-4" />;
    }
  };

  // Priority editable by admin only
  const [selectedPriority, setSelectedPriority] = useState<string>(
    task.priority
  );
  useEffect(() => {
    setSelectedPriority(task.priority);
  }, [task.t_id, task.priority]);

  const getStatusIcon = () => {
    switch (task.status) {
      case "DONE":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      addRemark(task.t_id, {
        task_id: task.t_id,
        user_id: user?.e_id || "",
        user_name: user?.employee?.name || "Unknown",
        content: newRemark,
      });

      addNotification({
        type: "REMARK_ADDED",
        title: "New Comment",
        message: `${user?.employee?.name} added a comment on "${task.title}"`,
        task_id: task.t_id,
      });

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      });

      setNewRemark("");
    } catch {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (newStatus: TaskStatus, requireRemark = false) => {
    if (requireRemark && !newRemark.trim()) {
      toast({
        title: "Remark Required",
        description:
          "Please add a remark explaining the reason for moving back to In Progress",
        variant: "destructive",
      });
      return;
    }

    updateTaskStatus(
      task.t_id,
      newStatus,
      user?.e_id || "",
      requireRemark ? newRemark : undefined
    );

    addNotification({
      type: newStatus === "DONE" ? "TASK_COMPLETED" : "STATUS_CHANGED",
      title: newStatus === "DONE" ? "Task Completed!" : "Task Status Updated",
      message: `"${task.title}" moved to ${newStatus.replace("_", " ")}`,
      task_id: task.t_id,
    });

    toast({
      title: "Status Updated",
      description: `Task moved to ${newStatus.replace("_", " ")}`,
    });

    if (requireRemark) setNewRemark("");

    // Close modal after status change so the board refreshes and reflects the new status
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(task.t_id);
      toast({
        title: "Task Deleted",
        description: "Task has been deleted successfully",
      });
      onOpenChange(false);
    }
  };

  const canReview = task.reviewer === user?.e_id && task.status === "REVIEW";
  const canDelete = hasRole("ADMIN");
  const canMoveToReview =
    (hasRole("DEVELOPER") &&
      task.assigned_to === user?.e_id &&
      task.status === "IN_PROGRESS") ||
    (hasRole("ADMIN") && task.status === "IN_PROGRESS");
  const canAdmin = hasRole("ADMIN");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-muted-foreground">
                {task.t_id}
              </span>
              <DialogTitle className="text-xl font-bold text-foreground mt-1">
                {task.title}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status & Priority Badges */}
          <div className="flex items-center gap-3">
            <Badge
              className={cn(
                "flex items-center gap-1",
                task.status === "TO_DO" && "status-todo",
                task.status === "IN_PROGRESS" && "status-inprogress",
                task.status === "REVIEW" && "status-review",
                task.status === "DONE" && "status-done"
              )}
            >
              {getStatusIcon()}
              {task.status.replace("_", " ")}
            </Badge>
            <Badge
              className={cn(
                "flex items-center gap-1",
                task.priority === "HIGH" && "priority-high",
                task.priority === "MEDIUM" && "priority-medium",
                task.priority === "LOW" && "priority-low"
              )}
            >
              {getPriorityIcon()}
              {hasRole("ADMIN") ? (
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    const v = e.target.value as "HIGH" | "MEDIUM" | "LOW";
                    setSelectedPriority(v);
                    updateTask(task.t_id, { priority: v });
                  }}
                  className="ml-2 text-sm bg-transparent"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              ) : (
                <span className="ml-2">{task.priority}</span>
              )}
            </Badge>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Description
            </h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                {hasRole("MANAGER") ? (
                  <select
                    value={selectedAssignee || ""}
                    onChange={(e) => {
                      const v = e.target.value || undefined;
                      setSelectedAssignee(v);
                      updateTask(task.t_id, { assigned_to: v });
                    }}
                    className="ml-2 text-sm p-1 border rounded"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.e_id} value={m.e_id}>
                        {m.name} ({m.e_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {assignee?.name || "Unassigned"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Reviewer:</span>
                {hasRole("MANAGER") ? (
                  <select
                    value={selectedReviewer || ""}
                    onChange={(e) => {
                      const v = e.target.value || undefined;
                      setSelectedReviewer(v);
                      updateTask(task.t_id, { reviewer: v });
                    }}
                    className="ml-2 text-sm p-1 border rounded"
                  >
                    <option value="">Not assigned</option>
                    {managers.map((m) => (
                      <option key={m.e_id} value={m.e_id}>
                        {m.name} ({m.e_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {reviewer?.name || "Not assigned"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created by:</span>
                <span className="font-medium text-foreground">
                  {(() => {
                    // Try to resolve creator from mock data
                    const cr =
                      getEmployeeById(task.created_by as string) || creator;
                    return cr?.name || "Unknown";
                  })()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Due:</span>
                <span className="font-medium text-foreground">
                  {isExpectedClosureValid
                    ? format(expectedClosureDate!, "MMM d, yyyy")
                    : "—"}
                </span>
                {hasRole("MANAGER") && (
                  <input
                    type="date"
                    value={selectedDueDate || ""}
                    onChange={(e) => {
                      const v = e.target.value; // yyyy-mm-dd
                      setSelectedDueDate(v);
                      const iso = v ? new Date(v).toISOString() : undefined;
                      updateTask(task.t_id, { expected_closure: iso });
                    }}
                    className="ml-3 text-sm p-1 border rounded"
                  />
                )}
              </div>
              {task.actual_closure && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-medium text-success">
                    {isActualClosureValid
                      ? format(actualClosureDate!, "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
              )}
              {task.updated_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium text-foreground">
                    {isUpdatedAtValid
                      ? format(updatedAtDate!, "MMM d, yyyy HH:mm")
                      : "—"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          {(canReview || canMoveToReview || canAdmin) && (
            <div className="flex gap-2">
              {canMoveToReview && (
                <Button
                  onClick={() => handleStatusChange("REVIEW")}
                  className="bg-review hover:bg-review/90"
                >
                  Move to Review
                </Button>
              )}
              {(canReview || canAdmin) && (
                <>
                  <Button
                    onClick={() => handleStatusChange("DONE")}
                    className="bg-done hover:bg-done/90"
                  >
                    Approve & Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("IN_PROGRESS", true)}
                    className="text-inprogress border-inprogress hover:bg-inprogress/10"
                  >
                    Return to In Progress
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Remarks Section */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Remarks ({task.remarks?.length || 0})
            </h4>

            {/* Add Remark */}
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Add a remark..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                className="bg-secondary/50 min-h-[60px]"
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  onClick={handleAddRemark}
                  disabled={isSubmitting || !newRemark.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline">
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Remarks List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {task.remarks?.map((remark, index) => (
                <motion.div
                  key={remark.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 p-3 rounded-lg bg-secondary/30"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {remark.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {remark.user_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          const d = remark.created_at
                            ? new Date(remark.created_at)
                            : null;
                          return d && !isNaN(d.getTime()) && isValid(d)
                            ? format(d, "MMM d, HH:mm")
                            : "—";
                        })()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {remark.content}
                    </p>
                    {remark.attachment && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Paperclip className="w-3 h-3" />
                        <span>Attachment</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {(!task.remarks || task.remarks.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No remarks yet
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
