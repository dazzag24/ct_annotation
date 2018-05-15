import React from 'react'
import { Component } from 'react'
import { Icon } from 'react-fa'


export default class LoadingSpinner extends Component {
    render() {
        return (
            <div className="loading">
                <Icon name='spinner' spin></Icon>
                { this.props.text ? <span>{this.props.text}</span> : null }
            </div>
        )
    }
}
