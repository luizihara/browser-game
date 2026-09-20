# DESIGN SYSTEM — LOW-POLY TOON SURVIVOR

Documento mestre e especificação oficial do Design System da interface (UI), menus, HUD e componentes visuais do jogo.

---

# Current UI Design System

*Auditoria técnica do estado atual da interface antes da migração.*

## Arquitetura de Arquivos e Componentes

A interface é implementada como camadas DOM HTML/CSS desacopladas sobre o canvas WebGL (`#ui-root`):

- **Estilos Globais**: `src/styles/global.css` (reset CSS, viewport container, `#ui-root`, regras básicas de canvas e tipografia do sistema).
- **Estilos de HUD & Combate**: `src/styles/hud.css` (barra de XP horizontal superior, contêiner de HP, badge de nível, contador de abates, cronômetro, debug dev, banner de alerta de ondas, barra de vida de chefes, minimapa radar, ponteiros de perigo e floating damage numbers).
- **Estilos de Menus e Modais**: `src/styles/menu.css` (1.138 linhas abrangendo MainMenu, PauseMenu, SettingsMenu, GameOverMenu, VictoryMenu, LevelUpMenu, MetaShopMenu, CharacterSelectMenu, StageSelectMenu e TreasureChestModal).
- **Componentes TypeScript**:
  - `src/ui/MainMenu.ts`
  - `src/ui/PauseMenu.ts`
  - `src/ui/HUD.ts`
  - `src/ui/SettingsMenu.ts`
  - `src/ui/GameOverMenu.ts`
  - `src/ui/LoadingScreen.ts`
  - `src/ui/LevelUpMenu.ts`
  - `src/ui/VictoryMenu.ts`
  - `src/ui/MetaShopMenu.ts`
  - `src/ui/CharacterSelectMenu.ts`
  - `src/ui/StageSelectMenu.ts`
  - `src/ui/TreasureChestModal.ts`

---

## Mapeamento de Tokens Atuais (Valores Reais Encontrados)

> [!WARNING]
> **Ausência Completa de Tokens CSS Centralizados**: Atualmente **não existe** nenhum bloco `:root` com variáveis CSS nem em `global.css`, nem em `menu.css`, nem em `hud.css`. Todas as cores, espaçamentos, raios e sombras estão codificados como literais *ad-hoc* diretamente nas regras CSS.

### Colors

*Valores reais extraídos do código:*

| Categoria Token | Valores Literais Encontrados no Código | Ocorrências Típicas |
| :--- | :--- | :--- |
| **Background Primary** | `rgba(15, 23, 42, 0.92)`, `rgba(15, 23, 42, 0.96)`, `#0d0f12` | `.overlay-screen`, body, panels base |
| **Background Secondary** | `rgba(30, 41, 59, 0.95)`, `rgba(30, 41, 59, 0.8)`, `#1e293b` | `.settings-panel`, `.shop-card`, `.char-card` |
| **Panel Surface** | `#0f172a`, `rgba(15, 23, 42, 0.82)`, `rgba(30, 41, 59, 0.7)` | `.hud-hp-container`, `.victory-stat-box`, `.chest-panel` |
| **Primary (Ação / Start)**| `linear-gradient(135deg, #ef4444, #f97316)`, `#ef4444`, `#dc2626` | `.menu-button`, botões primários |
| **Secondary (Neutro)** | `#334155`, `#475569`, `#1e293b` | `.menu-button.secondary`, `.settings-toggle-btn` |
| **Accent / Dourado** | `#f59e0b`, `#fbbf24`, `#facc15`, `#fde047`, `#d97706` | Títulos, badges, ouro de meta-progresso |
| **Accent / Ciano & Azul**| `#38bdf8`, `#3b82f6`, `#60a5fa`, `#06b6d4` | `.shop-stat-val`, seleção de personagens, atalhos |
| **Text Primary** | `#ffffff`, `#f8fafc`, `#f1f5f9` | Títulos, textos principais |
| **Text Secondary** | `#cbd5e1`, `#94a3b8`, `#64748b` | Descrições, subtítulos, labels |
| **Danger** | `#ef4444`, `#dc2626`, `#f87171`, `#b91c1c` | Game Over, alertas de elite, dano do herói |
| **Success** | `#10b981`, `#34d399`, `#4ade80`, `#86efac` | Barra de XP, curas, pips de upgrade cheios |
| **Warning** | `#f59e0b`, `#fbbf24` | Alertas de wave, destaques de ouro |

