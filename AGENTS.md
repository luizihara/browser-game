# AGENTS.md — Diretrizes e Arquitetura para Agentes de IA

Este documento serve como referência técnica e guia de conduta para qualquer agente autônomo de inteligência artificial ou desenvolvedor que realize modificações, adições ou refatorações neste repositório.

---

## 1. Visão Geral do Jogo

O projeto é um jogo 3D para navegador do gênero **survivor / bullet heaven** (inspirado na mecânica de jogabilidade de *Vampire Survivors*), implementado com **Three.js**, **TypeScript** e **Vite**.

O jogo conta com:
- Jogador em 3D movimentando-se em arena fechada com câmera suave e colisão perimetral;
- Inimigos múltiplos simultâneos com 7 arquétipos distintos em primitivas 3D (*Stalker, Skitterer, Brute, Goliath Elite, Arcane Cultist, Bone Shaman, Volatile Crawler*);
- Curva progressiva de dificuldade por tempo e ondas gerenciadas por Diretor de Jogo (*DirectorSystem*);
- Titãs Elites com auréola dourada e eventos periódicos de cerco/enxame com banner animado de alerta no HUD;
- Arsenal expansivo com até 4 armas simultâneas dentre 6 disponíveis (*Magic Wand, Guardian Orbs, Radiant Aura, Dagger Throw, Thunder Hammer, Alchemist Flask*) com 5 níveis de poder independentes e efeitos elementais (queimadura, lentidão, choque em cadeia);
- Coleta de gemas de experiência multi-tier (Verde, Azul, Dourada), curva exponencial de níveis, HUD de progresso e escolha de upgrades dinâmicos com deckbuilding tático (*Reroll, Skip, Banish*) via modal de Level Up;
- Relíquias de Taberna (`RelicSystem`, `relicConfig.ts`): até 3 relíquias ancestrais passivas equipadas simultaneamente com efeitos de impacto e sinergias;
- Quadro de Caçadas e Conquistas da Guilda (`BountyBoardMenu`, `achievementConfig.ts`): 16 desafios com recompensas em ouro, toasts animados e persistência;
- Efeitos sonoros procedurais nativos via Web Audio API (disparos, impactos, mortes, gemas, level up, alertas de onda, relâmpagos, poções, fanfarras, game over);
- Sistema de partículas Zero-GC (`ParticleSystem`) com shaders GLSL e pooling de buffer para faíscas de impacto, explosões radiais, raios e fonte de level up;
- Hit-flash em inimigos ao sofrerem dano e trauma-based screen shake na câmera (`CameraController`);
- Física de separação de corpos rígidos e crowd separation Zero-GC em `EnemyMovementSystem`, prevenindo sobreposição de corpos entre o jogador e as hordas;
- Direção de arte estilizada Low-Poly Toon com cel-shading discreto de 3 bandas (`ToonMaterialFactory`, `VISUAL_DIRECTION.md`), iluminação atmosférica suave, cenário com props instanciados ricos em detalhes (`PropBuilder`), herói Chibi com passada procedural e monstros com silhuetas caricatas bem definidas;
- Menu de Configurações (`SettingsMenu`, `settingsConfig.ts`) com controle de áudio, intensidade de trauma e flash de dano;
- Fluxo de Game Over e Vitória de Run (`VictoryMenu`, `metaConfig.ts`) com detalhamento de DPS por arma, recordes persistentes e acumulação de ouro;
- Modo Sobrevivência Sem Fim (Endless) e 6 Graus de Tormento selecionáveis (Normal a Tormento V) com escalonamento de dificuldade e recompensas;
- Loja de Power-ups Permanentes com Ouro (`MetaShopMenu`, `metaUpgradeConfig.ts`) com 8 atributos evolutivos e sistema de reembolso 100% gratuito (*respec*);
- Drops especiais 3D de arena (`PickupItem`, `PickupSystem`) com Baús de Tesouro (`TreasureChestModal`), Poções de Vida, Ímã Cósmico e Bomba Sacra;
- Seleção de Personagens e 4 Heróis Únicos (`CharacterSelectMenu`, `characterConfig.ts`, `CharacterBuilder.ts`): Sir Roderick (Cavaleiro), Elara (Maga), Kage (Ladino) e Aurelius (Templário), cada qual com modelo 3D low-poly próprio, arma inicial exclusiva, passivas e desbloqueio por ouro persistente no `MetaManager`;
- Super-Armas Evoluídas e Sinergias (`evolutionConfig.ts`, `WeaponSystem.ts`, `UpgradeSystem.ts`): 6 armas evoluídas lendárias (*Holy Astral Beam, Aegis Citadel, Solar Supernova, Thousand Shadow Blades, Storm Cataclysm, Midas Plague*) combinando armas Lv 5 com passivas adquiridas, disponíveis no modal de Level Up e Baús;
- Confrontos Épicos com Chefes, Decais de Telégrafo de Perigo e Radar Minimap (`bossConfig.ts`, `Boss.ts`, `TelegraphSystem.ts`, `RadarSystem.ts`, `HUD.ts`): Mid-Boss *Gorgonath the Earthbreaker* (150s) e Final Boss *Malakor the Shadow Overlord* (260s) com IA de máquina de estados, imunidade a knockback, telégrafos de solo pré-alocados para impactos circulares e investidas retangulares, barra de vida de chefe no HUD e minimapa radar com rastreador fora de tela;
- Sistema Multi-Estágios & Biomas Únicos (`stageConfig.ts`, `StageSelectMenu.ts`, `World.ts`, `Ground.ts`, `Lighting.ts`, `ArenaBounds.ts`, `PropBuilder.ts`): 3 biomas com paletas dinâmicas em tempo de execução (*Verdant Citadel*, *Infernal Caldera* com +20% velocidade e +30% ouro, *Glacial Crypts* com +30% HP e +25% XP), desbloqueios por tempo, recordes persistentes e mutação de vértices e iluminação Zero-GC;
- Objetos Destrutíveis de Arena & Drops Extras (`BreakableProp.ts`, `DestructibleSystem.ts`): Vasos de cerâmica, barris reforçados e cristais de gelo que quebram com projéteis ou pulsos de aura, liberando ouro, corações de cura e gemas bônus de XP;
- Clima Atmosférico Procedural e Áudio de Bioma (`ParticleSystem.ts`, `SoundManager.ts`): Fagulhas/cinzas vulcânicas ascendentes, tempestade de neve contínua, chuvas de meteoros ativas e sintetizador aditivo em tempo real de drones harmônicos para cada ambiente.

