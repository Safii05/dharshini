import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Eye, 
  Package,
  PieChart, 
  Settings as SettingsIcon,
  TrendingUp,
  Briefcase,
  Sprout,
  AlertCircle,
  ChevronLeft,
  LogOut,
  Plus,
  Search,
  MoreVertical,
  Filter,
  Calendar,
  Clock,
  X,
  Trash2,
  Star,
  Award
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { useTranslation } from '../hooks/useTranslation';
import DashboardLayout from '../components/DashboardLayout';
import { 
  traineesData as mockTrainees, 
  tasksData as mockTasks, 
  cropStatusData as mockCrops, 
  inventoryData as mockInventory
} from '../services/mockData';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getDashboardStats, 
  getTrainees, 
  addTrainee, 
  deleteTrainee, 
  getTasks, 
  addTask, 
  updateTask, 
  deleteTask, 
  getCrops, 
  getInventory,
  addCrop,
  deleteCrop,
  generateAttendanceSession,
  getAttendanceAnalytics 
} from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface Props {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: Props) => {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, type: 'trainee' | 'task' | 'crop', id: number | null }>({
    isOpen: false,
    type: 'trainee',
    id: null
  });
  const [qrSession, setQrSession] = useState<any>(null);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, t, tk, c, inv] = await Promise.all([
          getDashboardStats().catch(() => ({ data: null })),
          getTrainees().catch(() => ({ data: [] })),
          getTasks().catch(() => ({ data: [] })),
          getCrops().catch(() => ({ data: [] })),
          getInventory().catch(() => ({ data: [] }))
        ]);
        
        setStats(s.data);
        setTrainees(t.data.length > 0 ? t.data : mockTrainees);
        setTasks(tk.data.length > 0 ? tk.data : mockTasks);
        setCrops(c.data.length > 0 ? c.data : mockCrops);
        setInventory(inv.data.length > 0 ? inv.data : mockInventory);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
        setTrainees(mockTrainees);
        setTasks(mockTasks);
        setCrops(mockCrops);
        setInventory(mockInventory);
      }
    };
    const fetchAnalytics = async () => {
      try {
        const res = await getAttendanceAnalytics();
        setAttendanceAnalytics(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance analytics", err);
      }
    };
    fetchData();
    fetchAnalytics();

    const handleVoiceNav = (e: any) => {
      const target = e.detail;
      if (target === 'attendance') {
        setActivePage('attendanceProduction');
      } else {
        const validPages = ['dashboard', 'trainees', 'farmTask', 'cropMonitoring', 'attendanceProduction', 'inventory', 'reports', 'settings'];
        if (validPages.includes(target)) {
          setActivePage(target);
        }
      }
    };
    window.addEventListener('voice-navigate', handleVoiceNav);
    return () => window.removeEventListener('voice-navigate', handleVoiceNav);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'trainees', label: t.trainees, icon: Users },
    { id: 'traineeSkillTracking', label: 'Skill Tracking & Placement', icon: Briefcase },
    { id: 'farmTask', label: t.farmTask, icon: ClipboardList },
    { id: 'cropMonitoring', label: t.cropMonitoring, icon: Eye },
    { id: 'attendanceProduction', label: t.attendance, icon: Calendar },
    { id: 'inventory', label: t.inventory, icon: Package },
    { id: 'reports', label: t.reports, icon: PieChart },
    { id: 'settings', label: t.settings, icon: SettingsIcon },
    { id: 'collapse', label: t.collapse, icon: ChevronLeft },
    { id: 'logout', label: t.logout, icon: LogOut },
  ];

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    // Optimistic update
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updatedTasks);

    try {
      const taskToUpdate = tasks.find(t => t.id === taskId);
      if (taskToUpdate) {
        await updateTask(taskId, { ...taskToUpdate, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to update task status", err);
      // Revert on error
      const originalTasks = await getTasks();
      setTasks(originalTasks.data);
    }
  };

  const handleAddTask = async (task: any) => {
    try {
      const res = await addTask(task);
      setTasks([...tasks, res.data]);
    } catch (err) {
      console.error("Failed to add task", err);
      const id = Math.max(0, ...tasks.map(t => t.id)) + 1;
      setTasks([...tasks, { ...task, id }]);
    }
  };

  const handleAddTrainee = async (trainee: any) => {
    try {
      const res = await addTrainee(trainee);
      setTrainees([...trainees, res.data]);
    } catch (err) {
      console.error("Failed to add trainee", err);
      const id = Math.max(0, ...trainees.map(t => t.id || 0)) + 1;
      setTrainees([...trainees, { ...trainee, id, efficiency: '90%', status: 'Active' }]);
    }
  };

  const handleAddCrop = async (crop: any) => {
    try {
      const res = await addCrop(crop);
      const newCrop = res.data;
      setCrops([...crops, newCrop]);
    } catch (err) {
      console.error("Failed to add crop", err);
      const id = Math.max(0, ...crops.map(c => c.id || 0)) + 1;
      setCrops([...crops, { ...crop, id }]);
    }
  };

  const handleDeleteTrainee = (id: number) => {
    setDeleteModal({ isOpen: true, type: 'trainee', id });
  };

  const handleDeleteTask = (id: number) => {
    setDeleteModal({ isOpen: true, type: 'task', id });
  };

  const handleDeleteCrop = (id: number) => {
    setDeleteModal({ isOpen: true, type: 'crop', id });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteModal;
    if (id === null) return;

    try {
      if (type === 'trainee') {
        await deleteTrainee(id);
        setTrainees(trainees.filter(t => t.id !== id));
      } else if (type === 'task') {
        await deleteTask(id);
        setTasks(tasks.filter(t => t.id !== id));
      } else {
        await deleteCrop(id);
        setCrops(crops.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(`Failed to delete ${type}`, err);
      // Optimistic delete for demo/fallback
      if (type === 'trainee') setTrainees(trainees.filter(t => t.id !== id));
      else if (type === 'task') setTasks(tasks.filter(t => t.id !== id));
      else setCrops(crops.filter(c => c.id !== id));
    } finally {
      setDeleteModal({ isOpen: false, type: 'trainee', id: null });
    }
  };

  const computedStats = {
    totalTrainees: trainees.length,
    activeTasks: tasks.filter(t => t.status !== 'Completed').length,
    cropsMonitored: crops.length,
    productionYield: stats?.productionYield || 0
  };

  const handleGenerateQR = async () => {
    try {
      const res = await generateAttendanceSession();
      setQrSession(res.data);
    } catch (err) {
      console.error("Failed to generate attendance session", err);
      alert("Error: Could not start attendance session. Please check your connection.");
    }
  };

  return (
    <DashboardLayout
      menuItems={menuItems}
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={onLogout}
      userType="Admin"
    >
      {activePage === 'dashboard' && <AdminDashboardHome stats={computedStats} qrSession={qrSession} onGenerateQR={handleGenerateQR} analytics={attendanceAnalytics} />}
      {activePage === 'trainees' && <TraineesSection data={trainees} onAddTrainee={handleAddTrainee} onDeleteTrainee={handleDeleteTrainee} />}
      {activePage === 'traineeSkillTracking' && <TraineeSkillTrackingSection data={trainees} onAddTrainee={handleAddTrainee} />}
      {activePage === 'farmTask' && <FarmTaskSection data={tasks} trainees={trainees} onUpdateTask={handleUpdateTaskStatus} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} />}
      {activePage === 'cropMonitoring' && <CropMonitoringSection data={crops} onAddCrop={handleAddCrop} onDeleteCrop={handleDeleteCrop} />}
      {activePage === 'attendanceProduction' && <AttendanceProductionSection qrSession={qrSession} onGenerateQR={handleGenerateQR} analytics={attendanceAnalytics} />}
      {activePage === 'inventory' && <InventorySection data={inventory} />}
      {activePage === 'reports' && <ReportsSection />}
      {activePage === 'settings' && <AdminSettingsSection />}

      {/* Global Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(4px)' }}>
          <div className="card shadow-2xl fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <AlertCircle size={32} />
            </div>
            <h3 className="font-black text-xl mb-2">Confirm Delete</h3>
            <p className="text-slate-500 mb-8">
              Are you sure you want to delete this {deleteModal.type}? This action cannot be undone and will permanently remove the record from the database.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button 
                className="btn-outline" 
                onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                style={{ padding: '0.75rem' }}
              >
                Cancel
              </button>
              <button 
                className="btn" 
                onClick={confirmDelete}
                style={{ background: '#ef4444', color: 'white', padding: '0.75rem' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// --- Sections ---

const AdminDashboardHome = ({ stats, qrSession, onGenerateQR, analytics }: any) => {
  const { t } = useTranslation();
  
  const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Production (kg)',
      data: [350, 480, 410, 590, 850, 720],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const attendanceChartData = {
    labels: analytics?.dailyStats?.map((s: any) => s.date.split('T')[0]).reverse() || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{ 
      label: 'Attendance Count',
      data: analytics?.dailyStats?.map((s: any) => s.count).reverse() || [95, 88, 92, 90, 85], 
      backgroundColor: '#10b981', 
      borderRadius: 8 
    }]
  };

  return (
    <div>
      <div className="grid-stats">
        <StatCard label={t.totalTrainees} val={stats?.totalTrainees || "142"} icon={Users} color="#3b82f6" />
        <StatCard label={t.activeTasks} val={stats?.activeTasks || "28"} icon={Briefcase} color="#10b981" />
        <StatCard label="Crops Monitored" val={stats?.cropsMonitored || "12"} icon={Sprout} color="#f59e0b" />
        <StatCard label={t.productionYield} val={`${stats?.productionYield || 850} kg`} icon={TrendingUp} color="#6366f1" />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem' }}>
          <div>
            <h3 className="text-xl font-black mb-2">Attendance QR Session</h3>
            <p className="text-slate-500 mb-4">Generate a unique QR code for trainees to scan and mark their attendance for today's session.</p>
            {!qrSession ? (
              <button 
                className="btn btn-primary" 
                onClick={onGenerateQR}
                style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={20} />
                Generate Attendance QR
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                <Clock size={20} />
                <span>Session Active (Expires at {new Date(qrSession.expiresAt).toLocaleTimeString()})</span>
                <button 
                  className="btn-outline" 
                  onClick={onGenerateQR}
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  Regenerate
                </button>
              </div>
            )}
          </div>
          {qrSession && (
            <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', border: '4px solid #10b981', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}>
              <QRCodeSVG value={qrSession.token} size={150} />
              <p style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>SCAN TO MARK ATTENDANCE</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid-charts">
        <div className="card">
          <h3 className="text-lg font-bold mb-6">{t.productionTrends}</h3>
          <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card">
          <h3 className="text-lg font-bold mb-6">{t.attendanceAnalytics}</h3>
          <Bar 
            data={attendanceChartData}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        </div>
      </div>
    </div>
  );
};

const TraineesSection = ({ data, onAddTrainee, onDeleteTrainee }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrainee, setNewTrainee] = useState({ name: '', group_name: 'Organic Farming', status: 'Active' });

  // Helper to get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper for skill level based on mock efficiency
  const getSkillInfo = (eff: string) => {
    const val = parseInt(eff) || 0;
    if (val >= 95) return { label: 'Expert', class: 'skill-expert' };
    if (val >= 85) return { label: 'Advanced', class: 'skill-advanced' };
    if (val >= 75) return { label: 'Intermediate', class: 'skill-intermediate' };
    return { label: 'Beginner', class: 'skill-beginner' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTrainee(newTrainee);
    setIsModalOpen(false);
    setNewTrainee({ name: '', group_name: 'Organic Farming', status: 'Active' });
  };

  return (
    <div className="fade-in">
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="search-bar-inline">
          <Search className="icon" size={20} />
          <input type="text" placeholder="Search trainees by name or program..." />
        </div>
        <button className="btn-add-trainee" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add New Trainee
        </button>
      </div>

      {/* Add Trainee Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card shadow-lg fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="font-black text-xl">Add New Trainee</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="text-sm font-bold block mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newTrainee.name}
                  onChange={(e) => setNewTrainee({ ...newTrainee, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="text-sm font-bold block mb-2">Program / Group</label>
                <select 
                  value={newTrainee.group_name}
                  onChange={(e) => setNewTrainee({ ...newTrainee, group_name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                >
                  <option value="Organic Farming">Organic Farming</option>
                  <option value="Dairy Management">Dairy Management</option>
                  <option value="Poultry Farming">Poultry Farming</option>
                </select>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label className="text-sm font-bold block mb-2">Initial Status</label>
                <select 
                  value={newTrainee.status}
                  onChange={(e) => setNewTrainee({ ...newTrainee, status: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                >
                  <option value="Active">Active</option>
                  <option value="Training">Training</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <button className="btn btn-primary w-100" type="submit" style={{ padding: '1rem', background: '#10b981' }}>
                Add Trainee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ background: 'white' }}>
          <thead>
            <tr>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>TRAINEE NAME</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>PROGRAM</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>TASKS</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>SKILL LEVEL</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>ATTENDANCE</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>STATUS</th>
              <th style={{ background: '#f8fafc', padding: '1.25rem' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any) => {
              const skill = getSkillInfo(row.efficiency);
              const attendance = parseInt(row.efficiency) + 5; // Derived mockup
              return (
                <tr key={row.id}>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div className="avatar">{getInitials(row.name)}</div>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem', color: '#64748b' }}>{row.group_name || "Organic Farming"}</td>
                  <td style={{ padding: '1.25rem', color: '#64748b' }}>{Math.floor(Math.random() * 30) + 5}</td>
                  <td style={{ padding: '1.25rem' }}>
                    <span className={`skill-badge ${skill.class}`}>{skill.label}</span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div className="attendance-bar">
                      <div className="bar-bg">
                        <div className="bar-fill" style={{ width: `${attendance}%` }}></div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{attendance}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div className="status-dot">
                      <div className="dot" style={{ background: row.status === 'Active' ? '#10b981' : '#94a3b8' }}></div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{row.status}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ background: 'none', color: '#94a3b8' }}>
                        <MoreVertical size={20} />
                      </button>
                      <button 
                        onClick={() => onDeleteTrainee(row.id)}
                        style={{ background: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Trainee"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FarmTaskSection = ({ data, trainees, onUpdateTask, onAddTask, onDeleteTask }: any) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'schedule'>('kanban');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ priority: '', assignee: '' });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // New Task State
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    zone: 'Zone A', 
    urgency: 'Medium', 
    status: 'Pending', 
    assignee: '', 
    scheduled_date: new Date().toISOString().split('T')[0] 
  });

  const columns = [
    { title: 'To Do', status: 'Pending' },
    { title: 'In Progress', status: 'In Progress' },
    { title: 'Completed', status: 'Completed' }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const onDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, newStatus: string) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    onUpdateTask(taskId, newStatus);
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTask(newTask);
    setIsNewTaskOpen(false);
    setNewTask({ 
      title: '', 
      zone: 'Zone A', 
      urgency: 'Medium', 
      status: 'Pending', 
      assignee: '', 
      scheduled_date: new Date().toISOString().split('T')[0] 
    });
  };

  const filteredTasks = data.filter((task: any) => {
    const priorityMatch = !filters.priority || task.urgency === filters.priority;
    const assigneeMatch = !filters.assignee || task.assignee === filters.assignee;
    return priorityMatch && assigneeMatch;
  });

  const scheduledTasks = filteredTasks.filter((task: any) => {
    if (!task.scheduled_date) return false;
    const taskDate = task.scheduled_date.split('T')[0];
    return taskDate === selectedDate;
  });

  const assignees = Array.from(new Set(trainees.map((tr: any) => tr.name))) as string[];

  return (
    <div className="fade-in">
      {/* Top Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn-outline ${filterOpen ? 'active' : ''}`}
            onClick={() => setFilterOpen(!filterOpen)}
            style={{ borderColor: filterOpen ? 'var(--primary)' : '#e2e8f0', background: filterOpen ? '#ecfdf5' : 'white' }}
          >
            <Filter size={18} />
            Filter
          </button>
          <button 
            className={`btn-outline ${viewMode === 'schedule' ? 'active' : ''}`}
            onClick={() => setViewMode(viewMode === 'kanban' ? 'schedule' : 'kanban')}
            style={{ borderColor: viewMode === 'schedule' ? 'var(--primary)' : '#e2e8f0', background: viewMode === 'schedule' ? '#ecfdf5' : 'white' }}
          >
            <Calendar size={18} />
            {viewMode === 'kanban' ? 'Schedule' : 'Board View'}
          </button>
        </div>
        

        {filterOpen && (
          <div className="card shadow-lg" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '0.5rem', width: '300px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 className="font-bold">Filters</h4>
              <button onClick={() => setFilterOpen(false)}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label className="text-sm font-bold block mb-2">Priority</label>
              <select 
                value={filters.priority} 
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              >
                <option value="">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="text-sm font-bold block mb-2">Assignee</label>
              <select 
                value={filters.assignee} 
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              >
                <option value="">All Assignees</option>
                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <button 
              className="btn btn-secondary text-sm w-100" 
              onClick={() => { setFilters({ priority: '', assignee: '' }); setFilterOpen(false); }}
              style={{ padding: '0.5rem' }}
            >
              Reset Filters
            </button>
          </div>
        )}

        <button className="btn-add-trainee" onClick={() => setIsNewTaskOpen(true)}>
          <Plus size={20} />
          New Task
        </button>
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card shadow-lg fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 className="font-black text-xl">Create New Task</h3>
              <button onClick={() => setIsNewTaskOpen(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleAddTaskSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="text-sm font-bold block mb-2">Task Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Organic Spray Zone C"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="text-sm font-bold block mb-2">Assignee</label>
                  <select 
                    required
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                  >
                    <option value="">Select Trainee</option>
                    {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-2">Scheduled Date</label>
                  <input 
                    type="date" 
                    required
                    value={newTask.scheduled_date}
                    onChange={(e) => setNewTask({ ...newTask, scheduled_date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label className="text-sm font-bold block mb-2">Priority</label>
                  <select 
                    value={newTask.urgency}
                    onChange={(e) => setNewTask({ ...newTask, urgency: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold block mb-2">Zone</label>
                  <select 
                    value={newTask.zone}
                    onChange={(e) => setNewTask({ ...newTask, zone: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
                  >
                    <option value="Zone A">Zone A</option>
                    <option value="Zone B">Zone B</option>
                    <option value="Zone C">Zone C</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <button className="btn btn-primary w-100" type="submit" style={{ padding: '1rem' }}>
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <div className="kanban-board">
          {columns.map((col) => {
            const tasks = filteredTasks.filter((t: any) => t.status === col.status);
            return (
              <div 
                key={col.status} 
                className="kanban-column"
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, col.status)}
              >
                <div className="kanban-header">
                  <div className="kanban-title">
                    {col.title}
                    <span className="count-badge">{tasks.length}</span>
                  </div>
                  <button style={{ background: 'none', color: '#94a3b8' }}>
                    <Plus size={20} />
                  </button>
                </div>

                <div className="column-content" style={{ minHeight: '500px' }}>
                  {tasks.map((task: any, i: number) => (
                    <div 
                      key={task.id || i} 
                      className="task-card"
                      draggable
                      onDragStart={(e) => onDragStart(e, task.id)}
                      style={{ cursor: 'grab' }}
                    >
                      <span className={`priority-badge priority-${task.urgency.toLowerCase()}`}>
                         {task.urgency}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 className="task-name" style={{ margin: 0 }}>{task.title}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                          title="Delete Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="task-meta">
                        <Clock size={16} />
                        <span>{task.scheduled_date || (task.status === 'Completed' ? 'Yesterday' : 'Today')}</span>
                      </div>
                      <div className="task-footer">
                        <div className="avatar assignee-avatar" style={{ background: col.status === 'Completed' ? '#dcfce7' : '#f1f5f9', color: col.status === 'Completed' ? '#15a34a' : '#64748b' }}>
                          {getInitials(task.assignee || "Rohan Mehra")}
                        </div>
                        <span className="assignee-name">{task.assignee || "Rohan Mehra"}</span>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#cbd5e1', border: '2px dashed #f1f5f9', borderRadius: '1.25rem' }}>
                      No tasks found
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
            <h3 className="font-black text-xl">Schedule View</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontWeight: 700 }}
              />
              <span className="text-slate-500 font-bold">
                {scheduledTasks.length} tasks planned for this day
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {scheduledTasks.length > 0 ? scheduledTasks.map((task: any, i: number) => (
              <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '1rem', background: 'white', borderRadius: '1rem', minWidth: '100px', textAlign: 'center' }}>
                    <span className="text-xs font-bold text-slate-400 block mb-1">STATUS</span>
                    <span className={`badge ${task.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{task.status}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <span className="text-sm text-slate-500">{task.zone} • {task.urgency} Priority</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span className="block font-bold">{task.assignee}</span>
                    <span className="text-xs text-slate-500">Assignee</span>
                  </div>
                  <div className="avatar" style={{ background: 'white' }}>{getInitials(task.assignee)}</div>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '1rem' }}
                    title="Delete Task"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            )) : (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#cbd5e1' }}>
                <Calendar size={48} className="mx-auto mb-4" />
                <p className="text-lg font-bold">No tasks scheduled for {selectedDate}</p>
                <p>Try selecting another date or check the Board View.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CropMonitoringSection = ({ data, onAddCrop, onDeleteCrop }: any) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: '', stage: 'Growth', health: 'Healthy', type: 'Vegetable' });

  const cropImageMap: Record<string, string> = {
    'tomato': '/crops/tomato.png',
    'chilli': '/crops/chilli.png',
    'eggplant': '/crops/eggplant.png',
    'brinjal': '/crops/eggplant.png',
    'cabbage': '/crops/cabbage.png',
    'potato': '/crops/potato.png',
  };

  const getAutoImage = (name: string) => {
    const lowerName = name.toLowerCase().trim();
    if (!lowerName) return '';

    for (const [key, value] of Object.entries(cropImageMap)) {
      if (lowerName.includes(key)) return value;
    }
    
    // Dynamic online fallback for unknown crops
    return `https://loremflickr.com/400/300/agriculture,${encodeURIComponent(lowerName)}/all`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const autoImage = getAutoImage(newCrop.name);
    onAddCrop({ ...newCrop, image: autoImage });
    setIsModalOpen(false);
    setNewCrop({ name: '', stage: 'Growth', health: 'Healthy', type: 'Vegetable' });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="text-2xl font-black">{t.cropMonitoring}</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Add Crop
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {data.map((crop: any, i: number) => {
          // Use stored image or try to auto-map if missing (for legacy data)
          const displayImage = crop.image || getAutoImage(crop.name);
          
          return (
            <div key={crop.id || i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                {displayImage ? (
                  <img src={displayImage} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                    <Sprout size={64} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <button 
                    onClick={() => onDeleteCrop(crop.id)}
                    style={{ background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <h4 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>{crop.name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{t.growthStage}</span>
                    <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{crop.stage}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Health Status</span>
                    <span className={`badge ${crop.health === 'Healthy' ? 'badge-success' : 'badge-danger'}`}>{crop.health}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-xl font-black">Add New Crop</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label className="block text-sm font-bold mb-2">Crop Name</label>
                <input 
                  className="input" 
                  type="text" 
                  value={newCrop.name} 
                  onChange={e => setNewCrop({...newCrop, name: e.target.value})} 
                  placeholder="e.g. Red Tomatoes" 
                  required 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <label className="block text-sm font-bold mb-2">Growth Stage</label>
                  <select className="input" value={newCrop.stage} onChange={e => setNewCrop({...newCrop, stage: e.target.value})}>
                    <option>Sowing</option>
                    <option>Growth</option>
                    <option>Flowering</option>
                    <option>Fruiting</option>
                    <option>Harvesting</option>
                  </select>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label className="block text-sm font-bold mb-2">Health Status</label>
                  <select className="input" value={newCrop.health} onChange={e => setNewCrop({...newCrop, health: e.target.value})}>
                    <option>Healthy</option>
                    <option>At Risk</option>
                    <option>Diseased</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={20} />
                </div>
                <p className="text-xs text-slate-500">
                  Image will be automatically assigned based on the crop name (e.g., "Tomato", "Chilli", etc.)
                </p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add to Monitoring</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TraineeSkillTrackingSection = ({ data, onAddTrainee }: any) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    training_area: 'Organic Farming',
    skills_learned: '',
    progress_percentage: 0,
    supervisor_rating: 5,
    supervisor_remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTrainee({
      ...formData,
      status: 'Active',
      efficiency: `${formData.progress_percentage}%`,
      group_name: formData.training_area
    });
    setIsFormOpen(false);
    setFormData({
      name: '',
      age: '',
      training_area: 'Organic Farming',
      skills_learned: '',
      progress_percentage: 0,
      supervisor_rating: 5,
      supervisor_remarks: ''
    });
  };

  const filteredTrainees = selectedSkill 
    ? data.filter((t: any) => t.skills_learned?.toLowerCase().includes(selectedSkill.toLowerCase()) || t.training_area === selectedSkill)
    : data;

  const getInitials = (name: string) => name.split(' ').map((n: any) => n[0]).join('').toUpperCase();

  return (
    <div className="fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '2rem' }}>
        
        {/* Left Column: Management & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="card shadow-lg bg-emerald-50 border-emerald-100">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-emerald-900">
              <Award className="text-emerald-500" /> Trainee Management
            </h3>
            <p className="text-emerald-700 text-sm mb-6 font-medium">Capture comprehensive skill data and track progress for professional certification.</p>
            <button 
              className="btn btn-primary w-full" 
              onClick={() => setIsFormOpen(true)}
              style={{ background: '#059669', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.4)' }}
            >
              Open Supervisor Form
            </button>
          </div>

          <div className="card shadow-lg">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <Search className="text-primary" /> Employer Requirement
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Required Skill Set</label>
              <select 
                className="input w-full" 
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                style={{ borderRadius: '1rem', fontWeight: 700 }}
              >
                <option value="">All Candidates</option>
                <option value="Organic Farming">Organic Farming</option>
                <option value="Irrigation">Irrigation Handling</option>
                <option value="Crop Monitoring">Crop Monitoring</option>
                <option value="Compost Preparation">Compost Preparation</option>
                <option value="Pest Control">Pest Control</option>
              </select>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <p className="text-xs text-slate-500 italic">Selecting a skill will filter the trainee pool for specialized placement recommendations.</p>
            </div>
          </div>

        </div>

        {/* Right Column: Recommendations */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-slate-900">Recommended Trainees</h3>
            <span className="badge badge-success px-4 py-2" style={{ fontSize: '0.75rem' }}>{filteredTrainees.length} Matches Found</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredTrainees.map((trainee: any) => (
              <div key={trainee.id} className="card shadow-sm hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-500" style={{ padding: '1.5rem', background: 'white' }}>
                <div className="flex items-start justify-between mb-4">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="avatar" style={{ width: '48px', height: '48px', background: '#f0fdf4', color: '#10b981', fontSize: '1.25rem' }}>
                      {getInitials(trainee.name)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 leading-none mb-1">{trainee.name}</h4>
                      <p className="text-xs font-bold text-slate-400">{trainee.training_area || "Srishti Trainee"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-700">{trainee.supervisor_rating || 5}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Training Progress</span>
                    <span className="text-xs font-black text-emerald-600">{trainee.progress_percentage || trainee.efficiency || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${trainee.progress_percentage || parseInt(trainee.efficiency) || 0}%` }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2 block">Certifications & Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {(trainee.skills_learned || "Farming Basics").split(',').map((skill: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-1 rounded-md border border-slate-200 uppercase letter-spacing-tight">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="btn btn-outline w-full py-2 text-xs font-black uppercase tracking-widest border-2">
                   View Full Profile
                </button>
              </div>
            ))}
          </div>
          
          {filteredTrainees.length === 0 && (
            <div style={{ textAlign: 'center', padding: '100px 20px', background: '#f8fafc', borderRadius: '1.5rem', border: '2px dashed #e2e8f0' }}>
               <Search className="mx-auto mb-4 text-slate-300" size={48} />
               <p className="font-black text-slate-400">No trainees found matching the selected requirement.</p>
            </div>
          )}
        </div>
      </div>

      {/* Supervisor Form Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
          <div className="card shadow-2xl fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">Trainee Progress Form</h3>
                <p className="text-sm font-medium text-slate-500">Official Skill Assessment & Employment Record</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} style={{ background: '#f1f5f9', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Trainee Name</label>
                  <input 
                    className="input w-full" 
                    placeholder="Full Name" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Age</label>
                  <input 
                    className="input w-full" 
                    type="number" 
                    placeholder="e.g. 24" 
                    required 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Training Area</label>
                  <select 
                    className="input w-full" 
                    value={formData.training_area}
                    onChange={(e) => setFormData({...formData, training_area: e.target.value})}
                  >
                    <option>Organic Farming</option>
                    <option>Irrigation</option>
                    <option>Crop Monitoring</option>
                    <option>Compost Preparation</option>
                    <option>Poultry Management</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Supervisor Rating (1-10)</label>
                  <div className="flex items-center gap-2">
                     <input 
                       type="range" 
                       min="1" 
                       max="10" 
                       className="flex-1 accent-amber-500"
                       value={formData.supervisor_rating}
                       onChange={(e) => setFormData({...formData, supervisor_rating: parseInt(e.target.value)})}
                     />
                     <span className="font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{formData.supervisor_rating}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Skills Learned (Comma separated)</label>
                <textarea 
                  className="input w-full" 
                  rows={2} 
                  placeholder="e.g. Irrigation Handling, Seed Sowing, Organic Fertilizer Prep"
                  value={formData.skills_learned}
                  onChange={(e) => setFormData({...formData, skills_learned: e.target.value})}
                ></textarea>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div className="flex justify-between items-center mb-4">
                   <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Training Progress</label>
                   <span className="font-black text-primary text-xl">{formData.progress_percentage}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  className="w-full accent-primary h-2 bg-slate-200 rounded-lg" 
                  value={formData.progress_percentage}
                  onChange={(e) => setFormData({...formData, progress_percentage: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">Supervisor Remarks</label>
                <textarea 
                  className="input w-full" 
                  rows={3} 
                  placeholder="Detailed observations about trainee's performance and attitude..."
                  value={formData.supervisor_remarks}
                  onChange={(e) => setFormData({...formData, supervisor_remarks: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary w-full py-4" style={{ background: '#0f172a', fontWeight: 900 }}>
                Generate Digital Profile & Safe
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceProductionSection = ({ qrSession, onGenerateQR, analytics }: any) => {
  const { t } = useTranslation();
  const [log] = useState([
    { name: 'Arjun Das', time: '08:11 AM', method: 'QR Scan', status: 'Present' },
    { name: 'Priya Singh', time: '08:12 AM', method: 'QR Scan', status: 'Present' },
    { name: 'Rohan Mehra', time: '08:13 AM', method: 'QR Scan', status: 'Late' },
    { name: 'Sita Devi', time: '08:14 AM', method: 'QR Scan', status: 'Present' },
    { name: 'Vikram Patel', time: '08:15 AM', method: 'QR Scan', status: 'Present' },
    { name: 'Meera Kumari', time: '08:16 AM', method: 'QR Scan', status: 'Present' },
  ]);

  const attendanceChartData = {
    labels: analytics?.dailyStats?.map((s: any) => s.date.split('T')[0]).reverse() || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [{ 
      label: 'Attendance Count',
      data: analytics?.dailyStats?.map((s: any) => s.count).reverse() || [95, 88, 92, 90, 85], 
      backgroundColor: '#10b981', 
      borderRadius: 8 
    }]
  };

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 2fr', gap: '2rem' }}>
      {/* Left Column: QR Generation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Plus size={32} />
          </div>
          <h3 className="text-xl font-black mb-4">Attendance Session</h3>
          <p className="text-slate-500 mb-8">{t.qrInstruction}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            {!qrSession ? (
              <button 
                className="btn btn-primary" 
                onClick={onGenerateQR}
                style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }}
              >
                <Plus size={20} />
                Generate Attendance QR
              </button>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '4px solid #10b981', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <QRCodeSVG value={qrSession.token} size={200} />
                </div>
                <div style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Clock size={20} />
                  <span>Expires at {new Date(qrSession.expiresAt).toLocaleTimeString()}</span>
                </div>
                <button 
                  className="btn-outline" 
                  onClick={onGenerateQR}
                  style={{ marginTop: '1.5rem' }}
                >
                  Regenerate QR
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="attendance-summary-grid">
          <div className="summary-card">
            <span className="summary-val text-success">128</span>
            <span className="summary-label">{t.present}</span>
          </div>
          <div className="summary-card">
            <span className="summary-val text-danger">12</span>
            <span className="summary-label">{t.absent}</span>
          </div>
          <div className="summary-card">
            <span className="summary-val text-warning">4</span>
            <span className="summary-label">{t.late}</span>
          </div>
        </div>
      </div>

      {/* Right Column: Live Logs & Analytics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ height: '300px' }}>
          <h3 className="text-lg font-bold mb-6">{t.attendanceAnalytics}</h3>
          <div style={{ height: '200px' }}>
            <Bar 
              data={attendanceChartData}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>

        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-bold">{t.liveAttendanceLogs}</h3>
            <span className="badge badge-success">Live Updates</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '1rem', background: 'transparent' }}>{t.name}</th>
                  <th style={{ padding: '1rem', background: 'transparent' }}>{t.time}</th>
                  <th style={{ padding: '1rem', background: 'transparent' }}>{t.method}</th>
                  <th style={{ padding: '1rem', background: 'transparent' }}>{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {log.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{row.name}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{row.time}</td>
                    <td style={{ padding: '1rem' }}><span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: '0.5rem' }}>{row.method}</span></td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${row.status === 'Present' ? 'badge-success' : 'badge-warning'}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventorySection = ({ data }: any) => {
  const { t } = useTranslation();
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table>
        <thead>
          <tr>
            <th>{t.name}</th>
            <th>Category</th>
            <th>{t.quantity}</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i}>
              <td style={{ fontWeight: 700 }}>{row.item}</td>
              <td>{row.category}</td>
              <td style={{ fontWeight: 800 }}>{row.stock}</td>
              <td style={{ color: 'var(--text-muted)' }}>{row.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ReportsSection = () => {
  const { t } = useTranslation();
  return (
    <div className="grid-charts">
      <div className="card">
        <h3 className="text-lg font-bold mb-6">{t.productionTrends}</h3>
        <Radar 
          data={{
            labels: ['Tomatoes', 'Potatoes', 'Chillies', 'Eggplant', 'Cabbage'],
            datasets: [{ label: 'Score', data: [80, 95, 70, 60, 85], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' }]
          }}
        />
      </div>
      <div className="card">
        <h3 className="text-lg font-bold mb-6">{t.taskCompletion}</h3>
        <Doughnut 
          data={{
            labels: ['Completed', 'Pending', 'Overdue'],
            datasets: [{ data: [65, 25, 10], backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }]
          }}
          options={{ cutout: '70%' }}
        />
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 className="text-lg font-bold mb-6">{t.attendanceAnalytics}</h3>
        <Line 
          data={{
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
            datasets: [{ label: 'Avg Attendance', data: [88, 92, 90, 85, 95], borderColor: '#10b981', tension: 0.3 }]
          }}
          options={{ responsive: true }}
        />
      </div>
    </div>
  );
};

const AdminSettingsSection = () => {
  const { t } = useTranslation();
  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <AlertCircle size={48} className="text-slate-200 mx-auto mb-6" />
      <h3 className="text-xl font-bold mb-4">Admin {t.settings}</h3>
      <p className="text-slate-500 mb-8">System configuration and access control.</p>
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button className="btn" style={{ background: '#f8fafc', width: '100%', textAlign: 'left' }}>Database Management</button>
        <button className="btn" style={{ background: '#f8fafc', width: '100%', textAlign: 'left' }}>API Configuration</button>
        <button className="btn" style={{ background: '#f8fafc', width: '100%', textAlign: 'left' }}>User Permissions</button>
      </div>
    </div>
  );
};

// --- Helpers ---

const StatCard = ({ label, val, icon: Icon, color }: any) => (
  <div className="card stat-card">
    <div className="stat-icon" style={{ backgroundColor: color }}>
      <Icon size={24} />
    </div>
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>{label}</p>
      <h4 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{val}</h4>
    </div>
  </div>
);

export default AdminDashboard;
