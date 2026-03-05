import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Timeline from './components/Timeline';
import Editor from './components/Editor';
import { loadSchedule, saveSchedule, getCurrentDateStr } from './store';
import { format } from 'date-fns';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, 'yyyy-MM-dd');

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

  // Save data logic (debounced auto-save or explicit save on updates)
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

  return (
    <div className="app-layout">
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />
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
    </div>
  );
}

export default App;
