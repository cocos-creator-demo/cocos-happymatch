import {_decorator, Component, Sprite, Color, UITransform, Graphics} from 'cc';
import {CELL_STATE_ENUM, CELL_TYPE_ENUM, EVENT_ENUM} from "../enum";
import EventManager from "../runtime/EventManager";
import AnimationStateMachine, {getInitParamsTrigger} from "../base/AnimationStateMachine";
import AnimateState from "../base/AnimateState";

const {ccclass, property} = _decorator;

export const CELL_WIDTH = 30
export const CELL_HEIGHT = 30

export interface ICell {
  type: CELL_TYPE_ENUM
}

class CellIdleState extends AnimateState {
  constructor(private fsm: CellStateMachine) {
    super();
  }

  run() {

  }
}

class CellStateMachine extends AnimationStateMachine {
  init() {
    this.initParams()
    this.initStateMap()
  }

  initParams() {
    this.params.set(CELL_STATE_ENUM.IDLE, getInitParamsTrigger())
  }

  initStateMap() {
    this.stateMap.set(CELL_STATE_ENUM.IDLE, new CellIdleState(this))
  }

  run() {
    switch (this.currentState) {
      case this.stateMap.get(CELL_STATE_ENUM.IDLE):
      case this.stateMap.get(CELL_STATE_ENUM.CHOOSE):

        if (this.params.get(CELL_STATE_ENUM.CHOOSE).value) {
          this.currentState = this.stateMap.get(CELL_STATE_ENUM.CHOOSE)
        }

        break
      default:
        this.currentState = this.stateMap.get(CELL_STATE_ENUM.IDLE)
    }

  }
}

@ccclass('CellManager')
export class CellManager extends Component {
  _state: CELL_STATE_ENUM = CELL_STATE_ENUM.IDLE
  fsm: CellStateMachine
  type: CELL_TYPE_ENUM
  x: number = 0
  y: number = 0
  isCollapse: boolean = false

  // 可能会发生一系列操作，需要用一个队列保存并播放动画
  stateQueue: CELL_STATE_ENUM[]

  get state() {
    return this._state
  }

  set state(val) {
    // todo 触发fsm修改状态动画
    this._state = val
  }

  init(x: number, y: number, cell: ICell) {
    this.x = x
    this.y = y
    this.type = cell.type

    this.fsm = new CellStateMachine()
    this.fsm.init()

    this.render()

    EventManager.Instance.on(EVENT_ENUM.CHOOSE_CELL, this.onChoose, this)
  }

  render() {
    const ctx = this.addComponent(Graphics)

    ctx.rect(1, 1, CELL_WIDTH - 2, -(CELL_HEIGHT - 2))
    ctx.fillColor = Color[this.type]
    ctx.fill()

    const transform = this.getComponent(UITransform)
    transform.setContentSize(CELL_WIDTH, CELL_HEIGHT)

    this.node.setPosition(this.x * CELL_WIDTH, -this.y * CELL_HEIGHT)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.CHOOSE_CELL, this.onChoose)
  }

  onChoose() {
    this.state = CELL_STATE_ENUM.CHOOSE
  }

  swapTo(x, y) {
    if (this.x === x) {
      if (this.y > y) {
        this.state = CELL_STATE_ENUM.SWAP_TOP
      } else {
        this.state = CELL_STATE_ENUM.SWAP_BOTTOM
      }
    } else {
      if (this.x > x) {
        this.state = CELL_STATE_ENUM.SWAP_LEFT
      } else {
        this.state = CELL_STATE_ENUM.SWAP_RIGHT
      }
    }
    this.x = x
    this.y = y
  }

  doCollapse() {
    this.state = CELL_STATE_ENUM.COLLAPSE
    this.isCollapse = true
  }
}

