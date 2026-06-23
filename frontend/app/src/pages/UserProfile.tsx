import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  User as UserIcon,
  Lock,
  Calendar,
  Phone,
  Mail,
  Shield,
  Save,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import './Dashboard.css';

interface UserProfileData {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  birthday: string;
  role: string;
  createdAt: string;
}

const UserProfile: React.FC = () => {
  const { user, login } = useAuth();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real Database ID
  const [staffId, setStaffId] = useState<number | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Profile Edit Form State
  const [fullNameInput, setFullNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [birthdayInput, setBirthdayInput] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const fetchProfileData = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Get staff ID by email
      const usersRes = await api.get('/api/v1/users?size=100');
      const currentUser = usersRes.data?.content?.find((u: any) => u.email === user.email);
      
      if (!currentUser) {
        throw new Error('Không tìm thấy thông tin tài khoản trên hệ thống.');
      }
      
      const currentStaffId = currentUser.id;
      setStaffId(currentStaffId);

      // 2. Fetch full profile details
      const profileRes = await api.get(`/api/v1/users/${currentStaffId}`);
      const profileData: UserProfileData = profileRes.data;
      setProfile(profileData);
      setFullNameInput(profileData.fullName || '');
      setPhoneInput(profileData.phoneNumber || '');
      setBirthdayInput(profileData.birthday ? profileData.birthday.split('T')[0] : '');
    } catch (err: any) {
      console.error('Failed to load profile data', err);
      setError(err.message || 'Lỗi khi đồng bộ dữ liệu với máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user?.email]);

  // Handle Edit Profile Submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !profile) return;
    
    if (!fullNameInput.trim()) {
      toast.showError('Họ và tên không được để trống.');
      return;
    }

    setUpdatingProfile(true);
    try {
      const updateData = {
        fullName: fullNameInput.trim(),
        phoneNumber: phoneInput.trim(),
        birthday: birthdayInput || null,
        role: profile.role // Preserve role
      };

      const response = await api.put(`/api/v1/users/${staffId}`, updateData);
      
      // Update local state
      setProfile(response.data);
      
      // Sync auth context localstorage so avatar/name in header updates immediately
      const token = localStorage.getItem('token') || '';
      login(token, {
        email: response.data.email,
        fullName: response.data.fullName,
        role: response.data.role
      });
      
      toast.showSuccess('Cập nhật thông tin cá nhân thành công!');
    } catch (err: any) {
      console.error('Update profile failed', err);
      toast.showError(err.response?.data?.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) return;

    if (!oldPassword || !newPassword) {
      toast.showError('Vui lòng điền mật khẩu cũ và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      toast.showError('Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.showError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put(`/api/v1/users/${staffId}/change-password`, {
        oldPassword,
        newPassword
      });
      
      toast.showSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Change password failed', err);
      toast.showError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Thông tin cá nhân</h1>
          <p className="page-subtitle">Xem chi tiết lý lịch tài khoản, sửa đổi thông tin cá nhân và thay đổi mật khẩu của bạn.</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-outline" 
            onClick={fetchProfileData} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Tải lại
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '13px', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fee2e2', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Forms Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }} className="animate-fade-in">
        
        {/* Edit Profile Form */}
        <div className="dashboard-content-section" style={{ height: 'fit-content' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserIcon size={18} style={{ color: 'var(--primary-color)' }} />
            Cập nhật thông tin cá nhân
          </h2>
          
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px auto', width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)' }}></div>
              <span>Đang tải thông tin...</span>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Mail size={13} /> Email tài khoản
                </label>
                <input
                  type="email"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed', borderColor: 'var(--border-color)' }}
                  value={profile?.email || ''}
                  disabled
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <UserIcon size={13} /> Họ và tên <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  disabled={updatingProfile}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Phone size={13} /> Số điện thoại
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  disabled={updatingProfile}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Calendar size={13} /> Ngày sinh
                </label>
                <input
                  type="date"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                  value={birthdayInput}
                  onChange={(e) => setBirthdayInput(e.target.value)}
                  disabled={updatingProfile}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Shield size={13} /> Vai trò hệ thống
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: '16px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed', borderColor: 'var(--border-color)', textTransform: 'capitalize' }}
                  value={profile?.role ? profile.role.replace(/^ROLE_/, '') : 'Nhân viên'}
                  disabled
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '50px', fontWeight: 600, marginTop: '8px' }}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent' }}></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Lưu thông tin cá nhân
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Change Password Form */}
        <div className="dashboard-content-section" style={{ height: 'fit-content' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--primary-color)' }} />
            Đổi mật khẩu tài khoản
          </h2>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <Lock size={13} /> Mật khẩu cũ <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={updatingPassword}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <KeyRound size={13} /> Mật khẩu mới <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                placeholder="Độ dài tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={updatingPassword}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <KeyRound size={13} /> Xác nhận mật khẩu mới <span style={{ color: 'var(--error)' }}>*</span>
              </label>
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)' }}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={updatingPassword}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '50px', fontWeight: 600, marginTop: '8px' }}
              disabled={updatingPassword}
            >
              {updatingPassword ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent' }}></div>
                  Đang thay đổi mật khẩu...
                </>
              ) : (
                <>
                  <Lock size={16} /> Xác nhận đổi mật khẩu
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
