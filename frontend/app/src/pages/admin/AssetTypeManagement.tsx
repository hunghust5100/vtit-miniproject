import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2,
  Pencil
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface AssetTypeResponse {
  id: number;
  name: string;
  code: string;
  description: string;
}

const AssetTypeManagement: React.FC = () => {
  const toast = useToast();
  // Server-side State
  const [types, setTypes] = useState<AssetTypeResponse[]>([]);
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AssetTypeResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
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

  // Fetch Asset Types
  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/assets/type', {
        params: {
          page,
          size,
          sortBy,
          sortDir
        }
      });
      const data = response.data;
      if (data) {
        setTypes(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Fetch asset types failed', err);
      setError('Không thể lấy danh sách loại thiết bị. Vui lòng tải lại trang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [page, size, sortBy, sortDir]);

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

  // Client-side Searching
  const getFilteredTypes = () => {
    return types.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filteredTypes = getFilteredTypes();

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingType(null);
    setNewName('');
    setNewCode('');
    setNewDescription('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (t: AssetTypeResponse) => {
    setEditingType(t);
    setNewName(t.name);
    setNewCode(t.code);
    setNewDescription(t.description || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Create or Update Asset Type
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newName || !newCode) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: newName,
        code: newCode,
        description: newDescription
      };

      if (editingType) {
        // PUT /api/v1/assets/type/{id}
        await api.put(`/api/v1/assets/type/${editingType.id}`, payload);
        toast.showSuccess('Cập nhật loại thiết bị thành công!');
      } else {
        // POST /api/v1/assets/type
        await api.post('/api/v1/assets/type', payload);
        toast.showSuccess('Thêm loại thiết bị mới thành công!');
      }

      // Reset & Refresh
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      console.error('Failed to save asset type', err);
      if (err.response && err.response.data && err.response.data.message) {
        setModalError(err.response.data.message);
      } else {
        setModalError('Lỗi hệ thống khi lưu thông tin loại thiết bị.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Asset Type
  const handleDeleteType = (id: number, name: string) => {
    triggerConfirm(
      'Xác nhận xóa loại thiết bị',
      `Bạn có chắc chắn muốn xóa loại thiết bị "${name}"? Hành động này có thể ảnh hưởng đến các model và thiết bị liên quan.`,
      async () => {
        try {
          await api.delete(`/api/v1/assets/type/${id}`);
          fetchTypes();
          toast.showSuccess('Xóa loại thiết bị thành công!');
        } catch (err: any) {
          console.error('Failed to delete asset type', err);
          toast.showError('Lỗi khi xóa loại thiết bị: ' + (err.response?.data?.message || err.message));
        }
      }
    );
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
          <h1 className="page-title">Quản lý Loại thiết bị</h1>
          <p className="page-subtitle">Quản lý danh mục phân loại thiết bị (ví dụ: Laptop, PC, Màn hình, Bàn phím).</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAddModal}
          >
            <Plus size={18} /> Thêm loại thiết bị
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="table-control-bar">
        <div className="filter-group">
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon-left" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo tên, mã loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container loading-overlay-wrapper">
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách loại thiết bị...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchTypes}>Thử lại</button>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="empty-data-view">
            <span>Không tìm thấy loại thiết bị nào.</span>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th className="sortable-header" onClick={() => handleSort('id')}>
                      <div className="header-sort-content">
                        Mã số {renderSortIndicator('id')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('name')}>
                      <div className="header-sort-content">
                        Tên loại thiết bị {renderSortIndicator('name')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('code')}>
                      <div className="header-sort-content">
                        Mã định danh (Code) {renderSortIndicator('code')}
                      </div>
                    </th>
                    <th>Mô tả</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTypes.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Mã số" style={{ fontFamily: 'monospace' }}>#{t.id}</td>
                      <td data-label="Tên loại thiết bị" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</td>
                      <td data-label="Mã định danh (Code)">
                        <span className="role-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {t.code}
                        </span>
                      </td>
                      <td data-label="Mô tả" style={{ color: 'var(--text-secondary)' }}>{t.description || 'Chưa có mô tả'}</td>
                      <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '5px 8px' }}
                            onClick={() => handleOpenEditModal(t)}
                            title="Sửa thông tin"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                            onClick={() => handleDeleteType(t.id, t.name)}
                            title="Xóa loại thiết bị"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} loại thiết bị
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

      {/* Add / Edit Type Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingType ? 'Chỉnh sửa loại thiết bị' : 'Thêm loại thiết bị mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tên loại thiết bị <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: Laptop"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mã định danh (Code) <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', textTransform: 'uppercase' }}
                  placeholder="Ví dụ: LAPTOP"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mô tả chi tiết</label>
                <textarea 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', minHeight: '80px', borderRadius: '12px', resize: 'vertical' }}
                  placeholder="Nhập mô tả về loại thiết bị..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
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

export default AssetTypeManagement;
