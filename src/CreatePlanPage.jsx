import React from 'react';
import ReactDOM from 'react-dom';
import {Page, Toolbar, Icon, ToolbarButton, BackButton, Button, List, ListItem, Card, ProgressCircular, Modal} from 'react-onsenui';
import {notification} from 'onsenui';

import LocalizedStrings from 'react-localization';

import Stepper from 'react-stepper-horizontal';

import PlanView from './PlanView';
import {CenterDivStyle, ToolbarStyle, CreatePlanPageStyle} from './Styles';

export default class CreatePlanPage extends React.Component {
  constructor(props) {
    super(props);
    let lang = localStorage.getItem("lang");
    let langFile = require('public/str/langPack.json'); /* load lang pack */
    let strings = new LocalizedStrings(langFile);
    strings.setLanguage(lang);

    let days = 0;
    let schedule = JSON.parse(localStorage.getItem("flightScheduleInfo"));
    let arrivalTime = new Date(schedule.arrivalTime);
    let departureTime = new Date(schedule.departureTime);
    days = this.getAccomodationDate(arrivalTime, departureTime) + 1;

    let accomodationInfo = JSON.parse(localStorage.getItem("accomodationInfo"));
    let accomodationArr = [];
    for(let i = 0; i < days - 1; i++) {
      let day = new Date(schedule.arrivalTime);
      day.setDate(day.getDate() + i);
      for(let j = 0; j < accomodationInfo.length; j++) {
        let accomodation = accomodationInfo[j];
        let start = new Date(accomodation.scheduleInfo[0]);
        start.setHours(0, 0, 0);
        let end = new Date(accomodation.scheduleInfo[1]);
        end.setHours(0, 0, 0);
        // 0: start day, 1: end day
        if(day >= start && day < end) {
          accomodationArr.push(accomodation.hotelInfo);
          break;
        }
      }
    }

    this.state = {
      strings: strings,
      showLoading: true,
      checkedSights: JSON.parse(localStorage.getItem("checkedSights")),
      allSights: JSON.parse(localStorage.getItem("itemsAllSights" + lang)).items,
      visitList: [],
      days: days,
      schedule: schedule,
      accomodationInfo: accomodationInfo,
      accomodationArr: accomodationArr,
      plan: []
    };

    this.activeSteps = 3;
    this.startPoint = {
      name: this.state.strings.jejuairport,
      addr: this.state.strings.jejuairportaddr,
      dfrom: 0,
      lat: "33.510440",
      lng: "126.491353"
    };
    this.makePlan();
  }

  getAccomodationDate(startDate, endDate){
    let start = new Date(startDate);
    let end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    let diff = Math.abs(start - end);
    let accomodationDate = parseInt(Math.floor(diff/(1000 * 60 * 60 * 24)));

    return accomodationDate;
  }

  showMenu() {
    this.props.showMenu();
  }

  makePlan() {
    var this_ = this;
    const sleepTime = 500;
    new Promise(function(resolve, reject) {
      setTimeout(resolve, sleepTime, 1); // set some timeout to render page first
    }).then(function(result) {
      let visitList_t = this_.makeVisitList();
      let visitList = [];
      let startPoint = this_.startPoint;
      for(;;) {
        if(visitList_t.length < 1) break;
        visitList_t = this_.insertMatrix(startPoint, visitList_t); // calculate distance from airport
        // sort list based on dfrom factor.
        visitList_t.sort(function(a, b) {
          return a.dfrom - b.dfrom;
        });
        visitList.push(visitList_t[0]);
        startPoint = Object.assign({}, visitList_t[0]);
        visitList_t.splice(0, 1); // remove first one because it is already inserted.
      }

      let visitLists = this_.chunkify(visitList, this_.state.days, true); 
      // chunkify entire plan into smaller N balanced arrays (N : days)
      let start = this_.startPoint;
      let end = this_.state.accomodationArr[0];
      for(let i = 0; i < visitLists.length; i++) {
        visitLists[i].unshift(start);
        visitLists[i].push(end);
        start = end;
        if(i + 1 < this_.state.days - 1) end = this_.state.accomodationArr[i + 1];
        else end = this_.startPoint;
      }
      localStorage.setItem("plan" + this_.state.strings.getLanguage(), JSON.stringify(
        {
          schedule: this_.state.schedule,
          accomodationInfo: this_.state.accomodationInfo,
          data: visitLists
        }));

      this_.setState({
        visitList: visitList,
        plan: visitLists,
        showLoading: false
      });
    });
  }

