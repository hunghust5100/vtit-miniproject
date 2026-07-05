import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Bot, Sparkles, X, Send } from 'lucide-react';
import './ChatbotWidget.css';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Chào bạn! Mình là Trợ lý ảo quản lý tài sản VTIT. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userText = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await api.get('/api/v1/asset-assistant/ask', {
        params: { q: userText }
      });
      const botText = response.data?.answer || 'Xin lỗi bạn, mình chưa nhận được phản hồi từ hệ thống.';
      setMessages(prev => [...prev, { sender: 'bot', text: botText }]);
    } catch (err: any) {
      console.error('Chatbot error', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi bạn, kết nối với máy chủ đang bị gián đoạn. Bạn vui lòng thử lại sau nhé.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-widget-container">
      {/* Toggle Bubble Button */}
      {!isOpen && (
        <button 
          type="button" 
          className="chatbot-bubble-btn" 
          onClick={() => setIsOpen(true)}
          title="Trợ lý ảo VTIT"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window chatbot-fade-in">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <Sparkles size={18} style={{ color: '#fcd34d' }} />
              <div>
                <h3 className="chatbot-header-title">Trợ lý ảo VTIT</h3>
                <p className="chatbot-header-subtitle">Hỗ trợ tra cứu & kiểm kê thông minh</p>
              </div>
            </div>
            <button 
              type="button" 
              className="chatbot-close-btn" 
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="chatbot-messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message ${msg.sender}`}>
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="chatbot-message bot" style={{ padding: '12px 16px' }}>
                <div className="chatbot-loading-dots">
                  <div className="chatbot-loading-dot"></div>
                  <div className="chatbot-loading-dot"></div>
                  <div className="chatbot-loading-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form className="chatbot-input-container" onSubmit={handleSend}>
            <input 
              type="text" 
              className="chatbot-input" 
              placeholder="Nhập câu hỏi của bạn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="chatbot-send-btn" 
              disabled={!inputValue.trim() || loading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
