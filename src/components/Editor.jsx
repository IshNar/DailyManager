import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Palette, Highlighter
} from 'lucide-react';
import './Editor.css';

const generateId = () => Math.random().toString(36).substr(2, 9);

const RibbonToolbar = () => {
    const applyCommand = (e, cmd, val = null) => {
        e.preventDefault(); // Keep focus on the editor
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

const RichTextBlock = ({ id, content, onBlur }) => {
    const el = useRef(null);
    useEffect(() => {
        if (el.current && el.current.innerHTML !== content && document.activeElement !== el.current) {
            el.current.innerHTML = content;
        }
    }, [content]);

    return (
        <div
            ref={el}
            id={`editable-${id}`}
            className="canvas-editable"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onBlur(e.target.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

const Editor = ({ selectedBlock, onUpdateBlock, dateStr }) => {
    const [blocks, setBlocks] = useState([]);
    const [loadedContent, setLoadedContent] = useState('');
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
        } catch (e) {
            // Not JSON
        }
        if (content && content.trim()) {
            const htmlContent = content.replace(/\n/g, '<br/>');
            setBlocks([{ id: generateId(), type: 'text', content: htmlContent, x: 20, y: 20, width: 600, height: 'auto' }]);
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
                    onUpdateBlock(selectedBlock.id, {});
                } else {
                    setLoadedContent(jsonContent);
                    onUpdateBlock(selectedBlock.id, { markdown: jsonContent });
                }
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [blocks, selectedBlock, onUpdateBlock, dateStr, loadedContent]);

    if (!selectedBlock) {
        return (
            <div className="editor-empty-state">
                <div className="empty-content">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <h2>No Timeblock Selected</h2>
                    <p>Click on a block in the timeline to view and edit its workspace.</p>
                </div>
            </div>
        );
    }

    const title = selectedBlock.title || 'Untitled Session';

    const handleImageUpload = async (file) => {
        if (!window.electronAPI) return null;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result;
                const ext = file.name ? file.name.split('.').pop() : 'png';
                try {
                    const result = await window.electronAPI.saveImage(base64Data, ext);
                    if (result.success) {
                        resolve(result.url);
                    } else {
                        reject(new Error(result.error));
                    }
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = async (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image/') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                try {
                    const url = await handleImageUpload(file);
                    if (url) {
                        const isEditableActive = document.activeElement && document.activeElement.isContentEditable;
                        if (isEditableActive) {
                            const imgHtml = `<img src="${url}" style="max-width: 100%; border-radius: 4px;" />`;
                            document.execCommand('insertHTML', false, imgHtml);
                        } else {
                            setBlocks(prev => [...prev, {
                                id: generateId(),
                                type: 'text',
                                content: `<img src="${url}" style="max-width: 100%; border-radius: 4px;" /><br/>`,
                                x: 50,
                                y: 50,
                                width: 600,
                                height: 'auto'
                            }]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to save pasted image", err);
                }
                break;
            }
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = Math.max(0, e.clientX - rect.left + canvasRef.current.scrollLeft);
        const dropY = Math.max(0, e.clientY - rect.top + canvasRef.current.scrollTop);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.indexOf('image/') !== -1) {
                try {
                    const url = await handleImageUpload(file);
                    if (url) {
                        const target = e.target;
                        const isEditable = target.classList.contains('canvas-editable') || target.closest('.canvas-editable');
                        let inserted = false;

                        if (isEditable && document.caretRangeFromPoint) {
                            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                            if (range) {
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);

                                const imgHtml = `<img src="${url}" style="max-width: 100%; border-radius: 4px;" />`;
                                document.execCommand('insertHTML', false, imgHtml);
                                inserted = true;
                            }
                        }

                        if (!inserted) {
                            setBlocks(prev => [...prev, {
                                id: generateId(),
                                type: 'text',
                                content: `<img src="${url}" style="max-width: 100%; border-radius: 4px;" /><br/>`,
                                x: dropX,
                                y: dropY,
                                width: 600,
                                height: 'auto'
                            }]);
                        }
                    }
                } catch (err) {
                    console.error("Failed to save dropped image", err);
                }
            }
        }
    };

    const handleCanvasClick = (e) => {
        if (e.target.classList.contains('canvas-area') || e.target.classList.contains('editor-body')) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = Math.max(0, e.clientX - rect.left + canvasRef.current.scrollLeft);
            const y = Math.max(0, e.clientY - rect.top + canvasRef.current.scrollTop);

            const newId = generateId();
            setBlocks(prev => [...prev, {
                id: newId,
                type: 'text',
                content: '',
                x,
                y,
                width: 600,
                height: 'auto'
            }]);

            setTimeout(() => {
                const newTextarea = document.getElementById(`editable-${newId}`);
                if (newTextarea) {
                    newTextarea.focus();
                }
            }, 50);
        }
    };

    const updateBlock = (id, changes) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
    };

    const deleteBlock = (id) => {
        setBlocks(prev => prev.filter(b => b.id !== id));
    };

    return (
        <div className="editor-container">
            <RibbonToolbar />

            <div className="editor-header">
                <h2 className="editor-title">{title}</h2>
                <div className="editor-meta">
                    <span className="editor-time">
                        {selectedBlock.startTime} - {selectedBlock.endTime}
                    </span>
                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                        Tip: Click anywhere on the canvas to type. Drop/paste images.
                    </span>
                </div>
            </div>

            <div
                className="editor-body canvas-area"
                ref={canvasRef}
                onClick={handleCanvasClick}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                {blocks.map(b => (
                    <Rnd
                        key={b.id}
                        bounds="parent"
                        position={{ x: b.x, y: b.y }}
                        size={{ width: b.width, height: b.height === 'auto' ? undefined : b.height }}
                        onDragStop={(e, d) => updateBlock(b.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, dir, ref, delta, pos) => {
                            updateBlock(b.id, {
                                width: ref.offsetWidth,
                                height: ref.offsetHeight,
                                x: pos.x,
                                y: pos.y
                            });
                        }}
                        dragHandleClassName="drag-handle"
                        enableResizing={{
                            top: true, right: true, bottom: true, left: true,
                            topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
                        }}
                        disableDragging={b.type === 'text' && document.activeElement && document.activeElement.id === `editable-${b.id}`}
                    >
                        <div className={`canvas-block ${b.type}-block`}>
                            <div className="drag-handle">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <circle cx="9" cy="5" r="2"></circle>
                                    <circle cx="9" cy="12" r="2"></circle>
                                    <circle cx="9" cy="19" r="2"></circle>
                                    <circle cx="15" cy="5" r="2"></circle>
                                    <circle cx="15" cy="12" r="2"></circle>
                                    <circle cx="15" cy="19" r="2"></circle>
                                </svg>
                            </div>

                            {b.type === 'text' ? (
                                <RichTextBlock
                                    id={b.id}
                                    content={b.content}
                                    onBlur={(newContent) => updateBlock(b.id, { content: newContent })}
                                />
                            ) : (
                                <img src={b.content} alt="attachment" className="canvas-image" />
                            )}

                            <button className="del-btn" onClick={() => deleteBlock(b.id)}>×</button>
                        </div>
                    </Rnd>
                ))}
            </div>
        </div>
    );
};

export default Editor;
