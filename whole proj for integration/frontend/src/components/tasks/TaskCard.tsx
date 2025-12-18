import React from "react";
import { motion } from "framer-motion";
import { Task } from "@/types";
import { mockEmployees } from "@/data/mockData";
import { fetchEmployees } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MessageSquare,
  User,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onClick }) => {
  const { token } = useAuth();
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

  const assignee = employees.find(
    (e) => String(e.e_id) === String(task.assigned_to)
  );
  const reviewer = employees.find(
    (e) => String(e.e_id) === String(task.reviewer)
  );

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

  const expectedClosureDate = task.expected_closure
    ? new Date(task.expected_closure)
    : null;
  const isExpectedClosureValid = expectedClosureDate
    ? !isNaN(expectedClosureDate.getTime()) && isValid(expectedClosureDate)
    : false;

  const isOverdue = isExpectedClosureValid
    ? expectedClosureDate! < new Date() && task.status !== "DONE"
    : false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "p-3 cursor-pointer transition-all duration-200 hover:shadow-md bg-card border-border/50",
          isDragging && "task-card-dragging rotate-2",
          isOverdue && "border-destructive/50"
        )}
      >
        {/* Task ID & Priority */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-muted-foreground">
            {task.t_id}
          </span>
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
        </div>

        {/* Title */}
        <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Assignee */}
            {assignee && (
              <div className="flex items-center gap-1" title={assignee.name}>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {assignee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Reviewer */}
            {reviewer && (
              <div
                className="flex items-center gap-1"
                title={`Reviewer: ${reviewer.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-review/10 flex items-center justify-center">
                  <User className="w-3 h-3 text-review" />
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

            {/* Due date */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {isOverdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              <span>
                {isExpectedClosureValid
                  ? format(expectedClosureDate!, "MMM d")
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default TaskCard;
