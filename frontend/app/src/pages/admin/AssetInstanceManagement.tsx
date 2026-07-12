import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
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
  Trash2,
  Pencil,
  History,
  Clock,
  User,
  Eye,
  Wrench,
  QrCode,
  Warehouse
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
  depreciationMethod?: string;
  netBookValue?: number;
  salvageValue?: number;
  specification?: Record<string, any>;
  maintenanceCost?: number;
  warehouseId?: number | null;
  warehouseName?: string | null;
}

interface AssetModelOption {
  id: number;
  name: string;
}

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

const AssetInstanceManagement: React.FC = () => {
  const toast = useToast();
  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
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

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<AssetInstanceResponse | null>(null);
  const [newModelId, setNewModelId] = useState<number | ''>('');
  const [newSerial, setNewSerial] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPurchasePrice, setNewPurchasePrice] = useState<number | ''>('');
  const [newMaintenanceCost, setNewMaintenanceCost] = useState<number | ''>('');
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  
  // Additional update fields
  const [newDepreciationMethod, setNewDepreciationMethod] = useState('STRAIGHT_LINE');
  const [newNetBookValue, setNewNetBookValue] = useState<number | ''>('');
  const [newSalvageValue, setNewSalvageValue] = useState<number | ''>('');
  const [newDepreciationRate, setNewDepreciationRate] = useState<number | ''>('');
  const [newDepreciationCycle, setNewDepreciationCycle] = useState<number | ''>('');
  const [newAdjustmentFactor, setNewAdjustmentFactor] = useState<number | ''>('');
  const [newSpecifications, setNewSpecifications] = useState<{ key: string; value: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [newWarehouseId, setNewWarehouseId] = useState<number | ''>('');
  
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Allocation History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<AssetInstanceResponse | null>(null);
  const [historyList, setHistoryList] = useState<AllocationItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Device Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<any>(null);
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // QR Code Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrInstance, setQrInstance] = useState<AssetInstanceResponse | null>(null);

  const handleOpenQrModal = (ins: AssetInstanceResponse) => {
    setQrInstance(ins);
    setIsQrModalOpen(true);
  };

  const downloadQrCode = () => {
    if (!qrInstance) return;
    const svgElement = document.getElementById(`qr-${qrInstance.serial}`);
    if (!svgElement) return;
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 250;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 25, 25, 200, 200);
        
        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `qrcode_${qrInstance.serial}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const printQrCode = () => {
    if (!qrInstance) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const svgElement = document.getElementById(`qr-${qrInstance.serial}`);
    if (!svgElement) return;
    const svgString = svgElement.outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>In mã QR - ${qrInstance.serial}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .container {
              text-align: center;
              border: 2px dashed #ccc;
              padding: 20px;
              border-radius: 8px;
            }
            h2 { margin-bottom: 5px; }
            p { color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>VTIT ASSET QR</h2>
            ${svgString}
            <p>Model: ${qrInstance.assetModelName}</p>
            <p>Serial: ${qrInstance.serial}</p>
          </div>
          <script>
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');

    try {
      if (searchParam) {
        try {
          const response = await api.get(`/api/v1/assets/instance/by-serial/${searchParam}`);
          if (response.data) {
            setInstances([response.data]);
            setTotalPages(1);
            setTotalElements(1);
          } else {
            setInstances([]);
            setTotalPages(0);
            setTotalElements(0);
          }
        } catch (searchErr) {
          // Fallback to empty list instead of global error page if serial is not found
          setInstances([]);
          setTotalPages(0);
          setTotalElements(0);
        }
      } else {
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

  // Fetch Warehouse options for dropdown
  const fetchWarehouseOptions = async () => {
    try {
      const response = await api.get('/api/v1/warehouses');
      if (response.data) {
        setWarehouses(response.data.map((w: any) => ({ id: w.id, name: w.name })));
      }
    } catch (err) {
      console.error('Failed to fetch warehouse options', err);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [page, size, sortBy, sortDir]);

  useEffect(() => {
    fetchModelOptions();
    fetchWarehouseOptions();
    
    // Parse initial search parameter from URL
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
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

  // Open History Modal
  const handleOpenHistoryModal = async (ins: AssetInstanceResponse) => {
    setSelectedInstance(ins);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const response = await api.get(`/api/v1/allocation/asset-instance/${ins.id}?size=100&sortBy=id&sortDir=desc`);
      setHistoryList(response.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch instance allocation history', err);
      toast.showError('Không thể lấy lịch sử cấp phát của thiết bị.');
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Detail Modal
  const handleOpenDetailModal = async (ins: AssetInstanceResponse) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailError(null);
    setSelectedAssetDetail(null);
    setSelectedModelDetail(null);
    try {
      const assetRes = await api.get(`/api/v1/assets/instance/${ins.id}`);
      setSelectedAssetDetail(assetRes.data);
      if (assetRes.data?.assetModelId) {
        try {
          const modelRes = await api.get(`/api/v1/assets/model/${assetRes.data.assetModelId}`);
          setSelectedModelDetail(modelRes.data);
        } catch (modelErr) {
          console.error("Failed to fetch model details", modelErr);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch asset details", err);
      setDetailError("Không thể tải thông tin chi tiết thiết bị.");
    } finally {
      setLoadingDetail(false);
    }
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
    setNewMaintenanceCost('');
    setNewStatus('AVAILABLE');
    setNewDepreciationMethod('STRAIGHT_LINE');
    setNewNetBookValue('');
    setNewSalvageValue('');
    setNewDepreciationRate('');
    setNewDepreciationCycle('');
    setNewAdjustmentFactor('');
    setNewSpecifications([]);
    setNewWarehouseId('');
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (ins: any) => {
    setEditingInstance(ins);
    setNewModelId(ins.assetModelId);
    setNewSerial(ins.serial);
    setNewPurchaseDate(ins.purchaseDate ? ins.purchaseDate.split('T')[0] : '');
    setNewPurchasePrice(ins.purchasePrice);
    setNewMaintenanceCost(ins.maintenanceCost !== null && ins.maintenanceCost !== undefined ? ins.maintenanceCost : '');
    setNewStatus(ins.status);
    
    // Bind additional details
    setNewDepreciationMethod(ins.depreciationMethod || 'STRAIGHT_LINE');
    setNewNetBookValue(ins.netBookValue !== null && ins.netBookValue !== undefined ? ins.netBookValue : '');
    setNewSalvageValue(ins.salvageValue !== null && ins.salvageValue !== undefined ? ins.salvageValue : '');
    setNewDepreciationRate(ins.depreciationRate !== null && ins.depreciationRate !== undefined ? ins.depreciationRate : '');
    setNewDepreciationCycle(ins.depreciationCycle !== null && ins.depreciationCycle !== undefined ? ins.depreciationCycle : '');
    setNewAdjustmentFactor(ins.adjustmentFactor !== null && ins.adjustmentFactor !== undefined ? ins.adjustmentFactor : '');
    setNewWarehouseId(ins.warehouseId !== null && ins.warehouseId !== undefined ? ins.warehouseId : '');
    
    // Bind specifications
    if (ins.specification) {
      const specsArray = Object.entries(ins.specification).map(([k, v]) => ({
        key: k,
        value: String(v)
      }));
      setNewSpecifications(specsArray);
    } else {
      setNewSpecifications([]);
    }
    
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
        // Convert dynamic specs array back to key-value object
        const specObject: Record<string, any> = {};
        newSpecifications.forEach(item => {
          if (item.key.trim()) {
            specObject[item.key.trim()] = item.value;
          }
        });

        // PUT /api/v1/assets/instance/{id}
        await api.put(`/api/v1/assets/instance/${editingInstance.id}`, {
          assetModelId: Number(newModelId),
          serial: newSerial,
          purchaseDate: newPurchaseDate,
          purchasePrice: Number(newPurchasePrice),
          status: newStatus,
          depreciationMethod: newDepreciationMethod,
          netBookValue: newNetBookValue === '' ? null : Number(newNetBookValue),
          salvageValue: newSalvageValue === '' ? null : Number(newSalvageValue),
          depreciationRate: newDepreciationRate === '' ? null : Number(newDepreciationRate),
          depreciationCycle: newDepreciationCycle === '' ? null : Number(newDepreciationCycle),
          adjustmentFactor: newAdjustmentFactor === '' ? null : Number(newAdjustmentFactor),
          maintenanceCost: newMaintenanceCost === '' ? null : Number(newMaintenanceCost),
          warehouseId: newWarehouseId === '' ? null : Number(newWarehouseId),
          specification: specObject
        });
        toast.showSuccess('Cập nhật thiết bị thành công!');
      } else {
        // POST /api/v1/assets/instance
        await api.post('/api/v1/assets/instance', {
          assetModelId: Number(newModelId),
          serial: newSerial,
          purchaseDate: newPurchaseDate,
          purchasePrice: Number(newPurchasePrice),
          depreciationMethod: newDepreciationMethod,
          netBookValue: newNetBookValue === '' ? null : Number(newNetBookValue),
          salvageValue: newSalvageValue === '' ? null : Number(newSalvageValue),
          depreciationRate: newDepreciationRate === '' ? null : Number(newDepreciationRate),
          depreciationCycle: newDepreciationCycle === '' ? null : Number(newDepreciationCycle),
          adjustmentFactor: newAdjustmentFactor === '' ? null : Number(newAdjustmentFactor),
          maintenanceCost: newMaintenanceCost === '' ? null : Number(newMaintenanceCost),
          warehouseId: newWarehouseId === '' ? null : Number(newWarehouseId)
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

  const getStatusDetails = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'UNKNOWN';
    switch (status) {
      case 'AVAILABLE':
      case 'ACTIVE':
        return { label: 'Sẵn sàng', css: 'active' };
      case 'PENDING':
        return { label: 'Chờ duyệt', css: 'pending' };
      case 'APPROVED':
        return { label: 'Chờ giao', css: 'pending' };
      case 'USING':
        return { label: 'Đang sử dụng', css: 'active' };
      case 'MAINTENANCE':
        return { label: 'Bảo trì', css: 'inactive' };
      case 'LIQUIDATED':
        return { label: 'Đã thanh lý', css: 'inactive' };
      default:
        return { label: status, css: 'inactive' };
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const status = statusStr ? statusStr.toUpperCase() : 'PENDING';
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
          <p className="page-subtitle">Xem chi tiết từng thiết bị phần cứng cụ thể, số Serial, tình trạng sử dụng và truy cứu lịch sử cấp phát của thiết bị.</p>
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
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val) {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('search');
                  window.history.replaceState({}, '', url.pathname + url.search);
                  setPage(0);
                  fetchInstances();
                }
              }}
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
            <option value="USING">Đang sử dụng (Using)</option>
            <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
            <option value="LIQUIDATED">Đã thanh lý (Liquidated)</option>
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
            <div className="dashboard-table-wrapper">
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
                    <th>Kho chứa</th>
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
                    <th>Nâng cấp/Bảo trì</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstances.map((ins) => {
                    const statusDetail = getStatusDetails(ins.status);
                    return (
                      <tr key={ins.id}>
                        <td data-label="Mã số" className="text-nowrap" style={{ fontFamily: 'monospace' }}>#{ins.id}</td>
                        <td data-label="Số Serial" className="text-nowrap">
                          <div style={{ fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-primary)', display: 'inline-flex' }} className="header-sort-content">
                            <HardDrive size={14} style={{ color: 'var(--primary-color)' }} />
                            {ins.serial}
                          </div>
                        </td>
                        <td data-label="Dòng máy (Model)" style={{ fontWeight: 600 }}>{ins.assetModelName}</td>
                        <td data-label="Loại thiết bị" className="text-nowrap">{ins.assetTypeName}</td>
                        <td data-label="Kho chứa" className="text-nowrap">
                          {ins.warehouseName ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                              <Warehouse size={13} style={{ color: 'var(--text-secondary)' }} />
                              {ins.warehouseName}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontStyle: 'italic' }}>Chưa gán kho</span>
                          )}
                        </td>
                        <td data-label="Trạng thái" className="text-nowrap">
                          <span className={`status-badge ${statusDetail.css}`}>
                            {statusDetail.label}
                          </span>
                        </td>
                        <td data-label="Ngày mua" className="text-nowrap">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
                            {ins.purchaseDate ? new Date(ins.purchaseDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                          </span>
                        </td>
                        <td data-label="Đơn giá mua" className="text-nowrap">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--primary-color)' }}>
                            {formatPrice(ins.purchasePrice)}
                          </span>
                        </td>
                        <td data-label="Nâng cấp/Bảo trì" className="text-nowrap">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: ins.maintenanceCost ? '#d97706' : 'var(--text-secondary)' }}>
                            <Wrench size={13} />
                            {ins.maintenanceCost ? formatPrice(ins.maintenanceCost) : '-'}
                          </span>
                        </td>
                        <td data-label="Thao tác" className="text-nowrap" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--primary-color)', borderColor: 'rgba(227, 6, 19, 0.2)', padding: '5px 8px' }}
                              onClick={() => handleOpenDetailModal(ins)}
                              title="Xem chi tiết thiết bị"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: 'var(--primary-color)', borderColor: 'rgba(227, 6, 19, 0.2)', padding: '5px 8px' }}
                              onClick={() => handleOpenHistoryModal(ins)}
                              title="Xem lịch sử cấp phát"
                            >
                              <History size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-outline-sm"
                              style={{ color: '#0284c7', borderColor: 'rgba(2, 132, 199, 0.2)', padding: '5px 8px' }}
                              onClick={() => handleOpenQrModal(ins)}
                              title="Sinh mã QR"
                            >
                              <QrCode size={14} />
                            </button>
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

      {/* Allocation History Modal */}
      {isHistoryOpen && selectedInstance && createPortal(
        <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} style={{ color: 'var(--primary-color)' }} />
                Lịch sử cấp phát thiết bị Serial: {selectedInstance.serial}
              </h2>
              <button type="button" className="btn-outline-sm" onClick={() => setIsHistoryOpen(false)}>Đóng</button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto', width: '25px', height: '25px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)' }}></div>
                <span>Đang tải lịch sử cấp phát...</span>
              </div>
            ) : historyList.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Thiết bị này chưa từng được yêu cầu hoặc cấp phát cho bất kỳ nhân sự nào.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Mã số</th>
                      <th>Nhân sự sử dụng</th>
                      <th>Ngày yêu cầu</th>
                      <th>Trạng thái</th>
                      <th>Ngày nhận bàn giao</th>
                      <th>Ngày thu hồi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item) => (
                      <tr key={item.id}>
                        <td data-label="Mã số" style={{ fontFamily: 'monospace' }}>#{item.id}</td>
                        <td data-label="Nhân sự sử dụng" style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} style={{ color: 'var(--text-secondary)' }} />
                            {item.staffName}
                          </div>
                        </td>
                        <td data-label="Ngày yêu cầu" style={{ fontSize: '13px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
                            {new Date(item.requestAt).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td data-label="Trạng thái">{getStatusBadge(item.status)}</td>
                        <td data-label="Ngày nhận bàn giao" style={{ fontSize: '13px' }}>
                          {item.receivedAt ? (
                            <span style={{ color: 'var(--success)' }}>{new Date(item.receivedAt).toLocaleDateString('vi-VN')}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td data-label="Ngày thu hồi" style={{ fontSize: '13px' }}>
                          {item.returnedAt ? (
                            <span style={{ color: 'var(--text-secondary)' }}>{new Date(item.returnedAt).toLocaleDateString('vi-VN')}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Device Details Modal */}
      {isDetailOpen && createPortal(
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, padding: '16px' }} onClick={() => setIsDetailOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '800px', width: '100%', backgroundColor: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <HardDrive size={20} style={{ color: 'var(--primary-color)' }} />
                Thông tin chi tiết thiết bị {selectedAssetDetail ? `#${selectedAssetDetail.id}` : ''}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedAssetDetail && (
                  <button 
                    type="button" 
                    className="btn-primary-sm" 
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenEditModal(selectedAssetDetail);
                    }}
                    style={{ padding: '6px 16px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Pencil size={13} /> Chỉnh sửa
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn-outline-sm" 
                  onClick={() => setIsDetailOpen(false)}
                  style={{ padding: '6px 16px', borderRadius: '50px', cursor: 'pointer' }}
                >
                  Đóng
                </button>
              </div>
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
            ) : selectedAssetDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* 2-Column Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  
                  {/* Column 1: General & Purchase Info */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông tin chung
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Dòng máy:</span>
                          <strong style={{ textAlign: 'right' }}>{selectedAssetDetail.assetModelName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Mã dòng máy:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{selectedModelDetail?.code || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Hãng sản xuất:</span>
                          <strong>{selectedModelDetail?.manufacturer || '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Loại thiết bị:</span>
                          <span>{selectedAssetDetail.assetTypeName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Số Serial:</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-color)' }}>{selectedAssetDetail.serial}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Trạng thái:</span>
                          <span className={`status-badge ${getStatusDetails(selectedAssetDetail.status).css}`} style={{ margin: 0 }}>
                            {getStatusDetails(selectedAssetDetail.status).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông tin mua sắm
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Ngày mua:</span>
                          <span>{selectedAssetDetail.purchaseDate ? new Date(selectedAssetDetail.purchaseDate).toLocaleDateString('vi-VN') : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Giá trị ban đầu:</span>
                          <strong>{selectedAssetDetail.purchasePrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAssetDetail.purchasePrice) : '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Chi phí nâng cấp/bảo trì:</span>
                          <strong>{selectedAssetDetail.maintenanceCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAssetDetail.maintenanceCost) : '-'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)' }}>MÃ QR THIẾT BỊ</div>
                      <QRCodeSVG
                        id={`qr-admin-detail-${selectedAssetDetail.serial}`}
                        value={`${appBaseUrl}/qr-scan/${selectedAssetDetail.serial}`}
                        size={120}
                        includeMargin={true}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Quét để truy cập nhanh từ điện thoại</div>
                    </div>
                  </div>

                  {/* Column 2: Specs & Depreciation */}
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Khấu hao thiết bị
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Phương pháp khấu hao:</span>
                          <span>
                            {selectedAssetDetail.depreciationMethod === 'STRAIGHT_LINE' ? 'Khấu hao đường thẳng' :
                             selectedAssetDetail.depreciationMethod === 'DECLINING_BALANCE' ? 'Số dư giảm dần' :
                             selectedAssetDetail.depreciationMethod === 'UNITS_OF_PRODUCTION' ? 'Theo sản lượng' :
                             selectedAssetDetail.depreciationMethod === 'LICENSE_KEY' ? 'Khấu hao Key bản quyền' :
                             selectedAssetDetail.depreciationMethod || 'Khấu hao đường thẳng'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Giá trị còn lại:</span>
                          <strong style={{ color: 'var(--success)' }}>{selectedAssetDetail.netBookValue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAssetDetail.netBookValue) : '-'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Giá trị thu hồi:</span>
                          <span>{selectedAssetDetail.salvageValue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedAssetDetail.salvageValue) : '-'}</span>
                        </div>
                        {selectedAssetDetail.depreciationMethod === 'DECLINING_BALANCE' && selectedAssetDetail.depreciationRate !== null && selectedAssetDetail.depreciationRate !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Tỷ lệ khấu hao:</span>
                            <span>{selectedAssetDetail.depreciationRate}% / tháng</span>
                          </div>
                        )}
                        {selectedAssetDetail.depreciationCycle !== null && selectedAssetDetail.depreciationCycle !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Chu kỳ khấu hao:</span>
                            <span>{selectedAssetDetail.depreciationCycle} tháng</span>
                          </div>
                        )}
                        {selectedAssetDetail.depreciationMethod === 'DECLINING_BALANCE' && selectedAssetDetail.adjustmentFactor !== null && selectedAssetDetail.adjustmentFactor !== undefined && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Hệ số điều chỉnh:</span>
                            <span>{selectedAssetDetail.adjustmentFactor}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', color: 'var(--primary-color)', marginTop: 0 }}>
                        Thông số kỹ thuật
                      </h3>
                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* Specifications from Model */}
                        {selectedModelDetail?.specification && Object.keys(selectedModelDetail.specification).length > 0 && (
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số từ hãng:</div>
                            {Object.entries(selectedModelDetail.specification).map(([key, val]) => (
                              <div key={`model-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                                <span style={{ fontWeight: 600 }}>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Specifications from Instance */}
                        {selectedAssetDetail.specification && Object.keys(selectedAssetDetail.specification).length > 0 ? (
                          <div style={{ marginTop: selectedModelDetail?.specification ? '10px' : 0 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '12px' }}>Thông số riêng thiết bị:</div>
                            {Object.entries(selectedAssetDetail.specification).map(([key, val]) => (
                              <div key={`instance-${key}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--border-color)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                                <span style={{ fontWeight: 600 }}>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          (!selectedModelDetail?.specification || Object.keys(selectedModelDetail.specification).length === 0) && (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>Không có thông số kỹ thuật.</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit Instance Modal */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, padding: '16px' }} onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: editingInstance ? '850px' : '580px', width: '100%', backgroundColor: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
              {editingInstance ? `Chỉnh sửa thiết bị cụ thể: Serial ${editingInstance.serial}` : 'Thêm thiết bị cụ thể mới'}
            </h2>
            
            {modalError && (
              <div style={{ color: 'var(--error)', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '13px', marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              {editingInstance ? (
                /* 2-Column layout for Edit Mode */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* Left Column: Basic Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)', margin: 0, paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                      Thông tin cơ bản
                    </h3>
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
                        style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
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
                        style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
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
                        style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                        placeholder="Ví dụ: 15000000"
                        value={newPurchasePrice}
                        onChange={(e) => setNewPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={submitting}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Số tiền nâng cấp/bảo trì (VND)</label>
                      <input 
                        type="number" 
                        className="search-input" 
                        style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                        placeholder="Ví dụ: 2000000"
                        value={newMaintenanceCost}
                        onChange={(e) => setNewMaintenanceCost(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={submitting}
                      />
                    </div>

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
                        <option value="USING">Đang sử dụng (Using)</option>
                        <option value="MAINTENANCE">Đang bảo trì (Maintenance)</option>
                        <option value="LIQUIDATED">Đã thanh lý (Liquidated)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Kho chứa (Warehouse)</label>
                      <select
                        className="select-filter"
                        style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                        value={newWarehouseId}
                        onChange={(e) => setNewWarehouseId(e.target.value === '' ? '' : Number(e.target.value))}
                        disabled={submitting}
                      >
                        <option value="">-- Chưa gán kho --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Depreciation & Specifications */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)', margin: 0, paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
                      Khấu hao & Thông số riêng
                    </h3>
                    
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Phương pháp khấu hao</label>
                      <select
                        className="select-filter"
                        style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                        value={newDepreciationMethod}
                        onChange={(e) => setNewDepreciationMethod(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="STRAIGHT_LINE">Đường thẳng (Straight Line)</option>
                        <option value="DECLINING_BALANCE">Số dư giảm dần (Declining Balance)</option>
                        <option value="UNITS_OF_PRODUCTION">Sản lượng (Units of Production)</option>
                        <option value="LICENSE_KEY">Khấu hao Key bản quyền (License Key)</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Giá trị còn lại (VND)</label>
                        <input 
                          type="number" 
                          className="search-input" 
                          style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                          placeholder="Ví dụ: 12000000"
                          value={newNetBookValue}
                          onChange={(e) => setNewNetBookValue(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Giá trị thu hồi (VND)</label>
                        <input 
                          type="number" 
                          className="search-input" 
                          style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                          placeholder="Ví dụ: 2000000"
                          value={newSalvageValue}
                          onChange={(e) => setNewSalvageValue(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: newDepreciationMethod === 'DECLINING_BALANCE' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                      {newDepreciationMethod === 'DECLINING_BALANCE' && (
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tỷ lệ KH (%)</label>
                          <input 
                            type="number" 
                            step="any"
                            className="search-input" 
                            style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                            placeholder="VD: 10"
                            value={newDepreciationRate}
                            onChange={(e) => setNewDepreciationRate(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={submitting}
                          />
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Chu kỳ KH (tháng)</label>
                        <input 
                          type="number" 
                          className="search-input" 
                          style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                          placeholder="VD: 36"
                          value={newDepreciationCycle}
                          onChange={(e) => setNewDepreciationCycle(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Hệ số đ.chỉnh</label>
                        <input 
                          type="number" 
                          step="any"
                          className="search-input" 
                          style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                          placeholder="VD: 1.5"
                          value={newAdjustmentFactor}
                          onChange={(e) => setNewAdjustmentFactor(e.target.value === '' ? '' : Number(e.target.value))}
                          disabled={submitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Thông số kỹ thuật riêng</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fafafa', marginBottom: '8px' }}>
                        {newSpecifications.length === 0 ? (
                          <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', textAlign: 'center' }}>
                            Chưa có thông số riêng. Nhấn nút bên dưới để thêm.
                          </div>
                        ) : (
                          newSpecifications.map((spec, index) => (
                            <div key={index} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="search-input"
                                style={{ flex: 1, padding: '5px 10px', fontSize: '13px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                                placeholder="Tên (VD: RAM)"
                                value={spec.key}
                                onChange={(e) => {
                                  const updated = [...newSpecifications];
                                  updated[index].key = e.target.value;
                                  setNewSpecifications(updated);
                                }}
                                disabled={submitting}
                                required
                              />
                              <input
                                type="text"
                                className="search-input"
                                style={{ flex: 1, padding: '5px 10px', fontSize: '13px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                                placeholder="Trị (VD: 16GB)"
                                value={spec.value}
                                onChange={(e) => {
                                  const updated = [...newSpecifications];
                                  updated[index].value = e.target.value;
                                  setNewSpecifications(updated);
                                }}
                                disabled={submitting}
                                required
                              />
                              <button
                                type="button"
                                className="btn-outline-sm"
                                style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', padding: '5px 8px', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
                                onClick={() => {
                                  setNewSpecifications(newSpecifications.filter((_, idx) => idx !== index));
                                }}
                                title="Xóa thông số này"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        style={{ width: '100%', padding: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderRadius: '50px', cursor: 'pointer' }}
                        onClick={() => setNewSpecifications([...newSpecifications, { key: '', value: '' }])}
                        disabled={submitting}
                      >
                        + Thêm thông số mới
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* Simple Column layout for Add Mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
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
                      style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
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
                      style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
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
                      style={{ paddingLeft: '16px', backgroundColor: '#fff', borderColor: 'var(--border-color)', margin: 0 }}
                      placeholder="Ví dụ: 15000000"
                      value={newPurchasePrice}
                      onChange={(e) => setNewPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Kho chứa (Warehouse)</label>
                    <select
                      className="select-filter"
                      style={{ width: '100%', backgroundColor: '#fff', borderColor: 'var(--border-color)', borderRadius: '50px' }}
                      value={newWarehouseId}
                      onChange={(e) => setNewWarehouseId(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={submitting}
                    >
                      <option value="">-- Chọn Kho chứa --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
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

      {/* QR Code Generator Modal */}
      {isQrModalOpen && qrInstance && createPortal(
        <div className="modal-overlay" onClick={() => setIsQrModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <QrCode size={20} style={{ color: '#0284c7' }} />
                Mã QR thiết bị
              </h2>
              <button type="button" className="btn-outline-sm" onClick={() => setIsQrModalOpen(false)}>Đóng</button>
            </div>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <QRCodeSVG
                id={`qr-${qrInstance.serial}`}
                value={`${appBaseUrl}/qr-scan/${qrInstance.serial}`}
                size={200}
                includeMargin={true}
              />
            </div>
            
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Dòng máy: <strong style={{ color: 'var(--text-primary)' }}>{qrInstance.assetModelName}</strong></p>
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Loại: <strong style={{ color: 'var(--text-primary)' }}>{qrInstance.assetTypeName}</strong></p>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-secondary)' }}>Số Serial: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{qrInstance.serial}</code></p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={downloadQrCode}
                style={{ padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '13px' }}
              >
                Tải ảnh PNG
              </button>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={printQrCode}
                style={{ padding: '8px 16px', borderRadius: '50px', cursor: 'pointer', fontSize: '13px' }}
              >
                In mã QR
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AssetInstanceManagement;
