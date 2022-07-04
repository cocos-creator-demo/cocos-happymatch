import AnimationStateMachine, {getInitParamsTrigger} from "../base/AnimationStateMachine";
import {CELL_STATE_ENUM} from "../enum";

import CellIdleState from './CellIdleState'
import CellChooseState from "./CellChooseState";
import {CellManager} from "./CellManager";
import AnimateState from "../base/AnimateState";

export default class CellStateMachine extends AnimationStateMachine {
  cell: CellManager

  init() {
    this.initParams()
    this.initStateMap()
  }

  initParams() {
    this.params.set(CELL_STATE_ENUM.IDLE, getInitParamsTrigger())
    this.params.set(CELL_STATE_ENUM.CHOOSE, getInitParamsTrigger())
  }

  initStateMap() {
    this.stateMap.set(CELL_STATE_ENUM.IDLE, new CellIdleState(this))
    this.stateMap.set(CELL_STATE_ENUM.CHOOSE, new CellChooseState(this))
  }

  run() {
    if (this.params.get(CELL_STATE_ENUM.CHOOSE).value) {
      this.currentState = this.stateMap.get(CELL_STATE_ENUM.CHOOSE)
    } else if (this.params.get(CELL_STATE_ENUM.IDLE).value) {
      this.currentState = this.stateMap.get(CELL_STATE_ENUM.IDLE)
    } else {
      this.currentState = this.stateMap.get(CELL_STATE_ENUM.IDLE)
    }
  }

  async runQueue(queue: CELL_STATE_ENUM[]) {
    for(const val of queue){
      this.setParams(CELL_STATE_ENUM[val], true)
    }
  }
}
