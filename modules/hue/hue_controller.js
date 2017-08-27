const HueAPI = require('./hue_api');

class HueController {

  constructor() {
    this.hue_api = new HueAPI();
  }

  static createLightObject(lightId, fullObject) {
    return {
      id: lightId,
      state: fullObject.state,
      name: fullObject.name,
      uid: fullObject.uniqueid,
    };
  }

  static lightArrFromDict(lightDict, predicate = false) {
    let lightArr = [];

    const lightIds = Object.keys(lightDict);
    lightIds.forEach((lightId) => {
      const lightObj = HueController.createLightObject(lightId, lightDict[lightId]);
      lightArr.push(lightObj);
    });

    if (predicate) {
      lightArr = lightArr.filter(predicate);
    }

    return lightArr;
  }

  getLights(callback) {
    this.hue_api.get('/lights', (error, response, data) => {
      const jsonData = JSON.parse(data);
      callback(HueController.lightArrFromDict(jsonData));
    });
  }

  getLightsState(lightState, callback) {
    this.hue_api.get('/lights', (error, response, data) => {
      const jsonData = JSON.parse(data);
      callback(HueController.lightArrFromDict(jsonData, (item) => {
        if (item.state.on === lightState) {
          return true;
        }
        return false;
      }));
    });
  }

  lightStateChange(lightId, changeInfo, callback) {
    const stateData = `{"on": ${(changeInfo.state === 'on')}}`;

    this.hue_api.put(`/lights/${lightId}/state`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          const response = {
            success: true,
            name: changeInfo.name,
            state: changeInfo.state,
          };

          callback(response);
        } else {
          callback({ success: false, name: changeInfo.name, info: JSON.stringify(data[0].error) });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }

  lightBrightnessChange(lightId, changeInfo, callback) {
    const brState = changeInfo.data.brightnessState;
    const brPercent = changeInfo.data.percentage;

    let brightnessIncrease = 30;
    if (brPercent !== null) {
      brightnessIncrease = brPercent;
    }

    if (['dimmer', 'dim', 'darker'].includes(brState)) {
      brightnessIncrease = -brightnessIncrease;
    }

    const stateData = {
      bri_inc: brightnessIncrease,
    };

    this.hue_api.put(`/lights/${lightId}/state`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          const response = {
            success: true,
            name: changeInfo.name,
            state: changeInfo.state,
          };

          callback(response);
        } else {
          callback({
            success: false,
            name: changeInfo.name,
            info: JSON.stringify(data[0].error),
          });
        }
      } else {
        callback({
          success: false,
          name: changeInfo.name,
          info: 'Failed',
        });
      }
    });
  }
}

module.exports = new HueController();
