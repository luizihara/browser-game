# Diretriz de Arte e Visual — Low-Poly Toon Survivor

Documento mestre de especificação técnica e artística para a direção visual do jogo 3D Survivor / Bullet Heaven no navegador.

---

## 1. Visão Geral e Filosofia

O projeto adota uma estética **Low-Poly Cartoon com Toon Shading**, inspirada em jogos indie modernos de ação rápida e visual charmoso (*toy-like*, amigável, polido e legível).

### Por que essa abordagem foi escolhida?
1. **Performance e Escala**: O jogo suportará hordas com centenas de inimigos simultâneos no navegador. Modelos com baixo número de polígonos e materiais toon leves garantem 60–144 FPS estáveis mesmo em dispositivos modestos.
2. **Leitura Visual Instantânea (Gameplay-First)**: Em um survivor bullet-heaven, o jogador precisa identificar em milissegundos quem é o player, quem são os inimigos, onde há perigo e onde estão os colecionáveis. Silhuetas marcadas e cores intencionais evitam o ruído visual comum de gráficos hiper-realistas.
3. **Charme e Longevidade**: A estética cartoon estilizada envelhece muito melhor do que tentativas de realismo e transmite capricho, identidade de estúdio e coesão autoral.

---

## 2. Pilares da Direção de Arte

1. **Silhueta Forte**: Cada personagem, monstro e elemento de cenário é reconhecível apenas pelo contorno (formas triangulares, quadradas, arredondadas ou espinhadas bem definidas).
2. **Hierarquia Cromática Rigorosa**:
   - *Cenário*: Tons neutros e pastéis suaves (verde-musgo, terra aconchegante, pedra cinza-azulada), saturação de 30% a 50%.
   - *Inimigos*: Cores quentes e chamativas para identificação de ameaça (laranja, vermelho, roxo venenoso, chumbo), saturação de 70% a 85%.
   - *Player*: Destaque absoluto no contraste (azul cobalto vibrante, branco e detalhes dourados), saturação de 90% a 100%.
   - *VFX e Coletáveis*: Emissivos e brilhantes (ouro, esmeralda, ciano, fogo).
3. **Toon Shading e Volume**: Materiais foscos/semi-foscos com sombreamento em faixas discretas (gradient map de 3 níveis: luz, meia-luz e sombra), sem reflexos metálicos pesados ou ruídos de textura fotográfica.
4. **Animação Procedural com Personalidade**: Em vez de esqueletos complexos de centenas de ossos, usamos animações cinemáticas leves e responsivas (bobbing, squash & stretch senoidal de passos, inclinação ao virar).
5. **Zero-GC & Performance-First**: Reutilização estrita de materiais compartilhados, geometrias combinadas em buffers únicos e uso de `THREE.InstancedMesh` para elementos repetidos do cenário.

---

## 3. Especificação dos Elementos Visuais

### 3.1. Player (O Herói)
- **Conceito**: *Mini Knight-Mage / Chibi Hero*.
- **Composição**: Corpo compacto e heroico construído em primitivas low-poly chanfradas (capacete/cabeça com visor iluminado, ombreiras angulares, torso com túnica e capa fluida estilizada, mãos flutuantes segurando o cajado/arma primária).
- **Cores**: Azul real (`#1e56a0`), detalhes dourados (`#f6c90e`), visor ciano brilhante (`#00f2fe`) e tecido branco/prata (`#eef2f7`).
- **Animação**:
  - *Caminhada*: Balanço suave de passada (*bobbing* vertical de 0.05 unidades com leve inclinação lateral em função da velocidade).
  - *Idle*: Respiração suave com leve escala senoidal no peitoral.
  - *Ataque*: Vibração rápida ou brilho momentâneo na arma.

### 3.2. Inimigos e Arquétipos
Cada arquétipo possui formas geométricas, tamanhos e linguagens de silhueta contrastantes:

