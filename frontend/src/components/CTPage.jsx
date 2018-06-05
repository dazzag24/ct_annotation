import React from 'react'
import { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Button } from 'react-bootstrap'
import { Icon } from 'react-fa'
import ReactBootstrapSlider from 'react-bootstrap-slider'

import VolumeView from './3dView.jsx'
import LoadingSpinner from './LoadingSpinner.jsx'
import Dnd from './dnd.jsx'

const getItems = (count, offset = 0) =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `${k + offset}`,
        // content: `item ${k + offset}`
        content: (<span className='item-container'>
                   <span className='item-name'>{`Пациент ${k + offset}`}</span>
                   <Icon name='eye' className='item-icon'></Icon>
                  </span>)
    }));

@inject("ct_store")
@observer
export default class CTPage extends Component {
  constructor (props) {
    super(props)
    this.state = {
      content: [getItems(6), getItems(4, 6), getItems(1, 10)],
      folders: ['Новые', 'В работе', 'Подтвердить'],
      comments: Array(11).fill("Добавить комментарий"),
      commentNeedsUpdate: 0,
      folderNameNeedsUpdate: 0
    }
    this.updateFolderName = this.updateFolderName.bind(this)
    this.updateComments = this.updateComments.bind(this)
    this.removeFolder = this.removeFolder.bind(this)
    this.newFolder = this.newFolder.bind(this)
  }

  updateFolderName(text, id) {
    let folders = this.state.folders
    if (text.length > 0) {
      folders[id] = text
    }
    this.setState({
      folders: folders,
      folderNameNeedsUpdate: (this.state.folderNameNeedsUpdate + 1) % 2
    })
  }

  updateComments(text, pid) {
    let comments = this.state.comments
    if (text.length === 0) {
      comments[parseInt(pid)] = "Добавить комментарий"
    }
    else {
      comments[parseInt(pid)] = text
    }
    this.setState({
        comments: comments,
        commentNeedsUpdate: (this.state.commentNeedsUpdate + 1) % 2
    })
  }

  removeFolder(id) {
    var folders = this.state.folders
    folders.splice(id, 1)
    var content = this.state.content
    let items = content[id]
    content[0] = content[0].concat(items)
    content.splice(id, 1)
    this.setState({folders: folders, content: content})
  }

  newFolder() {
    let folders = this.state.folders
    folders.push('Новый список')
    let content = this.state.content
    content.push([])
    this.setState({folders: folders, content: content})
  }

  render() {
    // const self = this

    const nodules = []
    nodules.push([20, 98, 26, 7])
    nodules.push([44, 122, 247, 6])
    nodules.push([55, 136, 229, 7])

    // const content = [getItems(10), getItems(5, 10), getItems(4, 15), getItems(6, 19)]
    // const folders = ['folder0', 'folder1', 'folder2', 'folder3']

    // if (this.props.ct_store.items === undefined) {
    //   return <div>Loading</div>
    // }
    // const item = this.props.ct_store.get('01')
    // if (item === undefined) {
    //   return <LoadingSpinner text='Загрузка снимка' />
    // }
    // if (item.image === null) {
    //   return <LoadingSpinner text='Загрузка снимка' />
    // }
    // return (
    //   <div>
    //     <VolumeView image={item.image}
    //       shape={item.shape}
    //       spacing={[1.7, 1, 1]}
    //       nodules={nodules}/>
    //   </div>
    // )

    return (
      <div>
        <div className='header'>Мои списки исследований</div>
        <div className='dnd'>
          <Dnd content={this.state.content}
            folders={this.state.folders}
            comments={this.state.comments}
            updateFolderName={this.updateFolderName}
            updateComments={this.updateComments}
            removeFolder={this.removeFolder}
            folderNameNeedsUpdate={this.state.folderNameNeedsUpdate}
            commentNeedsUpdate={this.state.commentNeedsUpdate}/>
        <div className='add-folder'>
          <i className="material-icons new-folder-icon" onClick={this.newFolder}>add</i>
        </div>
        </div>
      </div>
    )

    // <i class="mdi mdi-bell"></i>
    // <MIcon name='add' className='new-folder-icon'
    //         onClick={this.newFolder} />
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
