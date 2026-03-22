
import React, { useState } from 'react';
import { Users, Plus, Trash2, Shield, UserCheck } from 'lucide-react';

interface MockUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
}

const INITIAL_USERS: MockUser[] = [
    { id: '1', name: 'Admin User', email: 'admin@masholdings.com', role: 'admin', status: 'active' },
    { id: '2', name: 'SE Engineer', email: 'se@masholdings.com', role: 'user', status: 'active' },
    { id: '3', name: 'VE Operator', email: 've@masholdings.com', role: 'user', status: 'active' },
];

export const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const handleAdd = () => {
        if (!newName || !newEmail) return;
        setUsers(prev => [...prev, { id: Date.now().toString(), name: newName, email: newEmail, role: 'user', status: 'active' }]);
        setNewName(''); setNewEmail(''); setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Remove this user?')) setUsers(prev => prev.filter(u => u.id !== id));
    };

    const toggleRole = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    };

    const toggleStatus = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                        <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">User Management</h2>
                        <p className="text-[10px] text-slate-500 font-bold">{users.length} registered users</p>
                    </div>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20">
                    <Plus size={14} /> Add User
                </button>
            </div>

            {showAdd && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-end gap-3">
                    <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                        <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white" placeholder="John Doe" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                        <input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white" placeholder="user@masholdings.com" />
                    </div>
                    <button onClick={handleAdd} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-lg">Save</button>
                </div>
            )}

            <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{u.name}</div>
                                    <div className="text-[10px] text-slate-500">{u.email}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleRole(u.id)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border transition-all ${u.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        {u.role === 'admin' ? <Shield size={10} /> : <UserCheck size={10} />} {u.role}
                                    </button>
                                </td>
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleStatus(u.id)} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${u.status === 'active' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/30'}`}>
                                        {u.status}
                                    </button>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button onClick={() => handleDelete(u.id)} className="p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 border border-red-200 dark:border-red-500/20 rounded-lg transition-all">
                                        <Trash2 size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
