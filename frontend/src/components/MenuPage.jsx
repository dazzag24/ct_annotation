import React from 'react'
import { Component } from 'react'
import { Button } from 'react-bootstrap'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { values } from 'mobx'

import Dnd from './DragDrop.jsx'

const defaultFolderName = 'Новый список'

function makeItem( name, pid, setPid ) {
  return (
    {
      name: name.toString(),
      pid: pid,
      content: (<span className='item-container'>
               <span className='item-name'>{`Пациент ${name}`}</span>
               <Icon name='eye' onClick={() => setPid(pid)} className='item-icon'></Icon>
              </span>)
    }
  )
}

function makeContent( order, setPid ) {
  let content = []
  let name = 0
  for (var i = 0; i < order.length; i++) {
    let group = []
    for (var j = 0; j < order[i].length; j++) {
      let item = order[i][j]
      group.push(makeItem(name, order[i][j], setPid))
      name += 1
    }
    content.push(group)
  }
  return content
}

@inject("ct_store")
@observer
export default class Menu extends Component {
  constructor (props) {
    super(props)
    this.state = {
      content: makeContent(this.props.ct_store.folders.order, this.props.setPid),
      folders: this.props.ct_store.folders.folderNames,
      comments: this.props.ct_store.folders.comments,
      commentNeedsUpdate: 0,
      folderNameNeedsUpdate: 0,
      showLogin: false
    }
    this.updateFolderName = this.updateFolderName.bind(this)
    this.updateComments = this.updateComments.bind(this)
    this.removeFolder = this.removeFolder.bind(this)
    this.newFolder = this.newFolder.bind(this)
    this.handleUser = this.handleUser.bind(this)
  }

  updateFolderName(text, id) {
    let folders = this.state.folders
    folders[id] = (text.length === 0) ? defaultFolderName : text
    this.setState({
      folders: folders,
      folderNameNeedsUpdate: (this.state.folderNameNeedsUpdate + 1) % 2
    })
    this.props.ct_store.updateList(folders,
      this.state.content, this.state.comments)
  }

  updateComments(text, pid) {
    let comments = this.state.comments
    comments[pid] = text
    this.setState({
        comments: comments,
        commentNeedsUpdate: (this.state.commentNeedsUpdate + 1) % 2
    })
    this.props.ct_store.updateList(this.state.folders,
      this.state.content, comments)
  }

  removeFolder(id) {
    var folders = this.state.folders
    folders.splice(id, 1)
    var content = this.state.content
    let items = content[id]
    content[0] = content[0].concat(items)
    content.splice(id, 1)
    this.setState({
      folders: folders,
      content: content,
      folderNameNeedsUpdate: (this.state.folderNameNeedsUpdate + 1) % 2
    })
    this.props.ct_store.updateList(folders,
      content, this.state.comments)
  }

  newFolder() {
    let folders = this.state.folders
    folders.push(defaultFolderName)
    let content = this.state.content
    content.push([])
    this.setState({
      folders: folders,
      content: content,
      folderNameNeedsUpdate: (this.state.folderNameNeedsUpdate + 1) % 2
    })
    this.props.ct_store.updateList(folders,
      content, this.state.comments)
  }

  handleUser () {
    this.setState({showLogin: !this.state.showLogin})
  }

  loginBox() {
    return (
      <div className='login-box'>
        <span className='name'>Васильев И.Н.</span>
        <br />
        <Button className='change-account'>Сменить аккаунт</Button>
        <Button className='exit-account'>Выйти</Button>
      </div>
    )
  }

  render() {
    return (
      <div>
        <div className='menu-header'>Мои списки исследований</div>
        <div className='user'>
          <span className='user-name'></span>
          <Icon name='user-circle' onClick={this.handleUser}></Icon>         
        </div>
        {this.state.showLogin ? this.loginBox() : null}
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
