import React from 'react';
import ReactDOM from 'react-dom';
import {Page, Toolbar, Icon, ToolbarButton, BackButton, Button, List, ListItem, Card, ProgressCircular, Modal, Carousel, CarouselItem} from 'react-onsenui';
import {notification} from 'onsenui';

import LocalizedStrings from 'react-localization';
import Timeline from 'react-image-timeline';
require('react-image-timeline/dist/timeline.css');
require('./CustomTimeLineStyle.css');

import TMapPage from './TMapPage';
import MapContainer from './MapContainer';
import Marker from './Marker';

const CustomLabel = (props) => {
  return null;
};

const CustomFooter = (props) => {
  let {index, strings, onClicked} = props.event;
  const iconSize = {
    default: 32,
    material: 40
  };

  if(index == 0) return null;
  return (<Button modifier="large" onClick={onClicked}>
    <Icon size={iconSize} icon="ion-map" /> {strings.navigate}
  </Button>);
};

export default class PlanView extends React.Component {
  constructor(props) {
    super(props);
    let lang = localStorage.getItem("lang");
    let langFile = require('public/str/langPack.json'); /* load lang pack */
    let strings = new LocalizedStrings(langFile);
    strings.setLanguage(lang);

    let localStoragePlan = JSON.parse(localStorage.getItem("plan" + lang));

    let plan = localStoragePlan.data;
    let schedule = localStoragePlan.schedule;
    let days = 0;
    let arrivalTime = new Date(schedule.arrivalTime);
    let departureTime = new Date(schedule.departureTime);
    days = departureTime.getDate() - arrivalTime.getDate() + 1;

    let accomodationInfo = localStoragePlan.accomodationInfo;
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
   
    let maxLen = 0;
    let timeline = [];

    for(let i = 0; i < plan.length; i++) {
      let planForDay = plan[i];
      if(planForDay.length > maxLen) maxLen = planForDay.length;
      let dateTime = new Date(schedule.arrivalTime);
      dateTime.setDate(arrivalTime.getDate() + i);
      dateTime.setHours(0);
      let timeline_sub = [];
      let prev = {};

      for(let j = 0; j < planForDay.length; j++) {
        dateTime.setHours(j + 1);
        let place = planForDay[j];
        let singleEvent = {};
        if((j == 0 && i == 0) || (j == planForDay.length - 1 && i == plan.length - 1)) {
          singleEvent = {
            index: j,
            date: new Date(dateTime.getTime()),
            text: strings.airportdesc + "\n" + place.addr,
            title: place.name,
            imageUrl: "img/airport-bg.jpg",
            strings: strings,
            lat: place.lat,
            lng: place.lng,
            onClicked: this.onNavClicked.bind(this, place, prev)
          };
        } else if(j == planForDay.length - 1 || j == 0) {
          let desc = strings.hoteldesc.replace("HOTELNAME", place.name);
          singleEvent = {
            index: j,
            date: new Date(dateTime.getTime()),
            text: desc,
            title: place.name,
            imageUrl: "img/hotel-bg.jpg",
            strings: strings,
            lat: place.lat,
            lng: place.lng,
            onClicked: this.onNavClicked.bind(this, place, prev)
          };
        } else {
          singleEvent = {
            index: j,
            date: new Date(dateTime.getTime()),
            text: place.addr,
            title: place.name,
            imageUrl: place.image,
            strings: strings,
            lat: place.lat,
            lng: place.lng,
            onClicked: this.onNavClicked.bind(this, place, prev)
          };
        }
        timeline_sub.push(singleEvent);
        prev = singleEvent;
      }
      timeline.push(timeline_sub);
    }

    this.state = {
      plan: plan,
      strings: strings,
      schedule: schedule,
      accomodationArr: accomodationArr,
      days: days,
      itemCarouselIndex: 0,
      numOfItems: plan.length,
      additionalInfo: plan[0],
      maxLen: maxLen,
      timeline: timeline
    }
    this.overScrolled = false;

    var this_ = this;
    const sleepTime = 1500;
    new Promise(function(resolve, reject) {
      setTimeout(resolve, sleepTime, 1); // set some timeout to render page first
    }).then(function(result) {
      this_.setState({});
    });
  }

  componentDidUpdate(prevProps) {
    let lang = localStorage.getItem("lang");
    if(this.state.strings.getLanguage() != lang) {
      this.state.strings.setLanguage(lang);
      this.setState({});
    }
  }

  onNavClicked(current, prev) {
    localStorage.setItem("tmapLatLng", JSON.stringify({
      prev: {lat: prev.lat, lng: prev.lng, title: prev.title},
      target: {lat: current.lat, lng: current.lng, title: current.name}
    }));
    this.props.navigator.pushPage({ 
      component: TMapPage 
    });
  }

  prevItem() {
    let change = this.state.itemCarouselIndex - 1 < 0 ?
      this.state.numOfItems - 1 :
      this.state.itemCarouselIndex - 1;

    let additionalInfo = this.state.plan[change];
    this.setState({itemCarouselIndex: change, additionalInfo: additionalInfo});
  }

  nextItem() {
    let change = this.state.itemCarouselIndex + 1 > this.state.numOfItems - 1 ?
      0 :
      this.state.itemCarouselIndex + 1;

    let additionalInfo = this.state.plan[change];
    this.setState({itemCarouselIndex: change, additionalInfo: additionalInfo});
  }

