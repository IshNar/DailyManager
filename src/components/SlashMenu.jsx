import React, { useState, useEffect, useRef } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Code,
  Quote
} from 'lucide-react';
import './SlashMenu.css';

const COMMANDS = [
  { id: 'text', label: '텍스트', icon: <Type size={16} />, description: '일반 텍스트로 시작합니다.' },
  { id: 'h1', label: '제목 1', icon: <Heading1 size={16} />, description: '대형 섹션 제목입니다.' },
  { id: 'h2', label: '제목 2', icon: <Heading2 size={16} />, description: '중형 섹션 제목입니다.' },
  { id: 'bullet', label: '글머리 기호 목록', icon: <List size={16} />, description: '간단한 글머리 기호 목록을 만듭니다.' },
  { id: 'number', label: '번호 매기기 목록', icon: <ListOrdered size={16} />, description: '번호가 있는 목록을 만듭니다.' },
  { id: 'todo', label: '할 일 창', icon: <CheckSquare size={16} />, description: '할 일을 체크박스로 관리합니다.' },
  { id: 'quote', label: '인용구', icon: <Quote size={16} />, description: '인용구를 작성합니다.' },
  { id: 'code', label: '코드 블록', icon: <Code size={16} />, description: '코드 스니펫을 작성합니다.' },
  { id: 'image', label: '이미지', icon: <ImageIcon size={16} />, description: '이미지를 업로드하거나 붙여넣습니다.' },
];

const SlashMenu = ({ position, onSelect, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % COMMANDS.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + COMMANDS.length) % COMMANDS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(COMMANDS[selectedIndex].id);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onSelect, onClose]);

  return (
    <div 
      className="slash-menu" 
      ref={menuRef}
      style={{ 
        top: position.y, 
        left: position.x 
      }}
    >
      <div className="slash-menu-header">기본 블록</div>
      <div className="slash-menu-list">
        {COMMANDS.map((cmd, index) => (
          <div 
            key={cmd.id}
            className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onSelect(cmd.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="slash-menu-icon">{cmd.icon}</div>
            <div className="slash-menu-info">
              <div className="slash-menu-label">{cmd.label}</div>
              <div className="slash-menu-desc">{cmd.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlashMenu;
