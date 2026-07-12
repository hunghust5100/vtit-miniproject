import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { 
  Search, 
  Plus, 
  Trash2, 
  Pencil, 
  Eye, 
  Warehouse, 
  MapPin, 
  HardDrive, 
  PlusCircle, 
  X,
  XCircle,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import './ManagementTable.css';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/common/ConfirmModal';

interface AssetInWarehouse {
  id: number;
  serial: string;
  modelName: string;
  typeName: string;
  status: string;
  exportStatus: string; // "Trong kho" | "Chờ duyệt xuất kho" | "Đang chờ bàn giao" | "Đã xuất kho"
  allocatedToStaff: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
}

interface WarehouseResponse {
  id: number;
  name: string;
  code: string;
  location: string;
  description: string;
  totalAssets: number;
}

interface WarehouseDetailResponse {
  id: number;
  name: string;
  code: string;
  location: string;
  description: string;
  assets: AssetInWarehouse[];
}

const WarehouseManagement: React.FC = () => {
  const toast = useToast();

  // Server-side state
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter for warehouses
  const [searchQuery, setSearchQuery] = useState('');

  // Warehouse CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [warehouseDetail, setWarehouseDetail] = useState<WarehouseDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Add Asset state
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | ''>('');
  const [loadingAvailableAssets, setLoadingAvailableAssets] = useState(false);

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

  // Fetch all warehouses
  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/warehouses');
      setWarehouses(response.data || []);
    } catch (err: any) {
      console.error('Fetch warehouses failed', err);
      setError('Không thể lấy danh sách kho hàng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouse detail
  const fetchWarehouseDetail = async (id: number) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/api/v1/warehouses/${id}`);
      setWarehouseDetail(response.data);
    } catch (err: any) {
      console.error('Fetch warehouse detail failed', err);
      toast.showError('Không thể lấy thông tin chi tiết kho hàng.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Fetch assets that are not associated with any warehouse
  const fetchAvailableAssets = async () => {
    setLoadingAvailableAssets(true);
    try {
      // Get all asset instances (pagination size 1000 to get a large set)
      const response = await api.get('/api/v1/assets/instance', {
        params: { page: 0, size: 1000 }
      });
      const allInstances = response.data?.content || [];
      // Filter out assets that already belong to a warehouse
      const unassigned = allInstances.filter((ins: any) => ins.warehouseId === null);
      setAvailableAssets(unassigned);
    } catch (err) {
      console.error('Failed to fetch available assets', err);
    } finally {
      setLoadingAvailableAssets(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Handle opening Detail Modal
  const handleOpenDetailModal = (id: number) => {
    setSelectedWarehouseId(id);
    setWarehouseDetail(null);
    setIsDetailModalOpen(true);
    fetchWarehouseDetail(id);
    fetchAvailableAssets();
  };

  // Add asset to warehouse
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId || !selectedAssetId) {
      toast.showError('Vui lòng chọn một thiết bị.');
      return;
    }
    try {
      await api.post(`/api/v1/warehouses/${selectedWarehouseId}/assets/${selectedAssetId}`);
      toast.showSuccess('Đã thêm thiết bị vào kho thành công!');
      setSelectedAssetId('');
      fetchWarehouseDetail(selectedWarehouseId);
      fetchAvailableAssets();
      fetchWarehouses(); // Refresh counts
    } catch (err: any) {
      console.error('Failed to add asset to warehouse', err);
      toast.showError(err.response?.data?.message || 'Không thể thêm thiết bị vào kho.');
    }
  };

  // Remove asset from warehouse
  const handleRemoveAsset = (assetId: number, serial: string) => {
    if (!selectedWarehouseId) return;
    triggerConfirm(
      'Xác nhận xuất kho',
      `Bạn có chắc chắn muốn bỏ thiết bị có số Serial: "${serial}" ra khỏi kho hàng này?`,
      async () => {
        try {
          await api.delete(`/api/v1/warehouses/assets/${assetId}`);
          toast.showSuccess('Đã xuất thiết bị khỏi kho!');
          fetchWarehouseDetail(selectedWarehouseId);
          fetchAvailableAssets();
          fetchWarehouses(); // Refresh counts
        } catch (err: any) {
          console.error('Failed to remove asset', err);
          toast.showError(err.response?.data?.message || 'Không thể xuất thiết bị khỏi kho.');
        }
      }
    );
  };

  // Open Create/Edit modal
  const handleOpenModal = (warehouse: WarehouseResponse | null = null) => {
    setModalError(null);
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setNewName(warehouse.name);
      setNewCode(warehouse.code);
      setNewLocation(warehouse.location || '');
      setNewDescription(warehouse.description || '');
    } else {
      setEditingWarehouse(null);
      setNewName('');
      setNewCode('');
      setNewLocation('');
      setNewDescription('');
    }
    setIsModalOpen(true);
  };

  // Submit Create/Edit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      setModalError('Tên kho và Mã kho không được để trống.');
      return;
    }

    setSubmitting(true);
    setModalError(null);

    const payload = {
      name: newName,
      code: newCode,
      location: newLocation,
      description: newDescription
    };

    try {
      if (editingWarehouse) {
        await api.put(`/api/v1/warehouses/${editingWarehouse.id}`, payload);
        toast.showSuccess('Cập nhật kho hàng thành công!');
      } else {
        await api.post('/api/v1/warehouses', payload);
        toast.showSuccess('Thêm kho hàng mới thành công!');
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      console.error('Submit warehouse failed', err);
      setModalError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Warehouse
  const handleDeleteWarehouse = (warehouse: WarehouseResponse) => {
    triggerConfirm(
      'Xác nhận xóa kho',
      `Bạn có chắc chắn muốn xóa kho hàng "${warehouse.name}"? Tất cả thiết bị thuộc kho này sẽ bị hủy liên kết kho hàng (không bị xóa khỏi hệ thống).`,
      async () => {
        try {
          await api.delete(`/api/v1/warehouses/${warehouse.id}`);
          toast.showSuccess('Xóa kho hàng thành công!');
          fetchWarehouses();
        } catch (err: any) {
          console.error('Delete warehouse failed', err);
          toast.showError(err.response?.data?.message || 'Không thể xóa kho hàng.');
        }
      }
    );
  };

  // Filter warehouses based on search query
  const filteredWarehouses = warehouses.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper to color exportStatus tags
  const getExportStatusClass = (status: string) => {
    if (status === 'Trong kho') return 'status-badge available'; // Green
    if (status === 'Chờ duyệt xuất kho') return 'status-badge pending'; // Orange/Yellow
    if (status === 'Đang chờ bàn giao') return 'status-badge approved'; // Cyan/Blue
    return 'status-badge in-use'; // Gray/Purple
  };

  const getExportStatusIcon = (status: string) => {
    if (status === 'Trong kho') return <CheckCircle size={14} className="mr-1" />;
    if (status === 'Chờ duyệt xuất kho') return <Clock size={14} className="mr-1" />;
    if (status === 'Đang chờ bàn giao') return <AlertTriangle size={14} className="mr-1" />;
    return <FileText size={14} className="mr-1" />;
  };

  return (
    <div className="management-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Kho chứa &amp; Inventory</h1>
          <p className="page-subtitle">Quản lý các kho thiết bị và theo dõi tình trạng xuất nhập kho</p>
        </div>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={() => handleOpenModal(null)}
        >
          <Plus size={18} />
          <span>Thêm kho mới</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="table-controls">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm kho theo tên, mã, vị trí..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid/Table */}
      {loading ? (
        <div className="table-loading-container">
          <div className="spinner"></div>
          <span>Đang tải danh sách kho...</span>
        </div>
      ) : error ? (
        <div className="table-error-container">
          <span>{error}</span>
          <button type="button" className="btn btn-secondary mt-2" onClick={fetchWarehouses}>Thử lại</button>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="empty-state-view">
          <Warehouse size={48} className="text-muted mb-2" />
          <h3>Không tìm thấy kho hàng nào</h3>
          <p>Thử điều chỉnh từ khóa tìm kiếm hoặc tạo thêm kho mới.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="management-table">
            <thead>
              <tr>
                <th>Mã kho</th>
                <th>Tên kho</th>
                <th>Vị trí</th>
                <th>Mô tả</th>
                <th className="text-center">Số lượng thiết bị</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((w) => (
                <tr key={w.id} className="hover-row">
                  <td className="font-semibold text-primary">{w.code}</td>
                  <td>
                    <div className="flex-align gap-2">
                      <Warehouse size={16} className="text-muted" />
                      <strong>{w.name}</strong>
                    </div>
                  </td>
                  <td>
                    {w.location ? (
                      <div className="flex-align gap-1 text-sm text-secondary">
                        <MapPin size={14} />
                        <span>{w.location}</span>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="text-sm text-secondary max-w-xs truncate">{w.description || <span className="text-muted">Không có mô tả</span>}</td>
                  <td className="text-center">
                    <span className="badge-count">{w.totalAssets} thiết bị</span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <button 
                        type="button" 
                        className="action-btn btn-view" 
                        onClick={() => handleOpenDetailModal(w.id)}
                        title="Xem chi tiết thiết bị trong kho"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="action-btn btn-edit" 
                        onClick={() => handleOpenModal(w)}
                        title="Chỉnh sửa thông tin kho"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        type="button" 
                        className="action-btn btn-delete" 
                        onClick={() => handleDeleteWarehouse(w)}
                        title="Xóa kho"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Warehouse Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-container max-w-md animate-fade-in" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
            <button 
              type="button" 
              className="modal-close-x" 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>
            
            <h2 className="modal-title mb-4" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {editingWarehouse ? 'Chỉnh sửa Kho hàng' : 'Thêm Kho hàng mới'}
            </h2>

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Mã kho <span className="text-primary">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Ví dụ: KHO-HA-NOI, KHO-B2..."
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Tên kho <span className="text-primary">*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Kho Tổng Hòa Lạc, Kho Cấp Phát Tầng 5..."
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Vị trí địa lý</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ví dụ: Tòa nhà Keangnam, Hà Nội"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>Mô tả ngắn</label>
                <textarea 
                  className="form-input" 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả chức năng kho, thủ kho..."
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                />
              </div>

              {modalError && (
                <div className="error-alert" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                  {modalError}
                </div>
              )}

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Warehouse Detail Modal (Manage Devices & Track Stock-Out Status) */}
      {isDetailModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-container max-w-5xl animate-fade-in" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-xl)', position: 'relative', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              type="button" 
              className="modal-close-x" 
              onClick={() => setIsDetailModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            {loadingDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                <div className="spinner"></div>
                <span>Đang tải thông tin chi tiết kho...</span>
              </div>
            ) : warehouseDetail ? (
              <div>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Warehouse size={24} className="text-primary" />
                    <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                      Chi tiết kho: {warehouseDetail.name} ({warehouseDetail.code})
                    </h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                    <strong>Địa điểm:</strong> {warehouseDetail.location || 'Chưa xác định'} | <strong>Mô tả:</strong> {warehouseDetail.description || 'Không có mô tả'}
                  </p>
                </div>

                {/* Section: Add Device to Warehouse */}
                <div className="add-asset-box" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PlusCircle size={18} className="text-primary" />
                    <span>Nhập thiết bị mới vào kho này</span>
                  </h3>
                  <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flexGrow: 1, minWidth: '240px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Chọn thiết bị chưa có kho:</label>
                      <select 
                        className="form-input" 
                        value={selectedAssetId} 
                        onChange={(e) => setSelectedAssetId(Number(e.target.value) || '')}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        disabled={loadingAvailableAssets}
                      >
                        <option value="">-- Chọn thiết bị (Model - Serial) --</option>
                        {availableAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.assetModelName} - Serial: {asset.serial} ({asset.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ height: '42px' }}
                      disabled={!selectedAssetId}
                    >
                      Xác nhận nhập kho
                    </button>
                  </form>
                  {availableAssets.length === 0 && !loadingAvailableAssets && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      * Hiện tại tất cả thiết bị trên hệ thống đều đã được gán kho.
                    </p>
                  )}
                </div>

                {/* Section: Devices List */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardDrive size={18} className="text-secondary" />
                  <span>Danh sách thiết bị thuộc kho ({warehouseDetail.assets.length})</span>
                </h3>

                {warehouseDetail.assets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                    Chưa có thiết bị nào trong kho này. Hãy chọn thiết bị ở trên để nhập kho.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="management-table" style={{ fontSize: '13px' }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#ffffff' }}>
                        <tr>
                          <th>Serial</th>
                          <th>Model</th>
                          <th>Chủng loại</th>
                          <th className="text-center">Trạng thái Thiết bị</th>
                          <th className="text-center">Trạng thái Xuất kho</th>
                          <th>Người sử dụng</th>
                          <th className="text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {warehouseDetail.assets.map((asset) => (
                          <tr key={asset.id}>
                            <td><strong>{asset.serial}</strong></td>
                            <td>{asset.modelName}</td>
                            <td>{asset.typeName}</td>
                            <td className="text-center">
                              <span className={`status-badge ${asset.status.toLowerCase()}`}>
                                {asset.status}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={getExportStatusClass(asset.exportStatus)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                {getExportStatusIcon(asset.exportStatus)}
                                <span>{asset.exportStatus}</span>
                              </span>
                            </td>
                            <td>
                              {asset.allocatedToStaff ? (
                                <span className="font-semibold text-dark">{asset.allocatedToStaff}</span>
                              ) : (
                                <span className="text-muted">Chưa bàn giao</span>
                              )}
                            </td>
                            <td className="text-center">
                              <button 
                                type="button" 
                                className="action-btn btn-delete"
                                onClick={() => handleRemoveAsset(asset.id, asset.serial)}
                                title="Bỏ thiết bị khỏi kho"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px' }}
                              >
                                <XCircle size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>Không có dữ liệu.</div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Modal */}
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

export default WarehouseManagement;
