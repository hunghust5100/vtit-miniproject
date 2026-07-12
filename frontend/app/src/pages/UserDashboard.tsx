import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  HardDrive, 
  ClipboardList, 
  RefreshCw, 
  Disc,
  Eye
} from 'lucide-react';
import './Dashboard.css';

interface AllocationItem {
  id: number;
  assetModelId: number;
  assetModelName: string;
  staffId: number;
  staffName: string;
  assetInstanceId: number;
  requestAt: string;
  actionAt: string | null;
  status: string;
  receivedAt: string | null;
  expectedReturnDate: string | null;
  returnedAt: string | null;
}

interface AssignedAsset {
  id: number;
  allocationId: number;
  name: string;
  serial: string;
  assignedDate: string;
  status: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<AssignedAsset[]>([]);

  // Device detail modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any>(null);
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get staff ID by email
      const usersRes = await api.get('/api/v1/users?size=100');
      const currentUser = usersRes.data?.content?.find((u: any) => u.email === user.email);
      
      if (!currentUser) {
        throw new Error('Không tìm thấy thông tin tài khoản nhân viên trên hệ thống.');
      }
      
      const currentStaffId = currentUser.id;

      // 2. Fetch allocations for this staff
      const allocRes = await api.get(`/api/v1/allocation/staff/${currentStaffId}?size=50&sortBy=id&sortDir=desc`);
      const allAllocations: AllocationItem[] = allocRes.data?.content || [];
      setAllocations(allAllocations);

      // 3. Fetch details for assigned devices (status = USING)
      const usingAllocations = allAllocations.filter((a) => a.status === 'USING');
      const assetsList: AssignedAsset[] = await Promise.all(
        usingAllocations.map(async (a) => {
          try {
            const instanceRes = await api.get(`/api/v1/assets/instance/${a.assetInstanceId}`);
            return {
              id: a.assetInstanceId,
              allocationId: a.id,
              name: a.assetModelName,
              serial: instanceRes.data?.serial || `VTIT-SR-${a.assetInstanceId}`,
              assignedDate: a.receivedAt ? new Date(a.receivedAt).toLocaleDateString('vi-VN') : 'Đang bàn giao',
              status: 'ACTIVE'
            };
          } catch (err) {
            console.error(`Failed to fetch instance details for ID ${a.assetInstanceId}`, err);
            return {
              id: a.assetInstanceId,
              allocationId: a.id,
              name: a.assetModelName,
              serial: `VTIT-SR-${a.assetInstanceId}`,
              assignedDate: a.receivedAt ? new Date(a.receivedAt).toLocaleDateString('vi-VN') : 'Đang bàn giao',
              status: 'ACTIVE'
            };
          }
        })
      );
      
