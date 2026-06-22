import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  HardDrive,
  Calendar,
  DollarSign,
  Trash2,
  Pencil
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface AssetInstanceResponse {
  id: number;
  assetModelId: number;
  assetModelName: string;
  assetTypeName: string;
  serial: string;
  status: string;
  purchaseDate: string;
  purchasePrice: number;
}

interface AssetModelOption {
  id: number;
  name: string;
}

const AssetInstanceManagement: React.FC = () => {
  const toast = useToast();
  // Server-side State
  const [instances, setInstances] = useState<AssetInstanceResponse[]>([]);
  const [models, setModels] = useState<AssetModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Client-side Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<AssetInstanceResponse | null>(null);
  const [newModelId, setNewModelId] = useState<number | ''>('');
  const [newSerial, setNewSerial] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPurchasePrice, setNewPurchasePrice] = useState<number | ''>('');
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => onConfirm);
    setConfirmOpen(true);
  };

  // Fetch Instances
  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/assets/instance', {
        params: {
          page,
          size,
          sortBy,
          sortDir
        }
      });
      const data = response.data;
      if (data) {
        setInstances(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Fetch asset instances failed', err);
      setError('Không thể lấy danh sách thiết bị từ hệ thống. Vui lòng tải lại.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Model options for dropdown
  const fetchModelOptions = async () => {
    try {
      const response = await api.get('/api/v1/assets/model', {
        params: { page: 0, size: 100 }
      });
      if (response.data && response.data.content) {
        setModels(response.data.content.map((m: any) => ({ id: m.id, name: m.name })));
      }
    } catch (err) {
      console.error('Failed to fetch asset model options', err);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [page, size, sortBy, sortDir]);

  useEffect(() => {
    fetchModelOptions();
  }, []);

  // Handle Sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
    setPage(0);
  };

  // Client-side Filters
  const getFilteredInstances = () => {
    return instances.filter(i => {
      const matchesSearch = 
        i.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.assetModelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.assetTypeName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredInstances = getFilteredInstances();

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingInstance(null);
    setNewModelId('');
    setNewSerial('');
    setNewPurchaseDate(new Date().toISOString().split('T')[0]);
    setNewPurchasePrice('');
    setNewStatus('AVAILABLE');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (ins: AssetInstanceResponse) => {
    setEditingInstance(ins);
    setNewModelId(ins.assetModelId);
    setNewSerial(ins.serial);
    setNewPurchaseDate(ins.purchaseDate ? ins.purchaseDate.split('T')[0] : '');
    setNewPurchasePrice(ins.purchasePrice);
    setNewStatus(ins.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Create or Update Instance
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newModelId || !newSerial || !newPurchaseDate || !newPurchasePrice) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      if (editingInstance) {
        // PUT /api/v1/assets/instance/{id}
        await api.put(`/api/v1/assets/instance/${editingInstance.id}`, {
          assetModelId: Number(newModelId),
          serial: newSerial,
          purchaseDate: newPurchaseDate,
          purchasePrice: Number(newPurchasePrice),
          status: newStatus
        });
        toast.showSuccess('Cập nhật thiết bị thành công!');
      } else {
        // POST /api/v1/assets/instance
        await api.post('/api/v1/assets/instance', {
          assetModelId: Number(newModelId),
          serial: newSerial,
          purchaseDate: newPurchaseDate,
          purchasePrice: Number(newPurchasePrice)
        });
        toast.showSuccess('Thêm thiết bị mới thành công!');
      }

      // Reset & Refresh
      setIsModalOpen(false);
      fetchInstances();
    } catch (err: any) {
      console.error('Failed to save instance', err);
      if (err.response && err.response.data && err.response.data.message) {
        setModalError(err.response.data.message);
      } else {
        setModalError('Lỗi hệ thống khi lưu thông tin thiết bị.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Instance
  const handleDeleteInstance = (id: number, serial: string) => {
    triggerConfirm(
      'Xác nhận xóa thiết bị',
      `Bạn có chắc chắn muốn xóa thiết bị có serial "${serial}" khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.`,
      async () => {
        try {
          await api.delete(`/api/v1/assets/instance/${id}`);
          fetchInstances();
          toast.showSuccess('Xóa thiết bị thành công!');
        } catch (err: any) {
          console.error('Failed to delete instance', err);
          toast.showError('Lỗi khi xóa thiết bị: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  // Format Price in VND
  const formatPrice = (price: number) => {
    if (!price) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Status mapping
  const getStatusDetails = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'UNKNOWN';
    if (status === 'AVAILABLE' || status === 'ACTIVE') return { label: 'Sẵn sàng', css: 'active' };
    if (status === 'ASSIGNED') return { label: 'Đã cấp phát', css: 'pending' };
    if (status === 'MAINTENANCE') return { label: 'Bảo trì', css: 'inactive' };
    return { label: status, css: 'inactive' };
  };

  // Render Sort indicator
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="sort-icon-indicator" />;
    return sortDir === 'asc' 
      ? <ArrowUp size={14} className="sort-icon-indicator active" />
      : <ArrowDown size={14} className="sort-icon-indicator active" />;
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Quản lý Thiết bị (Instances)</h1>
          <p className="page-subtitle">Xem chi tiết từng thiết bị phần cứng cụ thể, số Serial, tình trạng sử dụng và lịch sử.</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAddModal}
          >
            <Plus size={18} /> Thêm thiết bị cụ thể
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="table-control-bar">
        <div className="filter-group">
          {/* Search Box */}
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon-left" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo Serial, Model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng (Available)</option>
            <option value="ASSIGNED">Đã cấp phát (Assigned)</option>
            <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container loading-overlay-wrapper">
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách thiết bị...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchInstances}>Thử lại</button>
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="empty-data-view">
            <span>Không tìm thấy thiết bị nào phù hợp.</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="sortable-header" onClick={() => handleSort('id')}>
                      <div className="header-sort-content">
                        Mã số {renderSortIndicator('id')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('serial')}>
                      <div className="header-sort-content">
                        Số Serial {renderSortIndicator('serial')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('assetModelName')}>
                      <div className="header-sort-content">
                        Dòng máy (Model) {renderSortIndicator('assetModelName')}
                      </div>
                    </th>
                    <th>Loại thiết bị</th>
                    <th className="sortable-header" onClick={() => handleSort('status')}>
                      <div className="header-sort-content">
                        Trạng thái {renderSortIndicator('status')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('purchaseDate')}>
                      <div className="header-sort-content">
                        Ngày mua {renderSortIndicator('purchaseDate')}
                      </div>
                    </th>
                    <th>Đơn giá mua</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstances.map((ins) => {
                    const statusDetail = getStatusDetails(ins.status);
                    return (
                      <tr key={ins.id}>
                        <td style={{ fontFamily: 'monospace' }}>#{ins.id}</td>
                        <td>
                          <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-primary)' }} className="header-sort-content">
                            <HardDrive size={14} style={{ color: 'var(--primary-color)' }} />
                            {ins.serial}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{ins.assetModelName}</td>
                        <td>{ins.assetTypeName}</td>
                        <td>
                          <span className={`status-badge ${statusDetail.css}`}>
                            {statusDetail.label}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                            {ins.purchaseDate ? new Date(ins.purchaseDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--primary-color)' }}>
                            <DollarSign size={13} />
                            {formatPrice(ins.purchasePrice)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '5px 8px' }}
                              onClick={() => handleOpenEditModal(ins)}
                              title="Sửa thông tin"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                              onClick={() => handleDeleteInstance(ins.id, ins.serial)}
                              title="Xóa thiết bị"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} thiết bị cụ thể
              </div>

              <div className="pagination-controls-wrapper">
                <div className="page-size-selector-wrapper">
                  <span>Kích thước trang</span>
                  <select
                    className="select-page-size"
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value));
                      setPage(0);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
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

                  <button type="button" className="page-btn page-btn-arrow" disabled={page === totalPages - 1 || totalPages === 0} onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}>
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="page-btn page-btn-arrow" disabled={page === totalPages - 1 || totalPages === 0} onClick={() => setPage(totalPages - 1)}>
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Instance Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingInstance ? 'Chỉnh sửa thiết bị cụ thể' : 'Thêm thiết bị cụ thể mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Dòng máy (Model) <span style={{ color: 'var(--error)' }}>*</span></label>
                <select
                  className="select-filter"
                  style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                  value={newModelId}
                  onChange={(e) => setNewModelId(Number(e.target.value))}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Chọn Model thiết bị --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Số Serial <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: DELL-LAT-5420-XXXX"
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ngày thu mua <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="date" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  value={newPurchaseDate}
                  onChange={(e) => setNewPurchaseDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Đơn giá thu mua (VND) <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="number" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: 15000000"
                  value={newPurchasePrice}
                  onChange={(e) => setNewPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Status field (Only visible when editing an instance) */}
              {editingInstance && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Trạng thái sử dụng <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select
                    className="select-filter"
                    style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    <option value="AVAILABLE">Sẵn sàng (Available)</option>
                    <option value="ASSIGNED">Đã cấp phát (Assigned)</option>
                    <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={() => {
          if (onConfirmCallback) onConfirmCallback();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
        isDanger={true}
      />
    </div>
  );
};

export default AssetInstanceManagement;
