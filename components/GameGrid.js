/**
 * GameGrid Component
 * Renders the grid layout for card matching game cards
 */

import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GameCard from './GameCard';
import { getCardBackImage } from '../constants/cardBacks';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GameGrid({ 
  cards, 
  flippedCards, 
  matchedCards, 
  onCardPress, 
  disabled, 
  rows, 
  cols,
  cardColor,
  levelTier,
  isPreview = false,
  levelId = 1, // Add levelId to identify problem levels
  headerBottomY = 0, // Y position of header bottom edge (倒计时/提示条的下边缘)
  onCardPositionsChange, // 回调函数，用于传递卡牌位置信息
  powerupBarHeight = 0, // 道具栏高度，为底部留出空间
  isGlimpseActive = false // 是否处于glimpse状态
}) {
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // Get card back image for this difficulty tier
  const cardBackImage = levelTier ? getCardBackImage(levelTier) : null;
  
  // Calculate safe area bounds for card container
  const calculateSafeAreaBounds = () => {
    // 检测是否在宿主app环境中运行
    const isHostApp = !__DEV__ || Platform.OS === 'web';
    
    // 在宿主app中，安全区域可能不同，需要更灵活的计算
    const topMargin = isHostApp ? 0 : 2; // 宿主app中减少上边距
    const topBound = headerBottomY + topMargin;
    
    // 下边界 = 屏幕底部 - 道具栏高度 - 安全区域底部
    const bottomMargin = isHostApp ? 0 : 2; // 宿主app中减少下边距
    const bottomBound = screenHeight - powerupBarHeight - bottomMargin;
    
    // 左右边距考虑安全区域，但确保最小可用空间
    const minHorizontalMargin = isHostApp ? 4 : 8;
    const leftBound = Math.max(insets.left, minHorizontalMargin);
    const rightBound = screenWidth - Math.max(insets.right, minHorizontalMargin);
    
    // 计算安全区域内的可用尺寸
    const safeAreaWidth = rightBound - leftBound;
    const safeAreaHeight = Math.max(bottomBound - topBound, 200); // 确保最小高度
    
    return {
      top: topBound,
      bottom: bottomBound,
      left: leftBound,
      right: rightBound,
      width: safeAreaWidth,
      height: safeAreaHeight
    };
  };
  
  const safeArea = calculateSafeAreaBounds();
  
  // 简化的网格布局计算 - 确保铺满空白区域
  const gridPadding = 4; // 固定的网格内边距
  const cardMargin = 2; // 固定的卡牌间距
  
  // 计算可用空间
  const availableWidth = safeArea.width - (gridPadding * 2);
  const availableHeight = safeArea.height - (gridPadding * 2);
  
  // 计算卡牌尺寸 - 确保铺满可用空间
  const finalCardWidth = Math.floor((availableWidth - (cardMargin * (cols - 1))) / cols);
  const finalCardHeight = Math.floor((availableHeight - (cardMargin * (rows - 1))) / rows);
  
  // 确保最小尺寸
  const minCardSize = 30;
  const finalWidth = Math.max(finalCardWidth, minCardSize);
  const finalHeight = Math.max(finalCardHeight, minCardSize);

  const renderCard = (card, index) => {
    const isMatched = matchedCards.includes(index);
    const isFlipped = flippedCards.includes(index) || isMatched;

    return (
      <GameCard
        key={index}
        emoji={card.emoji}
        isFlipped={isFlipped}
        isMatched={isMatched}
        onPress={() => onCardPress(index)}
        disabled={disabled}
        cardWidth={finalWidth}
        cardHeight={finalHeight}
        cardColor={cardColor}
        cardBackImage={cardBackImage}
        levelTier={levelTier}
        isGlimpseActive={isGlimpseActive}
        onLayout={(event) => {
          // 获取卡牌位置信息
          const { x, y, width, height } = event.nativeEvent.layout;
          if (onCardPositionsChange) {
            onCardPositionsChange(prev => {
              const newPositions = [...(prev || [])];
              newPositions[index] = { x, y, width, height };
              return newPositions;
            });
          }
        }}
      />
    );
  };

  const renderRow = (rowIndex) => {
    const startIndex = rowIndex * cols;
    const rowCards = cards.slice(startIndex, startIndex + cols);

    return (
      <View key={rowIndex} style={[styles.row, {
        marginBottom: rowIndex < rows - 1 ? cardMargin : 0, // Add margin between rows
      }]}>
        {rowCards.map((card, colIndex) => 
          <View key={startIndex + colIndex} style={{
            marginRight: colIndex < cols - 1 ? cardMargin : 0, // Add margin between cards
          }}>
            {renderCard(card, startIndex + colIndex)}
          </View>
        )}
      </View>
    );
  };

  const containerStyle = styles.container;
  const gridStyle = styles.grid;

  return (
    <View style={[containerStyle, {
      position: 'absolute',
      top: safeArea.top + gridPadding,
      left: safeArea.left + gridPadding,
      right: safeArea.right - gridPadding,
      bottom: safeArea.bottom - gridPadding,
    }]}>
      <View style={[gridStyle, {
        width: availableWidth,
        height: availableHeight,
      }]}>
        {Array.from({ length: rows }, (_, index) => renderRow(index))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Remove flex: 1 and centering to prevent overlap
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  grid: {
    // Use flexbox to arrange rows properly
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginVertical: 0, // Remove vertical margin to prevent gaps
  },
});