---

### Typography

- **font-family**:
  - Global / Menus: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` (pilha de fontes de sistema genérica).
  - Valores Numéricos / Debug / Atalhos: `ui-monospace, monospace` (utilizado em cronômetros, registros, dano e ranks).
  - Damage Numbers: `'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (sem fonte importada).
- **font-size & hierarchy**:
  - *Game Title*: `3.2rem` a `3.6rem` (900 weight, letter-spacing `0.12em` a `0.14em`, uppercase).
  - *Screen Title / Modais*: `2.2rem` a `3.4rem` (900 weight, letter-spacing `0.1em`).
  - *Section Title*: `0.85rem` a `1.3rem` (800 weight, uppercase, letter-spacing `0.06em` a `0.08em`).
  - *Button Label*: `1.3rem` no menu principal (`0.82rem` a `0.95rem` em botões de cartas).
  - *Body / Descriptions*: `0.74rem` a `0.98rem` (line-height `1.3` a `1.45`).
  - *Labels*: `0.72rem` a `0.85rem` (800 weight, uppercase, letter-spacing `0.08em`).
  - *HUD Numbers*: `1.15rem` (kills) e `1.55rem` (timer), `font-variant-numeric: tabular-nums`.

---

### Spacing

Não há escala modular; os valores variam de forma fragmentada:
- Padding de botões: `0.95rem 2.8rem`, `0.45rem 0.9rem`, `0.55rem 0`, `0.4rem 0.85rem`.
- Padding de painéis: `1.8rem 2.2rem`, `2.25rem 2.75rem`, `2rem 2.5rem`.
- Gaps de grids: `0.35rem`, `0.5rem`, `0.85rem`, `1rem`, `1.1rem`, `1.2rem`, `1.6rem`.

---

### Borders & Radius

- **border-width**:
  - `1px solid rgba(255, 255, 255, 0.12)` (bordas finas translúcidas estilo web moderna).
  - `2px solid rgba(148, 163, 184, 0.35)` e `2px solid #fbbf24`.
  - `3px solid #ef4444` e `3px solid #f59e0b`.
- **border-radius**:
  - `6px` a `8px`: tags, badges e barras finas.
  - `10px` a `12px`: contêineres de HUD e botões.
  - `14px` a `16px`: cartas de upgrade, seleção de heróis e estágios.
  - `20px`: todos os painéis modais (`.settings-panel`, `.victory-panel`, `.shop-panel`, `.chest-panel`, `.char-select-panel`).
  - `9999px` (pill-shape): badges de status, chips de armas, registros do menu principal e display de ouro.

---

### Shadows & Glows

- **box-shadow**:
  - Sombras difusas estilo web/SaaS: `0 10px 25px rgba(0, 0, 0, 0.55)`, `0 15px 45px rgba(0, 0, 0, 0.8)`, `0 12px 35px rgba(0, 0, 0, 0.65)`, `0 6px 16px rgba(0, 0, 0, 0.45)`.
  - Efeitos de brilho (glow) neon intensos: `0 0 25px rgba(56, 189, 248, 0.35)`, `0 0 35px rgba(250, 204, 21, 0.75)`, `0 0 40px rgba(245, 158, 11, 0.7)`.
  - Apenas `.menu-button` utiliza sombra de relevo (`0 5px 0 #b91c1c`), porém acompanhada de glow suave (`0 8px 20px rgba(239, 68, 68, 0.4)`).
- **text-shadow**:
  - Títulos com difusão: `0 4px 25px rgba(239, 68, 68, 0.6)`.
  - Floating damage numbers: contorno artificial de 4 cantos (`-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000...`).

---

### Effects & Glassmorphism

