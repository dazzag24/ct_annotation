import React from 'react'
import { Component } from 'react'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import { ReactBootstrapSlider } from 'react-bootstrap-slider'
import Toggle from 'react-bootstrap-toggle'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { Layer, Stage, Image, Ellipse } from 'react-konva'


@inject("ct_store")
@observer
export default class CTItemPage extends Component {
    constructor(props) {
        super(props)
        this.state = {currentSlice: 0, maskOn: true, nodulesOn: true}
    }

    onSliceChange(event) {
        this.setState({currentSlice: event.target.value})
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

    handleMaskToggle() {
        this.setState({maskOn: !this.state.maskOn})
    }

    handleNodulesToggle() {
        this.setState({nodulesOn: !this.state.nodulesOn})
    }

    renderImageViewer(item) {
        const self = this
        const resizeFactor = 8

        const imageData = this.props.ct_store.getImageSlice(item.id, this.state.currentSlice)
        const scan_image = this.drawImage(imageData, resizeFactor)
        let mask_image
        if (item.mask){
            const maskData = this.props.ct_store.getMaskSlice(item.id, this.state.currentSlice)
            mask_image = this.drawImage(maskData, resizeFactor)
        }

        const slider_style = { height: scan_image.height }

        let nodules
        if (item.nodules){
            nodules = item.nodules.map(function(nodule, ix){
                if ((self.state.currentSlice > nodule[0] - nodule[3] / 2) & (self.state.currentSlice < nodule[0] + nodule[3] / 2)) {
                    const radius_y = (1 - Math.abs(nodule[0] - self.state.currentSlice) / (nodule[3]/2)) * nodule[4]
                    const radius_x = (1 - Math.abs(nodule[0] - self.state.currentSlice) / (nodule[3]/2)) * nodule[5]
                    return <Ellipse key={ix} x={nodule[2] * resizeFactor}
                                             y={nodule[1] * resizeFactor}
                                             radius={{x: radius_x * resizeFactor, y: radius_y * resizeFactor}}
                                             fill='green' opacity={0.5} />
                } else
                    return null
            })
        }

        return (
            <div className="image-viewer">
                <div className="image-viewer-with-toggles">
                    <Toggle active={this.state.maskOn} onClick={this.handleMaskToggle.bind(this)} disabled={!item.mask}
                            onstyle="danger" on={<span className="on">mask</span>} off={<span className="off">mask</span>} />
                    <Toggle active={this.state.nodulesOn} onClick={this.handleNodulesToggle.bind(this)} disabled={!item.nodules}
                            onstyle="success" on={<span className="on">nodules</span>} off={<span className="off">nodules</span>} />
                    <Stage width={scan_image.width} height={scan_image.height}>
                        <Layer><Image image={scan_image} /></Layer>
                        { this.state.maskOn & (item.mask !== null) ? <Layer><Image image={mask_image} /></Layer> : null}
                        { this.state.nodulesOn & (item.nodules !== null) ? <Layer>{nodules}</Layer> : null}
                    </Stage>
                </div>
                <div style={slider_style}>
                    <ReactBootstrapSlider value={this.state.currentSlice} change={this.onSliceChange.bind(this)} min={0} max={31} orientation="vertical" />
                </div>
            </div>
        )
    }

    handleNoduleClick(item, nodule_no) {
        this.setState({currentSlice: item.nodules[nodule_no][0]})
    }

    renderNodulesList(item) {
        return (
            <ListGroup>
                { item.nodules.map( (nodule, ix) =>
                   <ListGroupItem key={ix} onClick={this.handleNoduleClick.bind(this, item, ix)}>Nodule [{nodule.join(', ')}]</ListGroupItem>)}
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
            <Col xs={12} sm={8} lg={7} >
                { (item.image) ?
                  this.renderImageViewer(item)
                  :
                  this.renderImageLoading()
                }
            </Col>
            { item.nodules ?
                <Col xs={12} sm={4} className="nodules">
                    <h3>Confirmed nodules</h3>
                    { this.renderNodulesList(item) }
                </Col>
              : null
            }
            { item.mask ? null :
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
