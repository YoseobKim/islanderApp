import React from 'react';
import ReactDOM from 'react-dom';
import {Page, Toolbar, Icon, ToolbarButton, BackButton, Button, List, ListItem, Card} from 'react-onsenui';
import {notification} from 'onsenui';

import LocalizedStrings from 'react-localization';

import Stepper from 'react-stepper-horizontal';
import Calendar from 'react-calendar';

import './CalendarStyle';

import CreateVisitListPage from './CreateVisitListPage';

export default class CreateAccomodationPlanPage extends React.Component {
  constructor(props) {
    super(props);
    let lang = localStorage.getItem("lang");
    let langFile = require('public/str/langPack.json'); /* load lang pack */
    let strings = new LocalizedStrings(langFile);
    strings.setLanguage(lang);

    let flightSchedule = JSON.parse(localStorage.getItem("flightScheduleInfo"));
    let arrivalDateTime = new Date(flightSchedule.arrivalTime);
    let departureDateTime = new Date(flightSchedule.departureTime);

    this.state = {
      arrivalDateTime: arrivalDateTime,
      departureDateTime: departureDateTime,
      strings: strings,
      nights: departureDateTime.getDate() - arrivalDateTime.getDate()
    };

    this.activeSteps = 1;
  }

  getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }

  showMenu() {
    this.props.showMenu();
  }

  changeLanguage() {
    let lang = this.state.strings.getLanguage();
    if(lang == 'kr') {
      this.state.strings.setLanguage('en');
      localStorage.setItem('lang', 'en');
    } else {
      this.state.strings.setLanguage('kr');
      localStorage.setItem('lang', 'kr');
    }
    this.setState({});
  }

  renderToolbar() {
    const imgStyle = {
      height: '15px',
      marginTop: '5%'
    };
    
    return (
      <Toolbar>
        <div className="left"><BackButton></BackButton></div>
        <div className="center">
        Islander Jeju <img src="img/milgam.png" style={imgStyle} />
        </div>
        <div className='right'>
          <ToolbarButton onClick={this.showMenu.bind(this)}>
            <Icon icon='ion-navicon, material:md-menu' />
          </ToolbarButton>
        </div>
     </Toolbar>
    );
  }

  goNext() {
    this.props.navigator.pushPage({ 
      component: CreateVisitListPage 
    });
  }

  tileStyle({ date, view }) {
    if(date >= this.state.arrivalDateTime && date <= this.state.departureDateTime) { 
      return "tile_w_bgcolor"
    }
    return null;
  }

  render() {
    const centerDiv = {textAlign: "center"};
    const infoMarkIconSize = {
      default: 30,
      material: 28
    };

    const steps = [
      {title: this.state.strings.flightinfo},
      {title: this.state.strings.hotelinfo},
      {title: this.state.strings.favoritesinfo},
      {title: this.state.strings.createdone}
    ];

    return (
      <Page renderToolbar={this.renderToolbar.bind(this)}>
        <div>
          <div style={centerDiv}>
            <h2>{this.state.strings.createschedule}</h2>
          </div>
          <div style={{padding: "1%"}}>
            <Stepper steps={steps} activeStep={this.activeSteps} />
          </div>
          <Card>
            <div>
              <p>
                <Icon icon='md-info' size={infoMarkIconSize} style={{marginRight: "10px"}} /> 
                {this.state.strings.hotelinfodesc}
              </p>
            </div>
          </Card>
          <b>{this.state.strings.yourplan}</b>
          <div style={{width: "100%", textAlign: "center"}}>
            <Calendar activeStartDate={this.state.arrivalDateTime}
              minDate={this.state.arrivalDateTime}
              maxDate={this.state.departureDateTime}
              calendarType="US" className="calendar_width_100"
              tileClassName={this.tileStyle.bind(this)}
              formatMonth={(value) => formatDate(value, 'MM')} />
          </div>
          <div style={{padding: "1%"}}>
            <Stepper steps={steps} activeStep={this.activeSteps} />
          </div>
          <Button style={{width: "80%", margin: "10%", textAlign: "center"}} onClick={this.goNext.bind(this)}>
            {this.state.strings.gonext}
          </Button>          
        </div>
      </Page>
    );
  }
}
