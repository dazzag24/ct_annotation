import React from 'react'

export default class EditableName extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      onEdit: false,
      text: this.props.text,
      id: this.props.id 
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  handleClick () {
    if (this.state.onEdit) {
      this.props.update(this.state.text, this.state.id)
    }
    this.setState({onEdit: !this.state.onEdit})
  }

  handleChange (event) {
    this.setState({text: event.target.value})
  }

  render () {
  	if (this.state.onEdit) {
    	return (
          <input type='text'
            className={this.props.inputStyle}
            value={this.props.clean ? null : this.state.text}
            onChange={this.handleChange}
            onBlur={this.handleClick}
            placeholder={this.props.placeholder}
            autoFocus />
      )
    }
    return (
      <label className={this.props.labelStyle}
        onClick={this.handleClick}>
        {this.state.text}
      </label>
    )
  }
}
