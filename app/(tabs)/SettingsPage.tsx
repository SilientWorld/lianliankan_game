// SPDX-License-Identifier: MIT

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// 使用 Typescript 特性保证一部分的类型安全
export interface Settings {
  difficulty: '简单' | '容易' | '难';
  bgmEnabled: boolean;
  soundEffectsEnabled: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({  // 缺省设置
    difficulty: '容易',
    bgmEnabled: false,
    soundEffectsEnabled: false,
  });

  // 初始化时加载存储的设置
  useEffect(() => {
    loadSettings();
  }, []);

  // 从存储器加载设置
  const loadSettings = async () => {
    const storedSettings = await AsyncStorage.getItem('gameSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  };

  // 保存设置到 AsyncStorage
  const saveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    await AsyncStorage.setItem('gameSettings', JSON.stringify(newSettings));
  };

  return (
    <ThemedView darkColor='0xffffff' style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <ThemedText type='none' style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 20 }}>⚙️ 游戏设置</ThemedText>
      
      <ThemedText type='none' style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>将在下次游戏生效</ThemedText>

      {/* 难度选择 */}
      <View style={{ marginBottom: 20, alignItems: 'center' }}>
        <ThemedText type='none' style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>🎮 难度选择</ThemedText>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 260 }}>
          {['简单', '容易', '难'].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => saveSettings({ ...settings, difficulty: level as Settings['difficulty'] })}
              style={{
                backgroundColor: settings.difficulty === level ? '#0288d1' : '#B0BEC5',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 5,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 背景音乐开关 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 260, marginBottom: 20 }}>
        <ThemedText type='none' style={{ fontSize: 22, fontWeight: 'bold' }}>🎵 背景音乐</ThemedText>
        <Switch
          value={settings.bgmEnabled}
          onValueChange={(value) => saveSettings({ ...settings, bgmEnabled: value })}
        />
      </View>

      {/* 点击音效开关 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: 260, marginBottom: 20 }}>
        <ThemedText style={{ fontSize: 22, fontWeight: 'bold' }}>🔊 点击音效</ThemedText>
        <Switch
          value={settings.soundEffectsEnabled}
          onValueChange={(value) => saveSettings({ ...settings, soundEffectsEnabled: value })}
        />
      </View>

      {/* 返回按钮 */}
      <TouchableOpacity
        onPress={() => {}}
        style={{
          backgroundColor: '#4CAF50',
          paddingVertical: 14,
          paddingHorizontal: 28,
          borderRadius: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
          width: 200,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>保存</Text>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default SettingsPage;
