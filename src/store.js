import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const STORAGE_KEY = 'daily_manager_state';

// Category color presets
export const CATEGORY_PRESETS = [
  { name: '업무', color: '#1a73e8', icon: '💼' },
  { name: '회의', color: '#e67c2e', icon: '🗣️' },
  { name: '학습', color: '#0d9488', icon: '📚' },
  { name: '운동', color: '#16a34a', icon: '🏃' },
  { name: '휴식', color: '#7c3aed', icon: '☕' },
  { name: '식사', color: '#dc2626', icon: '🍽️' },
  { name: '개인', color: '#db2777', icon: '🏠' },
  { name: '기타', color: '#525252', icon: '📝' },
];

// Default 30-min block template
export const createTimeBlock = (startTime, endTime, title = '', category = null) => {
  const preset = category || CATEGORY_PRESETS[0];
  return {
    id: uuidv4(),
    title: title || preset.name,
    startTime,
    endTime,
    color: preset.color,
    category: preset.name,
    markdown: ''
  };
};

// Load schedule for a specific date (YYYY-MM-DD)
export const loadSchedule = async (dateStr) => {
  if (window.electronAPI) {
    try {
      const data = await window.electronAPI.loadScheduleMeta();
      return data[dateStr] || [];
    } catch (e) {
      console.error('Failed to load schedule from FS', e);
      return [];
    }
  }

  // Fallback for browser
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return parsed[dateStr] || [];
  } catch (e) {
    console.error('Failed to parse schedule data', e);
    return [];
  }
};

// Save schedule for a specific date
export const saveSchedule = async (dateStr, blocks) => {
  if (window.electronAPI) {
    try {
      const data = await window.electronAPI.loadScheduleMeta();
      data[dateStr] = blocks;
      await window.electronAPI.saveScheduleMeta(data);
      return;
    } catch (e) {
      console.error('Failed to save schedule to FS', e);
      return;
    }
  }

  // Fallback for browser
  const data = localStorage.getItem(STORAGE_KEY);
  let parsed = {};
  if (data) {
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse schedule data for saving', e);
    }
  }
  parsed[dateStr] = blocks;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
};

// Calculate daily statistics
export const getDailyStats = (blocks) => {
  if (!blocks || blocks.length === 0) {
    return { totalBlocks: 0, totalMinutes: 0, categoryBreakdown: [] };
  }

  const categoryMap = {};
  let totalMinutes = 0;

  blocks.forEach(block => {
    const [sh, sm] = block.startTime.split(':').map(Number);
    const [eh, em] = block.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);

    totalMinutes += duration;
    const cat = block.category || '기타';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { name: cat, minutes: 0, color: block.color };
    }
    categoryMap[cat].minutes += duration;
  });

  const categoryBreakdown = Object.values(categoryMap)
    .sort((a, b) => b.minutes - a.minutes);

  return {
    totalBlocks: blocks.length,
    totalMinutes,
    categoryBreakdown
  };
};

export const getCurrentDateStr = () => format(new Date(), 'yyyy-MM-dd');
