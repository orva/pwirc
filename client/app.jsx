import React from 'react'

import './app.css'

export default class App extends React.Component {
  constructor(props) {
    super(props)
  }

  render = () => {
    const sidepanelComponent = this.props.sidepanel
    const contentComponent = this.props.content
    const joinComponent = this.props.join
    return (
      <div id="sidepanel-view">
        <div id="sidepanel">{sidepanelComponent}</div>
        <div id="content">{contentComponent}</div>
        <div id="popups">
          {joinComponent}
        </div>
      </div>
    )
  }
}
