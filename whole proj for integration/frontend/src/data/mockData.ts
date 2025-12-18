import { Employee, User, Task, Notification, Role } from '@/types';

// Indian names for demo
export const mockEmployees: Employee[] = [
  { e_id: 'EMP001', name: 'Arjun Sharma', email: 'arjun.sharma@ust.com', designation: 'Senior Developer', mgr_id: 'EMP002', avatar: '', department: 'Engineering' },
  { e_id: 'EMP002', name: 'Priya Patel', email: 'priya.patel@ust.com', designation: 'Engineering Manager', avatar: '', department: 'Engineering' },
  { e_id: 'EMP003', name: 'Rahul Verma', email: 'rahul.verma@ust.com', designation: 'Junior Developer', mgr_id: 'EMP002', avatar: '', department: 'Engineering' },
  { e_id: 'EMP004', name: 'Sneha Gupta', email: 'sneha.gupta@ust.com', designation: 'Full Stack Developer', mgr_id: 'EMP002', avatar: '', department: 'Engineering' },
  { e_id: 'EMP005', name: 'Vikram Singh', email: 'vikram.singh@ust.com', designation: 'DevOps Engineer', mgr_id: 'EMP006', avatar: '', department: 'Infrastructure' },
  { e_id: 'EMP006', name: 'Anjali Menon', email: 'anjali.menon@ust.com', designation: 'Infrastructure Lead', avatar: '', department: 'Infrastructure' },
  { e_id: 'EMP007', name: 'Karthik Nair', email: 'karthik.nair@ust.com', designation: 'QA Engineer', mgr_id: 'EMP008', avatar: '', department: 'Quality' },
  { e_id: 'EMP008', name: 'Deepa Krishnan', email: 'deepa.krishnan@ust.com', designation: 'QA Manager', avatar: '', department: 'Quality' },
  { e_id: 'EMP009', name: 'Amit Reddy', email: 'amit.reddy@ust.com', designation: 'UI/UX Designer', mgr_id: 'EMP002', avatar: '', department: 'Design' },
  { e_id: 'EMP010', name: 'Meera Iyer', email: 'meera.iyer@ust.com', designation: 'System Admin', avatar: '', department: 'IT' },
];

