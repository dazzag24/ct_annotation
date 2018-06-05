import React from 'react'
import { Component } from 'react'
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom'
import { Provider } from 'mobx-react'

import { ecg_store, ct_store, store_3d, store_2d } from '../stores/stores'
import CTPage from './CTPage.jsx'
import CTItemPage from './CTItemPage.jsx'


export default class App extends Component {
  componentDidCatch(error, info) {
  }

  render() {
    return (
    <Provider ecg_store={ecg_store} ct_store={ct_store} store_3d={store_3d} store_2d={store_2d}>
        <Router>
        <div>
            <Switch>
                <Route exact path="/" component={CTPage} />
                <Route path="/:id" component={CTItemPage} />
            </Switch>
        </div>
        </Router>
    </Provider>
    )
  }
}
