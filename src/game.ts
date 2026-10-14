export type Move = {
  type: "row" | "column";
  index: number;
  direction: -1 | 1;
  amount?: number;
};

export type LayerConfig = {
  id: number;
  name: string;
  shortName: string;
  cols: number;
  rows: number;
  start: number;
  end: number;
};

export const LEVELS_PER_LAYER = 50;
export const PRACTICE_LEVELS = 3;
export const PRACTICE_LAYER: LayerConfig = {
  id: 0, name: "Rüzgâr Okulu", shortName: "Alıştırma", cols: 3, rows: 2, start: 1, end: PRACTICE_LEVELS,
};
export const LEVEL_LAYERS: LayerConfig[] = [
  { id: 1, name: "Filiz Avlusu", shortName: "Filiz", cols: 3, rows: 3, start: 4, end: 23 },
  { id: 2, name: "Yonca Yolu", shortName: "Yonca", cols: 4, rows: 3, start: 24, end: 63 },
  { id: 3, name: "Rüzgâr Bahçesi", shortName: "Rüzgâr", cols: 4, rows: 4, start: 64, end: 113 },
  { id: 4, name: "Mercan Terası", shortName: "Mercan", cols: 4, rows: 5, start: 114, end: 163 },
  { id: 5, name: "Lavanta Korusu", shortName: "Lavanta", cols: 5, rows: 5, start: 164, end: 213 },
  { id: 6, name: "Ayışığı Serası", shortName: "Ayışığı", cols: 5, rows: 6, start: 214, end: 288 },
  { id: 7, name: "Dikey Yoncalar", shortName: "Yoncalar", cols: 5, rows: 7, start: 289, end: 363 },
  { id: 8, name: "Kristal Bahçe", shortName: "Kristal", cols: 6, rows: 6, start: 364, end: 438 },
  { id: 9, name: "Göğe Uzanan Koru", shortName: "Gökyüzü", cols: 6, rows: 7, start: 439, end: 513 },
  { id: 10, name: "Kadim Çiçeklik", shortName: "Kadim", cols: 6, rows: 8, start: 514, end: 588 },
  { id: 11, name: "Yıldız Çayırı", shortName: "Yıldız", cols: 7, rows: 7, start: 589, end: 663 },
  { id: 12, name: "Sonsuz Sarmaşık", shortName: "Sarmaşık", cols: 7, rows: 8, start: 664, end: 738 },
];
export const TOTAL_LEVELS = LEVEL_LAYERS[LEVEL_LAYERS.length - 1].end;

export const COLORS = [
  { soil: "#BCDCC2", seed: "#3D8863" },
  { soil: "#F4C9AF", seed: "#DF765D" },
  { soil: "#F0DFA2", seed: "#D9A83E" },
  { soil: "#C9C3DF", seed: "#796FA8" },
  { soil: "#EFE3C7", seed: "#A48E63" },
];

export function layerColorCount(layer: LayerConfig) {
  // Layer cards show the maximum palette used in that garden.
  if (layer.id === 0) return 2;
  if (layer.id <= 5) return 3;
  return 5;
}

export function levelColorCount(level: number) {
  const { layer, localLevel } = levelInfo(level);
  if (layer.id === 0) return 2;
  if (layer.id === 1) return localLevel <= 3 ? 2 : 3;
  if (layer.id === 2) return localLevel <= 15 ? 2 : 3;
  if (layer.id >= 3 && layer.id <= 5) return localLevel <= 25 ? 2 : 3;
  if (localLevel <= 25) return 2;
  if (localLevel <= 50) return 3;
  return 5;
}

function colorIntroductionCaps(level: number, colorCount: number, cellCount: number) {
  const { layer, localLevel } = levelInfo(level);
  const caps: Record<number, number> = {};
  if (layer.id === 0) return caps;

  for (let color = 2; color < colorCount; color += 1) {
    let firstLocalWithColor = 1;
    for (let local = 1; local <= localLevel; local += 1) {
      const globalLevel = layer.start + local - 1;
      if (levelColorCount(globalLevel) >= color + 1) {
        firstLocalWithColor = local;
        break;
      }
    }
    const age = localLevel - firstLocalWithColor + 1;
    if (age > 0 && age <= 12) {
      // When a new color enters a layer it should feel learnable: one tile
      // for a few levels, then two, then three, instead of flooding the board.
      caps[color] = Math.min(cellCount, Math.max(1, Math.ceil(age / 3)));
    }
  }
  return caps;
}

export function layerLevelCount(layer: LayerConfig) {
  return layer.end - layer.start + 1;
}

