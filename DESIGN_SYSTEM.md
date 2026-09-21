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

*Direção visual oficial aprovada para o jogo: **Tavern Carved Wood & Iron Shield**.*

## Conceito Principal: Medieval Fantasy Tavern & Forged Iron

A interface pertence organicamente ao universo de fantasia medieval do jogo:
- **Madeira de Carvalho Escuro Entalhada, Ferro Forjado e Latão/Bronze Rebitado**: placas espessas, cantoneiras chanfradas com rebites, tábuas de taberna suspensas por correntes e relevos de entalhe em madeira.
- **Botões Tácteis em Pranchas de Madeira**: chanfros beveled em tons de carvalho e âmbar incandescente, afundamento mecânico físico no clique (`transform: translateY(5px)`) e sombreado de relevo.
- **Títulos em Ouro Envelhecido com Entalhe**: tipografia sólida em `'Russo One'` com sombreamento chiseled simulando letras fundidas em latão ou ouro cravadas na madeira.
- **HUD Temático de Taberna**: medidor de HP com poção rubi, canaleta chanfrada de XP em esmeralda/hidromel, brasão de madeira esculpida e placas rústicas com números em ouro reluzente.

## Princípio Visual: "UI de Videogame, não UI de Aplicação Web"

| Aspecto | UI de Web / Dashboard (Antiga) | UI de Videogame (Tavern Wood & Iron) |
| :--- | :--- | :--- |
| **Materialidade** | Vidro translúcido, blur de fundo | Carvalho escuro envelhecido, ferro forjado e rebites de bronze |
| **Bordas** | 1px semitransparente branca | 3px a 4px de ferro forjado escuro com chanfro interno de bronze |
| **Sombras** | Difusas, grandes raios de desfoque | Relevo mecânico sólido e sombras gráficas de peso físico |
| **Botões** | Planos ou com gradiente flutuante | Pranchas chanfradas de carvalho com rebites e afundamento real no clique |
| **Títulos** | Texto com gradiente recortado de web | Letras com peso chiseled, contorno escuro e ouro reluzente |
| **Containers** | Cards aninhados em cascata | Baús e gabinetes de carvalho maciço com dobradiças de ferro |
| **Badges** | Pílulas arredondadas 9999px | Placas de latão martelado, brasões entalhados e fitas de expedição |

---

## Paleta Centralizada e Tokens CSS

