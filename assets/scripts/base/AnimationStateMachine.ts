import {FSM_PARAMS_TYPE_ENUM} from "../enum"
import AnimateState from "./AnimateState";


export type ParamsValueType = number | boolean

export interface IParamsValue {
  type: FSM_PARAMS_TYPE_ENUM,
  value: ParamsValueType
}

export const getInitParamsTrigger = () => {
  return {
    type: FSM_PARAMS_TYPE_ENUM.TRIGGER,
    value: false,
  }
}
export const getInitParamsNumber = () => {
  return {
    type: FSM_PARAMS_TYPE_ENUM.NUMBER,
    value: 0,
  }
}

export default abstract class AnimationStateMachine {
  params: Map<string | number, IParamsValue> = new Map()
  stateMap: Map<string | number, AnimateState> = new Map()

  private _currentState: AnimateState

  get currentState() {
    return this._currentState
  }

  set currentState(val) {
    this._currentState = val
    // 切换状态时的逻辑
    this._currentState.run()
  }


  getParams(name: string) {
    if (this.params.has(name)) {
      return this.params.get(name).value
    }
  }

  setParams(name: string, value: ParamsValueType) {
    if (this.params.has(name)) {
      this.params.get(name).value = value
      this.run()
      this.resetTrigger()
    }
  }

  resetTrigger() {
    for (const [_, item] of this.params) {
      if (item.type === FSM_PARAMS_TYPE_ENUM.TRIGGER) {
        item.value = false
      }
    }
  }

  abstract init();

  abstract run();
}
