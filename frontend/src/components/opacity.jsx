import React from 'react'
import { Component } from 'react'
import { Layer, Stage, Image, Circle, Line, Rect, Text } from 'react-konva'

export default class ImageWithOpacity extends Component {
    render () {
        let w1 = this.props.x2
        let w2 = this.props.width2
        let w3 = this.props.width - w1 - w2

        let h1 = this.props.y1
        let h2 = this.props.height1
        let h3 = this.props.height - h1 - h2

        let slice = this.props.slice
        let lineWidth = 2
        let color = 'gray'

        if (this.props.drawCrops) {
            var opacity = 0.5
        }
        else {
            var opacity = 0
        }
        
        if (this.props.drawSlices) {
            var lineOpacity = 1
        }
        else {
            var lineOpacity = 0
        }

        let scaleX = this.props.width * 0.8
        let length = this.props.width * 0.12
        let scaleY = this.props.height * 0.95
        let lengthInMm = length / this.props.scale
        let nDigits
        if (length / this.props.scale > 10) {
            nDigits = 0
        } else {
            nDigits = 1
        }
        let label = lengthInMm.toFixed(nDigits) + ' mm'
        let dash = [33, 10]

        return (    <Stage  width={this.props.width} height={this.props.height}>
                        <Layer><Image image={this.props.image}/></Layer>
                        <Layer><Rect
                            x={0} y={0}
                            width={w1+w2+w3} height={h1}
                            fill={color}
                            opacity={opacity}
                          />
                        </Layer>
                        <Layer><Rect
                            x={0} y={h1}
                            width={w1} height={h2}
                            fill={color}
                            opacity={opacity}
                          />
                        </Layer>
                        <Layer><Rect
                            x={w1+w2} y={h1}
                            width={w3} height={h2}
                            fill={color}
                            opacity={opacity}
                          />
                        </Layer>
                        <Layer><Rect
                            x={0} y={h1+h2}
                            width={w1+w2+w3} height={h3}
                            fill={color}
                            opacity={opacity}
                          />
                        </Layer>
                        <Layer><Line
                            points={[0, slice[1], this.props.width, slice[1]]}
                            stroke={this.props.color[1]}
                            strokeWidth={lineWidth}
                            opacity={lineOpacity}
                            dash={dash}
                          />
                           </Layer>
                          <Layer><Line
                            points={[slice[0], 0, slice[0], this.props.height]}
                            stroke={this.props.color[0]}
                            strokeWidth={lineWidth}
                            opacity={lineOpacity}
                            dash={dash}
                          />
                        </Layer>

                        {this.props.nodules.map((nodule, index) => {
                            let opacity, radius
                            if (Math.abs(slice[2] - nodule[2]) < nodule[4]) {
                                opacity = 0.3
                                radius = Math.sqrt(nodule[4] * nodule[4] - (slice[2] - nodule[2]) * (slice[2] - nodule[2]))
                                radius = radius * nodule[3] / nodule[4]
                            } else {
                                opacity = 0
                            }
                            return <Layer><Circle onClick={this.props.onNoduleClick.bind(this, index)}
                                x={nodule[0]} y={nodule[1]}
                                radius={radius}
                                shadowBlur={5}
                                opacity={opacity}
                                fill={"green"}
                              />
                              </Layer>
                        })}

                        <Layer><Line
                            points={[scaleX, scaleY,
                                     scaleX+length, scaleY]}
                            stroke={'yellow'}
                            strokeWidth={2}
                          />
                        </Layer>

                        <Layer><Text
                            x={scaleX}
                            y={scaleY-20}
                            fontSize={20}
                            fill={'yellow'}
                            text={label}
                          />
                        </Layer>

                     
                    </Stage>
        )
    }
}