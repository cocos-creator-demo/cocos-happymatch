import {_decorator, Component, EventTouch, Node, UITransform, Vec2, Vec3} from 'cc';
import {createUINode} from "../utils";
import {CELL_HEIGHT, CELL_WIDTH, CellManager, ICell} from "./CellManager";
import EventManager from "../runtime/EventManager";
import {CELL_TYPE_ENUM, EVENT_ENUM} from "../enum";

const {ccclass, property} = _decorator;

export interface IMap {
  cells: Array<Array<ICell>>
}

const COLLAPSE_LEASE_NUM = 3

enum DIRECTION {
  ROW = 'ROW',
  COLUMN = 'COLUMN'
}

@ccclass('MapManager')
export class MapManager extends Component {

  private cells: CellManager[][] = []

  row: number = 0
  col: number = 0

  init(params: IMap) {
    this.initMap(params)
    this.initListener()
  }

  initListener() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
  }


  initMap(params: IMap) {
    const row = params.cells.length
    const col = params.cells[0]?.length

    this.row = row
    this.col = col

    for (let i = 0; i < row; ++i) {
      this.cells[i] = []
      for (let j = 0; j < col; ++j) {
        this.createCell(j, i, params.cells[i][j])
      }
    }

    const transform = this.getComponent(UITransform)
    transform.setContentSize(CELL_WIDTH * col, CELL_WIDTH * row)

    const disX = (CELL_WIDTH * col) / 2
    const disY = (CELL_WIDTH * row) / 2
    this.node.setPosition(-disX, disY)
  }

  createCell(x: number, y: number, cell: ICell) {
    const node = createUINode()

    const cellManager = node.addComponent(CellManager)
    cellManager.init(x, y, cell)

    this.cells[y][x] = cellManager
    node.setParent(this.node)
  }

  onTouchStart(event: EventTouch) {
    const cell = this.findCellByTouchPosition(event.getLocation())
    if (!cell) return
    EventManager.Instance.emit(EVENT_ENUM.CHOOSE_CELL, cell)
  }

  onTouchMove(event: EventTouch) {
    const last = this.findCellByTouchPosition(event.getStartLocation())
    const cur = this.findCellByTouchPosition(event.getLocation())
    if (!last || !cur) return
    if (last.x === cur.x && last.y === cur.y) return
    this.swapCell(last, cur)
  }

  //  获取点击位置对应的单元格
  private findCellByTouchPosition(position: Vec2): CellManager | null {
    const transform = this.getComponent(UITransform)
    const pos = transform.convertToNodeSpaceAR(new Vec3(position.x, position.y, 0))

    const x = Math.floor(pos.x / CELL_WIDTH)
    const y = Math.floor(-pos.y / CELL_HEIGHT)
    return this.cells[y][x]
  }

  private swapCell(c1: CellManager, c2: CellManager) {
    const swap = () => {
      const {x: x1, y: y1} = c1
      const {x: x2, y: y2} = c2

      this.cells[y1][x1] = c2
      this.cells[y2][x2] = c1

      c1.swapTo(x2, y2)
      c2.swapTo(x1, y1)
    }

    const dir = c1.x === c2.x ? DIRECTION.ROW : DIRECTION.COLUMN

    swap()

    // 判断是否可以交换，不能交换则还需要返回
    let flag1 = this.checkCollapse(c1.x, c1.y, dir)
    let flag2 = this.checkCollapse(c2.x, c2.y, dir)

    if (!flag1 && !flag2) {
      // 重置
      swap()
    } else {
      console.log(this.cells)
      // 消除完毕后，重置棋盘
      console.log('reset map')
      this.resetMap()
      console.log(this.cells)
    }
  }

  checkCollapse(x: number, y: number, dir: DIRECTION): boolean {
    const list = dir === DIRECTION.ROW ? this.cells[y] : this.cells.map(row => {
      return row[x]
    })

    let ans = []
    let prev
    let prevList = []
    for (let i = list.length - 1; i >= 0; --i) {
      const cur = list[i]
      if (!prev || prev.type !== cur.type) {
        prev = cur
        ans.push(prevList)
        prevList = [prev]

        continue
      }
      prevList.push(cur)
    }
    ans.push(prevList)

    let flag = false
    ans.forEach(list => {
      if (list.length >= COLLAPSE_LEASE_NUM) {
        flag = true
        list.forEach(cell => {
          this.cells[cell.y][cell.x] = null
          return cell.doCollapse()
        })
      }
    })

    return flag
  }

  resetMap() {
    const createRandomCell = (x: number, y: number) => {
      return this.createCell(x, y, {type: CELL_TYPE_ENUM.GREEN})
    }
    const resetColumn = (column: CellManager[], x: number) => {
      let blanks = []; // 统计空位
      let items = [];
      column.forEach((item, index) => {
        if (!item) {
          blanks.push(index);
        } else {
          items.push(index);
        }
      });

      if (!blanks.length) return;
      items = items.filter((idx) => {
        return idx < blanks[blanks.length - 1];
      });

      for (let i = column.length - 1; i >= 0; --i) {
        let cur = column[i];
        if (!cur) {
          if (items.length) {
            const latestIdx = items.pop();
            column[i] = column[latestIdx];
            column[latestIdx] = null;
          } else {
            createRandomCell(x, i)
          }
        }
      }
      console.log(column);
    }

    for (let i = 0; i < this.col; ++i) {
      const column = this.cells.map(row => {
        return row[i]
      })
      resetColumn(column, i)
    }

    // todo 检测是否有可以消除的

    let flag
    // for (let i = 0; i < this.row; ++i) {
    //   for (let j = 0; j < this.col; ++j) {
    //     if (this.checkCollapse(j, i)) {
    //       flag = true
    //     }
    //   }
    // }

    if (flag) {
      this.resetMap()
    }
  }
}

