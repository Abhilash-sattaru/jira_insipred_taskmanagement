import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/contexts/TaskContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Task, TaskStatus } from "@/types";
import TaskCard from "@/components/tasks/TaskCard";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn, empIdEquals } from "@/lib/utils";

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TO_DO", title: "To Do", color: "todo" },
  { id: "IN_PROGRESS", title: "In Progress", color: "inprogress" },
  { id: "REVIEW", title: "Review", color: "review" },
  { id: "DONE", title: "Done", color: "done" },
];

const TasksBoard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { tasks, updateTaskStatus } = useTasks();
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | TaskStatus | "OVERDUE"
  >("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter tasks based on role, search and UI filters
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Role-based visibility
      if (hasRole("ADMIN")) return matchesSearch;
      if (hasRole("MANAGER")) {
        return (
          matchesSearch &&
          (task.created_by === user?.e_id ||
            task.assigned_by === user?.e_id ||
            task.reviewer === user?.e_id ||
            empIdEquals(task.assigned_to, user?.e_id))
        );
      }
      return matchesSearch && empIdEquals(task.assigned_to, user?.e_id);
    })
    .filter((task) => {
      // Status filter
      if (statusFilter === "ALL") return true;
      if (statusFilter === "OVERDUE") {
        if (!task.expected_closure) return false;
        const raw = task.expected_closure;
        const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
        const d = dateOnly ? new Date(raw + "T23:59:59") : new Date(raw);
        if (isNaN(d.getTime())) return false;
        return d < new Date() && task.status !== "DONE";
      }
      return task.status === statusFilter;
    });
  const priorityRank: Record<string, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };

  const getTasksByColumn = (status: TaskStatus) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort(
        (a, b) =>
          (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3)
      );

  const canDragTask = (
    task: Task,
    fromStatus: TaskStatus,
    toStatus: TaskStatus
  ): boolean => {
    // Admin: broad permissions (manage tasks) but follow reviewer flow for approvals
    if (hasRole("ADMIN")) {
      // Admins may move tasks freely for demo purposes
      return true;
    }

    // Developer (assigned employee): allowed transitions:
    // TO_DO -> IN_PROGRESS
    // IN_PROGRESS -> REVIEW (to submit for review)
    if (hasRole("DEVELOPER")) {
      if (task.assigned_to !== user?.e_id) return false;
      if (fromStatus === "TO_DO" && toStatus === "IN_PROGRESS") return true;
      if (fromStatus === "IN_PROGRESS" && toStatus === "REVIEW") return true;
      return false;
    }

    // Reviewer (usually manager assigned as reviewer) can move REVIEW -> IN_PROGRESS (send back) or REVIEW -> DONE (approve)
    if (task.reviewer === user?.e_id || hasRole("MANAGER")) {
      if (
        fromStatus === "REVIEW" &&
        (toStatus === "IN_PROGRESS" || toStatus === "DONE")
      )
        return true;
      // Managers may also move tasks within their team between TO_DO/IN_PROGRESS for workflow adjustments
      if (hasRole("MANAGER")) {
        if (fromStatus === "TO_DO" && toStatus === "IN_PROGRESS") return true;
        if (fromStatus === "IN_PROGRESS" && toStatus === "REVIEW") return true;
      }
      return false;
    }

    return false;
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) return;

    const { draggableId, source, destination } = result;

    if (source.droppableId === destination.droppableId) return;

    const task = tasks.find((t) => t.t_id === draggableId);
    if (!task) return;

    const fromStatus = source.droppableId as TaskStatus;
    const toStatus = destination.droppableId as TaskStatus;

    if (!canDragTask(task, fromStatus, toStatus)) {
      toast({
        title: "Action Not Allowed",
        description: "You do not have permission to change this task status.",
        variant: "destructive",
      });
      return;
    }

    // If moving from REVIEW to IN_PROGRESS, require a remark
    if (fromStatus === "REVIEW" && toStatus === "IN_PROGRESS") {
      setSelectedTask(task);
      return;
    }

    updateTaskStatus(draggableId, toStatus, user?.e_id || "");

    addNotification({
      type: toStatus === "DONE" ? "TASK_COMPLETED" : "STATUS_CHANGED",
      title: toStatus === "DONE" ? "Task Completed!" : "Task Status Updated",
      message: `"${task.title}" moved to ${toStatus.replace("_", " ")}`,
      task_id: draggableId,
    });

    toast({
      title: "Task Updated",
      description: `"${task.title}" moved to ${toStatus.replace("_", " ")}`,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks Board</h1>
          <p className="text-muted-foreground">
            Drag and drop to update task status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-secondary/50"
            />
          </div>
          {/* Filters */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-secondary/50 text-sm px-2 py-1 rounded"
            aria-label="Filter by status"
          >
            <option value="ALL">All status</option>
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          {(hasRole("ADMIN") || hasRole("MANAGER")) && (
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = getTasksByColumn(column.id);

            return (
              <div key={column.id} className="flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-t-xl border-b-2",
                    `border-${column.color} bg-${column.color}/10`
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full bg-${column.color}`}
                    />
                    <h3 className="font-semibold text-foreground">
                      {column.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${column.color}/20 text-${column.color}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-2 rounded-b-xl bg-secondary/20 transition-all duration-200 space-y-2 min-h-[400px]",
                        snapshot.isDraggingOver && "kanban-column-hover",
                        isDragging && !snapshot.isDraggingOver && "opacity-60"
                      )}
                    >
                      <AnimatePresence>
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.t_id}
                            draggableId={task.t_id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard
                                  task={task}
                                  isDragging={snapshot.isDragging}
                                  onClick={() => setSelectedTask(task)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}

                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                          No tasks
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modals */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default TasksBoard;