- **Backdrop Filters**:
  - `backdrop-filter: blur(10px)` em `.overlay-screen`.
  - `backdrop-filter: blur(8px)` em blocos de HUD (`.hud-hp-container`, `.hud-kills-container`, `.hud-timer-container`, `.hud-debug-container`).
- **Gradients**:
  - Frequente uso de texto com gradiente e clipping WebKit (`-webkit-background-clip: text; -webkit-text-fill-color: transparent;`) em quase todos os títulos.
  - Gradientes azul/roxo e esmeralda/ciano (`#10b981` -> `#34d399` -> `#06b6d4`).

---

## Generic / AI-looking UI Patterns

A análise detalhada da interface atual identificou os seguintes padrões genéricos e sintomáticos de interfaces de IA / SaaS Dashboard:

1. **Glassmorphism Excessivo (`backdrop-filter: blur`)**:
   - Praticamente todo overlay, modal e bloco do HUD usa fundo semitransparente escuro com desfoque de fundo. Isso pertence à linguagem de sistemas operacionais modernos e dashboards web, contrastando negativamente com o estilo 3D low-poly cartoon do jogo.
2. **Paleta Padrão de "Dashboard Dark Mode"**:
   - Predomínio absoluto dos tons Slate (`#0f172a`, `#1e293b`, `#334155`, `#94a3b8`) oriundos do Tailwind CSS. Embora limpos, faltam calor, materialidade e identidade de jogo de fantasia/arcade.
3. **Texto com Gradiente Recortado (-webkit-background-clip)**:
   - Presente em `.screen-title`, `.game-over-title`, `.levelup-title`, `.victory-title`, `.shop-title`, `.char-select-title`. Essa técnica é a marca registrada de landing pages e templates de IA, carecendo do peso, borda sólida e extrusão de um autêntico título de videogame.
4. **Cards Dentro de Cards (Over-nesting)**:
   - Telas como Character Select, Stage Select e Meta Shop aninham:
     `Overlay` $\rightarrow$ `Modal Panel` $\rightarrow$ `Grid` $\rightarrow$ `Card` $\rightarrow$ `Passive Box` $\rightarrow$ `Badge` $\rightarrow$ `Action Button`.
     Esse excesso de retângulos translúcidos sobrepostos cansa a vista e dilui a hierarquia.
5. **Botões e Badges Pílula (border-radius: 9999px)**:
   - Badges como `.main-menu-records`, `.shop-gold-badge` e chips de armas usam `border-radius: 9999px`. Em jogos de fantasia e ação, pílulas suaves parecem tags de filtro de e-commerce ou chips de busca, não medalhões, pergaminhos ou insígnias.
6. **Sombras Suaves / Difusas de Web**:
   - Sombras com `0 15px 45px rgba(0,0,0,0.8)` geram a sensação de elementos web "flutuando no ar", perdendo a oportunidade de criar profundidade gráfica tátil com sombras sólidas de desenho cartoon (`box-shadow: 4px 4px 0 #0a0d14`).
7. **Bordas Translúcidas de 1px**:
   - O uso de `1px solid rgba(255, 255, 255, 0.12)` é típico de web design minimalista. Na estética toon, contornos contrastantes e escuros definem as silhuetas de forma muito mais expressiva.

---

# Target UI Design System

*Direção visual oficial para a nova interface.*

## Conceito Principal: Low-Poly Toon Fantasy Arcade

A interface deve parecer parte integrante do mundo 3D do jogo:
- **Estilizada, sólida, artesanal e com personalidade de videogame comercial indie.**
- Inspirada em jogos como *Brawl Stars*, *Hades*, *Enter the Gungeon* e *Vampire Survivors*: blocos marcados, chanfros, placas resistentes, bordas escuras contrastantes, sombras sólidas projetadas e feedback táctil imediato.
- **Não infantil**: nada de cores caóticas descontroladas ou Comic Sans; o visual é maduro, polido e legível.

## Princípio Visual: "UI de Videogame, não UI de Aplicação Web"

