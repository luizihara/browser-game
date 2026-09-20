# 3D Browser Survivor Game

Jogo 3D para navegador do gênero **survivor / bullet heaven** (inspirado na jogabilidade clássica de *Vampire Survivors*), construído com **Three.js**, **TypeScript** e **Vite**.

---

## 🎮 Controles e Gameplay

| Ação | Controle / Mecânica | Contexto |
| :--- | :--- | :--- |
| **Movimentação** | **W, A, S, D** ou **Setas do Teclado** | Gameplay |
| **Ataque** | **100% Automático**: Todas as armas equipadas miram e disparam automaticamente | Gameplay |
| **Arsenal** | Até 4 armas ativas simultâneas (Varinha, Orbes Orbitais, Aura Sagrada, Adagas) | Gameplay |
| **Coleta de XP** | Aproxime-se dos cristais deixados pelos inimigos para atraí-los magneticamente | Gameplay |
| **Level Up** | Ao preencher a barra de XP, escolha 1 entre 3 cartas de novas armas, upgrades ou passivas | Modal de Evolução |
| **Pause** | Tecla **ESC** | Jogo / Pause |
| **Spawn Inimigos** | Tecla **E** (spawna 5 inimigos em volta do jogador) | DEV Mode |
| **Spawn Dummies** | Tecla **B** (spawna 20 dummies de teste) | DEV Mode |
| **Limpeza Geral** | Tecla **C** (limpa inimigos, tiros, gemas e dummies da arena) | DEV Mode |

*Nota: O movimento diagonal é normalizado por vetor, garantindo que o personagem se desloque na mesma velocidade em qualquer direção.*

---

## 🏗️ Princípios de Design e Arquitetura

O projeto segue princípios de responsabilidade única (SRP) e baixo acoplamento:

1. **Main Entry (`src/main.ts`)**: Apenas instancia e inicializa o orquestrador `Game`. Não contém regras de negócio.
2. **Game Core (`src/core/Game.ts`)**: Coordenador mestre da aplicação. Gerencia o ciclo de vida, WebGLRenderer, GameLoop, SceneManager e redimensionamento de janela.
3. **Time & Game Loop (`src/core/Time.ts`, `src/core/GameLoop.ts`)**: Separação estrita entre `update(deltaTime)` e `render()`. Utiliza `deltaTime` com teto de segurança (`MAX_DELTA_TIME = 0.1s`) para proteger contra congelamentos de aba.
4. **Input System (`src/systems/InputSystem.ts`)**: Mapeamento de teclas físicas para ações conceituais (`MoveUp`, `MoveDown`, `MoveLeft`, `MoveRight`, `Pause`, `DebugSpawn`, `DebugClear`, `DebugSpawnEnemy`), desacoplando o teclado das entidades.
5. **Gerenciador de Entidades (`src/entities/EntityManager.ts`)**: Gerencia o ciclo de vida e atualização sequencial de todas as entidades ativas sem alocação de lixo no loop e com remoção O(1) via swap-and-pop.
6. **Limites da Arena (`src/world/ArenaBounds.ts`)**: Paredes tridimensionais perimetrais com contenção matemática (`clampPosition`), contendo o jogador e entidades sem a sobrecarga de uma engine física externa.
7. **Player & Controller (`src/entities/player/`)**: Entidade 3D com modelo e orientação dinâmica. O `PlayerController` interpreta o input e aplica movimentação com Zero-GC. Suporte a dano com *i-frames* (0.5s) e flash visual.
8. **Inimigos & Arquétipos (`src/entities/enemy/`, `src/systems/`)**: 4 arquétipos distintos em primitivas 3D (*Stalker, Skitterer, Brute, Goliath Elite*) que perseguem o jogador continuamente via `EnemyMovementSystem` com Zero-GC.
9. **Arsenal & Combate (`src/weapons/`, `src/systems/WeaponSystem.ts`, `src/systems/CombatSystem.ts`)**: Suporte a até 4 armas simultâneas (*Magic Wand, Guardian Orbs, Radiant Aura, Dagger Throw*). Cada arma possui 5 níveis independentes com aumento de dano, quantidade de projéteis, área e velocidade.
10. **Survivor Loop & Progressão (`src/systems/ExperienceSystem.ts`, `src/systems/UpgradeSystem.ts`)**:
    - **Gemas de XP Multi-Tier (`XpGem.ts`)**: Cristais 3D octaédricos em 3 raridades (Verde 5 XP, Azul 25 XP, Dourada 100 XP) com efeito magnético de atração.
    - **Barra de Nível**: Progressão com curva exponencial de experiência.
    - **Pool de Upgrades Híbrido**: Sorteio dinâmico entre desbloqueio de novas armas, upgrades de armas equipadas e bônus passivos acumulativos (*Might, Swiftness, Haste, Vitality, Magnet, Aerodynamics*).
