// renderer.js
let currentImagePath = null;

// Verifica se esta é a janela de pré-visualização
const { isPreview } = window.api.getQueryParams();

if (isPreview) {
  // Lógica da janela de pré-visualização
  document.getElementById('main-content').style.display = 'none';
  const previewContent = document.getElementById('preview-content');
  previewContent.style.display = 'block';
  const previewImage = document.getElementById('preview-image');

  // Ouve o evento do processo principal para definir a imagem
  window.api.on('set-preview-image', (imageDataURL) => {
    previewImage.src = imageDataURL;
  });

  // Função: Clicar na imagem de preview para fechar a janela
  previewImage.addEventListener('click', () => {
    window.api.send('preview:close');
  });

} else {
  // Lógica da janela principal
  const minimizeBtn = document.getElementById('minimize-btn');
  const maxRestoreBtn = document.getElementById('max-restore-btn');
  const closeBtn = document.getElementById('close-btn');
  const openImageBtn = document.getElementById('open-image-btn');
  const imageDisplay = document.getElementById('image-display');
  const imageDetails = document.getElementById('image-details');
  const aboutBtn = document.getElementById('about-btn');
  const initialMessage = document.querySelector('#image-container p');
  const titleBarIcon = document.getElementById('title-bar-icon');
  const imageContainer = document.getElementById('image-container');

  // Controles da janela
  minimizeBtn.addEventListener('click', () => window.api.send('windowControls:minimize'));
  maxRestoreBtn.addEventListener('click', () => window.api.send('windowControls:maximizeRestore'));
  closeBtn.addEventListener('click', () => window.api.send('windowControls:close'));

  // Abrir janela "Sobre"
  aboutBtn.addEventListener('click', () => window.api.send('show-about-window'));

  // Função: Clicar no ícone da barra de título para abrir "Sobre"
  titleBarIcon.addEventListener('click', () => window.api.send('show-about-window'));

  // Abrir imagem
  openImageBtn.addEventListener('click', async () => {
    const imageData = await window.api.invoke('windowControls:openImage');
    if (imageData) {
      currentImagePath = imageData.dataURL; // Salva a imagem como Data URL para a pré-visualização
      initialMessage.style.display = 'none';
      imageDisplay.src = imageData.dataURL; // Usa a Data URL para exibir a imagem
      imageDisplay.style.display = 'block';

      imageDetails.innerHTML = `
        <p><strong>Nome:</strong> ${imageData.name}</p>
        <p><strong>Tamanho:</strong> ${(imageData.size / 1024).toFixed(2)} KB</p>
        <p><strong>Dimensões:</strong> ${imageData.width} x ${imageData.height}</p>
      `;
    }
  });

  // --- Funcionalidade de Zoom ---
  let zoomLevel = 1.0;
  imageContainer.addEventListener('wheel', (e) => {
    // Apenas aplica zoom se uma imagem estiver carregada e a tecla Ctrl for pressionada
    if (!currentImagePath || !e.ctrlKey) {
      return;
    }

    // Previne o comportamento padrão de scroll da página
    e.preventDefault();

    // Aumenta ou diminui o zoom
    if (e.deltaY > 0) {
      zoomLevel = Math.max(0.1, zoomLevel - 0.1); // Zoom out, com mínimo de 10%
    } else {
      zoomLevel += 0.1; // Zoom in
    }

    imageDisplay.style.transform = `scale(${zoomLevel})`;
  });

  // Função: Clique direito na imagem para mostrar menu de contexto
  imageDisplay.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Impede o menu padrão do navegador
    // Só mostra o menu se uma imagem estiver carregada
    if (currentImagePath) {
      window.api.send('image:show-context-menu', currentImagePath);
    }
  });

  // Listener para o atalho de pré-visualização
  window.api.on('get-current-image', () => {
    // Envia o caminho da imagem atual de volta para o processo principal
    window.api.send('current-image-for-preview', currentImagePath);
  });
}
