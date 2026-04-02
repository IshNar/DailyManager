import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Palette, Highlighter,
    Plus, MoreVertical, Trash2, Calendar
} from 'lucide-react';
import './Editor.css';
import SlashMenu from './SlashMenu';

const generateId = () => Math.random().toString(36).substr(2, 9);

const RibbonToolbar = () => {
    const applyCommand = (e, cmd, val = null) => {
        e.preventDefault(); 
        document.execCommand(cmd, false, val);
    };

    return (
        <div className="ribbon-toolbar">
            <div className="ribbon-group">
                <button onMouseDown={(e) => applyCommand(e, 'bold')} title="Bold"><Bold size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'italic')} title="Italic"><Italic size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'underline')} title="Underline"><Underline size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'strikeThrough')} title="Strikethrough"><Strikethrough size={16} /></button>
            </div>

            <div className="ribbon-divider"></div>

            <div className="ribbon-group">
                <div className="color-picker-btn" title="Text Color">
                    <Palette size={16} />
                    <input type="color" onChange={(e) => document.execCommand('foreColor', false, e.target.value)} />
                </div>
                <div className="color-picker-btn" title="Highlight Color">
                    <Highlighter size={16} />
                    <input type="color" onChange={(e) => document.execCommand('hiliteColor', false, e.target.value)} />
                </div>
            </div>

            <div className="ribbon-divider"></div>

            <div className="ribbon-group">
                <button onMouseDown={(e) => applyCommand(e, 'justifyLeft')} title="Align Left"><AlignLeft size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'justifyCenter')} title="Align Center"><AlignCenter size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'justifyRight')} title="Align Right"><AlignRight size={16} /></button>
            </div>

            <div className="ribbon-divider"></div>

            <div className="ribbon-group">
                <button onMouseDown={(e) => applyCommand(e, 'insertUnorderedList')} title="Bullet List"><List size={16} /></button>
                <button onMouseDown={(e) => applyCommand(e, 'insertOrderedList')} title="Numbered List"><ListOrdered size={16} /></button>
            </div>
        </div>
    );
};

const RichTextBlock = ({ id, content, onBlur, onSlash }) => {
    const el = useRef(null);
    useEffect(() => {
        if (el.current && el.current.innerHTML !== content && document.activeElement !== el.current) {
            el.current.innerHTML = content;
        }
    }, [content]);

    const handleKeyDown = (e) => {
        if (e.key === '/') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                onSlash({ x: rect.left, y: rect.bottom + 5 });
            }
        }
    };

    return (
        <div
            ref={el}
            id={`editable-${id}`}
            className="canvas-editable"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onBlur(e.target.innerHTML)}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