  handleCourseChange(e) {
    if(this.overScrolled) {
      this.overScrolled = false;
      this.setState({});
      return;
    }
    let additionalInfo = this.state.plan[e.activeIndex];
    this.setState({itemCarouselIndex: e.activeIndex, additionalInfo: additionalInfo}); 
  }

  overScroll() {
    this.overScrolled = true;

    if(this.state.itemCarouselIndex == this.state.numOfItems - 1) {
      // reached to the end
      this.nextItem();
    } else {
      // reached to the first
      this.prevItem();
    }
  }

  markerClicked(e, id) {
  } 

  drawSingleMarker(lat, lng, color, zIndex, id, text, textColor) {
    let markerKey = "marker-" + id;
    return (<Marker key = {markerKey} 
             position={{lat: lat, lng: lng}} color={color} zIndex={zIndex} id={id}
             onClick={this.markerClicked.bind(this)} text={text} textColor={textColor}/>);
  }
 
  render() {
    let accomodationStrings = [];
    for(let i = 0; i < this.state.accomodationArr.length; i++) {
      let title = "Day " + (i + 1) + " : ";
      let accomodation = this.state.accomodationArr[i];
      let string = title + accomodation.name
      accomodationStrings.push(string); 
    }

    let fullWidth = window.innerWidth + "px";
    let carousel = (
      <Carousel style={{width: fullWidth}}
        onPostChange={this.handleCourseChange.bind(this)}
        onOverscroll={this.overScroll.bind(this)}
        index={this.state.itemCarouselIndex}
        autoScrollRatio={0.3}
        autoScroll overscrollable swipeable>
        {this.state.plan.map((item, index) => (
          <CarouselItem key={"carousel-" + index}>
            <Card>
              <h3>{"Day " + (index + 1)}</h3>
              {item.map((item, index)=> (
                <li key={"cli-" + index}>{item.name}</li>
              ))}
            </Card>
          </CarouselItem> 
        ))}
      </Carousel>
    );
 
    const mapCenter = {
      lat: 33.356432,
      lng: 126.5268767
    };

    const mapZoom = 9;
    const marginTopForArrow = "80px";
    const grayColor = "#D3D3D3";
    const goldColor = "#FFD700";
    const starIconSize = {
      default: 30,
      material: 28
    };
    
    const markerGray = '686868';
    const markerDotGray = 'D3D3D3';
    const markerRed = 'EA4335';
    const markerDotRed = '721411';
    let additionalInfo = this.state.additionalInfo;
    let markers = [];
    if(additionalInfo.length > 0) {
      for(let i = 0; i < this.state.maxLen; i++) {
        // TODO cannot figure out why this line is needed.
        // If this line is not present here, marker fails to draw with below error.
        // The node to be removed is not a child of this node.
        // Caused by different length of marker array but actually it should work.
        // But as I cannot fix it and I don't know root cause of this problem
        // I leave this code to avoid bug.
        if(i >= additionalInfo.length) {
          let last = additionalInfo[additionalInfo.length - 1];
          marker = this.drawSingleMarker(last.lat, last.lng, markerRed, i, i, i.toString(), markerDotRed);
          markers.push(marker);
          continue;
        }
 
        let info = additionalInfo[i];
        let lng = "" + info.lng; // lng lat should be string
        let lat = "" + info.lat;
        let marker = null;
        if(i == 0 || i == additionalInfo.length - 1) 
          marker = this.drawSingleMarker(lat, lng, markerRed, i, i, (i + 1).toString(), markerDotRed);
        else
          marker = this.drawSingleMarker(lat, lng, markerGray, i, i, (i + 1).toString(), markerDotGray);
        markers.push(marker);
      }
    }

    let map = (
      <MapContainer initialCenter={mapCenter} zoom={mapZoom}
        width="100vw" height = "30vh" drawLine = {true}>
        {markers}
      </MapContainer>
    );
 
    return (
      <div style={{width: "100%"}}>
        <Card>
          <div>
            <h3>{this.state.strings.flightschedule} <Icon icon='plane' style={{color: '#00CED1'}}/></h3>
            <li>
              {this.state.strings.arrivaltime + " : " + this.state.schedule.arrivalTime}
            </li>
            <li>
              {this.state.strings.departuretime + " : " + this.state.schedule.departureTime}
            </li>
            <li>
              <b>{this.state.days - 1 + " " + this.state.strings.nights + " " + 
                this.state.days + " " + this.state.strings.days}
              </b>
            </li>
          </div>
        </Card>
        <Card>
          <div>
            <h3>{this.state.strings.accomodationschedule} <Icon icon='hotel' style={{color: '#FF8C00'}}/></h3>
            {accomodationStrings.map((item, index) => (<li key={"hli-" + index}>{item}</li>))}
          </div>
        </Card>
        <h3 style={{marginLeft: "3%"}}>{this.state.strings.entireplan}</h3>
        {map}
        <p style={{marginLeft: "3%"}}>{this.state.strings.swipemoredetail}</p>
        {carousel}
        <Timeline events={this.state.timeline[this.state.itemCarouselIndex]} 
          customStartLabel={CustomLabel} customEndLabel={CustomLabel}
          customFooter={CustomFooter}/>
      </div>
    )
  }
}

PlanView.propTypes = {
  navigator: React.PropTypes.object
}
