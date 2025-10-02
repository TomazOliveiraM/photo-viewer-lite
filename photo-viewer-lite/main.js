// main.js
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let previewWindow;
let store; // A instância do Store será carregada de forma assíncrona

async function createWindow() {
  // Carrega o electron-store de forma assíncrona
  const { default: Store } = await import('electron-store');
  store = new Store();

  // Recupera a posição e o tamanho da janela, se existirem
  const windowBounds = store.get('windowBounds', { width: 800, height: 600 });

  // Verifica se a janela está dentro dos limites da tela
  const allDisplays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  let isOnScreen = false;
  for (const display of allDisplays) {
    const { x, y, width, height } = display.bounds;
    if (
      windowBounds.x >= x &&
      windowBounds.y >= y &&
      windowBounds.x + windowBounds.width <= x + width &&
      windowBounds.y + windowBounds.height <= y + height
    ) {
      isOnScreen = true;
      break;
    }
  }

  mainWindow = new BrowserWindow({
    ...windowBounds,
    frame: false, // Janela sem a moldura padrão
    icon: path.join(__dirname, 'assets/icon.png'), // Adiciona o ícone da janela
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Se a janela estiver fora da tela, centraliza
  if (!isOnScreen) {
    mainWindow.center();
  }

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Salva a posição e o tamanho da janela ao mover ou redimensionar
  mainWindow.on('resize', () => store.set('windowBounds', mainWindow.getBounds()));
  mainWindow.on('move', () => store.set('windowBounds', mainWindow.getBounds()));

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (previewWindow) {
      previewWindow.close();
    }
  });
}

// --- Funções da Janela de Pré-visualização ---
function togglePreviewWindow(imageDataURL) {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
    previewWindow = null;
    return;
  }

  previewWindow = new BrowserWindow({
    width: 200,
    height: 200,
    parent: mainWindow,
    frame: false,
    alwaysOnTop: true, // Sempre por cima de outras janelas
    resizable: false,
    webPreferences: {
      // Passa o caminho da imagem para a janela de preview
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Carrega o HTML e, quando estiver pronto, envia a imagem via IPC
  previewWindow.loadFile(path.join(__dirname, 'index.html'), { query: { 'is-preview': 'true' } });
  
  previewWindow.webContents.on('did-finish-load', () => {
    // Envia a imagem Base64 para a janela de pré-visualização
    previewWindow.webContents.send('set-preview-image', imageDataURL);
  });
  
  previewWindow.on('closed', () => {
    previewWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow(); // Agora createWindow é assíncrona

  // --- Atalhos Globais ---
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    // Pede ao renderer a imagem atual para abrir na pré-visualização
    mainWindow.webContents.send('get-current-image');
  });

  globalShortcut.register('CommandOrControl+Alt+Left', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ x: 0, y: 0, width: width / 2, height });
  });

  globalShortcut.register('CommandOrControl+Alt+Right', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setBounds({ x: width / 2, y: 0, width: width / 2, height });
  });

  globalShortcut.register('CommandOrControl+Alt+Up', () => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const newWidth = Math.floor(width * (2 / 3));
    const newHeight = Math.floor(height * (2 / 3));
    mainWindow.setSize(newWidth, newHeight);
    mainWindow.center();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Limpa todos os atalhos ao fechar o app
  globalShortcut.unregisterAll();
});

// --- Comunicação IPC (Main Process) ---

// Renderer -> Main (fire-and-forget)
ipcMain.on('windowControls:minimize', () => mainWindow.minimize());
ipcMain.on('windowControls:maximizeRestore', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('windowControls:close', () => app.quit());

// Renderer -> Main (para fechar a janela de preview)
ipcMain.on('preview:close', () => {
  if (previewWindow && !previewWindow.isDestroyed()) {
    previewWindow.close();
  }
});

// Renderer -> Main (para mostrar o menu de contexto da imagem)
ipcMain.on('image:show-context-menu', (event, dataURL) => {
  const template = [
    {
      label: 'Salvar Imagem Como...',
      click: async () => {
        const { filePath } = await dialog.showSaveDialog({
          title: 'Salvar Imagem',
          defaultPath: `image.png`,
          filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'webp'] }]
        });
        if (filePath) {
          const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
        }
      }
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

// Renderer -> Main (para mostrar o modal "Sobre")
ipcMain.on('show-about-window', () => {
  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 250,
    parent: mainWindow, // Define a janela principal como pai
    modal: true,         // Torna a janela modal
    frame: false,        // Sem moldura, como a principal
    resizable: false,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      // Não precisamos de preload aqui, pois o script de fechar é inline
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  aboutWindow.loadFile(path.join(__dirname, 'about.html'));
  aboutWindow.setMenu(null); // Remove o menu padrão
});

// Renderer -> Main (request/response)
ipcMain.handle('windowControls:openImage', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const filePath = filePaths[0];
  const stats = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath); // Lê o arquivo como um buffer

  const { default: sizeOf } = await import('image-size'); // Importa o módulo ESM
  const dimensions = sizeOf(buffer); // Passa o buffer para obter as dimensões
  const mimeType = `image/${path.extname(filePath).substring(1)}`;

  const dataURL = `data:${mimeType};base64,${buffer.toString('base64')}`;

  return {
    dataURL: dataURL, // Envia a imagem como Base64
    name: path.basename(filePath),
    size: stats.size, // em bytes
    width: dimensions.width,
    height: dimensions.height,
  };
});

// Resposta do renderer com a imagem atual para abrir na pré-visualização
ipcMain.on('current-image-for-preview', (event, imagePath) => {
  if (imagePath) {
    togglePreviewWindow(imagePath);
  } else {
    // Se não houver imagem, podemos notificar o usuário (opcional)
    console.log('Nenhuma imagem carregada para abrir na pré-visualização.');
  }
});
