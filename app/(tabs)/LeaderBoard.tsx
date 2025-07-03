// SPDX-License-Identifier: MIT 开源许可证声明

// 引入必要的 React 和 React Native 库
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
// 引入本地存储模块
import AsyncStorage from '@react-native-async-storage/async-storage';
// 引入自定义主题组件（封装了 View 和 Text）
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

// 定义排行榜每一项的结构：包含名字和分数
interface ScoreEntry {
  name: string;
  score: number;
}

// LeaderBoard 组件，接收一个 onBack 回调函数用于返回上一页面
const LeaderBoard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // 排行榜数据状态
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  // 当前选中的关卡，默认为第 1 关
  const [level, setLevel] = useState<number>(1);

  // 异步加载选中的关卡
  const loadLevel = async () => {
    const storedLevel = await AsyncStorage.getItem('selectedLevel'); // 从本地存储中读取关卡
    if (storedLevel) {
      setLevel(parseInt(storedLevel, 10)); // 如果存在，转换为整数并更新状态
    } else {
      setLevel(1); // 如果没有存储的关卡，使用默认的第 1 关
    }
  };

  // 加载指定关卡的排行榜数据
  const loadScores = async (l: number) => {
    const storedScores = await AsyncStorage.getItem('leaderboard_' + l.toString()); // 从本地存储中读取排行榜数据
    if (storedScores) {
      const parsedScores: ScoreEntry[] = JSON.parse(storedScores); // 解析 JSON 字符串为对象数组
      // 使用 Map 去重：key 为 name-score 的组合，value 为对象本身
      const uniqueScores = Array.from(
        new Map(parsedScores.map((item) => [`${item.name}-${item.score}`, item])).values()
      );
      setScores(uniqueScores); // 设置去重后的排行榜数据
    } else {
      setScores([]); // 如果没有数据，清空排行榜
    }
  };

  // 第一次渲染组件时加载当前选中的关卡
  useEffect(() => {
    loadLevel();
  }, []);

  // 每当关卡 `level` 变化时，重新加载对应的排行榜
  useEffect(() => {
    loadScores(level);
  }, [level]);

  // 返回对应名次的奖牌 emoji
  const getMedal = (index: number) => {
    if (index === 0) return '🥇'; // 第1名
    if (index === 1) return '🥈'; // 第2名
    if (index === 2) return '🥉'; // 第3名
    return ''; // 其余不显示奖牌
  };

  return (
    <ThemedView style={{ flex: 1, padding: 10, paddingTop: 40, alignItems: 'center' }}>
      {/* 标题：显示当前关卡的排行榜 */}
      <ThemedText type='none' style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
        🏆 第 {level} 关排行榜 🏆
      </ThemedText>

      {/* 如果排行榜有数据，展示排行榜列表 */}
      {scores.length > 0 ? (
        <FlatList
          data={scores} // 数据源
          keyExtractor={(item, index) => index.toString()} // 唯一 key
          renderItem={({ item, index }) => (
            <Text style={{ fontSize: 22, marginVertical: 8 }}>
              {getMedal(index)} {index + 1}. {item.name} - {item.score} 分
            </Text>
          )}
        />
      ) : (
        // 如果没有排行榜数据，显示提示
        <ThemedText style={{ fontSize: 20, color: 'gray', marginTop: 20 }}>
          暂无排行榜数据
        </ThemedText>
      )}

      {/* 底部的返回按钮 */}
      <View style={{ position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => {
            loadLevel(); // 重新加载关卡
            if (onBack) onBack(); // 如果传入了返回函数，调用它
          }}
          style={{
            backgroundColor: '#0288d1', // 按钮背景颜色
            paddingVertical: 14,
            paddingHorizontal: 28,
            borderRadius: 10, // 圆角
            shadowColor: '#000', // 阴影
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5, // 安卓阴影
            width: 200,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 22, color: '#fff', fontWeight: 'bold' }}>
            {onBack != null ? "返回" : "刷新"}
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

export default LeaderBoard;