11. **Diretor de Jogo & Ondas (`src/systems/DirectorSystem.ts`, `src/config/directorConfig.ts`)**:
    - Curva progressiva de dificuldade por tempo (multiplicadores de HP, dano, velocidade e cadência de spawn).
    - Eventos de onda programados (enxames rápidos, cerco em anel e titãs elites com auréola dourada).
    - Banner de alerta visual animado no topo da tela informando a chegada de hordas e elites.
12. **Interface Desacoplada (`src/ui/`, `src/styles/`)**: Menus, HUD (barra de XP superior, Badge de Nível, HP, Kills, Timer, Alertas de Onda e Debug) e overlays de Pause, Level Up (com badges categorizadas) e Game Over em HTML/CSS isolados da GPU.

---

## 📁 Estrutura de Diretórios

```
src/
├── camera/
│   ├── CameraController.ts
│   └── GameCamera.ts
├── config/
│   ├── cameraConfig.ts
│   ├── directorConfig.ts
│   ├── enemyConfig.ts
│   ├── experienceConfig.ts
│   ├── gameConfig.ts
│   ├── graphicsConfig.ts
│   ├── playerConfig.ts
│   ├── sandboxConfig.ts
│   ├── upgradeConfig.ts
│   ├── weaponConfig.ts
│   └── worldConfig.ts
├── core/
│   ├── Game.ts
│   ├── GameLoop.ts
│   ├── Renderer.ts
│   └── Time.ts
├── entities/
│   ├── Entity.ts
│   ├── EntityManager.ts
│   ├── enemy/
│   │   └── Enemy.ts
│   ├── pickup/
│   │   └── XpGem.ts
│   ├── player/
│   │   ├── Player.ts
│   │   └── PlayerController.ts
│   ├── projectile/
│   │   └── Projectile.ts
│   └── sandbox/
│       └── SandboxDummy.ts
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
│   ├── CombatSystem.ts
│   ├── DirectorSystem.ts
│   ├── EnemyMovementSystem.ts
│   ├── EnemySpawner.ts
│   ├── ExperienceSystem.ts
│   ├── InputSystem.ts
│   ├── SandboxSpawner.ts
│   ├── UpgradeSystem.ts
│   └── WeaponSystem.ts
├── types/
│   └── index.ts
├── ui/
│   ├── GameOverMenu.ts
│   ├── HUD.ts
│   ├── LevelUpMenu.ts
│   └── PauseMenu.ts
├── utils/
│   ├── debug.ts
│   └── math.ts
└── weapons/
    ├── AuraWeapon.ts
    ├── DaggerWeapon.ts
    ├── OrbitalWeapon.ts
    ├── ProjectileWeapon.ts
    └── Weapon.ts
```

---

## 📌 Progresso das Milestones

### Milestone 1 — FOUNDATION (Concluída)
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

### Milestone 2 — SANDBOX (Concluída)
- [x] Limites físicos e paredes perimetrais da arena (`ArenaBounds`)
- [x] Colisão/clamp de posição mantendo o jogador dentro do mapa
- [x] Gerenciador de Entidades (`EntityManager`) com atualização e remoção O(1) Zero-GC
- [x] Entidades de teste (*Sandbox Dummy*) com animação procedural para benchmark
- [x] Spawner de teste (`SandboxSpawner`) com atalhos de dev (**B** spawnar lote, **C** limpar)
- [x] Contador de entidades ativas exibido no HUD de desenvolvimento

