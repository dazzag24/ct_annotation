import { observable, autorun, computed, action, extendObservable } from 'mobx'

export default class LoginStore {
    @observable isAuthenticated = false
    @observable referTo = null
    updateAuthStatus(info) {
        var {login: login, password: password} = info
        if ((login === 'Alex') & (password === '123')) {
            console.log('setting to authenticated...')
            this.isAuthenticated = true
        }
    }

    checkAuthStatus() {
        return this.isAuthenticated
    }
}
