import React from 'react'
import Popup from 'react-popup'

import Messages from './messages.jsx'
import Channels from './channels.jsx'

import './app.css'

export default class App extends React.Component {
  constructor(props) {
    super(props)
  }

  openPopup = (title, content) => {
    Popup.create({
      title: title,
      content: content
    })
  }

  render = () => {
    const content = React.createElement(Messages, { sock: this.props.sock })
    const sidepanel = React.createElement(Channels, {
      sock: this.props.sock,
      openPopup: this.openPopup
    })

    return (
      <div id="sidepanel-view">
        <div id="sidepanel">{sidepanel}</div>
        <div id="content">{content}</div>
        <Popup closeBtn={false}/>
      </div>
    )
  }
}
