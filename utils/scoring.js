/**
 * Scoring system for Flip & Match game
 * Implements performance, combo, and time scoring formulas
 */

/**
 * Calculate preview time for memorization phase
 * @param {number} N - Number of cards
 * @returns {number} Preview time in seconds
 */
export function previewTimeSec(N) {
  const P = N / 2;
  const raw = 3 + 0.35 * P;
  const clamped = Math.max(3, raw);
  return Math.round(clamped * 2) / 2; // round to 0.5s
}

/**
 * Calculate accuracy score (linear by accuracy)
 * @param {number} levelId - Level ID (1-based)
 * @param {number} totalPairs - Total number of pairs in the level
 * @param {number} attempts - Number of attempts (flipping 2 cards = 1 attempt)
 * @param {number} successfulPairs - Number of successfully matched pairs (for skip powerup)
 * @returns {number} Accuracy score
 */
export function calculateAccuracyScore(levelId, totalPairs, attempts, successfulPairs = null) {
  const CAP = totalPairs * 10; // CAP = 当局卡牌总对数 × 10
  
  let acc;
  if (successfulPairs !== null) {
    // 使用skip道具时，使用实际成功配对的对数
    acc = successfulPairs / totalPairs;
  } else {
    // 正常游戏时，使用尝试次数计算
    acc = attempts > 0 ? totalPairs / attempts : 0;
  }
  
  return Math.round(CAP * acc);
}

/**
 * Calculate combo score
 * @param {number} levelId - Level ID (1-based)
 * @param {number} totalPairs - Total number of pairs in the level
 * @param {Array} comboSegments - Array of combo segment lengths
 * @returns {number} Combo score
 */
export function calculateComboScore(levelId, totalPairs, comboSegments) {
  // 连击分数 = (最高连续配对成功次数 / 当局总对数) × CAP
  const CAP = totalPairs * 10; // CAP = 当局卡牌总对数 × 10
  const maxConsecutiveMatches = comboSegments.length > 0 ? Math.max(...comboSegments) : 0;
  const comboRatio = totalPairs > 0 ? maxConsecutiveMatches / totalPairs : 0;
  return Math.round(CAP * comboRatio);
}

/**
 * Calculate time score
 * @param {number} levelId - Level ID (1-based)
 * @param {number} totalPairs - Total number of pairs in the level
 * @param {number} durationSec - Time taken in seconds
 * @returns {number} Time score
 */
export function calculateTimeScore(levelId, totalPairs, durationSec) {
  const CAP = totalPairs * 10; // CAP = 当局卡牌总对数 × 10
  const g = 3.0; // gold time multiplier
  const b = 6.0; // bronze time multiplier
  
  const T_gold = g * totalPairs;
  const T_bronze = b * totalPairs;
  
  if (durationSec <= T_gold) {
    return CAP;
  } else if (durationSec >= T_bronze) {
    return 0;
  } else {
    return Math.round(CAP * (T_bronze - durationSec) / (T_bronze - T_gold));
  }
}

/**
 * Calculate total score
 * @param {number} levelId - Level ID (1-based)
 * @param {number} totalPairs - Total number of pairs in the level
 * @param {number} attempts - Number of attempts
 * @param {number} durationSec - Time taken in seconds
 * @param {Array} comboSegments - Array of combo segment lengths
 * @param {number} successfulPairs - Number of successfully matched pairs (for skip powerup)
 * @returns {Object} Score breakdown
 */
export function calculateTotalScore(levelId, totalPairs, attempts, durationSec, comboSegments, successfulPairs = null) {
  const CAP = totalPairs * 10; // CAP = 当局卡牌总对数 × 10
  
  const accuracy = calculateAccuracyScore(levelId, totalPairs, attempts, successfulPairs);
  const combo = calculateComboScore(levelId, totalPairs, comboSegments);
  const time = calculateTimeScore(levelId, totalPairs, durationSec);
  
  // 计算总分
  const total = accuracy + combo + time;
  const total_pct = Math.round(100 * total / (CAP * 3));
  
  return {
    accuracy,
    combo,
    time,
    total,
    totalPercent: total_pct,
    maxPossible: CAP * 3,
    maxAccuracyScore: CAP,
    maxComboScore: CAP,
    maxTimeScore: CAP
  };
}


/**
 * Calculate combo segments from match history
 * @param {Array} matchHistory - Array of boolean values (true for correct match)
 * @returns {Array} Array of combo segment lengths
 */
export function calculateComboSegments(matchHistory) {
  // 从配对历史中计算所有连击段
  // matchHistory: [true, false, true, true] 表示 成功配对-配对失败-成功配对-成功配对
  // 返回连击段长度数组，如 [1, 2] 表示第一段连击1次成功配对，第二段连击2次成功配对
  const segments = [];
  let currentSegment = 0;
  
  for (const isCorrect of matchHistory) {
    if (isCorrect) {
      // 成功配对，当前连击段中的连续成功配对次数+1
      currentSegment++;
    } else {
      // 配对失败，连击中断，记录当前连击段
      if (currentSegment > 0) {
        segments.push(currentSegment);
        currentSegment = 0;
      }
    }
  }
  
  // 处理最后一个连击段（如果游戏以连续成功配对结束）
  if (currentSegment > 0) {
    segments.push(currentSegment);
  }
  
  return segments;
}