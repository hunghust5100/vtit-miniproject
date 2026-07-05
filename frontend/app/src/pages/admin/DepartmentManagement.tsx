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
  MapPin,
  User,
  Users,
  Trash2,
  Pencil
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  location: string;
  category: string;
  headManagerId: number | null;
  headManagerName: string | null;
  staffAmount: number;
}

const DepartmentManagement: React.FC = () => {
  const toast = useToast();
  // Server-side State
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
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
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newManagerId, setNewManagerId] = useState<number | ''>('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // All users for dropdown selection
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Staff modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentResponse | null>(null);
  const [deptStaff, setDeptStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedNewStaffId, setSelectedNewStaffId] = useState<number | ''>('');

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

  // Fetch Departments
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/department', {
        params: {
          page,
          size,
          sortBy,
          sortDir
        }
      });
      const data = response.data;
      if (data) {
        setDepartments(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Fetch departments failed', err);
      setError('Không thể lấy danh sách phòng ban từ hệ thống. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/api/v1/users', {
        params: { page: 0, size: 1000 }
      });
      if (response.data && response.data.content) {
        setAllUsers(response.data.content);
      }
    } catch (err) {
      console.error('Failed to fetch users list', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchAllUsers();
  }, [page, size, sortBy, sortDir]);

  // Fetch department staff
  const fetchDeptStaff = async (deptId: number) => {
    setLoadingStaff(true);
    try {
      const response = await api.get(`/api/v1/department/${deptId}/staffs`, {
        params: { page: 0, size: 100 }
      });
      setDeptStaff(response.data.content || []);
    } catch (err) {
      console.error('Fetch department staff failed', err);
      toast.showError('Không thể lấy danh sách nhân sự của phòng ban.');
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleOpenStaffModal = (dept: DepartmentResponse) => {
    setSelectedDept(dept);
    setSelectedNewStaffId('');
    setIsStaffModalOpen(true);
    fetchDeptStaff(dept.id);
  };

  // Add staff to department
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !selectedNewStaffId) {
      toast.showError('Vui lòng chọn nhân sự để thêm');
      return;
    }
    try {
      await api.put(`/api/v1/department/${selectedDept.id}/staff/${selectedNewStaffId}`);
      toast.showSuccess('Thêm nhân sự vào phòng ban thành công!');
      setSelectedNewStaffId('');
      fetchDeptStaff(selectedDept.id);
      fetchDepartments(); // to refresh staffAmount on main table
    } catch (err: any) {
      console.error('Failed to add staff', err);
      toast.showError(err.response?.data?.message || 'Không thể thêm nhân sự vào phòng ban.');
    }
  };

  // Remove staff from department
  const handleRemoveStaff = (staffId: number, staffName: string) => {
    if (!selectedDept) return;
    triggerConfirm(
      'Xác nhận xóa nhân sự khỏi phòng',
      `Bạn có chắc chắn muốn xóa nhân sự "${staffName}" khỏi phòng ban "${selectedDept.name}"?`,
      async () => {
        try {
          await api.delete(`/api/v1/department/${selectedDept.id}/staff/${staffId}`);
          toast.showSuccess('Đã xóa nhân sự khỏi phòng ban!');
          fetchDeptStaff(selectedDept.id);
          fetchDepartments(); // to refresh staffAmount on main table
        } catch (err: any) {
          console.error('Failed to remove staff', err);
          toast.showError(err.response?.data?.message || 'Không thể xóa nhân sự khỏi phòng ban.');
        }
      }
    );
  };

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

  // Client-side Searching & Filtering
  const getFilteredDepartments = () => {
    return departments.filter(d => {
      const matchesSearch = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.headManagerName && d.headManagerName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'ALL' || d.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  };

  const filteredDepartments = getFilteredDepartments();

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingDepartment(null);
    setNewName('');
    setNewLocation('');
    setNewCategory('');
    setNewDescription('');
    setNewManagerId('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (dept: DepartmentResponse) => {
    setEditingDepartment(dept);
    setNewName(dept.name);
    setNewLocation(dept.location);
    setNewCategory(dept.category);
    setNewDescription(dept.description || '');
    setNewManagerId(dept.headManagerId || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Create or Update Department
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!newName || !newLocation || !newCategory) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: newName,
        location: newLocation,
        category: newCategory,
        description: newDescription,
        headManagerId: newManagerId === '' ? null : Number(newManagerId)
      };

      if (editingDepartment) {
        // PUT /api/v1/department/{id}
        await api.put(`/api/v1/department/${editingDepartment.id}`, payload);
        toast.showSuccess('Cập nhật phòng ban thành công!');
      } else {
        // POST /api/v1/department
        await api.post('/api/v1/department', payload);
        toast.showSuccess('Thêm phòng ban mới thành công!');
      }

      // Reset & Refresh
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error('Failed to save department', err);
      if (err.response && err.response.data && err.response.data.message) {
        setModalError(err.response.data.message);
      } else {
        setModalError('Lỗi hệ thống khi lưu thông tin phòng ban.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = (id: number, name: string) => {
    triggerConfirm(
      'Xác nhận xóa phòng ban',
      `Bạn có chắc chắn muốn xóa phòng ban "${name}"? Hành động này sẽ làm trống phòng ban của các nhân sự trực thuộc.`,
      async () => {
        try {
          await api.delete(`/api/v1/department/${id}`, { params: { id } });
          fetchDepartments();
          toast.showSuccess('Xóa phòng ban thành công!');
        } catch (err: any) {
          console.error('Failed to delete department', err);
          toast.showError('Lỗi khi xóa phòng ban: ' + (err.response?.data?.message || err.message));
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

  // Extract unique categories
  const getCategories = () => {
    const cats = departments.map(d => d.category).filter(Boolean);
    return Array.from(new Set(cats));
  };
  const categories = getCategories();

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Quản lý Phòng ban</h1>
          <p className="page-subtitle">Xem cấu trúc phòng ban, vị trí làm việc và người quản lý trực thuộc.</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAddModal}
          >
            <Plus size={18} /> Thêm phòng ban
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="table-control-bar">
        <div className="filter-group">
          {/* Search Input */}
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon-left" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo tên, vị trí, quản lý..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <select
            className="select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container loading-overlay-wrapper">
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách phòng ban...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchDepartments}>Thử lại</button>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="empty-data-view">
            <span>Không tìm thấy phòng ban nào phù hợp.</span>
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
                        Tên phòng ban {renderSortIndicator('name')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('category')}>
                      <div className="header-sort-content">
                        Danh mục {renderSortIndicator('category')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('location')}>
                      <div className="header-sort-content">
                        Vị trí {renderSortIndicator('location')}
                      </div>
                    </th>
                    <th>Quản lý trưởng</th>
                    <th>Nhân sự</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((d) => (
                    <tr key={d.id}>
                      <td data-label="Mã số" style={{ fontFamily: 'monospace' }}>#{d.id}</td>
                      <td data-label="Tên phòng ban">
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.description || 'Chưa có mô tả'}</div>
                      </td>
                      <td data-label="Danh mục">
                        <span className="role-badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          {d.category}
                        </span>
                      </td>
                      <td data-label="Vị trí">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                          <MapPin size={14} style={{ color: 'var(--primary-color)' }} />
                          {d.location}
                        </span>
                      </td>
                      <td data-label="Quản lý trưởng">
                        {d.headManagerName ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                            <User size={14} style={{ color: 'var(--text-secondary)' }} />
                            {d.headManagerName}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Chưa bổ nhiệm</span>
                        )}
                      </td>
                      <td data-label="Nhân sự" 
                        style={{ fontWeight: 600, color: 'var(--primary-color)', cursor: 'pointer' }}
                        onClick={() => handleOpenStaffModal(d)}
                        title="Click để quản lý nhân sự"
                      >
                        {d.staffAmount} nhân sự
                      </td>
                      <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--primary-color)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                            onClick={() => handleOpenStaffModal(d)}
                            title="Quản lý nhân sự"
                          >
                            <Users size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '5px 8px' }}
                            onClick={() => handleOpenEditModal(d)}
                            title="Sửa thông tin"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-outline-sm"
                            style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                            onClick={() => handleDeleteDepartment(d.id, d.name)}
                            title="Xóa phòng ban"
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
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} phòng ban
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

      {/* Add / Edit Department Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingDepartment ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tên phòng ban <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Trung tâm Nghiên cứu..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Vị trí địa lý <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Tòa nhà Viettel, Hà Nội"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Danh mục phân loại <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Kỹ thuật / Kinh doanh / R&D"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Trưởng phòng / Quản lý Trưởng</label>
                <select
                  className="select-filter"
                  style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={submitting}
                >
                  <option value="">-- Chưa bổ nhiệm / Trống --</option>
                  {allUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mô tả chi tiết</label>
                <textarea 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', minHeight: '80px', borderRadius: '12px', resize: 'vertical' }}
                  placeholder="Mô tả chức năng nhiệm vụ..."
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

      {/* Manage Staff Modal */}
      {isStaffModalOpen && selectedDept && createPortal(
        <div className="modal-overlay" onClick={() => setIsStaffModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '600px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              Quản lý nhân sự - {selectedDept.name}
            </h2>

            {/* Add Staff form */}
            <form onSubmit={handleAddStaff} style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Thêm nhân sự mới vào phòng ban
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <select
                    className="select-filter"
                    style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                    value={selectedNewStaffId}
                    onChange={(e) => setSelectedNewStaffId(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px', borderRadius: '50px' }}>
                  Thêm nhân sự
                </button>
              </div>
            </form>

            {/* Staff list */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Danh sách nhân sự hiện tại ({deptStaff.length})
              </h3>

              {loadingStaff ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', color: 'var(--text-secondary)' }}>
                  <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '20px', height: '20px' }}></div>
                  <span>Đang tải danh sách nhân sự...</span>
                </div>
              ) : deptStaff.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  Chưa có nhân sự nào trực thuộc phòng ban này.
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <table className="dashboard-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Họ và tên</th>
                        <th>Email</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptStaff.map((staff) => (
                        <tr key={staff.id}>
                          <td data-label="Họ và tên" style={{ fontWeight: 500 }}>{staff.fullName}</td>
                          <td data-label="Email">{staff.email}</td>
                          <td data-label="Thao tác" style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '4px 6px' }}
                              onClick={() => handleRemoveStaff(staff.id, staff.fullName)}
                              title="Xóa khỏi phòng"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn-outline" onClick={() => setIsStaffModalOpen(false)}>
                Đóng
              </button>
            </div>
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

export default DepartmentManagement;
