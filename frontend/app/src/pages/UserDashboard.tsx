import React from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, ClipboardList } from 'lucide-react';
import './Dashboard.css';

interface AssetMock {
  id: number;
  name: string;
  serial: string;
  assignedDate: string;
  status: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const myAssets: AssetMock[] = [
    { id: 1, name: 'Laptop Dell Latitude 5420', serial: 'DELL-LAT-5420-9988', assignedDate: '2026-06-05', status: 'ACTIVE' },
    { id: 2, name: 'Bàn phím không dây Logitech K380', serial: 'LOGI-KB-K380-1234', assignedDate: '2026-06-10', status: 'ACTIVE' },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Thiết bị cá nhân (User Dashboard)</h1>
        <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Nhân viên'}. Dưới đây là danh sách thiết bị bạn đang quản lý và sử dụng.</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Thiết bị đang dùng</span>
            <span className="metric-value">{myAssets.length}</span>
          </div>
          <div className="metric-icon-wrapper accent-blue">
            <HardDrive size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Yêu cầu cấp phát</span>
            <span className="metric-value">0</span>
          </div>
          <div className="metric-icon-wrapper accent-orange">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* Assigned Assets Section */}
      <div className="dashboard-content-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>Danh sách thiết bị bàn giao</h2>
          <button 
            type="button" 
            className="btn-primary-sm" 
            onClick={() => alert('Chức năng gửi yêu cầu cấp phát mới hiện chưa được hỗ trợ.')}
          >
            Yêu cầu cấp phát mới
          </button>
        </div>

        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã số</th>
                <th>Tên thiết bị</th>
                <th>Số Serial</th>
                <th>Ngày bàn giao</th>
                <th>Trạng thái sử dụng</th>
              </tr>
            </thead>
            <tbody>
              {myAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>#{asset.id}</td>
                  <td style={{ fontWeight: 600 }}>{asset.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{asset.serial}</td>
                  <td>{asset.assignedDate}</td>
                  <td>
                    <span className="status-badge active">Đang sử dụng</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
