import React from "react";
import { motion } from "framer-motion";
import { useTasks } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEmployees, fetchMyEmployees } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  ListTodo,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { empIdEquals } from "@/lib/utils";

const AnalyticsPage: React.FC = () => {
  const { tasks } = useTasks();
  const [employees, setEmployees] = React.useState<any[]>([]);
  const { token, hasRole } = useAuth();

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        let data: any = [];
        if (hasRole && hasRole("MANAGER")) {
          data = await fetchMyEmployees(token || null);
        } else if (hasRole && hasRole("ADMIN")) {
          data = await fetchEmployees(token || null);
        } else {
          data = [];
        }
        if (!mounted) return;
        if (Array.isArray(data)) {
          setEmployees(data.map((e: any) => ({ ...e, e_id: String(e.e_id) })));
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Task stats by status
  const statusData = [
    {
      name: "To Do",
      value: tasks.filter((t) => t.status === "TO_DO").length,
      fill: "hsl(217, 91%, 60%)",
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      fill: "hsl(45, 93%, 47%)",
    },
    {
      name: "Review",
      value: tasks.filter((t) => t.status === "REVIEW").length,
      fill: "hsl(25, 95%, 53%)",
    },
    {
      name: "Done",
      value: tasks.filter((t) => t.status === "DONE").length,
      fill: "hsl(142, 76%, 36%)",
    },
  ];

  // Priority breakdown
  const priorityData = [
    {
      name: "High",
      value: tasks.filter((t) => t.priority === "HIGH").length,
      color: "hsl(0, 84%, 60%)",
    },
    {
      name: "Medium",
      value: tasks.filter((t) => t.priority === "MEDIUM").length,
      color: "hsl(38, 92%, 50%)",
    },
    {
      name: "Low",
      value: tasks.filter((t) => t.priority === "LOW").length,
      color: "hsl(142, 76%, 36%)",
    },
  ];

  // Tasks per employee
  const employeeData = employees.slice(0, 6).map((emp) => ({
    name: (emp.name || "").split(" ")[0] || emp.e_id,
    tasks: tasks.filter((t) => empIdEquals(t.assigned_to, emp.e_id)).length,
    completed: tasks.filter(
      (t) => empIdEquals(t.assigned_to, emp.e_id) && t.status === "DONE"
    ).length,
  }));

  // Weekly trend (mock data)
  const weeklyTrend = [
    { day: "Mon", created: 3, completed: 2 },
    { day: "Tue", created: 5, completed: 4 },
    { day: "Wed", created: 2, completed: 3 },
    { day: "Thu", created: 4, completed: 2 },
    { day: "Fri", created: 6, completed: 5 },
    { day: "Sat", created: 1, completed: 3 },
    { day: "Sun", created: 0, completed: 1 },
  ];

  // Department distribution
  const departmentData = [
    { name: "Engineering", value: 4 },
    { name: "Infrastructure", value: 2 },
    { name: "Quality", value: 2 },
    { name: "Design", value: 1 },
    { name: "IT", value: 1 },
  ];

  const COLORS = [
    "hsl(250, 84%, 60%)",
    "hsl(217, 91%, 60%)",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(0, 84%, 60%)",
  ];

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ListTodo,
      color: "text-primary",
    },
    {
      title: "Completed",
      value: tasks.filter((t) => t.status === "DONE").length,
      icon: CheckCircle2,
      color: "text-done",
    },
    {
      title: "In Progress",
      value: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      icon: Clock,
      color: "text-inprogress",
    },
    {
      title: "Team Members",
      value: employees.length,
      icon: Users,
      color: "text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground">
          Track task progress and team performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${stat.color}`}
                  >
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Task Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Priority Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Task Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stackId="1"
                      stroke="hsl(217, 91%, 60%)"
                      fill="hsl(217, 91%, 60% / 0.3)"
                      name="Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="2"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36% / 0.3)"
                      name="Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks per Employee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Tasks per Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="tasks"
                      fill="hsl(250, 84%, 60%)"
                      name="Assigned"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      fill="hsl(142, 76%, 36%)"
                      name="Completed"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">
              Team Distribution by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsPage;
