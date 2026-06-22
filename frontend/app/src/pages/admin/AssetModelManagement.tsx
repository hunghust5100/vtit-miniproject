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
  Cpu,
  Trash2,
  Pencil
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface SpecRow {
  key: string;
  value: string;
}

interface AssetModelResponse {
  id: number;
  name: string;
  code: string;
  manufacturer: string;
  assetTypeId: number;
  assetTypeName: string;
  specification: Record<string, any>;
}

interface AssetTypeOption {
  id: number;
  name: string;
}

const AssetModelManagement: React.FC = () => {
  const toast = useToast();
  // Server-side State
  const [models, setModels] = useState<AssetModelResponse[]>([]);
  const [types, setTypes] = useState<AssetTypeOption[]>([]);
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
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AssetModelResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newAssetTypeId, setNewAssetTypeId] = useState<number | ''>('');
  const [specRows, setSpecRows] = useState<SpecRow[]>([
    { key: 'RAM', value: '16GB' },
    { key: 'Storage', value: '512GB SSD' },
    { key: 'CPU', value: 'Core i7' }
  ]);
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

  const handleAddSpecRow = () => {
    setSpecRows(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (index: number) => {
    setSpecRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSpecRow = (index: number, field: 'key' | 'value', value: string) => {
    setSpecRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  // Fetch Models
  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/assets/model', {
        params: {
          page,
          size,
          sortBy,
          sortDir
        }
      });
      const data = response.data;
      if (data) {
        setModels(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Fetch asset models failed', err);
      setError('Không thể lấy danh sách dòng máy từ hệ thống. Vui lòng tải lại.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Types for dropdown options
  const fetchTypesOptions = async () => {
    try {
      const response = await api.get('/api/v1/assets/type', {
        params: { page: 0, size: 100 }
      });
      if (response.data && response.data.content) {
        setTypes(response.data.content.map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (err) {
      console.error('Failed to fetch asset types options', err);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [page, size, sortBy, sortDir]);

  useEffect(() => {
    fetchTypesOptions();
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

  // Client-side Filter
  const getFilteredModels = () => {
    return models.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || String(m.assetTypeId) === typeFilter;

      return matchesSearch && matchesType;
    });
  };

  const filteredModels = getFilteredModels();

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingModel(null);
    setNewName('');
    setNewCode('');
    setNewManufacturer('');
    setNewAssetTypeId('');
    setSpecRows([
      { key: 'RAM', value: '16GB' },
      { key: 'Storage', value: '512GB SSD' },
      { key: 'CPU', value: 'Core i7' }
    ]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (model: AssetModelResponse) => {
    setEditingModel(model);
    setNewName(model.name);
    setNewCode(model.code);
    setNewManufacturer(model.manufacturer);
    setNewAssetTypeId(model.assetTypeId);
    const rows = Object.entries(model.specification || {}).map(([k, v]) => ({
      key: k,
      value: String(v)
    }));
    setSpecRows(rows.length > 0 ? rows : [{ key: '', value: '' }]);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Create or Update Model
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newName || !newCode || !newManufacturer || !newAssetTypeId) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const parsedSpecs: Record<string, any> = {};
    specRows.forEach(row => {
      if (row.key.trim()) {
        parsedSpecs[row.key.trim()] = row.value.trim();
      }
    });

    setSubmitting(true);
    try {
      const payload = {
        name: newName,
        code: newCode,
        manufacturer: newManufacturer,
        assetTypeId: Number(newAssetTypeId),
        specification: parsedSpecs
      };

      if (editingModel) {
        // PUT /api/v1/assets/model/{id}
        await api.put(`/api/v1/assets/model/${editingModel.id}`, payload);
        toast.showSuccess('Cập nhật dòng máy thành công!');
      } else {
        // POST /api/v1/assets/model
        await api.post('/api/v1/assets/model', payload);
        toast.showSuccess('Thêm dòng máy mới thành công!');
      }

      // Reset & Refresh
      setIsModalOpen(false);
      fetchModels();
    } catch (err: any) {
      console.error('Failed to save model', err);
      if (err.response && err.response.data && err.response.data.message) {
        setModalError(err.response.data.message);
      } else {
        setModalError('Lỗi hệ thống khi lưu thông tin dòng máy.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Model
  const handleDeleteModel = (id: number, name: string) => {
    triggerConfirm(
      'Xác nhận xóa dòng máy',
      `Bạn có chắc chắn muốn xóa dòng máy "${name}"? Hành động này có thể ảnh hưởng đến các thiết bị cụ thể thuộc dòng máy này.`,
      async () => {
        try {
          await api.delete(`/api/v1/assets/model/${id}`);
          fetchModels();
          toast.showSuccess('Xóa dòng máy thành công!');
        } catch (err: any) {
          console.error('Failed to delete model', err);
          toast.showError('Lỗi khi xóa dòng máy: ' + (err.response?.data?.message || err.message));
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

  // Format specs
  const formatSpecs = (specs: Record<string, any>) => {
    if (!specs || Object.keys(specs).length === 0) return 'Không có';
    return Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Quản lý Model thiết bị</h1>
          <p className="page-subtitle">Quản lý các hãng sản xuất và dòng máy (ví dụ: ThinkPad X1 Carbon Gen 9, Dell XPS 13).</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAddModal}
          >
            <Plus size={18} /> Thêm Model mới
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
              placeholder="Tìm theo tên model, code, hãng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Tất cả loại thiết bị</option>
            {types.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container loading-overlay-wrapper">
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách model thiết bị...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchModels}>Thử lại</button>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="empty-data-view">
            <span>Không tìm thấy model nào phù hợp.</span>
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
                    <th className="sortable-header" onClick={() => handleSort('name')}>
                      <div className="header-sort-content">
                        Tên Model {renderSortIndicator('name')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('code')}>
                      <div className="header-sort-content">
                        Ký hiệu (Code) {renderSortIndicator('code')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('manufacturer')}>
                      <div className="header-sort-content">
                        Hãng sản xuất {renderSortIndicator('manufacturer')}
                      </div>
                    </th>
                    <th>Loại thiết bị</th>
                    <th>Thông số kỹ thuật</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'monospace' }}>#{m.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="header-sort-content">
                          <Cpu size={14} style={{ color: 'var(--primary-color)' }} />
                          {m.name}
                        </div>
                      </td>
                      <td>
                        <span className="role-badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {m.code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{m.manufacturer}</td>
                      <td>{m.assetTypeName}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formatSpecs(m.specification)}>
                        {formatSpecs(m.specification)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '5px 8px' }}
                            onClick={() => handleOpenEditModal(m)}
                            title="Sửa thông tin"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                            onClick={() => handleDeleteModel(m.id, m.name)}
                            title="Xóa model"
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
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} model thiết bị
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

      {/* Add / Edit Model Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingModel ? 'Chỉnh sửa dòng máy (Model)' : 'Thêm dòng máy (Model) mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tên dòng máy (Model) <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: ThinkPad T14s"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ký hiệu Code <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: TP-T14S"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Hãng sản xuất <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Ví dụ: Lenovo"
                  value={newManufacturer}
                  onChange={(e) => setNewManufacturer(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Loại thiết bị <span style={{ color: 'var(--error)' }}>*</span></label>
                <select
                  className="select-filter"
                  style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                  value={newAssetTypeId}
                  onChange={(e) => setNewAssetTypeId(Number(e.target.value))}
                  disabled={submitting}
                  required
                >
                  <option value="">-- Chọn loại thiết bị --</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Thông số kỹ thuật</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                  {specRows.map((row, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="search-input" 
                        style={{ paddingLeft: '12px', height: '38px', backgroundColor: '#fff', borderColor: 'var(--border-color)', flex: 1 }}
                        placeholder="Tên thông số (RAM)"
                        value={row.key}
                        onChange={(e) => handleUpdateSpecRow(index, 'key', e.target.value)}
                        disabled={submitting}
                        required
                      />
                      <input 
                        type="text" 
                        className="search-input" 
                        style={{ paddingLeft: '12px', height: '38px', backgroundColor: '#fff', borderColor: 'var(--border-color)', flex: 1.5 }}
                        placeholder="Giá trị (16GB)"
                        value={row.value}
                        onChange={(e) => handleUpdateSpecRow(index, 'value', e.target.value)}
                        disabled={submitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(index)}
                        disabled={submitting}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Xóa thông số"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn-outline-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
                  onClick={handleAddSpecRow}
                  disabled={submitting}
                >
                  <Plus size={14} /> Thêm thông số
                </button>
              </div>

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

export default AssetModelManagement;