const Editor = ({ selectedBlock, onUpdateBlock, dateStr }) => {
    const [blocks, setBlocks] = useState([]);
    const [loadedContent, setLoadedContent] = useState('');
    const [slashMenu, setSlashMenu] = useState(null); // { x, y }
    const canvasRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        if (selectedBlock) {
            if (window.electronAPI && dateStr) {
                window.electronAPI.loadMarkdown(selectedBlock.id, dateStr).then(content => {
                    if (isMounted) parseAndSetContent(content);
                });
            } else {
                parseAndSetContent(selectedBlock.markdown || '');
            }
        } else {
            setBlocks([]);
        }
        return () => { isMounted = false; };
    }, [selectedBlock, dateStr]);

    const parseAndSetContent = (content) => {
        setLoadedContent(content);
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                setBlocks(parsed);
                return;
            }
        } catch (e) { }
        
        if (content && content.trim()) {
            const htmlContent = content.replace(/\n/g, '<br/>');
            setBlocks([{ id: generateId(), type: 'text', content: htmlContent, x: 50, y: 50, width: 600, height: 'auto' }]);
        } else {
            setBlocks([]);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            if (selectedBlock) {
                const jsonContent = JSON.stringify(blocks);
                if (jsonContent === loadedContent) return;

                if (window.electronAPI && dateStr) {
                    const frontmatter = {
                        id: selectedBlock.id,
                        title: selectedBlock.title,
                        category: selectedBlock.category,
                        startTime: selectedBlock.startTime,
                        endTime: selectedBlock.endTime,
                        date: dateStr
                    };
                    window.electronAPI.saveMarkdown(selectedBlock.id, dateStr, frontmatter, jsonContent);
                    setLoadedContent(jsonContent);
                } else {
                    setLoadedContent(jsonContent);
                    onUpdateBlock(selectedBlock.id, { markdown: jsonContent });
                }
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [blocks, selectedBlock, onUpdateBlock, dateStr, loadedContent]);

    const handleImageUpload = async (file) => {
        if (!window.electronAPI) return null;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result;
                const ext = file.name ? file.name.split('.').pop() : 'png';
                try {
                    const result = await window.electronAPI.saveImage(base64Data, ext);
                    if (result.success) resolve(result.url);
                    else reject(new Error(result.error));
                } catch (e) { reject(e); }
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = async (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                const url = await handleImageUpload(file);
                if (url) {
                    const isEditableActive = document.activeElement && document.activeElement.isContentEditable;
                    if (isEditableActive) {
                        document.execCommand('insertHTML', false, `<img src="${url}" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />`);
                    } else {
                        addNewBlock('text', `<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`);
                    }
                }
                break;
            }
        }
    };

    const addNewBlock = (type, content = '', x = 50, y = 100) => {
        const newId = generateId();
        setBlocks(prev => [...prev, {
            id: newId,
            type: 'text',
            content,
            x,
            y,
            width: 700,
            height: 'auto'
        }]);
        setTimeout(() => {
            const el = document.getElementById(`editable-${newId}`);
            if (el) el.focus();
        }, 50);
    };

    const handleSlashSelect = (cmdId) => {
        if (cmdId === 'image') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                if (e.target.files[0]) {
                    const url = await handleImageUpload(e.target.files[0]);
                    if (url) document.execCommand('insertHTML', false, `<img src="${url}" style="max-width: 100%; border-radius: 8px;" />`);
                }
            };
            input.click();
        } else {
            let html = '';
            switch(cmdId) {
                case 'h1': html = '<h1>제목 1</h1>'; break;
                case 'h2': html = '<h2>제목 2</h2>'; break;
                case 'bullet': document.execCommand('insertUnorderedList'); break;
                case 'number': document.execCommand('insertOrderedList'); break;
                case 'quote': html = '<blockquote>인용구 입력...</blockquote>'; break;
                case 'code': html = '<pre><code>코드 입력...</code></pre>'; break;
                case 'todo': html = '<div style="display: flex; align-items: center; gap: 8px;"><input type="checkbox"/><span>할 일</span></div>'; break;
                default: break;
            }
            if (html) document.execCommand('insertHTML', false, html);
        }
        setSlashMenu(null);
    };

    if (!selectedBlock) {
        return (
            <div className="editor-empty-state">
                <div className="empty-content">
                    <Calendar size={64} strokeWidth={1} />
                    <h2>시간 블록을 선택하세요</h2>
                    <p>타임라인에서 블록을 클릭하여 세부 내용을 작성하거나,<br/>새로운 블록을 만들어 하루를 계획해보세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="editor-container" onPaste={handlePaste}>
            <RibbonToolbar />

            <div className="editor-header">
                <input 
                    className="editor-title" 
                    value={selectedBlock.title || ''} 
                    onChange={(e) => onUpdateBlock(selectedBlock.id, { title: e.target.value })}
                    placeholder="제목 없는 세션"
                />
                <div className="editor-meta">
                    <span className="editor-time">
                        {selectedBlock.startTime} - {selectedBlock.endTime}
                    </span>
                    <span>{selectedBlock.category || '미지정'}</span>
                    <span style={{ color: '#333' }}>|</span>
                    <span style={{ opacity: 0.6 }}>슬래시(/) 명령어로 빠른 서식 적용</span>
                </div>
            </div>

            <div
                className="editor-body canvas-area"
                ref={canvasRef}
                onClick={(e) => {
                    if (e.target === canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        addNewBlock('text', '', e.clientX - rect.left, e.clientY - rect.top);
                    }
                }}
            >
                {blocks.map(b => (
                    <Rnd
                        key={b.id}
                        bounds="parent"
                        position={{ x: b.x, y: b.y }}
                        size={{ width: b.width, height: b.height === 'auto' ? undefined : b.height }}
                        onDragStop={(e, d) => setBlocks(prev => prev.map(bl => bl.id === b.id ? { ...bl, x: d.x, y: d.y } : bl))}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                            setBlocks(prev => prev.map(bl => bl.id === b.id ? {
                                ...bl,
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                x: pos.x,
                                y: pos.y
                            } : bl));
                        }}
                        dragHandleClassName="drag-handle"
                        enableResizing={{
                            top: false, right: true, bottom: false, left: true,
                            topRight: false, bottomRight: true, bottomLeft: true, topLeft: false
                        }}
                        disableDragging={document.activeElement && document.activeElement.id === `editable-${b.id}`}
                    >
                        <div className={`canvas-block ${b.type}-block`}>
                            <div className="drag-handle">
                                <MoreVertical size={14} />
                            </div>

                            <RichTextBlock
                                id={b.id}
                                content={b.content}
                                onBlur={(newContent) => setBlocks(prev => prev.map(bl => bl.id === b.id ? { ...bl, content: newContent } : bl))}
                                onSlash={setSlashMenu}
                            />

                            <button className="del-btn" onClick={() => setBlocks(prev => prev.filter(bl => bl.id !== b.id))}>
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </Rnd>
                ))}
            </div>

            {slashMenu && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setSlashMenu(null)} />
                    <SlashMenu 
                        position={slashMenu} 
                        onSelect={handleSlashSelect} 
                        onClose={() => setSlashMenu(null)} 
                    />
                </>
            )}
        </div>
    );
};

export default Editor;