  makeVisitList() {
    let visitList = [];
    
    for(let i = 0; i < this.state.allSights.length; i++) {
      let sight = this.state.allSights[i];
      for(let j = 0; j < this.state.checkedSights.length; j++) {
        let checked = this.state.checkedSights[j];
        if(checked == sight.contentid._text) {
          let visit = {
            name: sight.title._text,
            contentid: checked,
            contenttypeid: sight.contenttypeid._text,
            addr: sight.addr1._text,
            lat: sight.mapy._text,
            lng: sight.mapx._text,
            dfrom: 0,
            image: sight.firstimage != null ? sight.firstimage._text : "img/bkground/default.jpg"
          };
          visitList.push(visit);
          break;
        }
      }
    }
    return visitList;
  }

  insertMatrix(startPoint, visitList) {
    let ret = [];

    for(let i = 0; i < visitList.length; i++) {
      let point = {
        lat: visitList[i].lat,
        lng: visitList[i].lng
      };

      let slat = parseFloat(startPoint.lat).toFixed(6);
      let slng = parseFloat(startPoint.lng).toFixed(6);
      let dlat = parseFloat(point.lat).toFixed(6);
      let dlng = parseFloat(point.lng).toFixed(6); 
      let weight = this.distance(slat, slng, dlat, dlng);
      let tmp = Object.assign({}, visitList[i]);
      tmp.dfrom = weight;
      ret.push(tmp);
    }
    return ret;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  distance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the earth in km
    let dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
    let dLon = this.deg2rad(lng2 - lng1);
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c; // Distance in km
    return d;
  }

  chunkify(a, n, balanced) {  
    if(n < 2) return [a];

    let len = a.length;
    let out = [];
    let i = 0;
    let size = 0;

    if (len % n === 0) {
      size = Math.floor(len / n);
      while (i < len) {
        out.push(a.slice(i, i += size));
      }
    } else if (balanced) {
      while (i < len) {
        size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
      }
    } else {
      n--;
      size = Math.floor(len / n);
      if (len % size === 0)
        size--;
      while (i < size * n) {
        out.push(a.slice(i, i += size));
      }
      out.push(a.slice(size * n));
    }

    return out;
  }


  renderToolbar() {
    return (
      <Toolbar>
        <div className="left"><BackButton></BackButton></div>
        <div className="center">
          <img src={ToolbarStyle.title.imgs.logo.url} style={ToolbarStyle.title.imgs.logo.style} />
        </div>
        <div className='right'>
          <ToolbarButton onClick={this.showMenu.bind(this)}>
            <Icon size={ToolbarStyle.menu.size} icon={ToolbarStyle.menu.icon} />
          </ToolbarButton>
        </div>
     </Toolbar>
    );
  }


  render() {
    const steps = [
      {title: this.state.strings.flightinfo},
      {title: this.state.strings.hotelinfo},
      {title: this.state.strings.favoritesinfo},
      {title: this.state.strings.createdone}
    ];

    let planView = this.state.plan != null && this.state.plan.length > 0 ? (<PlanView 
      navigator={this.props.navigator}/>) : null;
    
    return (
      <Page renderToolbar={this.renderToolbar.bind(this)}
       renderModal={() => (
          <Modal
            isOpen={this.state.showLoading}>
            <div style={CreatePlanPageStyle.modal.style}>
              <h3>Loading...</h3>
              <ProgressCircular indeterminate />
            </div>
          </Modal>
        )}>
 
        <div style={CenterDivStyle}>
          <h2>{this.state.strings.createschedule}</h2>
        </div>
        <div style={CreatePlanPageStyle.step.style}>
          <Stepper steps={steps} activeStep={this.activeSteps} />
        </div>
        <Card>
          <div>
            <p>
              <Icon icon={CreatePlanPageStyle.info.icon} 
                size={CreatePlanPageStyle.info.size} 
                style={CreatePlanPageStyle.info.style} /> 
              {this.state.strings.createdonedesc}
            </p>
          </div>
        </Card>
        {planView}
      </Page>
    );
  }
}
