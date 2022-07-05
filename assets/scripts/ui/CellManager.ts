import {_decorator, Component, Graphics, UITransform, Color, tween, Vec3, Vec2} from 'cc';
import {CELL_TYPE_ENUM, EVENT_ENUM} from "../enum";
import EventManager from "../runtime/EventManager";

const {ccclass, property} = _decorator;

export const CELL_WIDTH = 30
export const CELL_HEIGHT = 30

export interface ICell {
  type: CELL_TYPE_ENUM
}


@ccclass('CellManager')
export class CellManager extends Component {
  type: CELL_TYPE_ENUM
  x: number = 0
  y: number = 0
  isCollapse: boolean = false
  isChoose: boolean = false


  init(x: number, y: number, cell: ICell) {
    this.x = x
    this.y = y
    this.type = cell.type

    this.render()

    EventManager.Instance.on(EVENT_ENUM.CHOOSE_CELL, this.onChoose, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.CHOOSE_CELL, this.onChoose)
  }

  render() {
    const transform = this.getComponent(UITransform)
    transform.setContentSize(CELL_WIDTH, CELL_HEIGHT)
    transform.setAnchorPoint(new Vec2(0.5, 0.5))

    const ctx = this.addComponent(Graphics)

    ctx.clear()
    ctx.rect(-CELL_WIDTH * 0.5 + 1, -CELL_HEIGHT * 0.5 + 1, CELL_WIDTH - 2, (CELL_HEIGHT - 2))
    ctx.fillColor = Color[this.type]
    ctx.fill()

    this.node.setPosition(this.getTargetPosition(this.x, this.y))
  }

  getTargetPosition(x: number, y: number): Vec3 {
    return new Vec3(x * CELL_WIDTH + 0.5 * CELL_WIDTH, -y * CELL_HEIGHT - 0.5 * CELL_HEIGHT)
  }

  onChoose(cell: CellManager) {
    if (cell === this) {
      // this.state = CELL_STATE_ENUM.CHOOSE
      this.isChoose = true
    } else if (this.isChoose) {
      this.isChoose = false
      // this.state = CELL_STATE_ENUM.IDLE
    }
  }

  async moveTo(x, y) {
    const tweenDuration: number = 0.3;
    const target = this.getTargetPosition(x, y)

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