| Inimigo | Arquétipo Visual | Forma Base & Acessórios | Cores Principais | Animação / Atitude |
| :--- | :--- | :--- | :--- | :--- |
| **Stalker** | Goblin / Imp Ágil | Cabeça cônica achatada, orelhas/chifres pontiagudos pontuais, olhos vermelhos pequenos e dentes proeminentes. | Vermelho ferrugem (`#d63031`) e laranja escuro | Passos rápidos e erráticos, balançando de um lado para outro. |
| **Skitterer** | Insetóide / Aranha | Corpo achatado triangular, 4 ou 6 patas angulares pontiagudas, olhos multifacetados brilhantes. | Púrpura venenoso (`#6c5ce7`) e magenta neon (`#fd79a8`) | Deslocamento rastejante em alta velocidade com pequenas vibrações nas patas. |
| **Brute** | Golem / Ogro de Pedra | Silhueta maciça em trapézio invertido (ombros gigantescos, braços compridos em blocos de pedra, cabeça afundada no torso). | Cinza ardósia escuro (`#2d3436`) com veias de magma alaranjado (`#e17055`) | Passo pesado com balanço lateral marcado (*heavy stomp*). |
| **Goliath Elite** | Titã Conquistador | Escala 2.5x, coroa pontiaguda de chifres dourados, armadura facetada imponente e auréola sagrada/profana giratória flutuando acima da cabeça. | Dourado queimado (`#d4af37`), ônix (`#1e272e`) e anel emissivo brilhante (`#ffd700`) | Avanço inexorável e intimidante, com pulso de luz sutil no peito. |

### 3.3. Cenário e Arena
- **Chão**:
  - Plano modular dividido em ladrilhos ou manchas low-poly facetadas com tons sutis de grama verde-musgo e terra acolhedora.
  - Evita texturas planas monótonas através de leve gradiente de cor nos vértices (`vertexColors`) ou padrão xadrez/hexagonal de baixo contraste.
- **Bordas da Arena (Muralhas de Proteção)**:
  - Substituição das caixas brancas placeholder por ruínas antigas estilizadas: colunas caídas facetadas, muretas de pedra low-poly com musgo e cristais demarcando os limites.
- **Props Decorativos (Props com Instancing)**:
  - Árvores estilizadas estilo *clump-tree* (copas formadas por dodecaedros ou icosaedros deformados em tons de verde e tronco marrom facetado).
  - Pedras angulares facetadas de diferentes tamanhos nos cantos da arena.
  - Arbustos baixos arredondados e pequenos cogumelos bioluminescentes pontuais que acrescentam atmosfera mágica sem interferir na movimentação.

### 3.4. Iluminação e Atmosfera
- **Luz Direcional Primária (`DirectionalLight`)**:
  - Ângulo de incidência de 45° a 55°, cor levemente dourada/solar quente (`#fff7e6`).
  - Projeção de sombras suaves e bem recortadas (shadow maps otimizados para a área em torno do jogador).
- **Luz de Preenchimento (`HemisphereLight`)**:
  - Céu: Azul celeste claro suave (`#e3f2fd`).
  - Chão: Verde terra aconchegante (`#c8e6c9`).
  - *Benefício*: As áreas sombreadas dos modelos nunca ficam pretas ou opacas, ganhando uma tonalidade rica e cartunesca.
- **Materiais**:
  - `MeshToonMaterial` com textura de gradiente procedural de 3 tons (luz plena, tom intermediário e sombra colorida).
  - Sem mapas de rugosidade ou reflexos metálicos excessivos.

### 3.5. Interface e HUD
- Estilo *Fantasy Modern / Cartoon Indie*.
- Caixas com cantos arredondados (`border-radius: 8px a 12px`), fundo escuro semitransparente com blur sutil (`backdrop-filter: blur(6px)`) e bordas douradas discretas (`border: 2px solid rgba(246, 201, 14, 0.4)`).
- Barra de XP no topo com gradiente vibrante esmeralda/azul e indicador de nível em brasão estilizado.
- Barra de vida do player com corações estilizados ou barra chanfrada verde-limão com transição animada.
- Badges de cartas no Level Up mantendo hierarquia tipográfica limpa com tags de destaque (`[NOVA ARMA]`, `[UPGRADE LVL X]`, `[PASSIVA]`).