| Aspecto | UI de Web / Dashboard (Atual) | UI de Videogame (Nova) |
| :--- | :--- | :--- |
| **Materialidade** | Vidro translúcido, blur de fundo | Placas sólidas, relevo de pedra, metal ou madeira estilizada |
| **Bordas** | 1px semitransparente branca | 2px a 4px sólidas, escuras/tintadas com contorno nítido |
| **Sombras** | Difusas, grandes raios de desfoque | Gráficas, sólidas, deslocadas (`3px 4px 0 ...`) |
| **Botões** | Planos ou com gradiente flutuante | Peças físicas com chanfro, borda escura e afundamento real ao clique |
| **Títulos** | Texto com gradiente recortado de web | Letras com peso, contorno escuro marcante e sombra gráfica |
| **Containers** | Cards aninhados em cascata | Painéis sólidos unificados com divisores limpos |
| **Badges** | Pílulas arredondadas 9999px | Brasões, losangos ou placas retangulares chanfradas |

---

## Paleta Centralizada e Tokens CSS

```css
:root {
  /* --- Cores de Fundo e Superfície --- */
  --color-bg-overlay: rgba(10, 13, 20, 0.94);
  --color-surface: #1a2233;
  --color-surface-dark: #121824;
  --color-surface-raised: #242f46;
  --color-surface-highlight: #2f3d5a;

  /* --- Contornos e Sombras Gráficas --- */
  --color-outline: #090c13;
  --color-outline-light: #2d3b55;
  --shadow-solid: 4px 5px 0 var(--color-outline);
  --shadow-solid-sm: 2px 3px 0 var(--color-outline);
  --shadow-solid-lg: 6px 7px 0 var(--color-outline);
  --shadow-pressed: 1px 1px 0 var(--color-outline);

  /* --- Cores Primárias de Jogo (Sólidas e Toon) --- */
  --color-primary: #e63946;          /* Vermelho heróico para ação principal */
  --color-primary-light: #ff4d5a;
  --color-primary-dark: #b81d29;

  --color-gold: #ffb703;             /* Ouro nobre / Recompensas / Estrelas */
  --color-gold-light: #ffd166;
  --color-gold-dark: #cc8b00;

  --color-mana: #00b4d8;             /* Mana / Magia / Ciano vibrante */
  --color-mana-light: #48cae4;
  --color-mana-dark: #0077b6;

  --color-nature: #06d6a0;           /* Cura / XP Esmeralda */
  --color-nature-light: #2ef3be;
  --color-nature-dark: #048a66;

  --color-purple: #9d4edd;           /* Evoluções / Raro / Boss */
  --color-purple-light: #c77dff;
  --color-purple-dark: #7b2cbf;

  /* --- Cores Neutras e Texto --- */
  --color-text-main: #f8f9fa;
  --color-text-dim: #c5cbd3;
  --color-text-muted: #8892a0;

  /* --- Tipografia --- */
  --font-game: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;

  /* --- Escala de Espaçamento Modular --- */
  --space-2xs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* --- Bordas e Raios (Sutis e Marcados) --- */
  --border-width: 3px;
  --border-width-sm: 2px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* --- Sistema de Movimento Táctil --- */
  --ease-game: cubic-bezier(0.18, 0.89, 0.32, 1.28);
  --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-fast: 90ms;
  --motion-normal: 160ms;
  --motion-slow: 240ms;
}
```

---

## Componente Base: Botão Táctil de Videogame

O botão é o pilar estético da nova UI:
- Fundo colorido saturado com borda escura espessa (`3px solid var(--color-outline)`).
- Sombra sólida deslocada (`box-shadow: 0 6px 0 var(--color-primary-dark), 0 9px 0 var(--color-outline)`).
- Texto em caixa alta com espessura 800 e sombra de texto incisiva.
- **Interação Física**:
  - *Normal*: `transform: translateY(0)`
  - *Hover*: `transform: translateY(-2px)` com leve brilho e elevação da sombra.
  - *Active / Pressed*: `transform: translateY(4px)` com a sombra inferior comprimida a `0 2px 0`, transmitindo a sensação de um botão arcade afundando fisicamente.

---

## Componente Base: Painel Sólido com Moldura Toon

