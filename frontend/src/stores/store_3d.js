import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'

const item_template = {
    state : {
      sliceZ: 0,
      sliceX: 0,
      sliceY: 0,
      radius: 5,
      alphaP: 0,
      threshold: 200,
      viewMode2D: false,
      plane: 1,
      nCount: 0,
      mipDepth: 1,
      nodules: []
    },
    showY : true,
    showZ : true,
    showX : true,
    showNodules : true,
    enableZoom : true,
    layout3 : false,
    changeNodule : null,
    setRadius : 5,
    setOpacity : 0.45,
}

export default class Store_3D {
    server = null
    @observable ready = false
    items = new Map()

    update(id, obj) {
        let store = {}

        for (let key in item_template) {
                store.state = obj.state
                store.showY = obj.showY
                store.showZ = obj.showZ
                store.showX = obj.showX
                store.showNodules = obj.showNodules
                store.enableZoom = obj.enableZoom
                store.layout3 = obj.layout3
                store.changeNodule = obj.changeNodule
                store.setRadius = obj.setRadius
                store.setOpacity = obj.setOpacity
        }
        this.items.set(id, store)
    }

    init(id) {
      this.items.set(id, item_template)
    }

    get(id) {
        let item = this.items.get(id)
        if (item === undefined) {
            this.init(id)
            return this.items.get(id)
        } else {
            return item
        }
    }

    setSlices(id, slices, nodules) {
        let item = this.items.get(id)
        if (item === undefined) {
            this.init(id)
        }
        item = this.items.get(id)
        item.state['sliceZ'] = slices[0]
        item.state['sliceY'] = slices[1]
        item.state['sliceX'] = slices[2]
        item.state.nodules = nodules
        this.items.set(id, item)
    }
}