---

## 4. Arquitetura Técnica no Três.js / TypeScript

### Módulos Planejados

```
src/
├── art/                      # Construtores procedurais e materiais de arte estilizada
│   ├── ToonMaterialFactory.ts # Criação e cache de MeshToonMaterial com gradiente de 3 faixas
│   ├── Palette.ts            # Centralização rigorosa das cores temáticas
│   ├── CharacterBuilder.ts   # Montador procedural das geometrias do Player estilizado
│   ├── EnemyVisualBuilder.ts # Montador das geometrias dos 4 arquétipos de inimigos
│   └── PropBuilder.ts        # Gerador de malhas instanciadas (árvores, pedras, ruínas)
├── config/
│   └── artConfig.ts          # Dimensões, parâmetros de toon, iluminação e sombras
```

### Regras de Otimização
1. **Material Sharing**: Inimigos do mesmo arquétipo compartilham **exatamente a mesma instância de material**. Não crie `new MeshToonMaterial()` dentro de loops de spawn.
2. **Geometry Pooling**: Geometrias primitivas são geradas uma única vez e instanciadas via `new THREE.Mesh(sharedGeometry, sharedMaterial)`.
3. **Props Instanciados**: Árvores e pedras do cenário utilizam `THREE.InstancedMesh` em lote único, reduzindo centenas de props a apenas 1–2 draw calls.
4. **Zero Impacto no Gameplay**: As entidades mantêm suas propriedades matemáticas originais (`colliderRadius`, `position`, `velocity`). O modelo visual é apenas um filho hierárquico sob `entity.mesh`.

---

## 5. Roteiro Sequencial de Implementação (Tasks Atômicas)

Para manter a estabilidade do jogo e garantir entregas incrementais auditáveis:

- **Task 1: Fundação Toon & Iluminação Estilizada**
  - Criar `src/art/ToonMaterialFactory.ts` gerando gradiente procedural de 3 tons.
  - Atualizar iluminação em `World.ts` com `HemisphereLight` e `DirectionalLight` suave com paleta ajustada.
  - Validar build e visual geral.

- **Task 2: Cenário & Arena Low-Poly**
  - Adicionar variação estilizada de tons ao piso da arena em `World.ts`.
  - Criar props decorativos de borda (pedras facetadas e árvores cartoon simples) via `THREE.InstancedMesh`.
  - Substituir caixas de limite perimetral por ruínas/muretas estilizadas.

- **Task 3: Redesenho Estilizado do Player**
  - Criar o modelo *Chibi Hero* com capacete, visor brilhante, ombreiras e arma em `Player.ts`.
  - Adicionar animação procedural leve de passada (*bobbing*) no `PlayerController.ts` ou `Player.ts`.

- **Task 4: Redesenho dos Inimigos por Silhueta**
  - Criar geometrias distintas para *Stalker*, *Skitterer*, *Brute* e *Goliath Elite* com materiais toon e olhos expressivos.
  - Implementar animações procedurais leves de perseguição (wobble/passos).

- **Task 5: Polimento de UI & HUD**
  - Refinar CSS dos menus e HUD com bordas arredondadas, tipografia polida e paleta consistente com o mundo cartoon.

---

## 6. Regras de Consistência para Futuras Adições

1. **Nunca use materiais PBR realistas**: Utilize sempre a fábrica `ToonMaterialFactory`.
2. **Respeite o orçamento de polígonos**:
   - Player: máximo de 1.200 triângulos combinados.
   - Inimigos comuns: máximo de 600 triângulos.
   - Inimigos elites: máximo de 1.500 triângulos.
   - Props decorativos: máximo de 300 triângulos por prop.
3. **Mantenha a hierarquia de contraste**: O cenário nunca deve competir com o jogador ou com os projéteis.
4. **Zero Garbage Collection**: Animações de bobbing e efeitos no loop devem utilizar apenas fórmulas trigonométricas escalares com `deltaTime`, sem instanciar vetores.
