import React from 'react'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';
import Toggle from 'react-toggle'
import { Icon } from 'react-fa'
import { Layer, Stage, Image, Ellipse, Line, Rect } from 'react-konva'
import { inject, observer } from 'mobx-react'
import ImageWithOpacity from './opacity.jsx'


@inject("ct_store")
@observer
export default class CTSliceViewer extends Component {

    componentWillReceiveProps(nextProps){
        this.setState({slice: nextProps.slice})
    }

    getSliderPos(value){
        return this.props.reverse ? this.props.maxSlice - value : value
    }

    getSliceNo(value){
        return this.getSliderPos(value)
    }

    onSliderChange(value) {
        const slice = this.getSliceNo(value)

        if(this.props.onSliceChange){
            this.props.onSliceChange(slice, this.props.projection)
        }

        this.setState({slice: slice})
    }

    getSpacing() {
        switch (this.props.projection) {
            case 0:
                var aspectRatio = [this.props.spacing[2], this.props.spacing[1]]
                break
            case 1:
                var aspectRatio = [this.props.spacing[2], this.props.spacing[0]]
                break
            case 2:
                var aspectRatio = [this.props.spacing[1], this.props.spacing[0]]
                break
        }
        aspectRatio[0] = aspectRatio[0]
        aspectRatio[1] = aspectRatio[1]
        return aspectRatio
    }

    getShape() {
        switch (this.props.projection) {
            case 0:
                var shape = [this.props.shape[2], this.props.shape[1]]
                break
            case 1:
                var shape = [this.props.shape[2], this.props.shape[0]]
                break
            case 2:
                var shape = [this.props.shape[1], this.props.shape[0]]
                break
        }
        return shape        
    }

    getLines(coordinates, width, height) {
        const spacing = this.props.ct_store.get(this.props.id).spacing
        let coordinates_yz = coordinates[2]
        let coordinates_xz = coordinates[1]
        let coordinates_xy = coordinates[0]
        
        let coordinates_yz_0 = coordinates_yz[0] //* spacing[1]
        let coordinates_yz_1 = coordinates_yz[1] //* spacing[0]
        let coordinates_yz_2 = coordinates_yz[2] //* spacing[1]
        let coordinates_yz_3 = coordinates_yz[3] //* spacing[0]

        let coordinates_xz_0 = coordinates_xz[0] //* spacing[2]
        let coordinates_xz_1 = coordinates_xz[1] //* spacing[0]
        let coordinates_xz_2 = coordinates_xz[2] //* spacing[2]
        let coordinates_xz_3 = coordinates_xz[3] //* spacing[0]
        
        let coordinates_xy_0 = coordinates_xy[0] //* spacing[2]
        let coordinates_xy_1 = coordinates_xy[1] //* spacing[1]
        let coordinates_xy_2 = coordinates_xy[2] //* spacing[2]
        let coordinates_xy_3 = coordinates_xy[3] //* spacing[1]


        switch (this.props.projection) {
            case 0:
                var lines = [height - coordinates_yz_0 -  coordinates_yz_2, width - coordinates_xz_0 - coordinates_xz_2, coordinates_yz_2, coordinates_xz_2]
                break
            case 2:
                var lines = [coordinates_xz_1, width - coordinates_xy_1 - coordinates_xy_3, coordinates_xz_3, coordinates_xy_3]
                break
            case 1:
                var lines = [ coordinates_yz_1, width - coordinates_xy_2 - coordinates_xy_0, coordinates_yz_3, coordinates_xy_2]
                break
        }
        return lines
    }

    drawImage(image, item, projection) {
        //const item = this.props.ct_store.get(this.props.match.params.id)
        const coordinates = item.coordinates
        const spacing = this.props.spacing
        // const lines = this.getLines(coordinates, image.width, image.height)

        const canvas = document.createElement('canvas')
        canvas.width = image.width / this.props.zoom
        canvas.height = image.height / this.props.zoom

        const ctx = canvas.getContext('2d')
        ctx.putImageData(image, -this.props.shift[0], -this.props.shift[1])

        const canvas2 = document.createElement('canvas')
        const shape = this.props.shape
        canvas2.width = shape[0] * this.props.factor * spacing[0]
        canvas2.height = shape[1] * this.props.factor * spacing[1]
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height)

