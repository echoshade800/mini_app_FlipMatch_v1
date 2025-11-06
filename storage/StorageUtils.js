import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage utility class for FlipMatch app
 * Provides AsyncStorage operations for user data and game progress
 */
class StorageUtils {
  // miniApp name variable
  static miniAppName = 'FlipAndMatchMiniApp';

  /**
   * Get user data
   * @returns {Promise<Object|null>} User data object, returns null if not exists
   */
  static async getUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('本地获取用户数据失败:', error);
      return null;
    }
  }

  /**
   * Save user data
   * @param {Object} userData - User data object
   * @returns {Promise<boolean>} Whether save was successful
   */
  static async saveUserData(userData) {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('保存用户数据失败:', error);
      return false;
    }
  }

  /**
   * Get info data
   * @returns {Promise<any|null>} Info data object, returns null if not exists
   */
  static async getData() {
    try {
      const infoData = await AsyncStorage.getItem(`${this.miniAppName}info`);
      return infoData ? JSON.parse(infoData) : null;
    } catch (error) {
      console.error('获取info信息失败:', error);
      return null;
    }
  }

  /**
   * Set info data
   * @param {any} newData - New info data object
   * @returns {Promise<boolean>} Whether set was successful
   */
  static async setData(newData) {
    try {
      // Read old data first
      const oldData = await this.getData();
      
      // If old data exists, merge with new data using destructuring, new data overrides old data fields
      const mergedData = oldData ? { ...oldData, ...newData } : newData;
      
      // Save merged data
      await AsyncStorage.setItem(`${this.miniAppName}info`, JSON.stringify(mergedData));
      return true;
    } catch (error) {
      console.error('设置info信息失败:', error);
      return false;
    }
  }
}

export default StorageUtils;