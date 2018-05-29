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
            down: false,
            start: [0, 0]
        }
    }

    onSliceChange(slice, projection) {
        let a = this.state.slice
        a[projection] = slice
        this.setState({slice: a})
    }

    onZoom(event, x, y, projection) {
        let center = this.state.center
        let zoom = this.state.zoom

        let delta = event.deltaY || event.detail || event.wheelDelta


        zoom[projection] = Math.max(1, zoom[projection] - delta / 1000)
        let id = this.props.match.params.id
        //center[projection][0] = this.props.ct_store.get(id).coordinates[projection][0] + x
        //center[projection][1] = this.props.ct_store.get(id).coordinates[projection][1] + y

        this.setState({center: center,  zoom: zoom})
    }

    onMouseDown(event, x, y, projection) {
        let id = this.props.match.params.id
        this.setState({down: true, start: [x, y]})
    }

    onMouseUp(event, x, y, projection) {
        this.setState({down: false})
    }

    onMouseMove(event, x, y, factor, projection) {
        if (this.state.down) {
            let center = this.state.center
            let id = this.props.match.params.id
            let corner = this.props.ct_store.getCorner(id, projection)
            let shape = this.props.ct_store.getShape(id, projection)

            console.log(shape)

            if (center[projection][0] == null) {
                center[projection][0] = Math.ceil(shape[0] / 2)
                center[projection][1] = Math.ceil(shape[1] / 2)
            }

            console.log('center before:', center[projection])

            let a = center[projection][0] - (x - this.state.start[0]) / factor[0]
            let b = center[projection][1] - (y - this.state.start[1]) / factor[1]

            let start = this.state.start

            console.log('move:', x - this.state.start[0], y - this.state.start[1])

            let newCoords = this.canBeCenter(id, event, a, b, projection)

            start[0] = x
            start[1] = y

            console.log('start', this.state.start)
            console.log('xy', x, y)
            console.log(x, y, a, b, newCoords)

            center[projection][0] = newCoords[0]
            center[projection][1] = newCoords[1]
            console.log('center after:', center[projection])
            this.setState({center: center, start: start});
        }
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

    handleInference() {
        this.props.ct_store.getInference(this.props.match.params.id)
    }


    handleNodulesToggle() {
        this.setState({nodulesOn: !this.state.nodulesOn})
    }

    renderNodules(nodules, color, resizeFactor) {
        let self = this
        let nodules_shown = nodules.map(function(nodule, ix){
            if ((self.state.currentSlice > nodule[0] - nodule[3] / 2) & (self.state.currentSlice < nodule[0] + nodule[3] / 2)) {
                const radius_y = (1 - Math.abs(nodule[0] - self.state.currentSlice) / (nodule[3]/2)) * nodule[4]
                const radius_x = (1 - Math.abs(nodule[0] - self.state.currentSlice) / (nodule[3]/2)) * nodule[5]
                return <Ellipse key={ix} x={nodule[2] * resizeFactor}
                                         y={nodule[1] * resizeFactor}
                                         radius={{x: radius_x * resizeFactor, y: radius_y * resizeFactor}}
                                         fill={color} opacity={0.4} />
            } else
                return null
        })
        return nodules_shown
    }

    renderImageViewer(item, projection) {
        const resizeFactor = 2
        const maxSlice = item.shape[projection]
        const image = this.props.ct_store.getImageCrop(item.id, this.state.slice[projection], this.state.center[projection],  this.state.zoom[projection], projection)
        const spacing = this.props.ct_store.getSpacing(item.id, projection)
        const shape = this.props.ct_store.getShape(item.id, projection)

        return (
            <CTSliceViewer slice={this.state.slice[projection]} maxSlice={maxSlice - 1} vertical={true} reverse={true}
                           factor={resizeFactor} image={image} projection={projection} spacing={spacing} zoom={this.state.zoom[projection]}
                           shape={shape}
                           onSliceChange={this.onSliceChange.bind(this)} 
                           onZoom={this.onZoom.bind(this)}
                           onMouseDown={this.onMouseDown.bind(this)}
                           onMouseUp={this.onMouseUp.bind(this)}
                           onMouseMove={this.onMouseMove.bind(this)}
                           />
        )
    }

    renderAllImageViewers(item) {
        return (
            <div>
                <div className='lt'>
                    {this.renderImageViewer(item, 0)}
                </div>
                <div className='rt'>
                    {this.renderImageViewer(item, 2)}
                </div>
                <div className='rb'>
                    {this.renderImageViewer(item, 1)}
                </div>
            </div>
        )
    }

    handleNoduleClick(nodules, nodule_no) {
        this.setState({currentSlice: nodules[nodule_no][0]})
    }

    renderNodulesList(nodules) {
        return (
            <ListGroup>
                { nodules.map( (nodule, ix) =>
                   <ListGroupItem key={ix} onClick={this.handleNoduleClick.bind(this, nodules, ix)}>[{nodule.slice(0, 4).join(', ')}]</ListGroupItem>)}
            </ListGroup>
        )
    }

    renderImageLoading() {
        return (
            <Icon name="spinner" spin className="loading" />
        )
    }

    renderPage(item) {
        return (
            <Row>
            <Col xs={12} sm={8} lg={6} >
                { (item.image) ?
                  this.renderAllImageViewers(item)
                  :
                  this.renderImageLoading()
                }
            </Col>
            { item.nodules ?
                <Col xs={12} sm={2} className="nodules">
                    <h3>Nodules</h3>
                    { this.renderNodulesList(item.nodules) }
                </Col>
              : null
            }
            </Row>
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

    render() {
        const item = this.props.ct_store.get(this.props.match.params.id)

        return (
        <div className="page ct item">
            <Grid fluid>
            <Row>
                <Col xs={12}>
                    <h2>Patient {this.props.match.params.id}</h2>
                </Col>
            </Row>
            {(item === undefined) ?
             this.renderPageLoading()
             :
             this.renderPage(item)
            }
            </Grid>
        </div>
        )
    }
}
