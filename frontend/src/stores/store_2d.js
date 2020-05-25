import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'

const item_template = {
    state : {
        slice: [0, 0, 0],
        depth: [1, 1, 1],
        nodulesOn: true,
        coordinates: null,
        center: [
            [null, null],
            [null, null],
            [null, null]
        ],
        zoom: [1, 1, 1],
        imageClicked: false,
        noduleClicked: [null, -1],
        start: null,
        images: [null, null, null],
        selection: [0, 0, 0, 0],
        drawCrops: false,
        drawSlices: true,
        wheelZoom: false,
        chooseRadius: false,
        radiusRatio: 0,
        nodules: [],
        projections: [true, false, false],
        showList: true,
        noduleMode: false,
        confirm: false,
        curves: []
    }
}

export default class Store_2D {
    server = null
    @observable ready = false
    items = new Map()

    update(id, obj) {
        let store = {}

        for (let key in item_template) {
                store.state = obj.state
        }
        this.items.set(id, store)
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

    setSlices(id, slices, nodules) {
        let item = this.items.get(id)
        if (item === undefined) {
            this.init(id)
        }
        item = this.items.get(id)
        item.state.slice = [slices[0], slices[1], slices[2]]
        item.state.images = [null, null, null]

        // item.state.nodules = nodules
        this.items.set(id, item)
    }
}

