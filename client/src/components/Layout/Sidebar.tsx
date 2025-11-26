import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

// Simple icon components using Unicode symbols
const HomeIcon = () => <span className="nav-icon">🏠</span>;
const BuildingIcon = () => <span className="nav-icon">🏢</span>;
const UsersIcon = () => <span className="nav-icon">👥</span>;
const QueueIcon = () => <span className="nav-icon">📋</span>;
const FolderIcon = () => <span className="nav-icon">📁</span>;
const SettingsIcon = () => <span className="nav-icon">⚙️</span>;
const LogoutIcon = () => <span className="nav-icon">🚪</span>;

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    active: boolean;
}

const NavItem = ({ to, icon, label, active }: NavItemProps) => (
    <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
        {icon}
        <span className="nav-label">{label}</span>
    </Link>
);

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <aside className="sidebar">
            {/* Logo/Brand */}
            <div className="sidebar-header">
                <div className="brand">
                    <div className="brand-icon">PP</div>
                    <div className="brand-text">
                        <div className="brand-name">Property</div>
                        <div className="brand-subtitle">Portforio</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {/* Dashboard (All Roles) */}
                <NavItem
                    to="/"
                    icon={<HomeIcon />}
                    label="Dashboard"
                    active={isActive('/') && location.pathname === '/'}
                />

                {/* Agent Menu */}
                {user?.role === 'agent' && (
                    <>
                        <NavItem
                            to="/properties"
                            icon={<BuildingIcon />}
                            label="Properties"
                            active={isActive('/properties')}
                        />
                        <NavItem
                            to="/clients"
                            icon={<UsersIcon />}
                            label="Clients"
                            active={isActive('/clients')}
                        />
                    </>
                )}

                {/* Curator Menu */}
                {user?.role === 'curator' && (
                    <NavItem
                        to="/content-queue"
                        icon={<QueueIcon />}
                        label="Content Queue"
                        active={isActive('/content-queue')}
                    />
                )}

                {/* Owner Menu */}
                {user?.role === 'owner' && (
                    <>
                        <div className="nav-section-title">Owner</div>
                        <NavItem
                            to="/owner/portfolio"
                            icon={<FolderIcon />}
                            label="Agency Portfolio"
                            active={isActive('/owner/portfolio')}
                        />
                        <NavItem
                            to="/owner/users"
                            icon={<SettingsIcon />}
                            label="User Management"
                            active={isActive('/owner/users')}
                        />
                    </>
                )}
            </nav>

            {/* User Profile Footer */}
            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                </div>
                <button onClick={logout} className="btn-logout">
                    <LogoutIcon />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
