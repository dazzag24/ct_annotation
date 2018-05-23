import React from 'react'
import { Component } from 'react'
import PropTypes from 'prop-types'
import { Grid, Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css';
import Toggle from 'react-toggle'
import { Icon } from 'react-fa'
import { Layer, Stage, Image, Ellipse } from 'react-konva'


export default class CTSliceViewer extends Component {
    constructor(props) {
        super(props)
        this.state = {slice: this.props.slice}
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
            this.props.onSliceChange(slice)
        }

        this.setState({slice: slice})
    }

    drawImage(image) {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx.putImageData(image, 0, 0)

        const canvas2 = document.createElement('canvas')
        canvas2.width = canvas.width * this.props.factor
        canvas2.height = canvas.height * this.props.factor
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height)
        return canvas2
    }

    render(item) {
        const viewImage = this.drawImage(this.props.image)
        const slider_style = { height: viewImage.height }
        const sliderPos = this.getSliderPos(this.state.slice)

        return (
            <div className="slice-viewer">
                <div className="image">
                    <Stage width={viewImage.width} height={viewImage.height}>
                        <Layer><Image image={viewImage} /></Layer>
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
