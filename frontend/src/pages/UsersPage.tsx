// src/pages/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Clock,
  Search,
  Plus,
  Filter,
  LayoutGrid,
  LayoutList,
  Edit2,
  Trash2,
  Mail,
  Shield,
  Crown,
  Eye,
  Download,
  History,
  UserPlus,
  UserMinus,
  LogIn,
  LogOut
} from 'lucide-react';
import UserModal from '../components/UserModal';
import userService, { type User } from '../services/userService';
import auditService, { type AuditLog } from '../services/auditService';

type ViewMode = 'list' | 'grid';
type TabMode = 'users' | 'activity';

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabMode>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs(1, 50);
      setAuditLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    pending: users.filter(u => !u.is_verified).length
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handlers
  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        await fetchUsers();
        if (activeTab === 'activity') {
          await fetchAuditLogs();
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUser(null);
    fetchUsers();
    if (activeTab === 'activity') {
      fetchAuditLogs();
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on role
  const getAvatarColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-500',
      editor: 'bg-blue-500',
      viewer: 'bg-emerald-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3.5 h-3.5" />;
      case 'editor': return <Edit2 className="w-3.5 h-3.5" />;
      case 'viewer': return <Eye className="w-3.5 h-3.5" />;
      default: return <Shield className="w-3.5 h-3.5" />;
    }
  };

  // Get action icon and color for audit logs
  const getActionStyle = (action: string) => {
    switch (action) {
      case 'CREATE_USER':
        return {
          icon: <UserPlus className="w-4 h-4" />,
          color: 'text-green-400',
          bg: 'bg-green-500/10'
        };
      case 'DELETE_USER':
      case 'DEACTIVATE_USER':
        return {
          icon: <UserMinus className="w-4 h-4" />,
          color: 'text-red-400',
          bg: 'bg-red-500/10'
        };
      case 'UPDATE_USER':
        return {
          icon: <Edit2 className="w-4 h-4" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10'
        };
      case 'ACTIVATE_USER':
        return {
          icon: <UserPlus className="w-4 h-4" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10'
        };
      case 'LOGIN':
        return {
          icon: <LogIn className="w-4 h-4" />,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10'
        };
      case 'LOGOUT':
        return {
          icon: <LogOut className="w-4 h-4" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10'
        };
      case 'REGISTER':
        return {
          icon: <UserPlus className="w-4 h-4" />,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10'
        };
      default:
        return {
          icon: <Activity className="w-4 h-4" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10'
        };
    }
  };

  // Format action text
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Management</h1>
            <p className="text-slate-400">Manage your organization's users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
            {activeTab === 'users' && (
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg text-white font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Users List
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            Activity Log
          </button>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Users */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-sm text-slate-400">Registered users</div>
              </div>

              {/* Active Users */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.active}</div>
                <div className="text-sm text-slate-400">Active members</div>
              </div>

              {/* Pending Invites */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.pending}</div>
                <div className="text-sm text-slate-400">Unverified accounts</div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 w-full lg:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                  {/* Filters Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 border rounded-lg font-medium transition-all flex items-center gap-2 ${
                      showFilters
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>

                  {/* View Switcher */}
                  <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs text-slate-400 mb-1.5 font-medium">Role</label>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-slate-800 text-white">All Roles</option>
                      <option value="admin" className="bg-slate-800 text-white">Admin</option>
                      <option value="editor" className="bg-slate-800 text-white">Editor</option>
                      <option value="viewer" className="bg-slate-800 text-white">Viewer</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-slate-400 mb-1.5 font-medium">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="all" className="bg-slate-800 text-white">All Status</option>
                      <option value="active" className="bg-slate-800 text-white">Active</option>
                      <option value="inactive" className="bg-slate-800 text-white">Inactive</option>
                    </select>
                  </div>

                  {(roleFilter !== 'all' || statusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setRoleFilter('all');
                        setStatusFilter('all');
                      }}
                      className="self-end px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              /* Empty State */
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                <p className="text-slate-400 mb-6">
                  {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by adding your first team member'}
                </p>
                {!searchQuery && roleFilter === 'all' && statusFilter === 'all' && (
                  <button
                    onClick={handleCreate}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add User
                  </button>
                )}
              </div>
            ) : viewMode === 'list' ? (
              /* List View */
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${getAvatarColor(user.role)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                                {getInitials(user.full_name)}
                              </div>
                              <div>
                                <div className="font-medium text-white">{user.full_name}</div>
                                <div className="text-sm text-slate-400 flex items-center gap-1.5">
                                  <Mail className="w-3 h-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                              user.role === 'editor' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {getRoleIcon(user.role)}
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                user.is_active ? 'bg-green-400' : 'bg-red-400'
                              }`}></span>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.is_verified
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {user.is_verified ? '✓ Verified' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {new Date(user.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                                title="Edit user"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${getAvatarColor(user.role)} rounded-full flex items-center justify-center text-white font-semibold`}>
                        {getInitials(user.full_name)}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-400 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1">{user.full_name}</h3>
                    <p className="text-sm text-slate-400 mb-4 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {user.email}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                        user.role === 'editor' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {getRoleIcon(user.role)}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          user.is_active ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className={user.is_verified ? 'text-blue-400' : 'text-amber-400'}>
                        {user.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span>
                        Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Results Summary */}
            {!loading && filteredUsers.length > 0 && (
              <div className="text-center text-sm text-slate-400">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </>
        )}

        {/* Activity Log Tab Content */}
        {activeTab === 'activity' && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Loading activity logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No activity yet</h3>
                <p className="text-slate-400">Audit logs will appear here as users perform actions</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    const actionStyle = getActionStyle(log.action);
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 bg-white/5 hover:bg-white/[0.07] rounded-lg border border-white/5 transition-all"
                      >
                        <div className={`p-2 ${actionStyle.bg} rounded-lg`}>
                          <div className={actionStyle.color}>
                            {actionStyle.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-white font-medium">
                              {formatAction(log.action)}
                            </p>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {formatRelativeTime(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mb-2">
                            <span className="text-blue-400">{log.actor_email}</span>
                            {log.target_email && (
                              <>
                                {' '}performed action on{' '}
                                <span className="text-emerald-400">{log.target_email}</span>
                              </>
                            )}
                          </p>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="text-xs text-slate-500 space-y-1">
                              {log.details.role && (
                                <div>Role: <span className="text-slate-400">{log.details.role}</span></div>
                              )}
                              {log.details.full_name && (
                                <div>Name: <span className="text-slate-400">{log.details.full_name}</span></div>
                              )}
                            </div>
                          )}
                          {log.ip_address && (
                            <p className="text-xs text-slate-600 mt-1">
                              IP: {log.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default UsersPage;
