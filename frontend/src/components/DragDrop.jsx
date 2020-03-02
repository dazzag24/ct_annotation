import React, { Component } from 'react'
import {Button} from 'react-bootstrap'
import { Icon } from 'react-fa'
import { inject, observer } from 'mobx-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import EditableName from './EditInline.jsx'

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source)
  const destClone = Array.from(destination)
  const [removed] = sourceClone.splice(droppableSource.index, 1)
  destClone.splice(droppableDestination.index, 0, removed)
  return [sourceClone, destClone]
}

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,
    fontSize: '0.8rem',

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : '#707070',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : '#A0A0A0',
    padding: 8,
    width: '10rem',
    margin: '0.1rem',
    fontSize: '0.8rem',
});

@inject("ct_store")
@observer
export default class Dnd extends Component {
  constructor(props){
    super(props)
    this.state = {
      content: this.props.content,
      folders: this.props.folders,
      comments: this.props.comments
    }
    this.onDragEnd = this.onDragEnd.bind(this)
  }

  getList(id) {
    return this.state.content[id]
  }

  onDragEnd(result) {
    const { source, destination } = result
    // dropped outside the list
    if (!destination) {
      return
    }
    let content
    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        this.getList(parseInt(source.droppableId)),
        source.index,
        destination.index
      )
      content = this.state.content
      content[parseInt(source.droppableId)] = items
      this.setState(content: content)
    } else {
      const result = move(
        this.getList(parseInt(source.droppableId)),
        this.getList(parseInt(destination.droppableId)),
        source,
        destination
      )
      content = this.state.content
      content[parseInt(source.droppableId)] = result[0]
      content[parseInt(destination.droppableId)] = result[1]
      this.setState(content: content)
    }
    this.props.ct_store.updateList(this.state.folders,
      content, this.state.comments)
  }

  render() {
    return (
      <div className='dnd-page'>
        <DragDropContext onDragEnd={this.onDragEnd}>
          {this.state.content.map((content, contentIndex) =>
            <Droppable droppableId={contentIndex.toString()}
              key={contentIndex.toString()}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  style={getListStyle(snapshot.isDraggingOver)}>
                  <span className='folder-name'>
                  <EditableName 
                    text={this.state.folders[contentIndex]}
                    inputStyle='edit-input'
                    labelStyle='edit-label'
                    key={this.props.folderNameNeedsUpdate.toString() + '_' + contentIndex}
                    id={contentIndex}
                    update={this.props.updateFolderName}
                    placeholder={'Новый список'}
                   />
                  {(contentIndex > 0) ?
                    <Icon name='trash' className='trash' onClick={() => this.props.removeFolder(contentIndex)}></Icon>
                    : null}
                  </span>
                  {content.map((item, index) => (
                    <Draggable
                      key={item.pid}
                      draggableId={item.pid}
                      index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps.style
                          )}>
                          {item.content}
                          <EditableName 
                            text={this.state.comments[item.pid]}
                            inputStyle='comment-input'
                            labelStyle='comment-label'
                            key={this.props.commentNeedsUpdate.toString() + '_' + item.pid}
                            id={item.pid}
                            update={this.props.updateComments}
                            placeholder={'Добавить комментарий'}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </DragDropContext>
      </div>
    )
  }
}
