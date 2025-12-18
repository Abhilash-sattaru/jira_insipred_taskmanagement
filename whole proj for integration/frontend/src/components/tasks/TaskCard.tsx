import React from "react";
import { motion } from "framer-motion";
import { Task } from "@/types";
import { mockEmployees } from "@/data/mockData";
import { fetchEmployees } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageSquare,
  User,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { format, isValid, formatDistanceToNowStrict } from "date-fns";
import { cn, empIdEquals } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onClick }) => {
  const { token, user } = useAuth();
  const [employees, setEmployees] =
    React.useState<typeof mockEmployees>(mockEmployees);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const data: any = await fetchEmployees(token || null);
        if (!mounted) return;
        if (Array.isArray(data)) {
          setEmployees(
            data.map((e: any) => ({
              ...e,
              e_id: String(e.e_id),
            }))
          );
        }
      } catch (err) {
        // keep mockEmployees
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const reviewer = employees.find((e) => empIdEquals(e.e_id, task.reviewer));

  const getPriorityIcon = () => {
    switch (task.priority) {
      case "HIGH":
        return <ArrowUp className="w-3 h-3" />;
      case "MEDIUM":
        return <ArrowRight className="w-3 h-3" />;
      case "LOW":
        return <ArrowDown className="w-3 h-3" />;
    }
  };

  // Parse expected_closure; if it's a date-only string (YYYY-MM-DD), treat as end of day
  let expectedClosureDate: Date | null = null;
  if (task.expected_closure) {
    const raw = task.expected_closure;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    try {
      expectedClosureDate = dateOnly
        ? new Date(raw + "T23:59:59")
        : new Date(raw);
    } catch (e) {
      expectedClosureDate = null;
    }
  }

  const isExpectedClosureValid = expectedClosureDate
    ? !isNaN(expectedClosureDate.getTime()) && isValid(expectedClosureDate)
    : false;

  const isOverdue = isExpectedClosureValid
    ? expectedClosureDate! < new Date() && task.status !== "DONE"
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.18 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 hover:shadow-lg bg-card border-border/40",
          "glass-card",
          "task-hover",
          isDragging && "task-card-dragging rotate-2",
          isOverdue && "border-destructive/50",
          "accent-strip"
        )}
      >
        {/* Task ID & Priority */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">
            {task.t_id}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium",
                task.priority === "HIGH" && "priority-high",
                task.priority === "MEDIUM" && "priority-medium",
                task.priority === "LOW" && "priority-low"
              )}
            >
              {getPriorityIcon()}
              {task.priority}
            </span>

            <Badge
              variant={
                isOverdue
                  ? "destructive"
                  : task.status === "DONE"
                  ? "secondary"
                  : task.status === "REVIEW"
                  ? "outline"
                  : "default"
              }
              className="!px-2 !py-0.5 text-[11px]"
            >
              {isOverdue ? "OVERDUE" : task.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 text-gradient">
          {task.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Reviewer */}
            {reviewer && (
              <div
                className="flex items-center gap-2"
                title={`Reviewer: ${reviewer.name}`}
              >
                <Avatar>
                  <AvatarFallback className="text-xs">
                    {(reviewer.name || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {reviewer.name || "Not assigned"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Reviewer
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Comments count */}
            {task.remarks && task.remarks.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">{task.remarks.length}</span>
              </div>
            )}

            {/* Due date (date + time) */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              <div className="flex flex-col">
                <span>
                  {isExpectedClosureValid
                    ? format(expectedClosureDate!, "MMM d, h:mm a")
                    : "—"}
                </span>
                {isOverdue && isExpectedClosureValid && (
                  <span className="text-[10px] text-destructive">
                    Overdue ·{" "}
                    {formatDistanceToNowStrict(expectedClosureDate!, {
                      unit: "minute",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TaskCard;
