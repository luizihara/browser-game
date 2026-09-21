export type RelicId =
  | 'chalice'
  | 'hourglass'
  | 'dice'
  | 'boots'
  | 'golem_heart'
  | 'compass';

export interface RelicDefinition {
  readonly id: RelicId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly flavorText: string;
  readonly rarity: 'rare' | 'epic' | 'legendary';
}

export const RELIC_CONFIG: Record<RelicId, RelicDefinition> = {
  chalice: {
    id: 'chalice',
    name: 'Cálice do Vampiro',
    description: '6% de todo dano de acerto crítico é convertido em regeneração de HP para o herói.',
    icon: '🍷',
    flavorText: 'Uma taça forjada em rubi que sacia a sede com a vitalidade dos vencidos.',
    rarity: 'rare',
  },
  hourglass: {
    id: 'hourglass',
    name: 'Ampulheta Espectral',
    description: 'A cada 45 segundos, congela completamente todos os monstros por 3.5 segundos.',
    icon: '⏳',
    flavorText: 'Areias do continuum temporal que paralisam até mesmo as feras mais ferozes.',
    rarity: 'epic',
  },
  dice: {
    id: 'dice',
    name: 'Dado da Sorte da Taberna',
    description: '+25% de ouro coletado, +10% de chance de acerto crítico e +2 Rerolls no Level Up.',
    icon: '🎲',
    flavorText: 'Esculpido em marfim antigo. Os taberneiros juram que ele sempre cai a favor do dono.',
    rarity: 'rare',
  },
  boots: {
    id: 'boots',
    name: 'Passada Ígnea',
    description: 'Caminhar deixa um rastro de brasas no solo que causa 35 de dano por segundo aos perseguidores.',
    icon: '👢',
    flavorText: 'Botas reforçadas com couro de salamandra vulcânica.',
    rarity: 'epic',
  },
  golem_heart: {
    id: 'golem_heart',
    name: 'Coração de Golem',
    description: 'Converte defesa em força: concede +10% de dano para cada ponto de armadura do herói.',
    icon: '🛡️',
    flavorText: 'Núcleo de pedra pulsante que converte rigidez mineral em impacto esmagador.',
    rarity: 'rare',
  },
  compass: {
    id: 'compass',
    name: 'Bússola Astral',
    description: '+75% de raio de coleta magnética e atrai todas as gemas da arena a cada 40 segundos.',
    icon: '🧲',
    flavorText: 'Sua agulha estelar não aponta para o norte, mas sim para relíquias e poder cósmico.',
    rarity: 'legendary',
  },
};
