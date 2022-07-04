import {Color, Graphics, tween, Vec3} from "cc";
import AnimateState from "../base/AnimateState";
import CellStateMachine from "./CellStateMachine";
import {CELL_HEIGHT, CELL_WIDTH} from "./CellManager";

export default class CellChooseState extends AnimateState {
  constructor(private fsm: CellStateMachine) {
    super();
  }

  run() {
    const {cell} = this.fsm

    let tweenDuration: number = 1.0;                                   // 缓动的时长
    tween(cell.node.scale).to(tweenDuration, new Vec3(1.2, 1.2, 0),    // 这里以node的位置信息坐标缓动的目标
      {                                                               // ITweenOption 的接口实现：
        onUpdate: (target: Vec3, ratio: number) => {                       // onUpdate 接受当前缓动的进度
          cell.node.scale = target;                                // 将缓动系统计算出的结果赋予 node 的位置
        }
      }).start();                                                         // 调用 start 方法，开启缓动
  }
}
