/**
 * Home Screen (Dashboard)
 * Purpose: Overview and quick actions for the Memory game
 * Extension: Add stats widgets, achievements, daily challenges
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../../store/useGameStore';
import { LEVEL_CONFIGS } from '../../constants/levels';
import LevelsCompletedCard from '../../components/LevelsCompletedCard';
import soundManager from '../../utils/SoundManager';

export default function HomeScreen() {
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [hasShownOnboarding, setHasShownOnboarding] = useState(false);
  const { gameData, isLoading, error, initialize } = useGameStore();

  useEffect(() => {
    // Wait for router to be ready
    const checkRouter = () => {
      if (router.isReady) {
        setIsRouterReady(true);
      } else {
        setTimeout(checkRouter, 50);
      }
    };
    checkRouter();
  }, [router]);

  // Clean up all sounds when entering home screen
  useEffect(() => {
    const cleanupSounds = async () => {
      try {
        console.log('Home: Cleaning up all sounds when entering home screen');
        await soundManager.cleanup();
        console.log('Home: All sounds cleaned up');
      } catch (error) {
        console.log('Home: Error cleaning up sounds:', error);
      }
    };
    
    cleanupSounds();
  }, []);

  useEffect(() => {
    // Show onboarding if first time user
    // Only show onboarding when user is on the home tab, not when navigating to other tabs
    console.log('Home: Tutorial check - isRouterReady:', isRouterReady, 'isLoading:', isLoading, 'seenTutorial:', gameData.seenTutorial, 'hasShownOnboarding:', hasShownOnboarding);
    
    if (isRouterReady && !isLoading && !gameData.seenTutorial) {
      console.log('Home: Conditions met, showing tutorial in 300ms');
      // Add a small delay to ensure the user is actually on the home screen
      // and prevent interference with tab navigation
      const timer = setTimeout(() => {
        // Double check that we're still in the right state before navigating
        if (!gameData.seenTutorial) {
          console.log('Home: Showing tutorial now');
          setHasShownOnboarding(true);
          router.push('/onboarding?firstTime=true');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameData.seenTutorial, isRouterReady, isLoading, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initialize}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextLevel = Math.min(gameData.maxLevel, 25);
  const nextLevelConfig = LEVEL_CONFIGS.find(level => level.id === nextLevel);

  const handlePlayNext = () => {
    if (nextLevelConfig) {
      router.push(`/game/${nextLevel}`);
    }
  };

  const handleShowOnboarding = () => {
    router.push('/onboarding');
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Memory</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.settingsButton} onPress={handleShowOnboarding}>
              <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.coinDisplay}>
              <Text style={styles.coinText}>💰 {gameData.coins}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <LevelsCompletedCard count={gameData.maxLevel - 1} />
      </View>

      {/* Primary CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePlayNext}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>
            Play Level {nextLevel}
          </Text>
        </TouchableOpacity>
        
        {nextLevelConfig && (
          <Text style={styles.levelInfo}>
            {nextLevelConfig.cards} cards • {nextLevelConfig.tier}
          </Text>
        )}
      </View>

      {/* Recent Runs */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        
        {gameData.recentRuns && gameData.recentRuns.length > 0 ? (
          gameData.recentRuns.slice(0, 5).map((run, index) => (
            <View key={run.id} style={styles.runItem}>
              <View style={styles.runInfo}>
                <Text style={styles.runLevel}>Level {run.levelId}</Text>
                <Text style={styles.runScore}>{run.score} pts</Text>
              </View>
              <Text style={styles.runTime}>{Math.round(run.duration)}s</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No games yet</Text>
            <Text style={styles.emptySubtext}>Start playing to see your recent games here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
    marginRight: 12,
  },
  coinDisplay: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  coinText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D97706',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryContainer: {
    marginBottom: 30,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  levelInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  recentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  runItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  runInfo: {
    flex: 1,
  },
  runLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  runScore: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  runTime: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});