Portanto, **toda decisão técnica tomada no presente deve permitir essa escala sem exigir reescritas completas**.

---

## 2. Visão Arquitetural e Princípios Centrais

1. **Responsabilidade Única (Single Responsibility Principle)**:
   - Cada classe tem uma única razão para mudar.
   - Entidades (`Player`, `Enemy`, `Projectile`, `XpGem`, `SandboxDummy`) representam dados e malhas 3D.
   - `EntityManager` gerencia a coleção, ciclo de vida e renderização de entidades.
   - Controladores (`PlayerController`) interpretam comandos e aplicam cinemática.
   - Sistemas (`EnemyMovementSystem`, `EnemySpawner`, `DirectorSystem`, `CombatSystem`, `WeaponSystem`, `ExperienceSystem`, `UpgradeSystem`) cuidam de tarefas isoladas de IA, dificuldade por tempo, combate, drops de XP e progressão.
   - Armas (`Weapon`, `ProjectileWeapon`, `OrbitalWeapon`, `AuraWeapon`, `DaggerWeapon`) contêm regras de busca de alvo, disparos, rotação orbital e pulsos de área.
   - O mundo (`World`, `ArenaBounds`) delimita o espaço e iluminação.
   - Cenas (`GameScene`) orquestram seus atores.
   - `Game.ts` atua apenas como coordenador geral.

2. **Desacoplamento de Input**:
   - Nenhuma entidade deve escutar diretamente eventos de DOM/Window (`keydown`, `keyup`, etc.).
   - O `InputSystem` mapeia teclas físicas para `InputAction` conceituais.
   - O ataque é **100% automático**; o jogador apenas se movimenta.

3. **Tempo e Delta Time Estrito**:
   - Toda alteração cinemática (movimento, rotação, cooldown, timers, tempo de vida de tiros, órbitas de armas) **obrigatoriamente** multiplica por `deltaTime`.
   - Nunca utilizar valores fixos por frame (ex: `pos += 0.1` é terminantemente proibido).
   - O tempo é centralizado em `src/core/Time.ts` com proteção de teto (`GAME_CONFIG.maxDeltaTime`).

4. **Zero Garbage Collection no Game Loop**:
   - O método `update()` é chamado 60–144 vezes por segundo com centenas de entidades.
   - Não crie novas instâncias de `THREE.Vector3`, matrizes ou objetos descartáveis dentro do loop.
   - Guarde variáveis auxiliares como propriedades privadas reutilizáveis na classe.
   - O `EntityManager` realiza iterações indexadas padrão e remoções O(1) via swap-and-pop.
   - `EnemyMovementSystem`, `CombatSystem`, `ProjectileWeapon`, `OrbitalWeapon`, `AuraWeapon`, `DirectorSystem` e `ExperienceSystem` calculam distâncias e probabilidades puramente com escalares primitivos, sem instanciar vetores temporários.

