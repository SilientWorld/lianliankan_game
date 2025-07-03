// SPDX-License-Identifier: MIT

import { useEffect, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '@/app/(tabs)/SettingsPage';

export default function useBackgroundMusic() {
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 读取 BGM 设置
  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem('gameSettings');
      const settings: Settings = settingsJson ? JSON.parse(settingsJson) : {};
      setIsSoundEnabled(settings?.bgmEnabled === true);
    } catch (error) {
      console.error('加载 BGM 设置失败:', error);
    }
  };

  // 轮询检查设置变化（每 1s 检查一次）
  useEffect(() => {
    loadSettings(); // 组件挂载时先检查一次
    const intervalId = setInterval(loadSettings, 1000); // 定期检查

    return () => clearInterval(intervalId); // 组件卸载时清除轮询
  }, []);

  // 控制 BGM 播放/停止
  useEffect(() => {
    let isMounted = true;

    const handleBGM = async () => {
      if (!isMounted) return;
      if (isSoundEnabled) {
        if (!soundRef.current) {
          try {
            const { sound } = await Audio.Sound.createAsync(
              require('@/assets/sounds/game_0.mp3'),
              { isLooping: true }
            );
            if (isMounted) {
              soundRef.current = sound;
              await sound.playAsync();
            }
          } catch (error) {
            console.error('BGM 加载失败', error);
          }
        } else {
          await soundRef.current.playAsync();
        }
      } else {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
        }
      }
    };

    handleBGM();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [isSoundEnabled]);

  return { isSoundEnabled };
}
