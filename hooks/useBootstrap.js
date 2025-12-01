import { useEffect } from 'react';
import { Audio } from 'expo-av';
import useGameStore from '../store/useGameStore';

/**
 * Bootstrap hook to initialize app data on startup
 * Handles the startup identity flow as required
 */
export default function useBootstrap() {
  const { initialize, isLoading, error } = useGameStore();

  useEffect(() => {
    // Initialize Audio mode for sound effects
    const initializeAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        console.log('🔊 Audio mode initialized successfully');
      } catch (err) {
        console.error('Failed to initialize audio mode:', err);
      }
    };

    initializeAudio();

    initialize().catch((err) => {
      // Error is already handled by the store
      console.error('Initialization error:', err);
    });
  }, []);

  return { isLoading, error };
}