5. **Interface desacoplada (HTML/CSS Overlays)**:
   - Toda UI (menus, HUD, banners de alerta, pause, level up com badges, game over) reside em elementos DOM sobre o canvas (`#ui-root`).
   - Não renderize texto ou interface 2D no canvas WebGL a menos que seja um elemento intra-mundo.
   - Atualize nós do DOM existentes (`textContent`, `style.width`), nunca recrie o DOM a cada frame.

---

## 3. Mapeamento de Diretórios

```
src/
├── art/         # Construtores de arte estilizada, paleta e ToonMaterialFactory
├── audio/       # Gerenciador de áudio procedural e sintetizador Web Audio API
├── camera/      # Câmera e controladores de acompanhamento com screen shake
├── config/      # Constantes de configuração centralizadas (sem magic numbers)
├── core/        # Game, GameLoop, Renderer, Time
├── entities/    # Classes base, EntityManager e entidades (Player, Enemy, Projectile, XpGem, PickupItem, BreakableProp, Boss, SandboxDummy)
├── fx/          # Sistema de partículas Zero-GC, shaders visuais e DamageNumberSystem
├── loaders/     # Carregamento assíncrono e cache de assets
├── scenes/      # Scene interface, SceneManager e cenas do jogo
├── styles/      # Arquivos CSS modulares (global, hud, menu, level-up)
├── systems/     # Sistemas independentes (InputSystem, EnemyMovementSystem, EnemySpawner, DirectorSystem, CombatSystem, WeaponSystem, ExperienceSystem, UpgradeSystem, PickupSystem, DestructibleSystem, TelegraphSystem, RadarSystem)
├── types/       # Tipagens e interfaces globais
├── ui/          # Overlays DOM (HUD, PauseMenu, GameOverMenu, LevelUpMenu, SettingsMenu, VictoryMenu, MetaShopMenu, CharacterSelectMenu, StageSelectMenu, TreasureChestModal)
├── utils/       # Funções utilitárias (matemática, debug)
└── weapons/     # Interface Weapon e implementações (ProjectileWeapon, OrbitalWeapon, AuraWeapon, DaggerWeapon)
```

---

## 4. Regras Obrigatórias para Agentes de IA

## Rules for AI Agents

1. **Leia este arquivo antes de modificar código.** Compreenda o contexto arquitetural antes de alterar qualquer arquivo.
2. **Não reestruture o projeto inteiro sem necessidade.** Respeite o design estabelecido e a divisão de módulos.
3. **Não adicione dependências sem justificar.** O bundle e o ecossistema Three.js nativo devem ser priorizados.
4. **Não implemente funcionalidades que não foram solicitadas.** Se a tarefa é sobre um ajuste de câmera, não adicione armas ou inimigos.
5. **Mantenha mudanças pequenas.** Mudanças atômicas, incrementais e fáceis de auditar.
6. **Preserve a separação de responsabilidades.** Não junte input, áudio, render e física na mesma classe.
7. **Não coloque lógica de gameplay em `main.ts`.** O `main.ts` deve apenas instanciar e iniciar `Game`.
8. **Não acople input diretamente às entidades.** Sempre use `InputSystem` ou abstrações equivalentes.
9. **Use delta time.** Movimentação baseada em frame é proibida.
10. **Evite magic numbers.** Constantes de velocidade, tamanhos e cores pertencem aos arquivos em `src/config/`.
11. **Execute `npm run build` antes de considerar uma tarefa concluída.** Garanta que o compilador TypeScript e o bundler passem com zero erros.
12. **Corrija erros TypeScript.** O uso de `any` é fortemente desencorajado; use tipagens estritas.
13. **Atualize a documentação quando a arquitetura mudar.** Mantenha `README.md` e `AGENTS.md` sincronizados com o código.
14. **Não crie abstrações especulativas.** Crie padrões quando houver demanda concreta, evitando overengineering.
15. **Performance importa porque futuramente existirão centenas de entidades.** Evite alocações no loop e custos O(N²) desnecessários.
16. **Prefira código simples a código excessivamente inteligente.** A legibilidade e a previsibilidade superam truques complexos.
17. **Antes de criar algo novo, procure se já existe solução equivalente no projeto.** Reutilize classes e utilitários existentes.
18. **Não duplicar lógica.** Extraia funções puras para `utils/` ou componentes dedicados.
19. **Não alterar comportamento existente sem necessidade.** Garanta retrocompatibilidade de funcionalidades já aceitas.
20. **Sempre verificar o impacto da mudança em outras partes do jogo.** Garanta que transições de cena, resize, pause e HUD continuem íntegros.

---

## 5. Como Executar e Validar

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Checagem completa de tipos TypeScript e Build de Produção
npm run build
```
O build deve terminar com código de saída 0 e sem warnings de tipagem.
