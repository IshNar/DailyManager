import React from 'react';
import { 
  Home, 
  Calendar, 
  Inbox, 
  Search, 
  Settings, 
  ChevronRight, 
  Clock, 
  Star,
  BookOpen,
  Layers
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeView, onViewChange }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="avatar">DM</div>
          <span className="username">Daily Manager</span>
        </div>
        <button className="search-btn">
          <Search size={16} />
        </button>
      </div>

      <div className="sidebar-section">
        <div className="section-content">
          <button 
            className={`sidebar-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => onViewChange('home')}
          >
            <Home size={18} />
            <span>홈</span>
          </button>
          <button 
            className={`sidebar-item ${activeView === 'inbox' ? 'active' : ''}`}
            onClick={() => onViewChange('inbox')}
          >
            <Inbox size={18} />
            <span>수신함</span>
          </button>
          <button 
            className={`sidebar-item ${activeView === 'recent' ? 'active' : ''}`}
            onClick={() => onViewChange('recent')}
          >
            <Clock size={18} />
            <span>최근 항목</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">기본 도구</h3>
        <div className="section-content">
          <button 
            className={`sidebar-item ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => onViewChange('calendar')}
          >
            <Calendar size={18} />
            <span>캘린더</span>
          </button>
          <button 
            className={`sidebar-item ${activeView === 'star' ? 'active' : ''}`}
            onClick={() => onViewChange('star')}
          >
            <Star size={18} />
            <span>즐겨찾기</span>
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">워크스페이스</h3>
        <div className="section-content">
          <div 
            className={`workspace-item ${activeView === 'personal' ? 'active' : ''}`}
            onClick={() => onViewChange('personal')}
          >
            <div className="workspace-toggle">
              <ChevronRight size={14} />
            </div>
            <BookOpen size={18} className="workspace-icon" />
            <span>개인 노트</span>
          </div>
          <div 
            className={`workspace-item ${activeView === 'project' ? 'active' : ''}`}
            onClick={() => onViewChange('project')}
          >
            <div className="workspace-toggle">
              <ChevronRight size={14} />
            </div>
            <Layers size={18} className="workspace-icon" />
            <span>프로젝트 관리</span>
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <button 
          className={`sidebar-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <Settings size={18} />
          <span>설정</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
