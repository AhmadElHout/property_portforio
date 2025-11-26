import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            const data = await response.json();
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Property Portforio</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 'var(--space-md)' }}>
                        Sign In
                    </button>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Don't have an account? </span>
                        <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}>Sign Up</Link>
                    </div>
                </form>

                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)' }}>
                    <button
                        onClick={() => setShowCredentials(!showCredentials)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}
                    >
                        {showCredentials ? 'Hide Owner Credentials' : 'Show Owner Credentials'}
                    </button>

                    {showCredentials && (
                        <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', backgroundColor: 'var(--background-secondary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                            <div>Email: <strong>owner@example.com</strong></div>
                            <div>Password: <strong>owner123</strong></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
