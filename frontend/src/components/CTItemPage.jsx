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
            crops: [
                [null, null, null, null],
                [null, null, null, null],
                [null, null, null, null]
            ]
        }
    }

    onSliceChange(slice, projection) {
        let a = this.state.slice
        a[projection] = slice
        this.setState({slice: a})
    }

    onCrop(image, x, y, width, height) {
        this.setState
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

    renderImageViewer(item, projection, rotation, flip) {
        const resizeFactor = 2
        const maxSlice = item.shape[projection]
        const image = this.props.ct_store.getImageCrop(item.id, this.state.slice[projection], this.state.crops[projection],  projection)
        const spacing = item.spacing

        return (
            <CTSliceViewer slice={this.state.slice[projection]} maxSlice={maxSlice - 1} vertical={true} reverse={true}
                           factor={resizeFactor} image={image} projection={projection} spacing={spacing} rotation={rotation}
                           flip={flip} onSliceChange={this.onSliceChange.bind(this)} />
        )
    }

    renderAllImageViewers(item) {
        return (
            <div>
                <div className='lt'>
                    {this.renderImageViewer(item, 0, 0, false)}
                </div>
                <div className='rt'>
                    {this.renderImageViewer(item, 2, 90, false)}
                </div>
                <div className='rb'>
                    {this.renderImageViewer(item, 1, 180, false)}
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
