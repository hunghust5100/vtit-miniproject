import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FolderTree, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import './Dashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState({
    departmentsCount: 0,
    modelsCount: 0,
    instancesCount: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query counts from 3 endpoints concurrently
      const [deptsRes, modelsRes, instancesRes] = await Promise.all([
        api.get('/api/v1/department?page=0&size=1'),
        api.get('/api/v1/assets/model?page=0&size=1'),
        api.get('/api/v1/assets/instance?page=0&size=1')
      ]);

      setMetrics({
        departmentsCount: deptsRes.data?.totalElements || 0,
        modelsCount: modelsRes.data?.totalElements || 0,
        instancesCount: instancesRes.data?.totalElements || 0,
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard metrics', err);
      setError('Không thể kết nối lấy toàn bộ số liệu thời gian thực. Đang hiển thị dữ liệu mẫu.');
      
      // Fallback
      setMetrics({
        departmentsCount: 2,
        modelsCount: 4,
        instancesCount: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Hệ thống Quản trị (Admin)</h1>
          <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Admin'}. Dưới đây là tổng quan hệ thống thiết bị.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={fetchDashboardData} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--warning)', fontSize: '13px', backgroundColor: '#fffbeb', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Phòng ban</span>
            <span className="metric-value">{loading ? '...' : metrics.departmentsCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-green">
            <FolderTree size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Model Thiết bị</span>
            <span className="metric-value">{loading ? '...' : metrics.modelsCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-orange">
            <Cpu size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Tổng Thiết bị</span>
            <span className="metric-value">{loading ? '...' : metrics.instancesCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-purple">
            <HardDrive size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
