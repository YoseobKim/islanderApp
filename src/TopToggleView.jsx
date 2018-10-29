import React from 'react';
import ReactDOM from 'react-dom';
import {Button, Segment} from 'react-onsenui';

import {TopToggleViewStyle} from './Styles';

export default class TopToggleView extends React.Component {
  constructor(props) { 
    super(props);
  }

  onButtonAllClicked() {
    this.props.onPostChange(0);
  }

  onButtonSeoguipoClicked() {
    this.props.onPostChange(1);
  }

  onButtonJejuClicked() {
    this.props.onPostChange(2);
  }

  render() {
    const innerDiv = {
      margin: '1%'
    };

    return (
      <div style={TopToggleViewStyle.innerDiv.style}>
        <Segment index={this.props.segmentIndex} tabberId="tabber" 
          style={TopToggleViewStyle.segment.style}>
          <Button onClick={this.onButtonAllClicked.bind(this)}>{this.props.strings.all}</Button>
          <Button onClick={this.onButtonSeoguipoClicked.bind(this)}>{this.props.strings.seoguipo}</Button>
          <Button onClick={this.onButtonJejuClicked.bind(this)}>{this.props.strings.jeju}</Button>
        </Segment>
      </div>);
  }
}

TopToggleView.propTypes = {
  index: React.PropTypes.number,
  strings: React.PropTypes.object,
  onPostChange: React.PropTypes.func
}
