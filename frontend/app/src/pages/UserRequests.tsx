import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Send, 
  AlertTriangle,
  History
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
  
  // Form State
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUserDataAndModels = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get staff ID
      const usersRes = await api.get('/api/v1/users?size=100');
      const currentUser = usersRes.data?.content?.find((u: any) => u.email === user.email);
      if (!currentUser) {
        throw new Error('Không tìm thấy tài khoản nhân viên.');
      }
      setStaffId(currentUser.id);

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
  }, [user?.email]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (staffId === null) {
      toast.showError('Không xác định được ID nhân viên. Vui lòng tải lại trang.');
      return;
    }

    if (!selectedModelId) {
      setFormError('Vui lòng chọn dòng thiết bị mong muốn.');
      return;
    }

    setSubmitting(true);
    try {
      // POST /api/v1/allocation
      await api.post('/api/v1/allocation', {
        assetModelId: Number(selectedModelId),
        staffId: staffId
      });
      
      toast.showSuccess('Tạo yêu cầu cấp phát thành công! Đang chờ phê duyệt.');
      setSelectedModelId('');
      // Navigate to history page to see the new request
      navigate('/user/history');
    } catch (err: any) {
      console.error('Failed to submit allocation request', err);
      if (err.response && err.response.data && err.response.data.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Đã xảy ra lỗi khi gửi yêu cầu. Có thể do không còn thiết bị nào sẵn sàng trong kho.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header-info">
          <h1 className="page-title">Yêu cầu Cấp phát Thiết bị</h1>
          <p className="page-subtitle">Gửi yêu cầu mượn thiết bị phần cứng mới phục vụ công việc của bạn.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={() => navigate('/user/history')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Create Request Form */}
        <div className="dashboard-content-section" style={{ height: 'fit-content' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} style={{ color: 'var(--primary-color)' }} />
            Tạo yêu cầu cấp phát mới
          </h2>

          {formError && (
            <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Chọn dòng thiết bị cần mượn <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <select
                className="select-filter"
                style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px', padding: '10px 16px' }}
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={submitting || loading}
                required
              >
                <option value="">-- Chọn Dòng thiết bị (Model) --</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.manufacturer}) - {model.assetTypeName}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '50px', fontWeight: 600, marginTop: '8px' }}
              disabled={submitting || loading}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent' }}></div>
                  Đang xử lý gửi yêu cầu...
                </>
              ) : (
                <>
                  <Send size={16} /> Gửi yêu cầu cấp phát
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic Security Policy Card */}
        <div className="dashboard-content-section" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--primary-color)', height: 'fit-content' }}>
          <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
            Quy trình Đăng ký & Nhận thiết bị VTIT
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <p>Nhằm quản lý và cấp phát tài sản công nghệ thông tin khoa học và minh bạch, VTIT áp dụng quy trình sau:</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
              <div><strong>Đăng ký yêu cầu:</strong> Nhân viên chọn dòng thiết bị mong muốn và gửi yêu cầu cấp phát trên hệ thống.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
              <div><strong>Xét duyệt yêu cầu:</strong> Quản lý phòng ban hoặc Admin xem xét thông tin yêu cầu mượn thiết bị.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
              <div><strong>Bàn giao vật lý:</strong> Admin lập biên bản bàn giao, giao thiết bị phần cứng thực tế và ký xác nhận.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>4</div>
              <div><strong>Sử dụng & Bảo quản:</strong> Thiết bị chuyển trạng thái "Đang sử dụng" và được ghi nhận vào danh sách tài sản cá nhân.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRequests;
