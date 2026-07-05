import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FolderTree, Cpu, HardDrive, RefreshCw, AlertTriangle, Wrench, TrendingUp } from 'lucide-react';
import './Dashboard.css';
import './admin/ManagementTable.css';

interface DepreciationAlert {
  assetInstanceId: number;
  serial: string;
  modelName: string;
  status: string;
  purchasePrice: number;
  purchaseDate: string;
  netBookValue: number;
  salvageValue: number;
  cycleMonths: number;
  monthsElapsed: number;
  alertType: 'FULLY_DEPRECIATED' | 'UPGRADE_REQUIRED';
  message: string;
}

interface AssetInstanceResponse {
  id: number;
  assetModelName: string;
  assetTypeName: string;
  purchasePrice: number;
  netBookValue: number;
  salvageValue: number;
  status: string;
  purchaseDate: string;
  maintenanceCost?: number;
}

interface UnusedAssetsReport {
  count: number;
  totalNetBookValue: number;
  totalPurchasePrice: number;
  unusedAssets: any[];
}

interface TypeGroup {
  name: string;
  purchasePrice: number;
  netBookValue: number;
}

const COLORS = [
  '#E30613', // Red (Viettel)
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4'  // Cyan
];

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [metrics, setMetrics] = useState({
    departmentsCount: 0,
    modelsCount: 0,
    instancesCount: 0,
  });

  const [alerts, setAlerts] = useState<DepreciationAlert[]>([]);
  const [instances, setInstances] = useState<AssetInstanceResponse[]>([]);
  const [unusedReport, setUnusedReport] = useState<UnusedAssetsReport | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query counts from endpoints and alerts concurrently
      const [deptsRes, modelsRes, instancesRes, alertsRes, allInstancesRes, unusedRes] = await Promise.all([
        api.get('/api/v1/department?page=0&size=1'),
        api.get('/api/v1/assets/model?page=0&size=1'),
        api.get('/api/v1/assets/instance?page=0&size=1'),
        api.get('/api/v1/assets/depreciation/alerts'),
        api.get('/api/v1/assets/instance?size=10000'),
        api.get('/api/v1/assets/instance/unused-report')
      ]);

      setMetrics({
        departmentsCount: deptsRes.data?.totalElements || 0,
        modelsCount: modelsRes.data?.totalElements || 0,
        instancesCount: instancesRes.data?.totalElements || 0,
      });

      setAlerts(alertsRes.data || []);
      setInstances(allInstancesRes.data?.content || []);
      setUnusedReport(unusedRes.data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard metrics', err);
      setError('Không thể kết nối lấy toàn bộ số liệu thời gian thực. Vui lòng kiểm tra lại kết nối hoặc làm mới.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 1. Calculate values
  const totalPurchasePrice = instances.reduce((acc, ins) => acc + (ins.purchasePrice || 0), 0);
  const totalMaintenanceCost = instances.reduce((acc, ins) => acc + (ins.maintenanceCost || 0), 0);
  const totalNetBookValue = instances.reduce((acc, ins) => {
    const net = ins.netBookValue !== null && ins.netBookValue !== undefined ? ins.netBookValue : (ins.purchasePrice || 0);
    return acc + net;
  }, 0);
  const totalAccumulatedDepreciation = totalPurchasePrice - totalNetBookValue;
  const remainingValuePercent = totalPurchasePrice > 0 ? (totalNetBookValue / totalPurchasePrice) * 100 : 0;

  // 2. Group by type
  const typeGroups: Record<string, TypeGroup> = {};
  instances.forEach(ins => {
    const typeName = ins.assetTypeName || 'Khác';
    if (!typeGroups[typeName]) {
      typeGroups[typeName] = { name: typeName, purchasePrice: 0, netBookValue: 0 };
    }
    const price = ins.purchasePrice || 0;
    const net = ins.netBookValue !== null && ins.netBookValue !== undefined ? ins.netBookValue : price;
    typeGroups[typeName].purchasePrice += price;
    typeGroups[typeName].netBookValue += net;
  });

  const chartData = Object.values(typeGroups).sort((a, b) => b.purchasePrice - a.purchasePrice);

  const fullyDepreciatedCount = alerts.filter(a => a.alertType === 'FULLY_DEPRECIATED').length;
  const upgradeRequiredCount = alerts.filter(a => a.alertType === 'UPGRADE_REQUIRED').length;

  // 3. Asset status statistics for Stock vs In-use ratio
  const availableCount = instances.filter(ins => ins.status === 'AVAILABLE').length;
  const usingCount = instances.filter(ins => ins.status === 'USING').length;
  const pendingCount = instances.filter(ins => ins.status === 'PENDING').length;
  const liquidatedCount = instances.filter(ins => ins.status === 'LIQUIDATED').length;

  // Render Status Donut Chart Segments
  const statusData = [
    { name: 'Đang sử dụng', count: usingCount, color: '#3B82F6' }, // Blue
    { name: 'Tồn kho', count: availableCount, color: '#10B981' }, // Green
    { name: 'Chờ bàn giao', count: pendingCount, color: '#F59E0B' }, // Yellow
    { name: 'Thanh lý', count: liquidatedCount, color: '#94A3B8' } // Gray
  ].filter(s => s.count > 0);

  const totalStatusSum = statusData.reduce((sum, item) => sum + item.count, 0);
  let statusAccumulatedPercent = 0;
  const statusDonutSegments = statusData.map((item) => {
    const percent = totalStatusSum > 0 ? (item.count / totalStatusSum) : 0;
    const strokeDashoffset = -statusAccumulatedPercent * 314.159;
    statusAccumulatedPercent += percent;
    return {
      ...item,
      percent,
      strokeDasharray: `${percent * 314.159} ${314.159 - (percent * 314.159)}`,
      strokeDashoffset
    };
  });

  // 4. Calculate wasteful categories (not used > 3 months) grouped by assetTypeName
  const totalCategoryCounts: Record<string, number> = {};
  instances.forEach(ins => {
    const typeName = ins.assetTypeName || 'Khác';
    totalCategoryCounts[typeName] = (totalCategoryCounts[typeName] || 0) + 1;
  });

  const wastefulCategoriesMap: Record<string, {
    typeName: string;
    idleCount: number;
    totalPurchasePrice: number;
    totalNetBookValue: number;
  }> = {};

  unusedReport?.unusedAssets?.forEach((asset: any) => {
    const typeName = asset.assetTypeName || 'Khác';
    if (!wastefulCategoriesMap[typeName]) {
      wastefulCategoriesMap[typeName] = {
        typeName,
        idleCount: 0,
        totalPurchasePrice: 0,
        totalNetBookValue: 0
      };
    }
    wastefulCategoriesMap[typeName].idleCount += 1;
    wastefulCategoriesMap[typeName].totalPurchasePrice += (asset.purchasePrice || 0);
    const netVal = asset.netBookValue !== null && asset.netBookValue !== undefined ? asset.netBookValue : (asset.purchasePrice || 0);
    wastefulCategoriesMap[typeName].totalNetBookValue += netVal;
  });

  const wastefulCategories = Object.values(wastefulCategoriesMap).map(cat => {
    const totalCount = totalCategoryCounts[cat.typeName] || cat.idleCount;
    const wasteRatio = totalCount > 0 ? (cat.idleCount / totalCount) * 100 : 0;
    
    let recommendation = '';
    let alertLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (wasteRatio >= 30 && cat.idleCount >= 3) {
      recommendation = `Dừng mua mới ${cat.typeName}. Ưu tiên luân chuyển tồn kho nhàn rỗi.`;
      alertLevel = 'HIGH';
    } else if (wasteRatio >= 15 || cat.idleCount >= 2) {
      recommendation = `Rà soát kỹ trước khi mua thêm ${cat.typeName}.`;
      alertLevel = 'MEDIUM';
    } else {
      recommendation = `Ưu tiên sử dụng thiết bị sẵn có trong kho.`;
      alertLevel = 'LOW';
    }

    return {
      ...cat,
      totalCount,
      wasteRatio,
      recommendation,
      alertLevel
    };
  }).sort((a, b) => b.totalPurchasePrice - a.totalPurchasePrice);

  // 5. Render Donut Chart Segments
  const totalCost = chartData.reduce((sum, item) => sum + item.purchasePrice, 0);
  let accumulatedPercent = 0;
  const donutSegments = chartData.map((item, idx) => {
    const percent = totalCost > 0 ? (item.purchasePrice / totalCost) : 0;
    const strokeDashoffset = -accumulatedPercent * 314.159; // radius = 50, circumference = 314.159
    accumulatedPercent += percent;
    return {
      ...item,
      percent,
      strokeDasharray: `${percent * 314.159} ${314.159 - (percent * 314.159)}`,
      strokeDashoffset,
      color: COLORS[idx % COLORS.length]
    };
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="dashboard-title">Hệ thống Quản trị (Admin)</h1>
          <p className="dashboard-subtitle">Xin chào, {user?.fullName || 'Admin'}. Dưới đây là tổng quan giá trị tài sản & cấu hình khấu hao.</p>
        </div>
        <button 
          type="button" 
          className="btn-outline-sm" 
          onClick={fetchDashboardData} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--warning)', fontSize: '13px', backgroundColor: '#fffbeb', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
          {error}
        </div>
      )}

      {/* Financial Overview Block */}
      <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng quan giá trị tài chính tài sản</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>TỔNG NGUYÊN GIÁ</span>
            <strong style={{ fontSize: '22px', color: '#3b82f6' }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPurchasePrice)}
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>GIÁ TRỊ CÒN LẠI</span>
            <strong style={{ fontSize: '22px', color: '#10b981' }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalNetBookValue)}
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>KHẤU HAO LŨY KẾ</span>
            <strong style={{ fontSize: '22px', color: 'var(--primary-color)' }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAccumulatedDepreciation)}
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>CHI PHÍ NÂNG CẤP/BẢO TRÌ</span>
            <strong style={{ fontSize: '22px', color: '#d97706' }}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMaintenanceCost)}
            </strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>TỶ LỆ GIÁ TRỊ CÒN LẠI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
              <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${remainingValuePercent}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round(remainingValuePercent)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Phòng ban</span>
            <span className="metric-value">{loading ? '...' : metrics.departmentsCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-green">
            <FolderTree size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Model Thiết bị</span>
            <span className="metric-value">{loading ? '...' : metrics.modelsCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-orange">
            <Cpu size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label">Tổng Thiết bị</span>
            <span className="metric-value">{loading ? '...' : metrics.instancesCount}</span>
          </div>
          <div className="metric-icon-wrapper accent-purple">
            <HardDrive size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label" style={{ color: 'var(--error)' }}>Hết khấu hao</span>
            <span className="metric-value" style={{ color: 'var(--error)' }}>{loading ? '...' : fullyDepreciatedCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span className="metric-label" style={{ color: '#d97706' }}>Cần bảo dưỡng</span>
            <span className="metric-value" style={{ color: '#d97706' }}>{loading ? '...' : upgradeRequiredCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Wrench size={24} />
          </div>
        </div>
      </div>

      {/* Phân tích Tối ưu hóa Kho & Chi phí mua sắm */}
      <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-color)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} />
            Tối ưu hóa Kho & Chi phí mua sắm
          </h3>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
            Tính tự động dựa trên tần suất cấp phát và thời gian nhàn rỗi trên 3 tháng
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Left Side: Stock vs In-use ratio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>
              Tỷ lệ Tồn kho vs. Đang sử dụng
            </h4>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Đang tải biểu đồ...</div>
            ) : totalStatusSum === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có dữ liệu.</div>
            ) : (
              <div className="donut-container" style={{ justifyContent: 'flex-start', padding: 0, gap: '20px' }}>
                <svg width="140" height="140" viewBox="0 0 160 160" className="donut-chart-svg" style={{ flexShrink: 0 }}>
                  {statusDonutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      className="donut-segment"
                      cx="80"
                      cy="80"
                      r="50"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      transform="rotate(-90 80 80)"
                    />
                  ))}
                  <text x="50%" y="47%" textAnchor="middle" dy=".3em" className="donut-center-text" style={{ fontSize: '10px', fontWeight: 600, fill: 'var(--text-secondary)' }}>TỔNG CỘNG</text>
                  <text x="50%" y="60%" textAnchor="middle" dy=".3em" className="donut-center-text" style={{ fontSize: '14px', fontWeight: 800, fill: 'var(--text-primary)' }}>
                    {totalStatusSum} máy
                  </text>
                </svg>

                <div className="legend-list" style={{ gap: '6px' }}>
                  {statusDonutSegments.map((seg, idx) => (
                    <div key={idx} className="legend-item" style={{ fontSize: '12px' }}>
                      <div className="legend-color" style={{ backgroundColor: seg.color, width: '10px', height: '10px', borderRadius: '2px' }}></div>
                      <span className="legend-name" style={{ fontWeight: 500 }} title={seg.name}>{seg.name}</span>
                      <strong className="legend-value" style={{ color: 'var(--text-primary)' }}>
                        {seg.count} ({Math.round(seg.percent * 100)}%)
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Wasteful Categories Warning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>
              Cảnh báo danh mục thiết bị lãng phí (nhàn rỗi trên 3 tháng)
            </h4>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>Đang tải cảnh báo...</div>
            ) : wastefulCategories.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#059669', backgroundColor: '#ecfdf5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                ✅ <strong>Tối ưu kho tốt:</strong> Không phát hiện danh mục thiết bị tồn kho nhàn rỗi quá hạn.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {wastefulCategories.map((cat, idx) => {
                  const isHigh = cat.alertLevel === 'HIGH';
                  const bg = isHigh ? '#fef2f2' : '#fffbeb';
                  const border = isHigh ? '#fee2e2' : '#fef3c7';
                  const badgeColor = isHigh ? '#e30613' : '#d97706';
                  const badgeBg = isHigh ? '#fdf2f2' : '#fffbeb';
                  const badgeText = isHigh ? 'Lãng phí CAO' : 'Lãng phí TB';

                  return (
                    <div key={idx} style={{ padding: '12px', backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{cat.typeName}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '50px', backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${border}` }}>
                          {badgeText} ({Math.round(cat.wasteRatio)}%)
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tồn nhàn rỗi: <strong>{cat.idleCount} / {cat.totalCount} máy</strong></span>
                        <span>Nguyên giá: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(cat.totalPurchasePrice)}</strong></span>
                      </div>
                      <div style={{ fontSize: '11px', color: isHigh ? '#b91c1c' : '#b45309', fontWeight: 600, borderTop: `1px dashed ${border}`, paddingTop: '6px', marginTop: '2px' }}>
                        💡 {cat.recommendation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="charts-grid">
        {/* Donut Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Phân bổ giá trị theo loại thiết bị</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Đang tải biểu đồ...</div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có dữ liệu giá trị thiết bị.</div>
          ) : (
            <div className="donut-container">
              <svg width="160" height="160" viewBox="0 0 160 160" className="donut-chart-svg">
                {totalCost === 0 ? (
                  <circle cx="80" cy="80" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="18" />
                ) : (
                  donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      className="donut-segment"
                      cx="80"
                      cy="80"
                      r="50"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      transform="rotate(-90 80 80)"
                    />
                  ))
                )}
                <text x="50%" y="47%" textAnchor="middle" dy=".3em" className="donut-center-text" style={{ fontSize: '11px', fontWeight: 600, fill: 'var(--text-secondary)' }}>NGUYÊN GIÁ</text>
                <text x="50%" y="60%" textAnchor="middle" dy=".3em" className="donut-center-text" style={{ fontSize: '13px', fontWeight: 800, fill: 'var(--text-primary)' }}>
                  {totalCost > 1000000000 
                    ? `${(totalCost / 1000000000).toFixed(1)}B` 
                    : totalCost > 1000000 
                      ? `${(totalCost / 1000000).toFixed(0)}M` 
                      : totalCost}
                </text>
              </svg>

              <div className="legend-list">
                {donutSegments.map((seg, idx) => (
                  <div key={idx} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: seg.color }}></div>
                    <span className="legend-name" title={seg.name}>{seg.name}</span>
                    <span className="legend-value">{Math.round(seg.percent * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grouped Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">So sánh Nguyên giá vs Giá trị còn lại</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Đang tải biểu đồ...</div>
          ) : chartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có dữ liệu thiết bị.</div>
          ) : (
            <div className="bar-chart-container">
              {chartData.slice(0, 5).map((item, idx) => {
                const maxVal = Math.max(...chartData.map(d => d.purchasePrice));
                const purchaseWidth = maxVal > 0 ? (item.purchasePrice / maxVal) * 100 : 0;
                const netWidth = maxVal > 0 ? (item.netBookValue / maxVal) * 100 : 0;

                return (
                  <div key={idx} className="bar-row">
                    <div className="bar-label">
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.name}</span>
                      <span>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(item.netBookValue)}
                        {' / '}
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(item.purchasePrice)}
                      </span>
                    </div>
                    {/* Blue bar is cost, Green bar is net book value */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', position: 'relative' }}>
                        <div className="bar-fill-purchase" style={{ width: `${purchaseWidth}%`, height: '100%' }}></div>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', position: 'relative' }}>
                        <div className="bar-fill-net" style={{ width: `${netWidth}%`, height: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Legend for bars */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Nguyên giá</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Giá trị còn lại</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Details Section */}
      <div className="dashboard-content-section" style={{ marginTop: '12px' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Danh sách thiết bị cần chú ý
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Đang tải danh sách cảnh báo...
          </div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '14px' }}>
            Không có thiết bị nào cần chú ý.
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Mã Serial</th>
                  <th>Dòng máy</th>
                  <th>Nguyên giá</th>
                  <th>Giá trị còn lại</th>
                  <th>Thời gian sử dụng</th>
                  <th>Loại cảnh báo</th>
                  <th>Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.assetInstanceId}>
                    <td data-label="Mã Serial" style={{ fontWeight: 600 }}>{alert.serial}</td>
                    <td data-label="Dòng máy">{alert.modelName}</td>
                    <td data-label="Nguyên giá">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(alert.purchasePrice)}
                    </td>
                    <td data-label="Giá trị còn lại" style={{ fontWeight: 600, color: alert.alertType === 'FULLY_DEPRECIATED' ? 'var(--error)' : 'var(--text-primary)' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(alert.netBookValue)}
                    </td>
                    <td data-label="Thời gian sử dụng">
                      {alert.monthsElapsed} / {alert.cycleMonths} tháng
                    </td>
                    <td data-label="Loại cảnh báo">
                      {alert.alertType === 'FULLY_DEPRECIATED' ? (
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                          Hết khấu hao
                        </span>
                      ) : (
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '50px', fontSize: '12px', fontWeight: 600, backgroundColor: '#fffbeb', color: '#d97706' }}>
                          Cần bảo dưỡng
                        </span>
                      )}
                    </td>
                    <td data-label="Nội dung" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{alert.message}</td>
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

export default AdminDashboard;
