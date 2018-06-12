import React, { Component } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

@inject("lstore")
@observer
export default class Privatize extends Component {
    render () {
        console.log('in privatize')
        var {component: Page, lstore: lstore, ...rest} = this.props
        var isLoggedIn = lstore.isAuthenticated
        console.log(isLoggedIn)
        console.log(Page)
        if (isLoggedIn) {
            return (
                <Page/>
            )
        } else {
            return (
                <Redirect to='/login'/>
            )
        }
    }
}
