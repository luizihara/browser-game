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
13. **Áudio Procedural Web Audio API (`src/audio/SoundManager.ts`, `src/config/audioConfig.ts`)**:
    - Síntese de áudio 100% nativa no navegador sem download de arquivos de áudio externos (zero latência e zero footprint de rede).
    - Efeitos sonoros para tiros, impactos de armas, morte de inimigos, coleta de gemas de XP, level up, alertas de horda/elite e game over.
    - Desbloqueio e resume automático em gestos do usuário (`pointerdown`, `keydown`, `click`), respeitando as políticas de autoplay do navegador.
14. **Sistema de Partículas & Screen Shake (`src/fx/ParticleSystem.ts`, `src/camera/CameraController.ts`)**:
    - Sistema de partículas Zero-GC pré-alocado utilizando um único `THREE.Points` com `BufferGeometry` e shaders GLSL customizados (blending aditivo, atenuação por distância e bordas suaves).
    - Emissão de faíscas de impacto, explosões radiais coloridas conforme a cor do inimigo e fonte espiral de partículas para celebração de level up.
    - Hit-flash em inimigos ao levarem dano e amortecimento de câmera com modelo de trauma decaído linearmente ($intensity = trauma^2$) por pseudo-ruído trigonométrico.
15. **Direção Visual Low-Poly Toon (`src/art/`, `VISUAL_DIRECTION.md`)**:
    - Estética cartoon com cel-shading discreto em 3 bandas (`MeshToonMaterial` procedural com `ToonMaterialFactory`), garantindo alto contraste e zero ruído de textura realista.
    - Compartilhamento de materiais em GPU memory e instanciamento de vegetação/rochas periféricas via `THREE.InstancedMesh` (`PropBuilder.ts`).
    - Player estilizado Chibi Hero com capa, capacete, visor brilhante e animação de passada (*bobbing*).
    - 4 arquétipos de inimigos com silhuetas caricatas bem definidas e movimentação com wobble procedural.

---

## 📁 Estrutura de Diretórios

