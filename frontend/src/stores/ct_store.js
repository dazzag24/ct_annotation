import { observable, autorun, computed, action, extendObservable } from 'mobx'
import pako from 'pako'

import { API_Events } from './const'


const item_template = {
    id: null, name: null, image:null, shape:null, nodules_true:null,  nodules_predicted:null,
    waitingData: false, waitingInference: false
}


export default class CT_Store {
    server = null
    @observable ready = false
    @observable items = new Map()

    constructor(server) {
        this.server = server
        autorun(() => this.onConnect())
        this.server.subscribe(API_Events.CT_GOT_LIST, this.onGotList.bind(this))
        this.server.subscribe(API_Events.CT_GOT_ITEM_DATA, this.onGotItemData.bind(this))
        this.server.subscribe(API_Events.CT_GOT_INFERENCE, this.onGotInference.bind(this))
    }

    onConnect(){
        if ((this.items.size == 0) & this.server.ready){
            this.server.send(API_Events.CT_GET_LIST)
        }
    }

    @action
    onGotList(data, meta){
        data.map((item) => this.items.set(item.id, Object.assign({}, item_template, item)))
        this.ready = true
    }

    @action
    onGotItemData(data, meta){
      let item = this.items.get(data.id)
      item.image = pako.inflate(data.image)
      item.shape = data.shape
      item.waitingData = false
    }

    @action
    onGotInference(data, meta){
        let item = this.items.get(data.id)
        item.nodules = data.nodules_true
        item.nodules_predict = data.nodules_predicted
        item.waitingInference = false
    }

    getItemData(id) {
        const item = this.items.get(id)
        if (item != undefined)
            if (!item.waitingData){
                item.waitingData = true
                this.server.send(API_Events.CT_GET_ITEM_DATA, {id: id})
            }
    }

    @action
    getInference(id) {
        if (!this.items.get(id).waitingInference){
            this.items.get(id).waitingInference = true
            this.server.send(API_Events.CT_GET_INFERENCE, {id: id})
        }
    }

    get(id) {
        const item = this.items.get(id)
        if (item != undefined)
            if (item.image == null)
                this.getItemData(id)
        return item
    }

    makeImage(image, shape, slice_no, color='grey', alpha=1){
        const imageLen = shape[1] * shape[2]
        const start = slice_no * imageLen
        const end = (slice_no + 1) * imageLen
        const slice = image.slice(start, end)
        const bitmapImage = new Uint8ClampedArray(imageLen * 4)
        console.log(shape[2], shape[1], slice_no, bitmapImage.length)

        let colorCoef
        switch (color){
            case 'grey'  : colorCoef = [1, 1, 1]; break;
            case 'red'   : colorCoef = [1, 0, 0]; break;
            case 'green' : colorCoef = [0, 1, 0]; break;
            case 'blue'  : colorCoef = [0, 0, 1]; break;
            default: colorCoef = color
        }

        for(let i=0; i < shape[1]; i++){
            for(let j=0; j < shape[2]; j++){
                const pos = i*shape[1]*4 + j*4
                const from = i*shape[1] + j
                bitmapImage[pos + 0] = slice[from] * colorCoef[0]
                bitmapImage[pos + 1] = slice[from] * colorCoef[1]
                bitmapImage[pos + 2] = slice[from] * colorCoef[2]
                if(alpha < 1)
                    bitmapImage[pos + 3] = (slice[from] > 0) ? Math.ceil(alpha * 255) : 0
                else
                    bitmapImage[pos + 3] = 255
            }
        }
        console.log(bitmapImage.length, shape[2], shape[1])
        return new ImageData(bitmapImage, shape[2], shape[1])
    }

    getImageSlice(id, slice_no) {
        const item = this.items.get(id)
        return this.makeImage(item.image, item.shape, slice_no, 'grey', 1)
    }

}