### Milestone 3 — ENEMIES (Concluída)
- [x] Entidade `Enemy` com malha 3D distinta, olhos brilhantes e atributos de combate
- [x] `EnemyMovementSystem` com perseguição direcional ao Player e Zero-GC
- [x] `EnemySpawner` gerando inimigos em anel fora da visão da câmera com curva de dificuldade por tempo
- [x] Sistema de combate com dano de contato, período de invulnerabilidade (0.5s *i-frames*) e flash visual no jogador
- [x] Barra de HP diminuindo em tempo real no HUD
- [x] Tela e fluxo de **Game Over** exibindo tempo de sobrevivência com botões `[ TRY AGAIN ]` e `[ MAIN MENU ]`

### Milestone 4 — COMBAT (Concluída)
- [x] Entidade `Projectile` 3D emissiva com trajetória vetorial e expiração
- [x] Arquitetura de armas desacopladas (`Weapon`, `WeaponSystem`)
- [x] Algoritmo de mira automática no inimigo vivo mais próximo (`findClosestEnemy`)
- [x] Colisão de projéteis contra inimigos, aplicação de dano e eliminação de inimigos abatidos
- [x] Contador de abates (`KILLS: N`) integrado em destaque na barra superior do HUD
- [x] Reinício de partida zerando projéteis e abates

### Milestone 5 — SURVIVOR LOOP (Concluída)
- [x] Entidade `XpGem` 3D (octaedro verde esmeralda) dropada na morte dos inimigos
- [x] Atração magnética por proximidade e coleta suave
- [x] Barra horizontal de XP no topo do HUD e badge de nível (`LVL N`)
- [x] Sistema de progressão com fórmula de XP exponencial
- [x] Modal de **Level Up** pausando a partida e sorteando 3 cards de upgrades únicos
- [x] Pool de 6 upgrades com modificadores dinâmicos (*Might, Swiftness, Haste, Vitality, Magnet, Aerodynamics*)
- [x] Reinício limpo de partida resetando nível, gemas e atributos base

### Milestone 6 — DIRECTOR (Concluída)
- [x] Curva progressiva de dificuldade por tempo com multiplicadores graduais de vida, dano e velocidade dos inimigos
- [x] 4 arquétipos de inimigos distintos em primitivas 3D (*Stalker, Skitterer, Brute, Goliath Elite*)
- [x] Inimigo Elite (Goliath) titânico com auréola dourada giratória e alta resistência
- [x] Gemas de XP multi-tier (Verde 5 XP, Azul 25 XP, Dourada 100 XP) com cores e escalas proporcionais
- [x] Formações de onda dinâmicas: enxames direcionados (*packs*) e cercos em anel (*ring surges*)
- [x] Banner de alerta de eventos especiais sobreposto no HUD com pulso animado (`⚠️ HORDE SURGE!`, `💀 ELITE DETECTED!`)
- [x] Sincronização limpa do Diretor com o ciclo de Pause, Level Up e reinício de partida

### Milestone 7 — ARSENAL (Concluída)
- [x] Suporte a até 4 armas simultâneas com gerenciamento de slots de equipamento (`WeaponSystem`)
- [x] 4 arquétipos de armas distintos (*Magic Wand, Guardian Orbs, Radiant Aura, Dagger Throw*)
- [x] Sistema de níveis por arma (Lv 1 a 5) com progressão cumulativa de tiros, velocidade e alcance
- [x] Orbes orbitais (`OrbitalWeapon`) com rotação matemática suave ao redor do jogador e dano por contato
- [x] Onda de choque expansiva (`AuraWeapon`) com dano em área 360° ao redor do personagem
- [x] Lâminas direcionais (`DaggerWeapon`) disparadas em leque baseado na orientação do movimento
- [x] Integração no modal de Level Up com badges visuais (`[NEW WEAPON]`, `[UPGRADE LVL X]`, `[PASSIVE]`)
- [x] Reinício limpo no Game Over retornando o jogador à arma inicial de nível 1
