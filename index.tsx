import { AppRegistry } from 'react-native';
import { ExpoRoot } from 'expo-router';

// 让 expo-router 扫描 ./app 目录
function Root() {
  const ctx = (require as any).context ? (require as any).context('./app') : undefined;
  return <ExpoRoot context={ctx} />;
}

AppRegistry.registerComponent('FlipAndMatchMiniApp', () => Root);