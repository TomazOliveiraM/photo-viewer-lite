// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expõe funções seguras para o processo Renderer
contextBridge.exposeInMainWorld('api', {
  // Renderer -> Main (fire-and-forget)
  send: (channel, data) => {
    const validChannels = [
      'windowControls:minimize', 
      'windowControls:maximizeRestore', 
      'windowControls:close',
      'current-image-for-preview',
      'show-about-window', // Canal para abrir o modal
      'preview:close', // Canal para fechar o preview
      'image:show-context-menu' // Canal para menu de contexto
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Renderer -> Main (request/response)
  invoke: (channel, data) => {
    const validChannels = ['windowControls:openImage'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  // Main -> Renderer
  on: (channel, func) => {
    const validChannels = [
      'get-current-image',
      'set-preview-image' // Canal para receber a imagem na janela de preview
    ];
    if (validChannels.includes(channel)) {
      // Remove o listener para evitar vazamentos de memória
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      // Retorna uma função para remover o listener, permitindo a limpeza no renderer.
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
  // Para obter os parâmetros da URL (usado pela janela de preview)
  getQueryParams: () => {
    const params = new URLSearchParams(window.location.search);
    return { isPreview: params.get('is-preview') === 'true' };
  }
});
