// src/pages/UsersPage.tsx
import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import AddUserModal from '../components/AddUserModal';

const UsersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Mock data - replace with real API calls later
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2026-02-25T10:30:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@company.com',
      role: 'Editor',
      status: 'active',
      lastLogin: '2026-02-24T15:20:00Z',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@company.com',
      role: 'Viewer',
      status: 'inactive',
      lastLogin: '2026-02-20T09:15:00Z',
    },
    {
      id: '4',
      name: 'Alice Williams',
      email: 'alice@company.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2026-02-25T09:45:00Z',
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors = {
      Admin: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30',
      Editor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      Viewer: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    };
    return colors[role as keyof typeof colors] || colors.Viewer;
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
  };

  const handleModalSuccess = () => {
    // TODO: Refresh user list from API
    console.log('User added successfully - refresh list');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                User Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage team members and access controls
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#131B2C] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-black/20">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/30"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Total Users
            </p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Active
            </p>
            <p className="text-3xl font-bold text-emerald-400">
              {users.filter((u) => u.status === 'active').length}
            </p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Admins
            </p>
            <p className="text-3xl font-bold text-fuchsia-400">
              {users.filter((u) => u.role === 'Admin').length}
            </p>
          </div>
          <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-5 shadow-lg shadow-black/20">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Inactive
            </p>
            <p className="text-3xl font-bold text-slate-500">
              {users.filter((u) => u.status === 'inactive').length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl p-4 shadow-lg shadow-black/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#131B2C] border border-[#1E293B] rounded-xl overflow-hidden shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0B1120] border-b border-[#1E293B]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#1E293B]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20">
                          <span className="text-white font-semibold text-sm">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {user.name}
                          </p>
                          <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadge(
                          user.status
                        )}`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-400 text-sm">
                        {formatDate(user.lastLogin)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-[#1E293B] text-slate-400 hover:text-indigo-400 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-[#1E293B] text-slate-400 hover:text-white rounded-lg transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default UsersPage;
