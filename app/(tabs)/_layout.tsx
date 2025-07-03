// SPDX-License-Identifier: MIT

import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Icon } from 'react-native-elements'
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import useBackgroundMusic from '@/components/useBackgroundMusic';

// 定义最下面的 tab
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isSoundEnabled } = useBackgroundMusic(); // BGM，这里的 LifeCycle 最长所以没问题
  
  // 下方 Tab Navigation 的选项在这里定义
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // 保证可以在 iPhone 上有一致的显示效果
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      {/* 上面的内容是 React Native For iOS 的，不用管 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '主页',
          tabBarIcon: ({ color }) => <Icon size={28} name="home" color={color} type='material' />, 
        }}
      />
      <Tabs.Screen
        name="LinkGame"
        options={{
          title: '游戏',
          tabBarIcon: ({ color }) => <Icon size={28} name="games" color={color} type='material' />,
        }}
      />
      <Tabs.Screen
        name="LeaderBoard"
        options={{
          title: '排行',
          tabBarIcon: ({ color }) => <Icon size={28} name="leaderboard" color={color} type='material'/>,
        }}
      />
      <Tabs.Screen
        name="SettingsPage"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <Icon size={28} name="settings" color={color} type='material' />,
        }}
      />
    </Tabs>
  );
}
