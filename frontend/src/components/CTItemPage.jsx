import React from 'react'
import { Component } from 'react'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import { ReactBootstrapSlider } from 'react-bootstrap-slider'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';
import Toggle from 'react-toggle'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { Layer, Stage, Image, Ellipse } from 'react-konva'


@inject("ct_store")
@observer
export default class CTItemPage extends Component {
    constructor(props) {
        super(props)
        this.state = {currentSlice: 0, predictOn: true, nodulesOn: true}
    }

    onSliceChange(value) {
        this.setState({currentSlice: 63-value})
    }

    handleInference() {
        this.props.ct_store.getInference(this.props.match.params.id)
    }


    drawImage(image, resizeFactor) {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.putImageData(image, 0, 0)

        const canvas2 = document.createElement('canvas')
        canvas2.width = canvas.width * resizeFactor
        canvas2.height = canvas.height * resizeFactor
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height)
        return canvas2
    }

    handlePredictToggle() {
        this.setState({predictOn: !this.state.predictOn})
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

    renderImageViewer(item) {
        const self = this
        const resizeFactor = 4

        const imageData = this.props.ct_store.getImageSlice(item.id, this.state.currentSlice)
        const scan_image = this.drawImage(imageData, resizeFactor)
        const slider_style = { height: scan_image.height }

        let nodules, nodules_predict
        if (item.nodules){
            nodules = this.renderNodules(item.nodules, "red", resizeFactor)
        }
        if (item.nodules_predict){
            nodules_predict = this.renderNodules(item.nodules_predict, "green", resizeFactor)
        }

        return (
            <div className="image-viewer">
                <div className="image-viewer-with-toggles">
                    <label className="toggle nodules">
                        <Toggle className="nodules"
                                defaultChecked={this.state.nodulesOn}
                                onChange={this.handleNodulesToggle.bind(this)}
                                disabled={!item.nodules} />
                        <span>Nodules</span>
                    </label>
                    <label className="toggle predict">
                        <Toggle className="predict"
                                defaultChecked={this.state.predictOn}
                                onChange={this.handlePredictToggle.bind(this)}
                                disabled={!item.nodules_predict} />
                        <span>Predict</span>
                    </label>

                    <Stage width={scan_image.width} height={scan_image.height}>
                        <Layer><Image image={scan_image} /></Layer>
                        { this.state.nodulesOn & (nodules !== null) ? <Layer>{nodules}</Layer> : null}
                        { this.state.predictOn & (nodules_predict !== null) ?  <Layer>{nodules_predict}</Layer> : null}
                    </Stage>
                </div>
                <div style={slider_style}>
                    <Slider className="slider" value={63-this.state.currentSlice} min={0} max={63} vertical={true}
                            onChange={this.onSliceChange.bind(this)} />
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
                  this.renderImageViewer(item)
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
            { item.nodules_predict ?
                <Col xs={12} sm={2} className="nodules">
                    <h3>Predict</h3>
                    { this.renderNodulesList(item.nodules_predict) }
                </Col>
              : null
            }
            { item.nodules_predict ? null :
                <Button bsStyle="success" className="get-inference" onClick={this.handleInference.bind(this)}>
                    { item.waitingInference ?
                        <Icon name="spinner" spin />
                      :
                        <span><Icon name="check-circle-o" /><span>Click to predict</span></span>
                    }
                </Button>
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
