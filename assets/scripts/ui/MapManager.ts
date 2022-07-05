import {_decorator, Camera, Component, EventTouch, Node, UITransform, Vec2, Vec3} from 'cc';
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

const isSameCell = (c1: CellManager, c2: CellManager) => {
  return c1.type === c2.type
}
const getRandomCell = (excepts: CELL_TYPE_ENUM[] = []): ICell => {
  const {GREEN, RED, BLUE, YELLOW, GRAY, CYAN, MAGENTA} = CELL_TYPE_ENUM
  const list = [GREEN, RED, BLUE, YELLOW, GRAY, CYAN, MAGENTA].filter(type => {
    return excepts.indexOf(type) === -1
  })
  const idx = Math.floor(Math.random() * list.length)
  return {
    type: list[idx]
  }
}

@ccclass('MapManager')
export class MapManager extends Component {

  private cells: CellManager[][] = []

  row: number = 0
  col: number = 0

  camera: Camera

  isSwaping: boolean = false

  init(params: IMap, camera: Camera) {
    this.initMap(params)
    this.initListener()
    this.camera = camera
  }

  initListener() {
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this)
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
  }

  onDestroy() {
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart)
    this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove)
  }


  initMap(params: IMap) {
    // const row = params.cells.length
    // const col = params.cells[0]?.length
    const row = 10
    const col = 10

    this.row = row
    this.col = col
    this.createRandomMap()

    // for (let i = 0; i < row; ++i) {
    //   this.cells[i] = []
    //   for (let j = 0; j < col; ++j) {
    //     this.cells[i][j] = this.createCell(j, i, params.cells[i][j])
    //   }
    // }

    const transform = this.getComponent(UITransform)
    transform.setContentSize(CELL_WIDTH * col, CELL_WIDTH * row)

    const disX = (CELL_WIDTH * col) / 2
    const disY = (CELL_WIDTH * row) / 2
    this.node.setPosition(-disX, disY)

    // @ts-ignore
    window.__getCells = () => {
      return this.cells.map(row => {
        return row.map(cell => cell.type)
      })
    }
  }

  createCell(x: number, y: number, cell: ICell): CellManager {
    const node = createUINode()

    const cellManager = node.addComponent(CellManager)
    cellManager.init(x, y, cell)

    node.setParent(this.node)

    return cellManager
  }

  onTouchStart(event: EventTouch) {
    const cell = this.findCellByTouchPosition(event.getLocation())
    if (!cell) return
    EventManager.Instance.emit(EVENT_ENUM.CHOOSE_CELL, cell)
  }

  async onTouchMove(event: EventTouch) {
    if (this.isSwaping) return
    const last = this.findCellByTouchPosition(event.getStartLocation())
    const cur = this.findCellByTouchPosition(event.getLocation())
    if (!last || !cur) return
    if (last.x === cur.x && last.y === cur.y) return
    this.isSwaping = true
    await this.swapCell(last, cur)
    this.isSwaping = false
  }

  //  获取点击位置对应的单元格
  private findCellByTouchPosition(position: Vec2): CellManager | null {
    const transform = this.getComponent(UITransform)

    const worldPos = this.camera.screenToWorld(new Vec3(position.x, position.y, 0))
    const pos = transform.convertToNodeSpaceAR(worldPos)

    const x = Math.floor(pos.x / CELL_WIDTH)
    const y = Math.floor(-pos.y / CELL_HEIGHT)

    return this.cells[y][x]
  }

  private async swapCell(c1: CellManager, c2: CellManager) {
    const swap = async () => {
      const {x: x1, y: y1} = c1
      const {x: x2, y: y2} = c2

      this.cells[y1][x1] = c2
      this.cells[y2][x2] = c1

      return Promise.all([
        c1.moveTo(x2, y2),
        c2.moveTo(x1, y1)
      ])
    }

    const dir1 = c1.x === c2.x ? DIRECTION.ROW : DIRECTION.COLUMN
    const dir2 = c1.x === c2.x ? DIRECTION.COLUMN : DIRECTION.ROW

    await swap()

    // 判断是否可以交换，不能交换则还需要返回
    const list1 = this.checkCollapse(c1.x, c1.y, dir1)
    const list2 = this.checkCollapse(c2.x, c2.y, dir1)
    const list3 = this.checkCollapse(c1.x, c1.y, dir2)

    const list = [...list1, ...list2, ...list3]
    if (!list.length) {
      // 重置
      await swap()
    } else {
      await Promise.all(list.map(row => {
        return this.doCollapse(row)
      }))
      // 消除完毕后，重置棋盘
      await this.resetMap()
    }
  }

  checkCollapse(x: number, y: number, dir: DIRECTION): CellManager[][] {
    const list = dir === DIRECTION.ROW ? this.cells[y] : this.cells.map(row => {
      return row[x]
    })

    let ans = []
    let prev
    let prevList = []
    for (let i = list.length - 1; i >= 0; --i) {
      const cur = list[i]
      if (!prev || !isSameCell(prev, cur)) {
        prev = cur
        ans.push(prevList)
        prevList = [prev]

        continue
      }
      prevList.push(cur)
    }
    ans.push(prevList)

    return ans.filter(list => list.length >= COLLAPSE_LEASE_NUM)
  }

  async doCollapse(list: CellManager[]) {
    const tasks = list.map(cell => {
      this.cells[cell.y][cell.x] = null
      return cell.doCollapse()
    })
    await Promise.all(tasks)
  }

  async resetMap() {
    let animationTasks = []

    const createRandomCell = (x: number, y: number) => {
      // 掉落动画
      const cell = this.createCell(x, -1, getRandomCell())
      animationTasks.push(cell.moveTo(x, y))
      this.cells[y][x] = cell
      return cell
    }

    // 从上到下填补空白的位置，如果需要则会生成新的节点
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
            const lastCell = column[latestIdx];
            this.cells[i][x] = column[i] = lastCell;
            animationTasks.push(lastCell.moveTo(x, i))
            column[latestIdx] = null;
          } else {
            createRandomCell(x, i)
          }
        }
      }
    }

    for (let i = 0; i < this.col; ++i) {
      const column = this.cells.map(row => {
        return row[i]
      })
      resetColumn(column, i)
    }

    await Promise.all(animationTasks)

    let flag = await this.checkCollapseOfMap()
    while (flag) {
      await this.resetMap()
      flag = await this.checkCollapseOfMap()
    }

    if (!this.checkMoveOfMap()) {
      this.createRandomMap()
    }
  }

  // 检测整个地图是否有已经消除的地方
  async checkCollapseOfMap(): Promise<boolean> {
    let tasks = []

    // 分别遍历竖直方向和水平方向上是否有有可以消除的对象
    for (let i = 0; i < this.row; ++i) {
      const list = this.checkCollapse(0, i, DIRECTION.ROW)
      tasks = tasks.concat(list)
    }

    for (let j = 0; j < this.col; ++j) {
      const list = this.checkCollapse(j, 0, DIRECTION.COLUMN)
      tasks = tasks.concat(list)
    }

    if (!tasks.length) {
      return false
    }

    await Promise.all(tasks.map(list => {
      return this.doCollapse(list)
    }))

    return true
  }

  // 检测棋盘是否有可以移动的地方，先来个bf的，后面看看有没有更好的方案
  checkMoveOfMap(): boolean {
    const canCollapseAfterStep = (x, y): boolean => {
      const c1 = this.cells[y][x]
      const isSameCellByPos = (x, y) => {
        if (y < 0 || y >= this.row || x < 0 || x >= this.col) return false
        const c2 = this.cells[y][x]
        return isSameCell(c1, c2)
      }

      for (const dir of [-1, 1]) {
        // 水平
        if (isSameCellByPos(x + dir, y) && (
          isSameCellByPos(x + dir * 3, y) ||
          isSameCellByPos(x + dir * 2, y - 1) ||
          isSameCellByPos(x + dir * 2, y + 1)
        )) {
          return true
        }

        if (isSameCellByPos(x + dir * 2, y) && (
          isSameCellByPos(x + dir, y - 1) ||
          isSameCellByPos(x + dir, y + 1)
        )) {
          return true
        }

        // 竖直
        if (isSameCellByPos(x, y + dir) && (
          isSameCellByPos(x, y + dir * 3) ||
          isSameCellByPos(x - 1, y + dir * 2) ||
          isSameCellByPos(x + 1, y + dir * 2)
        )) {
          return true
        }

        if (isSameCellByPos(x, y + dir * 2) && (
          isSameCellByPos(x - 1, y + dir) || isSameCellByPos(x + 1, y + dir)
        )) {
          return true
        }
      }
      return false
    }

    for (let i = 0; i < this.row; ++i) {
      for (let j = 0; j < this.col; ++j) {
        if (canCollapseAfterStep(j, i)) {
          return true
        }
      }
    }
    return false
  }

  createRandomMap() {
    let cells = []

    // 生成一个不会直接消除的颜色
    const createRandomCell = (x: number, y: number) => {
      const excepts = []
      if (x > 1 && isSameCell(cells[y][x - 1], cells[y][x - 2])) {
        excepts.push(cells[y][x - 1].type)
      }
      if (y > 1 && isSameCell(cells[y - 1][x], cells[y - 2][x])) {
        excepts.push(cells[y - 1][x].type)
      }
      return this.createCell(x, y, getRandomCell(excepts))
    }

    for (let i = 0; i < this.row; ++i) {
      cells[i] = []
      for (let j = 0; j < this.col; ++j) {
        cells[i][j] = createRandomCell(j, i)
      }
    }
    this.cells = cells
  }
}

