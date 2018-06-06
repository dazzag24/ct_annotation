import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'

const item_template = {
    state : {
      sliceZ: 128,
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
    scene : null,
    camera : null,
    renderer : null,
    cropFrame : null,
    crop : null,
    frameLine : null,
    meshZ : null,
    meshX : null,
    meshY : null,
    planeZMaterial : null,
    planeXMaterial : null,
    planeYMaterial : null,
    controls : null,
    nodules : null,
    planes : null,
    noduleCenters : null,
}

export default class Store_3D {
    server = null
    @observable ready = false
    items = new Map()

    update(id, obj) {
        let store = {}
        console.log(obj.camera)

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

                store.scene = obj.scene
                store.camera = obj.camera
                store.renderer = obj.renderer
                store.cropFrame = obj.cropFrame
                store.crop = obj.crop
                store.frameLine = obj.frameLine
                store.meshZ = obj.meshZ
                store.meshX = obj.meshX
                store.meshY = obj.meshY
                store.planeZMaterial = obj.planeZMaterial
                store.planeXMaterial = obj.planeXMaterial
                store.planeYMaterial = obj.planeYMaterial
                store.controls = obj.controls
                store.nodules = obj.nodules
                store.planes = obj.planes
                store.noduleCenters = obj.noduleCenters
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
