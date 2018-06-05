import React from 'react'
import { Component } from 'react'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';
import Toggle from 'react-toggle'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { Layer, Stage, Image, Ellipse } from 'react-konva'

import CTSliceViewer from './CTSliceViewer.jsx'


@inject("ct_store")
@observer
export default class CTItemPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            slice: [0, 0, 0],
            nodulesOn: true,
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
            drawSlices: false,
            wheelZoom: false,
            chooseRadius: false,
            radiusRatio: 0,
            nodules: [],
            projections: [true, true, true],
            showList: false,
            noduleMode: false
        }
    }

    onSliceChange(slice, projection) {
        let a = this.state.slice
        let images = this.state.images
        a[projection] = slice
        images[projection] = null
        this.setState({slice: a, images: images})
    }

    onZoom(factor, projection) {
        let center = this.state.center
        let zoom = this.state.zoom

        zoom[projection] = Math.min(256, Math.max(1, zoom[projection] * factor))

        this.setState({center: center,  zoom: zoom})
    }

    onPointerDown(event, x, y, factors, projection) {
        if (this.state.noduleMode) {
            this.startNodule(event, x, y, factors, projection)
        } else {
            this.startMoving(event, x, y, projection)
        }
    }

    startMoving(event, x, y, projection) {
        this.setState({imageClicked: true, start: [x, y]})
    }

    startNodule(event, x, y, factors, projection) {
        let id = this.props.match.params.id
        let corner = this.props.ct_store.getCorner(id, projection)
        let shape = this.props.ct_store.getShape(id, projection)
        let nodules = this.state.nodules
        let axis = this.props.ct_store.getReverseAxis(projection)

        let base_coord = [x / factors[0] + corner[0], y / factors[1] + corner[1], this.state.slice[projection]]
        let coord = [base_coord[axis[0]], base_coord[axis[1]], base_coord[axis[2]], 0]

        this.setState({imageClicked: true,
                       chooseRadius: true,
                       nodules: [...this.state.nodules, coord],
                       start: [x, y]
                   })
    }

    onPointerUp(event, x, y, projection) {
        if (this.state.imageClicked) {
            let nodules = this.removeZeroNodule()
            this.setState({nodules: nodules, imageClicked: false, chooseRadius: false, noduleClicked: [null, -1], noduleIndex: null})
        }
    }

    removeZeroNodule() {
        let nodules = this.state.nodules
        if (nodules.length > 0){
            let nodule = nodules[nodules.length-1]
            if (nodule[3] == 0) {
                nodules.splice(nodules.length-1, 1)
            }
             }
        return nodules
    }

    onPointerLeave(event, x, y, projection) {
        this.setState({imageClicked: false, noduleClicked: [null, -1], chooseRadius: false, noduleIndex: null})
    }

    onPointerMove(event, x, y, factor, projection) {
        const delta = 3
        let shape = this.props.ct_store.getShape(this.props.match.params.id, projection)
        let bottom = shape[1] * factor[1] / this.state.zoom[projection]
        let right = shape[0] * factor[0] / this.state.zoom[projection]

        if (this.state.imageClicked) {
            {(this.state.noduleMode)
            ?
            this.selectRadius(event, x, y, factor, projection)
            :
            this.moving(event, x, y, factor, projection)}
        }
        let index = this.state.noduleIndex
        if (this.state.noduleClicked[0] != null) {
            this.onNodulePointerMove(event, index, x, y, factor, projection)            
        }
    }

    moving(event, x, y, factor, projection) {
        let center = this.state.center
        let id = this.props.match.params.id
        let corner = this.props.ct_store.getCorner(id, projection)
        let shape = this.props.ct_store.getShape(id, projection)

        if (center[projection][0] == null) {
            center[projection][0] = Math.ceil(shape[0] / 2)
            center[projection][1] = Math.ceil(shape[1] / 2)
        }

        let a = center[projection][0] - (x - this.state.start[0]) / factor[0]
        let b = center[projection][1] - (y - this.state.start[1]) / factor[1]

        let start = this.state.start

        let newCoords = this.canBeCenter(id, event, a, b, projection)

        start[0] = x
        start[1] = y

        center[projection][0] = newCoords[0]
        center[projection][1] = newCoords[1]
        this.setState({center: center, start: start});
    }

    canBeCenter(id, event, x, y, projection) {
        let shape = this.props.ct_store.getShape(id, projection)
        let zoom = this.state.zoom[projection]

        let left = Math.ceil(shape[0] - shape[0] / zoom / 2)
        let right = Math.ceil(shape[0] / zoom / 2)
        let bottom = Math.ceil(shape[1] - shape[1] / zoom / 2)
        let top = Math.ceil(shape[1] / zoom / 2)

        if (x > left) {
            x = left
        } else {
            if (x < right) {
                x = right
            }
        }

        if (y < top) {
            y = top
        } else {
            if (y > bottom) {
                y = bottom
            }
        }

        return [x, y]
    }

    getRadius(index, x, y, factor, projection) {
        let id = this.props.match.params.id
        let nodules = this.state.nodules
        let nodule = this.state.nodules[index]
        let axis = this.props.ct_store.getAxis(projection)
        let spacing = this.props.ct_store.getSpacing(id, projection)

        let base_coord = this.getAbsoluteCoordinates(x, y, factor, projection)
        let r1 = (base_coord[0] - nodule[axis[0]]) * spacing[0]
        let r2 = (base_coord[1] - nodule[axis[1]]) * spacing[1]

        return Math.sqrt(r1 * r1 + r2 * r2)
    }

    getAbsoluteCoordinates(x, y, factor, projection) {
        let id = this.props.match.params.id
        let corner = this.props.ct_store.getCorner(id, projection)

        return [x / factor[0] + corner[0], y / factor[1] + corner[1]]
    }

    selectRadius(event, x, y, factor, projection) {
        let nodules = this.state.nodules
        let index = nodules.length - 1
        let nodule = nodules[index]
        let radius = this.getRadius(index, x, y, factor, projection)

        x = this.getAbsoluteCoordinates(x, y, factor, projection)[0]
        y = this.getAbsoluteCoordinates(x, y, factor, projection)[1]

        let start = this.state.start

        let new_x = (x +  this.getAbsoluteCoordinates(start[0], start[1], factor, projection)[0]) / 2
        let new_y = (y +  this.getAbsoluteCoordinates(start[0], start[1], factor, projection)[1]) / 2

        let coord = [new_x, new_y, this.state.slice[projection]]
        
        let axis = this.props.ct_store.getReverseAxis(projection)

        nodule = [coord[axis[0]], coord[axis[1]], coord[axis[2]], radius]
        nodules[index] = nodule
        this.setState({nodules: nodules})

    }

    onDrawCrops() {
        this.setState({drawCrops: !this.state.drawCrops})
    }

    onDrawSlices() {
        this.setState({drawSlices: !this.state.drawSlices})
    }

    onWheelFunction() {
        this.setState({wheelZoom: !this.state.wheelZoom})
        
    }

    onAddNodule() {
        this.setState({noduleMode: !this.state.noduleMode})
    }

    onUnzoom(projection) {
        let zoom = this.state.zoom
        zoom[projection] = 1
        this.setState({zoom: zoom})
    }

    onUnzoomAll(projection) {
        this.setState({zoom: [1, 1, 1]})
    }

    onClearNodules() {
        this.setState({nodules: []})
    }

    onShowList() {
        this.setState({showList: !this.state.showList})
    }

    onNodulePointerDown(event, index, x, y, factor, projection) {
        {(this.state.noduleMode)
         ?
         this.startMoveNodule(event, index, x, y, factor, projection)
         :
         this.onPointerDown(event, x, y, factor, projection)
        }
    }

    startMoveNodule(event, index, x, y, factor, projection) {
        let selectedRadius = this.getRadius(index, x, y, factor, projection)

        let id = this.props.match.params.id
        let axis = this.props.ct_store.getAxis(projection)
        let spacing = this.props.ct_store.getSpacing(id, projection)
        
        let noduleRadius = this.state.nodules[index][3]
        let shiftInSlices = (this.state.slice[projection] - this.state.nodules[index][axis[2]]) * spacing[2]
        
        let radius = Math.sqrt(noduleRadius * noduleRadius - shiftInSlices * shiftInSlices)
        
        this.setState({noduleClicked: [event.button, index],
                       radiusRatio: selectedRadius / radius,
                       noduleIndex: index,
                       start: [x, y]})
    }



    onNodulePointerUp(event, index, x, y, factor, projection) {
        {(this.state.noduleMode)
         ?
         this.setState({noduleClicked: [null, -1], imageClicked: false, radiusRatio: 0, noduleIndex: null})
         :
         this.onPointerUp(event, x, y, factor, projection)
        }
    }

    onNodulePointerMove(event, index, x, y, factor, projection) {
        if ((this.state.noduleMode) && (this.state.noduleClicked[1] == index)) {
            switch (this.state.noduleClicked[0]) {
                case 0: this.moveNodule(event, index, x, y, factor, projection)
                case 2: this.changeRadius(event, index, x, y, factor, projection)
            }
        } else {
            this.onPointerMove(event, x, y, factor, projection)
        }
    }

    onProjectionSelector(index) {
        let projections = this.state.projections
        projections[index] = !projections[index]
        this.setState({projections: projections})
    }

    changeRadius(event, index, x, y, factor, projection) {
        let selectedRadius = this.getRadius(index, x, y, factor, projection)
        let id = this.props.match.params.id
        let axis = this.props.ct_store.getAxis(projection)
        let spacing = this.props.ct_store.getSpacing(id, projection)
        
        let nodules = this.state.nodules
        let sliceRadius = selectedRadius / this.state.radiusRatio
        let shiftInSlices = (this.state.slice[projection] - nodules[index][axis[2]]) * spacing[2]

        nodules[index][3] = Math.sqrt(sliceRadius * sliceRadius + shiftInSlices * shiftInSlices) 

        this.setState({nodules: nodules})
    }

    moveNodule(event, index, x, y, factor, projection) {
        let nodules = this.state.nodules
        let id = this.props.match.params.id
        let corner = this.props.ct_store.getCorner(id, projection)
        let axis = this.props.ct_store.getReverseAxis(projection)
        let revAxis = this.props.ct_store.getAxis(projection)
        let shiftedNodule = [nodules[index][revAxis[0]] + (x - this.state.start[0]) / factor[0],
                             nodules[index][revAxis[1]] + (y - this.state.start[1]) / factor[1],
                             nodules[index][revAxis[2]]]
        nodules[index] = [shiftedNodule[axis[0]], shiftedNodule[axis[1]], shiftedNodule[axis[2]], nodules[index][3]]
        this.setState({nodules: nodules, start: [x, y]})
    }

    onNoduleContextMenu(event, index, x, y, factor, projection) {
        // if (!this.state.chooseRadius) {
        //     let nodules = this.state.nodules
        //     nodules.splice(index, 1)
        //     this.setState({nodules: nodules})
        // } else {
        //     this.setState({chooseRadius: false})
        // }
    }

    selectNodule(index) {
        let nodules = this.state.nodules
        let id = this.props.match.params.id
        let spacing = this.props.ct_store.get(id).spacing
        let shape = this.props.ct_store.get(id).shape
        let s1 = Math.ceil(nodules[index][0])
        let s2 = Math.ceil(nodules[index][1])
        let s3 = Math.ceil(nodules[index][2])

        let c1 = [nodules[index][2], nodules[index][1]]
        let c2 = [nodules[index][2], nodules[index][0]]
        let c3 = [nodules[index][1], nodules[index][0]]
        this.setState({slice: [s1, s2, s3], images: [null, null, null], center: [c1,c2,c3]})
    }

    renderImageViewer(item, projection) {
        const resizeFactor = 2
        const maxSlice = item.shape[projection]
        if (this.state.images[projection] == null) {
            this.state.images[projection] = this.props.ct_store.getImageSlice(item.id, this.state.slice[projection], projection)
        }
        const spacing = this.props.ct_store.getSpacing(item.id, projection)
        const shape = this.props.ct_store.getShape(item.id, projection)

        let center = this.state.center[projection]
        let zoom = this.state.zoom[projection]

        let shift = this.props.ct_store.cropCoordinates(center[0], center[1], zoom, shape[0], shape[1])

        return (
            <CTSliceViewer slice={this.state.slice} maxSlice={maxSlice - 1} vertical={true} reverse={true}
                           factor={resizeFactor} image={this.state.images[projection]} projection={projection}
                           spacing={spacing} zoom={this.state.zoom[projection]}
                           shape={shape} shift={shift} selection={this.state.selection}
                           lines={this.state.lines} id={item.id} drawCrops={this.state.drawCrops}
                           nodules={this.state.nodules}
                           drawSlices={this.state.drawSlices}
                           wheelZoom={this.state.wheelZoom}
                           onSliceChange={this.onSliceChange.bind(this)} 
                           onZoom={this.onZoom.bind(this)}
                           onPointerDown={this.onPointerDown.bind(this)}
                           onPointerUp={this.onPointerUp.bind(this)}
                           onPointerMove={this.onPointerMove.bind(this)}
                           onPointerLeave={this.onPointerLeave.bind(this)}
                           onUnzoom={this.onUnzoom.bind(this)}
                           onNodulePointerDown={this.onNodulePointerDown.bind(this)}
                           onNodulePointerUp={this.onNodulePointerUp.bind(this)}
                           onNodulePointerMove={this.onNodulePointerMove.bind(this)}
                           onNoduleContextMenu={this.onNoduleContextMenu.bind(this)}
                           />
        )
    }

    renderAllImageViewers(item) {
        return (
            <div style={{display: 'inline'}}>
            <Row><Col>
            <Row>
            <Col width={1000}>
                {(this.state.showList) ?
                    <div>
                    <h2> {"Nodules"} </h2>
                    <ul className='nodulesList'>
                        {this.state.nodules.map((nodule, index) => {
                                return <li key={'nodule'+index} onClick={this.selectNodule.bind(this, index)}>
                                    {this.noduleInfo(nodule)}
                                </li>
                            })}
                    </ul>
                    </div>
                    :
                    ''
                }
            </Col>
                <Col>
                    {this.state.projections[0] ? this.renderImageViewer(item, 0) : ''}
                </Col>
                <Col>
                    {this.state.projections[1] ? this.renderImageViewer(item, 1) : ''}
                </Col>
                <Col>
                    {this.state.projections[2] ? this.renderImageViewer(item, 2) : ''}
                </Col>
            </Row>
            </Col>
            </Row>
            </div>
        )
    }

    noduleInfo(nodule) {
        return '[' + [nodule[0].toFixed(0),
                      nodule[1].toFixed(0),
                      nodule[2].toFixed(0),
                      nodule[3].toFixed(0)].join('px, ') + ' mm]'
    }

    renderImageLoading() {
        return (
            <Icon name="spinner" spin className="loading" />
        )
    }

    renderPage(item) {
        return (
                (item.image) ?
                  this.renderAllImageViewers(item)
                  :
                  this.renderImageLoading()
                
        )
    }

    renderPageLoading() {
        return (
            <Row>
            <Col xs={12}>
                <Icon name="spinner" spin className="page loading" />
            </Col>
            </Row>
        )
    }

    componentWillMount() {
        const item = this.props.ct_store.get(this.props.match.params.id)
        if ((item !== undefined) && (item.shape !== null)) {
            for (let projection in [0, 1, 2]) {
                let shape = this.props.ct_store.getShape(item.id, projection)
                let center = this.state.center[projection]
                let zoom = this.state.zoom[projection]
    
                let shift = this.props.ct_store.cropCoordinates(center[0], center[1], zoom, shape[0], shape[1])
                this.props.ct_store.updateCoordinates(item.id, shift, projection)
            }
        }
    }

    render() {
        const item = this.props.ct_store.get(this.props.match.params.id)
        const buttonClass = "btn btn-light"

        return (
        <div className="page ct item">
            <div className="btn-toolbar header" role="toolbar">
                <div className='toolbar'>
                    <button type="button" className={buttonClass} onClick={this.onDrawCrops.bind(this)}> {"Crops"} </button>
                    <button type="button" className={buttonClass} onClick={this.onDrawSlices.bind(this)}> {"Slices"} </button>
                    <button type="button" className={buttonClass} onClick={this.onUnzoomAll.bind(this)}> {"Unzoom"} </button>
                    <button type="button" className={buttonClass} onClick={this.onWheelFunction.bind(this)}> {"Wheel"} </button>
                </div>

                <div className='toolbar'>
                    <button type="button" className={buttonClass + ' dropdown-toggle'} data-toggle="dropdown">
                        Proj <span className="caret"></span>
                    </button>
                    <ul className="dropdown-menu" role="menu">
                      <li><a className="dropdown-item" onClick={this.onProjectionSelector.bind(this, 0)}>
                        <i className="fa fa-check" style={(this.state.projections[0]) ? {} : {display: 'none'}}></i> Axial
                    </a></li>
                    
                    <li><a className="dropdown-item" onClick={this.onProjectionSelector.bind(this, 1)}>
                        <i className="fa fa-check" style={(this.state.projections[1]) ? {} : {display: 'none'}}></i> Saggital
                    </a></li>

                    <li><a className="dropdown-item" onClick={this.onProjectionSelector.bind(this, 2)}>
                        <i className="fa fa-check" style={(this.state.projections[2]) ? {} : {display: 'none'}}></i> Coronal
                    </a></li>
                    </ul>
                </div>

                <div className='toolbar'>
                    <button type="button" className={buttonClass} onClick={this.onShowList.bind(this)}> {"Nodules"} </button>
                </div>

                <div className='toolbar'>
                    <button type="button" className={buttonClass} onClick={this.onClearNodules.bind(this)}> {"Clear"} </button>
                </div>

                <div className='toolbar'>
                    <button type="button" className={buttonClass} onClick={this.onAddNodule.bind(this)}> {"Add nodule"} </button>
                </div>
            </div>
            {(item === undefined) ?
             this.renderPageLoading()
             :
             this.renderPage(item)
            }
        </div>
        )
    }
}