import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Timeline from './components/Timeline';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import InboxView from './components/InboxView';
import { loadSchedule, saveSchedule, getCurrentDateStr } from './store';
import { format } from 'date-fns';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const [activeView, setActiveView] = useState('home');

  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // Load data when date changes
  useEffect(() => {
    let isMounted = true;
    const fetchBlocks = async () => {
      const dailyBlocks = await loadSchedule(dateStr);
      if (isMounted) {
        setBlocks(dailyBlocks);
        setSelectedBlockId(null);
      }
    };
    fetchBlocks();
    return () => { isMounted = false; };
  }, [dateStr]);

  const handleUpdateBlocks = async (newBlocks) => {
    setBlocks(newBlocks);
    await saveSchedule(dateStr, newBlocks);
  };

  const handleUpdateSingleBlock = async (id, updates) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    setBlocks(newBlocks);
    await saveSchedule(dateStr, newBlocks);
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return (
          <div className="app-main">
            <div className="panel-left">
              <Timeline
                dateStr={dateStr}
                blocks={blocks}
                onUpdateBlocks={handleUpdateBlocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
              />
            </div>
            <div className="panel-right">
              <Editor
                selectedBlock={selectedBlock}
                onUpdateBlock={handleUpdateSingleBlock}
                dateStr={dateStr}
              />
            </div>
          </div>
        );
      case 'calendar':
        return <CalendarView currentDate={currentDate} onDateChange={(date) => { setCurrentDate(date); setActiveView('home'); }} />;
      case 'inbox':
        return <InboxView />;
      case 'settings':
        return <div className="placeholder-view"><h2>설정</h2><p>애플리케이션 설정을 준비 중입니다.</p></div>;
      default:
        return <div className="placeholder-view"><h2>{activeView}</h2><p>해당 기능을 준비 중입니다.</p></div>;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView} 
      />
      <div className="app-content">
        <Header
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
