import React, { useState } from 'react';
import { Inbox, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import './InboxView.css';

const InboxView = () => {
  const [notes, setNotes] = useState([
    { id: 1, text: '이번 주 주간 보고서 초안 작성하기', completed: false },
    { id: 2, text: '신규 프로젝트 미팅 안건 정리', completed: true },
    { id: 3, text: 'Daily Manager 고도화 기획서 검토', completed: false },
  ]);
  const [inputValue, setValue] = useState('');

  const addNote = () => {
    if (inputValue.trim()) {
      setNotes([{ id: Date.now(), text: inputValue, completed: false }, ...notes]);
      setValue('');
    }
  };

  return (
    <div className="inbox-view-container">
      <div className="inbox-header">
        <div className="inbox-title-group">
          <Inbox size={24} className="inbox-icon" />
          <h2>수신함</h2>
        </div>
        <p className="inbox-desc">빠르게 아이디어를 캡처하고 나중에 정리하세요.</p>
      </div>

      <div className="inbox-input-wrapper">
        <Plus size={18} className="plus-icon" />
        <input 
          type="text" 
          placeholder="새로운 할 일 또는 빠른 아이디어..." 
          value={inputValue}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
      </div>

      <div className="inbox-list">
        {notes.map(note => (
          <div key={note.id} className={`inbox-item ${note.completed ? 'completed' : ''}`}>
            <button className="note-toggle" onClick={() => setNotes(notes.map(n => n.id === note.id ? {...n, completed: !n.completed} : n))}>
              {note.completed ? <CheckCircle2 size={18} color="#3b82f6" /> : <Circle size={18} />}
            </button>
            <span className="note-text">{note.text}</span>
            <button className="note-delete" onClick={() => setNotes(notes.filter(n => n.id !== note.id))}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InboxView;
