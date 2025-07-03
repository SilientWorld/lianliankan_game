// SPDX-License-Identifier: MIT

import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, TouchableOpacity, Text, Animated, Button } from 'react-native';
import Svg, { Rect, Polyline } from 'react-native-svg';
import ResultPage from '../ResultPage';
import { Settings } from './SettingsPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');
const PADDING = 1;

// Some defaults
let FRUITS = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍍', '🍓', '🥝', '🥭', '🍑'];

// 类型声明
interface Cell {
  x: number;
  y: number;
  symbol: string | null;
  matched: boolean;
}

interface Connection {
  turns: number;
  points: [number, number][];
}

interface Line {
  points: [number, number][];
}

const generateGrid = (gridSize: number): Cell[][] => {
  // 计算总的配对数，保证是偶数
  const totalCells = gridSize * gridSize;
  const totalPairs = (gridSize * gridSize) / 2;

  // 获取物品的配对列表，确保不超过总配对数
  const fruitPairs = [...FRUITS.slice(0, Math.min(totalPairs, FRUITS.length))];

  // 创建一个物品配对数组，保证每个物品有两次出现
  let symbols = fruitPairs.flatMap(f => [f, f]);

  // 处理符号数量不足或过多的情况
  while (symbols.length !== totalCells) {
    if (symbols.length < totalCells) {
      // 数量不足：随机添加一对
      const randomFruit = fruitPairs[Math.floor(Math.random() * fruitPairs.length)];
      symbols.push(randomFruit);
      symbols.push(randomFruit);
    } else if (symbols.length > totalCells) {
      // 数量过多：随机选择一个符号，删除一对
      const randomIndex = Math.floor(Math.random() * symbols.length);
      const symbolToRemove = symbols[randomIndex];

      // 找到并删除该符号的两个实例
      let removedCount = 0;
      symbols = symbols.filter(s => {
        if (s === symbolToRemove && removedCount < 2) {
          removedCount++;
          return false; // 删除该实例
        }
        return true; // 保留其他实例
      });
    }
  }

  // 随机打乱物品列表
  symbols = symbols.sort(() => Math.random() - 0.5);

  // 初始化 grid，留出 padding 的空白
  const grid: Cell[][] = Array(gridSize + 2 * PADDING).fill(null).map(() =>
    Array(gridSize + 2 * PADDING).fill(null).map((_, x) => ({
      symbol: null,
      matched: false,
      x: 0, // 临时 x 和 y
      y: 0, // 临时 x 和 y
    }))
  );

  // 填充 grid 中的实际内容
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      grid[y + PADDING][x + PADDING] = {
        x: x + PADDING,
        y: y + PADDING,
        symbol: symbols.pop()!,  // 每次从 symbols 数组中弹出一个符号
        matched: false,
      };
    }
  }

  return grid;
};

// 判断格子是否为空
const isBlockEmpty = (grid: Cell[][], y: number, x: number): boolean => {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return true; // 边界外视为空
  const cell = grid[y][x];
  return !cell || cell.matched || cell.symbol === null;
};

