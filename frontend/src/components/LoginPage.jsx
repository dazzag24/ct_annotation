import React, { Component } from 'react'
import LoginForm from './LoginForm.js'
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
        console.log('in Login')
        return (
            <div>
                <br></br>
                <LoginForm onSubmit={this.onLoginSubmit.bind(this)}/>
            </div>
        )
    }
}