```css
:root {
  /* --- Superfícies de Madeira e Carvalho de Taberna --- */
  --tavern-wood-deep: #1b120c;
  --tavern-wood-dark: #2a1b12;
  --tavern-wood-base: #3e271c;
  --tavern-wood-warm: #543725;
  --tavern-wood-light: #734c34;
  --tavern-wood-plank: #8d5e41;

  /* --- Metais: Ferro Forjado e Latão/Bronze Rebitado --- */
  --tavern-iron-dark: #120e0a;
  --tavern-iron-base: #251d18;
  --tavern-iron-rim: #3d312a;
  --tavern-bronze-dark: #78350f;
  --tavern-bronze-base: #b45309;
  --tavern-gold-bright: #ffb703;
  --tavern-gold-light: #ffd166;
  --tavern-gold-dark: #cc8800;

  /* --- Cores de Ação de Fantasia (Ember Red, Mead Gold, Mystic Emerald, etc.) --- */
  --color-primary: #b91c1c;
  --color-primary-light: #dc2626;
  --color-primary-dark: #7f1d1d;

  --color-gold: #ffb703;
  --color-gold-light: #ffd166;
  --color-gold-dark: #b45309;

  --color-mana: #0284c7;
  --color-mana-light: #38bdf8;
  --color-mana-dark: #0369a1;

  --color-nature: #059669;
  --color-nature-light: #10b981;
  --color-nature-dark: #047857;

  --color-purple: #7c3aed;
  --color-purple-light: #a78bfa;
  --color-purple-dark: #5b21b6;

  /* --- Tipografia de Taberna Medieval --- */
  --font-game: 'Russo One', 'Rubik', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Cinzel', 'MedievalSharp', serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;

  --color-text-main: #fef3c7;
  --color-text-dim: #d4c5a9;
  --color-text-muted: #9c8b73;
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

## As 10 Opções Autorais de Menu (/1 a /10)

Para superar qualquer estética genérica de IA/SaaS, foram desenvolvidos 10 temas visuais artesanais com identidades gráficas radicais, acessíveis diretamente pelas URLs `/1` a `/10` ou através da barra de alternância superior no menu:

1. **`/1` — Arcade 16-Bit Pixel Brawler**:
   - *Estética*: Gabinete de fliperama coin-op dos anos 90.
   - *Tipografia*: `'Press Start 2P'`, monospace pixelada.
   - *Elementos*: Scanlines CRT sutis, bordas chanfradas em degraus de pixel, botões vermelhos/azuis arcade com sombra sólida escalonada e placa de high scores.
2. **`/2` — Dynamic Comic Book / Graphic Novel**:
   - *Estética*: Pop-art / história em quadrinhos de ação (*Hades*, *Hi-Fi Rush*).
   - *Tipografia*: `'Bangers'`, traço grosso e expressivo.
   - *Elementos*: Banners diagonais inclinados (`skewX(-8deg) rotate(-1.5deg)`), pontilhado halftone vermelho, bordas pretas de nanquim de 4px e estrelas de impacto.
3. **`/3` — Adventurer's Tome & Wax Seal**:
   - *Estética*: Grimório medieval / diário de expedição em mesa de carvalho.
   - *Tipografia*: `'MedievalSharp'`, caligrafia de escriba.
   - *Elementos*: Folha de pergaminho antigo com cantos arredondados, botões em formato de selo de cera carmesim/ouro com relevo e fita de registro.
4. **`/4` — Tavern Carved Wood & Iron Shield**:
   - *Estética*: Placa rústica de taberna em madeira entalhada (*Torchlight*, *Brawl Stars*).
   - *Tipografia*: `'Russo One'`.
   - *Elementos*: Pranchas de carvalho escuro com ranhuras, botões chanfrados em madeira com rebites de bronze e placa de ferro martelado.
5. **`/5` — Claymation / Plasticine Toy-Box**:
   - *Estética*: Universo tátil estilo massinha de modelar / argila esculpida.
   - *Tipografia*: `'Fredoka'`.
   - *Elementos*: Botões ultra-arredondados (`border-radius: 36px`) com relevo macio, indentação tátil ao clique, cores de brinquedo (rosa chiclete, ciano, amarelo) e sensação de afundamento de massinha.
6. **`/6` — Gothic Cathedral / Dark Soulslike**:
   - *Estética*: Dark fantasy sombrio (*Dark Souls*, *Castlevania*).
   - *Tipografia*: `'Cinzel'`, serifada imponente.
   - *Elementos*: Lápides de obsidiana fosca, bordas vermelho-sangue, brasão de caveira, sombras profundas e inscrições solenes.
7. **`/7` — Tactical War Table / Guild Cartographer**:
   - *Estética*: Mesa de estratégia militar e cartografia de guerra.
   - *Tipografia*: `'Special Elite'`, carimbo mecânico/máquina de escrever.
   - *Elementos*: Grade milimetrada de planejamento, botões em carimbo de despacho militar (`[MISSION: DEPLOY]`, `[REQUISITION]`) com bordas tracejadas.
8. **`/8` — Cyber-Runic Magitech Terminal**:
   - *Estética*: Magia antiga fundida com tecnologia de luz sólida (*Magitech*).
   - *Tipografia*: `'Orbitron'`, futurista angular.
   - *Elementos*: Placas chanfradas em polígono (`clip-path`), brilho de plasma ciano/violeta e molduras de circuitos energéticos.
9. **`/9` — Retro 80s Synthwave / Outrun Survivor**:
   - *Estética*: Cyberpunk neon dos anos 80, VHS outrun.
   - *Tipografia*: `'Righteous'`, tipografia fluida retrô.
   - *Elementos*: Grade de chão wireframe em perspectiva 3D, gradiente metálico cromado, botões em fita neon magenta/ciano e estética laser.
10. **`/10` — Shonen Manga Slash / Fighting Game**:
    - *Estética*: Clímax de anime shonen / jogo de luta de alta voltagem.
    - *Tipografia*: `'Russo One'`.
    - *Elementos*: Corte diagonal de katana cortando a tela, fita de ação com corte em lâmina (`clip-path: polygon(...)`), detalhes em amarelo relâmpago e vermelho escarlate.

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
