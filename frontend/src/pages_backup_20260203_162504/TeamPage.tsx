// frontend/src/pages/TeamPage.tsx
import React, { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Search,
  Crown,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  MoreVertical,
  UserX,
  Eye,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "owner" | "admin" | "viewer";
  status: "active" | "pending";
  joined_at: string;
  last_active?: string;
}

type RoleOption = "owner" | "admin" | "viewer";

export default function TeamPage() {
  const queryClient = useQueryClient();

  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | RoleOption>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");

  const [inviteForm, setInviteForm] = useState({
    emails: "",
    role: "viewer" as RoleOption,
  });

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: async () => {
      return [
        {
          id: "1",
          name: "Ahmed El Amrani",
          email: "ahmed@dhcaas.com",
          role: "owner",
          status: "active",
          joined_at: new Date(Date.now() - 180 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "2",
          name: "Sara Benali",
          email: "sara@dhcaas.com",
          role: "admin",
          status: "active",
          joined_at: new Date(Date.now() - 90 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "3",
          name: "Mohamed Zahraoui",
          email: "mohamed@dhcaas.com",
          role: "admin",
          status: "active",
          joined_at: new Date(Date.now() - 60 * 86400000).toISOString(),
          last_active: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "4",
          name: "Fatima Alaoui",
          email: "fatima@dhcaas.com",
          role: "viewer",
          status: "pending",
          joined_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ];
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteForm) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Invitations sent successfully!");
      setIsInviteDrawerOpen(false);
      resetInviteForm();
    },
    onError: () => {
      toast.error("Failed to send invitations");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Member removed successfully");
    },
  });

  const resetInviteForm = () => {
    setInviteForm({ emails: "", role: "viewer" });
  };

  const handleInvite = () => {
    const emails = inviteForm.emails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error("Please enter at least one email");
      return;
    }

    inviteMutation.mutate(inviteForm);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30";
      case "admin":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30";
      case "viewer":
        return "bg-white/10 text-slate-400 border-white/20";
      default:
        return "bg-white/10 text-slate-400 border-white/20";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3.5 h-3.5" />;
      case "admin":
        return <Shield className="w-3.5 h-3.5" />;
      case "viewer":
        return <Eye className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = (id: string): string => {
    const gradients = [
      "from-violet-500 to-purple-600",
      "from-blue-500 to-cyan-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
      "from-pink-500 to-rose-600",
    ];
    const index = parseInt(id, 10) % gradients.length;
    return gradients[index];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    pending: members.filter((m) => m.status === "pending").length,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-300">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative p-3 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-2xl border border-violet-500/30">
                    <Users className="w-7 h-7 text-violet-400" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Team & Access</h1>
                  <p className="text-slate-400 mt-1">Manage team members, roles, and permissions</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsInviteDrawerOpen(true)}
              className="group relative px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2.5"
            >
              <UserPlus className="w-5 h-5" />
              <span>Invite Member</span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Members */}
          <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-violet-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-violet-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-xs font-medium text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                  Total
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-sm text-slate-400">Team Members</div>
            </div>
          </div>

          {/* Active */}
          <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-emerald-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-400">Active</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.active}</div>
              <div className="text-sm text-slate-400">Active Members</div>
            </div>
          </div>

          {/* Pending */}
          <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-amber-500/50">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-xs font-medium text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full">
                  Pending
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-1">{stats.pending}</div>
              <div className="text-sm text-slate-400">Awaiting Response</div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-2xl blur-xl opacity-0 focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {(["all", "owner", "admin", "viewer"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={[
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border",
                  roleFilter === role
                    ? "border-violet-500/30 bg-violet-500/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(["all", "active", "pending"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={[
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all border",
                  statusFilter === status
                    ? "border-emerald-500/30 bg-emerald-500/15 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
                ].join(" ")}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && !searchQuery && (
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-3xl"></div>
            <div className="relative">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                <Users className="h-10 w-10 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Team Members Yet</h3>
              <p className="mx-auto max-w-lg text-slate-400 mb-8">
                Start building your team by inviting members. Collaborate and manage access with ease.
              </p>
              <button
                onClick={() => setIsInviteDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-full font-semibold shadow-lg shadow-violet-500/25 hover:scale-105 transition-all"
              >
                <UserPlus className="h-5 w-5" />
                Invite Your First Member
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredMembers.length === 0 && searchQuery && (
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-500" />
            <h3 className="text-xl font-bold text-white mb-2">No members found</h3>
            <p className="text-slate-400">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Members Table */}
        {filteredMembers.length > 0 && (
          <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <MoreVertical className="w-4 h-4 ml-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr
                      key={member.id}
                      className={[
                        "group transition-colors hover:bg-white/5",
                        index !== filteredMembers.length - 1 ? "border-b border-white/5" : "",
                      ].join(" ")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(
                              member.id
                            )} flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-white/10`}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{member.name}</div>
                            <div className="text-sm text-slate-400">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(
                            member.role
                          )}`}
                        >
                          {getRoleIcon(member.role)}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            member.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.status === "active"
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-amber-400"
                            }`}
                          ></span>
                          {member.status === "active" ? "Active" : "Pending"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(member.joined_at)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-300">
                        {member.last_active ? formatDate(member.last_active) : "Never"}
                      </td>

                      <td className="px-6 py-4">
                        {member.role !== "owner" ? (
                          <Menu as="div" className="relative inline-block text-left ml-auto">
                            <Menu.Button className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Menu.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-slate-900 border border-white/10 shadow-xl backdrop-blur-xl focus:outline-none overflow-hidden z-10">
                                <div className="p-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active ? "bg-white/10" : ""
                                        } group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white transition-colors`}
                                      >
                                        <Edit2 className="w-4 h-4 text-slate-400" />
                                        Edit Member
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => {
                                          if (
                                            confirm(`Are you sure you want to remove ${member.name}?`)
                                          ) {
                                            removeMutation.mutate(member.id);
                                          }
                                        }}
                                        className={`${
                                          active ? "bg-red-500/10" : ""
                                        } group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 transition-colors`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Remove Member
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <div className="text-right">
                            <span className="text-xs text-slate-500 px-2">Owner</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invite Drawer */}
      <Transition show={isInviteDrawerOpen} as={Fragment}>
        <Dialog onClose={() => setIsInviteDrawerOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col bg-slate-950 border-l border-white/10 shadow-2xl">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl">
                              <UserPlus className="w-5 h-5 text-white" />
                            </div>
                            <Dialog.Title className="text-xl font-bold text-white">
                              Invite Team Members
                            </Dialog.Title>
                          </div>
                          <button
                            onClick={() => setIsInviteDrawerOpen(false)}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-violet-100 text-sm mt-2">
                          Add new members to your team and assign roles
                        </p>
                      </div>

                      {/* Form */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Email Addresses <span className="text-violet-400">*</span>
                          </label>
                          <textarea
                            value={inviteForm.emails}
                            onChange={(e) =>
                              setInviteForm({ ...inviteForm, emails: e.target.value })
                            }
                            placeholder="Enter email addresses (one per line)&#10;john@company.com&#10;jane@company.com&#10;bob@company.com"
                            rows={6}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono text-sm resize-none"
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            Enter one email per line for bulk invites
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Assign Role
                          </label>
                          <div className="grid grid-cols-1 gap-3">
                            {(["admin", "viewer"] as RoleOption[]).map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setInviteForm({ ...inviteForm, role })}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  inviteForm.role === role
                                    ? "border-violet-500 bg-violet-500/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      role === "admin"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-slate-500/20 text-slate-400"
                                    }`}
                                  >
                                    {role === "admin" ? (
                                      <Shield className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </div>
                                  <span className="font-semibold text-white">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  {role === "admin"
                                    ? "Can manage team, data sources, and settings"
                                    : "Can view reports and data, no edit access"}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-blue-300 mb-1">
                                Invitation Details
                              </p>
                              <p className="text-xs text-blue-400 leading-relaxed">
                                Team members will receive an email invitation with a secure link to
                                join your workspace. They'll need to accept the invitation within 7
                                days.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-white/10 bg-slate-900/50 p-6 flex gap-3">
                        <button
                          onClick={() => setIsInviteDrawerOpen(false)}
                          className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl font-semibold hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleInvite}
                          disabled={inviteMutation.isPending}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {inviteMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-5 h-5" />
                              <span>Send Invitations</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
