import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Cpu, 
  User, 
  History, 
  ShieldAlert, 
  ArrowLeft,
  Settings,
  AlertTriangle,
  FileText
} from 'lucide-react';
import './QrScanResult.css';

interface AssetInstanceResponse {
  id: number;
  assetModelId: number;
  assetModelName: string;
  assetTypeName: string;
  serial: string;
  status: string;
  purchaseDate: string;
  purchasePrice: number;
  depreciationMethod?: string;
  netBookValue?: number;
  salvageValue?: number;
  specification?: Record<string, any>;
  maintenanceCost?: number;
}

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
  returnedAt: string | null;
}

const QrScanResult: React.FC = () => {
  const { serial } = useParams<{ serial: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [asset, setAsset] = useState<AssetInstanceResponse | null>(null);
  const [historyList, setHistoryList] = useState<AllocationItem[]>([]);
  const [loadingAsset, setLoadingAsset] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const toast = useToast();

  const isAdmin = user && user.role.replace(/^ROLE_/, '') === 'ADMIN';

  const handleRequestSpecificDevice = async () => {
    if (!user?.email) return;
    if (!asset) return;

    if (!window.confirm(`Bạn có chắc chắn muốn gửi yêu cầu cấp phát thiết bị này (Serial: ${asset.serial})?`)) {
      return;
    }

    setSubmittingRequest(true);
    try {
      // 1. Get staff ID
      const usersRes = await api.get('/api/v1/users?size=100');
      const currentUser = usersRes.data?.content?.find((u: any) => u.email === user.email);
      if (!currentUser) {
        toast.showError('Không tìm thấy tài khoản nhân viên.');
        return;
      }

      // 2. Submit allocation request
      await api.post('/api/v1/allocation', {
        assetInstanceId: asset.id,
        staffId: currentUser.id
      });

      toast.showSuccess(`Gửi yêu cầu cấp phát thiết bị (Serial: ${asset.serial}) thành công!`);
      navigate('/user/history');
    } catch (err: any) {
      console.error('Failed to submit device request', err);
      const errMsg = err.response?.data?.message || 'Đã xảy ra lỗi khi gửi yêu cầu. Thiết bị có thể không còn sẵn sàng.';
      toast.showError(errMsg);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleBack = () => {
    // If there is browser history within our app, go back. Otherwise, go to home '/'
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const getDeviceListPath = () => {
    if (!user) return '/';
    const role = user.role.replace(/^ROLE_/, '');
    const searchSuffix = asset ? `?search=${asset.serial}` : '';
    if (role === 'ADMIN') return `/admin/asset-instances${searchSuffix}`;
    return `/user/my-assets`;
  };

  useEffect(() => {
    const fetchAssetData = async () => {
      if (!serial) return;
      setLoadingAsset(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/assets/instance/by-serial/${serial}`);
        setAsset(response.data);
      } catch (err: any) {
        console.error('Fetch asset by serial failed', err);
        setError(
          err.response?.data?.message || 
          'Không tìm thấy thiết bị có số serial này trong hệ thống.'
        );
      } finally {
        setLoadingAsset(false);
      }
    };

    fetchAssetData();
  }, [serial]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!asset || !isAdmin) return;
      setLoadingHistory(true);
      try {
        const response = await api.get(`/api/v1/allocation/asset-instance/${asset.id}?size=100&sortBy=id&sortDir=desc`);
        setHistoryList(response.data?.content || []);
      } catch (err) {
        console.error('Failed to fetch allocation history', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistoryData();
  }, [asset, isAdmin]);

  const formatPrice = (price?: number) => {
    if (!price) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusBadge = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'UNKNOWN';
    switch (status) {
      case 'AVAILABLE':
        return <span className="qr-badge badge-success">Sẵn sàng</span>;
      case 'USING':
        return <span className="qr-badge badge-info">Đang sử dụng</span>;
      case 'PENDING':
      case 'APPROVED':
        return <span className="qr-badge badge-warning">Đang cấp phát</span>;
      case 'MAINTENANCE':
        return <span className="qr-badge badge-danger">Bảo trì</span>;
      case 'LIQUIDATED':
        return <span className="qr-badge badge-secondary">Đã thanh lý</span>;
      default:
        return <span className="qr-badge badge-secondary">{status}</span>;
    }
  };

  const getHistoryStatusBadge = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'PENDING';
    switch (status) {
      case 'PENDING':
        return <span className="history-badge pending">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="history-badge approved">Đã duyệt</span>;
      case 'USING':
        return <span className="history-badge using">Đang dùng</span>;
      case 'RETURNED':
        return <span className="history-badge returned">Đã thu hồi</span>;
      case 'REJECTED':
        return <span className="history-badge rejected">Từ chối</span>;
      case 'CANCELED':
        return <span className="history-badge canceled">Đã hủy</span>;
      default:
        return <span className="history-badge default">{status}</span>;
    }
  };

  if (loadingAsset) {
    return (
      <div className="qr-loading-container">
        <div className="qr-spinner"></div>
        <p>Đang quét và tải thông tin thiết bị...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="qr-error-container">
        <div className="qr-card error-card">
          <AlertTriangle size={48} className="icon-error" />
          <h2>Không tìm thấy thiết bị</h2>
          <p>{error || 'Hệ thống không thể tải dữ liệu thiết bị.'}</p>
          <button type="button" className="qr-btn qr-btn-primary" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-scan-page">
      <div className="qr-container">
        {/* Navigation Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button type="button" className="qr-back-link" onClick={handleBack}>
            <ArrowLeft size={18} /> Quay lại
          </button>
          
          <button 
            type="button" 
            className="qr-btn qr-btn-outline" 
            onClick={() => navigate(getDeviceListPath())}
            style={{ padding: '6px 16px', fontSize: '13px', borderRadius: '50px' }}
          >
            Xem thiết bị
          </button>
        </div>

        {/* Asset Header Card */}
        <div className="qr-card asset-header-card" style={{ marginBottom: '16px' }}>
          <div className="card-decor"></div>
          <div className="header-flex">
            <div className="device-avatar">
              <Cpu size={32} />
            </div>
            <div className="header-info">
              <span className="type-label">{asset.assetTypeName}</span>
              <h1 className="model-name">{asset.assetModelName}</h1>
              <p className="serial-number">Serial: <code>{asset.serial}</code></p>
            </div>
            <div className="status-container">
              {getStatusBadge(asset.status)}
            </div>
          </div>
        </div>

        {/* Specific Request Action Card for Staff/Managers */}
        {!isAdmin && asset.status === 'AVAILABLE' && (
          <div className="qr-card action-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', border: '1px solid var(--primary-light)', backgroundColor: 'var(--primary-light)', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-color)', margin: 0 }}>Thiết bị này đang sẵn sàng cấp phát!</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Bạn có thể gửi yêu cầu mượn chính xác chiếc máy này (Serial: {asset.serial}) phục vụ cho công việc.</p>
            <button
              type="button"
              className="qr-btn qr-btn-primary"
              style={{ width: 'auto', minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 24px', borderRadius: '50px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', backgroundColor: 'var(--primary-color)', color: '#fff' }}
              onClick={handleRequestSpecificDevice}
              disabled={submittingRequest}
            >
              {submittingRequest ? (
                <>
                  <div className="qr-spinner" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', margin: 0 }}></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  Yêu cầu cấp phát thiết bị này
                </>
              )}
            </button>
          </div>
        )}

        {/* Info Grid */}
        <div className="qr-info-grid">
          {/* General info */}
          <div className="qr-card spec-card">
            <h2 className="section-title">
              <FileText size={18} /> Thông tin chung
            </h2>
            <div className="spec-list">
              <div className="spec-item">
                <span className="spec-key">Mã thiết bị</span>
                <span className="spec-val font-mono">#{asset.id}</span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Ngày mua</span>
                <span className="spec-val">
                  {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Giá trị ban đầu</span>
                <span className="spec-val val-price">{formatPrice(asset.purchasePrice)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Giá trị còn lại</span>
                <span className="spec-val val-price-nbv">{formatPrice(asset.netBookValue)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Giá trị thanh lý dự kiến</span>
                <span className="spec-val">{formatPrice(asset.salvageValue)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Khấu hao đã thực hiện</span>
                <span className="spec-val">
                  {formatPrice((asset.purchasePrice || 0) - (asset.netBookValue || 0))}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-key">Chi phí bảo trì lũy kế</span>
                <span className="spec-val">{formatPrice(asset.maintenanceCost || 0)}</span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="qr-card spec-card">
            <h2 className="section-title">
              <Settings size={18} /> Thông số kĩ thuật
            </h2>
            {asset.specification && Object.keys(asset.specification).length > 0 ? (
              <div className="spec-list">
                {Object.entries(asset.specification).map(([key, value]) => (
                  <div className="spec-item" key={key}>
                    <span className="spec-key">{key}</span>
                    <span className="spec-val text-bold">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-spec-message">
                Không có dữ liệu thông số kỹ thuật chi tiết của dòng thiết bị này.
              </div>
            )}
          </div>
        </div>

        {/* History Area */}
        <div className="qr-card history-card">
          <h2 className="section-title">
            <History size={18} /> Lịch sử cấp phát thiết bị
          </h2>

          {isAdmin ? (
            loadingHistory ? (
              <div className="history-loading">
                <div className="history-spinner"></div>
                <p>Đang tải lịch sử cấp phát...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="empty-history-view">
                Thiết bị này chưa từng có lịch sử yêu cầu hoặc cấp phát.
              </div>
            ) : (
              <div className="history-timeline">
                {historyList.map((item) => (
                  <div className="timeline-item" key={item.id}>
                    <div className="timeline-badge">
                      <div className="timeline-dot"></div>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="staff-name">
                          <User size={13} /> {item.staffName}
                        </span>
                        {getHistoryStatusBadge(item.status)}
                      </div>
                      <div className="timeline-body">
                        <div className="timeline-date">
                          <span>Yêu cầu: {new Date(item.requestAt).toLocaleDateString('vi-VN')}</span>
                          {item.receivedAt && (
                            <span className="date-green">
                              Bàn giao: {new Date(item.receivedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                          {item.returnedAt && (
                            <span className="date-muted">
                              Thu hồi: {new Date(item.returnedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="history-restricted-view">
              <ShieldAlert size={36} className="restricted-icon" />
              <h3>Chỉ dành cho Quản trị viên</h3>
              <p>Để bảo mật thông tin nội bộ của nhân sự, lịch sử cấp phát và lịch sử bàn giao chi tiết chỉ hiển thị đối với tài khoản Admin.</p>
              {!user ? (
                <button type="button" className="qr-btn qr-btn-outline" onClick={() => navigate('/login')}>
                  Đăng nhập Admin
                </button>
              ) : (
                <span className="restricted-badge">Tài khoản của bạn không có quyền xem</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScanResult;