// 判断两点间是否是畅通直线
const isPathClear = (
  grid: Cell[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number
): boolean => {
  if (x1 === x2) { // 垂直方向
    const [start, end] = y1 < y2 ? [y1 + 1, y2] : [y2 + 1, y1];
    for (let y = start; y < end; y++) {
      if (!isBlockEmpty(grid, y, x1)) return false;
    }
    return true;
  }
  if (y1 === y2) { // 水平方向
    const [start, end] = x1 < x2 ? [x1 + 1, x2] : [x2 + 1, x1];
    for (let x = start; x < end; x++) {
      if (!isBlockEmpty(grid, y1, x)) return false;
    }
    return true;
  }
  return false;
};

// 主连接判断函数
const isConnectable = (grid: Cell[][], a: Cell, b: Cell): Connection | false => {
  if (!a || !b || a.symbol !== b.symbol || a === b || a.matched || b.matched) return false;

  const rowLen = grid[0].length;
  const colLen = grid.length;

  // 直线连接（0次转折）
  if ((a.x === b.x || a.y === b.y) && isPathClear(grid, a.x, a.y, b.x, b.y)) {
    return { turns: 0, points: [[a.x, a.y], [b.x, b.y]] };
  }

  // L形连接（1次转折）
  const checkLPath = (cornerX: number, cornerY: number): boolean => {
    return (
      isBlockEmpty(grid, cornerY, cornerX) &&
      isPathClear(grid, a.x, a.y, cornerX, cornerY) &&
      isPathClear(grid, cornerX, cornerY, b.x, b.y)
    );
  };

  const corner1 = [a.x, b.y];
  const corner2 = [b.x, a.y];
  if (checkLPath(corner1[0], corner1[1])) {
    return { turns: 1, points: [[a.x, a.y], [corner1[0], corner1[1]], [b.x, b.y]] };
  }
  if (checkLPath(corner2[0], corner2[1])) {
    return { turns: 1, points: [[a.x, a.y], [corner2[0], corner2[1]], [b.x, b.y]] };
  }

  // Z形连接（2次转折）
  for (let y1 = 0; y1 < colLen; y1++) {
    for (let x1 = 0; x1 < rowLen; x1++) {
      if (!isBlockEmpty(grid, y1, x1)) continue;

      for (let y2 = 0; y2 < colLen; y2++) {
        for (let x2 = 0; x2 < rowLen; x2++) {
          if (!isBlockEmpty(grid, y2, x2)) continue;

          if (
            isPathClear(grid, a.x, a.y, x1, y1) &&
            isPathClear(grid, x1, y1, x2, y2) &&
            isPathClear(grid, x2, y2, b.x, b.y)
          ) {
            return {
              turns: 2,
              points: [[a.x, a.y], [x1, y1], [x2, y2], [b.x, b.y]],
            };
          }
        }
      }
    }
  }

  return false;
};


const LinkGame: React.FC = () => {
  const [gridSize, setGridSize] = useState(8)
  const [grid, setGrid] = useState<Cell[][]>(generateGrid(2));
  const [selected, setSelected] = useState<Cell | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [score, setScore] = useState<number>(0); // 当前分数
  const [comboCount, setComboCount] = useState<number>(0); // combo 数量
  const [comboProgress, setComboProgress] = useState<number>(0); // combo 进度条
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5分钟的剩余时间
  const [gameOver, setGameOver] = useState<boolean>(false); // 游戏结束标志
  const fadeAnim = useState(new Animated.Value(1))[0];
  const [settings, setSettings] = useState<Settings>();
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [level, setLevel] = useState(6)
  const cellSize = () => Math.min(width, height) / (gridSize + 2);
  const clickSound = require('@/assets/sounds/click.mp3'); // 点击音效

  // 加载设置
  useEffect(() => {
    loadSettings();
    loadLevel();
    setGrid(generateGrid(gridSize));
  }, []);

  // 加载关卡
  const loadLevel = async () => {
    const storedLevel = await AsyncStorage.getItem('selectedLevel');
    if (storedLevel) {
      const newLevel = parseInt(storedLevel, 10);
      setLevel(newLevel);

      let newGridSize = 8; // 默认值
      switch (newLevel) {
        case 1:
          newGridSize = 4;
          FRUITS = ['🍎', '🍌', '🍇', '🍉'];
          break;
        case 2:
          newGridSize = 6;
          FRUITS = ['🍎', '🍌', '🍇', '🍉'];
          break;
        case 3:
          newGridSize = 6;
          break;
        case 4:
          FRUITS = ['🍎', '🍌', '🍇', '🍉'];
          break;
        case 5:
          FRUITS = ['🍎', '🍌', '🍇', '🍉', '🥝', '🥭', '🍑'];
          break;
        default:
          break;
      }

      setGridSize(newGridSize);
      setGrid(generateGrid(newGridSize)); // 立刻更新 `grid`
    }
  };


  // 加载用户设置
  const loadSettings = async () => {
    const storedSettings = await AsyncStorage.getItem('gameSettings');
    if (storedSettings) {
      const parsedSettings: Settings = JSON.parse(storedSettings);
      setSettings(parsedSettings);

      // 设置倒计时 & 分数倍率
      let initialTime = 300;
      let scoreMultiplier = 1;
      if (parsedSettings.difficulty === '简单') {
        initialTime = 300;
        scoreMultiplier = 0.75;
      } else if (parsedSettings.difficulty === '容易') {
        initialTime = 240;
        scoreMultiplier = 1;
      } else if (parsedSettings.difficulty === '难') {
        initialTime = 120;
        scoreMultiplier = 2;
      }

      setTimeLeft(initialTime);
      setScoreMultiplier(scoreMultiplier);
    }
  };

  // 游戏时间倒计时
  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (timeLeft > 0 && !gameOver) {
        setTimeLeft(prevTime => prevTime - 1);
      } else {
        setGameOver(true);
        clearInterval(timeInterval);
        setScore(prevScore => prevScore + 10); // 游戏结束时，剩余 1 秒奖励 10 分
      }
    }, 1000);
    return () => clearInterval(timeInterval); // 清理定时器
  }, [timeLeft, gameOver]);

  // Combo 计时器
  const startComboTimer = () => {
    setComboCount(prevCount => prevCount + 1); // 每次成功连接增加 combo
    setComboProgress(100); // 重置进度条

    // 每 200ms 递减进度条，可以叠加
    const progressInterval = setInterval(() => {
      setComboProgress((prevProgress) => {
        if (prevProgress <= 0) {
          clearInterval(progressInterval); // 结束进度条
          setComboCount(0);                // Combo 超时，重置
          return 0;
        }
        return prevProgress - 1;
      });
    }, 200);
  };

  // 重开游戏
  const restartGame = () => {
    loadLevel();
    loadSettings()

    setGrid(generateGrid(gridSize)); // 重新生成网格
    setSelected(null);
    setLines([]);
    setScore(0);
    setComboCount(0);
    setComboProgress(0);
    setTimeLeft(300); // 重置时间
    setGameOver(false); // 重新开始游戏
  };

  // 播放点击声音
  const useClickSound = () => {
    const soundRef = useRef<Audio.Sound | null>(null);

    useEffect(() => {
      const loadSound = async () => {
        const { sound } = await Audio.Sound.createAsync(clickSound);
        soundRef.current = sound;
      };

      loadSound();

      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync();
        }
      };
    }, []);

    const playSound = async () => {
      if (soundRef.current) {
        await soundRef.current.stopAsync(); // 停止当前播放
        await soundRef.current.setPositionAsync(0); // 重置到开头
        await soundRef.current.playAsync(); // 重新播放
      }
    };

    return playSound;
  };
  const playClickSound = useClickSound();


  // 点击
  const handleSelect = (cell: Cell) => {
    if (cell.matched || !cell.symbol) return;
    if (settings?.soundEffectsEnabled == true) {
      playClickSound(); // 播放声音
    }

    if (!selected) {
      setSelected(cell);
    } else {
      const connection = isConnectable(grid, selected, cell);
      if (connection) {
        setLines([{ points: connection.points }]);
        // 得分计算，100分 + combo 增加分数
        let points = 100;
        if (comboCount > 0) {
          points += Math.floor(100 * 0.1 * comboCount); // Combo 增加 10% 得分
        }
        setScore(prevScore => prevScore + points * scoreMultiplier);

        setGrid(prev =>
          prev.map(row =>
            row.map(c =>
              (c.x === selected.x && c.y === selected.y) || (c.x === cell.x && c.y === cell.y)
                ? { ...c, matched: true, symbol: null }
                : c
            )
          )
        );
        // 启动 combo
        startComboTimer();
      }
      setSelected(null);
    }
  };

  // 连接线条
  useEffect(() => {
    if (lines.length > 0) {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000, // 1秒淡出
        useNativeDriver: false,
      }).start(() => setLines([])); // 动画完成后清除线条
    }
  }, [lines]);

  // 判断游戏是否完成
  useEffect(() => {
    const allMatched = grid.flat().every(cell => cell.matched || !cell.symbol);
    if (allMatched) {
      setGameOver(true);
    }
  }, [grid]);

  if (gameOver) {
    const remainingTiles = grid.flat().filter(cell => !cell.matched && cell.symbol).length;
    return <ResultPage score={score} remainingTiles={remainingTiles} isWin={remainingTiles === 0} onRestart={restartGame} />;
  }


  const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

  return (
    <ThemedView lightColor='0xe0f7fa' darkColor='0xBDBDBD' style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {/* 显示顶部信息 */}
      <View style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', flexDirection: 'row', justifyContent: 'space-between' }}>

        <View>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>剩余时间</ThemedText>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>{timeLeft}s </ThemedText>
        </View>

        <View>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>关卡</ThemedText>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>{level}</ThemedText>
        </View>

        <View>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>分数</ThemedText>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>{score}</ThemedText>
        </View>
        <View>
          <ThemedText type='none' style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>combo</ThemedText>
          <ThemedText style={{
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center'
          }}>{comboCount}</ThemedText>
          <Animated.View
            style={{
              width: `${comboProgress}%`,
              height: '100%',
              backgroundColor: '#4caf50',
              maxHeight: 10
            }}
          />
        </View>
      </View>

      <Svg width={gridSize * cellSize()} height={gridSize * cellSize()}>
        {lines.map((line, i) => (
          <AnimatedPolyline
            key={i}
            points={line.points.map(([x, y]) => `${(x - 0.5) * cellSize()},${(y - 0.5) * cellSize()}`).join(' ')}
            stroke="#0288d1"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeOpacity={fadeAnim} // 让线条随动画淡出
          />
        ))}
        {grid.slice(PADDING, -PADDING).map((row, y) =>
          row.slice(PADDING, -PADDING).map((cell, x) => (
            <Rect
              key={`${x}-${y}`}
              x={x * cellSize() + 2}
              y={y * cellSize() + 2}
              width={cellSize() - 4}
              height={cellSize() - 4}
              fill={cell.matched ? 'transparent' : '#fff9c4'}
              stroke={selected?.x === cell.x && selected?.y === cell.y ? '#f44336' : '#4caf50'}
              strokeWidth={2}
              rx={8}
            />
          ))
        )}
      </Svg>

      <View style={{ position: 'absolute', paddingTop: gridSize * (cellSize() + 6) }}>
        <TouchableOpacity
          onPress={restartGame}
          style={{
            position: 'absolute',
            top: gridSize * (cellSize() + 6), // 控制位置
            alignSelf: 'center', // 居中
            backgroundColor: '#0288d1', // 按钮背景色（蓝色）
            paddingVertical: 12, // 纵向内边距
            paddingHorizontal: 24, // 横向内边距
            borderRadius: 10, // 圆角
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5, // Android 阴影
            width: 200, // 按钮宽度，避免文字换行
            alignItems: 'center', // 文字水平居中
          }}
        >
          <Text style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>
            🔄 重新开始游戏
          </Text>
        </TouchableOpacity>

      </View>

      <View style={{ position: 'absolute', width: gridSize * cellSize(), height: gridSize * cellSize(), backgroundColor: 'transparent' }}>
        {grid.slice(PADDING, -PADDING).map((row, y) =>
          row.slice(PADDING, -PADDING).map((cell, x) => (
            <TouchableOpacity
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * cellSize(),
                top: y * cellSize(),
                width: cellSize(),
                height: cellSize(),
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
              onPress={() => handleSelect(cell)}
            >
              {!cell.matched && cell.symbol && (
                <Text style={{
                  fontSize: cellSize() * 0.6,
                  textAlign: 'center',
                  textShadowColor: '#00000020',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                }}>
                  {cell.symbol}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ThemedView>
  );
};

export default LinkGame;