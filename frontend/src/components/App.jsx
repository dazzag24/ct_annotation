import React from 'react'
import { Component } from 'react'
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom'
import { Provider } from 'mobx-react'

import { ecg_store, ct_store, store_3d, store_2d, lstore } from '../stores/stores'
import CTPage from './CTPage.jsx'
import CTItemPage from './CTItemPage.jsx'
import Privatize from './Privatize.jsx'
import LoginPage from './LoginPage.jsx'


export default class App extends Component {
  componentDidCatch(error, info) {
  }

  render() {
    return (
    <Provider ecg_store={ecg_store} ct_store={ct_store} store_3d={store_3d}
              store_2d={store_2d} lstore={lstore}>
        <Router>
        <div>
            <Switch>
                <Route path='/login' component={LoginPage}/>
                <Route exact path="/" render={
                    () => <Privatize component={CTPage}/>
                }/>
                <Route path="/:id" render={
                    () => <Privatize component={CTItemPage}/>
                }/>
            </Switch>
        </div>
        </Router>
    </Provider>
    )
  }
}
