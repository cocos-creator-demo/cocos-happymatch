import {_decorator, Component, Node, Camera} from 'cc';
import {createUINode} from "../utils";
import {MapManager} from "../ui/MapManager";
import {CELL_TYPE_ENUM} from "../enum";

const {ccclass, property} = _decorator;

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

    const {YELLOW, BLUE, RED, GREEN} = CELL_TYPE_ENUM
    const config = {
      cells: [
        [{type: YELLOW}, {type: BLUE}, {type: RED}, {type: GREEN}],
        [{type: YELLOW}, {type: BLUE}, {type: RED}, {type: GREEN}],
        [{type: BLUE}, {type: YELLOW}, {type: GREEN}, {type: RED}],
        [{type: GREEN}, {type: GREEN}, {type: RED}, {type: RED}]
      ]
    }
    mapManager.init(config, this.camera)


  }
}

