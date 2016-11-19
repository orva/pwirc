const React = require('react')
const R = require('ramda')

const Sidepanel = ({ children }) => // eslint-disable-line no-unused-vars
  <div className="sidepanel">
    {children}
  </div>

const SidepanelClose = ({ onClick }) =>  // eslint-disable-line no-unused-vars
  <div className="sidepanel-close" onClick={onClick}>
    <i className="sidepanel-close-glyph fa fa-times-circle"></i>
  </div>

const SidepanelHeader = ({ children }) => // eslint-disable-line no-unused-vars
  <h4 className="sidepanel-header">
    {children}
  </h4>

const SidepanelOptions = ({ children }) => // eslint-disable-line no-unused-vars
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
  SidepanelOptions
}
