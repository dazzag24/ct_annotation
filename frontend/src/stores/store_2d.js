import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'

const item_template = {
        nodules: [],
        curves: []
}

export default class Store_2D {
    server = null
    @observable ready = false
    @observable items = new Map()

    update(id, obj) {
        this.items.set(id, obj)
    }

    @action
    updateNodules(id, nodules) {
        let item = this.items.get(id)
        item.nodules = nodules
    }

    @action
    updateCurves(id, curves) {
        let item = this.items.get(id)
        item.curves = curves
    }

    @action
    addNodule(id, nodule) {
        let item = this.items.get(id)
        item.nodules = [...item.nodules, nodule]
    }

    @action
    addCurve(id, curve) {
        let item = this.items.get(id)
        item.curves = [...item.curves, curve]
    }

    @action
    removeZeroNodule(id) {
        let item = this.items.get(id)
        let nodules = item.nodules
        if (nodules.length > 0){
            let nodule = nodules[nodules.length-1]
            if (nodule[3] == 0) {
                nodules.splice(nodules.length-1, 1)
            }
             }
        item.nodules = nodules
    }

    init(id) {
        this.items.set(id, JSON.parse(JSON.stringify(item_template)))
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

    // setSlices(id, slices, nodules) {
    //     let item = this.items.get(id)
    //     if (item === undefined) {
    //         this.init(id)
    //     }
    //     item = this.items.get(id)
    //     item.state.slice = [slices[0], slices[1], slices[2]]
    //     item.state.images = [null, null, null]

    //     // item.state.nodules = nodules
    //     this.items.set(id, item)
    // }
}

