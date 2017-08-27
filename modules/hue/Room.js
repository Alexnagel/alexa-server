const Keywords = require('./keywords');

class Room {

  constructor(roomObj, hueApi) {
    this.hueApi = hueApi;

    this.roomId = roomObj.roomId;
    this.name = roomObj.name;
    this.lightInfo = {};
  }

  static getInfo(callback) {
    this.hueApi.get(`/groups/${this.roomId}`, (success, info) => {
      if (success) {
        callback(info);
      } else {
        callback(null);
      }
    });
  }

  getStateItem(attr, callback) {
    let state = null;
    this.getInfo((info) => {
      if (info !== null) {
        state = info.action[attr];
      }
    });

    if (state !== null) {
      callback({ success: true, name: this.name, state });
    } else {
      callback({ success: false, name: this.name });
    }
  }

  changeState(state = 'on', callback) {
    const stateData = `{"on": ${state}}`;

    this.hueApi.put(`/groups/${this.roomId}/action`, stateData, (success, info) => {
      if (success) {
        callback({ success: true, name: this.name, state: info.state });
      } else {
        callback({ success: false, name: this.name, info });
      }
    });
  }

  changeBrightness(brightnessInfo, callback) {
    const brChangeState = brightnessInfo.data.brightnessState;
    const brPercentage = brightnessInfo.data.percentage;

    let brVariation = brPercentage !== null ? brPercentage : 30;
    if (Keywords.brightnessDark.includes(brChangeState)) {
      brVariation = -brVariation;
    }

    const stateData = {
      bri_inc: brVariation,
    };

    this.hueApi.put(`/groups/${this.roomId}/action`, stateData, (success, info) => {
      if (success) {
        callback({ success: true, name: this.name, state: brightnessInfo.state });
      } else {
        callback({ success: false, name: this.name, info });
      }
    });
  }
}

module.exports = Room;
