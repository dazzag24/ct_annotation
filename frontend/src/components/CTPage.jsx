import React from 'react'
import { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Icon } from 'react-fa'

import VolumeView from './3dView.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import Menu from './MenuPage.jsx'

@inject("ct_store")
@observer
export default class CTPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      pid: null
    }
    this.setPid = this.setPid.bind(this)
  }

  setPid(pid) {
    this.setState({pid: pid})
  }

  render() {
    const nodules = []
    nodules.push([20, 98, 26, 7])
    nodules.push([44, 122, 247, 6])
    nodules.push([55, 136, 229, 7])

    if (this.props.ct_store.items === undefined) {
      return <LoadingSpinner text='Соединение с сервером' />
    }

    if (this.props.ct_store.items.size == 0) {
      return <LoadingSpinner text='Соединение с сервером' />
    }

    if ( this.state.pid === null ) {
      return (
        <Menu setPid={this.setPid}/>
      )
    }
    else {
      const item = this.props.ct_store.get(this.state.pid)
      if (item === undefined) {
        return <LoadingSpinner text='Загрузка снимка' />
      }
      if (item.image === null) {
        return <LoadingSpinner text='Загрузка снимка' />
      }
      return (
        <div>
          <VolumeView image={item.image}
            shape={item.shape}
            spacing={[1.7, 1, 1]}
            nodules={nodules} />
        </div>
      )
    }
    //     <VolumeView image={[...Array(256 * 256 * 128).keys()].map(Math.sqrt)}
    //       shape={[128, 256, 256]}
    //       spacing={[1.7, 1, 1]}
    //       nodules={nodules} />
  }
}
