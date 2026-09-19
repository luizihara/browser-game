# AGENTS.md — Diretrizes e Arquitetura para Agentes de IA

Este documento serve como referência técnica e guia de conduta para qualquer agente autônomo de inteligência artificial ou desenvolvedor que realize modificações, adições ou refatorações neste repositório.

---

## 1. Visão Geral do Jogo

O projeto é um jogo 3D para navegador do gênero **survivor / bullet heaven** (inspirado na mecânica de jogabilidade de *Vampire Survivors*), implementado com **Three.js**, **TypeScript** e **Vite**.

Futuramente o jogo terá:
- Centenas de inimigos simultâneos na tela se movendo em direção ao jogador;
- Armas com disparo e ataques automáticos;
- Coleta de experiência, evolução de níveis e escolha de upgrades;
- Curva progressiva de dificuldade por tempo (Director).

Portanto, **toda decisão técnica tomada no presente deve permitir essa escala sem exigir reescritas completas**.

---

## 2. Visão Arquitetural e Princípios Centrais

1. **Responsabilidade Única (Single Responsibility Principle)**:
   - Cada classe tem uma única razão para mudar.
   - Entidades (`Player`, `Enemy`) apenas representam dados e malhas 3D.
   - Controladores (`PlayerController`) interpretam comandos e aplicam física/cinemática.
   - Sistemas (`InputSystem`) capturam e abstraem eventos do navegador.
   - Cenas (`GameScene`) orquestram o ciclo de vida dos seus atores.
   - `Game.ts` atua apenas como coordenador geral.

2. **Desacoplamento de Input**:
   - Nenhuma entidade deve escutar diretamente eventos de DOM/Window (`keydown`, `keyup`, etc.).
   - O `InputSystem` mapeia teclas físicas para `InputAction` conceituais.

3. **Tempo e Delta Time Estrito**:
   - Toda alteração cinemática (movimento, rotação, cooldown, timers) **obrigatoriamente** multiplica por `deltaTime`.
   - Nunca utilizar valores fixos por frame (ex: `pos += 0.1` é terminantemente proibido).
   - O tempo é centralizado em `src/core/Time.ts` com proteção de teto (`GAME_CONFIG.maxDeltaTime`).

4. **Zero Garbage Collection no Game Loop**:
   - O método `update()` é chamado 60–144 vezes por segundo.
   - Não crie novas instâncias de `THREE.Vector3`, matrizes ou objetos descartáveis dentro do loop.
   - Guarde variáveis auxiliares como propriedades privadas reutilizáveis na classe.

5. **Interface desacoplada (HTML/CSS Overlays)**:
   - Toda UI (menus, HUD, overlays) reside em elementos DOM sobre o canvas (`#ui-root`).
   - Não renderize texto ou interface 2D no canvas WebGL a menos que seja um elemento intra-mundo (ex: barra de vida de inimigo via sprite se necessário).
   - Atualize nós do DOM existentes (`textContent`, `style.width`), nunca recrie o DOM a cada frame.

---

## 3. Mapeamento de Diretórios

```
src/
├── camera/      # Câmera e controladores de acompanhamento
├── config/      # Constantes de configuração centralizadas (sem magic numbers)
├── core/        # Game, GameLoop, Renderer, Time
├── entities/    # Classes base e entidades do jogo (Player, etc.)
├── loaders/     # Carregamento assíncrono e cache de assets
├── scenes/      # Scene interface, SceneManager e cenas do jogo
├── styles/      # Arquivos CSS modulares (global, hud, menu)
├── systems/     # Sistemas independentes (InputSystem, etc.)
├── types/       # Tipagens e interfaces globais
└── utils/       # Funções utilitárias (matemática, debug)
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
