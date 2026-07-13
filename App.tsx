/**
 * Grabix Pro — offline video/audio grabber.
 * @format
 */
import React, {useState} from 'react';
import {Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {Download, Library, Settings, type LucideIcon} from 'lucide-react-native';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import {DownloadsProvider, useDownloads} from './src/downloads';
import FirstRunSetup from './src/FirstRunSetup';
import Snackbar from './src/components/Snackbar';
import {Logo} from './src/ui';
import {colors} from './src/theme';

type Tab = 'home' | 'library' | 'settings';

const TABS: {key: Tab; label: string; icon: LucideIcon}[] = [
  {key: 'home', label: 'Grab', icon: Download},
  {key: 'library', label: 'Library', icon: Library},
  {key: 'settings', label: 'Settings', icon: Settings},
];

function Shell() {
  const [tab, setTab] = useState<Tab>('home');
  const {active} = useDownloads();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.appbar}>
        <Logo size={30} />
        <Text style={styles.wordmark}>
          Grabix <Text style={styles.wordmarkAccent}>Pro</Text>
        </Text>
      </View>

      <View style={styles.screen}>
        {tab === 'home' && <HomeScreen onGoToLibrary={() => setTab('library')} />}
        {tab === 'library' && <LibraryScreen />}
        {tab === 'settings' && <SettingsScreen />}
        <Snackbar />
      </View>

      <View style={styles.tabbar}>
        {TABS.map(({key, label, icon: Icon}) => {
          const isActive = key === tab;
          const badge = key === 'library' ? active.length : 0;
          return (
            <Pressable key={key} style={styles.tab} onPress={() => setTab(key)}>
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Icon
                  size={24}
                  color={isActive ? colors.primary : colors.textDim}
                  strokeWidth={isActive ? 2.6 : 2}
                />
                {badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DownloadsProvider>
        <Shell />
        <FirstRunSetup />
      </DownloadsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  wordmark: {color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.2},
  wordmarkAccent: {color: colors.primary},
  screen: {flex: 1},
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {flex: 1, alignItems: 'center'},
  iconWrap: {paddingHorizontal: 20, paddingVertical: 5, borderRadius: 14},
  iconWrapActive: {backgroundColor: colors.surfaceAlt},
  tabLabel: {fontSize: 11, color: colors.textDim, marginTop: 4, fontWeight: '600'},
  tabLabelActive: {color: colors.primary, fontWeight: '800'},
  badge: {
    position: 'absolute',
    top: -2,
    right: 12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {color: colors.onPrimary, fontSize: 10, fontWeight: '800'},
});
