import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Search, 
  UserPlus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Eye,
  EyeOff,
  Trash2,
  Pencil
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  birthday?: string;
}

const UserManagement: React.FC = () => {
  const toast = useToast();
  // Server-side State
  const [users, setUsers] = useState<UserResponse[]>([]);
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
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
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

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/v1/users`, {
        params: {
          page,
          size,
          sortBy,
          sortDir
        }
      });
      const data = response.data;
      if (data) {
        setUsers(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err: any) {
      console.error('Fetch users failed', err);
      setError('Không thể lấy danh sách người dùng từ hệ thống. Vui lòng tải lại trang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

  // Client-side Searching & Filtering
  const getFilteredUsers = () => {
    return users.filter(u => {
      const matchesSearch = 
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phoneNumber && u.phoneNumber.includes(searchQuery));
      
      const normalizedRole = u.role.replace(/^ROLE_/, '');
      const matchesRole = roleFilter === 'ALL' || normalizedRole === roleFilter;

      return matchesSearch && matchesRole;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setNewEmail('');
    setNewFullName('');
    setNewPhone('');
    setNewBirthday('');
    setNewPassword('');
    setNewRole('USER');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (userToEdit: UserResponse) => {
    setEditingUser(userToEdit);
    setNewEmail(userToEdit.email);
    setNewFullName(userToEdit.fullName);
    setNewPhone(userToEdit.phoneNumber || '');
    setNewBirthday(userToEdit.birthday || '');
    setNewPassword(''); // Password is not editable through PUT /api/v1/users/{id}
    setNewRole(userToEdit.role ? userToEdit.role.replace(/^ROLE_/, '') : 'USER');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Create or Update User
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (editingUser) {
      // Edit mode: requires fullName
      if (!newFullName) {
        setModalError('Họ và tên là bắt buộc');
        return;
      }
    } else {
      // Add mode: requires email, fullName, password
      if (!newEmail || !newFullName || !newPassword) {
        setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // PUT /api/v1/users/{id}
        await api.put(`/api/v1/users/${editingUser.id}`, {
          fullName: newFullName,
          phoneNumber: newPhone || null,
          birthday: newBirthday || null,
          role: newRole
        });
        toast.showSuccess('Cập nhật người dùng thành công!');
      } else {
        // POST /api/v1/users
        await api.post('/api/v1/users', {
          email: newEmail,
          fullName: newFullName,
          phoneNumber: newPhone || null,
          password: newPassword,
          role: newRole
        });
        toast.showSuccess('Thêm người dùng mới thành công!');
      }
      
      // Close & Refresh
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Submit form failed', err);
      if (err.response && err.response.data && err.response.data.message) {
        setModalError(err.response.data.message);
      } else {
        setModalError('Lỗi hệ thống khi lưu thông tin người dùng.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = (id: number, name: string) => {
    triggerConfirm(
      'Xác nhận xóa nhân viên',
      `Bạn có chắc chắn muốn xóa nhân sự "${name}" khỏi hệ thống? Hành động này không thể hoàn tác.`,
      async () => {
        try {
          await api.delete(`/api/v1/users/${id}`);
          fetchUsers();
          toast.showSuccess('Xóa người dùng thành công!');
        } catch (err: any) {
          console.error('Failed to delete user', err);
          toast.showError('Lỗi khi xóa người dùng: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  // Render Sort Header indicator
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
          <h1 className="page-title">Danh sách nhân viên</h1>
          <p className="page-subtitle">Xem, thêm mới, sửa đổi thông tin nhân viên và phân quyền hệ thống.</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleOpenAddModal}
          >
            <UserPlus size={18} /> Thêm người dùng
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
              placeholder="Tìm theo họ tên, email, sđt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role Dropdown */}
          <select
            className="select-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên (Admin)</option>
            <option value="MANAGER">Quản lý (Manager)</option>
            <option value="USER">Nhân viên (User)</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="table-container loading-overlay-wrapper">
        {loading ? (
          <div className="table-loading-spinner">
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchUsers}>Thử lại</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-data-view">
            <span>Không tìm thấy người dùng nào phù hợp.</span>
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
                    <th className="sortable-header" onClick={() => handleSort('fullName')}>
                      <div className="header-sort-content">
                        Họ và tên {renderSortIndicator('fullName')}
                      </div>
                    </th>
                    <th className="sortable-header" onClick={() => handleSort('email')}>
                      <div className="header-sort-content">
                        Email {renderSortIndicator('email')}
                      </div>
                    </th>
                    <th>Số điện thoại</th>
                    <th className="sortable-header" onClick={() => handleSort('role')}>
                      <div className="header-sort-content">
                        Vai trò {renderSortIndicator('role')}
                      </div>
                    </th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const normalizedRole = u.role.replace(/^ROLE_/, '');
                    return (
                      <tr key={u.id}>
                        <td style={{ fontFamily: 'monospace' }}>#{u.id}</td>
                        <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td>{u.phoneNumber || '-'}</td>
                        <td>
                          <span className={`role-badge ${normalizedRole.toLowerCase()}`}>
                            {normalizedRole === 'ADMIN' ? 'Admin' : normalizedRole === 'MANAGER' ? 'Manager' : 'Nhân viên'}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)', padding: '5px 8px' }}
                              onClick={() => handleOpenEditModal(u)}
                              title="Sửa thông tin"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px' }}
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              title="Xóa người dùng"
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

            {/* Pagination Bar */}
            <div className="pagination-bar">
              <div className="pagination-info">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} người dùng
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
                  <button 
                    type="button" 
                    className="page-btn page-btn-arrow" 
                    disabled={page === 0} 
                    onClick={() => setPage(0)}
                    title="Đầu trang"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="page-btn page-btn-arrow" 
                    disabled={page === 0} 
                    onClick={() => setPage(prev => Math.max(0, prev - 1))}
                    title="Trang trước"
                  >
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

                  <button 
                    type="button" 
                    className="page-btn page-btn-arrow" 
                    disabled={page === totalPages - 1 || totalPages === 0} 
                    onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button 
                    type="button" 
                    className="page-btn page-btn-arrow" 
                    disabled={page === totalPages - 1 || totalPages === 0} 
                    onClick={() => setPage(totalPages - 1)}
                    title="Cuối trang"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingUser ? 'Chỉnh sửa thông tin người dùng' : 'Thêm người dùng mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="email" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: editingUser ? '#f1f5f9' : '#fff', borderColor: 'var(--border-color)', cursor: editingUser ? 'not-allowed' : 'text' }}
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={submitting || !!editingUser}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Họ và tên <span style={{ color: 'var(--error)' }}>*</span></label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="Nguyễn Văn A"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Số điện thoại</label>
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  placeholder="098xxxxxxxx"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Birthday Input Field */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ngày sinh</label>
                <input 
                  type="date" 
                  className="search-input" 
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  value={newBirthday}
                  onChange={(e) => setNewBirthday(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Role Dropdown Field */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Vai trò / Quyền <span style={{ color: 'var(--error)' }}>*</span></label>
                <select
                  className="select-filter"
                  style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={submitting}
                  required
                >
                  <option value="USER">Nhân viên (User)</option>
                  <option value="MANAGER">Quản lý (Manager)</option>
                  <option value="ADMIN">Quản trị viên (Admin)</option>
                </select>
              </div>

              {/* Password Field (Only shown when adding new user) */}
              {!editingUser && (
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mật khẩu <span style={{ color: 'var(--error)' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="search-input" 
                      style={{ paddingLeft: '16px', paddingRight: '40px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                      placeholder="Mật khẩu tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={submitting}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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

export default UserManagement;
