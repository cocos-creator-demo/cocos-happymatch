import {_decorator, Component, Node, Camera} from 'cc';
import {createUINode} from "../utils";
import {MapManager} from "../ui/MapManager";
import {CELL_TYPE_ENUM} from "../enum";

const {ccclass, property} = _decorator;

const getCellsByMap = () => {
  const list = [["RED", "BLUE", "RED", "RED"], ["BLUE", "GREEN", "GREEN", "RED"], ["RED", "RED", "GREEN", "BLUE"], ["GREEN", "GREEN", "YELLOW", "YELLOW"]]
  return list.map(row => {
    return row.map(type => {
      return {type: CELL_TYPE_ENUM[type]}
    })
  })
}

@ccclass('GameManager')
export class GameManager extends Component {
  @property(Camera)
  camera: Camera

  onLoad() {
    this.initMap()
  }

  initMap() {
    // 创建地图
    const stage = createUINode()
    const mapManager = stage.addComponent(MapManager)
    stage.setParent(this.node)

    // const {YELLOW, BLUE, RED, GREEN} = CELL_TYPE_ENUM
    const config = {
      // cells: [
      //   [{type: YELLOW}, {type: BLUE}, {type: RED}, {type: GREEN}],
      //   [{type: YELLOW}, {type: BLUE}, {type: RED}, {type: GREEN}],
      //   [{type: BLUE}, {type: YELLOW}, {type: GREEN}, {type: RED}],
      //   [{type: GREEN}, {type: GREEN}, {type: YELLOW}, {type: YELLOW}]
      // ],
      cells: getCellsByMap()
    }

    mapManager.init(config, this.camera)
  }
}

