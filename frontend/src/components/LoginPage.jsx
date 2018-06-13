import React, { Component } from 'react'
import LoginForm from './LoginForm.jsx'
import { Redirect } from 'react-router-dom'
import { Provider, inject, observer } from 'mobx-react'


@inject("lstore")
@observer
export default class LoginPage extends Component {
    onLoginSubmit(info) {
        // some more sophisticated processing should be here
        var lstore = this.props.lstore
        console.log(lstore)
        lstore.updateAuthStatus(info)
    }
    render() {
        var lstore = this.props.lstore
        console.log('in Login')
        if (lstore.checkAuthStatus()) {
            var to = (( lstore.referTo ) ? lstore.referTo : '/')
            lstore.referTo = null
            return (
                <Redirect to={to}/>
            )
        }
        return (
            <div>
                <br></br>
                <LoginForm onSubmit={this.onLoginSubmit.bind(this)}/>
            </div>
        )
    }
}
