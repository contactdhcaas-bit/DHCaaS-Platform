// src/pages/TeamPage.tsx
import React, { useState } from 'react';
import { 
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Mail,
  Clock,
  Check,
  X,
  Edit,
  Trash2,
  Send
} from 'lucide-react';

// ===== TYPES =====
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  lastActive: string;
  joinedDate: string;
  avatar?: string;
}

// ===== MOCK DATA =====
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    role: 'owner',
    status: 'active',
    lastActive: '2 hours ago',
    joinedDate: 'Jan 15, 2025',
  },
  {
    id: 'user-002',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    role: 'admin',
    status: 'active',
    lastActive: '5 hours ago',
    joinedDate: 'Jan 20, 2025',
  },
  {
    id: 'user-003',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    role: 'admin',
    status: 'active',
    lastActive: '1 day ago',
    joinedDate: 'Feb 1, 2025',
  },
  {
    id: 'user-004',
    name: 'Alex Kim',
    email: 'alex.kim@company.com',
    role: 'viewer',
    status: 'active',
    lastActive: '3 hours ago',
    joinedDate: 'Feb 10, 2025',
  },
  {
    id: 'user-005',
    name: 'Jordan Taylor',
    email: 'jordan.taylor@company.com',
    role: 'viewer',
    status: 'pending',
    lastActive: 'Never',
    joinedDate: 'Feb 15, 2025',
  },
  {
    id: 'user-006',
    name: 'Morgan Lee',
    email: 'morgan.lee@company.com',
    role: 'admin',
    status: 'suspended',
    lastActive: '2 weeks ago',
    joinedDate: 'Jan 5, 2025',
  },
];

// ===== MAIN COMPONENT =====
const TeamPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter members
  const filteredMembers = MOCK_TEAM_MEMBERS.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Get avatar initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    const config = {
      owner: { color: 'bg-purple-500/20 border-purple-500/30 text-purple-400', icon: Shield },
      admin: { color: 'bg-blue-500/20 border-blue-500/30 text-blue-400', icon: Shield },
      viewer: { color: 'bg-gray-500/20 border-gray-500/30 text-gray-400', icon: Users },
    };
    const { color, icon: Icon } = config[role as keyof typeof config];
    return (
      <span className={`px-3 py-1 border rounded-full text-xs font-medium flex items-center gap-1 w-fit ${color}`}>
        <Icon className="w-3 h-3" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    const config = {
      active: { color: 'bg-green-500', label: 'Active' },
      pending: { color: 'bg-yellow-500', label: 'Pending' },
      suspended: { color: 'bg-red-500', label: 'Suspended' },
    };
    const { color, label } = config[status as keyof typeof config];
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${color} rounded-full animate-pulse`}></div>
        <span className="text-sm text-slate-700 dark:text-gray-300">{label}</span>
      </div>
    );
  };

  // Handle actions
  const handleEditRole = (memberId: string) => {
    alert(`Edit role for member: ${memberId}`);
    setActiveDropdown(null);
  };

  const handleRevokeAccess = (memberId: string) => {
    if (confirm('Are you sure you want to revoke access for this member?')) {
      alert(`Access revoked for member: ${memberId}`);
    }
    setActiveDropdown(null);
  };

  const handleResendInvite = (memberId: string) => {
    alert(`Invite resent to member: ${memberId}`);
    setActiveDropdown(null);
  };

  // Stats
  const stats = {
    totalSeats: 10,
    usedSeats: MOCK_TEAM_MEMBERS.filter(m => m.status !== 'suspended').length,
    activeMembers: MOCK_TEAM_MEMBERS.filter(m => m.status === 'active').length,
    pendingInvites: MOCK_TEAM_MEMBERS.filter(m => m.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] p-4 md:p-6 space-y-6 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Manage team members and their access levels
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-medium"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Total Seats</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.usedSeats}/{stats.totalSeats}
              </p>
              <div className="mt-2 w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.usedSeats / stats.totalSeats) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Active Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeMembers}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-1">Pending Invites</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pendingInvites}</p>
            </div>
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Mail className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-white dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors appearance-none min-w-[180px]"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-900/50 border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
              {filteredMembers.map((member) => (
                <tr 
                  key={member.id}
                  className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-gray-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    {getRoleBadge(member.role)}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {getStatusIndicator(member.status)}
                  </td>

                  {/* Last Active */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      {member.lastActive}
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 dark:text-gray-400">
                      {member.joinedDate}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-xl z-10">
                          <button
                            onClick={() => handleEditRole(member.id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Role
                          </button>
                          
                          {member.status === 'pending' && (
                            <button
                              onClick={() => handleResendInvite(member.id)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Resend Invite
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleRevokeAccess(member.id)}
                            className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Revoke Access
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-gray-400">
              No team members found
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Invite Team Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                />
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Role
                </label>
                <select className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors">
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  placeholder="Add a personal message to the invite..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Invite sent successfully!');
                    setShowInviteModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 font-medium"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
