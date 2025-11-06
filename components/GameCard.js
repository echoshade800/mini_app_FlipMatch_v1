/**
 * GameCard Component
 * Renders individual cards with flip animations and emoji faces
 */

import { View, TouchableOpacity, Text, StyleSheet, Animated, Image } from 'react-native';
import { useEffect, useRef } from 'react';
import { TIER_COLORS } from '../constants/levels';

export default function GameCard({ 
  emoji, 
  isFlipped, 
  isMatched, 
  onPress, 
  disabled, 
  cardWidth, 
  cardHeight,
  cardColor,
  cardBackImage,
  levelTier,
  isGlimpseActive = false,
  onLayout 
}) {
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  useEffect(() => {
    if (isMatched) {
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isMatched]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const cardStyle = {
    width: cardWidth,
    height: cardHeight,
    transform: [{ scale: scaleAnimation }]
  };

  const frontStyle = {
    transform: [{ rotateY: frontInterpolate }],
    opacity: frontOpacity,
    backgroundColor: cardColor,
  };

  const backStyle = {
    transform: [{ rotateY: backInterpolate }],
    opacity: backOpacity,
  };

  return (
    <TouchableOpacity
      style={[styles.cardContainer, cardStyle]}
      onPress={onPress}
      onLayout={onLayout}
      disabled={disabled || isFlipped || isMatched}
      activeOpacity={0.8}
    >
      {/* Card Back (face down) */}
      <Animated.View style={[styles.card, styles.cardBack, frontStyle]}>
        {cardBackImage ? (
          <Image 
            source={cardBackImage} 
            style={styles.cardBackImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardBackFallback, { backgroundColor: levelTier ? TIER_COLORS[levelTier] : '#6B7280' }]}>
            <Text style={styles.cardPattern}>?</Text>
            {levelTier && (
              <Text style={styles.tierLabel}>
                {levelTier.toUpperCase()}
              </Text>
            )}
          </View>
        )}
      </Animated.View>

      {/* Card Front (emoji face) */}
      <Animated.View style={[styles.card, styles.cardFront, backStyle]}>
        <Text style={[styles.emoji, { fontSize: Math.min(cardWidth, cardHeight) * 0.85 }]}>
          {emoji}
        </Text>
        {/* Green overlay for matched cards during glimpse */}
        {isGlimpseActive && isMatched && (
          <View style={styles.glimpseOverlay} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    // Remove margin to prevent size inconsistency
    // margin: 2,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  cardBackFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cardPattern: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 2,
  },
  tierLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  emoji: {
    fontWeight: 'normal',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  glimpseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.4)', // Green with 40% opacity
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
});