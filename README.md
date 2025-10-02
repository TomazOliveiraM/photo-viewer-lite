# PhotoViewer Lite

Um visualizador de imagens simples e moderno construído com Electron, com uma janela sem moldura personalizada e funcionalidades avançadas.

 
> **Nota:** Substitua o link acima por uma URL de uma captura de tela do seu aplicativo. Você pode tirar um print, subir para um site como o [Imgur](https://imgur.com/) e colar o link aqui.

## 🚀 Funcionalidades Implementadas

- [x] **Janela Sem Moldura:** Interface limpa com uma barra de título personalizada e arrastável.
- [x] **Controles de Janela Funcionais:** Botões de minimizar, maximizar/restaurar e fechar totalmente funcionais via IPC.
- [x] **Abertura de Imagens:** Botão para abrir a caixa de diálogo nativa e carregar imagens locais (`.jpg`, `.png`, `.gif`, etc.).
- [x] **Exibição de Metadados:** Mostra informações da imagem como nome, tamanho e dimensões.
- [x] **Janela de Pré-visualização:** Uma janela flutuante "always-on-top" que pode ser aberta/fechada com o atalho `Ctrl+Shift+P`.
- [x] **Persistência de Estado:** O aplicativo salva e restaura a posição e o tamanho da janela entre as sessões.
- [x] **Atalhos de Encaixe:**
    - `Ctrl+Alt+Left`: Encaixa a janela na metade esquerda da tela.
    - `Ctrl+Alt+Right`: Encaixa a janela na metade direita da tela.
    - `Ctrl+Alt+Up`: Centraliza a janela com 2/3 do tamanho da tela.
- [x] **Menu de Contexto:** Clique com o botão direito na imagem para salvá-la.
- [x] **Zoom Interativo:** Aumente e diminua o zoom na imagem usando `Ctrl` + Roda do Mouse.
- [x] **Modal "Sobre":** Janela de informações sobre o aplicativo.

## 🛠️ Como Rodar

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/TomazOliveiraM/photo-viewer-lite.git
    ```
2.  **Navegue até a pasta do projeto:**
    ```bash
    cd photo-viewer-lite
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Inicie o aplicativo:**
    ```bash
    npm start
    ```