Elimina-se o `backdrop-filter: blur`. Em seu lugar:
- Superfície opaca ou semi-opaca densa (`background: var(--color-surface)`).
- Borda externa contrastante escura de 3px (`border: 3px solid var(--color-outline)`).
- Borda interna decorativa sutil (`box-shadow: inset 0 0 0 2px var(--color-outline-light)`).
- Sombra gráfica de conjunto: `box-shadow: var(--shadow-solid-lg)`.

---

## HUD: Legibilidade & Discrição

- Sem grandes caixas e sem blur: widgets individuais e compactos.
- Barra de XP contínua no topo com moldura chanfrada de 2px.
- Indicador de HP em placa firme com texto de alto contraste.
- Cronômetro e Kills em pequenas placas de metal escuro com texto legível tabular.
- Alert Banners com animação pop incisiva estilo banner de quadrinhos/arcade.

---

## UI Design Principles

1. **Game UI, not Web UI**: Toda decisão deve remeter a um jogo de console/arcade e nunca a um painel SaaS.
2. **Strong shapes over glassmorphism**: Formas geométricas sólidas e contornos fortes substituem vidros translúcidos.
3. **Solid colors over unnecessary gradients**: Cores sólidas bem contrastadas superam degradês genéricos.
4. **Borders are part of the visual language**: Bordas escuras e expressivas definem e recortam os componentes.
5. **Shadows should feel graphical rather than realistic**: Sombras sólidas deslocadas comunicam estilo toon com eficácia.
6. **Components should feel tactile**: Botões e seletores devem responder com física perceptível ao clique.
7. **Every visual effect needs a purpose**: Sem partículas, pulsações ou glows em elementos secundários.
8. **Gameplay readability always wins over decoration**: O HUD deve ser enxuto e nunca ofuscar a ação de combate.
9. **Avoid nested cards**: Agrupar informações com divisores ou espaçamentos em vez de empilhar caixas dentro de caixas.
10. **Avoid generic SaaS dashboard patterns**: Eliminar tags pílulas de 9999px e tabelas frias.
11. **UI must match the low-poly toon world**: A paleta e a simplicidade poligonal do cenário se estendem aos menus.
12. **Use consistent design tokens**: Todos os estilos devem consumir as variáveis centralizadas em `:root`.
13. **Prefer fewer stronger elements over many decorative ones**: Menos adereços redundantes; hierarquia limpa.
14. **Animation should reinforce interaction**: Transições rápidas e ágeis (90ms a 160ms); sem menus lentos.
15. **Do not redesign functionality while redesigning appearance**: Toda lógica, callback, atalho e fluxo permanecem rigorosamente intactos.

---

## Rules for AI Agents

1. **Leia este documento antes de criar qualquer UI.** Conheça os tokens e os padrões gráficos aprovados.
2. **Não invente novos estilos sem necessidade.** Reutilize os tokens e classes existentes.
3. **Reutilize tokens.** Jamais adicione cores hexadecimais literais soltas nas regras de componentes.
4. **Não introduza glassmorphism sem justificativa.** Evite `backdrop-filter: blur(...)`.
5. **Evite gradients genéricos.** Especialmente degradês azul/roxo e clipping de texto sem identidade.
6. **Não transforme todo elemento em card.** Reduza contêineres aninhados supérfluos.
7. **Não crie novos tipos de botão se o botão existente resolver.** Mantenha o padrão táctil do jogo.
8. **Preserve a linguagem low-poly/toon.** Coerência com a direção de arte do jogo.
9. **UI deve parecer videogame, não aplicação SaaS.** Sempre avalie o resultado visual sob essa premissa.
10. **Se precisar criar novo padrão visual, primeiro atualize o design system.** Documente tokens antes de codificar.
11. **Preserve acessibilidade.** Contraste cromático nítido, navegação por teclado e estados de foco.
12. **Preserve responsividade.** Garanta layout impecável em 16:9, 16:10, ultrawide e telas compactas.
13. **Preserve comportamento existente.** Nenhum callback, evento de teclado ou lógica de jogo pode ser alterado.
14. **Evite CSS duplicado.** Isole classes reutilizáveis e evite reescrever as mesmas regras em múltiplos arquivos.
15. **Não utilize efeitos meramente decorativos sem justificar.** O foco deve ser feedback e clareza.
