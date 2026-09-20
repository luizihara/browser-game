import type { WeaponId } from './weaponConfig';
import type { UpgradeId } from './upgradeConfig';

export type WeaponEvolutionId =
  | 'astral_beam'
  | 'aegis_citadel'
  | 'solar_supernova'
  | 'thousand_blades';

export interface WeaponEvolutionDefinition {
  id: WeaponEvolutionId;
  baseWeaponId: WeaponId;
  requiredPassiveId: UpgradeId;
  name: string;
  icon: string;
  title: string;
  description: string;
  badgeLabel: string;
  color: number;
  textColor: string;
}

export const EVOLUTION_CONFIG: Record<WeaponId, WeaponEvolutionDefinition> = {
  wand: {
    id: 'astral_beam',
    baseWeaponId: 'wand',
    requiredPassiveId: 'haste',
    name: 'Holy Astral Beam',
    icon: '💫',
    title: 'HOLY ASTRAL BEAM',
    description:
      'Dispara feixes cósmicos contínuos e velozes que perfuram múltiplos inimigos em linha reta.',
    badgeLabel: '👑 EVOLUTION',
    color: 0x38bdf8, // Brilliant sky cyan
    textColor: '#38bdf8',
  },
  orbital: {
    id: 'aegis_citadel',
    baseWeaponId: 'orbital',
    requiredPassiveId: 'vitality',
    name: 'Aegis Citadel',
    icon: '🛡️',
    title: 'AEGIS CITADEL',
    description:
      'Orbes sagrados ampliados com velocidade orbital extrema, arcos de eletricidade e repulsão contínua.',
    badgeLabel: '👑 EVOLUTION',
    color: 0xfacc15, // Radiance gold
    textColor: '#facc15',
  },
  aura: {
    id: 'solar_supernova',
    baseWeaponId: 'aura',
    requiredPassiveId: 'might',
    name: 'Solar Supernova',
    icon: '☀️',
    title: 'SOLAR SUPERNOVA',
    description:
      'Pulso estelar devastador de plasma com alcance dobrado que deixa solo sagrado em chamas.',
    badgeLabel: '👑 EVOLUTION',
    color: 0xf97316, // Solar fiery orange
    textColor: '#f97316',
  },
  dagger: {
    id: 'thousand_blades',
    baseWeaponId: 'dagger',
    requiredPassiveId: 'swiftness',
    name: 'Thousand Shadow Blades',
    icon: '🗡️',
    title: 'THOUSAND SHADOW BLADES',
    description:
      'Tempestade espiral contínua em 360° de lâminas sombrias perfurantes com alta taxa de acerto crítico.',
    badgeLabel: '👑 EVOLUTION',
    color: 0xa855f7, // Deep shadow purple
    textColor: '#c084fc',
  },
};