      setAssignedAssets(assetsList);
    } catch (err: any) {
      console.error('Failed to load user dashboard data', err);
      setError(err.message || 'Lỗi khi đồng bộ dữ liệu với máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.email]);

  const handleOpenDetailModal = async (assetId: number) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedAssetDetail(null);
    setSelectedModelDetail(null);
    try {
      const assetRes = await api.get(`/api/v1/assets/instance/${assetId}`);
      setSelectedAssetDetail(assetRes.data);
      if (assetRes.data?.assetModelId) {
        try {
          const modelRes = await api.get(`/api/v1/assets/model/${assetRes.data.assetModelId}`);
          setSelectedModelDetail(modelRes.data);
        } catch (modelErr) {
          console.error("Failed to fetch model details", modelErr);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch asset details", err);
      setDetailError("Không thể tải thông tin chi tiết thiết bị.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const pendingCount = allocations.filter(a => a.status === 'PENDING' || a.status === 'APPROVED').length;

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dashboard-title">Thiết bị cá nhân (User Dashboard)</h1>
          <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Nhân viên'}. Dưới đây là thông tin các thiết bị vật lý được bàn giao cho bạn.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={fetchDashboardData}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Đồng bộ dữ liệu
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Thiết bị đang dùng</span>
            <span className="metric-value">{loading ? '...' : assignedAssets.length}</span>
          </div>
          <div className="metric-icon-wrapper accent-blue">
            <HardDrive size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Yêu cầu đang chờ duyệt/bàn giao</span>
            <span className="metric-value">{loading ? '...' : pendingCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-orange">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* Assigned Assets Section */}
      <div className="dashboard-content-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={20} style={{ color: 'var(--primary-color)' }} />
            Danh sách thiết bị bàn giao sử dụng
          </h2>
          <button 
            type="button" 
            className="btn-primary-sm" 
            onClick={() => navigate('/user/requests')}
            style={{ padding: '8px 16px', borderRadius: '50px' }}
          >
            Yêu cầu cấp phát mới
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)' }}></div>
            <span>Đang tải danh sách thiết bị bàn giao...</span>
          </div>
        ) : assignedAssets.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Disc size={32} style={{ color: 'var(--text-muted)' }} />
            <span>Bạn hiện không giữ thiết bị vật lý nào được bàn giao từ hệ thống.</span>
            <button type="button" className="btn-outline-sm" onClick={() => navigate('/user/requests')}>Tạo yêu cầu mượn thiết bị ngay</button>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã số thiết bị</th>
                  <th>Dòng máy (Model)</th>
                  <th>Số Serial</th>
                  <th>Ngày bàn giao</th>
                  <th>Trạng thái sử dụng</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignedAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td data-label="Mã số thiết bị" style={{ fontFamily: 'monospace' }}>#{asset.id}</td>
                    <td data-label="Dòng máy (Model)" style={{ fontWeight: 600 }}>{asset.name}</td>
                    <td data-label="Số Serial" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 500 }}>{asset.serial}</td>
                    <td data-label="Ngày bàn giao">{asset.assignedDate}</td>
                    <td data-label="Trạng thái sử dụng">
                      <span className="status-badge active">Đang sử dụng</span>
                    </td>
                    <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ color: 'var(--primary-color)', borderColor: 'rgba(227, 6, 19, 0.2)', padding: '5px 12px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        onClick={() => handleOpenDetailModal(asset.id)}
                        title="Xem chi tiết thiết bị"
                      >
                        <Eye size={14} /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      {isDetailOpen && createPortal(
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, padding: '16px' }} onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '100%', backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HardDrive size={20} style={{ color: 'var(--primary-color)' }} />
                Thông tin chi tiết thiết bị {selectedAssetDetail ? `#${selectedAssetDetail.id}` : ''}
              </h2>
              <button 
                type="button" 
                className="btn-outline-sm" 
                onClick={() => setIsDetailOpen(false)}
                style={{ padding: '6px 16px', borderRadius: '50px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)' }}></div>
                <span>Đang tải thông tin chi tiết...</span>
              </div>
            ) : detailError ? (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px' }}>
                {detailError}
              </div>
            ) : selectedAssetDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
                  
                  {/* Column 1: General & Purchase Info */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông tin chung
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Dòng máy:</span>
                          <strong style={{ textAlign: 'right' }}>{selectedAssetDetail.assetModelName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Mã dòng máy:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{selectedModelDetail?.code || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Hãng sản xuất:</span>
                          <strong>{selectedModelDetail?.manufacturer || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Loại thiết bị:</span>
                          <span>{selectedAssetDetail.assetTypeName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Số Serial:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-color)' }}>{selectedAssetDetail.serial}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Trạng thái:</span>
                          <span className="status-badge active" style={{ margin: 0 }}>Đang sử dụng</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông tin mua sắm
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Ngày mua:</span>
                          <span>{selectedAssetDetail.purchaseDate ? new Date(selectedAssetDetail.purchaseDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Giá trị ban đầu:</span>
                          <strong>{selectedAssetDetail.purchasePrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAssetDetail.purchasePrice) : '-'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)' }}>MÃ QR THIẾT BỊ</div>
                      <QRCodeSVG
                        id={`qr-user-${selectedAssetDetail.serial}`}
                        value={`${appBaseUrl}/qr-scan/${selectedAssetDetail.serial}`}
                        size={120}
                        includeMargin={true}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quét để truy cập nhanh từ điện thoại</div>
                    </div>
                  </div>

                  {/* Column 2: Specs */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông số kỹ thuật
                      </h3>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Specifications from Instance */}
                        {selectedAssetDetail.specification && Object.keys(selectedAssetDetail.specification).length > 0 ? (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số riêng thiết bị:</div>
                            {Object.entries(selectedAssetDetail.specification).map(([key, val]) => (
                              <div key={`instance-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                                <span style={{ fontWeight: 600 }}>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Không có thông số kỹ thuật.</div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}
          </div>
        </div>
      , document.body)}
    </div>
  );
};

export default UserDashboard;
