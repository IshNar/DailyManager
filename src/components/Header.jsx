import React from 'react';
import './Header.css';
import { format, addDays, subDays } from 'date-fns';

const Header = ({ currentDate, onDateChange }) => {
    const formattedDate = format(currentDate, 'yyyy-MM-dd (EEEE)');

    const goPrev = () => onDateChange(subDays(currentDate, 1));
    const goNext = () => onDateChange(addDays(currentDate, 1));
    const goToday = () => onDateChange(new Date());

    return (
        <header className="app-header">
            <div className="header-brand">
                <div className="logo-icon"></div>
                <h1>DailyManager</h1>
            </div>

            <div className="date-navigation">
                <button className="nav-btn" onClick={goPrev} title="Previous Day">
                    ◀
                </button>
                <div className="current-date-wrapper">
                    <input
                        type="date"
                        className="date-picker-input"
                        value={format(currentDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            if (e.target.value) onDateChange(new Date(e.target.value));
                        }}
                        title="Select Date"
                    />
                    <div className="current-date-display">
                        {formattedDate}
                    </div>
                </div>
                <button className="nav-btn" onClick={goNext} title="Next Day">
                    ▶
                </button>
            </div>

            <div className="header-actions">
                <button className="btn-today" onClick={goToday}>
                    Today
                </button>
            </div>
        </header>
    );
};

export default Header;
