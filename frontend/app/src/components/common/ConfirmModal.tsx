import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ alignItems: 'center', display: 'flex', zIndex: 1100 }}>
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '400px', 
          padding: '24px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}
      >
        {/* Warning/Alert Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div 
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              backgroundColor: isDanger ? '#fee2e2' : 'rgba(239, 68, 68, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: isDanger ? '#ef4444' : 'var(--primary-color)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </div>

        <h3 
          style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: 'var(--text-primary)', 
            marginBottom: '10px' 
          }}
        >
          {title}
        </h3>
        
        <p 
          style={{ 
            fontSize: '14px', 
            color: 'var(--text-secondary)', 
            lineHeight: 1.5, 
            marginBottom: '24px' 
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn-outline" 
            style={{ 
              borderRadius: '50px', 
              padding: '8px 20px', 
              fontSize: '14px', 
              fontWeight: 600,
              flex: 1
            }} 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ 
              borderRadius: '50px', 
              padding: '8px 20px', 
              fontSize: '14px', 
              fontWeight: 600, 
              backgroundColor: isDanger ? '#ef4444' : 'var(--primary-color)',
              border: 'none',
              color: '#ffffff',
              justifyContent: 'center',
              flex: 1
            }} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