export function levelInfo(level: number) {
  const safeLevel = Math.max(1, Math.min(TOTAL_LEVELS, Math.round(level)));
  const layer = safeLevel <= PRACTICE_LEVELS
    ? PRACTICE_LAYER
    : LEVEL_LAYERS.find((candidate) => safeLevel >= candidate.start && safeLevel <= candidate.end) ?? LEVEL_LAYERS[LEVEL_LAYERS.length - 1];
  return {
    level: safeLevel,
    localLevel: safeLevel - layer.start + 1,
    layer,
    rows: layer.rows,
    cols: layer.cols,
  };
}

function seededValue(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function patternedTarget(rows: number, cols: number, level: number, salt = 0) {
  const { localLevel, layer } = levelInfo(level);
  const colorCount = levelColorCount(level);
  const pattern = (localLevel - 1 + layer.id * 2 + salt) % 10;
  const turn = (localLevel * 3 + layer.id + salt) % 4;
  const random = seededValue(level * 7919 + salt * 104729 + rows * 97 + cols * 193);

  const result = Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const edge = Math.min(row, col, rows - 1 - row, cols - 1 - col);
    const centerDistance = Math.abs(row * 2 - rows + 1) + Math.abs(col * 2 - cols + 1);
    let value: number;

    switch (pattern) {
      case 0: value = row + col; break;
      case 1: value = row * 2 + Math.floor(col / 2); break;
      case 2: value = col * 2 + Math.floor(row / 2); break;
      case 3: value = edge + (row + col) % 2; break;
      case 4: value = centerDistance + Math.floor(col / 2); break;
      case 5: value = row ^ col ^ localLevel; break;
      case 6: value = Math.floor((row + col + localLevel % 3) / 2); break;
      case 7: value = row * col + row + localLevel; break;
      case 8: value = (row % 2) * 2 + (col + localLevel) % 2; break;
      default: value = Math.floor(random() * 4) + row + col * 2; break;
    }

    // A small deterministic accent makes pattern siblings visually distinct
    // without turning the target into unstructured noise.
    if (random() < .14 + layer.id * .012) value += 1 + Math.floor(random() * 3);
    return (value + turn) % colorCount;
  });
  // Small 2×3 tutorial boards must still contain a meaningful pattern. A
  // single-color target would be unchanged by every swipe and start solved.
  if (new Set(result).size < Math.min(2, colorCount)) {
    const accentIndex = (localLevel * 2 + layer.id + salt) % result.length;
    result[accentIndex] = (result[accentIndex] + 1) % colorCount;
  }
  // Every level visibly uses its layer's full palette. This keeps “3 renk”
  // and “4 renk” layers consistent instead of occasionally producing a
  // simpler target by chance.
  for (let color = 0; color < colorCount; color += 1) {
    if (result.includes(color)) continue;
    const counts = result.reduce<number[]>((all, value) => {
      all[value] = (all[value] || 0) + 1;
      return all;
    }, []);
    const replaceIndex = result.findIndex((value) => (counts[value] || 0) > 1);
    result[replaceIndex >= 0 ? replaceIndex : color % result.length] = color;
  }
  const caps = colorIntroductionCaps(level, colorCount, result.length);
  Object.entries(caps).forEach(([colorKey, cap]) => {
    const color = Number(colorKey);
    let guard = result.length;
    while (result.filter((value) => value === color).length > cap && guard > 0) {
      guard -= 1;
      const counts = result.reduce<number[]>((all, value) => {
        all[value] = (all[value] || 0) + 1;
        return all;
      }, []);
      const replaceIndex = result.findIndex((value) => value === color);
      let replacement = 0;
      for (let candidate = 1; candidate < color; candidate += 1) {
        if ((counts[candidate] || 0) < (counts[replacement] || 0)) replacement = candidate;
      }
      if (replaceIndex >= 0) result[replaceIndex] = replacement;
    }
  });
  return result;
}

export function targetBoard(rows: number, cols: number, level: number) {
  // Guard against the rare case of two targets in the same layer colliding.
  const existing = new Set<string>();
  const { layer, localLevel } = levelInfo(level);
  let result: number[] = [];
  for (let local = 1; local <= localLevel; local += 1) {
    const globalLevel = layer.start + local - 1;
    let salt = 0;
    do {
      result = patternedTarget(rows, cols, globalLevel, salt);
      salt += 1;
    } while (existing.has(result.join("")) && salt < 40);
    existing.add(result.join(""));
  }
  return result;
}

