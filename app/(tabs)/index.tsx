// SPDX-License-Identifier: MIT

import { Image, StyleSheet, Animated, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const navigation = useNavigation();                               // 处理导航
  const fadeAnim = useRef(new Animated.Value(0)).current;           // 处理动画效果
  const [selectedLevel, setSelectedLevel] = useState<Number>(1);    // 当前选择的关卡
  const [maxLevel, setMaxLevel] = useState(1);                      // 可以选择最大的关卡
  const isFocused = useIsFocused()                                  // 检测是否切换到此页面

  useEffect(() => {
    // 动画效果处理部分
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // 选择关卡
    const loadLevel = async () => {
      const storedLevel = await AsyncStorage.getItem('selectedLevel');
      if (storedLevel) {
        setSelectedLevel(parseInt(storedLevel, 10));
      }
      
      const storedMaxLevel = await AsyncStorage.getItem('maxLevel');
      if (storedMaxLevel) {
        setMaxLevel(parseInt(storedMaxLevel, 10));
      }
    };

    loadLevel();
  }, [isFocused]);

  // 保存选择的关卡
  const saveLevel = async (level: Number) => {
    setSelectedLevel(level);
    await AsyncStorage.setItem('selectedLevel', level.toString());
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#ffffff', dark: '#000000' }}
      headerImage={
        <Image
          source={require('@/assets/images/game-banner.png')}
          style={styles.bannerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <Animated.Text style={[styles.gameTitle, { opacity: fadeAnim }]}>连连看游戏</Animated.Text>
        <ThemedText type="subtitle">测试你的眼力和记忆力，快速匹配相同的图案！</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">怎么玩？</ThemedText>
        <ThemedText>找到两个相同的图案，并连接它们，路径不能超过两次转弯。</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">游戏模式</ThemedText>
        <ThemedText>多种难度选择，挑战你的极限！</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">难度选择</ThemedText>
        <ThemedText>简单中你有300秒，0.75倍分数</ThemedText>
        <ThemedText>普通中你有240秒，1倍分数</ThemedText>
        <ThemedText>困难中你有120秒，2倍分数</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">选择关卡</ThemedText>
        <View style={styles.levelContainer}>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() => {level <= maxLevel ? saveLevel(level) : {}}}
              style={[styles.levelButton, selectedLevel === level && styles.selectedLevelButton, level > maxLevel && styles.unselectableLevelButton]}
            >
              <ThemedText style={styles.levelButtonText}>{level}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <ThemedText>选择关卡后请点击开始游戏，然后重新开始游戏</ThemedText>
      </ThemedView>
      <View style={styles.buttonGroup}>
        {/* 下面报错有问题，能跑的 */}
        <TouchableOpacity onPress={() => navigation.navigate('LinkGame')} style={styles.startButton}>
          <ThemedText style={styles.startButtonText}>开始游戏</ThemedText>
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

// 页面 CSS
const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff9800',
    textAlign: 'center',
  },
  stepContainer: {
    marginBottom: 15,
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  levelButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  selectedLevelButton: {
    backgroundColor: '#ff9800',
  },
  unselectableLevelButton: {
    backgroundColor: '#808080',
  },
  levelButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  startButton: {
    backgroundColor: '#ff5722',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  bannerImage: {
    height: 200,
    width: '100%',
    resizeMode: 'contain',
  },
});