        return canvas2
    }

    getFactors() {
        const spacing = this.props.spacing
        return [this.props.factor * this.props.zoom * spacing[0], this.props.factor * this.props.zoom * spacing[1]]
    }

    onAddNodule(event) {
        event.preventDefault();
        let factors = this.getFactors()
        let currentTargetRect = event.target.getBoundingClientRect()
        let x = (event.clientX - currentTargetRect.left)
        let y = (event.clientY - currentTargetRect.top)
        this.props.onAddNodule(event, x, y, factors, this.props.projection)        
    }

    onPointerMove(event) {
        let factors = this.getFactors()
        let currentTargetRect = event.target.getBoundingClientRect()
        let x = (event.clientX - currentTargetRect.left)
        let y = (event.clientY - currentTargetRect.top)
        this.props.onPointerMove(event, x, y, factors, this.props.projection)
        event.stopPropagation()
        event.preventDefault()
    }

    onPointerDown(event) {
        let factors = this.getFactors()
        let currentTargetRect = event.target.getBoundingClientRect()
        let x = (event.clientX - currentTargetRect.left)
        let y = (event.clientY - currentTargetRect.top)
        this.props.onPointerDown(event, x, y, factors, this.props.projection)
        event.stopPropagation()
        event.preventDefault()
    };

    onPointerUp(event) {
        let factors = this.getFactors()
        let currentTargetRect = event.target.getBoundingClientRect()
        let x = (event.clientX - currentTargetRect.left)
        let y = (event.clientY - currentTargetRect.top)
        this.props.onPointerUp(event, x, y, factors, this.props.projection)
        event.stopPropagation()
        event.preventDefault()
    };

    onWheel(event) {
        let delta = event.deltaY || event.detail || event.wheelDelta
        if (this.props.wheelZoom) {
            this.props.onZoom(1 - delta / 1000, this.props.projection)
        } else {
            let currentSlice = this.props.slice[this.props.projection]
            let slice = Math.min(Math.max(Math.ceil(currentSlice - delta / 100), this.props.minSlice), this.props.maxSlice)
            this.props.onSliceChange(slice, this.props.projection)
        }
        event.stopPropagation()
        event.preventDefault()
    }

    onZoomPlus(event) {
        this.props.onZoom(1.1, this.props.projection)
    }

    onZoomMinus(event) {
        this.props.onZoom(0.9, this.props.projection)
    }

    onUnzoom(event) {
        this.props.onUnzoom(this.props.projection)
    }

    getSlices() {
        let slices = this.props.slice
        let x, y, z
        let shift = this.props.shift
        let shape = this.props.shape
        switch (this.props.projection) {
            case 0:
                x = this.props.slice[2]
                y = this.props.slice[1]
                z = this.props.slice[0]
                break
            case 1:
                x = this.props.slice[2]
                y = this.props.slice[0]
                z = this.props.slice[1]
                break
            case 2:
                x = this.props.slice[1]
                y = this.props.slice[0]
                z = this.props.slice[2]
                break
        }
        return [(x - this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom,
                (y - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom,
                z]
    }

    getColor() {
        let colors = ['red', 'red', 'red']
        switch (this.props.projection) {
            case 0:
                colors[0] = 'green'
                colors[1] = 'blue'
                break
            case 1:
                colors[0] = 'green'
                colors[2] = 'blue'
                break
            case 2:
                colors[0] = 'blue'
                colors[2] = 'green'
                break
        }
        return colors
    }

    getNodules() {
        let nodules = []
        let shape = this.props.shape
        for (let nodule of this.props.nodules) {
            switch (this.props.projection) {
                case 0: var coordinates = [nodule[0], nodule[1], nodule[2], nodule[3], nodule[3]]; break
                case 1: var coordinates = [nodule[0], nodule[2], nodule[1], nodule[3], nodule[3]]; break
                case 2: var coordinates = [nodule[1], nodule[2], nodule[0], nodule[3], nodule[3]]; break
            }
            coordinates[0] = (coordinates[0] - this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom
            coordinates[1] = (coordinates[1] - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom
            coordinates[2] = coordinates[2]
            coordinates[3] = coordinates[3] * this.props.factor * this.props.zoom
            coordinates[4] = coordinates[4]  / this.props.spacing[2]
            nodules = [...nodules, coordinates]
        }
        return nodules
    }

    render(item) {
        const ct_item = this.props.ct_store.get(this.props.id)
        const image = this.props.image
        const viewImage = this.drawImage(image, ct_item, this.props.projection)
        const sliderPos = this.getSliderPos(this.props.slice[this.props.projection])
        var slider_style = { height: viewImage.height }
        const coordinates = ct_item.coordinates
        const lines = this.getLines(coordinates, image.width, image.height)

        const shape = this.props.shape

        let y1 = (lines[0] - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom
        let height1 = lines[2] * this.props.factor * this.props.spacing[1] * this.props.zoom

        let x2 = (lines[1]- this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom
        let width2 = lines[3] * this.props.factor * this.props.spacing[0] * this.props.zoom

        let color = this.getColor()
        let slice = this.getSlices()
        let style = {backgroundColor: color[2]}

        return (
            <div className="slice-viewer">
                <div className="image"
                     onWheel={this.onWheel.bind(this)}
                     onMouseDown={this.onPointerDown.bind(this)}
                     onMouseUp={this.onPointerUp.bind(this)}
                     onMouseMove={this.onPointerMove.bind(this)}
                     onMouseLeave={this.props.onPointerLeave.bind(this)}
                     onContextMenu={this.onAddNodule.bind(this)}>
                     <ImageWithOpacity width={viewImage.width} height={viewImage.height} image={viewImage}
                            y1={y1} height1={height1}
                            x2={x2} width2={width2}
                            color={color}
                            slice={slice}
                            drawCrops={this.props.drawCrops}
                            drawSlices={this.props.drawSlices}
                            projection={this.props.projection}
                            nodules={this.getNodules()}
                    />
                </div>
                <div height={viewImage.height}>
                    <Slider className="slider" vertical={this.props.vertical}
                            trackStyle={style}
                            value={sliderPos} min={this.props.minSlice} max={this.props.maxSlice}
                            onChange={this.onSliderChange.bind(this)} />
                </div>
                <div>
                    <div> {this.props.slice[this.props.projection]} </div>
                    <button className='zoom-button' onClick={this.onZoomPlus.bind(this)}> + </button>
                    <button className='zoom-button' onClick={this.onZoomMinus.bind(this)}> - </button>
                    <button className='button' onClick={this.onUnzoom.bind(this)}> {"Unzoom"} </button>
                </div>
            </div>
        )
    }
}

CTSliceViewer.propTypes = {
    minSlice: PropTypes.number,
    maxSlice: PropTypes.number.isRequired,
    slice: PropTypes.number,
    vertical: PropTypes.bool,
    reverse: PropTypes.bool,
}

CTSliceViewer.defaultProps = {
    minSlice: 0,
    value: 0,
    vertical: true,
    reverse: true,
}
