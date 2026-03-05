import React, { useState, useRef, useEffect } from 'react';
import './TimeBlock.css';

const TOTAL_MINUTES = 24 * 60;
const SCROLL_H = 60;

// Helper to calculate time string from Y position
const yToTime = (y) => {
  let minutes = Math.round((y / (24 * SCROLL_H)) * TOTAL_MINUTES);
  if (minutes < 0) minutes = 0;
  if (minutes > TOTAL_MINUTES) minutes = TOTAL_MINUTES;

  // Snap to 5 minutes
  minutes = Math.round(minutes / 5) * 5;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  // Handle 24:00 edge case
  if (h === 24) return '23:59';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const TimeBlock = ({ block, top, height, isSelected, onSelect, onUpdate, onDelete }) => {
  const blockRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(block.title);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      document.getElementById(`title-input-${block.id}`)?.focus();
    }
  }, [isEditingTitle, block.id]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onUpdate({ title: tempTitle });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleSubmit();
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTempTitle(block.title);
    }
  };

  // Drag to move block
  const handleDragStart = (e) => {
    if (isEditingTitle) return;
    e.stopPropagation();
    setIsDragging(true);
    onSelect();

    const startY = e.clientY;
    const initialTop = top;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let newTop = initialTop + deltaY;
      if (newTop < 0) newTop = 0;

      const newStartTimeStr = yToTime(newTop);
      const newEndTimeStr = yToTime(newTop + height);

      onUpdate({
        startTime: newStartTimeStr,
        endTime: newEndTimeStr
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag bottom to resize block
  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);

    const startY = e.clientY;
    const initialHeight = height;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      let newHeight = initialHeight + deltaY;
      if (newHeight < 15) newHeight = 15; // Minimum 15 mins block height approx

      const newEndTimeStr = yToTime(top + newHeight);
      onUpdate({ endTime: newEndTimeStr });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={blockRef}
      className={`time-block ${isSelected ? 'selected' : ''} ${isDragging || isResizing ? 'interacting' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: block.color || '#2a2a2a',
        borderLeftColor: block.color ? adjustColor(block.color, 40) : '#0072FF'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isSelected) onSelect();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        // optionally show right click menu; for now delete on alt+click or right click?
        // Let's implement delete button instead
      }}
    >
      <div
        className="block-drag-handle"
        onMouseDown={handleDragStart}
      >
        <div className="block-time">
          {block.startTime}
        </div>
      </div>

      <div className="block-content">
        {isEditingTitle ? (
          <input
            id={`title-input-${block.id}`}
            type="text"
            className="block-title-input"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div
            className="block-title"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
          >
            {block.title || <span className="untitled-text">Untitled</span>}
          </div>
        )}
      </div>

      {isSelected && (
        <button
          className="btn-delete-block"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete Block"
        >
          ×
        </button>
      )}

      <div
        className="block-resize-handle"
        onMouseDown={handleResizeStart}
      ></div>
    </div>
  );
};

// Quick helper to lighten/darken color for left border
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export default TimeBlock;