export const mockUsers: User[] = [
  { e_id: 'ADMIN001', roles: ['ADMIN'], status: 'ACTIVE', employee: { e_id: 'ADMIN001', name: 'Rajesh Kumar', email: 'admin@ust.com', designation: 'System Administrator', department: 'IT' } },
  { e_id: 'EMP002', roles: ['MANAGER'], status: 'ACTIVE', employee: mockEmployees[1] },
  { e_id: 'EMP006', roles: ['MANAGER'], status: 'ACTIVE', employee: mockEmployees[5] },
  { e_id: 'EMP008', roles: ['MANAGER', 'DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[7] },
  { e_id: 'EMP001', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[0] },
  { e_id: 'EMP003', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[2] },
  { e_id: 'EMP004', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[3] },
  { e_id: 'EMP005', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[4] },
  { e_id: 'EMP007', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[6] },
  { e_id: 'EMP009', roles: ['DEVELOPER'], status: 'ACTIVE', employee: mockEmployees[8] },
];

export const mockTasks: Task[] = [
  {
    t_id: 'TASK001',
    title: 'Implement User Authentication',
    description: 'Create JWT-based authentication system with login and logout functionality',
    created_by: 'EMP002',
    assigned_to: 'EMP001',
    assigned_by: 'EMP002',
    assigned_at: '2024-01-15T10:00:00Z',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    reviewer: 'EMP002',
    expected_closure: '2024-01-25T18:00:00Z',
    remarks: [
      { id: 'REM001', task_id: 'TASK001', user_id: 'EMP001', user_name: 'Arjun Sharma', content: 'Started working on JWT implementation', created_at: '2024-01-16T09:00:00Z' },
    ]
  },
  {
    t_id: 'TASK002',
    title: 'Design Dashboard UI',
    description: 'Create modern dashboard with charts and task overview',
    created_by: 'EMP002',
    assigned_to: 'EMP009',
    assigned_by: 'EMP002',
    assigned_at: '2024-01-14T09:00:00Z',
    priority: 'MEDIUM',
    status: 'REVIEW',
    reviewer: 'EMP002',
    expected_closure: '2024-01-22T18:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK003',
    title: 'Setup CI/CD Pipeline',
    description: 'Configure Jenkins pipeline for automated deployment',
    created_by: 'EMP006',
    assigned_to: 'EMP005',
    assigned_by: 'EMP006',
    assigned_at: '2024-01-13T11:00:00Z',
    priority: 'HIGH',
    status: 'TO_DO',
    reviewer: 'EMP006',
    expected_closure: '2024-01-28T18:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK004',
    title: 'Write Unit Tests',
    description: 'Add comprehensive unit tests for all API endpoints',
    created_by: 'EMP008',
    assigned_to: 'EMP007',
    assigned_by: 'EMP008',
    assigned_at: '2024-01-12T14:00:00Z',
    priority: 'MEDIUM',
    status: 'DONE',
    reviewer: 'EMP008',
    expected_closure: '2024-01-20T18:00:00Z',
    actual_closure: '2024-01-19T16:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK005',
    title: 'Database Schema Design',
    description: 'Design and implement database schema for employee management',
    created_by: 'EMP002',
    assigned_to: 'EMP004',
    assigned_by: 'EMP002',
    assigned_at: '2024-01-10T10:00:00Z',
    priority: 'HIGH',
    status: 'DONE',
    reviewer: 'EMP002',
    expected_closure: '2024-01-18T18:00:00Z',
    actual_closure: '2024-01-17T14:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK006',
    title: 'API Documentation',
    description: 'Create comprehensive API documentation using Swagger',
    created_by: 'EMP002',
    assigned_to: 'EMP003',
    assigned_by: 'EMP002',
    assigned_at: '2024-01-16T10:00:00Z',
    priority: 'LOW',
    status: 'TO_DO',
    reviewer: 'EMP002',
    expected_closure: '2024-01-30T18:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK007',
    title: 'Performance Optimization',
    description: 'Optimize database queries and API response times',
    created_by: 'EMP006',
    assigned_to: 'EMP005',
    assigned_by: 'EMP006',
    assigned_at: '2024-01-17T09:00:00Z',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    reviewer: 'EMP006',
    expected_closure: '2024-02-01T18:00:00Z',
    remarks: []
  },
  {
    t_id: 'TASK008',
    title: 'Mobile Responsive Design',
    description: 'Make the application fully responsive for mobile devices',
    created_by: 'EMP002',
    priority: 'MEDIUM',
    status: 'TO_DO',
    expected_closure: '2024-02-05T18:00:00Z',
    remarks: []
  },
];

export const mockNotifications: Notification[] = [
  { id: 'NOT001', type: 'TASK_ASSIGNED', title: 'New Task Assigned', message: 'You have been assigned "Implement User Authentication"', task_id: 'TASK001', read: false, created_at: '2024-01-15T10:05:00Z' },
  { id: 'NOT002', type: 'STATUS_CHANGED', title: 'Task Status Updated', message: '"Design Dashboard UI" moved to Review', task_id: 'TASK002', read: false, created_at: '2024-01-18T15:30:00Z' },
  { id: 'NOT003', type: 'TASK_COMPLETED', title: 'Task Completed', message: '"Write Unit Tests" has been completed', task_id: 'TASK004', read: true, created_at: '2024-01-19T16:00:00Z' },
  { id: 'NOT004', type: 'REMARK_ADDED', title: 'New Comment', message: 'Arjun added a comment on "Implement User Authentication"', task_id: 'TASK001', read: false, created_at: '2024-01-16T09:00:00Z' },
];

export const getEmployeeById = (id: string): Employee | undefined => 
  mockEmployees.find(e => e.e_id === id);

export const getUserById = (id: string): User | undefined =>
  mockUsers.find(u => u.e_id === id);

export const getTasksByAssignee = (assigneeId: string): Task[] =>
  mockTasks.filter(t => t.assigned_to === assigneeId);

export const getTasksByManager = (managerId: string): Task[] =>
  mockTasks.filter(t => t.created_by === managerId || t.assigned_by === managerId);

export const getEmployeesByManager = (managerId: string): Employee[] =>
  mockEmployees.filter(e => e.mgr_id === managerId);

export const hasRole = (user: User | null, role: Role): boolean =>
  user?.roles.includes(role) ?? false;
