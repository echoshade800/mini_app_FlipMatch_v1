/**
 * Levels Screen - Grid layout with difficulty sections
 * Purpose: Display levels in a 3-column grid with difficulty sections
 * Layout: Each difficulty takes 2 rows, first row first cell shows difficulty, rest show levels
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LEVEL_CONFIGS, TIERS, TIER_COLORS } from '../../constants/levels';
import useGameStore from '../../store/useGameStore';

const TIER_FILTERS = [
  { key: 'all', label: 'All', color: '#6B7280' },
  { key: TIERS.EASY, label: 'Easy', color: TIER_COLORS[TIERS.EASY] },
  { key: TIERS.MEDIUM, label: 'Medium', color: TIER_COLORS[TIERS.MEDIUM] },
  { key: TIERS.HARD, label: 'Hard', color: TIER_COLORS[TIERS.HARD] },
  { key: TIERS.VERY_HARD, label: 'Very Hard', color: TIER_COLORS[TIERS.VERY_HARD] },
  { key: TIERS.EXTREME, label: 'Extreme', color: TIER_COLORS[TIERS.EXTREME] },
];

export default function LevelsScreen() {
  const router = useRouter();
  const { gameData } = useGameStore();
  const [searchText, setSearchText] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');

  // Check if user needs to complete onboarding first
  useEffect(() => {
    console.log('Levels: Tutorial check - seenTutorial:', gameData.seenTutorial);
    if (!gameData.seenTutorial) {
      console.log('Levels: Redirecting to tutorial');
      // Redirect to onboarding if user hasn't completed it yet
      router.replace('/onboarding?firstTime=true');
    }
  }, [gameData.seenTutorial, router]);

  const groupedLevels = useMemo(() => {
    let filtered = LEVEL_CONFIGS;

    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(level =>
        level.id.toString().includes(searchText.trim()) ||
        level.tier.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by tier
    if (selectedTier !== 'all') {
      filtered = filtered.filter(level => level.tier === selectedTier);
    }

    // Group levels by tier
    const grouped = {};
    filtered.forEach(level => {
      if (!grouped[level.tier]) {
        grouped[level.tier] = [];
      }
      grouped[level.tier].push(level);
    });

    return grouped;
  }, [searchText, selectedTier]);

  const handleLevelPress = (level) => {
    if (level.id <= gameData.maxLevel) {
      router.push(`/game/${level.id}`);
    }
  };

  const renderDifficultySection = (tier, levels) => {
    const tierColor = TIER_COLORS[tier];
    const tierDisplayName = tier.charAt(0).toUpperCase() + tier.slice(1);
    
    // Create a grid of 6 cells (2 rows x 3 columns)
    const gridCells = [];
    
    // First cell - Difficulty name
    gridCells.push(
      <View key="difficulty" style={[styles.gridCell, styles.difficultyCell, { backgroundColor: tierColor }]}>
        <Text style={styles.difficultyText}>{tierDisplayName}</Text>
      </View>
    );
    
    // Next 5 cells - Levels
    for (let i = 0; i < 5; i++) {
      const level = levels[i];
      if (level) {
        gridCells.push(renderLevelCell(level, tierColor));
      } else {
        gridCells.push(
          <View key={`empty-${i}`} style={[styles.gridCell, styles.emptyCell]} />
        );
      }
    }
    
    return (
      <View key={tier} style={styles.difficultySection}>
        <View style={styles.difficultyGrid}>
          {gridCells}
        </View>
      </View>
    );
  };

  const renderLevelCell = (level, tierColor) => {
    const isUnlocked = level.id <= gameData.maxLevel;
    const bestScore = Number(gameData.scoresByLevel?.[level.id]) || 0;
    const totalPairs = level.cards / 2;
    const maxPossible = totalPairs * 30;

    return (
      <TouchableOpacity
        key={level.id}
        style={[styles.gridCell, styles.levelCell, !isUnlocked && styles.levelCellLocked]}
        onPress={() => handleLevelPress(level)}
        disabled={!isUnlocked}
      >
        <View style={styles.levelCellContent}>
          <View style={[styles.levelNumber, { backgroundColor: tierColor }]}>
            <Text style={[styles.levelNumberText, !isUnlocked && styles.lockedText]}>
              {level.id}
            </Text>
            {!isUnlocked && (
              <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
            )}
          </View>
          
          <Text style={[styles.levelTitle, !isUnlocked && styles.lockedText]}>
            {level.cards} cards
          </Text>
          
          <View style={styles.statsContainer}>
            <Text style={[styles.scoreText, !isUnlocked && styles.lockedText]}>
              {isUnlocked 
                ? (bestScore > 0 ? `${bestScore}/${maxPossible}` : `—/${maxPossible}`)
                : `—/${maxPossible}`
              }
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Levels</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search levels..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {TIER_FILTERS.map((tier) => (
            <TouchableOpacity
              key={tier.key}
              style={[
                styles.filterChip,
                selectedTier === tier.key && styles.filterChipActive,
                selectedTier === tier.key && { backgroundColor: tier.color }
              ]}
              onPress={() => setSelectedTier(tier.key)}
            >
              <Text style={[
                styles.filterChipText,
                selectedTier === tier.key && styles.filterChipTextActive
              ]}>
                {tier.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Levels Grid */}
      {Object.keys(groupedLevels).length > 0 ? (
        <ScrollView 
          style={styles.levelsContainer}
          contentContainerStyle={styles.levelsList}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedLevels).map(([tier, levels]) => 
            renderDifficultySection(tier, levels)
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No levels found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filter criteria
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  levelsContainer: {
    flex: 1,
  },
  levelsList: {
    padding: 20,
  },
  difficultySection: {
    marginBottom: 24,
  },
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCell: {
    width: '31%',
    height: 100,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyCell: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  levelCell: {
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  levelCellLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  emptyCell: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  levelCellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statsContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
  },
  lockedText: {
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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