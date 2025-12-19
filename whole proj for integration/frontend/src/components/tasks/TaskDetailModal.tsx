import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TaskContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Task, TaskStatus } from "@/types";
import { fetchEmployees, fetchMyEmployees, fetchUsers } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { empIdEquals } from "@/lib/utils";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [developersList, setDevelopersList] = useState<any[]>([]);
  // assignee has been removed from UI per request; keep employees list for reviewer/creator lookups
  const reviewer = employees.find((e) => empIdEquals(e.e_id, task.reviewer));
  const creator = employees.find((e) => empIdEquals(e.e_id, task.created_by));

  // Manager-specific lists and local state for editable fields
  const managerId =
    (user?.employee?.e_id as string) || (user?.e_id as string) || undefined;
  const teamMembers = managerId
    ? employees.filter((e) => String(e.mgr_id) === String(managerId))
    : [];

  const managers = usersList
    .filter((u) => Array.isArray(u.roles) && u.roles.includes("MANAGER"))
    .map((u) => {
      const emp = employees.find((e) => String(e.e_id) === String(u.e_id));
      return emp || { e_id: u.e_id, name: u.employee?.name || u.e_id };
    })
    .filter(Boolean) as any[];

  // ensure the logged-in manager (if any) is present in the managers list
  if (hasRole("MANAGER") && user?.e_id) {
    const idStr = String(user.e_id);
    const exists = managers.some((m) => String(m.e_id) === idStr);
    if (!exists) {
      const empRecord = employees.find((e) => String(e.e_id) === idStr);
      const entry =
        empRecord ||
        ({
          e_id: idStr,
          name: user.employee?.name || `Manager ${idStr}`,
        } as any);
      managers.unshift(entry);
    }
  }

  // dedupe managers by e_id to be safe
  const seenMgr = new Set<string>();
  const dedupedManagers = managers.filter((m) => {
    const k = String(m.e_id);
    if (seenMgr.has(k)) return false;
    seenMgr.add(k);
    return true;
  });

  // load employees from API for accurate names
  const { token } = useAuth();
  const isMountedRef = React.useRef(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadEmployees = React.useCallback(async () => {
    setLoadError(null);
    if (!token) return;
    try {
      const [edata, udata] = await Promise.all([
        hasRole("MANAGER") && !hasRole("ADMIN")
          ? fetchMyEmployees(token || null)
          : fetchEmployees(token || null),
        // Only fetch users when running as ADMIN (users list is admin-only on backend)
        hasRole("ADMIN")
          ? fetchUsers(token || null).catch(() => [])
          : Promise.resolve([]),
      ]);
      if (!isMountedRef.current) return;
      if (Array.isArray(edata)) {
        const mappedEmps = edata.map((e: any) => ({
          ...e,
          e_id: String(e.e_id),
        }));
        setEmployees(mappedEmps);
        // derive developers list from edata: for managers, edata is likely the manager's team
        try {
          let devsFromEmps = mappedEmps;
          if (!(hasRole("MANAGER") && !hasRole("ADMIN"))) {
            // for admins or others, try filter by designation containing 'developer' or 'dev'
            devsFromEmps = mappedEmps.filter((emp: any) => {
              const des = (emp.designation || "").toLowerCase();
              return des.includes("developer") || des.includes("dev");
            });
          }
          if (devsFromEmps.length > 0) {
            setDevelopersList(
              devsFromEmps.map((d: any) => ({ ...d, e_id: String(d.e_id) }))
            );
          }
        } catch {}
      }
      if (Array.isArray(udata)) {
        setUsersList(udata as any[]);
        // derive developers list from users when available
        const devsFromUsers = udata
          .filter(
            (u: any) => Array.isArray(u.roles) && u.roles.includes("DEVELOPER")
          )
          .map((u: any) => {
            const emp = (Array.isArray(edata) ? edata : []).find(
              (e: any) => String(e.e_id) === String(u.e_id)
            );
            return (
              emp || {
                e_id: String(u.e_id),
                name: u.employee?.name || u.name || String(u.e_id),
              }
            );
          });
        if (devsFromUsers.length > 0) {
          setDevelopersList(
            devsFromUsers.map((d: any) => ({ ...d, e_id: String(d.e_id) }))
          );
        }
      }
    } catch (err: any) {
      console.error("Failed to load employees/users", err);
      // try alternative: fetch users and derive employee info (some backends expose limited user -> employee mapping)
      try {
        if (hasRole("ADMIN")) {
          const udata: any = await fetchUsers(token || null).catch(() => []);
          if (Array.isArray(udata) && udata.length > 0) {
            const fromUsers = udata
              .map((u: any) => ({
                ...(u.employee || {}),
                e_id: String(u.e_id),
                roles: u.roles,
              }))
              .filter((x: any) => x && x.e_id);
            if (fromUsers.length > 0) {
              if (!isMountedRef.current) return;
              setEmployees(fromUsers as any[]);
              // also set developers from this fallback
              const devs = udata
                .filter(
                  (u: any) =>
                    Array.isArray(u.roles) && u.roles.includes("DEVELOPER")
                )
                .map((u: any) => ({
                  ...(u.employee || {}),
                  e_id: String(u.e_id),
                  name: u.employee?.name || u.name || String(u.e_id),
                }));
              if (devs.length > 0) setDevelopersList(devs as any[]);
            }
          }
        }
      } catch (uerr) {
        console.debug("TaskDetailModal: fetchUsers fallback failed", uerr);
      }

      // per-employee GET is not provided by the API (405); we already attempted /api/users fallback above

      setLoadError(err?.message || String(err));
      toast({
        title: "Data load failed",
        description:
          "Failed to load employees or users from the server. Please check your login and try again.",
        variant: "destructive",
      });
    }
  }, [token, task.created_by, task.reviewer]);

  React.useEffect(() => {
    isMountedRef.current = true;
    loadEmployees();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadEmployees]);

  const [selectedReviewer, setSelectedReviewer] = useState<string | undefined>(
    task.reviewer
  );
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(
    task.assigned_to
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
        attachmentFile: selectedFile || undefined,
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
      setSelectedFile(null);
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

  const canReview =
    empIdEquals(task.reviewer, user?.e_id) && task.status === "REVIEW";
  const canDelete = hasRole("ADMIN");
  const canMoveToReview =
    (hasRole("DEVELOPER") &&
      empIdEquals(task.assigned_to, user?.e_id) &&
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
              <DialogDescription>
                {task.description
                  ? task.description.slice(0, 140)
                  : "Task details and actions"}
              </DialogDescription>
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
        {loadError && (
          <div className="mx-6 mt-2 p-3 rounded bg-destructive/10 text-destructive text-sm flex items-center justify-between">
            <div className="pr-4">
              Employee/user data blocked by server: {loadError}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadEmployees()}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

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
              {/* Assigned-to (editable by MANAGER/ADMIN) */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                {hasRole("MANAGER") || hasRole("ADMIN") ? (
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
                    {developersList.map((d) => (
                      <option key={d.e_id} value={d.e_id}>
                        {d.name} ({d.e_id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground">
                    {(() => {
                      const asg = employees.find((e) =>
                        empIdEquals(e.e_id, task.assigned_to)
                      );
                      return asg?.name || task.assigned_to || "Not assigned";
                    })()}
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
                    {dedupedManagers.map((m) => (
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
                    // Resolve creator name from loaded employees
                    const cr =
                      employees.find((e) =>
                        empIdEquals(e.e_id, task.created_by)
                      ) || creator;
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
                <input
                  id="remark-file-input"
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    setSelectedFile(
                      e.target.files && e.target.files[0]
                        ? e.target.files[0]
                        : null
                    )
                  }
                />
                <Button
                  size="icon"
                  onClick={handleAddRemark}
                  disabled={isSubmitting || !newRemark.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <label htmlFor="remark-file-input">
                  <Button size="icon" variant="outline" asChild>
                    <span>
                      <Paperclip className="w-4 h-4" />
                    </span>
                  </Button>
                </label>
                {selectedFile && (
                  <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {selectedFile.name}
                  </div>
                )}
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
                      {(remark.user_name && remark.user_name.charAt(0)) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {remark.user_name || "Unknown"}
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
                      <div className="mt-2 flex items-center gap-2 text-xs text-primary">
                        <Paperclip className="w-3 h-3" />
                        <span
                          className="underline cursor-pointer"
                          onClick={async () => {
                            try {
                              if (!remark.file_id) {
                                // no file_id available, nothing to download
                                return;
                              }
                              const { blob, filename } = await (
                                await import("@/lib/api")
                              ).downloadFile(remark.file_id, token);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download =
                                filename || remark.attachment || "download";
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                            } catch (e) {
                              console.error("Download failed", e);
                            }
                          }}
                        >
                          {remark.attachment}
                        </span>
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
