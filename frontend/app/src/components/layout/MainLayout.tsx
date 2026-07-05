import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Menu, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  Layers, 
  Cpu, 
  HardDrive,
  FileCheck,
  ClipboardList,
  User,
  History
} from 'lucide-react';
import viettelLogo from '../../assets/viettel_logo.png';
import './MainLayout.css';
import ChatbotWidget from '../chatbot/ChatbotWidget';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Normalize role
  const role = user?.role ? user.role.replace(/^ROLE_/, '') : '';

  // Collapse sidebar by default on tablet/mobile on mount
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get initial letters for avatar
  const getAvatarText = (name: string = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Get Vietnamese label for roles
  const getRoleLabel = (r: string) => {
    if (r === 'ADMIN') return 'Quản trị viên';
    if (r === 'MANAGER') return 'Quản lý';
    return 'Nhân viên';
  };

  // Build menu items based on role
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [];
    
    if (role === 'ADMIN') {
      items.push(
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/admin/users', label: 'Danh sách nhân viên', icon: <Users size={20} /> },
        { path: '/admin/departments', label: 'Quản lý Phòng ban', icon: <FolderTree size={20} /> },
        { path: '/admin/asset-types', label: 'Quản lý Loại thiết bị', icon: <Layers size={20} /> },
        { path: '/admin/asset-models', label: 'Quản lý Model thiết bị', icon: <Cpu size={20} /> },
        { path: '/admin/asset-instances', label: 'Quản lý Thiết bị', icon: <HardDrive size={20} /> },
        { path: '/admin/allocations', label: 'Quản lý Cấp phát', icon: <FileCheck size={20} /> }
      );
    } else if (role === 'MANAGER') {
      items.push(
        { path: '/manager', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/user/my-assets', label: 'Thiết bị của tôi', icon: <HardDrive size={20} /> },
        { path: '/user/requests', label: 'Yêu cầu cấp phát', icon: <ClipboardList size={20} /> },
        { path: '/user/history', label: 'Lịch sử cấp phát', icon: <History size={20} /> }
      );
    } else {
      // USER
      items.push(
        { path: '/user', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/user/my-assets', label: 'Thiết bị của tôi', icon: <HardDrive size={20} /> },
        { path: '/user/requests', label: 'Yêu cầu cấp phát', icon: <ClipboardList size={20} /> },
        { path: '/user/history', label: 'Lịch sử cấp phát', icon: <History size={20} /> }
      );
    }
    
    items.push({ path: '/profile', label: 'Thông tin cá nhân', icon: <User size={20} /> });
    
    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <button 
            type="button" 
            className="menu-toggle-btn" 
            onClick={toggleSidebar}
            aria-label="Toggle navigation sidebar"
          >
            <Menu size={24} />
          </button>
          
          <div className="header-logo-container">
            <img src={viettelLogo} alt="Viettel Logo" className="header-logo" />
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {getAvatarText(user?.fullName)}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.fullName || 'Người dùng'}</span>
              <span className="user-role">{getRoleLabel(role)}</span>
            </div>
          </div>
          
          <button 
            type="button" 
            className="logout-btn" 
            onClick={handleLogout}
            title="Đăng xuất"
            aria-label="Log out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <div className="layout-body">
        {/* Mobile overlay */}
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <aside 
          className={`layout-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}
        >
          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              // Active checks path prefix (e.g. /admin covers /admin/users), except for root dashboards which need exact match
              const isActive = (item.path === '/' || item.path === '/admin' || item.path === '/manager' || item.path === '/user')
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`menu-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-text">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Content Pane */}
        <div 
          className={`layout-content-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}
        >
          <main className="layout-content">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="layout-footer">
            <p>&copy; {new Date().getFullYear()} Viettel Information Technology. All rights reserved. Version 1.0.0</p>
          </footer>
        </div>
      </div>
      
      {/* AI Chatbot Widget (Admin Only) */}
      {role === 'ADMIN' && <ChatbotWidget />}
    </div>
  );
};

export default MainLayout;
