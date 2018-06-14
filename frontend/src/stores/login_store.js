import { observable, autorun, computed, action, extendObservable } from 'mobx'

import { API_Events } from './const'

export default class LoginStore {
    server = null
    @observable isAuthenticated = null
    @observable referTo = null

    constructor(server) {
        this.server = server
        this.server.subscribe(API_Events.GOT_AUTH_STATUS, this.onGotStatus.bind(this))
    }

    checkAuthStatus() {
        return this.isAuthenticated
    }

    updateAuthStatusBack(info) {
        var {login: login, password: password, ...rest} = info
        let data = {login: login, password: password}
        this.server.send(API_Events.GET_AUTH_STATUS, data)
    }

    onGotStatus(data, meta) {
        console.log(data)
        let status = data.status
        this.isAuthenticated = status
    }

}
