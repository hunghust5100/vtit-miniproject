import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/common/ConfirmModal';
import { 
  ClipboardList, 
  History,
  Search,
  QrCode,
  ArrowRight
} from 'lucide-react';
import './admin/ManagementTable.css'; // Reuse table and layout styles

interface AssetModel {
  id: number;
  name: string;
  code: string;
  manufacturer: string;
  assetTypeName: string;
}

const UserRequests: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [staffId, setStaffId] = useState<number | null>(null);
  const [models, setModels] = useState<AssetModel[]>([]);
  
  // Search and Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [serialInput, setSerialInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingSerial, setCheckingSerial] = useState(false);

  // Confirm Modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const triggerConfirm = (title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => callback);
    setConfirmOpen(true);
  };

  const fetchUserDataAndModels = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      setStaffId(user.id);

      // 2. Get asset models
      const modelsRes = await api.get('/api/v1/assets/model?size=100');
      setModels(modelsRes.data?.content || []);
    } catch (err: any) {
      console.error('Failed to load user info or models', err);
      setError(err.message || 'Lỗi khi kết nối với máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndModels();
  }, [user?.id]);

  const handleRequestModel = (model: AssetModel) => {
    if (staffId === null) {
      toast.showError('Không xác định được ID nhân viên. Vui lòng đăng nhập lại.');
      return;
    }

    triggerConfirm(
      'Xác nhận gửi yêu cầu',
      `Bạn có chắc chắn muốn gửi yêu cầu cấp phát dòng thiết bị: ${model.name}?`,
      async () => {
        setSubmitting(true);
        try {
          await api.post('/api/v1/allocation', {
            assetModelId: model.id,
            staffId: staffId
          });
          toast.showSuccess(`Gửi yêu cầu cấp phát dòng máy ${model.name} thành công!`);
          navigate('/user/history');
        } catch (err: any) {
          console.error('Failed to submit allocation request', err);
          const errMsg = err.response?.data?.message || 'Đã xảy ra lỗi khi gửi yêu cầu. Có thể dòng thiết bị này đã hết máy sẵn sàng trong kho.';
          toast.showError(errMsg);
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleRequestSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    if (staffId === null) {
      toast.showError('Không xác định được ID nhân viên. Vui lòng đăng nhập lại.');
      return;
    }

    setCheckingSerial(true);
    try {
      // 1. Fetch asset instance by serial to check availability
      const res = await api.get(`/api/v1/assets/instance/by-serial/${serialInput.trim()}`);
      const asset = res.data;

      if (!asset) {
        toast.showError('Không tìm thấy thiết bị nào có số Serial này.');
        return;
      }

      if (asset.status !== 'AVAILABLE') {
        toast.showError(`Thiết bị có số Serial này hiện không khả dụng để cấp phát (Trạng thái hiện tại: ${asset.status}).`);
        return;
      }

      // 2. Submit allocation request for this specific instance
      await api.post('/api/v1/allocation', {
        assetInstanceId: asset.id,
        staffId: staffId
      });

      toast.showSuccess(`Đăng ký cấp phát thiết bị thực tế (Serial: ${asset.serial}) thành công!`);
      setSerialInput('');
      navigate('/user/history');
    } catch (err: any) {
      console.error('Failed to request device by serial', err);
      const errMsg = err.response?.data?.message || 'Không tìm thấy thiết bị hoặc thiết bị này không khả dụng.';
      toast.showError(errMsg);
    } finally {
      setCheckingSerial(false);
    }
  };

  // Filtered models by search query
  const filteredModels = models.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.assetTypeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Yêu cầu Cấp phát Thiết bị</h1>
          <p className="page-subtitle">Chọn dòng thiết bị hoặc quét mã thiết bị thực tế để đăng ký cấp phát phục vụ công việc.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={() => navigate('/user/history')}
        >
          <History size={14} />
          Xem lịch sử cấp phát
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fee2e2', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Sub-grid for main sections */}
        <div className="user-requests-layout">
          
          {/* Left Column: Asset Model Catalog */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="dashboard-content-section" style={{ margin: 0 }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none', paddingBottom: 0 }}>
                <ClipboardList size={18} style={{ color: 'var(--primary-color)' }} />
                Danh mục dòng thiết bị sẵn có
              </h2>

              <div className="search-box-wrapper" style={{ width: '100%', marginTop: '16px', marginBottom: '8px' }}>
                <Search size={18} className="search-icon-left" />
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Tìm kiếm dòng máy, hãng sản xuất, chủng loại..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner" style={{ margin: '0 auto 10px auto' }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Đang tải danh mục thiết bị...</p>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="dashboard-content-section" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Không tìm thấy dòng thiết bị nào phù hợp với tìm kiếm.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '16px' }}>
                {filteredModels.map((model) => (
                  <div 
                    key={model.id} 
                    className="dashboard-content-section" 
                    style={{ 
                      margin: 0, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border-color)', 
                      backgroundColor: '#fff', 
                      position: 'relative', 
                      overflow: 'hidden',
                      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
                      cursor: 'default'
                    }}
                  >
                    <span 
                      className="badge-count" 
                      style={{ 
                        alignSelf: 'flex-start', 
                        backgroundColor: 'var(--primary-light)', 
                        color: 'var(--primary-color)', 
                        fontWeight: 600, 
                        fontSize: '11px', 
                        padding: '4px 10px', 
                        borderRadius: '20px' 
                      }}
                    >
                      {model.assetTypeName}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0 2px 0', color: 'var(--text-primary)' }}>
                      {model.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      Hãng: <strong style={{ color: 'var(--text-primary)' }}>{model.manufacturer}</strong>
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      Mã dòng máy: <code>{model.code}</code>
                    </p>
                    
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ 
                        width: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px', 
                        marginTop: 'auto', 
                        padding: '10px', 
                        fontSize: '13px', 
                        borderRadius: '50px',
                        fontWeight: 600
                      }}
                      onClick={() => handleRequestModel(model)}
                      disabled={submitting}
                    >
                      Đăng ký cấp phát <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Serial Input & Rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Request specific device by Serial */}
            <div className="dashboard-content-section" style={{ margin: 0, height: 'fit-content' }}>
              <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: 'var(--text-primary)', borderBottom: 'none', paddingBottom: 0 }}>
                <QrCode size={18} style={{ color: 'var(--primary-color)' }} />
                Yêu cầu thiết bị thực tế
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '14px', lineHeight: 1.5 }}>
                Nếu bạn đang cầm thiết bị vật lý hoặc biết số Serial của thiết bị sẵn sàng trong kho, hãy nhập vào đây để yêu cầu cấp phát chính xác thiết bị đó.
              </p>
              
              <form onSubmit={handleRequestSerial} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0, borderRadius: '50px' }}
                  placeholder="Nhập số Serial (ví dụ: DELL-LAT-5420-001)"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value)}
                  disabled={checkingSerial}
                  required
                />
                
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    padding: '10px', 
                    borderRadius: '50px', 
                    fontWeight: 600 
                  }}
                  disabled={checkingSerial || !serialInput.trim()}
                >
                  {checkingSerial ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent' }}></div>
                      Đang kiểm tra Serial...
                    </>
                  ) : (
                    <>
                      Kiểm tra & Gửi yêu cầu
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Policy Card */}
            <div className="dashboard-content-section" style={{ margin: 0, backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--primary-color)', height: 'fit-content' }}>
              <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>
                Quy trình Đăng ký & Nhận thiết bị VTIT
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '10px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '11px' }}>1</div>
                  <div><strong>Đăng ký yêu cầu:</strong> Nhân viên chọn dòng thiết bị hoặc nhập số Serial cụ thể.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '11px' }}>2</div>
                  <div><strong>Xét duyệt yêu cầu:</strong> Admin xem xét phê duyệt yêu cầu cấp phát.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '11px' }}>3</div>
                  <div><strong>Bàn giao vật lý:</strong> Admin bàn giao thiết bị thực tế để nhân viên nhận.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '11px' }}>4</div>
                  <div><strong>Sử dụng:</strong> Thiết bị được ghi nhận vào danh sách tài sản cá nhân của nhân viên.</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          if (onConfirmCallback) onConfirmCallback();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default UserRequests;
