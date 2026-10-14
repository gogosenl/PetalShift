import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEVELS_PER_LAYER, LEVEL_LAYERS, layerLevelCount, levelInfo, PRACTICE_LEVELS, TOTAL_LEVELS } from "./game";

export type PurchaseRecord = {
  id: string;
  productId: string;
  title: string;
  amount: number;
  price: string;
  purchasedAt: string;
};

export type PlayerSave = {
  version: 11;
  currentLevel: number;
  completed: number[];
  rewarded: number[];
  stars: Record<string, number>;
  unlockedLayers: number[];
  hintLeaves: number;
  layerStones: number;
  freeHints: number;
  paidHintNoticeSeen: boolean;
  onboardingSeen: boolean;
  languageChosen: boolean;
  tutorialCompleted: boolean;
  reviewPromptCount: number;
  lastReviewPromptLevel: number;
  reviewPromptDismissed: boolean;
  lastUpdatePromptVersion: string;
  adsRemoved: boolean;
  purchaseHistory: PurchaseRecord[];
  bestMoves: Record<string, number>;
  settings: { music: boolean; sfx: boolean; haptics: boolean; language: "tr" | "en" };
};

const KEY = "@ruzgar-korusu/player-v1";
const SAVE_VERSION = 11;
const OLD_PRACTICE_LEVELS = 10;
const LAYER_COUNT = 12;
const THREE_PRACTICE_UNIFORM_TOTAL_LEVELS = 603;

export const DEFAULT_SAVE: PlayerSave = {
  version: SAVE_VERSION,
  currentLevel: 1,
  completed: [],
  rewarded: [],
  stars: {},
  unlockedLayers: [1],
  hintLeaves: 12,
  layerStones: 4,
  freeHints: 3,
  paidHintNoticeSeen: false,
  onboardingSeen: false,
  languageChosen: false,
  tutorialCompleted: false,
  reviewPromptCount: 0,
  lastReviewPromptLevel: 0,
  reviewPromptDismissed: false,
  lastUpdatePromptVersion: "",
  adsRemoved: false,
  purchaseHistory: [],
  bestMoves: {},
  settings: { music: true, sfx: true, haptics: true, language: "tr" },
};

