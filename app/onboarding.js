/**
 * Onboarding Screen - Tutorial and welcome flow
 * Purpose: Introduce game rules and mechanics to new players
 * Extension: Add animated examples, difficulty selection, preferences setup
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/useGameStore';

const ONBOARDING_SLIDES = [
  {
    title: 'Welcome to Flip & Match!',
    subtitle: 'Test your skills with emoji cards',
    icon: '🧠',
    content: 'Challenge yourself with our card matching game. Find matching emoji pairs across 25 levels of increasing difficulty!'
  },
  {
    title: 'How to Play',
    subtitle: 'Two-phase gameplay',
    icon: '🃏',
    content: 'First, memorize all cards during the preview phase. Then flip two cards at a time to find matching pairs. Clear the board to advance!'
  },
  {
    title: 'Scoring System',
    subtitle: 'Three factors determine your score',
    icon: '⭐',
    content: 'Accuracy: Fewer attempts = higher score\nCombo: Consecutive matches boost your score\nTime: Complete faster for bonus points'
  },
  {
    title: 'Power-ups & Coins',
    subtitle: 'Use tools to help you succeed',
    icon: '💎',
    content: 'Earn coins from your score (1 coin per point). Buy power-ups: Bomb (50 coins), Clock (100 coins), or Skip (600 coins) to help overcome difficult levels.'
  },
  {
    title: 'Ready to Start?',
    subtitle: 'Your matching adventure begins',
    icon: '🚀',
    content: 'Start with Level 1 and progress through 5 difficulty tiers: Easy (green), Medium (blue), Hard (yellow), Very Hard (orange), and Extreme (red). Good luck!'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setTutorialSeen, gameData } = useGameStore();
  const [currentPage, setCurrentPage] = useState(0);
  
  // 检查是否是首次登录（通过路由参数或seenTutorial状态判断）
  const isFirstTime = params.firstTime === 'true' || !gameData.seenTutorial;

  const handleGetStarted = async () => {
    await setTutorialSeen();
    // 首次用户直接进入第一关开始游戏
    if (isFirstTime) {
      router.replace('/game/1');
    } else {
      // 非首次用户跳转到levels页面
      router.replace('/(tabs)/levels');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Tutorial?',
      'You can always view the tutorial again from your profile.',
      [
        { text: 'Continue Tutorial', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: handleGetStarted
        }
      ]
    );
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_SLIDES.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Page Content */}
      <View style={styles.content}>
        <View style={styles.pageContainer}>
          <View style={styles.page}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{ONBOARDING_SLIDES[currentPage].icon}</Text>
            </View>
            
            <Text style={styles.title}>{ONBOARDING_SLIDES[currentPage].title}</Text>
            <Text style={styles.subtitle}>{ONBOARDING_SLIDES[currentPage].subtitle}</Text>
            <Text style={styles.description}>{ONBOARDING_SLIDES[currentPage].content}</Text>
            
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Page Indicators */}
        <View style={styles.indicators}>
          {ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentPage === index && styles.indicatorActive
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttons}>
          {currentPage > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
              <Ionicons name="arrow-back" size={20} color="#6B7280" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.spacer} />
          
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>
              {currentPage === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {currentPage < ONBOARDING_SLIDES.length - 1 && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingTop: 80,
  },
  pageContainer: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  navigation: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 4,
  },
});