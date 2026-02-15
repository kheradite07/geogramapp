
export const XP_THRESHOLDS = [
    0,      // Level 1 starts at 0 XP
    10,     // Level 2 requires 10 XP
    35,     // Level 3 requires 35 XP (10 + 25)
    85,     // Level 4 requires 85 XP (35 + 50)
    160,    // Level 5 requires 160 XP (85 + 75)
    260,    // Level 6 requires 260 XP (160 + 100)
    500,    // Level 7
    1000,   // Level 8
    2000,   // Level 9
    5000    // Level 10
];

// Level titles in Turkish
export const LEVEL_TITLES: Record<number, string> = {
    1: "Acemi",
    2: "Kaşif",
    3: "Gezgin",
    4: "Maceracı",
    5: "Usta",
    6: "Kâşif",
    7: "Efsane",
    8: "Kahraman",
    9: "Şampiyon",
    10: "Efsane Kaşif"
};

/**
 * Get the title for a given level
 */
export function getLevelTitle(level: number): string {
    if (level <= 0) return LEVEL_TITLES[1];
    if (level > 10) return "Efsane Kaşif"; // Max title
    return LEVEL_TITLES[level] || LEVEL_TITLES[1];
}

/**
 * Calculates the current level based on total XP.
 * Levels are 1-indexed.
 */
export function getLevelFromXP(xp: number): number {
    let level = 1;
    for (let i = 0; i < XP_THRESHOLDS.length; i++) {
        if (xp >= XP_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    // Infinite scaling beyond defined thresholds? 
    // For now stick to max level matching array length or linear after.
    // Let's go with linear scale every 1000xp after max.

    if (xp > XP_THRESHOLDS[XP_THRESHOLDS.length - 1]) {
        const excessXP = xp - XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
        const extraLevels = Math.floor(excessXP / 1000);
        return XP_THRESHOLDS.length + extraLevels;
    }

    return level;
}

/**
 * Returns the TOTAL XP required to reach the NEXT level.
 */
export function getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= XP_THRESHOLDS.length) {
        // Dynamic calc for high levels
        const levelsBeyond = currentLevel - XP_THRESHOLDS.length;
        return XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (levelsBeyond + 1) * 1000;
    }
    return XP_THRESHOLDS[currentLevel]; // Threshold for next level (index = currentLevel)
}

/**
 * Returns XP progress towards next level (0 to 100 percentage or raw values)
 */
export function getLevelProgress(xp: number) {
    const level = getLevelFromXP(xp);

    // XP required for current level
    const currentLevelXP = level <= XP_THRESHOLDS.length
        ? XP_THRESHOLDS[level - 1]
        : XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (level - XP_THRESHOLDS.length) * 1000;

    // XP required for next level
    const nextLevelXP = getXPForNextLevel(level);

    const progress = xp - currentLevelXP;
    const totalNeeded = nextLevelXP - currentLevelXP;

    return {
        current: Math.max(0, progress),
        total: Math.max(1, totalNeeded),
        percentage: Math.min(100, Math.max(0, (progress / totalNeeded) * 100))
    };
}
