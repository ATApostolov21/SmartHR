import React, { useState, useEffect } from 'react';
import { useAppState } from '../../lib/store';
import { Shield, Plus, Trash2, Users, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

export const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { currentWorkspace, setCurrentWorkspace } = useAppState();

    // New User Form State
    const [showForm, setShowForm] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('department_head');
    const [departmentId, setDepartmentId] = useState('');

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const [usersData, departmentsData] = await Promise.all([
                api.getUsers(),
                api.getDepartments()
            ]);
            setUsers(usersData);
            setDepartments(departmentsData);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            await api.createUser({
                username,
                email,
                password,
                role,
                department_id: departmentId ? parseInt(departmentId) : null
            });
            setShowForm(false);
            // Reset form
            setUsername('');
            setEmail('');
            setPassword('');
            setRole('department_head');
            setDepartmentId('');
            loadUsers();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        const action = currentStatus ? "disable" : "enable";
        if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;
        try {
            await api.updateUserStatus(userId, !currentStatus);
            loadUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || `Failed to ${action} user`);
        }
    };

    const handleUpdateOrganization = async (name: string) => {
        try {
            await api.updateOrganization(name);
            setCurrentWorkspace(name);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Failed to update organization name");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-[#CD1A2B]" />
                        Identity & Access Management
                    </h2>
                    <p className="text-white/50 text-sm mt-1">Manage RBAC assignments and user accounts</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-blue-500/50 transition-colors">
                        <span className="text-xs text-white/50 font-medium whitespace-nowrap">Organization:</span>
                        <input
                            type="text"
                            className="bg-transparent text-sm text-white outline-none w-32 focus:w-48 transition-all"
                            value={currentWorkspace}
                            onChange={(e) => setCurrentWorkspace(e.target.value)}
                            onBlur={(e) => handleUpdateOrganization(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdateOrganization(e.currentTarget.value)
                                    e.currentTarget.blur()
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-[#CD1A2B] hover:bg-[#B11624] text-white px-4 py-2 rounded-xl transition-all font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Provision User
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-[#1A1D27] border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-4">Create New Account</h3>

                    {error && (
                        <div className="mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-white/50 font-medium">Username</label>
                            <input
                                type="text" required value={username} onChange={e => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#CD1A2B] outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/50 font-medium">Email</label>
                            <input
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#CD1A2B] outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/50 font-medium">Temporary Password</label>
                            <input
                                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#CD1A2B] outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/50 font-medium">Role Assignment</label>
                            <select
                                value={role} onChange={e => setRole(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#CD1A2B] outline-none"
                            >
                                <option value="department_head">Department Head</option>
                                <option value="hr_manager">HR Manager</option>
                                <option value="system_admin">System Admin</option>
                            </select>
                        </div>

                        {role === 'department_head' && (
                            <div className="space-y-1">
                                <label className="text-xs text-white/50 font-medium">Department (Optional)</label>
                                <select
                                    value={departmentId} onChange={e => setDepartmentId(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-[#CD1A2B] outline-none"
                                >
                                    <option value="">None</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="col-span-full pt-2 flex gap-3">
                            <button
                                type="submit" disabled={isSubmitting}
                                className="bg-[#CD1A2B] hover:bg-[#B11624] text-white px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save User
                            </button>
                            <button
                                type="button" onClick={() => setShowForm(false)}
                                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-[#1A1D27] border border-white/10 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 text-[#CD1A2B] animate-spin" />
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-white/50 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-white/70" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-white">{user.username}</div>
                                                <div className="text-xs text-white/50">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/10 text-white border border-white/10">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Disabled
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                                            className={`${user.is_active
                                                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                                                : 'text-green-400 hover:text-green-300 hover:bg-green-400/10'
                                                } transition-colors p-2 rounded-lg`}
                                            title={user.is_active ? "Disable Account" : "Enable Account"}
                                        >
                                            {user.is_active ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-white/40 text-sm">
                                        No users found in database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
