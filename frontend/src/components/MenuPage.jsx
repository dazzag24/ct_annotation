import React from 'react'
import { Component } from 'react'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { values } from 'mobx'

import Dnd from './DragDrop.jsx'

function makeItem( name, pid, setPid ) {
  return (
    {
      id: name.toString(),
      content: (<span className='item-container'>
               <span className='item-name'>{`Пациент ${name}`}</span>
               <Icon name='eye' onClick={() => setPid(pid)} className='item-icon'></Icon>
              </span>)
    }
  )
}

@inject("ct_store")
@observer
export default class Menu extends Component {
  constructor (props) {
    super(props)
    this.state = {
      content: [values(this.props.ct_store.items).map((item, index) => makeItem(index, item.id, this.props.setPid)), []],
      folders: ['Новые', 'В работе'],
      comments: Array(this.props.ct_store.items.size).fill("Добавить комментарий"),
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
  }
}
