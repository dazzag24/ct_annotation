import { observable, autorun, computed, action, extendObservable } from 'mobx'
import pako from 'pako'

import { API_Events } from './const'


const item_template = {
    id: null, name: null, image:null, shape:null, spacing:null, nodules_true:null,  nodules_predicted:null,
    waitingData: false, waitingInference: false, zoom: [1, 1, 1], coordinates: [[0, 0], [0, 0], [0, 0]]
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

    updateCrop(id, zoom, coordinates, projection) {
        const item = this.items.get(id)
        item.zoom[projection] = zoom
        item.coordinates[projection] = coordinates
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

    getSpacing(id, projection) {
        const spacing = this.items.get(id).spacing
        switch (projection) {
            case 0:
                var spacing_2d = [spacing[2], spacing[1]]
                break
            case 1:
                var spacing_2d = [spacing[2], spacing[0]]
                break
            case 2:
                var spacing_2d = [spacing[1], spacing[0]]
                break
        }
        spacing_2d[0] = spacing_2d[0]
        spacing_2d[1] = spacing_2d[1]
        return spacing_2d
    }

    getCorner(id, projection) {
        return this.items.get(id).coordinates[projection]
    }

    getShape(id, projection) {
        const shape = this.items.get(id).shape
        switch (projection) {
            case 0:
                var shape_2d = [shape[2], shape[1]]
                break
            case 1:
                var shape_2d = [shape[2], shape[0]]
                break
            case 2:
                var shape_2d = [shape[1], shape[0]]
                break
        }
        return shape_2d        
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

    makeCrop(id, image, shape, slice_no, centerX, centerY, zoom, projection=0, depth=1, color='grey', alpha=1) {
        let axes, width, height
        switch (projection){
            case 0 : axes = [2, 1, 0, 0]; width = shape[2]; height = shape[1]; break;
            case 1 : axes = [1, 2, 0, 1]; width = shape[1]; height = shape[0]; break;
            case 2 : axes = [1, 0, 2, 2]; width = shape[2]; height = shape[0]; break;
        }

        let coordinates = this.cropCoordinates(centerX, centerY, zoom, width, height)
        let x0 = coordinates[0]
        let y0 = coordinates[1]
        let crop_width = coordinates[2]
        let crop_height = coordinates[3]

        this.updateCrop(id, zoom, [x0, y0], projection)
        const bitmapImage = new Uint8ClampedArray(crop_height * crop_width * 4)        

        let colorCoef
        switch (color){
            case 'grey'  : colorCoef = [1, 1, 1]; break;
            case 'red'   : colorCoef = [1, 0, 0]; break;
            case 'green' : colorCoef = [0, 1, 0]; break;
            case 'blue'  : colorCoef = [0, 0, 1]; break;
            default: colorCoef = color
        }

        for(let i=0; i < crop_height; i++){
            for(let j=0; j < crop_width; j++){
                const coord = [j+x0, i+y0, slice_no]
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
        return new ImageData(bitmapImage, crop_width, crop_height)
    }

    cropCoordinates(centerX, centerY, zoom, width, height) {
        let x0 = 0
        let y0 = 0

        if (centerX == null) {
            centerX = width / 2
        }
        if (centerY == null) {
            centerY = height / 2
        }

        if (centerX < 0) {
            centerX = 0
        }

        if (centerX > width) {
            centerX = width
        }

        if (centerY < 0) {
            centerY = 0
        }

        if (centerY > height) {
            centerY = height
        }

        let crop_width = width * (1 / zoom)
        let crop_height = height * (1 / zoom)

        if (centerX <= crop_width / 2){
            x0 = 0
        }
        else {
            if (centerX >= width - crop_width / 2) {
                x0 = width - crop_width
            } else {
                x0 = centerX - crop_width / 2
            }
        }

        if (centerY <= crop_height / 2){
            y0 = 0
        }
        else {
            if (centerY >= height - crop_height / 2) {
                y0 = height - crop_height
            } else {
                y0 = centerY - crop_height/ 2
            }
        }
        return [Math.ceil(x0), Math.ceil(y0), Math.ceil(crop_width), Math.ceil(crop_height)]
    }


    getImageCrop(id, slice_no, center, zoom, projection=0, depth=3) {
        const item = this.items.get(id)
        let centerX = center[0] 
        let centerY = center[1]
        return this.makeCrop(id, item.image, item.shape, slice_no, centerX, centerY, zoom, projection, depth, 'grey', 1)
    }

    getImageSlice(id, slice_no, projection=0, depth=3) {
        const item = this.items.get(id)
        return this.makeImage(item.image, item.shape, slice_no, projection, depth, 'grey', 1)
    }

}
