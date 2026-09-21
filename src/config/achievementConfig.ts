import type { CharacterId } from './characterConfig';

export type AchievementCategory =
  | 'combat'
  | 'survival'
  | 'boss'
  | 'arsenal'
  | 'hero';

export type AchievementId =
  | 'first_blood'
  | 'monster_slayer'
  | 'genocide'
  | 'survivor_novice'
  | 'survivor_champion'
  | 'untouchable'
  | 'boss_gorgonath'
  | 'boss_malakor'
  | 'full_arsenal'
  | 'legendary_crafter'
  | 'treasure_hunter'
  | 'prop_smasher'
  | 'gold_hoarder'
  | 'knight_glory'
  | 'mage_ascension'
  | 'rogue_shadows'
  | 'templar_light';

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly category: AchievementCategory;
  readonly rewardGold: number;
  readonly maxProgress: number;
  readonly isProgressive: boolean;
  readonly relatedHero?: CharacterId;
}

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'TODAS', icon: '📜' },
  { id: 'combat', label: 'COMBATE', icon: '⚔️' },
  { id: 'survival', label: 'SOBREVIVÊNCIA', icon: '🛡️' },
  { id: 'boss', label: 'CHEFES', icon: '💀' },
  { id: 'arsenal', label: 'ARSENAL', icon: '✨' },
  { id: 'hero', label: 'HERÓIS', icon: '👑' },
];

export const ACHIEVEMENTS_CONFIG: Record<AchievementId, AchievementDefinition> = {
  // --- COMBAT ---
  first_blood: {
    id: 'first_blood',
    title: 'Primeiro Sangue',
    description: 'Elimine 100 monstros em uma única partida.',
    icon: '🗡️',
    category: 'combat',
    rewardGold: 100,
    maxProgress: 100,
    isProgressive: false,
  },
  monster_slayer: {
    id: 'monster_slayer',
    title: 'Exterminador de Feras',
    description: 'Elimine um total acumulado de 1.000 monstros.',
    icon: '🏹',
    category: 'combat',
    rewardGold: 250,
    maxProgress: 1000,
    isProgressive: true,
  },
  genocide: {
    id: 'genocide',
    title: 'Terror da Horda',
    description: 'Elimine um total acumulado de 5.000 monstros.',
    icon: '⚡',
    category: 'combat',
    rewardGold: 600,
    maxProgress: 5000,
    isProgressive: true,
  },

  // --- SURVIVAL ---
  survivor_novice: {
    id: 'survivor_novice',
    title: 'Resistência Inicial',
    description: 'Sobreviva por ao menos 3 minutos em qualquer estágio.',
    icon: '⏳',
    category: 'survival',
    rewardGold: 150,
    maxProgress: 180,
    isProgressive: false,
  },
  survivor_champion: {
    id: 'survivor_champion',
    title: 'Campeão da Sobrevivência',
    description: 'Sobreviva aos 5 minutos completos e alcance a Vitória.',
    icon: '🏆',
    category: 'survival',
    rewardGold: 500,
    maxProgress: 300,
    isProgressive: false,
  },
  untouchable: {
    id: 'untouchable',
    title: 'Mestre Esquivo',
    description: 'Sobreviva 2 minutos em uma partida sem sofrer nenhum dano.',
    icon: '💨',
    category: 'survival',
    rewardGold: 350,
    maxProgress: 120,
    isProgressive: false,
  },

  // --- BOSSES ---
  boss_gorgonath: {
    id: 'boss_gorgonath',
    title: 'Quebrador da Terra',
    description: 'Derrote o colosso Gorgonath, o Quebrador de Mundos (Mid-Boss aos 150s).',
    icon: '🌋',
    category: 'boss',
    rewardGold: 300,
    maxProgress: 1,
    isProgressive: false,
  },
  boss_malakor: {
    id: 'boss_malakor',
    title: 'Banimento da Escuridão',
    description: 'Derrote Malakor, o Soberano das Sombras (Final Boss aos 260s).',
    icon: '💀',
    category: 'boss',
    rewardGold: 600,
    maxProgress: 1,
    isProgressive: false,
  },

  // --- ARSENAL & COLLECTION ---
  full_arsenal: {
    id: 'full_arsenal',
    title: 'Arsenal Pleno',
    description: 'Equipe todas as 4 armas simultaneamente em uma única partida.',
    icon: '⚔️',
    category: 'arsenal',
    rewardGold: 200,
    maxProgress: 4,
    isProgressive: false,
  },
  legendary_crafter: {
    id: 'legendary_crafter',
    title: 'Forja Lendária',
    description: 'Realize uma Evolução de Super-Arma durante a partida.',
    icon: '🌟',
    category: 'arsenal',
    rewardGold: 400,
    maxProgress: 1,
    isProgressive: false,
  },
  treasure_hunter: {
    id: 'treasure_hunter',
    title: 'Caçador de Arcas',
    description: 'Abra um total acumulado de 5 Baús de Tesouro.',
    icon: '🎁',
    category: 'arsenal',
    rewardGold: 250,
    maxProgress: 5,
    isProgressive: true,
  },
  prop_smasher: {
    id: 'prop_smasher',
    title: 'Demolidor de Relíquias',
    description: 'Destrua um total de 30 objetos de cenário (vasos, barris ou cristais).',
    icon: '🏺',
    category: 'arsenal',
    rewardGold: 150,
    maxProgress: 30,
    isProgressive: true,
  },
  gold_hoarder: {
    id: 'gold_hoarder',
    title: 'Cofre do Dragão',
    description: 'Acumule 1.500 moedas de ouro no cofre da conta.',
    icon: '🪙',
    category: 'arsenal',
    rewardGold: 300,
    maxProgress: 1500,
    isProgressive: true,
  },

  // --- HERO MASTERY ---
  knight_glory: {
    id: 'knight_glory',
    title: 'Honra de Roderick',
    description: 'Alcance uma Vitória completa jogando com Sir Roderick.',
    icon: '🛡️',
    category: 'hero',
    rewardGold: 300,
    maxProgress: 1,
    isProgressive: false,
    relatedHero: 'knight',
  },
  mage_ascension: {
    id: 'mage_ascension',
    title: 'Transcendência Arcana',
    description: 'Alcance uma Vitória completa jogando com a Arquimaga Elara.',
    icon: '🧙‍♀️',
    category: 'hero',
    rewardGold: 300,
    maxProgress: 1,
    isProgressive: false,
    relatedHero: 'mage',
  },
  rogue_shadows: {
    id: 'rogue_shadows',
    title: 'Dança das Sombras',
    description: 'Alcance uma Vitória completa jogando com o Ladino Kage.',
    icon: '🗡️',
    category: 'hero',
    rewardGold: 300,
    maxProgress: 1,
    isProgressive: false,
    relatedHero: 'rogue',
  },
  templar_light: {
    id: 'templar_light',
    title: 'Bênção Celestial',
    description: 'Alcance uma Vitória completa jogando com o Templário Aurelius.',
    icon: '⚖️',
    category: 'hero',
    rewardGold: 300,
    maxProgress: 1,
    isProgressive: false,
    relatedHero: 'templar',
  },
};
