/**
 * Game Screen - Main gameplay interface
 * Purpose: Full memory card game implementation with preview, scoring, and completion
 * Extension: Add power-ups, hints, different game modes, multiplayer
 */

import { View, Text, StyleSheet, Alert, BackHandler, TouchableOpacity, Platform, Animated } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LEVEL_CONFIGS, EMOJI_POOL, CARD_COLORS } from '../../constants/levels';
import { previewTimeSec, calculateTotalScore, calculateComboSegments } from '../../utils/scoring';
import useGameStore from '../../store/useGameStore';
import soundManager from '../../utils/SoundManager';
import HapticUtils from '../../utils/HapticUtils';
import GameHeader from '../../components/GameHeader';
import GameGrid from '../../components/GameGrid';
import ScoreProgressBars from '../../components/ScoreProgressBars';
import ComboDisplay from '../../components/ComboDisplay';
import PowerupBar from '../../components/PowerupBar';

export default function GameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams();
  const { completeLevel, gameData } = useGameStore();
  const insets = useSafeAreaInsets();
  
  const level = LEVEL_CONFIGS.find(l => l.id === parseInt(levelId, 10));
  const cardColorIndex = (parseInt(levelId, 10) - 1) % CARD_COLORS.length;
  const cardColor = CARD_COLORS[cardColorIndex];
  
  // Game state
  const [gameState, setGameState] = useState('preview'); // 'preview', 'playing', 'completed', 'failed'
  const [isPaused, setIsPaused] = useState(false);
  const [isGlimpseActive, setIsGlimpseActive] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [attempts, setAttempts] = useState(0);
  const [timer, setTimer] = useState(0);
  const [previewTimer, setPreviewTimer] = useState(0);
  const [matchHistory, setMatchHistory] = useState([]);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [finalScoreData, setFinalScoreData] = useState(null);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  // 道具相关状态
  const [cardPositions, setCardPositions] = useState([]);
  
  // 抖动动画相关
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  
  // Refs
  const timerRef = useRef(null);
  const previewTimerRef = useRef(null);
  const flipTimeoutRef = useRef(null);
  
  if (!level) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
      </View>
    );
  }

  // Initialize game
  useEffect(() => {
    // 检查是否是新用户首次进入level 1
    if (parseInt(levelId, 10) === 1 && !gameData.seenTutorial) {
      // 新用户首次进入level 1，显示教程
      router.replace('/onboarding?firstTime=true');
      return;
    }
    
    // Initialize sound system for this level
    soundManager.initializeLevel(levelId);
    initializeGame();
    return () => {
      clearAllTimers();
    };
  }, []);


  // Monitor matched cards to ensure game completion check
  useEffect(() => {
    if (gameState === 'playing' && matchedCards.length === level.cards) {
      // 确保所有卡牌都已配对，游戏应该完成
      completeGame(matchHistory, attempts);
    }
  }, [matchedCards.length, gameState, level.cards, matchHistory, attempts]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      
      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [])
  );

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
  };

  const initializeGame = () => {
    // Generate random emojis for this level
    const pairCount = level.cards / 2;
    const shuffledEmojis = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
    const selectedEmojis = shuffledEmojis.slice(0, pairCount);
    
    // Create pairs and shuffle
    const gameCards = [];
    selectedEmojis.forEach(emoji => {
      gameCards.push({ emoji, id: Math.random() });
      gameCards.push({ emoji, id: Math.random() });
    });
    gameCards.sort(() => Math.random() - 0.5);
    
    setCards(gameCards);
    setFlippedCards(Array.from({ length: level.cards }, (_, i) => i)); // Show all cards initially
    setMatchedCards([]);
    setAttempts(0);
    setTimer(0);
    setMatchHistory([]);
    setCurrentCombo(0);
    setShowCombo(false);
    setGameState('preview');
    
    // Start preview timer
    const previewDuration = previewTimeSec(level.cards);
    setPreviewTimer(previewDuration);
    
    previewTimerRef.current = setInterval(() => {
      setPreviewTimer(prev => {
        if (prev <= 1) {
          clearInterval(previewTimerRef.current);
          startGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    setFlippedCards([]);
    setGameState('playing');
    
    // Start game timer
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const handleCardPress = (cardIndex) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;

    const newFlippedCards = [...flippedCards, cardIndex];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      checkForMatch(newFlippedCards);
    }
  };

  const checkForMatch = (flippedIndices) => {
    const [first, second] = flippedIndices;
    const isMatch = cards[first].emoji === cards[second].emoji;
    
    const updatedMatchHistory = [...matchHistory, isMatch];
    setMatchHistory(updatedMatchHistory);

    if (isMatch) {
      // Match found - add haptic feedback
      HapticUtils.triggerHeavy();
      
      // Update combo count
      const newCombo = currentCombo + 1;
      console.log(`🎮 Game: Setting combo from ${currentCombo} to ${newCombo}`);
      setCurrentCombo(newCombo);
      
      // 显示combo提示（当连续配对2次及以上时）
      if (newCombo >= 2) {
        setShowCombo(true);
      }
      
      // Play appropriate sound based on combo
      soundManager.handleCardMatch(true, newCombo);
      
      // Update matched cards first, then clear flipped cards
      const newMatchedCards = [...matchedCards, first, second];
      setMatchedCards(newMatchedCards);
      
      // Use setTimeout to ensure state updates are processed in order
      setTimeout(() => {
        setFlippedCards([]);
      }, 0);
      
      // Check if game is complete
      if (newMatchedCards.length === level.cards) {
        // Pass the current attempts + 1 since we just made an attempt
        completeGame(updatedMatchHistory, attempts + 1);
      }
    } else {
      // No match - reset combo and flip cards back after delay
      setCurrentCombo(0);
      setShowCombo(false);
      
      // 触发抖动动画
      triggerShakeAnimation();
      
      flipTimeoutRef.current = setTimeout(() => {
        setFlippedCards([]);
      }, 1000);
    }
  };

  const completeGame = (finalMatchHistory = matchHistory, finalAttempts = attempts, successfulPairs = null) => {
    // 确保游戏状态正确
    if (gameState === 'completed') return;
    
    clearInterval(timerRef.current);
    setGameState('completed');
    
    // Set completion page flag to disable sounds
    soundManager.setCompletionPage(true);
    
    // Calculate final score
    const totalPairs = level.cards / 2; // 当局总对数
    const comboSegments = calculateComboSegments(finalMatchHistory);
    const finalScore = calculateTotalScore(level.id, totalPairs, finalAttempts, timer, comboSegments, successfulPairs);
    
    // Store score data for animation
    setFinalScoreData(finalScore);
    
    // Save progress
    completeLevel(level.id, finalScore, timer);
    
    // Show score animation first
    setTimeout(() => {
      setShowScoreAnimation(true);
    }, 1000);
  };

  const handleQuit = async () => {
    console.log(`Game: Quitting level ${levelId}`);
    setShowScoreAnimation(false);
    // Stop all sounds for this level
    await soundManager.stopLevelSounds();
    // Wait for sounds to stop before navigating
    setTimeout(() => {
      router.push('/(tabs)');
    }, 100);
  };

  const handleRetry = async () => {
    console.log(`Game: Retrying level ${levelId}`);
    setShowScoreAnimation(false);
    // Stop all sounds for this level
    await soundManager.stopLevelSounds();
    // Reinitialize sound system for retry
    soundManager.initializeLevel(levelId);
    // Wait for sounds to stop before restarting
    setTimeout(() => {
      clearAllTimers();
      initializeGame();
    }, 100);
  };

  const handleNext = async () => {
    console.log(`Game: Next level from ${levelId}`);
    setShowScoreAnimation(false);
    // Stop all sounds for this level
    await soundManager.stopLevelSounds();
    
    const isLastLevel = level.id === 25;
    const nextLevelId = level.id + 1;
    
    // Wait for sounds to stop before navigating
    setTimeout(() => {
      if (isLastLevel) {
        // 最后一关完成，返回主页
        router.push('/(tabs)');
      } else {
        // 进入下一关
        router.replace(`/game/${nextLevelId}`);
      }
    }, 100);
  };

  const handleComboAnimationComplete = () => {
    setShowCombo(false);
  };


  // 抖动动画函数
  const triggerShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 道具使用逻辑
  const handleUsePowerup = async (powerupType) => {
    // 道具已经在PowerupBar中消耗了，这里直接执行功能
    switch (powerupType) {
      case 'bomb':
        handleBombPowerup();
        break;
      case 'clock':
        handleClockPowerup();
        break;
      case 'skip':
        handleSkipPowerup();
        break;
    }
  };

  // 炸弹道具：随机移除一对未配对的卡牌
  const handleBombPowerup = () => {
    // 找到所有未配对的卡牌
    const unmatchedCards = [];
    for (let i = 0; i < cards.length; i++) {
      if (!matchedCards.includes(i)) {
        unmatchedCards.push(i);
      }
    }

    if (unmatchedCards.length < 2) {
      Alert.alert('Bomb Powerup', 'Not enough cards to remove!');
      return;
    }

    // 找到所有可能的配对
    const possiblePairs = [];
    for (let i = 0; i < unmatchedCards.length; i++) {
      for (let j = i + 1; j < unmatchedCards.length; j++) {
        const card1 = unmatchedCards[i];
        const card2 = unmatchedCards[j];
        if (cards[card1].emoji === cards[card2].emoji) {
          possiblePairs.push([card1, card2]);
        }
      }
    }

    if (possiblePairs.length > 0) {
      // 随机选择一对进行移除（标记为已匹配）
      const randomPair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
      const newMatchedCards = [...matchedCards, ...randomPair];
      setMatchedCards(newMatchedCards);
      
      // 更新matchHistory，记录bomb成功配对（true表示成功配对）
      const updatedMatchHistory = [...matchHistory, true];
      setMatchHistory(updatedMatchHistory);
      
      // 更新attempts计数（bomb使用也算一次尝试）
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // 更新combo状态
      const newCombo = currentCombo + 1;
      console.log(`💣 Bomb: Setting combo from ${currentCombo} to ${newCombo}`);
      setCurrentCombo(newCombo);
      
      // 显示combo提示（当连续配对2次及以上时）
      if (newCombo >= 2) {
        setShowCombo(true);
      }
      
      // Bomb配对成功 - 添加振动反馈（与手动翻牌配对成功时相同）
      HapticUtils.triggerHeavy();
      
      // Play appropriate sound based on combo (same as manual card matching)
      soundManager.handleCardMatch(true, newCombo);
      
      // 关键修复：清空已翻开的卡牌状态，让游戏回到正常状态
      // 这样用户再翻开新卡牌时不会触发错误的配对检查
      setFlippedCards([]);
      
      // 确保状态更新顺序正确
      setTimeout(() => {
        // Check if game is complete
        if (newMatchedCards.length === level.cards) {
          completeGame(updatedMatchHistory, newAttempts);
        }
      }, 0);
    } else {
      Alert.alert('Bomb Powerup', 'No matching pairs found to remove!');
    }
  };


  // 时钟道具：翻开所有卡牌5秒后翻转，已匹配的卡牌显示绿色半透明覆盖
  const handleClockPowerup = () => {
    // 显示所有卡牌
    const allCards = [];
    for (let i = 0; i < cards.length; i++) {
      allCards.push(i);
    }
    
    // 先设置glimpse状态，再显示所有卡牌
    setIsGlimpseActive(true);
    setFlippedCards(allCards);
    
    // 5秒后翻转回去
    setTimeout(() => {
      setFlippedCards([]);
      setIsGlimpseActive(false);
    }, 5000);
  };

  // Skip powerup: directly complete the current level
  const handleSkipPowerup = () => {
    // 计算使用skip前已经成功配对的对数
    const successfulPairs = matchedCards.length / 2;
    
    // 使用当前的游戏状态完成游戏，保留使用skip前的分数记录
    // 将所有未配对的卡牌标记为已配对，但不影响分数计算
    const allCardIndices = Array.from({ length: level.cards }, (_, i) => i);
    setMatchedCards(allCardIndices);
    
    // 使用当前的matchHistory和attempts完成游戏，并传递成功配对数
    completeGame(matchHistory, attempts, successfulPairs);
  };


  // Pause game function
  const pauseGame = () => {
    setIsPaused(true);
    // Clear the main timer to pause the game
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Resume game function
  const resumeGame = () => {
    setIsPaused(false);
    // Restart the timer
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  // Reset game function
  const resetGame = () => {
    setIsPaused(false);
    clearAllTimers();
    initializeGame();
  };

  // Quit game function
  const quitGame = () => {
    setIsPaused(false);
    clearAllTimers();
    router.push('/(tabs)');
  };

  const handleMenuPress = () => {
    // Only pause during playing state (memory and card-flipping phases)
    if (gameState === 'playing') {
      pauseGame();
    } else {
      // For other states, show the old menu
      Alert.alert(
        'Game Menu',
        'Choose an option:',
        [
          { text: 'Tutorial', onPress: () => router.push('/onboarding') },
          { text: 'Restart Level', onPress: () => {
            clearAllTimers();
            initializeGame();
          }},
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Leave Game?',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Leave', 
          onPress: () => {
            clearAllTimers();
            router.push('/(tabs)');
          }
        }
      ]
    );
  };

  const isPreviewMode = gameState === 'preview';
  const isGameDisabled = gameState !== 'playing' || flippedCards.length >= 2;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}>
      <GameHeader
        level={level.id}
        onMenuPress={handleMenuPress}
        onBackPress={handleBackPress}
        isPreview={isPreviewMode}
        previewTimer={previewTimer}
        coins={gameData.coins}
      />


      {showScoreAnimation && finalScoreData && (
        <ScoreProgressBars
          scoreData={finalScoreData}
          levelId={level.id}
          onAnimationComplete={() => {}} // 不再需要，因为现在有独立的按钮
          onQuit={handleQuit}
          onRetry={handleRetry}
          onNext={handleNext}
        />
      )}

      <GameGrid
        cards={cards}
        flippedCards={flippedCards}
        matchedCards={matchedCards}
        onCardPress={handleCardPress}
        disabled={isGameDisabled}
        rows={level.rows}
        cols={level.cols}
        cardColor={cardColor}
        levelTier={level.tier}
        isPreview={isPreviewMode}
        levelId={level.id}
        headerBottomY={Math.max(insets.top + 10, 50) + 62} // 动态计算头部下边缘位置
        onCardPositionsChange={setCardPositions}
        powerupBarHeight={Math.max(insets.bottom + 82, 82)} // 动态计算道具栏高度
        isGlimpseActive={isGlimpseActive}
      />

      <ComboDisplay
        combo={currentCombo}
        visible={showCombo}
        onAnimationComplete={handleComboAnimationComplete}
      />

      <PowerupBar
        onUsePowerup={handleUsePowerup}
        gameState={gameState}
        disabled={isGameDisabled || isPaused}
      />

      {/* Pause Overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseContainer}>
            <Text style={styles.pauseTitle}>Game is paused</Text>
            <View style={styles.pauseButtons}>
              <TouchableOpacity style={styles.pauseButton} onPress={quitGame}>
                <Text style={styles.pauseButtonText}>Quit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pauseButton} onPress={resetGame}>
                <Text style={styles.pauseButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pauseButton, styles.resumeButton]} onPress={resumeGame}>
                <Text style={[styles.pauseButtonText, styles.resumeButtonText]}>Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {gameState === 'completed' && (
        <View style={styles.completedOverlay}>
          <Text style={styles.completedText}>🎉 Level Complete! 🎉</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
  },
  completedOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pauseContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
    minWidth: 280,
  },
  pauseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  pauseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  resumeButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  resumeButtonText: {
    color: '#FFFFFF',
  },
});