```
src/
├── art/
│   ├── CharacterBuilder.ts
│   ├── EnemyVisualBuilder.ts
│   ├── Palette.ts
│   ├── PropBuilder.ts
│   └── ToonMaterialFactory.ts
├── audio/
│   └── SoundManager.ts
├── camera/
│   ├── CameraController.ts
│   └── GameCamera.ts
├── config/
│   ├── audioConfig.ts
│   ├── cameraConfig.ts
│   ├── characterConfig.ts
│   ├── directorConfig.ts
│   ├── enemyConfig.ts
│   ├── evolutionConfig.ts
│   ├── experienceConfig.ts
│   ├── fxConfig.ts
│   ├── gameConfig.ts
│   ├── graphicsConfig.ts
│   ├── metaConfig.ts
│   ├── metaUpgradeConfig.ts
│   ├── playerConfig.ts
│   ├── sandboxConfig.ts
│   ├── settingsConfig.ts
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
│   │   ├── PickupItem.ts
│   │   └── XpGem.ts
│   ├── player/
│   │   ├── Player.ts
│   │   └── PlayerController.ts
│   ├── projectile/
│   │   └── Projectile.ts
│   └── sandbox/
│       └── SandboxDummy.ts
├── fx/
│   ├── DamageNumberSystem.ts
│   └── ParticleSystem.ts
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
│   ├── PickupSystem.ts
│   ├── SandboxSpawner.ts
│   ├── UpgradeSystem.ts
│   └── WeaponSystem.ts
├── types/
│   └── index.ts
├── ui/
│   ├── CharacterSelectMenu.ts
│   ├── GameOverMenu.ts
│   ├── HUD.ts
│   ├── LevelUpMenu.ts
│   ├── MetaShopMenu.ts
│   ├── PauseMenu.ts
│   ├── SettingsMenu.ts
│   ├── TreasureChestModal.ts
│   └── VictoryMenu.ts
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

### Milestone 8 — AUDIO & FX (Concluída)
- [x] Sintetizador de áudio procedural usando Web Audio API nativa (`SoundManager`) com zero dependências externas ou arquivos de áudio
- [x] Efeitos sonoros procedurais para disparos, impactos de tiros/armas, eliminação de inimigos, coleta de gemas de XP, level up, alertas de horda e game over
- [x] Gerenciamento de desbloqueio seguro do áudio (`AudioContext.resume()`) no primeiro gesto do usuário (`pointerdown`, `keydown`, `click`)
- [x] Sistema de partículas Zero-GC pré-alocado (`ParticleSystem`) com `THREE.Points`, shaders GLSL customizados e blending aditivo
- [x] Emissão de faíscas de impacto dinâmicas (`emitHitSparks`) com cor sincronizada ao projétil/arma
- [x] Explosão radial de fragmentos na derrota dos inimigos (`emitDeathExplosion`) preservando a cor original do arquétipo
- [x] Fonte espiral ascendente de partículas douradas e esmeraldas ao subir de nível (`emitLevelUpBurst`)
- [x] Hit-flash nos inimigos ao sofrerem dano com restauração em 0.08s sem alocações
- [x] Screen shake com modelo de trauma na câmera (`CameraController.addTrauma`), decaído quadraticamente e alimentado por dano no jogador, ondas de horda e chegada de elites
- [x] Limpeza e reinicialização completa dos efeitos visuais e áudio ao reiniciar a partida

### Milestone 9 — POLISH & ART (Concluída)
- [x] Especificação e aprovação da direção de arte mestre em [`VISUAL_DIRECTION.md`](VISUAL_DIRECTION.md) (*Low-Poly Cartoon / Toon Shading*)
- [x] Fábrica de materiais toon (`ToonMaterialFactory`) com rampa de gradiente de 3 bandas procedural e cache de materiais compartilhados
- [x] Paleta cromática centralizada (`Palette.ts`) com hierarquia visual rígida (cenário pastel $\rightarrow$ inimigos contrastantes $\rightarrow$ herói vibrante)
- [x] Iluminação toon atmosférica com `HemisphereLight` (céu suave / chão quente) e sol direcional em 45° com shadow bias para eliminar shadow acne
- [x] Piso estilizado da arena com gradiente de cores por vértice (`Ground.ts`) simulando clareira verdejante e contorno perimetral limpo
- [x] Muretas e pilares de ruínas antigas nos limites da arena (`ArenaBounds.ts`) preservando a contenção física exata
- [x] Ambientação com vegetação low-poly e rochas instanciadas (`PropBuilder.ts`, `THREE.InstancedMesh`) com custo mínimo de draw calls
- [x] Redesenho carismático do Player (*Chibi Knight-Mage*) com capacete, visor ciano emissivo, ombreiras, capa e cajado de mago (`CharacterBuilder.ts`)
- [x] Animação procedural de passada (*bobbing* vertical e balanço) e respiração em idle calculadas com zero alocações
- [x] Redesenho expressivo dos 4 arquétipos de inimigos (*Stalker, Skitterer, Brute, Goliath Elite*) com silhuetas fortes e animações de marcha/wobble
- [x] Sistema de hit-flash individual para inimigos atingidos sem interferir nos outros monstros do mesmo arquétipo
- [x] Polimento da UI e Menus com cantos arredondados, botões 3D com profundidade e estética cartoon coesa

### Milestone 10 — ENDGAME, VICTORY & META PROGRESSION (Concluída)
- [x] **Física de Separação e Colisão de Corpos**: Círculos de contenção impedem que herói e monstros ocupem o mesmo espaço físico; separação de multidão Zero-GC entre inimigos evitando empilhamento e permitindo fluxo orgânico de enxames.
- [x] **Orientação Angular Precisa**: O herói e os monstros agora caminham e encaram perfeitamente a direção do vetor de deslocamento em 360°.
- [x] **Enriquecimento Visual do Mapa**: Tufos de grama 3D estilizada, flores silvestres coloridas, cogumelos bioluminescentes, paralelepípedos centrais e ruínas antigas instanciadas via `THREE.InstancedMesh` com zero GC e draw calls consolidadas.
- [x] **Atalhos Rápidos de Teclado**: Seleção instantânea de cartas de Level Up através das teclas numéricas `1`, `2` e `3`.
- [x] **Menu de Opções / Configurações**: Acessível via Main Menu e Pause com ajuste contínuo de volume Master e SFX, intensidade do screen shake (Completo, Reduzido, Desligado) e alternância do dano hit-flash com persistência em `localStorage`.
- [x] **Condição de Vitória (Endgame)**: Sobrevivência até o tempo estipulado (`victoryTime = 300s`) com onda final de clímax e confronto épico.
- [x] **Tela de Vitória**: Resumo completo com tempo sobrevivido, inimigos eliminados, dano total, nível alcançado, ouro obtido e tabela detalhada de dano causado por cada arma com porcentagens de contribuição.
- [x] **Meta-Progressão e Registro de Recordes (`MetaManager`)**: Rastreamento persistente do melhor tempo de sobrevivência, maior nível, recorde de abates, total de partidas e acumulação de ouro salvo em `localStorage`, visível no Menu Principal.

### Milestone 11 — META SHOP & ARENA DROPS (Concluída)
- [x] **Loja de Power-ups Permanentes com Ouro (`MetaShopMenu.ts`, `metaUpgradeConfig.ts`)**: Menu dedicado acessível pelo Menu Principal (`POWER-UPS 🪙`) permitindo gastar o ouro acumulado em 8 atributos permanentes (*Might, Vitality, Armor, Swiftness, Arcane Haste, Magnetism, Wisdom, Greed*) com indicadores de rank e custos escalonados.
- [x] **Sistema de Reembolso 100% Gratuito (Respec)**: Botão `[ REFUND ALL ]` que devolve 100% do ouro investido sem perda ou penalidade para redistribuição livre de atributos.
- [x] **Drops Especiais 3D de Arena (`PickupItem.ts`, `PickupSystem.ts`)**:
  - 🎁 **Baú de Tesouro (Treasure Chest)**: Solto com 100% de chance por Elites derrotados;
  - 💖 **Poção de Vida (Health Potion)**: Restaura 30 HP instantaneamente com som cintilante e faíscas rubi;
  - 🧲 **Ímã Cósmico (Vacuum Orb)**: Atrai instantaneamente todas as gemas de XP espalhadas pelo chão até o jogador;
  - 💣 **Bomba Sacra (Holy Bomb)**: Detona uma explosão de 250 de dano limpando os inimigos da tela com screen shake.
- [x] **Modal de Recompensa de Baú (`TreasureChestModal.ts`)**: Pausa temporária triunfante com fanfarra de áudio procedural, concessão de bônus de ouro imediato e +1 upgrade instantâneo aleatório de armas ou passivas.
- [x] **Novos Efeitos Sonoros Procedurais (`SoundManager.ts`)**: Síntese nativa Web Audio API para abertura de baús, poção de cura, sucção magnética e explosão de bomba sagrada.

### Milestone 12 — CHARACTER SELECTION & HERO ROSTER (Concluída)
- [x] **Elenco de 4 Heróis Únicos (`src/config/characterConfig.ts`)**:
  - 🛡️ **Sir Roderick (O Cavaleiro Sagrado)**: Robusto e inabalável. Arma inicial: *Radiant Aura* (Lv 1). Passiva: +30 Max HP, +2 Armadura, -5% Velocidade.
  - 🧙‍♀️ **Elara (A Arquimaga Astral)**: Mestra das artes arcanas. Arma inicial: *Magic Wand* (Lv 1). Passiva: +20% Dano de Magia, -15% Cooldown de Feitiços, -20 Max HP.
  - 🗡️ **Kage (O Andarilho das Sombras)**: Veloz e letal. Arma inicial: *Dagger Throw* (Lv 1). Passiva: +25% Velocidade de Movimento, +35% Velocidade de Projéteis, +10% Dano, -10 Max HP.
  - ⚖️ **Aurelius (O Templário Protetor)**: Guardião celestial. Arma inicial: *Guardian Orbs* (Lv 1). Passiva: +15 Max HP, +1 Armadura, +30% Raio de Coleta Magnética.
- [x] **Modelos 3D Procedurais Estilizados (`CharacterBuilder.ts`, `Palette.ts`)**: Cada herói possui geometria Low-Poly Toon exclusiva (Elmo de cavaleiro com visor, Chapéu pontudo de maga e cetro de gema, Máscara ninja com capuz e adagas nas costas, Coroa de espinhos dourada e couraça sacerdotal com orbes flutuantes).
- [x] **Menu de Seleção de Personagens (`CharacterSelectMenu.ts`, `menu.css`)**: Modal visual moderno aberto pelo botão `[ START GAME ]` no Menu Principal com cards dos 4 heróis, badges da arma inicial, descrição de passivas, status de bloqueio e botão de compra por ouro acumulado.
- [x] **Persistência de Personagens e Desbloqueio com Ouro (`MetaManager.ts`, `metaConfig.ts`)**: Suporte a heróis desbloqueáveis com ouro (Sir Roderick gratuito, Elara 250🪙, Kage 500🪙, Aurelius 800🪙), persistidos com segurança no `localStorage`.
- [x] **Integração Completa na Partida (`Player.ts`, `GameScene.ts`, `UpgradeSystem.ts`, `WeaponSystem.ts`)**: Modificadores de classe aplicados no instanciamento e no restart, troca de malha 3D instantânea e arma inicial atribuída de acordo com o herói escolhido.

### Milestone 13 — WEAPON EVOLUTIONS, CRITICAL HITS & FLOATING COMBAT TEXT (Concluída)
- [x] **4 Super-Armas Evoluídas & Sistema de Sinergias (`evolutionConfig.ts`, `WeaponSystem.ts`, `UpgradeSystem.ts`)**:
  - 💫 **Holy Astral Beam** (*Magic Wand Lv 5 + Arcane Haste*): Dispara feixes cósmicos contínuos e velozes que perfuram até 3 inimigos com rastro de luz ciano e alta cadência.
  - 🛡️ **Aegis Citadel** (*Guardian Orbs Lv 5 + Vitality*): 6 orbes sagrados ampliados com rotação orbital extrema (6.2 rad/s), dano ampliado e repulsão por impacto (*knockback*) contínua contra hordas.
  - ☀️ **Solar Supernova** (*Radiant Aura Lv 5 + Might*): Pulso solar cataclísmico com alcance expandido (8.5m), dano estelar massivo (110 dano base) e anel flamejante de alta opacidade.
  - 🗡️ **Thousand Shadow Blades** (*Dagger Throw Lv 5 + Swiftness*): Tempestade contínua em espiral giratória de 360° com 8 adagas sombrias simultâneas, penetração e alta taxa de crítico.
- [x] **Cartas de Evolução Lendárias no Level Up & Baús (`LevelUpMenu.ts`, `menu.css`, `TreasureChestModal.ts`)**:
  - Detecção automática de armas no nível máximo combinadas a passivas adquiridas (`getEligibleEvolutions`).
  - Card de evolução com borda dourada cintilante, pulso luminoso e badge especial `[👑 EVOLUTION]`.
  - Baús de Tesouro garantem a evolução prioritariamente quando o jogador possui os requisitos.
- [x] **Sistema de Acertos Críticos & Knockback (`CombatSystem.ts`, `Enemy.ts`)**:
  - Cálculo de acertos críticos com base de 5% (+15% para o Ladino Kage), causando 2.0x de dano.
  - Inimigos recebem impulso de repulsão (*knockback*) escalonado por resistência de arquétipo ao serem atingidos por armas evoluídas.
- [x] **Números de Dano Flutuantes Zero-GC (`DamageNumberSystem.ts`, `hud.css`)**:
  - Pool pré-alocado de 60 nós DOM com projeção matemática 3D para tela (`camera.project()`) sem alocações de lixo no loop.
  - Tipografia de alto impacto com cores dinâmicas: Ciano (Magia), Dourado (*CRIT!* e Dano Sagrado), Púrpura (Lâminas), Vermelho (Dano recebido pelo Herói) e Verde esmeralda (Cura de poções `+30 HP`).
  - Alternância rápida para ligar/desligar Números de Dano no Menu de Opções (`SettingsMenu.ts`).

### Milestone 14 — EPIC BOSS ENCOUNTERS, TELEGRAPH DECALS, BOSS HEALTH BAR & RADAR MINIMAP (Concluída)
- [x] **Chefes Épicos Artesanais (`bossConfig.ts`, `Boss.ts`)**:
  - 🌋 **Gorgonath, the Earthbreaker** (Mid-Boss aos 150s): Colosso de rocha vulcânica e magma com 2400 HP, golpe de impacto circular sísmico (*Earth Shatter*) e investida retangular devastadora (*Titan Charge*).
  - 💀 **Malakor, the Shadow Overlord** (Final Boss aos 260s): Senhor das chamas do vazio com 4800 HP, asas de fogo estelares, chifres de obsidiana, rajada radial de fogo infernal (*Radial Hellfire*) e anel de destruição cósmica (*Cataclysm Ring*).
  - Máquina de estados de IA desacoplada (`chase` $\rightarrow$ `telegraphing` $\rightarrow$ `executing` $\rightarrow$ `recovery`) e imunidade total a efeitos de empurrão / crowd-control.
- [x] **Sistema de Telegraphs no Chão Zero-GC (`TelegraphSystem.ts`)**:
  - Decais tridimensionais planos pré-alocados no chão (`RingGeometry`, `CircleGeometry`, `PlaneGeometry`) sem alocação dinâmica.
  - Preenchimento progressivo e pulso de perigo avermelhado indicando o tempo de carga e área de impacto exata das habilidades dos chefes antes da detonação.
- [x] **Barra de Vida de Chefe no HUD (`HUD.ts`, `hud.css`)**:
  - Exibição imponente na parte superior da tela com nome estilizado, subtítulo titânico, badge `[BOSS]` e trilha de vida com preenchimento em gradiente vermelho-dourado e contagem numérica de HP.
- [x] **Minimapa Radar & Rastreadores de Ameaça Fora de Tela (`RadarSystem.ts`, `hud.css`)**:
  - Radar circular estilizado de 140px no canto inferior direito exibindo posição do herói, limites da arena, inimigos elites, baús/poções e pulso luminoso do chefe ativo.
  - Indicadores flutuantes na borda da tela com distância em metros (`💀 35m`) apontando para o chefe quando ele está fora do campo de visão da câmera.
- [x] **Recompensas Lendárias de Derrota**:
  - Derrotar um chefe concede explosão massiva de partículas, Baú de Tesouro garantido, gemas douradas de 1000 XP e drop de arena.

### Milestone 15 — MULTI-STAGE BIOME SYSTEM, STAGE SELECTION MENU, ENVIRONMENTAL BREAKABLES & AMBIENT WEATHER / AUDIO (Concluída)
- [x] **Sistema Multi-Estágios & Biomas Únicos (`src/config/stageConfig.ts`)**:
  - 🌿 **Verdant Citadel (Estágio 1)**: Prado verdejante de ruínas antigas, flores silvestres, cogumelos luminosos e vegetação viçosa (Dificuldade Padrão).
  - 🌋 **Infernal Caldera (Estágio 2)**: Caldeira vulcânica de basalto negro, veios incandescentes de magma, cinzas no ar, +20% de velocidade dos inimigos e +30% de recompensa em ouro. Desbloqueado ao sobreviver 3 minutos na Verdant Citadel.
  - ❄️ **Glacial Crypts (Estágio 3)**: Criptas congeladas de permafrost, pilares de gelo ciano luminescentes, nevasca contínua, +30% de HP dos inimigos e +25% de bônus de XP. Desbloqueado ao sobreviver 3 minutos na Infernal Caldera.
- [x] **Menu de Seleção de Biomas & Estágios (`StageSelectMenu.ts`, `MainMenu.ts`, `menu.css`)**:
  - Interface visual imponente com cards dedicados para cada bioma, ícones temáticos, badges de perigo, tags com multiplicadores de risco/recompensa, condições de desbloqueio e recordes pessoais salvos (Tempo Sobrevivido, Kills e Badge de Vitória 🏆).
  - Fluxo integrado e coeso: `Menu Principal` $\rightarrow$ `Seleção de Personagem` $\rightarrow$ `Seleção de Estágio` $\rightarrow$ `Início da Partida`.
- [x] **Mutação de Bioma em Tempo de Execução com Zero-GC (`Ground.ts`, `Lighting.ts`, `ArenaBounds.ts`, `PropBuilder.ts`, `World.ts`)**:
  - Reutilização inteligente de buffers de vértices de `PlaneGeometry` via `applyBiomeColors()`, repintando o piso com paletas e padrões de ladrilho procedurais específicos de cada bioma sem alocar geometrias novas.
  - Ajuste dinâmico de iluminação atmosférica e cor do céu em `Lighting.applyBiomeLighting()`, e recoloração de muretas e pilares em `ArenaBounds.applyBiomeMaterials()`.
  - Geração procedural de cenografia instanciada (`PropBuilder.buildForBiome()`) com árvores de magma, rochas pontiagudas de basalto, pilares de gelo e cristais de geada.
- [x] **Objetos Destrutíveis de Arena & Drops Extras (`BreakableProp.ts`, `DestructibleSystem.ts`)**:
  - Objetos ambientais 3D temáticos espalhados pela arena: Vasos de cerâmica na Cidadela, Barris reforçados na Caldeira e Cristais de gelo nas Criptas.
  - Destruição interativa através do impacto de projéteis ou proximidade da Aura Sagrada / Supernovas.
  - Recompensas instantâneas ao quebrar: moedas de ouro (+8 a 18🪙), corações de cura (+15 HP com número flutuante verde) e gemas bônus de experiência verde.
  - Efeitos de estilhaços tridimensionais coloridos e sistema de respawn gradual respeitando distância segura do herói.
- [x] **Simulação de Clima Atmosférico com Partículas Zero-GC (`ParticleSystem.ts`, `GameScene.ts`)**:
  - Emissão contínua de fagulhas e cinzas incandescentes ascendentes (`emitAmbientEmbers`) no bioma vulcânico.
  - Tempestade de neve com flocos ciano flutuando suavemente com vento lateral (`emitAmbientSnow`) no bioma glacial.
- [x] **Áudio Procedural & Drones de Bioma Web Audio API (`SoundManager.ts`)**:
  - Trilha sonora procedural contínua com sintetizador aditivo em tempo real gerando drones atmosféricos harmônicos para cada bioma (harmônicos quentes para prado, ressonância profunda e crepitação para vulcão, sub-graves eufônicos gelados para as criptas).
  - Efeitos sonoros dedicados para quebra de cerâmica, impacto em madeira e despedaçamento de gelo cristalino.
- [x] **Persistência de Recordes e Desbloqueios por Estágio (`metaConfig.ts`, `MetaManager.ts`)**:
  - Armazenamento independente de melhor tempo, maior contagem de abates e status de vitória para cada um dos 3 biomas com sincronização no `localStorage`.
- [x] **Enriquecimento Visual do Mapa & Santuário Central (`PropBuilder.ts`, `Ground.ts`, `World.ts`, `stageConfig.ts`)**:
  - **Santuário Central**: Estrutura circular sagrada no centro da arena com dais de pedra esculpida, anel rúnico brilhante e 4 tochas ancestrais com chamas crepitantes temáticas.
  - **Trilhas e Caminhos**: Estradas de lajotas e pedras rústicas irradiando do centro para as bordas.
  - **Arbustos Volumosos Low-Poly**: Moitas densas espalhadas pelos cenários adicionando volume e cor.
  - **Arcos em Ruínas & Vents Vulcânicos**: Monumentos arquitetônicos detalhados específicos de cada bioma.
  - **Neblina Atmosférica de Profundidade (`THREE.FogExp2`)**: Efeito de névoa e cor de horizonte correspondente para cada bioma.
- [x] **Otimizações de Performance Zero-GC & Física O(N) (`EnemyMovementSystem.ts`, `ExperienceSystem.ts`)**:
  - Grade de Particionamento Espacial Zero-GC reduzindo a repulsão de multidão de $O(N^2)$ para $O(N)$ (ganho de mais de 50x em CPU para centenas de inimigos).
  - Consolidação de gemas distantes acima de 300 unidades preservando 100% do XP e mantendo taxa de quadros a 144 FPS.
- [x] **Correção de Softlock de Baú & Padronização de Menu (`TreasureChestModal.ts`, `MainMenu.ts`, `menu.css`)**:
  - Correção na chamada do callback de resgate de tesouro (`onClaimCallback`) e suporte a atalhos de teclado (Enter / Espaço).
  - Padronização da largura dos botões do Menu Principal para 340px uniforme.




