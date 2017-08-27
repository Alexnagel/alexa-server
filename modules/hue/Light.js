const Keywords = require('./keywords');

class Light {

  constructor(lightObject, hueAPI) {
    this.hueApi = hueAPI;

    this.lightId = lightObject.lightId;
    this.name = lightObject.name;
  }

  static getInfo(callback) {
    this.hueApi.get(`/lights/${this.lightId}`, (success, info) => {
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
        state = info.state[attr];
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

    this.hueApi.put(`/lights/${this.lightId}/state`, stateData, (success, info) => {
      if (success) {
        callback({ success: true, name: this.name, state });
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

    this.hueApi.put(`/lights/${this.lightId}/state`, stateData, (success, info) => {
      if (success) {
        callback({ success: true, name: this.name, state: brightnessInfo.state });
      } else {
        callback({ success: false, name: this.name, info });
      }
    });
  }
}

module.exports = Light;
