export type BossId = 'gorgonath' | 'malakor';

export interface BossAttackConfig {
  id: string;
  name: string;
  cooldown: number; // seconds between uses
  chargeTime: number; // telegraph duration in seconds
  damage: number;
  radius?: number; // for circular slams
  width?: number; // for rectangular charges
  length?: number; // for rectangular charges
}

export interface BossConfig {
  id: BossId;
  name: string;
  subtitle: string;
  maxHp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  color: number;
  height: number;
  attacks: BossAttackConfig[];
}

export const BOSS_CONFIG: Record<BossId, BossConfig> = {
  gorgonath: {
    id: 'gorgonath',
    name: 'Gorgonath, the Earthbreaker',
    subtitle: 'TITANIC COLOSSUS OF MAGMA & STONE',
    maxHp: 2400,
    speed: 1.8,
    contactDamage: 30,
    radius: 1.5,
    color: 0x78350f, // Deep volcanic stone
    height: 3.2,
    attacks: [
      {
        id: 'slam',
        name: 'Earth Shatter',
        cooldown: 8.0,
        chargeTime: 1.3,
        damage: 40,
        radius: 4.8,
      },
      {
        id: 'charge',
        name: 'Titan Charge',
        cooldown: 11.0,
        chargeTime: 1.1,
        damage: 45,
        width: 2.6,
        length: 13.0,
      },
    ],
  },
  malakor: {
    id: 'malakor',
    name: 'Malakor, the Shadow Overlord',
    subtitle: 'LORD OF NETHERFLAME & VOID',
    maxHp: 4800,
    speed: 2.2,
    contactDamage: 40,
    radius: 1.7,
    color: 0x4c1d95, // Void purple
    height: 3.6,
    attacks: [
      {
        id: 'hellfire',
        name: 'Radial Hellfire',
        cooldown: 7.0,
        chargeTime: 1.0,
        damage: 35,
        radius: 6.0,
      },
      {
        id: 'cataclysm',
        name: 'Cataclysm Ring',
        cooldown: 14.0,
        chargeTime: 1.5,
        damage: 55,
        radius: 8.5,
      },
    ],
  },
};
