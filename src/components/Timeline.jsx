import React, { useRef, useEffect, useState } from 'react';
import './Timeline.css';
import TimeBlock from './TimeBlock';
import { createTimeBlock, CATEGORY_PRESETS, getDailyStats } from '../store';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const SCROLL_H = 60; // 60px per hour
const TOTAL_MINUTES = 24 * 60;

const Timeline = ({ dateStr, blocks, onUpdateBlocks, selectedBlockId, onSelectBlock }) => {
    const timelineRef = useRef(null);
    const [currentTimePos, setCurrentTimePos] = useState(0);
    const [showCategoryPicker, setShowCategoryPicker] = useState(null); // { x, y, startStr, endStr }

    // Update current time line position
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            setCurrentTimePos((minutes / TOTAL_MINUTES) * (24 * SCROLL_H));
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to current time on mount
    useEffect(() => {
        if (timelineRef.current) {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            const scrollPos = ((minutes / TOTAL_MINUTES) * (24 * SCROLL_H)) - 200;
            timelineRef.current.scrollTop = Math.max(0, scrollPos);
        }
    }, [dateStr]);

    const [createPreview, setCreatePreview] = useState(null); // { startY, endY, isDragging }

    const handleTimelineMouseDown = (e) => {
        // Stop going further if not clicking directly on grid
        if (e.target.closest('.time-block') || e.target.closest('.picker-overlay')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        let y = e.clientY - rect.top;
        if (y < 0) y = 0;

        const minutesClicked = (y / (24 * SCROLL_H)) * TOTAL_MINUTES;
        const snappedMinutes = Math.floor(minutesClicked / 30) * 30;
        const snappedY = (snappedMinutes / TOTAL_MINUTES) * (24 * SCROLL_H);

        setCreatePreview({
            startY: snappedY,
            endY: snappedY + (SCROLL_H / 2), // default 30 mins
            isDragging: true
        });

        const handleMouseMove = (moveEvent) => {
            let moveY = moveEvent.clientY - rect.top;
            if (moveY < 0) moveY = 0;

            const moveMinutes = (moveY / (24 * SCROLL_H)) * TOTAL_MINUTES;
            // Snap the end time to 30 min increments too, ensuring it's at least 30 mins after start
            let moveSnapped = Math.ceil(moveMinutes / 30) * 30;
            if (moveSnapped <= snappedMinutes) moveSnapped = snappedMinutes + 30;

            const moveSnappedY = (moveSnapped / TOTAL_MINUTES) * (24 * SCROLL_H);

            setCreatePreview(prev => ({
                ...prev,
                endY: moveSnappedY
            }));
        };

        const handleMouseUp = (upEvent) => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            setCreatePreview(prev => {
                const finalStartY = prev.startY;
                const finalEndY = prev.endY;

                const startMins = Math.round((finalStartY / (24 * SCROLL_H)) * TOTAL_MINUTES);
                const endMins = Math.round((finalEndY / (24 * SCROLL_H)) * TOTAL_MINUTES);

                const startStr = `${String(Math.floor(startMins / 60)).padStart(2, '0')}:${String(startMins % 60).padStart(2, '0')}`;
                const endStr = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

                setShowCategoryPicker({
                    x: upEvent.clientX,
                    y: upEvent.clientY,
                    startStr,
                    endStr
                });

                return null;
            });
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleCategorySelect = (preset) => {
        if (!showCategoryPicker) return;
        const newBlock = createTimeBlock(
            showCategoryPicker.startStr,
            showCategoryPicker.endStr,
            preset.name,
            preset
        );
        onUpdateBlocks([...blocks, newBlock]);
        onSelectBlock(newBlock.id);
        setShowCategoryPicker(null);
    };

    const handleUpdateBlock = (id, updates) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
        onUpdateBlocks(newBlocks);
    };

    const handleDeleteBlock = (id) => {
        const newBlocks = blocks.filter(b => b.id !== id);
        onUpdateBlocks(newBlocks);
        if (selectedBlockId === id) {
            onSelectBlock(null);
        }
    };

    const timeToY = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return ((h * 60 + m) / TOTAL_MINUTES) * (24 * SCROLL_H);
    };

    // Daily stats for summary bar
    const stats = getDailyStats(blocks);

    return (
        <div className="timeline-container">
            {/* Daily Summary Bar */}
            <div className="daily-summary">
                <div className="summary-header">
                    <span className="summary-label">오늘의 요약</span>
                    <span className="summary-count">{stats.totalBlocks}개 블록 · {Math.floor(stats.totalMinutes / 60)}시간 {stats.totalMinutes % 60}분</span>
                </div>
                {stats.categoryBreakdown.length > 0 && (
                    <div className="summary-bar">
                        {stats.categoryBreakdown.map((cat, i) => (
                            <div
                                key={i}
                                className="summary-segment"
                                style={{
                                    backgroundColor: cat.color,
                                    width: `${(cat.minutes / stats.totalMinutes) * 100}%`
                                }}
                                title={`${cat.name}: ${Math.floor(cat.minutes / 60)}h ${cat.minutes % 60}m`}
                            />
                        ))}
                    </div>
                )}
                {stats.categoryBreakdown.length > 0 && (
                    <div className="summary-legend">
                        {stats.categoryBreakdown.map((cat, i) => (
                            <span key={i} className="legend-item">
                                <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                                {cat.name} {Math.floor(cat.minutes / 60)}h{cat.minutes % 60 > 0 ? ` ${cat.minutes % 60}m` : ''}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="timeline-scroll-area" ref={timelineRef}>
                <div className="timeline-labels">
                    {HOURS.map(h => (
                        <div key={h} className="time-label" style={{ height: `${SCROLL_H}px` }}>
                            {`${String(h).padStart(2, '0')}:00`}
                        </div>
                    ))}
                </div>

                <div
                    className="timeline-content-wrapper"
                >
                    <div
                        className="timeline-grid"
                        style={{ height: `${24 * SCROLL_H}px` }}
                        onMouseDown={handleTimelineMouseDown}
                    >
                        {Array.from({ length: 48 }).map((_, i) => (
                            <div
                                key={i}
                                className={`grid-line ${i % 2 === 0 ? 'hour-line' : 'half-hour-line'}`}
                                style={{ top: `${(i * SCROLL_H) / 2}px` }}
                            />
                        ))}

                        {/* Drag to create preview */}
                        {createPreview && (
                            <div
                                className="time-block"
                                style={{
                                    top: `${createPreview.startY}px`,
                                    height: `${createPreview.endY - createPreview.startY}px`,
                                    backgroundColor: 'rgba(59, 130, 246, 0.3)',
                                    border: '1px dashed #3b82f6',
                                    zIndex: 10,
                                    pointerEvents: 'none'
                                }}
                            >
                            </div>
                        )}

                        <div
                            className="current-time-line"
                            style={{ top: `${currentTimePos}px` }}
                        >
                            <div className="current-time-dot"></div>
                        </div>

                        {blocks.map(block => {
                            const top = timeToY(block.startTime);
                            const bottom = timeToY(block.endTime);
                            const height = bottom - top;

                            return (
                                <TimeBlock
                                    key={block.id}
                                    block={block}
                                    top={top}
                                    height={height}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={() => onSelectBlock(block.id)}
                                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                                    onDelete={() => handleDeleteBlock(block.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Category Picker Popup */}
            {showCategoryPicker && (
                <>
                    <div className="picker-overlay" onClick={() => setShowCategoryPicker(null)} />
                    <div
                        className="category-picker"
                        style={{
                            top: `${Math.min(showCategoryPicker.y, window.innerHeight - 320)}px`,
                            left: `${showCategoryPicker.x}px`
                        }}
                    >
                        <div className="picker-title">카테고리 선택</div>
                        <div className="picker-time">{showCategoryPicker.startStr} - {showCategoryPicker.endStr}</div>
                        <div className="picker-grid">
                            {CATEGORY_PRESETS.map((preset, i) => (
                                <button
                                    key={i}
                                    className="picker-item"
                                    style={{ borderLeftColor: preset.color }}
                                    onClick={() => handleCategorySelect(preset)}
                                >
                                    <span className="picker-icon">{preset.icon}</span>
                                    <span>{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Timeline;
