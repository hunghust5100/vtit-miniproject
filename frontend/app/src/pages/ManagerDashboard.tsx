import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Building, 
  Users, 
  RefreshCw, 
  MapPin, 
  Tag, 
  FileText,
  Mail,
  Phone,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import './Dashboard.css';

interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  birthday: string | null;
  role: string;
  createdAt: string;
}

interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  location: string;
  category: string;
  headManagerId: number;
  headManagerName: string;
  staffAmount: number;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<DepartmentResponse | null>(null);
  const [staffMembers, setStaffMembers] = useState<UserResponse[]>([]);

  const fetchDepartmentData = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const managerId = user.id;

      // 2. Fetch all departments and find the one managed by this manager
      const deptsRes = await api.get('/api/v1/department?size=100');
      const managedDept = deptsRes.data?.content?.find((d: DepartmentResponse) => d.headManagerId === managerId);

      if (!managedDept) {
        setDepartment(null);
        setStaffMembers([]);
      } else {
        setDepartment(managedDept);
        
        // 3. Fetch all staff members from this department
        const staffRes = await api.get(`/api/v1/department/${managedDept.id}/staffs?size=100&sortBy=id&sortDir=asc`);
        setStaffMembers(staffRes.data?.content || []);
      }
    } catch (err: any) {
      console.error('Failed to load department data for manager', err);
      setError(err.message || 'Lỗi khi đồng bộ dữ liệu phòng ban từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [user?.id]);

  const getRoleLabel = (roleStr: string) => {
    const r = roleStr.replace(/^ROLE_/, '');
    if (r === 'ADMIN') return 'Quản trị viên';
    if (r === 'MANAGER') return 'Trưởng phòng';
    return 'Nhân viên';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Đang tải dữ liệu phòng ban...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fff5f5', borderRadius: '16px', border: '1px solid #fed7d7', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--error)' }} />
        <h3 style={{ color: 'var(--error)', fontWeight: 700, fontSize: '18px', margin: 0 }}>Lỗi Tải Dữ Liệu</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: 0 }}>{error}</p>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={fetchDepartmentData}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px' }}
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Tổng quan Phòng ban (Manager)</h1>
          <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Quản lý'}.</p>
        </div>
        
        <div style={{ padding: '48px 32px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <Building size={48} style={{ color: '#94a3b8' }} />
          <h3 style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>Tài khoản chưa liên kết</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: 0 }}>
            Tài khoản của bạn chưa được liên kết quản lý phòng ban nào trên hệ thống với vai trò Trưởng phòng. Vui lòng liên hệ Quản trị viên (Admin) để cập nhật thông tin.
          </p>
          <button 
            type="button" 
            className="btn-primary-sm" 
            onClick={fetchDepartmentData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
          >
            <RefreshCw size={14} /> Kiểm tra lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dashboard-title">Hệ thống Quản lý Phòng ban (Manager)</h1>
          <p className="dashboard-subtitle">Xin chào Trưởng phòng, {user?.fullName || 'Quản lý'}. Dưới đây là thông tin phòng ban bạn phụ trách.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={fetchDepartmentData}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          <RefreshCw size={14} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Phòng ban phụ trách</span>
            <span className="metric-value" style={{ fontSize: '20px', marginTop: '4px' }}>{department.name}</span>
          </div>
          <div className="metric-icon-wrapper accent-blue">
            <Building size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Số lượng nhân viên</span>
            <span className="metric-value">{staffMembers.length}</span>
          </div>
          <div className="metric-icon-wrapper accent-green">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Department Info Section */}
      <div className="dashboard-content-section">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none', paddingBottom: 0 }}>
          <Building size={20} style={{ color: 'var(--primary-color)' }} />
          Chi tiết Phòng ban
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '16px 0', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
              <MapPin size={18} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>ĐỊA ĐIỂM / VĂN PHÒNG</span>
              <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{department.location || 'Chưa xác định'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
              <Tag size={18} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>PHÂN LOẠI PHÒNG BAN</span>
              <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 500 }}>{department.category || 'Chưa phân loại'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', gridColumn: '1 / -1' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
              <FileText size={18} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>MÔ TẢ CHỨC NĂNG VÀ NHIỆM VỤ</span>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>{department.description || 'Không có mô tả chi tiết.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List Table Section */}
      <div className="dashboard-content-section">
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none', paddingBottom: 0 }}>
          <Users size={20} style={{ color: 'var(--primary-color)' }} />
          Danh sách Nhân viên thuộc Phòng ban
        </h2>
        
        {staffMembers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
            Hiện chưa có nhân viên nào được phân vào phòng ban này.
          </div>
        ) : (
          <div className="dashboard-table-wrapper" style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã Nhân Viên</th>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Ngày sinh</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map((staff) => (
                  <tr key={staff.id}>
                    <td data-label="Mã Nhân Viên">#{staff.id}</td>
                    <td data-label="Họ và tên" style={{ fontWeight: 600 }}>{staff.fullName}</td>
                    <td data-label="Email" style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: 'none', padding: '14px 16px' }}>
                      <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
                      {staff.email}
                    </td>
                    <td data-label="Số điện thoại">
                      {staff.phoneNumber ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                          {staff.phoneNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td data-label="Ngày sinh">
                      {staff.birthday ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                          {new Date(staff.birthday).toLocaleDateString('vi-VN')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td data-label="Vai trò">
                      <span style={{ fontWeight: 500 }}>{getRoleLabel(staff.role)}</span>
                    </td>
                    <td data-label="Trạng thái">
                      <span className="status-badge active">Hoạt động</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
