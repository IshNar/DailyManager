import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import './CalendarView.css';

const CalendarView = ({ currentDate, onDateChange }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="calendar-view-container">
      <div className="calendar-header">
        <h2>{format(currentDate, 'yyyy년 MMMM', { locale: ko })}</h2>
      </div>
      <div className="calendar-grid">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
        {days.map(day => (
          <div 
            key={day.toString()} 
            className={`calendar-day ${!isSameMonth(day, monthStart) ? 'outside' : ''} ${isSameDay(day, new Date()) ? 'today' : ''} ${isSameDay(day, currentDate) ? 'selected' : ''}`}
            onClick={() => onDateChange(day)}
          >
            <span className="day-number">{format(day, 'd')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
