# FlipMatch

A React Native Expo card matching game with 25 challenging levels, advanced scoring system, and power-up mechanics.

## 🎮 Game Features

- **25 Progressive Levels**: From 2 cards (Level 1) to 78 cards (Level 25) across 5 difficulty tiers
- **200 Emoji Pool**: Unique emoji cards including faces, animals, food, and objects
- **Advanced Scoring System**: Three-component scoring (Accuracy, Combo, Time)
- **Power-up System**: Three power-ups with coin-based economy
- **Haptic Feedback**: Tactile responses for matches and interactions
- **Progress Tracking**: Persistent best scores, times, and level unlocking
- **Coin Economy**: Earn coins from scores, spend on power-ups
- **Responsive Design**: Works on iOS, Android, and Web

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Platform-Specific Commands

```bash
# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Run on Web
npx expo start --web

# Build for production
expo export --platform web
```

## 📱 How to Play

### Basic Gameplay
1. **Preview Phase**: Cards are shown face-up for memorization (3-12 seconds based on level)
2. **Matching Phase**: Flip two cards to find matching emoji pairs
3. **Win Condition**: Clear all pairs to complete the level
4. **Progression**: Complete levels to unlock new challenges

### Difficulty Tiers
- **Easy** (Levels 1-5): 2-12 cards, 2-4 rows
- **Medium** (Levels 6-10): 16-28 cards, 4-7 rows  
- **Hard** (Levels 11-15): 30-42 cards, 6-8 rows
- **Very Hard** (Levels 16-20): 48-60 cards, 8-10 rows
- **Extreme** (Levels 21-25): 64-78 cards, 8-13 rows

### Power-ups
- **💣 Bomb** (50 coins): Randomly removes one pair of unmatched cards
- **👀 Glimpse** (100 coins): Reveals all cards for 5 seconds then flips them back
- **⏭️ Skip** (600 coins): Instantly completes the current level

### Coin System
- Earn 1 coin per point scored
- Use coins to purchase power-ups (pay-per-use)
- No inventory system - direct purchase and use

## 🏗 Project Structure

```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── index.js           # Home dashboard with level progress
│   ├── levels.js          # Levels browser with filtering
│   └── profile.js         # User profile & settings
├── game/[levelId].js      # Main gameplay screen
├── onboarding.js          # Tutorial & welcome screen
└── +not-found.tsx        # 404 error page

components/
├── GameCard.js            # Individual card with flip animations
├── GameGrid.js            # Responsive grid layout for cards
├── GameHeader.js          # Game UI header with coins display
├── PowerupBar.js          # Power-up selection and purchase
├── ScoreProgressBars.js   # Animated score display
├── ComboDisplay.js        # Combo streak visualization
└── LevelsCompletedCard.js # Level completion statistics

constants/
├── levels.js              # Level configurations, emoji pool, colors
└── cardBacks.js           # Card back images for different tiers

store/
└── useGameStore.js        # Zustand global state management

storage/
└── StorageUtils.js        # AsyncStorage utilities

utils/
└── scoring.js             # Scoring algorithms and calculations

hooks/
├── useBootstrap.js        # App initialization
└── useFrameworkReady.ts   # Framework readiness detection
```

## 📊 Scoring System

### Accuracy Score (0 - CAP)
- **Formula**: `(totalPairs / attempts) × CAP`
- **CAP**: Total pairs × 10
- **Goal**: Minimize attempts for maximum accuracy

### Combo Score (0 - CAP) 
- **Formula**: `(maxConsecutiveMatches / totalPairs) × CAP`
- **CAP**: Total pairs × 10
- **Goal**: Achieve long streaks without mistakes

### Time Score (0 - CAP)
- **Gold Time**: 3 seconds per pair = Maximum points
- **Bronze Time**: 6 seconds per pair = Minimum points
- **Formula**: Linear interpolation between gold and bronze times
- **CAP**: Total pairs × 10

### Total Score
- **Sum**: Accuracy + Combo + Time scores
- **Maximum**: CAP × 3 (30 points per pair)
- **Percentage**: Calculated against maximum possible score

## 🎯 Game Mechanics

### Preview Time Calculation
```
previewTime = max(3, min(12, 2 + 0.35 × (cards/2)))
```
- Minimum: 3 seconds
- Maximum: 12 seconds
- Rounded to nearest 0.5 seconds

### Power-up Effects
- **Bomb**: Counts as 1 attempt, adds to match history and combo
- **Glimpse**: 5-second reveal, time continues counting
- **Skip**: Instant completion, no scoring

### Progress Tracking
- **Best Score**: Highest total score per level
- **Best Time**: Fastest completion time per level
- **Recent Runs**: Last 10 game sessions
- **Max Level**: Highest unlocked level (starts at 1)

## 🛠 Development

### Dependencies
- **Expo SDK 54.0.7**: React Native framework
- **React 19.1.0**: UI framework
- **Zustand 5.0.2**: Lightweight state management
- **AsyncStorage**: Local data persistence
- **Expo Haptics**: Tactile feedback
- **Expo Router**: File-based navigation
- **React Native Reanimated**: Smooth animations

### Scripts
- `npm run dev`: Start development server
- `npm run build:web`: Build for web deployment
- `npm run lint`: Run ESLint checks

### Key Files
- `constants/levels.js`: Game configuration and emoji pool
- `utils/scoring.js`: Scoring algorithms
- `store/useGameStore.js`: Global state management
- `components/PowerupBar.js`: Power-up system implementation

## 🎨 UI Features

- **Color-coded Tiers**: Each difficulty tier has distinct colors
- **Card Back Images**: Different images for each tier
- **Smooth Animations**: Card flip, score progress, combo displays
- **Responsive Layout**: Adapts to different screen sizes
- **Safe Area Support**: Proper handling of device notches and status bars

## 📈 Future Enhancements

1. **Daily Challenges**: Special levels with unique rewards
2. **Achievement System**: Unlockable badges and milestones
3. **Leaderboards**: Global and local rankings
4. **Custom Levels**: Level editor for user-created content
5. **Sound Effects**: Audio feedback for matches and interactions
6. **Themes**: Multiple visual themes and card designs
7. **Statistics Dashboard**: Detailed performance analytics
8. **Social Features**: Share scores and compete with friends

## 📄 License

© 2025 FlipMatch. All rights reserved.