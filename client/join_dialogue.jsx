import React from 'react'

export default class JoinDialogue extends React.Component {
  constructor(props) {
    super(props)
  }

  render = () => {
    return (
      <div id="join-dialogue">
        <input type="text" id="join-dialogue-server"></input>
        <input type="text" id="join-dialogue-channel"></input>
        <button type="button" onClick={this.handleJoinClick}></button>
      </div>
    )
  }

  handleJoinClick = () => {
    // this.props.sock.send()
  }
}
