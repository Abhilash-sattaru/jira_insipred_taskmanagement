const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type AuthResponse = {
  access_token: string;
  token_type: string;
  is_first_login?: boolean;
};

export async function loginRequest(
  employeeId: string,
  password: string
): Promise<AuthResponse> {
  let numericId: number | null = null;
  if (/^[0-9]+$/.test(employeeId)) {
    numericId = Number(employeeId);
  } else {
    const m = employeeId.match(/(\d+)/);
    if (m) numericId = Number(m[0]);
  }

  if (numericId === null || Number.isNaN(numericId)) {
    throw new Error(
      "Employee ID must contain a numeric employee identifier (e.g. '1' or 'EMP001')."
    );
  }

  const url = `${BASE_URL}/api/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ e_id: numericId, password }),
  });
  if (!res.ok) {
    let text: string;
    try {
      text = await res.text();
    } catch {
      text = res.statusText || `HTTP ${res.status}`;
    }
    throw new Error(text || "Login failed");
  }
  return res.json();
}

export function authHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTasks(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/tasks/`, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTaskAPI(payload: any, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/tasks/`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create task");
  return res.json();
}

export async function patchTaskAPI(
  taskId: number | string,
  payload: any,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update task");
  return res.json();
}

// Remarks
export async function createRemarkAPI(
  taskId: number | string,
  comment: string,
  token?: string | null
) {
  const params = new URLSearchParams();
  params.set("task_id", String(taskId));
  params.set("comment", comment);

  const res = await fetch(`${BASE_URL}/api/remarks/?${params.toString()}`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to create remark");
  }
  return res.json();
}

export async function fetchRemarksAPI(
  taskId: number | string,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/remarks/task/${taskId}/`, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res
      .text()
      .catch(() => res.statusText || `HTTP ${res.status}`);
    throw new Error(txt || "Failed to fetch remarks");
  }
  return res.json();
}

async function parseErrorResponse(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j && j.detail)
      return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    if (j && j.message) return j.message;
    return JSON.stringify(j);
  } catch {
    try {
      return await res.text();
    } catch {
      return res.statusText || `HTTP ${res.status}`;
    }
  }
}

// Employees
export async function fetchEmployees(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/employees/`, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res
      .text()
      .catch(() => res.statusText || `HTTP ${res.status}`);
    throw new Error(txt || "Failed to fetch employees");
  }
  return res.json();
}

export async function fetchMyEmployees(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/employees/me/`, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res
      .text()
      .catch(() => res.statusText || `HTTP ${res.status}`);
    throw new Error(txt || "Failed to fetch my employees");
  }
  return res.json();
}

export async function createEmployee(payload: any, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/employees/`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to create employee");
  }
  return res.json();
}

export async function updateEmployee(
  e_id: string | number,
  payload: any,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/employees/${e_id}/`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to update employee");
  }
  return res.json();
}

export async function deleteEmployee(
  e_id: string | number,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/employees/${e_id}/`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to delete employee");
  }
  return res.json();
}

// Users
export async function fetchUsers(token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/users/`, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const txt = await res
      .text()
      .catch(() => res.statusText || `HTTP ${res.status}`);
    throw new Error(txt || "Failed to fetch users");
  }
  return res.json();
}

export async function createUser(payload: any, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/users/`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to create user");
  }
  return res.json();
}

export async function updateUser(
  e_id: string | number,
  payload: any,
  token?: string | null
) {
  const res = await fetch(`${BASE_URL}/api/users/${e_id}/`, {
    method: "PUT",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(e_id: string | number, token?: string | null) {
  const res = await fetch(`${BASE_URL}/api/users/${e_id}/`, {
    method: "DELETE",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    throw new Error(msg || "Failed to delete user");
  }
  return res.json();
}

export default BASE_URL;
