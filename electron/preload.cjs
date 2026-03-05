const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadScheduleMeta: () => ipcRenderer.invoke('load-schedule-meta'),
    saveScheduleMeta: (data) => ipcRenderer.invoke('save-schedule-meta', data),
    loadMarkdown: (blockId, dateStr) => ipcRenderer.invoke('load-markdown', blockId, dateStr),
    saveMarkdown: (blockId, dateStr, frontmatter, mdContent) => ipcRenderer.invoke('save-markdown', blockId, dateStr, frontmatter, mdContent),
    saveImage: (base64Data, extension) => ipcRenderer.invoke('save-image', base64Data, extension)
});
