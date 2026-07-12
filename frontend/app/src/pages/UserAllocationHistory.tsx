import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { 
  History,
  Eye, 
  CheckCircle2, 
  Calendar, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  HardDrive
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

const UserAllocationHistory: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  
  // Filtering & Pagination State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any>(null);
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailStatus, setDetailStatus] = useState<string>('');

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  // Time state for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerConfirm = (title: string, message: string, callback: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => callback);
    setConfirmOpen(true);
  };

  const fetchStaffId = () => {
    if (!user?.id) return;
    setStaffId(user.id);
    fetchAllocations(user.id);
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
        const rawContent: AllocationItem[] = data.content || [];
        
        // Filter locally by status if not ALL
        let filteredContent = rawContent;
        if (statusFilter !== 'ALL') {
          filteredContent = rawContent.filter(a => a.status.toUpperCase() === statusFilter.toUpperCase());
        }
        
        setAllocations(filteredContent);
        setTotalElements(filteredContent.length);
        setTotalPages(Math.ceil(filteredContent.length / size) || 1);
      }
    } catch (err: any) {
      console.error('Failed to load user allocations history', err);
      setError(err.message || 'Lỗi khi kết nối lấy dữ liệu lịch sử cấp phát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffId();
  }, [user?.id]);

  // Refetch when page or status filter changes
  useEffect(() => {
    if (staffId) {
      fetchAllocations(staffId);
    }
  }, [page, statusFilter, staffId]);

  const handleConfirmReceipt = (id: number) => {
    triggerConfirm(
      'Xác nhận nhận thiết bị',
      `Bạn có chắc chắn muốn xác nhận đã nhận bàn giao thiết bị cho yêu cầu #${id}? Trạng thái yêu cầu sẽ chuyển sang "ĐANG SỬ DỤNG".`,
      async () => {
        try {
          await api.put(`/api/v1/allocation/${id}`, null, {
            params: { status: 'USING' }
          });
          toast.showSuccess('Xác nhận nhận thiết bị thành công!');
          if (staffId) {
            fetchAllocations(staffId);
          }
        } catch (err: any) {
          console.error(`Failed to confirm receipt for allocation #${id}`, err);
          toast.showError('Thao tác thất bại: ' + (err.response?.data?.message || err.message));
        }
      }
    );
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

  const getStatusBadge = (statusStr: string, requestAtStr?: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'PENDING';
    
    if (status === 'PENDING' && requestAtStr) {
      const expirationTime = new Date(requestAtStr.replace('T', ' ')).getTime() + 24 * 60 * 60 * 1000;
      const diff = expirationTime - currentTime;
      if (diff <= 0) {
        return <span className="status-badge inactive" style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }}>Đã hủy (Quá hạn)</span>;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (num: number) => String(num).padStart(2, '0');
      const timeString = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
      
      return (
        <span className="status-badge pending" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '6px 12px' }}>
          <span>Chờ phê duyệt</span>
          <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'monospace' }}>Còn lại: {timeString}</span>
        </span>
      );
    }

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

  const handleRefresh = () => {
    if (staffId) {
      fetchAllocations(staffId);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={26} style={{ color: 'var(--primary-color)' }} />
            Lịch sử Cấp phát Thiết bị
          </h1>
          <p className="page-subtitle">Xem toàn bộ lịch sử bàn giao, sử dụng và hoàn trả thiết bị phần cứng của bạn tại VTIT.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={handleRefresh}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <label style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>Trạng thái cấp phát:</label>
          <select 
            className="select-filter" 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ phê duyệt</option>
            <option value="APPROVED">Đã duyệt - Chờ bàn giao</option>
            <option value="USING">Đang sử dụng</option>
            <option value="RETURNED">Đã trả thiết bị</option>
            <option value="REJECTED">Bị từ chối</option>
            <option value="CANCELED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading-spinner" style={{ padding: '40px' }}>
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải lịch sử cấp phát...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="empty-data-view" style={{ padding: '40px' }}>
            <span>Không tìm thấy lịch sử cấp phát nào khớp với bộ lọc.</span>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Thiết bị (Model)</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th>Ngày nhận thực tế</th>
                    <th>Ngày hoàn trả</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Mã yêu cầu" style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{a.id}</td>
                      <td data-label="Thiết bị (Model)" style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HardDrive size={14} style={{ color: 'var(--primary-color)' }} />
                          {a.assetModelName}
                        </div>
                      </td>
                      <td data-label="Ngày yêu cầu">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                          {new Date(a.requestAt).toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td data-label="Trạng thái">{getStatusBadge(a.status, a.requestAt)}</td>
                      <td data-label="Ngày nhận thực tế">
                        {a.receivedAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Calendar size={13} style={{ color: 'var(--success)' }} />
                            {new Date(a.receivedAt).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                      <td data-label="Ngày hoàn trả">
                        {a.returnedAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                            {new Date(a.returnedAt).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                        )}
                      </td>
                      <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
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
                          ) : (
                            <>
                              {a.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  className="btn-primary-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#10b981', padding: '5px 12px', borderRadius: '50px', cursor: 'pointer', fontSize: '12px', color: '#fff', border: 'none' }}
                                  onClick={() => handleConfirmReceipt(a.id)}
                                  title="Xác nhận bạn đã nhận được thiết bị này"
                                >
                                  <CheckCircle2 size={12} /> Xác nhận đã nhận
                                </button>
                              )}
                              {a.assetInstanceId ? (
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
                            </>
                          )}
                        </div>
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
                  Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} lịch sử
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
      {isDetailOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HardDrive size={20} style={{ color: 'var(--primary-color)' }} />
                Thông tin chi tiết {detailStatus.toUpperCase() === 'PENDING' ? 'dòng thiết bị' : `thiết bị ${selectedAssetDetail ? `#${selectedAssetDetail.id}` : ''}`}
              </h2>
              <button 
                type="button" 
                className="btn-outline-sm" 
                onClick={() => setIsDetailOpen(false)}
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
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '20px' }}>
                  
                  {/* General Specifications */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông số Model
                      </h3>
                      {selectedModelDetail && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                          <div>- Tên Model: <strong>{selectedModelDetail.name}</strong></div>
                          <div>- Mã ký hiệu: <strong>{selectedModelDetail.code}</strong></div>
                          <div>- Nhà sản xuất: <strong>{selectedModelDetail.manufacturer}</strong></div>
                          <div>- Loại thiết bị: <strong>{selectedModelDetail.assetTypeName}</strong></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Physical Instance Specifications */}
                  {detailStatus.toUpperCase() !== 'PENDING' && selectedAssetDetail && (
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                          Chi tiết thiết bị bàn giao
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                          <div>- Số Serial: <strong style={{ fontFamily: 'monospace' }}>{selectedAssetDetail.serial}</strong></div>
                          <div>- Ngày mua: <strong>{new Date(selectedAssetDetail.purchaseDate).toLocaleDateString('vi-VN')}</strong></div>
                          <div>- Thời hạn bảo hành: <strong>{selectedAssetDetail.warrantyPeriodMonths} tháng</strong></div>
                          <div>- Giá trị: <strong>{selectedAssetDetail.value ? selectedAssetDetail.value.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa định giá'}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Specifications JSON rendering */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                    Thông số kỹ thuật chi tiết
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {detailStatus.toUpperCase() === 'PENDING' && selectedModelDetail?.specification && Object.keys(selectedModelDetail.specification).length > 0 ? (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số từ hãng:</div>
                        {Object.entries(selectedModelDetail.specification).map(([key, val]) => (
                          <div key={`model-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                            <span style={{ fontWeight: 600 }}>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {detailStatus.toUpperCase() !== 'PENDING' && selectedAssetDetail && (
                      selectedAssetDetail.specification && Object.keys(selectedAssetDetail.specification).length > 0 ? (
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
                      )
                    )}

                    {detailStatus.toUpperCase() === 'PENDING' && (!selectedModelDetail?.specification || Object.keys(selectedModelDetail.specification).length === 0) && (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Không có thông số kỹ thuật.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      , document.body)}

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

export default UserAllocationHistory;
