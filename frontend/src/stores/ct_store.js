import { observable, autorun, computed, action, extendObservable } from 'mobx'
import pako from 'pako'

import { API_Events } from './const'


const item_template = {
    id: null, name: null, image:null, shape:null, spacing:null, nodules_true:null,  nodules_predicted:null,
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
      item.spacing = data.spacing
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

    getPixel(image, shape, coord, axes, depth=1) {
        const from = coord[axes[0]] * shape[1] * shape[2] + coord[axes[1]] * shape[2] + coord[axes[2]]
        let pixel = image[from]

        if(depth > 1){
            let arr = new Array(depth)
            let _from
            for(let i=0; i<depth; i++){
                if(axes[3] == 0){
                    _from = from + i * shape[2] * shape[1]
                } else if(axes[3] == 1){
                    _from = from + i * shape[2]
                } else {
                    _from = from + i
                }
                arr[i] = image[_from]
            }
            pixel = Math.max.apply(null, arr)
        }
        return pixel
    }

    makeImage(image, shape, slice_no, projection=0, depth=1, color='grey', alpha=1){
        let axes, width, height
        switch (projection){
            case 0 : axes = [2, 1, 0, 0]; width = shape[2]; height = shape[1]; break;
            case 1 : axes = [1, 2, 0, 1]; width = shape[1]; height = shape[0]; break;
            case 2 : axes = [1, 0, 2, 2]; width = shape[2]; height = shape[0]; break;
        }
        const bitmapImage = new Uint8ClampedArray(height * width * 4)

        let colorCoef
        switch (color){
            case 'grey'  : colorCoef = [1, 1, 1]; break;
            case 'red'   : colorCoef = [1, 0, 0]; break;
            case 'green' : colorCoef = [0, 1, 0]; break;
            case 'blue'  : colorCoef = [0, 0, 1]; break;
            default: colorCoef = color
        }

        for(let i=0; i < height; i++){
            for(let j=0; j < width; j++){
                const coord = [j, i, slice_no]
                const pixel = this.getPixel(image, shape, coord, axes, depth)
                const pos = (i * width + j) * 4

                bitmapImage[pos + 0] = pixel * colorCoef[0]
                bitmapImage[pos + 1] = pixel * colorCoef[1]
                bitmapImage[pos + 2] = pixel * colorCoef[2]
                if(alpha < 1)
                    bitmapImage[pos + 3] = (pixel > 0) ? Math.ceil(alpha * 255) : 0
                else
                    bitmapImage[pos + 3] = 255
            }
        }
        return new ImageData(bitmapImage, width, height)
    }

    makeCrop(image, shape, slice_no, centerX, centerY, crop_width, crop_height, projection=0, depth=1, color='grey', alpha=1) {
        let axes, width, height
        switch (projection){
            case 0 : axes = [2, 1, 0, 0]; width = shape[2]; height = shape[1]; break;
            case 1 : axes = [1, 2, 0, 1]; width = shape[1]; height = shape[0]; break;
            case 2 : axes = [1, 0, 2, 2]; width = shape[2]; height = shape[0]; break;
        }
        let coordinates = this.cropCoordinates(centerX, centerY, crop_width, crop_height, width, height)
        const bitmapImage = new Uint8ClampedArray(crop_height * crop_width * 4)
        
        let x0 = coordinates[0]
        let y0 = coordinates[1]
        crop_width = coordinates[2]
        crop_height = coordinates[3]

        

        let colorCoef
        switch (color){
            case 'grey'  : colorCoef = [1, 1, 1]; break;
            case 'red'   : colorCoef = [1, 0, 0]; break;
            case 'green' : colorCoef = [0, 1, 0]; break;
            case 'blue'  : colorCoef = [0, 0, 1]; break;
            default: colorCoef = color
        }
        console.log(x0, y0, crop_width, crop_height, slice_no)
        for(let i=y0; i < y0+crop_height; i++){
            for(let j=x0; j < x0+crop_width; j++){
                const coord = [j, i, slice_no]
                const pixel = this.getPixel(image, shape, coord, axes, depth)
                const pos = (i * crop_width + j) * 4

                bitmapImage[pos + 0] = pixel * colorCoef[0]
                bitmapImage[pos + 1] = pixel * colorCoef[1]
                bitmapImage[pos + 2] = pixel * colorCoef[2]
                if(alpha < 1)
                    bitmapImage[pos + 3] = (pixel > 0) ? Math.ceil(alpha * 255) : 0
                else
                    bitmapImage[pos + 3] = 255
            }
        }
        console.log(bitmapImage, crop_width, crop_height)
        return new ImageData(bitmapImage, crop_width, crop_height)
    }

    cropCoordinates(centerX, centerY, crop_width, crop_height, width, height) {
        let x0 = 0
        let y0 = 0
        if (crop_width == null) {
            crop_width = width
        }
        if (crop_height == null) {
            crop_height = height
        }
        if (centerX == null) {
            centerX = width / 2
        }
        if (centerY == null) {
            centerY = height / 2
        }

        if (width < crop_width) {
            crop_width = width
        }
        if (height < crop_height) {
            crop_height = height
        }

        if (centerX <= crop_width / 2){
            x0 = 0
        }
        else {
            if (centerX >= width - crop_width / 2) {
                x0 = width - crop_width
            } else {
                x0 = x0 - crop_width / 2
            }
        }

        if (centerY <= crop_height / 2){
            y0 = 0
        }
        else {
            if (centerY >= height - crop_height / 2) {
                y0 = height - crop_height
            } else {
                y0 = y0 - crop_height/ 2
            }
        }
        return [x0, y0, crop_width, crop_height]
    }


    getImageCrop(id, slice_no, coordinates, projection=0, depth=3) {
        const item = this.items.get(id)
        let centerX = coordinates[0] 
        let centerY = coordinates[1]
        let crop_width = coordinates[2]
        let crop_height = coordinates[3] 
        return this.makeCrop(item.image, item.shape, slice_no, centerX, centerY, crop_width, crop_height, projection, depth, 'grey', 1)
    }

    getImageSlice(id, slice_no, projection=0, depth=3) {
        const item = this.items.get(id)
        return this.makeImage(item.image, item.shape, slice_no, projection, depth, 'grey', 1)
    }

}
