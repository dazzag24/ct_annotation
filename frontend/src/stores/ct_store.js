import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'


const item_template = {
    id: null, name: null, image:null, nodules_true:null,  nodules_predicted:null,
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
      item.image = data.image
      item.waitingData = false
    }

    @action
    onGotInference(data, meta){
        let item = this.items.get(data.id)
        item.nodules = data.nodules_true
        item.nodules_predicted = data.nodules_predicted
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

    makeImage(imageData, color='grey', alpha=1){
        const sourceImage = imageData.peek()
        const bitmapImage = new Uint8ClampedArray(sourceImage.length * sourceImage[0].length * 4)

        let colorCoef
        switch (color){
            case 'grey'  : colorCoef = [1, 1, 1]; break;
            case 'red'   : colorCoef = [1, 0, 0]; break;
            case 'green' : colorCoef = [0, 1, 0]; break;
            case 'blue'  : colorCoef = [0, 0, 1]; break;
            default: colorCoef = color
        }

        for(let i=0; i< sourceImage.length; i++){
            for(let j=0; j< sourceImage[i].length; j++){
                const pos = i*sourceImage[i].length*4 + j*4
                bitmapImage[pos + 0] = sourceImage[i][j] * colorCoef[0]
                bitmapImage[pos + 1] = sourceImage[i][j] * colorCoef[1]
                bitmapImage[pos + 2] = sourceImage[i][j] * colorCoef[2]
                if(alpha < 1)
                    bitmapImage[pos + 3] = (sourceImage[i][j] > 0) ? Math.ceil(alpha * 255) : 0
                else
                    bitmapImage[pos + 3] = 255
            }
        }
        return new ImageData(bitmapImage, sourceImage[0].length, sourceImage.length)
    }

    getImageSlice(id, slice_no) {
        const image = this.items.get(id).image[slice_no]
        return this.makeImage(image, 'grey', 1)
    }

}
