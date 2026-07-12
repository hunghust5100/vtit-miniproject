import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { 
  Search, 
  Check, 
  X, 
  Printer, 
  User, 
  HardDrive,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Archive
} from 'lucide-react';
import '../admin/ManagementTable.css';

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
  expectedReturnDate: string | null;
  returnedAt: string | null;
}

interface UserDetail {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: string;
}

interface AssetInstanceDetail {
  id: number;
  serial: string;
  assetModelName: string;
  assetTypeName: string;
  purchaseDate: string;
  status: string;
}

const AllocationManagement: React.FC = () => {
  const toast = useToast();
  
  // Data State
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sorting State
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Handover Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedAlloc, setSelectedAlloc] = useState<AllocationItem | null>(null);
  const [receiptUser, setReceiptUser] = useState<UserDetail | null>(null);
  const [receiptAsset, setReceiptAsset] = useState<AssetInstanceDetail | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/allocation', {
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
      console.error('Fetch allocations failed', err);
      setError('Không thể lấy danh sách yêu cầu cấp phát. Vui lòng tải lại trang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [page, size]);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => onConfirm);
    setConfirmOpen(true);
  };

  // Status Action Handler
  const handleUpdateStatus = (id: number, targetStatus: string, actionLabel: string) => {
    triggerConfirm(
      `Xác nhận ${actionLabel}`,
      `Bạn có chắc chắn muốn chuyển trạng thái yêu cầu #${id} thành "${actionLabel.toUpperCase()}"?`,
      async () => {
        try {
          // PUT /api/v1/allocation/{id}?status={targetStatus}
          await api.put(`/api/v1/allocation/${id}`, null, {
            params: { status: targetStatus }
          });
          toast.showSuccess(`Đã thực hiện: "${actionLabel}" thành công!`);
          fetchAllocations();
        } catch (err: any) {
          console.error(`Failed to update allocation to ${targetStatus}`, err);
          toast.showError('Thao tác thất bại: ' + (err.response?.data?.message || err.message));
        }
      }
    );
  };

  // Open Handover Receipt Modal and fetch additional details
  const handleOpenReceipt = async (alloc: AllocationItem) => {
    setSelectedAlloc(alloc);
    setIsReceiptOpen(true);
    setLoadingReceipt(true);
    setReceiptUser(null);
    setReceiptAsset(null);
    try {
      // Fetch User details to get Phone/Email
      const userRes = await api.get(`/api/v1/users/${alloc.staffId}`);
      setReceiptUser(userRes.data);

      // Fetch Asset details to get Serial/Type
      const assetRes = await api.get(`/api/v1/assets/instance/${alloc.assetInstanceId}`);
      setReceiptAsset(assetRes.data);
    } catch (err) {
      console.error('Failed to load receipt details', err);
      // Fallback fallback details
      setReceiptUser({
        id: alloc.staffId,
        fullName: alloc.staffName,
        email: 'N/A',
        phoneNumber: 'N/A',
        role: 'USER'
      });
      setReceiptAsset({
        id: alloc.assetInstanceId,
        serial: 'N/A',
        assetModelName: alloc.assetModelName,
        assetTypeName: 'Thiết bị công nghệ',
        purchaseDate: '',
        status: 'USING'
      });
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter local data based on filters (backend doesn't support server-side search directly)
  const getFilteredAllocations = () => {
    return allocations.filter(a => {
      const matchesSearch = 
        a.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetModelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(a.id).includes(searchQuery);
      
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredAllocations = getFilteredAllocations();

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
        return <span className="status-badge" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>Đã duyệt - Chờ giao</span>;
      case 'USING':
        return <span className="status-badge active">Đang sử dụng</span>;
      case 'RETURNED':
        return <span className="status-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>Đã thu hồi</span>;
      case 'REJECTED':
        return <span className="status-badge inactive">Từ chối</span>;
      case 'CANCELED':
        return <span className="status-badge inactive" style={{ backgroundColor: '#e2e8f0', color: '#64748b' }}>Đã hủy</span>;
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
          <h1 className="page-title">Quản lý Cấp phát Thiết bị</h1>
          <p className="page-subtitle">Phê duyệt các yêu cầu mượn thiết bị của nhân viên, xác nhận bàn giao phần cứng vật lý và in Biên bản giao nhận.</p>
        </div>
        <div className="page-header-actions">
          <button 
            type="button" 
            className="btn-outline" 
            onClick={fetchAllocations} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Tải lại danh sách
          </button>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="table-control-bar">
        <div className="filter-group">
          {/* Search */}
          <div className="search-box-wrapper">
            <Search size={18} className="search-icon-left" />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm tên nhân viên, dòng máy, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tab-like select */}
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ phê duyệt (Pending)</option>
            <option value="APPROVED">Đã duyệt - Chờ bàn giao (Approved)</option>
            <option value="USING">Đang sử dụng (Using)</option>
            <option value="RETURNED">Đã thu hồi (Returned)</option>
            <option value="REJECTED">Đã từ chối (Rejected)</option>
            <option value="CANCELED">Đã hủy (Canceled)</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-container">
        {loading ? (
          <div className="table-loading-spinner" style={{ padding: '40px' }}>
            <div className="spinner" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary-color)', width: '30px', height: '30px' }}></div>
            <span>Đang tải danh sách lịch sử cấp phát...</span>
          </div>
        ) : error ? (
          <div className="empty-data-view" style={{ color: 'var(--error)' }}>
            <span>{error}</span>
            <button type="button" className="btn-outline" onClick={fetchAllocations}>Thử lại</button>
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="empty-data-view" style={{ padding: '40px' }}>
            <span>Không tìm thấy yêu cầu cấp phát nào phù hợp.</span>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mã số</th>
                    <th>Nhân viên đăng ký</th>
                    <th>Thiết bị yêu cầu (Model)</th>
                    <th>Ngày yêu cầu</th>
                    <th>Trạng thái</th>
                    <th>Ngày bàn giao</th>
                    <th style={{ textAlign: 'center' }}>Thao tác xử lý</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((a) => (
                    <tr key={a.id}>
                      <td data-label="Mã số" className="text-nowrap" style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{a.id}</td>
                      <td data-label="Nhân viên đăng ký" className="text-nowrap">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <User size={14} style={{ color: 'var(--text-secondary)' }} />
                          {a.staffName}
                        </div>
                      </td>
                      <td data-label="Thiết bị yêu cầu (Model)" style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HardDrive size={14} style={{ color: 'var(--primary-color)' }} />
                          {a.assetModelName}
                        </div>
                      </td>
                      <td data-label="Ngày yêu cầu" className="text-nowrap" style={{ fontSize: '13px' }}>
                        {new Date(a.requestAt).toLocaleString('vi-VN')}
                      </td>
                      <td data-label="Trạng thái" className="text-nowrap">{getStatusBadge(a.status, a.requestAt)}</td>
                      <td data-label="Ngày bàn giao" className="text-nowrap" style={{ fontSize: '13px' }}>
                        {a.receivedAt ? (
                          <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                            {new Date(a.receivedAt).toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Chưa nhận</span>
                        )}
                      </td>
                      <td data-label="Thao tác xử lý" className="text-nowrap" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {/* PENDING Actions: Approve / Reject */}
                          {a.status === 'PENDING' && (new Date(a.requestAt.replace('T', ' ')).getTime() + 24 * 60 * 60 * 1000 > currentTime) && (
                            <>
                              <button
                                type="button"
                                className="btn-primary-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#10b981' }}
                                onClick={() => handleUpdateStatus(a.id, 'APPROVED', 'phê duyệt')}
                              >
                                <Check size={14} /> Duyệt
                              </button>
                              <button
                                type="button"
                                className="btn-outline-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                onClick={() => handleUpdateStatus(a.id, 'REJECTED', 'từ chối')}
                              >
                                <X size={14} /> Từ chối
                              </button>
                            </>
                          )}

                          {/* APPROVED Actions: Export Receipt */}
                          {a.status === 'APPROVED' && (
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenReceipt(a)}
                            >
                              <Printer size={14} /> In biên bản
                            </button>
                          )}

                          {/* USING Actions: Export Receipt & Return Asset */}
                          {a.status === 'USING' && (
                            <>
                              <button
                                type="button"
                                className="btn-outline-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }}
                                onClick={() => handleOpenReceipt(a)}
                              >
                                <Printer size={14} /> In biên bản
                              </button>
                              <button
                                type="button"
                                className="btn-outline-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                                onClick={() => handleUpdateStatus(a.id, 'RETURNED', 'thu hồi thiết bị')}
                              >
                                <Archive size={14} /> Thu hồi
                              </button>
                            </>
                          )}
                          
                          {/* Default fallback info */}
                          {(['REJECTED', 'CANCELED', 'RETURNED'].includes(a.status) || (a.status === 'PENDING' && new Date(a.requestAt.replace('T', ' ')).getTime() + 24 * 60 * 60 * 1000 <= currentTime)) && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lưu trữ</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-bar" style={{ padding: '16px 20px' }}>
              <div className="pagination-info">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trên tổng số {totalElements} yêu cầu
              </div>
              <div className="pagination-controls-wrapper">
                <div className="page-size-selector-wrapper">
                  <span>Kích thước</span>
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

      {/* Confirmation Modal */}
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

      {/* Handover Receipt Modal */}
      {isReceiptOpen && selectedAlloc && (
        <div className="modal-overlay print-modal-overlay">
          <div className="modal-card print-modal-card" style={{ maxWidth: '800px', width: '100%', padding: '0', overflow: 'hidden' }}>
            
            {/* Header controls (Hidden during print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Biên bản bàn giao thiết bị</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '50px', padding: '8px 16px', fontSize: '13px' }}
                  onClick={handlePrintReceipt}
                  disabled={loadingReceipt}
                >
                  <Printer size={15} /> In biên bản (A4)
                </button>
                <button 
                  type="button" 
                  className="btn-outline" 
                  style={{ borderRadius: '50px', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => setIsReceiptOpen(false)}
                >
                  Đóng lại
                </button>
              </div>
            </div>

            {/* Receipt Content Area */}
            <div style={{ padding: '40px 50px', maxHeight: '75vh', overflowY: 'auto', backgroundColor: '#ffffff', color: '#000000' }} className="print-container">
              
              {loadingReceipt ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px auto', width: '25px', height: '25px', border: '3px solid #cbd5e1', borderTopColor: 'var(--primary-color)' }}></div>
                  <span>Đang tải thông tin biên bản bàn giao...</span>
                </div>
              ) : (
                <div className="print-sheet-content" style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '15px', lineHeight: '1.6' }}>
                  
                  {/* Print Stylesheet (Injected directly for clean formatting) */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                      body * {
                        visibility: hidden !important;
                      }
                      .print-container, .print-container * {
                        visibility: visible !important;
                      }
                      .print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        background: #fff !important;
                        color: #000 !important;
                      }
                      .no-print {
                        display: none !important;
                      }
                    }
                  `}} />

                  {/* Document Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px', display: 'block' }}>TẬP ĐOÀN CÔNG NGHỆ VIỄN THÔNG QUÂN ĐỘI</span>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px', display: 'block', color: 'var(--primary-color)' }}>VTIT ASSET MANAGEMENT</span>
                      <span style={{ fontSize: '11px', display: 'block', color: '#64748b' }}>Số: {selectedAlloc.id}/BBBG-VTIT</span>
                    </div>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', display: 'block' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</span>
                      <span style={{ fontSize: '12px', fontStyle: 'italic', display: 'block', marginTop: '6px' }}>Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</span>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div style={{ textAlign: 'center', margin: '30px 0' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0' }}>BIÊN BẢN BÀN GIAO THIẾT BỊ</h1>
                    <span style={{ fontStyle: 'italic', fontSize: '14px' }}>(V/v: Bàn giao thiết bị vật lý phục vụ công việc)</span>
                  </div>

                  {/* Legal base info */}
                  <p style={{ textIndent: '25px', marginBottom: '16px' }}>
                    Căn cứ Quy chế quản lý tài sản công nghệ thông tin của VTIT Asset Management;
                  </p>
                  <p style={{ textIndent: '25px', marginBottom: '20px' }}>
                    Hôm nay, ngày {new Date().toLocaleDateString('vi-VN')} tại văn phòng VTIT, chúng tôi tiến hành bàn giao thiết bị công nghệ thông tin với các thông tin chi tiết như dưới đây:
                  </p>

                  {/* Section A: Handover Party */}
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px', margin: '0 0 8px 0' }}>Bên giao (Đại diện quản trị hệ thống):</h3>
                    <div style={{ paddingLeft: '15px' }}>
                      <div>- Họ và tên: <strong>Nguyễn Khánh Hưng</strong></div>
                      <div>- Chức vụ: Quản trị viên hệ thống VTIT</div>
                      <div>- Bộ phận: Phòng Quản trị Tài sản Công nghệ Thông tin</div>
                    </div>
                  </div>

                  {/* Section B: Receiving Party */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px', margin: '0 0 8px 0' }}>Bên nhận (Nhân sự sử dụng):</h3>
                    <div style={{ paddingLeft: '15px' }}>
                      <div>- Họ và tên: <strong>{receiptUser?.fullName || selectedAlloc.staffName}</strong></div>
                      <div>- Email: {receiptUser?.email || 'N/A'}</div>
                      <div>- Số điện thoại: {receiptUser?.phoneNumber || 'N/A'}</div>
                      <div>- Bộ phận/Phòng ban: Nhân viên VTIT</div>
                    </div>
                  </div>

                  {/* Section C: Equipment Details */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px', margin: '0 0 8px 0' }}>Thông tin thiết bị bàn giao:</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '14.5px' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#f1f5f9' }}>STT</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f1f5f9' }}>Tên & Model thiết bị</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', backgroundColor: '#f1f5f9' }}>Loại thiết bị</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#f1f5f9' }}>Số Serial</th>
                          <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', backgroundColor: '#f1f5f9' }}>Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                          <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{receiptAsset?.assetModelName || selectedAlloc.assetModelName}</td>
                          <td style={{ border: '1px solid #000', padding: '8px' }}>{receiptAsset?.assetTypeName || 'Thiết bị công nghệ'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{receiptAsset?.serial || 'N/A'}</td>
                          <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Mới 100% / Sẵn sàng</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Terms */}
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '15px', margin: '0 0 8px 0' }}>Cam kết sử dụng & An toàn thông tin:</h3>
                    <ol style={{ paddingLeft: '20px', margin: '0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>Bên nhận có trách nhiệm bảo quản, giữ gìn thiết bị được bàn giao theo đúng quy định sử dụng tài sản của Tập đoàn.</li>
                      <li>Bên nhận cam kết sử dụng thiết bị đúng mục đích công việc và tuân thủ các quy định về an toàn thông tin của Tập đoàn.</li>
                      <li>Biên bản này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để đối chiếu.</li>
                    </ol>
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', minHeight: '120px' }}>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>ĐẠI DIỆN BÊN GIAO</span>
                      <span style={{ fontStyle: 'italic', fontSize: '12px', display: 'block', color: '#64748b', marginBottom: '60px' }}>(Ký và ghi rõ họ tên)</span>
                      <span style={{ fontWeight: 'bold', display: 'block', fontSize: '15px' }}>Nguyễn Khánh Hưng</span>
                    </div>
                    <div style={{ textAlign: 'center', width: '50%' }}>
                      <span style={{ fontWeight: 'bold', display: 'block' }}>ĐẠI DIỆN BÊN NHẬN</span>
                      <span style={{ fontStyle: 'italic', fontSize: '12px', display: 'block', color: '#64748b', marginBottom: '60px' }}>(Ký và ghi rõ họ tên)</span>
                      <span style={{ fontWeight: 'bold', display: 'block', fontSize: '15px' }}>{receiptUser?.fullName || selectedAlloc.staffName}</span>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationManagement;