export function shift(board: number[], rows: number, cols: number, move: Move) {
  const next = [...board];
  const lineLength = move.type === "row" ? cols : rows;
  const line: number[] = [];
  for (let position = 0; position < lineLength; position += 1) {
    line.push(move.type === "row"
      ? board[move.index * cols + position]
      : board[position * cols + move.index]);
  }
  const amount = Math.max(1, Math.round(move.amount ?? 1)) % lineLength;
  const offset = move.direction * amount;
  const shifted = line.map((_, destination) => {
    const source = (destination - offset + lineLength) % lineLength;
    return line[source];
  });
  for (let position = 0; position < lineLength; position += 1) {
    next[move.type === "row"
      ? move.index * cols + position
      : position * cols + move.index] = shifted[position];
  }
  return next;
}

export function createLevel(level: number) {
  const info = levelInfo(level);
  const { rows, cols, localLevel, layer } = info;
  const target = targetBoard(rows, cols, info.level);
  let board = [...target];
  let seed = info.level * 7919 + rows * 101 + cols * 211;
  const random = seededValue(seed);
  const scramble: Move[] = [];
  // The scramble depth never drops at a layer boundary: it rises every ten
  // global levels while the board itself also gains rows or columns.
  const steps = layer.id === 0
    ? Math.min(5, 2 + Math.floor((localLevel - 1) / 3))
    : Math.min(30, 3 + Math.floor((info.level - PRACTICE_LEVELS - 1) / 10));
  let previous: Move | null = null;

  for (let index = 0; index < steps; index += 1) {
    seed = Math.floor(random() * 2147483647);
    const type: Move["type"] = seed % 2 ? "row" : "column";
    const lineCount = type === "row" ? rows : cols;
    const lineLength = type === "row" ? cols : rows;
    const move: Move = {
      type,
      index: Math.floor(random() * lineCount),
      direction: random() > .5 ? 1 : -1,
      amount: layer.id >= 3 && random() > .72
        ? 1 + Math.floor(random() * Math.max(1, lineLength - 1))
        : 1,
    };
    if (previous && previous.type === move.type && previous.index === move.index &&
      previous.direction !== move.direction && previous.amount === move.amount) {
      move.index = (move.index + 1) % lineCount;
    }
    board = shift(board, rows, cols, move);
    scramble.push(move);
    previous = move;
  }

  if (board.every((value, index) => value === target[index])) {
    const extra: Move = { type: "row", index: localLevel % rows, direction: 1, amount: 1 };
    board = shift(board, rows, cols, extra);
    scramble.push(extra);
  }

  return { ...info, board, target, scramble };
}

export function inverseMove(move: Move): Move {
  return { ...move, direction: move.direction === 1 ? -1 : 1 };
}

export function appendMoveToPath(path: Move[], move: Move, rows: number, cols: number) {
  const lineLength = move.type === "row" ? cols : rows;
  const amount = Math.max(1, Math.round(move.amount ?? 1)) % lineLength;
  if (amount === 0) return [...path];
  const normalizedMove: Move = { ...move, amount };
  const previous = path[path.length - 1];

  if (!previous || previous.type !== move.type || previous.index !== move.index) {
    return [...path, normalizedMove];
  }

  const previousAmount = Math.max(1, Math.round(previous.amount ?? 1)) % lineLength;
  const signedPrevious = previous.direction * previousAmount;
  const signedCurrent = normalizedMove.direction * amount;
  const combined = ((signedPrevious + signedCurrent) % lineLength + lineLength) % lineLength;
  if (combined === 0) return path.slice(0, -1);

  const replacement: Move = combined <= lineLength / 2
    ? { ...normalizedMove, direction: 1, amount: combined }
    : { ...normalizedMove, direction: -1, amount: lineLength - combined };
  return [...path.slice(0, -1), replacement];
}

export function normalizeMovePath(path: Move[], rows: number, cols: number) {
  return path.reduce<Move[]>(
    (normalized, move) => appendMoveToPath(normalized, move, rows, cols),
    [],
  );
}

export function simplifyMovePath(target: number[], path: Move[], rows: number, cols: number) {
  const normalized = normalizeMovePath(path, rows, cols);
  let board = [...target];
  let simplified: Move[] = [];
  let stateKeys = [board.join("")];
  let stateIndexes = new Map<string, number>([[stateKeys[0], 0]]);

  for (const move of normalized) {
    board = shift(board, rows, cols, move);
    const key = board.join("");
    const previousIndex = stateIndexes.get(key);
    if (previousIndex !== undefined) {
      simplified = simplified.slice(0, previousIndex);
      stateKeys = stateKeys.slice(0, previousIndex + 1);
      stateIndexes = new Map(stateKeys.map((stateKey, index) => [stateKey, index]));
      continue;
    }
    simplified.push(move);
    stateKeys.push(key);
    stateIndexes.set(key, simplified.length);
  }
  return simplified;
}
