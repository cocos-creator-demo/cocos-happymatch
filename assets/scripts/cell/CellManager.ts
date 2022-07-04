import {_decorator, Component, Graphics, UITransform, Color, tween, Vec3} from 'cc';
import {CELL_STATE_ENUM, CELL_TYPE_ENUM, EVENT_ENUM} from "../enum";
import EventManager from "../runtime/EventManager";
import CellStateMachine from './CellStateMachine'

const {ccclass, property} = _decorator;

export const CELL_WIDTH = 30
export const CELL_HEIGHT = 30

export interface ICell {
  type: CELL_TYPE_ENUM
}


@ccclass('CellManager')
export class CellManager extends Component {
  _state: CELL_STATE_ENUM = CELL_STATE_ENUM.IDLE
  fsm: CellStateMachine
  type: CELL_TYPE_ENUM
  x: number = 0
  y: number = 0
  isCollapse: boolean = false
  isChoose: boolean = false

  // 可能会发生一系列操作，需要用一个队列保存并播放动画
  stateQueue: CELL_STATE_ENUM[] = []

  get state() {
    return this._state
  }

  set state(val) {
    this._state = val

    // this.stateQueue.push(this._state)

    // this.fsm.runQueue(this.stateQueue)
    // this.fsm.setParams(CELL_STATE_ENUM[val], true)

  }

  init(x: number, y: number, cell: ICell) {
    this.x = x
    this.y = y
    this.type = cell.type

    this.fsm = new CellStateMachine()
    this.fsm.cell = this
    this.fsm.init()

    this.render()

    this.state = CELL_STATE_ENUM.IDLE


    EventManager.Instance.on(EVENT_ENUM.CHOOSE_CELL, this.onChoose, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.CHOOSE_CELL, this.onChoose)
  }


  render() {
    const ctx = this.addComponent(Graphics)

    ctx.clear()
    ctx.rect(1, 1, CELL_WIDTH - 2, -(CELL_HEIGHT - 2))
    ctx.fillColor = Color[this.type]
    ctx.fill()

    const transform = this.getComponent(UITransform)
    transform.setContentSize(CELL_WIDTH, CELL_HEIGHT)

    this.node.setPosition(this.x * CELL_WIDTH, -this.y * CELL_HEIGHT)
  }


  onChoose(cell: CellManager) {
    if (cell === this) {
      this.state = CELL_STATE_ENUM.CHOOSE
      this.isChoose = true
    } else if (this.isChoose) {
      this.isChoose = false
      this.state = CELL_STATE_ENUM.IDLE
    }
  }

  async moveTo(x, y) {
    const tweenDuration: number = 0.3;
    const target = new Vec3(x * CELL_WIDTH, -y * CELL_HEIGHT, 0)

    return new Promise<void>((resolve) => {
      tween(this.node.position).to(tweenDuration, target,
        {
          easing: 'sineIn',
          onUpdate: (target: Vec3, ratio: number) => {
            this.node.position = target;
          },
          onComplete: () => {
            this.x = x
            this.y = y
            this.node.setPosition(target)
            resolve()
          }
        }
      ).start();
    })
  }

  async doCollapse() {
    this.state = CELL_STATE_ENUM.COLLAPSE
    const tweenDuration: number = 0.3;
    const target = new Vec3(0, 0)

    return new Promise<void>((resolve) => {
      tween(this.node.scale).to(tweenDuration, target,
        {
          easing: 'sineIn',
          onUpdate: (target: Vec3, ratio: number) => {
            this.node.scale = target;
          },
          onComplete: () => {
            this.node.scale = target
            this.isCollapse = true
            resolve()
          }
        }
      ).start();
    })
  }
}

