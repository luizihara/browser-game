# Survivor 3D

Um jogo 3D para navegador inspirado no estilo de gameplay survivor / bullet heaven (conceito popularizado por jogos como *Vampire Survivors*), desenvolvido com tecnologias web modernas focando em alto desempenho, arquitetura limpa e escalabilidade para centenas de entidades.

---

## 🛠️ Stack Tecnológica

- **Linguagem**: TypeScript (Strict Mode)
- **Engine Gráfica**: Three.js (WebGLRenderer, Sombras Suaves PCF, Shading PBR)
- **Build Tool / Bundler**: Vite (Template Vanilla-TS)
- **Interface (UI)**: HTML5 & CSS3 nativos (isolados da renderização WebGL)

---

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js (versão 18+ ou LTS recomendada)
- NPM (versão 9+)

### Comandos

1. **Instalação de Dependências**:
   ```bash
   npm install
   ```

2. **Executar em Modo de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a URL indicada (geralmente `http://localhost:5173`) no navegador.

3. **Compilação e Verificação de Tipos (Build de Produção)**:
   ```bash
   npm run build
   ```

4. **Visualizar o Build de Produção**:
   ```bash
   npm run preview
   ```

---

## 🎮 Controles Atuais

| Tecla / Ação | Função |
| :--- | :--- |
| **W** / **Seta para Cima** | Movimenta para Cima (Norte no plano XZ) |
| **S** / **Seta para Baixo** | Movimenta para Baixo (Sul no plano XZ) |
| **A** / **Seta para a Esquerda**| Movimenta para a Esquerda (Oeste no plano XZ) |
| **D** / **Seta para a Direita** | Movimenta para a Direita (Leste no plano XZ) |
| **ESC** | Pausa / Despausa o jogo |

*Nota: O movimento diagonal é normalizado por vetor, garantindo que o personagem se desloque na mesma velocidade em qualquer direção.*

---

## 🏛️ Visão Arquitetural

O projeto segue princípios de responsabilidade única (SRP) e baixo acoplamento:

1. **Main Entry (`src/main.ts`)**: Apenas instancia e inicializa o orquestrador `Game`. Não contém regras de negócio.
2. **Game Core (`src/core/Game.ts`)**: Coordenador mestre da aplicação. Gerencia o ciclo de vida, WebGLRenderer, GameLoop, SceneManager e redimensionamento de janela.
3. **Time & Game Loop (`src/core/Time.ts`, `src/core/GameLoop.ts`)**: Separação estrita entre `update(deltaTime)` e `render()`. Utiliza `deltaTime` com teto de segurança (`MAX_DELTA_TIME = 0.1s`) para proteger contra congelamentos de aba.
4. **Input System (`src/systems/InputSystem.ts`)**: Camada de abstração que mapeia códigos de teclas para ações conceituais (`MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`, `Pause`), desacoplando o teclado das entidades.
5. **Player & Controller (`src/entities/player/`)**: O `Player` é uma entidade Three.js pura com modelo 3D (cápsula + visor direcional). O `PlayerController` interpreta os comandos do `InputSystem`, normaliza direções e aplica `speed * deltaTime` reutilizando vetores em memória (Zero Garbage Collection).
6. **Câmera Isométrica Suave (`src/camera/`)**: `GameCamera` encapsula uma `PerspectiveCamera` com ângulo top-down/isométrico. O `CameraController` realiza acompanhamento suave amortecido (`lerp` exponencial independente de taxa de quadros).
7. **Cenário (`src/world/`)**: Chão com grade indicadora de deslocamento espacial e iluminação balanceada (HemisphereLight + DirectionalLight gerando sombras dinâmicas).
8. **Gerenciador de Cenas (`src/scenes/`)**: Ciclo de vida desacoplado (`init`, `enter`, `update`, `render`, `resize`, `exit`, `dispose`).
9. **UI desacoplada (`src/ui/`, `src/styles/`)**: Menus e HUD renderizados sobre o canvas em HTML/CSS com overlays posicionados via CSS puro.

---

## 📁 Estrutura de Diretórios

```
web-game/
├── index.html
├── package.json
├── tsconfig.json
├── README.md
├── AGENTS.md
└── src/
    ├── main.ts
    ├── camera/
    │   ├── CameraController.ts
    │   └── GameCamera.ts
    ├── config/
    │   ├── cameraConfig.ts
    │   ├── gameConfig.ts
    │   ├── graphicsConfig.ts
    │   ├── playerConfig.ts
    │   └── worldConfig.ts
    ├── core/
    │   ├── Game.ts
    │   ├── GameLoop.ts
    │   ├── Renderer.ts
    │   └── Time.ts
    ├── entities/
    │   ├── Entity.ts
    │   └── player/
    │       ├── Player.ts
    │       └── PlayerController.ts
    ├── loaders/
    │   └── AssetLoader.ts
    ├── scenes/
    │   ├── GameScene.ts
    │   ├── LoadingScene.ts
    │   ├── MenuScene.ts
    │   ├── Scene.ts
    │   └── SceneManager.ts
    ├── styles/
    │   ├── global.css
    │   ├── hud.css
    │   └── menu.css
    ├── systems/
    │   └── InputSystem.ts
    ├── types/
    │   └── index.ts
    └── utils/
        ├── debug.ts
        └── math.ts
```

---

## 📌 Estado Atual do Projeto (Milestone 1 — FOUNDATION)

- [x] Transição fluida de telas: **Loading** → **Main Menu** → **Game Scene**
- [x] Renderizador Three.js configurado com antialias e limitação de pixel ratio (HiDPI)
- [x] Entidade do Player com primitiva 3D (cápsula com visor) e projeção de sombras
- [x] Movimento com WASD / Setas com vetor normalizado e cálculo estrito em delta time
- [x] Câmera isométrica com acompanhamento amortecido do jogador
- [x] Chão e iluminação em tempo real
- [x] HUD independente em HTML/CSS com HP e Cronômetro de partida
- [x] Sistema de Pause (ESC ou botões) que congela a lógica e o cronômetro mantendo a renderização
- [x] Redimensionamento da janela dinâmico e sem distorção de aspecto
- [x] Painel de debug para desenvolvimento (FPS e coordenadas XYZ)
- [x] Compilação TypeScript com 0 erros e 0 warnings
