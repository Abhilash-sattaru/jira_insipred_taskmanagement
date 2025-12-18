import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Task, TaskStatus, Remark } from "@/types";
import { mockTasks } from "@/data/mockData";
import { fetchTasks, createTaskAPI, patchTaskAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "t_id" | "remarks">) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    updatedBy: string,
    remark?: string
  ) => void;
  addRemark: (
    taskId: string,
    remark: Omit<Remark, "id" | "created_at">
  ) => void;
  getTaskById: (taskId: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { token, hasRole } = useAuth();

  // Load tasks from backend when token is available
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      try {
        const data = await fetchTasks(token);
        // Map backend TaskResponse to frontend Task shape
        const mapped: Task[] = (data || []).map((t: any) => ({
          t_id: String(t.t_id),
          title: t.title,
          description: t.description,
          created_by: String(t.created_by),
          assigned_to:
            t.assigned_to != null ? String(t.assigned_to) : undefined,
          assigned_by: undefined,
          assigned_at: undefined,
          updated_by: undefined,
          updated_at: t.updated_at
            ? new Date(t.updated_at).toISOString()
            : undefined,
          priority: t.priority,
          status: t.status,
          reviewer: t.reviewer != null ? String(t.reviewer) : undefined,
          expected_closure: t.expected_closure,
          actual_closure: t.actual_closure,
          remarks: [],
        }));
        if (mounted) setTasks(mapped);
      } catch (err) {
        console.warn("Failed to load tasks from API, using mock data", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const addTask = useCallback(
    async (task: Omit<Task, "t_id" | "remarks">) => {
      // Try create via API, fallback to local mock
      const normalizeId = (val: any): number | null => {
        if (val == null) return null;
        if (typeof val === "number") return val;
        const s = String(val);
        const m = s.match(/(\d+)/);
        if (m) return Number(m[0]);
        if (/^[0-9]+$/.test(s)) return Number(s);
        return null;
      };

      // Only attempt to create via API if user has permissions
      const canCreateRemote =
        token && (hasRole?.("ADMIN") || hasRole?.("MANAGER"));
      if (canCreateRemote) {
        try {
          const payload = {
            title: task.title,
            description: task.description,
            priority: task.priority,
            // ensure expected_closure is an ISO datetime string
            expected_closure: task.expected_closure
              ? new Date(task.expected_closure).toISOString()
              : null,
            assigned_to: normalizeId(task.assigned_to),
            reviewer: normalizeId(task.reviewer),
          };
          const created = await createTaskAPI(payload, token);
          const newTask: Task = {
            t_id: String(created.t_id),
            title: created.title,
            description: created.description,
            created_by: String(created.created_by),
            assigned_to:
              created.assigned_to != null
                ? String(created.assigned_to)
                : undefined,
            assigned_by: undefined,
            assigned_at: undefined,
            updated_by: undefined,
            updated_at: created.updated_at
              ? new Date(created.updated_at).toISOString()
              : undefined,
            priority: created.priority,
            status: created.status,
            reviewer:
              created.reviewer != null ? String(created.reviewer) : undefined,
            expected_closure: created.expected_closure,
            actual_closure: created.actual_closure,
            remarks: [],
          };
          setTasks((prev) => [...prev, newTask]);
          return;
        } catch (err) {
          console.warn(
            "Create task via API failed, falling back to local",
            err
          );
        }
      }

      // local fallback
      const newTask: Task = {
        ...task,
        t_id: `TASK${String(tasks.length + 1).padStart(3, "0")}`,
        remarks: [],
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [tasks.length, token]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      const normalizeId = (val: any): number | null => {
        if (val == null) return null;
        if (typeof val === "number") return val;
        const s = String(val);
        const m = s.match(/(\d+)/);
        if (m) return Number(m[0]);
        if (/^[0-9]+$/.test(s)) return Number(s);
        return null;
      };

      const payload: any = { ...updates };
      if (payload.assigned_to !== undefined) {
        payload.assigned_to = normalizeId(payload.assigned_to);
      }
      if (payload.reviewer !== undefined) {
        payload.reviewer = normalizeId(payload.reviewer);
      }
      if (payload.expected_closure !== undefined) {
        // convert date-only strings to ISO
        const v = payload.expected_closure as any;
        payload.expected_closure = v ? new Date(v).toISOString() : null;
      }

      if (token) {
        try {
          // Try to patch via API (taskId may be a string like 'TASK001' or a numeric id)
          await patchTaskAPI(taskId, payload, token);
        } catch (err) {
          console.warn("Patch task API failed", err);
        }
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.t_id === taskId
            ? { ...t, ...updates, updated_at: new Date().toISOString() }
            : t
        )
      );
    },
    [token]
  );

  const deleteTask = useCallback((taskId: string) => {
    // TODO: call API delete endpoint when available
    setTasks((prev) => prev.filter((t) => t.t_id !== taskId));
  }, []);

  const updateTaskStatus = useCallback(
    async (
      taskId: string,
      status: TaskStatus,
      updatedBy: string,
      remark?: string
    ) => {
      // Patch status via API if possible
      if (token) {
        try {
          await patchTaskAPI(taskId, { status }, token);
        } catch (err) {
          console.warn("Failed to update task status via API", err);
        }
      }

      setTasks((prev) =>
        prev.map((t) => {
          if (t.t_id !== taskId) return t;

          const updates: Partial<Task> = {
            status,
            updated_by: updatedBy,
            updated_at: new Date().toISOString(),
          };

          if (status === "DONE") {
            updates.actual_closure = new Date().toISOString();
            // Trigger confetti celebration
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b"],
            });
          }

          let newRemarks = t.remarks || [];
          if (remark) {
            newRemarks = [
              ...newRemarks,
              {
                id: `REM${Date.now()}`,
                task_id: taskId,
                user_id: updatedBy,
                user_name: updatedBy,
                content: remark,
                created_at: new Date().toISOString(),
              },
            ];
          }

          return { ...t, ...updates, remarks: newRemarks };
        })
      );
    },
    [token]
  );

  const addRemark = useCallback(
    (taskId: string, remark: Omit<Remark, "id" | "created_at">) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.t_id !== taskId) return t;
          const newRemark: Remark = {
            ...remark,
            id: `REM${Date.now()}`,
            created_at: new Date().toISOString(),
          };
          return { ...t, remarks: [...(t.remarks || []), newRemark] };
        })
      );
    },
    []
  );

  const getTaskById = useCallback(
    (taskId: string) => {
      return tasks.find((t) => t.t_id === taskId);
    },
    [tasks]
  );

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((t) => t.status === status);
    },
    [tasks]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        addRemark,
        getTaskById,
        getTasksByStatus,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
