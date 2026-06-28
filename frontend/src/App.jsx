import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AVATAR_OPTIONS = ['bear', 'chicken', 'duck', 'fox', 'meerkat', 'rabbit'];

const UserAvatar = ({ user, className = "w-8 h-8", style }) => {
  if (!user) return null;
  const src = user.avatarUrl
    ? (user.avatarUrl.startsWith('/') ? user.avatarUrl : user.avatarUrl)
    : `/avatars/${AVATAR_OPTIONS[(user.email?.length || 0) % AVATAR_OPTIONS.length]}.png`;
  return (
    <img
      src={src}
      alt={user.name || 'User'}
      title={user.name}
      className={`${className} rounded-full border border-slate-200/50 dark:border-zinc-800 shrink-0 select-none shadow-sm object-cover bg-slate-100 dark:bg-zinc-900`}
      style={style}
      onError={(e) => { e.target.src = `/avatars/bear.png`; }}
    />
  );
};

const AvatarStack = ({ users = [], limit = 4, onManageClick }) => {
  const visibleUsers = users.slice(0, limit);
  const remaining = users.length - limit;
  return (
    <div 
      className="flex items-center -space-x-2 cursor-pointer select-none" 
      onClick={onManageClick}
      title="Manage project members"
    >
      {visibleUsers.map((u, i) => (
        <div key={u._id || u.id} style={{ zIndex: limit - i }}>
          <UserAvatar user={u} className="w-7 h-7 ring-2 ring-white dark:ring-[#121212] hover:-translate-y-0.5 transition-transform duration-150" />
        </div>
      ))}
      {remaining > 0 && (
        <div 
          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-250 dark:border-zinc-700 flex items-center justify-center text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 ring-2 ring-white dark:ring-[#121212] hover:-translate-y-0.5 transition-transform duration-150"
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};

const CustomSelect = ({ value, onChange, options, label, className = "w-full" }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all text-left"
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon}
          <span>{selectedOption?.label}</span>
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-zinc-500 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>keyboard_arrow_down</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800/60 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-scale-in">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left font-bold transition-colors ${
                  value === opt.value
                    ? 'bg-neutral-100 text-slate-800 dark:bg-zinc-800/50 dark:text-white'
                    : 'text-slate-650 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AssigneeSelect = ({ value, onChange, projectMembers = [], workspaceUsers = [], label }) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef(null);
  
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const availableUsers = projectMembers.length > 0 ? projectMembers : workspaceUsers;
  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const selectedUser = availableUsers.find(u => (u._id || u.id) === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all text-left"
      >
        <span className="flex items-center gap-2">
          {selectedUser ? (
            <>
              <UserAvatar user={selectedUser} className="w-5 h-5" />
              <span>{selectedUser.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Unassigned</span>
          )}
        </span>
        <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-zinc-550 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>keyboard_arrow_down</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-full bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800/60 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-scale-in">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
            <input
              type="text"
              placeholder="Search assignee..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-black/20"
            />
          </div>
          
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onChange('Unassigned');
                setOpen(false);
                setQuery('');
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left font-bold transition-colors ${
                value === 'Unassigned' || !value ? 'bg-neutral-100 text-slate-800 dark:bg-zinc-800/50 dark:text-white' : 'text-slate-650 dark:text-zinc-350 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
              }`}
            >
              <div className="w-5 h-5 rounded-full border border-dashed border-slate-350 flex items-center justify-center text-[10px] text-slate-400">∅</div>
              <span>Unassigned</span>
            </button>
            
            {filteredUsers.map((u) => (
              <button
                key={u._id || u.id}
                type="button"
                onClick={() => {
                  onChange(u._id || u.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left font-bold transition-colors ${
                  value === (u._id || u.id)
                    ? 'bg-neutral-100 text-slate-800 dark:bg-zinc-800/50 dark:text-white'
                    : 'text-slate-650 dark:text-zinc-355 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <UserAvatar user={u} className="w-5 h-5" />
                <span>{u.name}</span>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">No members found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  // View states: 'inbox', 'projects', 'analytics'
  const [activeView, setActiveView] = useState('inbox');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Data Store & Stats
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    completionRate: 0
  });

  // Filter, Search, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'todo', 'in-progress', 'done'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'low', 'medium', 'high'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'dueDate_asc', 'priority_high'

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formStatus, setFormStatus] = useState('todo');
  const [formAssignee, setFormAssignee] = useState('Unassigned');
  const [formProject, setFormProject] = useState('');
  
  // Product Feature Form Fields
  const [formSubtasks, setFormSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [formTags, setFormTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [formStoryPoints, setFormStoryPoints] = useState(1);
  const [expandedCardChecklist, setExpandedCardChecklist] = useState(null);
  const searchInputRef = useRef(null);

  // Form Validation State
  const [formErrors, setFormErrors] = useState({});

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // Auth States
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authErrors, setAuthErrors] = useState({});
  const [authLoading, setAuthLoading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('fox');
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  // Collaborative Store
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('selectedProjectId') || 'all');
  const [users, setUsers] = useState([]);

  // UI States for Project Modals
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projKey, setProjKey] = useState('');
  const [projErrors, setProjErrors] = useState({});

  const [manageMembersOpen, setManageMembersOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const notifPanelRef = useRef(null);

  // Keyboard Shortcut Help Modal
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);

  // Recent Activity Log
  const [activities, setActivities] = useState([
    { id: 1, text: "Application initialized", time: "Just now", type: "info" },
    { id: 2, text: "Connected to MongoDB Database", time: "Just now", type: "success" }
  ]);

  // Toast helper
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Activity log helper
  const addActivity = (text, type = 'info') => {
    const newActivity = {
      id: Date.now(),
      text,
      time: 'Just now',
      type
    };
    setActivities(prev => [newActivity, ...prev.slice(0, 8)]); // keep top 8
  };

  // Sync Dark Mode
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // --- Shortcuts that work even while typing ---
      // Escape: close any open modal / panel
      if (e.key === 'Escape') {
        if (shortcutModalOpen) { setShortcutModalOpen(false); return; }
        if (notifPanelOpen) { setNotifPanelOpen(false); return; }
        if (manageMembersOpen) { setManageMembersOpen(false); return; }
        if (projectModalOpen) { setProjectModalOpen(false); return; }
        if (modalOpen) { closeModal(); return; }
        if (searchQuery) { setSearchQuery(''); return; }
      }

      // --- Shortcuts blocked while typing ---
      if (isTyping) return;

      // Ctrl / Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+Q — New Task
        if (e.key === 'q') { e.preventDefault(); openCreateModal(); }
        // Ctrl+K — Focus Search
        if (e.key === 'k') { e.preventDefault(); searchInputRef.current?.focus(); }
        // Ctrl+Y — Toggle Dark Mode
        if (e.key === 'y') { e.preventDefault(); toggleDarkMode(); }
        // Ctrl+N — New Project
        if (e.key === 'n') { e.preventDefault(); if (token) setProjectModalOpen(true); }
        // Ctrl+B — Toggle Notification bell
        if (e.key === 'b') { e.preventDefault(); setNotifPanelOpen(prev => !prev); }
        // Ctrl+/ — Show Shortcuts Help
        if (e.key === '/') { e.preventDefault(); setShortcutModalOpen(prev => !prev); }
        // Ctrl+1 — Inbox
        if (e.key === '1') { e.preventDefault(); setActiveView('inbox'); }
        // Ctrl+2 — Board
        if (e.key === '2') { e.preventDefault(); setActiveView('projects'); }
        // Ctrl+3 — Analytics
        if (e.key === '3') { e.preventDefault(); setActiveView('analytics'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [darkMode, modalOpen, projectModalOpen, manageMembersOpen, notifPanelOpen, shortcutModalOpen, searchQuery, token]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      addToast('Dark mode enabled', 'info');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      addToast('Light mode enabled', 'info');
    }
  };

  // Helper to construct headers with JWT
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch Tasks from API
  const fetchTasks = async () => {
    if (!token) return;
    try {
      const statusParam = activeView === 'projects' ? 'all' : statusFilter;
      let url = `${API_BASE_URL}/tasks?status=${statusParam}&priority=${priorityFilter}&search=${searchQuery}`;
      
      if (selectedProjectId !== 'all') {
        url += `&project=${selectedProjectId}`;
      }

      if (sortBy === 'dueDate_asc') {
        url += '&sortBy=dueDate_asc';
      } else if (sortBy === 'priority_high') {
        url += '&sortBy=priority_high';
      } else {
        url += '&sortBy=newest';
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If we get a 403 on a specific project, it's stale — reset to All
      if (response.status === 403 && selectedProjectId !== 'all') {
        setSelectedProjectId('all');
        localStorage.setItem('selectedProjectId', 'all');
        addToast('Project not accessible. Showing all tasks.', 'info');
        return;
      }

      if (!response.ok) throw new Error('Failed to retrieve tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      addToast('Could not load tasks from database', 'error');
    }
  };

  // Fetch Analytics from API
  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      let url = `${API_BASE_URL}/tasks/analytics`;
      if (selectedProjectId !== 'all') {
        url += `?project=${selectedProjectId}`;
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // If 403 on a specific project, silently skip — fetchTasks will handle the reset
      if (response.status === 403 && selectedProjectId !== 'all') return;

      if (!response.ok) throw new Error('Failed to load analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Fetch Projects from API
  const fetchProjects = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Fetch all registered Users from API
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch Notifications (pending invites)
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Respond to notification (accept/reject)
  const respondToNotification = async (notifId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to respond');
      }
      addToast(action === 'accept' ? 'Joined project successfully!' : 'Invitation declined.', action === 'accept' ? 'success' : 'info');
      fetchNotifications();
      if (action === 'accept') fetchProjects();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Delete Project
  const deleteProject = async (projectId, projectName) => {
    if (!window.confirm(`Permanently delete project "${projectName}" and ALL its tasks? This cannot be undone.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete project');
      }
      addToast(`Project "${projectName}" deleted.`, 'success');
      addActivity(`Deleted project "${projectName}"`, 'delete');
      if (selectedProjectId === projectId) {
        setSelectedProjectId('all');
        localStorage.setItem('selectedProjectId', 'all');
      }
      fetchProjects();
      fetchTasks();
      fetchAnalytics();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Refetch triggers
  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchAnalytics();
      fetchProjects();
      fetchUsers();
      fetchNotifications();
    }
  }, [token, searchQuery, statusFilter, priorityFilter, sortBy, activeView, selectedProjectId]);

  // Poll notifications every 30s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Close notification panel on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Tag Helpers
  const addTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed === '') return;
    if (!formTags.includes(trimmed)) {
      setFormTags(prev => [...prev, trimmed]);
    }
    setNewTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setFormTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Subtask Helpers
  const addSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (trimmed === '') return;
    setFormSubtasks(prev => [...prev, { title: trimmed, completed: false }]);
    setNewSubtaskTitle('');
  };

  const toggleSubtaskInForm = (index) => {
    setFormSubtasks(prev => prev.map((sub, i) => i === index ? { ...sub, completed: !sub.completed } : sub));
  };

  const removeSubtaskInForm = (index) => {
    setFormSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle subtask directly on task card
  const toggleSubtaskOnCard = async (task, subtaskIndex) => {
    const updatedSubtasks = task.subtasks.map((s, idx) => 
      idx === subtaskIndex ? { ...s, completed: !s.completed } : s
    );
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
      if (!response.ok) throw new Error('Failed to update subtask');
      const updated = await response.json();
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
      fetchAnalytics();
    } catch (error) {
      console.error('Error toggling subtask on card:', error);
      addToast('Failed to toggle subtask', 'error');
    }
  };

  // Export Tasks as CSV
  const exportToCSV = () => {
    if (tasks.length === 0) {
      addToast('No tasks to export', 'info');
      return;
    }
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee', 'Story Points', 'Tags', 'Subtasks (Done/Total)'];
    const csvRows = [headers.join(',')];
    tasks.forEach(t => {
      const doneSubs = t.subtasks ? t.subtasks.filter(s => s.completed).length : 0;
      const totalSubs = t.subtasks ? t.subtasks.length : 0;
      const tagsStr = t.tags ? t.tags.join(' | ') : '';
      const row = [
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
        t.assignee ? t.assignee.name : 'Unassigned',
        t.storyPoints || 1,
        `"${tagsStr.replace(/"/g, '""')}"`,
        `"${doneSubs}/${totalSubs}"`
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Tasks exported to CSV!');
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!formTitle || formTitle.trim() === '') {
      errors.title = 'Title is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      addToast('Please enter a task title', 'error');
      return;
    }

    const taskData = {
      title: formTitle,
      description: formDescription,
      dueDate: formDueDate || undefined,
      priority: formPriority,
      status: formStatus,
      assignee: formAssignee !== 'Unassigned' && formAssignee !== '' ? formAssignee : null,
      project: formProject !== '' ? formProject : null,
      subtasks: formSubtasks,
      tags: formTags,
      storyPoints: Number(formStoryPoints) || 1
    };

    try {
      if (modalMode === 'create') {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(taskData)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to create task');
        }

        const newTask = await response.json();
        addToast(`Task "${newTask.title}" created!`);
        addActivity(`Created "${newTask.title}"`, 'add');
      } else {
        const response = await fetch(`${API_BASE_URL}/tasks/${editingTaskId}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(taskData)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to update task');
        }

        const updatedTask = await response.json();
        addToast(`Task "${updatedTask.title}" updated!`);
        addActivity(`Updated "${updatedTask.title}"`, 'edit');
      }

      fetchTasks();
      fetchAnalytics();
      closeModal();
    } catch (error) {
      console.error('Form action error:', error);
      addToast(error.message, 'error');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormTitle('');
    setFormDescription('');
    setFormDueDate('');
    setFormPriority('medium');
    setFormStatus('todo');
    setFormAssignee('Unassigned');
    setFormProject(selectedProjectId !== 'all' ? selectedProjectId : '');
    setFormSubtasks([]);
    setNewSubtaskTitle('');
    setFormTags([]);
    setNewTagInput('');
    setFormStoryPoints(1);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    setEditingTaskId(task._id);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormAssignee(task.assignee ? (task.assignee._id || task.assignee) : 'Unassigned');
    setFormProject(task.project ? (task.project._id || task.project) : '');
    setFormSubtasks(task.subtasks || []);
    setNewSubtaskTitle('');
    setFormTags(task.tags || []);
    setNewTagInput('');
    setFormStoryPoints(task.storyPoints || 1);
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTaskId(null);
  };

  // Toggle Task Completion State directly from checkbox
  const toggleTaskCompletion = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) throw new Error('Failed to toggle completion');
      
      const updated = await response.json();
      setTasks(prev => prev.map(t => t._id === task._id ? updated : t));
      fetchAnalytics();

      if (nextStatus === 'done') {
        addToast(`Completed "${task.title}"`);
        addActivity(`Completed "${task.title}"`, 'check');
      } else {
        addToast(`Reopened "${task.title}"`);
        addActivity(`Reopened "${task.title}"`, 'info');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      addToast('Could not update task', 'error');
    }
  };

  // Delete Task
  const deleteTask = async (taskId, taskTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${taskTitle}"?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete task');

      addToast(`Deleted "${taskTitle}"`);
      addActivity(`Deleted "${taskTitle}"`, 'delete');
      
      setTasks(prev => prev.filter(t => t._id !== taskId));
      fetchAnalytics();
    } catch (error) {
      console.error('Error deleting task:', error);
      addToast('Could not delete task', 'error');
    }
  };

  // Drag & Drop
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === targetStatus) return;

    try {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));

      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: targetStatus })
      });

      if (!response.ok) throw new Error('Failed to update task status');
      const updated = await response.json();
      
      setTasks(prev => prev.map(t => t._id === taskId ? updated : t));
      fetchAnalytics();
      
      const columnNames = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
      addToast(`Moved to ${columnNames[targetStatus]}`);
      addActivity(`Moved "${task.title}" to ${columnNames[targetStatus]}`, 'edit');
    } catch (error) {
      console.error('Drop error:', error);
      addToast('Could not save placement', 'error');
      fetchTasks();
    }
  };

  // Reusable Task Card Component
  const renderTaskCard = (task, isKanban = false) => {
    const completedSubs = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
    const totalSubs = task.subtasks ? task.subtasks.length : 0;
    const subPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    return (
      <div
        key={task._id}
        draggable={isKanban}
        onDragStart={isKanban ? (e) => handleDragStart(e, task._id) : undefined}
        className={`bg-white dark:bg-[#121212] p-4 rounded-2xl shadow-sm border border-neutral-250/30 dark:border-neutral-800/40 hover:shadow-md transition-all duration-200 group flex flex-col gap-3.5 relative ${
          task.status === 'done' ? 'opacity-70' : ''
        } ${isKanban ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        {isKanban && task.status === 'in-progress' && (
          <div className="absolute left-0 top-0 w-1 h-full bg-black dark:bg-white"></div>
        )}

        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Priority Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border ${
              task.priority === 'high'
                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/40'
                : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40'
                  : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40'
            }`}>
              {task.priority}
            </span>

            {/* Story Points Badge */}
            {task.storyPoints > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-350 border border-neutral-200/50 dark:border-neutral-800/50 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[10px] font-bold">bolt</span>
                {task.storyPoints} {task.storyPoints === 1 ? 'pt' : 'pts'}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 shrink-0">
            <button
              onClick={() => openEditModal(task)}
              className="w-6.5 h-6.5 flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Edit"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button
              onClick={() => deleteTask(task._id, task.title)}
              className="w-6.5 h-6.5 flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Delete"
            >
              <span className="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </div>

        {/* Title Description */}
        <div className="flex items-start gap-2.5">
          {!isKanban && (
            <div className="relative flex items-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() => toggleTaskCompletion(task)}
                className="custom-checkbox w-5 h-5 rounded-full border-slate-350 dark:border-zinc-700 text-black dark:text-white focus:ring-0 cursor-pointer"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className={`text-[14px] font-bold text-slate-800 dark:text-zinc-150 leading-snug break-words ${
              task.status === 'done' ? 'line-through text-slate-400 dark:text-zinc-500' : ''
            }`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 break-words leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Tags badges */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-[4px] text-[8px] font-extrabold bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/30 dark:border-neutral-800/30 text-neutral-500 dark:text-neutral-455 uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Subtasks Progress */}
        {totalSubs > 0 && (
          <div className="mt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedCardChecklist(expandedCardChecklist === task._id ? null : task._id);
              }}
              className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">format_list_bulleted</span>
                Checklist ({completedSubs}/{totalSubs})
              </span>
              <span className="material-symbols-outlined text-[13px]">
                {expandedCardChecklist === task._id ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden shadow-inner">
              <div
                className="bg-black dark:bg-white h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${subPercent}%` }}
              />
            </div>

            {/* Subtask checklist drawer */}
            {expandedCardChecklist === task._id && (
              <div className="mt-2.5 pl-1.5 space-y-1.5 border-l border-slate-200 dark:border-zinc-850">
                {task.subtasks.map((sub, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-650 dark:text-zinc-350">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => toggleSubtaskOnCard(task, sIdx)}
                      className="custom-checkbox w-3.5 h-3.5 rounded border-slate-350 dark:border-zinc-700 text-black dark:text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className={sub.completed ? 'line-through opacity-50' : ''}>{sub.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Metadata */}
        <div className="flex justify-between items-center mt-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            <span>
              {task.dueDate 
                ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : 'No date'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {task.project && (
              <span className="text-[8px] font-extrabold uppercase tracking-wider bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded" title={task.project.name}>
                {task.project.key}
              </span>
            )}
            {isKanban && (
              <span className="text-[8px] font-extrabold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 px-2 py-0.5 rounded text-neutral-500 dark:text-neutral-400">
                {task.status === 'todo' ? 'todo' : task.status === 'in-progress' ? 'doing' : 'done'}
              </span>
            )}
            {task.assignee ? (
              <img 
                src={task.assignee.avatarUrl} 
                alt={task.assignee.name} 
                className="w-5 h-5 rounded-full border border-slate-200/50 cursor-help"
                title={`Assignee: ${task.assignee.name} (${task.assignee.email})`}
              />
            ) : (
              <span className="w-5 h-5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-250/50 dark:border-neutral-800/50 text-slate-400 dark:text-zinc-550 text-[8px] font-bold flex items-center justify-center rounded-full" title="Unassigned">
                UA
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const [analyticsDays, setAnalyticsDays] = useState(7);
  const chartHeightMultipliers = analyticsDays === 7 
    ? { Mon: 'h-[40%]', Tue: 'h-[65%]', Wed: 'h-[80%]', Thu: 'h-[50%]', Fri: 'h-[100%]', Sat: 'h-[25%]', Sun: 'h-[15%]' }
    : { Mon: 'h-[85%]', Tue: 'h-[40%]', Wed: 'h-[60%]', Thu: 'h-[90%]', Fri: 'h-[75%]', Sat: 'h-[35%]', Sun: 'h-[25%]' };

  // Auth Screen Component
  const renderAuthScreen = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl dark:bg-blue-500/5"></div>
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl dark:bg-emerald-500/5"></div>
        </div>

        <div className="w-full sm:w-[480px] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-zinc-800/60 shadow-2xl p-8 relative animate-scale-in">
          <div className="flex flex-col items-center mb-8">
            <svg className="h-10 w-10 text-black dark:text-white mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
            </svg>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Achievo</h2>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-widest font-extrabold">Workspace</p>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const errors = {};
            if (!email.trim()) errors.email = 'Email is required';
            if (!password.trim()) errors.password = 'Password is required';
            if (!isLogin && !name.trim()) errors.name = 'Name is required';
            
            if (Object.keys(errors).length > 0) {
              setAuthErrors(errors);
              return;
            }

            setAuthLoading(true);
            try {
              const url = `${API_BASE_URL}/auth/${isLogin ? 'login' : 'register'}`;
              const body = isLogin ? { email, password } : { name, email, password, avatar: selectedAvatar };
              
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });

              if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Authentication failed');
              }

              const data = await response.json();
              localStorage.setItem('token', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              
              setToken(data.token);
              setCurrentUser(data.user);
              addToast(`Welcome, ${data.user.name}!`);
            } catch (err) {
              addToast(err.message, 'error');
            } finally {
              setAuthLoading(false);
            }
          }}>
            <div className="flex flex-col gap-4">
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                  />
                  {authErrors.name && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{authErrors.name}</span>}
                </div>
              )}

              {/* Avatar picker - shown only on register */}
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 mb-2">Choose Avatar</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_OPTIONS.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all duration-150 active:scale-95 ${
                          selectedAvatar === av
                            ? 'border-black dark:border-white shadow-md scale-110'
                            : 'border-transparent opacity-60 hover:opacity-90 hover:border-slate-300 dark:hover:border-zinc-600'
                        }`}
                        title={av}
                      >
                        <img src={`/avatars/${av}.png`} alt={av} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                />
                {authErrors.email && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{authErrors.email}</span>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                />
                {authErrors.password && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{authErrors.password}</span>}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="mt-2 w-full bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : isLogin ? 'Login to Workspace' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthErrors({});
                setName('');
                setEmail('');
                setPassword('');
                setSelectedAvatar('fox');
              }}
              className="text-xs font-bold text-slate-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create Project Modal Component
  const renderCreateProjectModal = () => {
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
        <div 
          className="bg-white dark:bg-[#121212] w-full sm:w-[480px] rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 shadow-2xl p-6 relative animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Project</h3>
            <button 
              onClick={() => { setProjectModalOpen(false); setProjErrors({}); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const errors = {};
            if (!projName.trim()) errors.name = 'Project name is required';
            if (!projKey.trim()) errors.key = 'Project key is required';
            
            if (Object.keys(errors).length > 0) {
              setProjErrors(errors);
              return;
            }

            try {
              const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name: projName, description: projDescription, key: projKey })
              });

              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to create project');
              }

              const newProj = await response.json();
              addToast(`Project "${newProj.name}" created!`);
              fetchProjects();
              setProjectModalOpen(false);
              setProjName('');
              setProjDescription('');
              setProjKey('');
              setSelectedProjectId(newProj._id);
              localStorage.setItem('selectedProjectId', newProj._id);
            } catch (err) {
              addToast(err.message, 'error');
            }
          }}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                />
                {projErrors.name && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{projErrors.name}</span>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1.5">Project Key</label>
                  <input
                    type="text"
                    value={projKey}
                    onChange={(e) => setProjKey(e.target.value.toUpperCase())}
                    placeholder="WEB"
                    maxLength={5}
                    className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all text-center font-bold"
                  />
                  {projErrors.key && <span className="text-red-500 text-[10px] font-semibold mt-1 block">{projErrors.key}</span>}
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1.5">Description (Optional)</label>
                  <input
                    type="text"
                    value={projDescription}
                    onChange={(e) => setProjDescription(e.target.value)}
                    placeholder="Website redesign Sprint 1"
                    className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all shadow-sm"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Manage Project Members Modal Component
  const renderManageMembersModal = () => {
    const selectedProj = projects.find(p => p._id === selectedProjectId);
    return (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
        <div 
          className="bg-white dark:bg-[#121212] w-full sm:w-[480px] rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 shadow-2xl p-6 relative animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project Members</h3>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Project: {selectedProj?.name}</p>
            </div>
            <button 
              onClick={() => { setManageMembersOpen(false); setNewMemberEmail(''); }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Add Member Form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newMemberEmail.trim()) return;

            try {
              const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/members`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email: newMemberEmail })
              });

              if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to add member');
              }

              addToast('Member added successfully!');
              fetchProjects();
              setNewMemberEmail('');
            } catch (err) {
              addToast(err.message, 'error');
            }
          }} className="mb-6">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1.5">Add Member by Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="collaborator@example.com"
                className="flex-1 bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all"
              />
              <button
                type="submit"
                className="bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold px-4 rounded-xl active:scale-95 transition-all shadow-sm shrink-0"
              >
                Add
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-555">Current Members</span>
            {(selectedProj?.members || []).map(m => {
              const isOwner = selectedProj?.owner?._id === m._id || selectedProj?.owner === m._id;
              return (
                <div key={m._id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800/30 rounded-xl">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={m.avatarUrl} alt={m.name} className="w-7 h-7 rounded-full border border-slate-200/50" />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block truncate">
                        {m.name} 
                        {isOwner && <span className="text-[8px] bg-neutral-200 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 px-1 py-0.5 rounded font-mono ml-1.5 font-bold">OWNER</span>}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate block mt-0.5">{m.email}</span>
                    </div>
                  </div>
                  {!isOwner && (selectedProj?.owner?._id === currentUser?.id || selectedProj?.owner === currentUser?.id) && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Remove ${m.name} from project?`)) return;
                        try {
                          const response = await fetch(`${API_BASE_URL}/projects/${selectedProjectId}/members/${m._id}`, {
                            method: 'DELETE',
                            headers: getHeaders()
                          });
                          if (!response.ok) {
                            const err = await response.json();
                            throw new Error(err.message || 'Failed to remove member');
                          }
                          addToast('Member removed.');
                          fetchProjects();
                        } catch (err) {
                          addToast(err.message, 'error');
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-850"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Team Members View Component
  const renderPeopleView = () => {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 w-full">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Team Members</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">Manage workspace users and track their task workloads.</p>
          </div>
          
          <button
            onClick={() => {
              const nameInput = prompt("Enter new person's name:");
              if (!nameInput) return;
              const emailInput = prompt("Enter new person's email:");
              if (!emailInput) return;
              const passwordInput = prompt("Enter password (minimum 6 characters):", "password123");
              if (!passwordInput) return;
              
              fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameInput, email: emailInput, password: passwordInput })
              })
              .then(res => {
                if (!res.ok) return res.json().then(e => { throw new Error(e.message) });
                return res.json();
              })
              .then(data => {
                addToast(`Added user "${nameInput}" successfully!`);
                fetchUsers();
              })
              .catch(err => {
                addToast(err.message, 'error');
              });
            }}
            className="bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">person_add</span> Add Team Member
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {users.map(u => {
            const assignedCount = tasks.filter(t => t.assignee && (t.assignee._id === u.id || t.assignee._id === u._id)).length;
            const completedCount = tasks.filter(t => t.assignee && (t.assignee._id === u.id || t.assignee._id === u._id) && t.status === 'done').length;
            
            return (
              <div key={u.id || u._id} className="bg-white dark:bg-[#121212] rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 p-5 shadow-sm flex items-start gap-4">
                <img src={u.avatarUrl} alt={u.name} className="w-12 h-12 rounded-full border border-slate-200/50" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.name}</h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">{u.email}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Assigned</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-300 mt-0.5">{assignedCount} tasks</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200/60 dark:bg-zinc-800/60"></div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Completed</span>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 mt-0.5">{completedCount} tasks</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="flex h-screen w-screen bg-[#F2F2F7] dark:bg-black overflow-hidden text-slate-900 dark:text-zinc-100">
        {renderAuthScreen()}
        {/* Toast Alerts */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[150] flex flex-col gap-3 w-[calc(100vw-32px)] sm:w-[360px] pointer-events-none">
          {toasts.map(toast => {
            let iconName = 'check_circle';
            let iconColor = 'text-emerald-500';
            if (toast.type === 'error') {
              iconName = 'error';
              iconColor = 'text-red-500';
            } else if (toast.type === 'info') {
              iconName = 'info';
              iconColor = 'text-blue-500';
            }

            return (
              <div
                key={toast.id}
                className="pointer-events-auto w-full px-4 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white flex items-center justify-between gap-3 text-sm font-semibold"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`material-symbols-outlined shrink-0 text-[20px] ${iconColor}`}>
                    {iconName}
                  </span>
                  <span className="truncate">{toast.message}</span>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#F2F2F7] dark:bg-black overflow-hidden text-slate-900 dark:text-zinc-100">
      
      {/* Toast Alerts */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[150] flex flex-col gap-3 w-[calc(100vw-32px)] sm:w-[360px] pointer-events-none">
        {toasts.map(toast => {
          let iconName = 'check_circle';
          let iconColor = 'text-emerald-500';
          if (toast.type === 'error') {
            iconName = 'error';
            iconColor = 'text-red-500';
          } else if (toast.type === 'info') {
            iconName = 'info';
            iconColor = 'text-blue-500';
          }

          return (
            <div
              key={toast.id}
              className="pointer-events-auto w-full px-4 py-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#1C1C1E] text-slate-900 dark:text-white flex items-center justify-between gap-3 text-sm font-semibold animate-toast-in"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`material-symbols-outlined shrink-0 text-[20px] ${iconColor}`}>
                  {iconName}
                </span>
                <span className="truncate">{toast.message}</span>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Sidebar Navigation (Desktop only) */}
      <aside className="h-screen max-h-screen overflow-hidden hidden md:flex flex-col w-72 bg-white dark:bg-[#121212] border-r border-slate-200/60 dark:border-zinc-800/60 p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <svg className="h-[30px] w-[30px] text-black dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
          </svg>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Achievo</h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-550 uppercase tracking-widest font-semibold mt-0.5"> </p>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => setActiveView('inbox')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              activeView === 'inbox'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeView === 'inbox' ? "'FILL' 1" : '' }}>inbox</span>
            <span>Inbox Tasks</span>
          </button>

          <button
            onClick={() => setActiveView('projects')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              activeView === 'projects'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeView === 'projects' ? "'FILL' 1" : '' }}>grid_view</span>
            <span> Board</span>
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              activeView === 'analytics'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeView === 'analytics' ? "'FILL' 1" : '' }}>bar_chart</span>
            <span>Analytics</span>
          </button>
        </div>

        {/* Projects List Section */}
        <div className="mt-6 flex flex-col gap-1.5 min-h-0 overflow-y-auto custom-scrollbar flex-1 pr-1 border-t border-slate-100 dark:border-zinc-800/80 pt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-extrabold">Projects</span>
            <button 
              onClick={() => setProjectModalOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors duration-150 py-0.5 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800"
              title="Create New Project"
            >
              <span className="material-symbols-outlined text-[13px] font-bold">add</span>
              <span>Create</span>
            </button>
          </div>
          
          <button
            onClick={() => {
              setSelectedProjectId('all');
              localStorage.setItem('selectedProjectId', 'all');
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] ${
              selectedProjectId === 'all'
                ? 'bg-neutral-100 text-slate-800 dark:bg-zinc-850 dark:text-white'
                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }`}
          >
            <span className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-200 dark:bg-zinc-800 text-[9px] font-bold tracking-tight">ALL</span>
            <span className="truncate">All Projects</span>
          </button>

          {projects.map(proj => {
            const isOwner = proj.owner?._id === currentUser?.id || proj.owner?._id === currentUser?._id || proj.owner === currentUser?.id || proj.owner === currentUser?._id;
            return (
            <div
              key={proj._id}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group/proj ${
                selectedProjectId === proj._id
                  ? 'bg-neutral-100 text-slate-800 dark:bg-zinc-850 dark:text-white'
                  : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-900'
              }`}
            >
              {/* Clickable row area */}
              <button
                onClick={() => {
                  setSelectedProjectId(proj._id);
                  localStorage.setItem('selectedProjectId', proj._id);
                }}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
                <span className="w-5 h-5 rounded-md flex items-center justify-center bg-black text-white dark:bg-white dark:text-black text-[9px] font-extrabold shrink-0">
                  {proj.key}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="truncate block">{proj.name}</span>
                  {/* Member avatar stack */}
                  {proj.members && proj.members.length > 0 && (
                    <div className="flex items-center -space-x-1.5 mt-1">
                      {proj.members.slice(0, 4).map((m, i) => (
                        <UserAvatar
                          key={m._id || i}
                          user={m}
                          className="w-4 h-4 ring-1 ring-white dark:ring-[#121212]"
                          style={{ zIndex: 4 - i }}
                        />
                      ))}
                      {proj.members.length > 4 && (
                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-zinc-300 ring-1 ring-white dark:ring-[#121212]" style={{ zIndex: 0 }}>
                          +{proj.members.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5 ml-1 shrink-0 opacity-0 group-hover/proj:opacity-100 transition-opacity duration-150">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProjectId(proj._id);
                    localStorage.setItem('selectedProjectId', proj._id);
                    setManageMembersOpen(true);
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-black dark:hover:text-white transition-colors"
                  title="Manage members"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">group</span>
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(proj._id, proj.name);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete project"
                  >
                    <span className="material-symbols-outlined text-[12px] font-bold">delete</span>
                  </button>
                )}
              </div>
            </div>
            );
          })}

          {/* Create Project list item button */}
          <button
            onClick={() => setProjectModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold border border-dashed border-slate-200/80 hover:border-slate-350 dark:border-zinc-800/80 dark:hover:border-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-300 transition-all duration-200 mt-1 active:scale-[0.98]"
          >
            <span className="w-5 h-5 rounded-md flex items-center justify-center bg-slate-100 dark:bg-zinc-900 text-[10px] font-bold shrink-0 text-slate-400 dark:text-zinc-500">
              +
            </span>
            <span className="truncate">Create Project</span>
          </button>
        </div>

        {/* Sidebar add task button */}
        <button
          onClick={openCreateModal}
          className="mt-6 w-full bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-sm font-bold py-3.5 rounded-xl active:scale-[0.97] transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm mb-4"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">add</span>
          New Task
        </button>

        {/* User Profile Card */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-3">
            {/* Avatar — click to open picker */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative group/avpick shrink-0">
                <img
                  src={currentUser?.avatarUrl || '/avatars/bear.png'}
                  alt={currentUser?.name}
                  className="w-8 h-8 rounded-full border border-slate-200/50 object-cover cursor-pointer"
                  onClick={() => setAvatarPickerOpen(prev => !prev)}
                  title="Change avatar"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avpick:bg-black/30 transition-all duration-150 flex items-center justify-center cursor-pointer pointer-events-none">
                  <span className="material-symbols-outlined text-white text-[12px] opacity-0 group-hover/avpick:opacity-100 transition-opacity">edit</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block truncate">{currentUser?.name}</span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-550 block truncate mt-0.5">{currentUser?.email}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setToken(null);
                  setCurrentUser(null);
                  addToast("Logged out successfully");
                }
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors"
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>

          {/* Inline avatar picker */}
          {avatarPickerOpen && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 animate-scale-in">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">Choose Avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
                          method: 'PUT',
                          headers: getHeaders(),
                          body: JSON.stringify({ avatar: av })
                        });
                        if (!res.ok) throw new Error('Failed to update avatar');
                        const data = await res.json();
                        const updated = { ...currentUser, avatarUrl: data.avatarUrl };
                        setCurrentUser(updated);
                        localStorage.setItem('user', JSON.stringify(updated));
                        setAvatarPickerOpen(false);
                        addToast('Avatar updated!');
                      } catch (err) {
                        addToast(err.message, 'error');
                      }
                    }}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all duration-150 active:scale-95 ${
                      currentUser?.avatarUrl === `/avatars/${av}.png`
                        ? 'border-black dark:border-white shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-zinc-600'
                    }`}
                    title={av}
                  >
                    <img src={`/avatars/${av}.png`} alt={av} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Tab Bar Navigation (Fixed to bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white/80 dark:bg-[#121212]/85 backdrop-blur-lg border-t border-slate-200/50 dark:border-zinc-800/60 flex justify-around items-center z-40">
        <button 
          onClick={() => setActiveView('inbox')}
          className={`flex flex-col items-center justify-center gap-0.5 w-1/4 ${
            activeView === 'inbox' ? 'text-black dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeView === 'inbox' ? "'FILL' 1" : '' }}>inbox</span>
          <span className="text-[10px] font-bold">Inbox</span>
        </button>

        <button 
          onClick={() => setActiveView('projects')}
          className={`flex flex-col items-center justify-center gap-0.5 w-1/4 ${
            activeView === 'projects' ? 'text-black dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeView === 'projects' ? "'FILL' 1" : '' }}>grid_view</span>
          <span className="text-[10px] font-bold">Kanban</span>
        </button>

        <div className="relative w-1/4 flex justify-center -top-3">
          <button 
            onClick={openCreateModal}
            className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform duration-200"
          >
            <span className="material-symbols-outlined text-[28px] font-bold">add</span>
          </button>
        </div>

        <button 
          onClick={() => setActiveView('analytics')}
          className={`flex flex-col items-center justify-center gap-0.5 w-1/4 ${
            activeView === 'analytics' ? 'text-black dark:text-white font-bold' : 'text-slate-400 dark:text-zinc-500'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeView === 'analytics' ? "'FILL' 1" : '' }}>bar_chart</span>
          <span className="text-[10px] font-bold">Analytics</span>
        </button>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        
        {/* Blurred Header */}
        <header className="h-16 flex items-center bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/60 sticky top-0 z-40 shrink-0 px-6">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            {mobileSearchOpen ? (
              <div 
                className="flex items-center w-full gap-2 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] focus-within:ring-2 focus-within:ring-black/15 dark:focus-within:ring-white/15 transition-all"
                style={{ flexGrow: 1, minWidth: 0 }}
              >
                <button 
                  onClick={() => { setMobileSearchOpen(false); setSearchQuery(''); }}
                  className="text-slate-500 hover:text-black dark:hover:text-white flex items-center justify-center shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-sm w-full text-slate-800 dark:text-zinc-200 placeholder-slate-400 outline-none border-0 ring-0 focus:ring-0 p-0"
                  autoFocus
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-black dark:hover:text-white mr-1 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                <div 
                  className="flex-1 flex items-center gap-4" 
                  style={{ minWidth: 0 }}
                >
                  <div className="md:hidden flex items-center gap-2 max-w-[180px]">
                    <svg className="h-10 w-10 text-black dark:text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                    </svg>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        localStorage.setItem('selectedProjectId', e.target.value);
                      }}
                      className="bg-transparent border-none text-xs font-extrabold text-black dark:text-white outline-none focus:ring-0 p-0 max-w-[110px] truncate cursor-pointer"
                    >
                      <option value="all">All Tasks</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id} className="dark:bg-[#121212] dark:text-white">{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search Input */}
                  <div 
                    className="hidden md:flex items-center flex-1 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 px-4 py-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.15)] focus-within:ring-2 focus-within:ring-black/15 dark:focus-within:ring-white/15 transition-all"
                    style={{ minWidth: 0 }}
                  >
                    <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">search</span>
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-sm flex-1 text-slate-800 dark:text-zinc-200 placeholder-slate-400 outline-none border-0 ring-0 focus:ring-0 p-0"
                    />
                    {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-black dark:hover:text-white mr-1 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    ) : (
                      <div className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-200/50 dark:bg-zinc-800/80 text-[9px] text-slate-400 dark:text-zinc-500 font-mono font-bold select-none shrink-0 border border-slate-200/30 dark:border-zinc-700/30">
                        ⌘K
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile Search Toggle Button */}
                  <button 
                    onClick={() => setMobileSearchOpen(true)}
                    className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full active:scale-95 duration-150 transition-colors"
                    title="Search Tasks"
                  >
                    <span className="material-symbols-outlined text-[20px]">search</span>
                  </button>

                  {/* Shortcut Help Button */}
                  <button
                    onClick={() => setShortcutModalOpen(prev => !prev)}
                    className={`hidden md:flex w-10 h-10 items-center justify-center rounded-full active:scale-95 duration-150 transition-colors ${
                      shortcutModalOpen ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Keyboard Shortcuts (Ctrl+/)"
                  >
                    <span className="text-[13px] font-extrabold">?</span>
                  </button>

                  {/* Team Members */}
                  <button 
                    onClick={() => setActiveView(activeView === 'people' ? 'inbox' : 'people')}
                    className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 duration-150 transition-colors ${
                      activeView === 'people'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Workspace Team"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeView === 'people' ? "'FILL' 1" : '' }}>group</span>
                  </button>

                  {/* Dark Mode */}
                  <button 
                    onClick={toggleDarkMode}
                    className="w-10 h-10 flex items-center justify-center text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full active:scale-95 duration-150 transition-colors"
                    title="Toggle Dark Mode"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {darkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                  </button>

                  {/* Notification Bell */}
                  <div className="relative" ref={notifPanelRef}>
                    <button
                      onClick={() => setNotifPanelOpen(prev => !prev)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-95 duration-150 transition-colors relative ${
                        notifPanelOpen ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title="Notifications"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: notifPanelOpen ? "'FILL' 1" : '' }}>notifications</span>
                      {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-[#FF3B30] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white px-0.5">
                          {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                      )}
                    </button>

                    {/* Notification dropdown panel */}
                    {notifPanelOpen && (
                      <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                          {notifications.length > 0 && (
                            <span className="text-[10px] font-bold bg-[#FF3B30] text-white px-1.5 py-0.5 rounded-full">{notifications.length} pending</span>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                              <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-zinc-600 mb-2">notifications_none</span>
                              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">You're all caught up!</p>
                              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">No pending invitations</p>
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div key={notif._id} className="px-4 py-3.5 border-b border-slate-50 dark:border-zinc-800/60 last:border-0">
                                <div className="flex items-start gap-2.5 mb-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[16px] text-blue-500">mail</span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">
                                      <span className="text-black dark:text-white">{notif.sender?.name || 'Someone'}</span> invited you to join
                                    </p>
                                    <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                                      {notif.project?.name || 'a project'}
                                      {notif.project?.key && (
                                        <span className="ml-1.5 text-[9px] bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded font-extrabold">{notif.project.key}</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { respondToNotification(notif._id, 'accept'); setNotifPanelOpen(false); }}
                                    className="flex-1 bg-black text-white dark:bg-white dark:text-black text-[11px] font-bold py-2 rounded-xl active:scale-95 transition-all hover:opacity-90"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => respondToNotification(notif._id, 'reject')}
                                    className="flex-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold py-2 rounded-xl active:scale-95 transition-all hover:bg-slate-200 dark:hover:bg-zinc-700"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User headshot (Tap to Logout) */}
                  <div 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to log out?")) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken(null);
                        setCurrentUser(null);
                        addToast("Logged out successfully");
                      }
                    }}
                    className="w-8 h-8 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-700/50 shrink-0 ml-1 cursor-pointer"
                    title="Tap to Logout"
                  >
                    <img 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      src={currentUser?.avatarUrl}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          
          {/* TEAM MEMBERS VIEW */}
          {activeView === 'people' && renderPeopleView()}

          {/* INBOX TASK LIST VIEW */}
          {activeView === 'inbox' && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
              
              {/* Header Title block */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 w-full">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Inbox Tasks</h2>
                  </div>
                  
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-350 bg-white dark:bg-[#1C1C1E] shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-95 transition-all shrink-0"
                    title="Export tasks to CSV spreadsheet"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Export CSV
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  
                  {/* Segmented Controller (tab switcher) */}
                  <div className="bg-slate-200/70 dark:bg-zinc-800/80 p-0.5 rounded-xl flex border-[0.5px] border-slate-300/10 w-full sm:w-auto">
                    {['all', 'todo', 'done'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`flex-1 sm:flex-initial text-center px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
                          statusFilter === status 
                            ? 'bg-white dark:bg-[#2C2C2E] text-slate-950 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                        }`}
                      >
                        {status === 'all' ? 'All' : status === 'todo' ? 'Pending' : 'Done'}
                      </button>
                    ))}
                  </div>

                  {/* Dropdowns container */}
                  <div className="flex gap-2.5 w-full sm:w-auto">
                    {/* Priority Select */}
                    <div className="flex-1 sm:flex-initial bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl flex items-center justify-between sm:justify-start gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">filter_alt</span>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-transparent border-0 outline-none pr-3 cursor-pointer text-slate-800 dark:text-zinc-200 font-bold p-0 w-full"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    {/* Sort Select */}
                    <div className="flex-1 sm:flex-initial bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl flex items-center justify-between sm:justify-start gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">sort</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent border-0 outline-none pr-3 cursor-pointer text-slate-800 dark:text-zinc-200 font-bold p-0 w-full"
                      >
                        <option value="newest">Newest First</option>
                        <option value="dueDate_asc">Due Date (Asc)</option>
                        <option value="priority_high">High Priority</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>



              {/* Grid Lists */}
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#121212] rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm text-center p-6 mt-2">
                  <span className="material-symbols-outlined text-[42px] text-slate-300 mb-4">checklist</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No tasks found</h3>
                  <p className="text-sm text-slate-500  mt-1 mb-6 dark:text-zinc-400">Database is empty or your active filter matches nothing.</p>
                  <button
                    onClick={openCreateModal}
                    className="bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px] font-bold">add</span> Create Task
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tasks.map(task => renderTaskCard(task, false))}
                  
                  {/* Quick Add Bento Item */}
                  <div
                    onClick={openCreateModal}
                    className="bg-white/50 dark:bg-[#121212]/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-800 flex items-center justify-center p-6 min-h-[160px] cursor-pointer hover:bg-white dark:hover:bg-[#121212] transition-colors duration-250 group"
                  >
                    <div className="text-center">
                      <span className="material-symbols-outlined text-black dark:text-white group-hover:scale-115 transition-transform duration-200 text-[28px] font-bold">add_circle</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 mt-1">Quick Add Task</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* KANBAN BOARD VIEW */}
          {activeView === 'projects' && (
            <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto w-full">
              
              {/* Kanban header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-zinc-500 mb-1">
                    <span>Projects</span>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span>Sprint Board</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    Task Board
                    <span className="bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-[10px] px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                  </h2>
                </div>

                <button
                  onClick={openCreateModal}
                  className="bg-black text-white hover:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-100 text-xs font-bold px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] font-bold">add</span> Add Task
                </button>
              </div>

              {/* Dynamic Project Progress Card */}
              <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm shrink-0">
                <div className="flex justify-between items-end mb-2.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Board Progress</h3>
                    <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {analytics.completionRate}% Done
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    {analytics.completedTasks} / {analytics.totalTasks} tasks completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-black dark:bg-white h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${analytics.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Kanban Column Grid */}
              {(() => {
                const todoTasks = tasks.filter(t => t.status === 'todo');
                const todoPoints = todoTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                
                const ipTasks = tasks.filter(t => t.status === 'in-progress');
                const ipPoints = ipTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                
                const doneTasks = tasks.filter(t => t.status === 'done');
                const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
                
                return (
                  <div className="flex-1 overflow-x-auto min-h-[420px] pb-4 custom-scrollbar">
                    <div className="flex gap-6 h-full min-w-[960px]">
                      
                      {/* TODO Column */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'todo')}
                        className={`w-80 bg-slate-200/40 dark:bg-[#121212]/30 rounded-2xl p-4 flex flex-col h-full border ${
                          todoTasks.length > 5 ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-900/40' : 'border-slate-200/40 dark:border-zinc-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                          <span className="text-xs font-bold text-slate-655 dark:text-zinc-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-600 inline-block"></span>
                            To Do
                            {todoTasks.length > 5 && (
                              <span className="text-[9px] font-extrabold text-neutral-900 dark:text-white uppercase tracking-wider animate-pulse">WIP Limit</span>
                            )}
                          </span>
                          <span className="bg-slate-200 dark:bg-zinc-850 text-[10px] font-bold text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{todoTasks.length} {todoTasks.length === 1 ? 'task' : 'tasks'}</span>
                            {todoPoints > 0 && (
                              <span className="text-slate-400 dark:text-zinc-550">• {todoPoints} pts</span>
                            )}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                          {todoTasks.map(task => renderTaskCard(task, true))}
                        </div>
                      </div>

                      {/* IN PROGRESS Column */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'in-progress')}
                        className={`w-80 bg-slate-200/40 dark:bg-[#121212]/30 rounded-2xl p-4 flex flex-col h-full border ${
                          ipTasks.length > 3 ? 'border-neutral-950 dark:border-neutral-50 bg-neutral-100 dark:bg-neutral-900/40' : 'border-slate-200/40 dark:border-zinc-800/40'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                          <span className="text-xs font-bold text-slate-655 dark:text-zinc-300 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white inline-block animate-pulse"></span>
                            In Progress
                            {ipTasks.length > 3 && (
                              <span className="text-[9px] font-extrabold text-neutral-950 dark:text-white uppercase tracking-wider animate-pulse">Overloaded</span>
                            )}
                          </span>
                          <span className="bg-slate-200 dark:bg-zinc-850 text-[10px] font-bold text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{ipTasks.length} {ipTasks.length === 1 ? 'task' : 'tasks'}</span>
                            {ipPoints > 0 && (
                              <span className="text-slate-400 dark:text-zinc-550">• {ipPoints} pts</span>
                            )}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                          {ipTasks.map(task => renderTaskCard(task, true))}
                        </div>
                      </div>

                      {/* DONE Column */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'done')}
                        className="w-80 bg-slate-200/40 dark:bg-[#121212]/30 rounded-2xl p-4 flex flex-col h-full border border-slate-200/40 dark:border-zinc-800/40"
                      >
                        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                          <span className="text-xs font-bold text-slate-655 dark:text-zinc-305 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 dark:bg-white inline-block"></span>
                            Done
                          </span>
                          <span className="bg-slate-200 dark:bg-zinc-850 text-[10px] font-bold text-slate-500 dark:text-zinc-400 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{doneTasks.length} {doneTasks.length === 1 ? 'task' : 'tasks'}</span>
                            {donePoints > 0 && (
                              <span className="text-slate-400 dark:text-zinc-550">• {donePoints} pts</span>
                            )}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                          {doneTasks.map(task => renderTaskCard(task, true))}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* ANALYTICS METRICS VIEW */}
          {activeView === 'analytics' && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Productivity Dashboard</h2>
                <p className="text-sm text-slate-500 mt-1 dark:text-zinc-400">Dynamic stats calculated in real-time from your MongoDB database.</p>
              </div>

              {/* Metrics cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm flex items-center justify-between group hover:border-black dark:hover:border-white transition-colors duration-205">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Completed Tasks</span>
                    <div className="text-3xl font-extrabold text-black dark:text-white mt-1.5">{analytics.completedTasks}</div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-450 flex items-center gap-0.5 mt-1.5">
                      <span className="material-symbols-outlined text-[14px]">trending_up</span>
                      {analytics.completionRate}% completion rate
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-200 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">task_alt</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm flex items-center justify-between group hover:border-black dark:hover:border-white transition-colors duration-205">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Active Pending</span>
                    <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5">{analytics.pendingTasks}</div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5 mt-1.5">
                      {analytics.inProgressTasks} currently in progress
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-200 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#121212] p-5 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm flex items-center justify-between group hover:border-black dark:hover:border-white transition-colors duration-205">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500">High Priorities</span>
                    <div className="text-3xl font-extrabold text-black dark:text-white mt-1.5">{analytics.highPriority}</div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-0.5 mt-1.5">
                      Urgent focus required
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-200 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                </div>
              </div>

              {/* Graphic charts & activities */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Chart Card */}
                <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm lg:col-span-2 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Task Completion Trends</h3>
                    <select
                      value={analyticsDays}
                      onChange={(e) => setAnalyticsDays(Number(e.target.value))}
                      className="bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-650 dark:text-zinc-300 px-3 py-1.5 rounded-lg border-0 outline-none cursor-pointer"
                    >
                      <option value={7}>Last 7 Days</option>
                      <option value={30}>Last 30 Days</option>
                    </select>
                  </div>

                  <div className="flex-1 flex items-end justify-between gap-3 pt-6 border-b border-slate-150 dark:border-zinc-850 pb-2 px-1 h-44">
                    {Object.keys(chartHeightMultipliers).map(day => (
                      <div key={day} className="w-full flex flex-col items-center gap-2 group">
                        <div
                          className={`w-full bg-neutral-200 dark:bg-neutral-800 rounded-t-[4px] hover:bg-black dark:hover:bg-white transition-all duration-300 ease-out cursor-pointer relative ${chartHeightMultipliers[day]}`}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                            {day === 'Fri' ? '18 tasks' : day === 'Wed' ? '15 tasks' : '8 tasks'}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity List Card */}
                <div className="bg-white dark:bg-[#121212] p-6 rounded-2xl border border-neutral-250/30 dark:border-neutral-800/40 shadow-sm flex flex-col">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Activity Log</h3>
                  <div className="flex-1 overflow-y-auto space-y-4 max-h-[250px] pr-2 custom-scrollbar">
                    {activities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-neutral-105 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-200">
                          <span className="material-symbols-outlined text-[14px] font-bold">
                            {activity.type === 'add' ? 'add' :
                             activity.type === 'check' ? 'check' :
                             activity.type === 'delete' ? 'delete' : 'info'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 break-words leading-tight">{activity.text}</p>
                          <span className="text-[9px] font-semibold text-slate-400 mt-0.5 inline-block">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* CREATE / EDIT TASK MODAL SHEET */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#121212] w-full sm:w-[480px] rounded-t-3xl sm:rounded-2xl shadow-2xl border border-neutral-200/50 dark:border-neutral-800/50 overflow-hidden flex flex-col max-h-[90%] sm:max-h-[85%] animate-fade-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-[#121212] sticky top-0 z-10">
              <button 
                onClick={closeModal} 
                className="text-sm font-semibold text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' ? 'New Task' : 'Edit Details'}
              </h3>
              <button 
                onClick={handleFormSubmit}
                className="text-sm font-bold text-black dark:text-white hover:opacity-80 active:scale-95 transition-all"
              >
                {modalMode === 'create' ? 'Add' : 'Done'}
              </button>
            </div>

            {/* Modal Body form */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
                
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="taskTitle">
                    Task Title <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    id="taskTitle"
                    type="text"
                    placeholder="Update API models..."
                    value={formTitle}
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (e.target.value.trim() !== '') {
                        setFormErrors(prev => ({ ...prev, title: null }));
                      }
                    }}
                    className={`w-full bg-slate-50 dark:bg-black border rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all ${
                      formErrors.title ? 'border-[#FF3B30]' : 'border-neutral-200 dark:border-neutral-800/85'
                    }`}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs font-semibold text-[#FF3B30]">{formErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="taskDescription">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    rows="3"
                    placeholder="Enter details here..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all resize-none"
                  />
                </div>

                {/* Date, Priority & Story Points */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="dueDate">
                      Due Date
                    </label>
                    <input
                      id="dueDate"
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="priority">
                      Priority
                    </label>
                    <CustomSelect
                      label="Priority"
                      value={formPriority}
                      onChange={setFormPriority}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1" htmlFor="storyPoints">
                      Story Points
                    </label>
                    <CustomSelect
                      label="Story Points"
                      value={formStoryPoints}
                      onChange={(v) => setFormStoryPoints(Number(v))}
                      options={[1,2,3,5,8,13].map(pt => ({ value: pt, label: `${pt} ${pt===1?'point':'points'}` }))}
                    />
                  </div>
                </div>

                {/* Status & Project */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="status">
                      Status
                    </label>
                    <CustomSelect
                      label="Status"
                      value={formStatus}
                      onChange={setFormStatus}
                      options={[
                        { value: 'todo', label: 'To Do' },
                        { value: 'in-progress', label: 'In Progress' },
                        { value: 'done', label: 'Done' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="project">
                      Project
                    </label>
                    <CustomSelect
                      label="Project"
                      value={formProject}
                      onChange={setFormProject}
                      options={[
                        { value: '', label: 'No Project (Standalone)' },
                        ...projects.map(p => ({ value: p._id, label: `${p.name} (${p.key})` }))
                      ]}
                    />
                  </div>
                </div>

                {/* Assignee Selection dropdown */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1" htmlFor="assignee">
                    Assignee
                  </label>
                  <AssigneeSelect
                    label="Assignee"
                    value={formAssignee}
                    onChange={setFormAssignee}
                    projectMembers={formProject ? (projects.find(p => p._id === formProject)?.members || []) : []}
                    workspaceUsers={users}
                  />
                </div>

                {/* Tags Section */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Design, Bug)..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      className="flex-1 bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 px-4 rounded-xl text-xs font-bold transition-all text-neutral-800 dark:text-neutral-200"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Tag List Badges */}
                  {formTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 border border-neutral-100 dark:border-neutral-850">
                      {formTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200/30 dark:border-neutral-800/30 uppercase tracking-wider">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500 font-extrabold text-[12px] leading-none shrink-0"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtasks Section */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                    Task Checklist / Subtasks
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add subtask items..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                      className="flex-1 bg-slate-50 dark:bg-black border border-neutral-200 dark:border-neutral-800/85 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 dark:text-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/25 dark:focus:ring-white/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={addSubtask}
                      className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-800 px-4 rounded-xl text-xs font-bold transition-all text-neutral-800 dark:text-neutral-200"
                    >
                      Add
                    </button>
                  </div>

                  {/* Checklist Subtask Items list */}
                  {formSubtasks.length > 0 && (
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/50 border border-neutral-100 dark:border-neutral-850">
                      {formSubtasks.map((sub, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 bg-white dark:bg-[#121212] p-2 rounded-lg border border-neutral-150 dark:border-neutral-850 shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => toggleSubtaskInForm(index)}
                              className="custom-checkbox w-4 h-4 rounded text-black dark:text-white border-neutral-350 dark:border-neutral-700 focus:ring-0 cursor-pointer"
                            />
                            <span className={`text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate ${
                              sub.completed ? 'line-through opacity-60' : ''
                            }`}>
                              {sub.title}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeSubtaskInForm(index)}
                            className="text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>
            </div>
            
          </div>
        </div>
      )}

      {projectModalOpen && renderCreateProjectModal()}
      {manageMembersOpen && renderManageMembersModal()}

      {/* KEYBOARD SHORTCUT CHEAT-SHEET MODAL */}
      {shortcutModalOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShortcutModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#121212]  rounded-2xl border border-slate-200/50 dark:border-zinc-800/50 shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-slate-700 dark:text-zinc-300">keyboard</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShortcutModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            </div>

            {/* Shortcut list */}
            <div className="px-6 py-4 space-y-1">
              {[
                { section: 'Navigation' },
                { keys: ['⌘', '1'], label: 'Go to Inbox' },
                { keys: ['⌘', '2'], label: 'Go to Board' },
                { keys: ['⌘', '3'], label: 'Go to Analytics' },
                { section: 'Tasks' },
                { keys: ['⌘', 'Q'], label: 'New Task' },
                { keys: ['⌘', 'K'], label: 'Focus Search' },
                { section: 'Workspace' },
                { keys: ['⌘', 'N'], label: 'New Project' },
                { keys: ['⌘', 'B'], label: 'Toggle Notifications' },
                { keys: ['⌘', 'Y'], label: 'Toggle Dark Mode' },
                { section: 'General' },
                { keys: ['⌘', '/'], label: 'Show this help' },
                { keys: ['Esc'], label: 'Close modal / clear search' },
              ].map((item, i) => {
                if (item.section) {
                  return (
                    <div key={i} className="pt-3 pb-1 first:pt-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-zinc-500">{item.section}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          <kbd className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 font-mono shadow-sm">{k}</kbd>
                          {ki < item.keys.length - 1 && <span className="text-[10px] text-slate-400 dark:text-zinc-500">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">Press <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-[9px] font-bold font-mono">Esc</kbd> or click outside to close</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
