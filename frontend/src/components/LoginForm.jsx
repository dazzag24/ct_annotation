import React, { Component } from 'react';

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
        <form>
            <input
                name='login'
                placeholder='Login'
                onChange={this.onChange}
            />
            <br></br>
            <input
                name='password'
                placeholder='Password'
                onChange={this.onChange}
            />
            <br></br>
            <button onClick={this.onSubmit}>Submit</button>
        </form>
    );
    }
}
