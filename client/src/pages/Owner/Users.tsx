import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/UI/Table';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    active: number;
}

const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const { token, user: currentUser, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'agent' });
    const [resetPasswordData, setResetPasswordData] = useState({ id: 0, password: '' });

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            showToast('Failed to fetch users', 'error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleToggleStatus = async (id: number, currentStatus: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ active: currentStatus ? 0 : 1 }),
            });
            if (response.ok) {
                showToast('User status updated', 'success');
                fetchUsers();
            } else {
                showToast('Failed to update status', 'error');
            }
        } catch (error) {
            showToast('Failed to update status', 'error');
        }
    };

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'agent' });
        setIsUserModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, password: '', role: user.role });
        setIsUserModalOpen(true);
    };

    const handleOpenPasswordModal = (user: User) => {
        setResetPasswordData({ id: user.id, password: '' });
        setIsPasswordModalOpen(true);
    };

    const handleDeleteUser = async (user: User) => {
        if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
        try {
            const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                showToast('User deleted successfully', 'success');
                if (currentUser && currentUser.id === user.id) {
                    logout();
                    navigate('/login');
                } else {
                    fetchUsers();
                }
            }
        } catch (error) {
            showToast('Failed to delete user', 'error');
        }
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingUser ? `http://localhost:3000/api/users/${editingUser.id}` : 'http://localhost:3000/api/users';
            const method = editingUser ? 'PUT' : 'POST';
            const body = editingUser ? { name: formData.name, email: formData.email, role: formData.role } : formData;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                setIsUserModalOpen(false);
                showToast(editingUser ? 'User updated' : 'User created', 'success');
                fetchUsers();
            } else {
                const data = await response.json();
                showToast(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            showToast('Failed to save user', 'error');
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:3000/api/users/${resetPasswordData.id}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password: resetPasswordData.password }),
            });
            if (response.ok) {
                setIsPasswordModalOpen(false);
                showToast('Password reset successfully', 'success');
            }
        } catch (error) {
            showToast('Failed to reset password', 'error');
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof User },
        { header: 'Email', accessor: 'email' as keyof User },
        { header: 'Role', accessor: 'role' as keyof User },
        {
            header: 'Status',
            accessor: (item: User) => (
                <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(item.id, item.active); }}
                    style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', border: 'none', cursor: 'pointer',
                        backgroundColor: item.active ? '#dcfce7' : '#fee2e2', color: item.active ? '#166534' : '#991b1b'
                    }}>
                    {item.active ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Actions',
            accessor: (item: User) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); handleOpenEditModal(item); }}>Edit</button>
                    <button className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                        onClick={(e) => { e.stopPropagation(); handleOpenPasswordModal(item); }}>Reset Pwd</button>
                    <button className="btn" style={{ padding: '2px 8px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(item); }}>Delete</button>
                </div>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1>User Management</h1>
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>Add User</button>
            </div>
            <Table data={users} columns={columns} />

            {isUserModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h2 style={{ marginBottom: 'var(--space-md)' }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                        <form onSubmit={handleUserSubmit}>
                            <div style={{ marginBottom: 'var(--space-sm)' }}>
                                <label className="label">Name</label>
                                <input className="input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: 'var(--space-sm)' }}>
                                <label className="label">Email</label>
                                <input className="input" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            {!editingUser && (
                                <div style={{ marginBottom: 'var(--space-sm)' }}>
                                    <label className="label">Password</label>
                                    <input className="input" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                </div>
                            )}
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="label">Role</label>
                                <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="agent">Agent</option>
                                    <option value="curator">Curator</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPasswordModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px' }}>
                        <h2 style={{ marginBottom: 'var(--space-md)' }}>Reset Password</h2>
                        <form onSubmit={handlePasswordReset}>
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="label">New Password</label>
                                <input className="input" type="password" value={resetPasswordData.password} onChange={e => setResetPasswordData({ ...resetPasswordData, password: e.target.value })} required minLength={6} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Reset Password</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
