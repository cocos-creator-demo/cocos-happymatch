消消乐
====

参考

* [从基本游戏设计的角度浅析消除类游戏](https://www.gameres.com/476318.html)

## 核心逻辑

### 随机地图生成

需要生成初始没有三消的地图

### 检测消除

滑动单元格，执行消除逻辑

### 重置地图

补全被消除的空位，同时递归检测是否有可以直接被消除的地方

### 检测地图是否无法操作

如果没有可以操作的地方，需要重置地图

也可以实现提示功能
