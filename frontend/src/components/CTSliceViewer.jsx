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
import ViewerLayers from './ViewerLayers.jsx'

function scaleCoordinates(coordinates, shift, factor, spacing, zoom) {
    let x = (coordinates[0] - shift[0]) * factor * spacing[0] * zoom
    let y = (coordinates[1] - shift[1]) * factor * spacing[1] * zoom
    return [x, y]
}

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
        this.props.onSliceChange(slice, this.props.projection)
    }

    getLines(coordinates, width, height) {
        switch (this.props.projection) {
            case 0:
                var lines = [coordinates[2][0], coordinates[1][0], coordinates[2][2], coordinates[1][2]]
                break
            case 1:
                var lines = [coordinates[2][1], coordinates[0][0], coordinates[2][3], coordinates[0][2]]
                break
            case 2:
                var lines = [coordinates[1][1], coordinates[0][1], coordinates[1][3], coordinates[0][3]]
                break
        }
        return lines
    }

    drawImage(image, item, projection) {
        const spacing = this.props.spacing

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

    // onAddNodule(event) {
    //     event.preventDefault();
    //     let factors = this.getFactors()
    //     let currentTargetRect = event.target.getBoundingClientRect()
    //     let x = (event.clientX - currentTargetRect.left)
    //     let y = (event.clientY - currentTargetRect.top)
    //     this.props.onAddNodule(event, x, y, factors, this.props.projection)        
    // }

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

    getPointerPositionOnNodule(event) {
        let imageX = document.getElementById('image'+this.props.projection).getBoundingClientRect().x
        let imageY = document.getElementById('image'+this.props.projection).getBoundingClientRect().y 

        let x = (event.evt.clientX - imageX)
        let y = (event.evt.clientY - imageY)

        return {x: x, y: y}
    }

    onNodulePointerDown(index, event) {
        const {x, y} = this.getPointerPositionOnNodule(event)
        let factors = this.getFactors()
        this.props.onNodulePointerDown(event.evt, index, x, y, factors, this.props.projection)
        event.evt.stopPropagation()
        event.evt.preventDefault()
    }


    onNodulePointerUp(index, event) {
        const {x, y} = this.getPointerPositionOnNodule(event)
        let factors = this.getFactors()
        this.props.onNodulePointerUp(event.evt, index, x, y, factors, this.props.projection)
        event.evt.stopPropagation()
        event.evt.preventDefault()
    }


    onNodulePointerMove(index, event) {
        const {x, y} = this.getPointerPositionOnNodule(event)
        let factors = this.getFactors()
        this.props.onNodulePointerMove(event.evt, index, x, y, factors, this.props.projection)
    }

    onNoduleContextMenu(index, event) {
        const {x, y} = this.getPointerPositionOnNodule(event)
        let factors = this.getFactors()
        this.props.onNoduleContextMenu(event.evt, index, x, y, factors, this.props.projection)
        event.evt.stopPropagation()
        event.evt.preventDefault()      
    }

    getSlices() {
        let shift = this.props.shift
        let axis = this.props.ct_store.getAxis(this.props.projection)
        let [x, y, z] = [this.props.slice[axis[0]], this.props.slice[axis[1]], this.props.slice[axis[2]]]

        return [(x - this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom,
                (y - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom,
                z]
    }

    getColor() {
        let colors = ['red', 'blue', 'green']
        let axis = this.props.ct_store.getAxis(this.props.projection)
        return [colors[axis[0]], colors[axis[1]], colors[axis[2]]]
    }

    getNodules() {
        let nodules = []
        let coordinates
        let shape = this.props.shape
        let axis = this.props.ct_store.getAxis(this.props.projection)

        for (let nodule of this.props.nodules) {
            coordinates = [nodule[axis[0]], nodule[axis[1]], nodule[axis[2]], nodule[3], nodule[3], nodule[4]]
            let newCoord = scaleCoordinates(coordinates, this.props.shift, this.props.factor, this.props.spacing, this.props.zoom)
            coordinates[0] = newCoord[0]
            coordinates[1] = newCoord[1]
            // coordinates[0] = (coordinates[0] - this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom
            // coordinates[1] = (coordinates[1] - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom
            coordinates[2] = coordinates[2]
            coordinates[3] = coordinates[3] * this.props.factor * this.props.zoom
            coordinates[4] = coordinates[4]  / this.props.spacing[2]
            nodules = [...nodules, coordinates]
        }
        return nodules
    }

    getCurves() {
        let curves = this.props.curves
        curves.map(curve => curve.map((coordinates, _) => scaleCoordinates(coordinates, this.props.shift, this.props.factor, this.props.spacing, this.props.zoom)))
        return curves
    }

    render(item) {
        const ct_item = this.props.ct_store.get(this.props.id)
        const image = this.props.image
        const viewImage = this.drawImage(image, ct_item, this.props.projection)
        const sliderPos = this.getSliderPos(this.props.slice[this.props.projection])
        const mip = this.props.depth[this.props.projection]
        var slider_style = { height: viewImage.height }
        const coordinates = this.props.coordinates

        const lines = this.getLines(coordinates, image.width, image.height)

        const shape = this.props.shape

        let y1 = (lines[0] - this.props.shift[1]) * this.props.factor * this.props.spacing[1] * this.props.zoom
        let height1 = lines[2] * this.props.factor * this.props.spacing[1] * this.props.zoom

        let x2 = (lines[1]- this.props.shift[0]) * this.props.factor * this.props.spacing[0] * this.props.zoom
        let width2 = lines[3] * this.props.factor * this.props.spacing[0] * this.props.zoom

        let color = this.getColor()
        let slice = this.getSlices()
        let style = {backgroundColor: color[2]}
        let scale = 1 / (this.props.spacing[0]) * this.props.factor * this.props.zoom

        return (
            <div className="slice-viewer">
                <Row>
                <Col>
                <div className='controls'>
                    <button className='btn btn-secondary zoom-button toolbarButton' onClick={this.onZoomPlus.bind(this)} title="Увеличить">
                        <div className='user-icon'>
                            <Icon name='search-plus'></Icon>
                        </div>
                    </button>
                    <button className='btn btn-secondary zoom-button toolbarButton' onClick={this.onZoomMinus.bind(this)}  title="Уменьшить">
                        <div className='user-icon'>
                            <Icon name='search-minus'></Icon>
                        </div>
                    </button>
                    <button className='btn btn-secondary button toolbarButton' onClick={this.onUnzoom.bind(this)}  title="Убрать приближение">
                        <div className='user-icon'>
                            <Icon name='expand'></Icon>
                        </div>
                    </button>
                </div>
                </Col>
                </Row>
                <Row><Col>
                <div className="image" id={'image'+this.props.projection}
                     style={{display: 'inline'}}
                     onWheel={this.onWheel.bind(this)}
                     onMouseDown={this.onPointerDown.bind(this)}
                     onMouseUp={this.onPointerUp.bind(this)}
                     onMouseMove={this.onPointerMove.bind(this)}
                     onMouseLeave={this.props.onPointerLeave.bind(this)}>
                     <ViewerLayers width={viewImage.width} height={viewImage.height} image={viewImage}
                            y1={y1} height1={height1}
                            x2={x2} width2={width2}
                            color={color}
                            slice={slice}
                            scale={scale}
                            drawCrops={this.props.drawCrops}
                            drawSlices={this.props.drawSlices}
                            projection={this.props.projection}
                            nodules={this.getNodules()}
                            curves={this.getCurves()}
                            onNodulePointerDown={this.onNodulePointerDown.bind(this)}
                            onNodulePointerUp={this.onNodulePointerUp.bind(this)}
                            onNodulePointerMove={this.onNodulePointerMove.bind(this)}
                            onNoduleContextMenu={this.onNoduleContextMenu.bind(this)}
                    />
                </div>
                </Col>
                <Col>
                <div height={viewImage.height} style={{display: 'inline'}} title="Срез">
                    <Slider className="slider" vertical={this.props.vertical}
                            trackStyle={style}
                            value={sliderPos} min={this.props.minSlice} max={this.props.maxSlice}
                            onChange={this.onSliderChange.bind(this)} />
                </div>
                <div height={viewImage.height} style={{display: 'inline'}} title="MIP">
                <Slider className="slider" vertical={this.props.vertical}
                            trackStyle={style}
                            value={mip} min={1} max={10}
                            onChange={this.props.onDepthChange.bind(this, this.props.projection)} />
                </div>
                </Col>
                </Row>
            </div>
        )
    }
}

// <div> {(this.props.slice[this.props.projection] * this.props.spacing[2]).toFixed(1)} mm </div>

CTSliceViewer.propTypes = {
    projection: PropTypes.number,
    minSlice: PropTypes.number,
    maxSlice: PropTypes.number.isRequired,
    slice: PropTypes.array,
    vertical: PropTypes.bool,
    reverse: PropTypes.bool,
}

CTSliceViewer.defaultProps = {
    minSlice: 0,
    value: 0,
    vertical: true,
    reverse: true,
}