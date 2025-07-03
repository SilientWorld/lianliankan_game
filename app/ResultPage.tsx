// SPDX-License-Identifier: MIT 开源许可证声明

// 引入 React 相关模块
import React, { useEffect, useState } from 'react';
// 引入 React Native UI 组件
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
// 引入本地存储模块
import AsyncStorage from '@react-native-async-storage/async-storage';
// 引入排行榜组件
import LeaderBoard from './(tabs)/LeaderBoard';
// 引入自定义主题组件
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// 定义 props 接口
interface ResultPageProps {
  score: number;              // 当前得分
  remainingTiles: number;     // 剩余未配对方块数量
  isWin: boolean;             // 是否胜利
  onRestart: () => void;      // 点击“再来一局”按钮后的回调
}

// 结果页组件
const ResultPage: React.FC<ResultPageProps> = ({ score, remainingTiles, isWin, onRestart }) => {
  // 用户名输入框的值
  const [name, setName] = useState('');
  // 是否展示排行榜
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // 是否已经提交过分数
  const [submitted, setSubmitted] = useState(false);
  // 当前关卡号（从本地读取）
  const [level, setLevel] = useState<number | null>(null);
  // 新解锁的最大关卡
  const [newMaxLevel, setNewMaxLevel] = useState(0);

  // 组件加载时执行一次，读取当前关卡信息
  useEffect(() => {
    loadLevel();
  }, []);

  // 读取当前选择的关卡，并判断是否需要更新 maxLevel
  const loadLevel = async () => {
    const storedLevel = await AsyncStorage.getItem('selectedLevel'); // 当前玩的关卡
    if (storedLevel) {
      setLevel(parseInt(storedLevel, 10));
    }

    // 当前关卡数，默认从1开始
    const lvl = parseInt(storedLevel ? storedLevel : "1", 10);
    const storedMaxLevel = await AsyncStorage.getItem('maxLevel');

    if (isWin === true) { // 如果游戏胜利
      if (storedMaxLevel) {
        const maxLevel = parseInt(storedMaxLevel, 10);
        // 如果当前关卡大于或等于最大关卡，就更新最大关卡
        if (lvl != null && lvl >= maxLevel) {
          await AsyncStorage.setItem('maxLevel', (lvl + 1).toString());
        }
      } else {
        // 第一次通关，初始化 maxLevel
        await AsyncStorage.setItem('maxLevel', (lvl ? lvl + 1 : 2).toString());
      }
      setNewMaxLevel(lvl ? lvl + 1 : 2);
    }
  };

  // 保存当前分数到排行榜
  const saveScore = async () => {
    if (!name.trim() || level === null) return; // 名字为空或关卡无效则不处理

    const newScore = { name: name.trim(), score };

    // 获取当前关卡的排行榜数据
    const storedScores = await AsyncStorage.getItem('leaderboard_' + level.toString());
    let scores = storedScores ? JSON.parse(storedScores) : [];

    // 查找是否已经存在该用户名
    const existingIndex = scores.findIndex((entry: any) => entry.name === newScore.name);
    if (existingIndex !== -1) {
      // 如果新分数更高，就更新原分数
      if (scores[existingIndex].score < newScore.score) {
        scores[existingIndex] = newScore;
      }
    } else {
      // 不存在则添加新记录
      scores.push(newScore);
    }

    // 排序并只保留前 5 名
    scores = scores.sort((a: any, b: any) => b.score - a.score).slice(0, 5);

    // 保存到本地
    await AsyncStorage.setItem('leaderboard_' + level.toString(), JSON.stringify(scores));

    setSubmitted(true); // 标记已提交

    // 延迟展示排行榜
    setTimeout(() => {
      setShowLeaderboard(true);
    }, 300);
  };

  // 如果需要展示排行榜界面，渲染 LeaderBoard 组件
  if (showLeaderboard) {
    return <LeaderBoard onBack={() => setShowLeaderboard(false)} />;
  }

  // 否则展示结果页面（胜利或失败）
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {isWin ? (
        // 胜利场景
        <>
          <Text style={{ fontSize: 36, fontWeight: 'bold' }}>🎉 恭喜你获胜！🎉</Text>
          <Text style={{ fontSize: 24, marginTop: 10 }}>第 {level} 关</Text>
          <Text style={{ fontSize: 24, marginBottom: 10 }}>你的得分: {score}</Text>

          {/* 如果不是最后一关，提示解锁了新关卡 */}
          {(level != 6 && newMaxLevel != 0) ? (
            <Text style={{ fontSize: 24, marginBottom: 10 }}>
              你解锁了 第 {newMaxLevel} 关
            </Text>
          ) : null}

          {/* 用户名输入框 */}
          <TextInput
            placeholder="输入你的名字"
            value={name}
            onChangeText={setName}
            style={{
              borderBottomWidth: 2,
              marginVertical: 10,
              width: 220,
              textAlign: 'center',
              fontSize: 24,
              padding: 5,
            }}
          />

          {/* 提交按钮 */}
          <TouchableOpacity
            onPress={saveScore}
            style={{
              backgroundColor: '#0288d1',
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
              marginVertical: 10,
              width: 200,
              alignItems: 'center',
            }}
            disabled={submitted} // 防止重复提交
          >
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>提交</Text>
          </TouchableOpacity>

          {/* 查看排行榜按钮 */}
          <TouchableOpacity
            onPress={() => setShowLeaderboard(true)}
            style={{
              backgroundColor: '#FF9800',
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
              marginVertical: 10,
              width: 200,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>查看排行榜</Text>
          </TouchableOpacity>

          {/* 再来一局按钮 */}
          <TouchableOpacity
            onPress={onRestart}
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
              marginVertical: 10,
              width: 200,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>再来一局</Text>
          </TouchableOpacity>
        </>
      ) : (
        // 失败场景
        <>
          <ThemedText type='none' style={{ fontSize: 54, fontWeight: 'bold' }}>⌛ 时间到！</ThemedText>
          <ThemedText type='none' style={{ fontSize: 32, marginBottom: 20 }}>
            剩余未匹配的格子: {remainingTiles}
          </ThemedText>

          {/* 再试一次按钮 */}
          <TouchableOpacity
            onPress={onRestart}
            style={{
              backgroundColor: '#D32F2F',
              paddingVertical: 14,
              paddingHorizontal: 28,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
              marginVertical: 10,
              width: 200,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>再试一次</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ResultPage;
