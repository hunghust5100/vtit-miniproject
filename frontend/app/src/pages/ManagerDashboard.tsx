import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardDrive, FileCheck, Check, X } from 'lucide-react';
import './Dashboard.css';

interface RequestMock {
  id: number;
  userName: string;
  assetName: string;
  reason: string;
  requestDate: string;
  status: string;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestMock[]>([
    { id: 101, userName: 'Trần Thị Lan', assetName: 'Laptop Dell Latitude 5420', reason: 'Cần máy cấu hình cao để làm việc tại nhà', requestDate: '2026-06-21', status: 'PENDING' },
    { id: 102, userName: 'Nguyễn Văn A', assetName: 'Màn hình Dell UltraSharp 24"', reason: 'Màn hình phụ hỗ trợ lập trình', requestDate: '2026-06-22', status: 'PENDING' },
  ]);

  const handleAction = (id: number, action: 'APPROVE' | 'REJECT') => {
    setRequests(prev => prev.filter(r => r.id !== id));
    alert(`Đã ${action === 'APPROVE' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} yêu cầu #${id} thành công!`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Hệ thống Quản lý Thiết bị (Manager)</h1>
        <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Quản lý'}. Dưới đây là thông tin quản lý cấp phát thiết bị của phòng ban.</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Thiết bị phòng ban</span>
            <span className="metric-value">6</span>
          </div>
          <div className="metric-icon-wrapper accent-blue">
            <HardDrive size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Yêu cầu chờ duyệt</span>
            <span className="metric-value">{requests.length}</span>
          </div>
          <div className="metric-icon-wrapper accent-orange">
            <FileCheck size={24} />
          </div>
        </div>
      </div>

      {/* Allocation Approvals Section */}
      <div className="dashboard-content-section">
        <h2 className="section-title">Yêu cầu Cấp phát Thiết bị Chờ duyệt</h2>

        {requests.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Không có yêu cầu cấp phát nào đang chờ phê duyệt.
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã Yêu Cầu</th>
                  <th>Nhân viên</th>
                  <th>Thiết bị yêu cầu</th>
                  <th>Lý do</th>
                  <th>Ngày yêu cầu</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td style={{ fontWeight: 600 }}>{r.userName}</td>
                    <td>{r.assetName}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '250px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={r.reason}>
                      {r.reason}
                    </td>
                    <td>{r.requestDate}</td>
                    <td>
                      <span className="status-badge pending">Chờ duyệt</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-primary-sm" 
                          onClick={() => handleAction(r.id, 'APPROVE')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#10b981' }}
                        >
                          <Check size={14} /> Duyệt
                        </button>
                        <button 
                          type="button" 
                          className="btn-outline-sm" 
                          onClick={() => handleAction(r.id, 'REJECT')}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                        >
                          <X size={14} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
