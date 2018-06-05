import React from 'react'
import { Component } from 'react'
import { inject, observer } from 'mobx-react'
import ReactBootstrapSlider from 'react-bootstrap-slider'

import VolumeView from './3dView.jsx'
import CTItemPage from './2dView.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'

@inject("ct_store")
@observer
export default class CTPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      mode: true,
      components: [null, null]
    }
  }

  sliderChangeValue (value) {
    this.setState({sliderCurrentValue: value.target.value})
  }

  changeMode() {
    this.setState({mode: !this.state.mode})
  }

  render() {
    const self = this

    const nodules = []
    nodules.push([20, 98, 26, 7])
    nodules.push([44, 122, 247, 6])
    nodules.push([55, 136, 229, 7])

    if (this.props.ct_store.items === undefined) {
      return <div>Loading</div>
    }
    const item = this.props.ct_store.get('01')
    if (item === undefined) {
      return <LoadingSpinner text='Загрузка снимка' />
    }
    if (item.image === null) {
      return <LoadingSpinner text='Загрузка снимка' />
    }
    
    // this.props.ct_store.getInference('01')
    // if (item.nodules_true === null) {
    //   return <div>Making prediction</div>
    // }
    // return (
    //   <div>
    //     <VolumeView image={[...Array(256 * 256).keys()]}
    //       slice={this.state.sliderCurrentValue}
    //       key={this.state.sliderCurrentValue}/>
    //     <ReactBootstrapSlider value={this.state.sliderCurrentValue}
    //       step={this.state.sliderStep}
    //       max={this.state.sliderMax}
    //       min={this.state.sliderMin}
    //       change={this.sliderChangeValue.bind(this)}
    //     />
    //   </div>
    // )

    return (
      <div>
        <button onClick={this.changeMode.bind(this)}> {(this.state.mode) ? '3D' : '2D'} </button>
        {(!this.state.mode)
            ?
            <CTItemPage id={'01'}/>
            :
            <VolumeView id={'01'}
              image={item.image}
              shape={item.shape}
              spacing={[1.7, 1, 1]}
              nodules={nodules}/>
        }
      </div>
    )
    // return (
    //   <div>
    //     <VolumeView image={[...Array(256 * 256 * 128).keys()].map(Math.sqrt)}
    //       shape={[128, 256, 256]}
    //       spacing={[1.7, 1, 1]}
    //       nodules={nodules} />
    //   </div>
    // )
  }
}
