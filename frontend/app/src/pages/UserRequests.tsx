import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ClipboardList, 
  Send, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  HardDrive,
  AlertTriangle,
  Eye
} from 'lucide-react';
import './admin/ManagementTable.css'; // Reuse table and layout styles

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [staffId, setStaffId] = useState<number | null>(null);
  const [models, setModels] = useState<AssetModel[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  
  // Form State
  const [selectedModelId, setSelectedModelId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pagination & Sorting State
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Device detail modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any>(null);
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailStatus, setDetailStatus] = useState<string>('');

  const fetchUserDataAndModels = async () => {
    if (!user?.email) return;
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
    }
  };

  const fetchAllocations = async (currentStaffId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/allocation/staff/${currentStaffId}`, {
        params: {
          page,
          size,
          sortBy: 'id',
          sortDir: 'desc'
        }
      });
      const data = response.data;
      if (data) {
        setAllocations(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Failed to fetch allocations', err);
      setError('Không thể lấy lịch sử yêu cầu cấp phát. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndModels();
  }, [user?.email]);

  useEffect(() => {
    if (staffId !== null) {
      fetchAllocations(staffId);
    }
  }, [staffId, page, size]);

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
      
      toast.showSuccess('Tạo yêu cầu cấp phát thành công! Đang chờ Quản trị viên phê duyệt.');
      setSelectedModelId('');
      fetchAllocations(staffId);
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

  const handleOpenDetailModal = async (assetId: number | null, status: string, modelId: number) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedAssetDetail(null);
    setSelectedModelDetail(null);
    setDetailStatus(status);
    try {
      if (status.toUpperCase() === 'PENDING') {
        const modelRes = await api.get(`/api/v1/assets/model/${modelId}`);
        setSelectedModelDetail(modelRes.data);
      } else if (assetId) {
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
      }
    } catch (err: any) {
      console.error("Failed to fetch details", err);
      setDetailError("Không thể tải thông tin chi tiết.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'PENDING';
    switch (status) {
      case 'PENDING':
        return <span className="status-badge pending">Chờ phê duyệt</span>;
      case 'APPROVED':
        return <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Đã duyệt - Chờ bàn giao</span>;
      case 'USING':
        return <span className="status-badge active">Đang sử dụng</span>;
      case 'RETURNED':
        return <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>Đã trả thiết bị</span>;
      case 'REJECTED':
        return <span className="status-badge inactive">Từ chối</span>;
      case 'CANCELED':
        return <span className="status-badge inactive" style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}>Đã hủy</span>;
      default:
        return <span className="status-badge inactive">{status}</span>;
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Yêu cầu Cấp phát Thiết bị</h1>
          <p className="page-subtitle">Gửi yêu cầu mượn thiết bị phần cứng mới phục vụ công việc và theo dõi tiến trình phê duyệt cấp phát thiết bị của bạn.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
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
                style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
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

      {/* Requests History Table */}
      <div className="table-container">
        <h2 style={{ fontSize: '16px', fontWeight: 700, padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: 'var(--primary-color)' }} />
          Lịch sử yêu cầu của bạn ({totalElements})
        </h2>

        {loading ? (
          <div className="table-loading-spinner" style={{ padding: '40px' }}>
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải lịch sử yêu cầu...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="empty-data-view" style={{ padding: '40px' }}>
            <span>Bạn chưa có yêu cầu cấp phát thiết bị nào.</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Dòng thiết bị (Model)</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái yêu cầu</th>
                    <th>Ngày bàn giao thực tế</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{a.id}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HardDrive size={14} style={{ color: 'var(--primary-color)' }} />
                          {a.assetModelName}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                          {new Date(a.requestAt).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td>{getStatusBadge(a.status)}</td>
                      <td>
                        {a.receivedAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Calendar size={13} style={{ color: 'var(--success)' }} />
                            {new Date(a.receivedAt).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa bàn giao</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {a.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--primary-color)', borderColor: 'rgba(227, 6, 19, 0.2)', padding: '5px 12px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                            onClick={() => handleOpenDetailModal(null, a.status, a.assetModelId)}
                            title="Xem thông tin dòng thiết bị yêu cầu"
                          >
                            <Eye size={12} /> Dòng máy
                          </button>
                        ) : a.assetInstanceId ? (
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--primary-color)', borderColor: 'rgba(227, 6, 19, 0.2)', padding: '5px 12px', borderRadius: '50px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                            onClick={() => handleOpenDetailModal(a.assetInstanceId, a.status, a.assetModelId)}
                            title="Xem chi tiết thiết bị được bàn giao"
                          >
                            <Eye size={12} /> Thiết bị
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-bar" style={{ padding: '16px 20px' }}>
                <div className="pagination-info">
                  Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} yêu cầu
                </div>

                <div className="pagination-buttons">
                  <button type="button" className="page-btn page-btn-arrow" disabled={page === 0} onClick={() => setPage(0)}>
                    <ChevronsLeft size={16} />
                  </button>
                  <button type="button" className="page-btn page-btn-arrow" disabled={page === 0} onClick={() => setPage(prev => Math.max(0, prev - 1))}>
                    <ChevronLeft size={16} />
                  </button>

                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`page-btn ${page === num ? 'active' : ''}`}
                      onClick={() => setPage(num)}
                    >
                      {num + 1}
                    </button>
                  ))}

                  <button type="button" className="page-btn page-btn-arrow" disabled={page === totalPages - 1} onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="page-btn page-btn-arrow" disabled={page === totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Device Details Modal */}
      {isDetailOpen && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, padding: '16px' }}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '100%', backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HardDrive size={20} style={{ color: 'var(--primary-color)' }} />
                Thông tin chi tiết {detailStatus.toUpperCase() === 'PENDING' ? 'dòng thiết bị' : `thiết bị ${selectedAssetDetail ? `#${selectedAssetDetail.id}` : ''}`}
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
            ) : (selectedAssetDetail || selectedModelDetail) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  {/* Column 1: General & Purchase Info */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông tin chung
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Dòng máy:</span>
                          <strong style={{ textAlign: 'right' }}>{selectedModelDetail?.name || selectedAssetDetail?.assetModelName}</strong>
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
                          <span>{selectedModelDetail?.assetTypeName || selectedAssetDetail?.assetTypeName || '-'}</span>
                        </div>
                        {detailStatus.toUpperCase() !== 'PENDING' && selectedAssetDetail && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Số Serial:</span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-color)' }}>{selectedAssetDetail.serial}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Trạng thái:</span>
                              <span className={`status-badge ${selectedAssetDetail.status === 'USING' ? 'active' : ''}`} style={{ margin: 0 }}>
                                {selectedAssetDetail.status === 'USING' ? 'Đang sử dụng' : selectedAssetDetail.status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {detailStatus.toUpperCase() !== 'PENDING' && selectedAssetDetail && (
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
                    )}
                  </div>

                  {/* Column 2: Specs */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông số kỹ thuật
                      </h3>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Specifications from Model */}
                        {selectedModelDetail?.specification && Object.keys(selectedModelDetail.specification).length > 0 && (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số từ hãng:</div>
                            {Object.entries(selectedModelDetail.specification).map(([key, val]) => (
                              <div key={`model-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                                <span style={{ fontWeight: 600 }}>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Specifications from Instance */}
                        {detailStatus.toUpperCase() !== 'PENDING' && selectedAssetDetail && (
                          selectedAssetDetail.specification && Object.keys(selectedAssetDetail.specification).length > 0 ? (
                            <div style={{ marginTop: selectedModelDetail?.specification ? '10px' : 0 }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số riêng thiết bị:</div>
                              {Object.entries(selectedAssetDetail.specification).map(([key, val]) => (
                                <div key={`instance-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                                  <span style={{ fontWeight: 600 }}>{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            (!selectedModelDetail?.specification || Object.keys(selectedModelDetail.specification).length === 0) && (
                              <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Không có thông số kỹ thuật.</div>
                            )
                          )
                        )}

                        {detailStatus.toUpperCase() === 'PENDING' && (!selectedModelDetail?.specification || Object.keys(selectedModelDetail.specification).length === 0) && (
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
      )}
    </div>
  );
};

export default UserRequests;
