import React from 'react'

import './app.css'

class App extends React.Component {
  constructor(props) {
    super(props)
  }

  render = () => {
    const sidepanelComponent = this.props.sidepanel
    const contentComponent = this.props.content
    return (
      <div id="sidepanel-view">
        <div id="sidepanel">{sidepanelComponent}</div>
        <div id="content">{contentComponent}</div>
      </div>
    )
  }
}
export default App
