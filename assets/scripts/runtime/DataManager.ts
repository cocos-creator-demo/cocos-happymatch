import Singleton from '../base/Singleton'

export default class DataManager extends Singleton {

  static get Instance() {
    return super.getInstance<DataManager>()
  }

  reset() {

  }
}

