import React, { Component } from 'react';
import { FormControl, Button } from 'react-bootstrap';
import '../../css/login.css'


export default class LoginForm extends Component {
    state = {
        login: '',
        password: ''
    };

    onChange = e => {
        this.setState({ [e.target.name]: e.target.value });
    }

    onSubmit = e => {
        e.preventDefault()
        // callback of parent-component
        this.props.onSubmit(this.state)
    }

    render() {
        return (
        <form className="login-form">
            <FormControl
                name='login'
                placeholder='Login'
                onChange={this.onChange}
            />
            <br></br>
            <FormControl
                name='password'
                placeholder='Password'
                onChange={this.onChange}
            />
            <br></br>
            <Button onClick={this.onSubmit}>Submit</Button>
        </form>
    );
    }
}
