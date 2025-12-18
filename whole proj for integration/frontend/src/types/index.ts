export type Role = "ADMIN" | "MANAGER" | "DEVELOPER";
export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface Employee {
  e_id: string;
  name: string;
  email: string;
  designation: string;
  mgr_id?: string;
  avatar?: string;
  department?: string;
}

export interface User {
  e_id: string;
  password?: string;
  roles: Role[];
  status: UserStatus;
  employee?: Employee;
}

export interface Task {
  t_id: string;
  title: string;
  description: string;
  created_by: string;
  assigned_to?: string;
  assigned_by?: string;
  assigned_at?: string;
  updated_by?: string;
  updated_at?: string;
  priority: Priority;
  status: TaskStatus;
  reviewer?: string;
  expected_closure: string;
  actual_closure?: string;
  remarks?: Remark[];
}

export interface Remark {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  attachment?: string;
  file_id?: string | null;
}

export interface Notification {
  id: string;
  type: "TASK_ASSIGNED" | "STATUS_CHANGED" | "TASK_COMPLETED" | "REMARK_ADDED";
  title: string;
  message: string;
  task_id?: string;
  read: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskStats {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}
