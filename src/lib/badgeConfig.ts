export interface BadgeConfig {
    id: string;
    nameKey: string;
    descKey: string;
    style: string;
    icon: string;
}

export const BADGE_CONFIGS: Record<string, BadgeConfig> = {
    first_step: {
        id: 'first_step',
        nameKey: 'first_step_name',
        descKey: 'first_step_desc',
        style: 'from-blue-500 to-cyan-400',
        icon: '🚀'
    },
    on_fire: {
        id: 'on_fire',
        nameKey: 'on_fire_name',
        descKey: 'on_fire_desc',
        style: 'from-orange-600 to-yellow-400',
        icon: '🔥'
    },
    wanderer: {
        id: 'wanderer',
        nameKey: 'wanderer_name',
        descKey: 'wanderer_desc',
        style: 'from-green-500 to-emerald-400',
        icon: '🌍'
    },
    mayor: {
        id: 'mayor',
        nameKey: 'mayor_name',
        descKey: 'mayor_desc',
        style: 'from-purple-600 to-pink-500',
        icon: '👑'
    },
    social: {
        id: 'social',
        nameKey: 'social_name',
        descKey: 'social_desc',
        style: 'from-pink-400 to-rose-300',
        icon: '🦋'
    },
    night_owl: {
        id: 'night_owl',
        nameKey: 'night_owl_name',
        descKey: 'night_owl_desc',
        style: 'from-indigo-900 to-purple-800',
        icon: '🦉'
    },
    legend: {
        id: 'legend',
        nameKey: 'legend_name',
        descKey: 'legend_desc',
        style: 'from-yellow-500 via-amber-400 to-yellow-600',
        icon: '🏆'
    }
};
