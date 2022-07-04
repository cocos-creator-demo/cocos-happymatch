import {Color, Graphics} from "cc";
import AnimateState from "../base/AnimateState";
import CellStateMachine from "./CellStateMachine";
import {CELL_HEIGHT, CELL_WIDTH} from "./CellManager";

export default class CellIdleState extends AnimateState {
  constructor(private fsm: CellStateMachine) {
    super();
  }

  run() {
    // const {cell} = this.fsm
  }
}