export async function loadSave(): Promise<PlayerSave> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw);
    const savedVersion = Number.isInteger(parsed.version) ? Number(parsed.version) : 1;
    const prePracticeLayout = savedVersion < 4;
    const tenPracticeLayout = savedVersion === 4 || savedVersion === 5;
    const threePracticeUniformLayout = savedVersion >= 6 && savedVersion <= 8;
    const oldTotalLevels = prePracticeLayout
      ? LAYER_COUNT * LEVELS_PER_LAYER
      : tenPracticeLayout ? OLD_PRACTICE_LEVELS + LAYER_COUNT * LEVELS_PER_LAYER
        : threePracticeUniformLayout ? THREE_PRACTICE_UNIFORM_TOTAL_LEVELS : TOTAL_LEVELS;
    const migrateLayerLocal = (layerId: number, localLevel: number) => {
      const layer = LEVEL_LAYERS[layerId - 1];
      if (!layer) return TOTAL_LEVELS;
      return layer.start + Math.min(Math.max(1, localLevel), layerLevelCount(layer)) - 1;
    };
    const migrateLevel = (level: number) => {
      if (prePracticeLayout) {
        const layerId = Math.floor((level - 1) / LEVELS_PER_LAYER) + 1;
        const localLevel = ((level - 1) % LEVELS_PER_LAYER) + 1;
        return migrateLayerLocal(layerId, localLevel);
      }
      if (tenPracticeLayout) {
        if (level <= OLD_PRACTICE_LEVELS) return Math.min(level, PRACTICE_LEVELS);
        const mainLevel = level - OLD_PRACTICE_LEVELS;
        const layerId = Math.floor((mainLevel - 1) / LEVELS_PER_LAYER) + 1;
        const localLevel = ((mainLevel - 1) % LEVELS_PER_LAYER) + 1;
        return migrateLayerLocal(layerId, localLevel);
      }
      if (threePracticeUniformLayout) {
        if (level <= PRACTICE_LEVELS) return level;
        const mainLevel = level - PRACTICE_LEVELS;
        const layerId = Math.floor((mainLevel - 1) / LEVELS_PER_LAYER) + 1;
        const localLevel = ((mainLevel - 1) % LEVELS_PER_LAYER) + 1;
        return migrateLayerLocal(layerId, localLevel);
      }
      return level;
    };
    const validNewLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= TOTAL_LEVELS;
    const rawCompleted = (Array.isArray(parsed.completed) ? parsed.completed : [])
      .filter((level: unknown) => Number.isInteger(level) && Number(level) >= 1 && Number(level) <= oldTotalLevels)
      .map((level: number) => migrateLevel(level))
      .filter(validNewLevel);
    const completed = Array.from(new Set([
      ...(prePracticeLayout || !!parsed.tutorialCompleted ? Array.from({ length: PRACTICE_LEVELS }, (_, index) => index + 1) : []),
      ...rawCompleted,
    ]));
    const rewarded = Array.from(new Set((Array.isArray(parsed.rewarded) ? parsed.rewarded : [])
      .filter((level: unknown) => Number.isInteger(level) && Number(level) >= 1 && Number(level) <= oldTotalLevels)
      .map((level: number) => migrateLevel(level))
      .filter(validNewLevel)));
    const bestMoves = Object.fromEntries(Object.entries(parsed.bestMoves || {})
      .map(([level, moves]) => [migrateLevel(Number(level)), moves] as const)
      .filter(([level]) => validNewLevel(level))
      .map(([level, moves]) => [String(level), moves])) as Record<string, number>;
    const stars = Object.fromEntries(Object.entries(parsed.stars || {})
      .map(([level, count]) => [migrateLevel(Number(level)), Math.max(1, Math.min(3, Math.round(Number(count) || 0)))] as const)
      .filter(([level, count]) => validNewLevel(level) && count >= 1)
      .map(([level, count]) => [String(level), count])) as Record<string, number>;
    const hasProgressSchema = savedVersion >= 2 && savedVersion <= SAVE_VERSION;
    const savedLayers = hasProgressSchema && Array.isArray(parsed.unlockedLayers)
      ? parsed.unlockedLayers.filter((id: unknown) => Number.isInteger(id) && Number(id) >= 1 && Number(id) <= 12)
      : [1];
    const unlockedLayers = [1];
    for (let id = 2; id <= 12; id += 1) {
      if (savedLayers.includes(id) && unlockedLayers.includes(id - 1)) unlockedLayers.push(id);
    }
    let firstIncomplete = 1;
    while (firstIncomplete <= TOTAL_LEVELS && completed.includes(firstIncomplete)) firstIncomplete += 1;
    if (firstIncomplete > TOTAL_LEVELS) firstIncomplete = TOTAL_LEVELS;
    const firstIncompleteLayer = levelInfo(firstIncomplete).layer.id;
    const fallbackLevel = firstIncompleteLayer === 0 || unlockedLayers.includes(firstIncompleteLayer)
      ? firstIncomplete
      : Math.max(1, firstIncomplete - 1);
    const tutorialCompleted = prePracticeLayout ? true : !!parsed.tutorialCompleted;
    const rawCurrentLevel = Number.isInteger(parsed.currentLevel) ? Number(parsed.currentLevel) : fallbackLevel;
    const savedCurrentLevel = Math.max(1, Math.min(TOTAL_LEVELS, migrateLevel(rawCurrentLevel)));
    const savedCurrentLayer = levelInfo(savedCurrentLevel).layer.id;
    const currentLevel = savedCurrentLayer === 0
      ? (tutorialCompleted ? fallbackLevel : savedCurrentLevel)
      : unlockedLayers.includes(savedCurrentLayer) ? savedCurrentLevel : fallbackLevel;
    const savedHintLeaves = Number.isInteger(parsed.hintLeaves) ? Math.max(0, Number(parsed.hintLeaves)) : DEFAULT_SAVE.hintLeaves;
    const savedLayerStones = Number.isInteger(parsed.layerStones) ? Math.max(0, Number(parsed.layerStones)) : DEFAULT_SAVE.layerStones;
    const purchaseHistory = Array.isArray(parsed.purchaseHistory)
      ? parsed.purchaseHistory
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: any) => ({
          id: typeof item.id === "string" ? item.id : `${Date.now()}-${Math.random()}`,
          productId: typeof item.productId === "string" ? item.productId : "unknown",
          title: typeof item.title === "string" ? item.title : "Satın alma",
          amount: Number.isFinite(Number(item.amount)) ? Number(item.amount) : 1,
          price: typeof item.price === "string" ? item.price : "",
          purchasedAt: typeof item.purchasedAt === "string" ? item.purchasedAt : new Date().toISOString(),
        }))
        .slice(-30)
      : [];
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      version: SAVE_VERSION,
      completed,
      rewarded,
      stars,
      bestMoves,
      unlockedLayers,
      currentLevel,
      hintLeaves: savedHintLeaves,
      layerStones: savedLayerStones,
      freeHints: hasProgressSchema && Number.isInteger(parsed.freeHints)
        ? Math.max(0, parsed.freeHints)
        : 3,
      paidHintNoticeSeen: hasProgressSchema ? !!parsed.paidHintNoticeSeen : false,
      onboardingSeen: savedVersion >= 3 ? !!parsed.onboardingSeen : false,
      languageChosen: !!parsed.languageChosen,
      tutorialCompleted,
      reviewPromptCount: Number.isInteger(parsed.reviewPromptCount) ? Math.max(0, parsed.reviewPromptCount) : 0,
      lastReviewPromptLevel: Number.isInteger(parsed.lastReviewPromptLevel) ? Math.max(0, parsed.lastReviewPromptLevel) : 0,
      reviewPromptDismissed: !!parsed.reviewPromptDismissed,
      lastUpdatePromptVersion: typeof parsed.lastUpdatePromptVersion === "string" ? parsed.lastUpdatePromptVersion : "",
      adsRemoved: !!parsed.adsRemoved,
      purchaseHistory,
    };
  } catch {
    return DEFAULT_SAVE;
  }
}

export async function writeSave(save: PlayerSave) {
  await AsyncStorage.setItem(KEY, JSON.stringify(save));
}
