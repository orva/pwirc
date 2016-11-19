const React = require('react')
const R = require('ramda')

const Sidepanel = ({ children }) =>
  <div className="sidepanel">
    {children}
  </div>

const SidepanelClose = ({ onClick }) =>
  <div className="sidepanel-close" onClick={onClick}>
    <i className="sidepanel-close-glyph fa fa-times-circle"></i>
  </div>

const SidepanelScroll = ({ children }) =>
  <div className="sidepanel-scrollable">
   {children}
  </div>

const SidepanelHeader = ({ children }) =>
  <h4 className="sidepanel-header">
    {children}
  </h4>

const SidepanelOptions = ({ children }) =>
  <div className="sidepanel-options">
    {React.Children.map(children, child => {
      const optionLinkCls = 'sidepanel-options-link'
      const classes = child.props.className

      if (classes && R.contains(optionLinkCls, classes)) {
        return child
      }

      const newClasses = classes ? classes + ' ' + optionLinkCls : optionLinkCls
      return React.cloneElement(child, { className: newClasses })
    })}
  </div>


module.exports = {
  Sidepanel,
  SidepanelClose,
  SidepanelHeader,
  SidepanelScroll,
  SidepanelOptions
}
