import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MoreHorizontal, 
  Star,
  Clock,
  Menu
} from 'lucide-react';
import './Header.css';

const Header = ({ currentDate, onDateChange }) => {
  const dateStrShort = format(currentDate, 'yyyy-MM-dd (EEEE)', { locale: ko });
  const dateStrFull = format(currentDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });

  const goPrev = () => onDateChange(subDays(currentDate, 1));
  const goNext = () => onDateChange(addDays(currentDate, 1));
  const goToday = () => onDateChange(new Date());

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="breadcrumbs">
          <span className="breadcrumb-item">Daily Manager</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">{dateStrShort}</span>
        </div>
      </div>

      <div className="header-center">
        <div className="date-navigation">
          <button className="nav-btn" onClick={goPrev} title="Previous Day">
            <ChevronLeft size={16} />
          </button>
          
          <div className="current-date-wrapper">
            <span className="current-date-display">{dateStrFull}</span>
            <input 
              type="date" 
              className="date-picker-input"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) onDateChange(new Date(e.target.value));
              }}
            />
          </div>

          <button className="nav-btn" onClick={goNext} title="Next Day">
            <ChevronRight size={16} />
          </button>
        </div>
        <button className="btn-today-small" onClick={goToday}>오늘</button>
      </div>

      <div className="header-right">
        <button className="header-action-btn" title="Favorites"><Star size={16} /></button>
        <button className="header-action-btn" title="Recent"><Clock size={16} /></button>
        <button className="header-action-btn" title="Search"><Search size={16} /></button>
        <button className="header-action-btn" title="Settings"><MoreHorizontal size={16} /></button>
      </div>
    </header>
  );
};

export default Header;
