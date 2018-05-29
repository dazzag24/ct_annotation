import React from 'react'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';
import Toggle from 'react-toggle'
import { Icon } from 'react-fa'
import { Layer, Stage, Image, Ellipse, Line, Rect } from 'react-konva'


export default class CTSliceViewer extends Component {
    constructor(props) {
        super(props)
        this.state = {slice: this.props.slice,
                      rotation: this.props.rotation,
                      flip: this.props.flip,
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                      color: "green",
                      down: false
                     }
    }

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
        return aspectRatio
    }

    drawImage(image) {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        const spacing = this.getSpacing()
        ctx.putImageData(image, 0, 0)

        const canvas2 = document.createElement('canvas')
        canvas2.width = canvas.width * this.props.factor * spacing[0]
        canvas2.height = canvas.height * this.props.factor * spacing[1]
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height)
        return canvas2
    }

    onMouseMove(event) {
        if (this.state.down) {
            let currentTargetRect = event.target.getBoundingClientRect()
            this.setState({
                width: event.clientX - this.state.x - currentTargetRect.left,
                height: event.clientY - this.state.y - currentTargetRect.top
            });
        }
    }

    onMouseDown(event) {
        let currentTargetRect = event.target.getBoundingClientRect()
        this.setState({
            x: event.clientX - currentTargetRect.left,
            y: event.clientY - currentTargetRect.top,
            height: 0,
            width: 0,
            down: true
        });
    };

    onMouseUp(event) {
        let currentTargetRect = event.target.getBoundingClientRect()
        this.setState({
            down: false,
            width: event.clientX - this.state.x - currentTargetRect.left,
            height: event.clientY - this.state.y - currentTargetRect.top
        });
    };

    render(item) {
        const viewImage = this.drawImage(this.props.image)
        const sliderPos = this.getSliderPos(this.state.slice)
        var slider_style = { height: viewImage.height }

        if (this.state.rotation == 90 || this.state.rotation == 270) {
            slider_style = { height: viewImage.width }
        }
        

        var image_class = 'image'

        switch (this.state.rotation) {
            case 90:
                image_class += ' rotation90'
                break
            case 180:
                image_class += ' rotation180'
                break
            case 270:
                image_class += ' rotation270'
                break
        }

        if (this.state.flip) {
            image_class += ' flip'
        }

        return (
            <div className="slice-viewer">
                <div className={image_class} 
                     onMouseDown={this.onMouseDown.bind(this)}
                     onMouseUp={this.onMouseUp.bind(this)}
                     onMouseMove={this.onMouseMove.bind(this)}>
                    <Stage width={viewImage.width} height={viewImage.height}>
                        <Layer><Image image={viewImage}/></Layer>
                        <Layer><Rect
                            x={this.state.x}
                            y={this.state.y}
                            width={this.state.width}
                            height={this.state.height}
                            shadowBlur={5}
                            fill={this.state.color}
                            opacity={0.3}
                          />
                    </Layer>
                    </Stage>
                </div>
                <div style={slider_style}>
                    <Slider className="slider" vertical={this.props.vertical}
                            value={sliderPos} min={this.props.minSlice} max={this.props.maxSlice}
                            onChange={this.onSliderChange.bind(this)} />
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
