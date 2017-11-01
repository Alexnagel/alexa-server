const HueAPI = require('./hue_api');

class HueController {

  constructor() {
    this.hue_api = new HueAPI();

    this.colours = {
      red: [100, 0, 0],
      blue: [0, 0, 100],
      green: [0, 100, 0],
    };

    this.scenes = {
      read: '31rz8UHzTxVmQnn',
      sunset: 'aqAAoite94gxUHb',
    };
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

  static createGroupObject(groupId, fullObject) {
    return {
      id: groupId,
      name: fullObject.name,
      class: fullObject.class,
      state: {
        anyOn: fullObject.state.any_on,
        allOn: fullObject.state.all_on,
      },
    };
  }

  static groupArrFromDict(groupDict, predicate = false) {
    let groupArr = [];

    const groupIds = Object.keys(groupDict);
    groupIds.forEach((groupId) => {
      const groupObj = HueController.createGroupObject(groupId, groupDict[groupId]);
      groupArr.push(groupObj);
    });

    if (predicate) {
      groupArr = groupArr.filter(predicate);
    }

    return groupArr;
  }

  static rgbToCie(red, green, blue) {
    // Apply a gamma correction to the RGB values,
    // which makes the color more vivid and more the like the color
    // displayed on the screen of your device
    const cRed = (red > 0.04045) ? ((red + 0.055) / (1.0 + 0.055)) ** 2.4 : (red / 12.92);
    const cGreen = (green > 0.04045) ? ((green + 0.055) / (1.0 + 0.055)) ** 2.4 : (green / 12.92);
    const cBlue = (blue > 0.04045) ? ((blue + 0.055) / (1.0 + 0.055)) ** 2.4 : (blue / 12.92);

    // RGB values to XYZ using the Wide RGB D65 conversion formula
    const X = (cRed * 0.664511) + (cGreen * 0.154324) + (cBlue * 0.162028);
    const Y = (cRed * 0.283881) + (cGreen * 0.668433) + (cBlue * 0.047685);
    const Z = (cRed * 0.000088) + (cGreen * 0.072310) + (cBlue * 0.986039);

    // Calculate the xy values from the XYZ values
    let x = (X / (X + Y + Z)).toFixed(4);
    let y = (Y / (X + Y + Z)).toFixed(4);

    if (isNaN(x)) {
      x = 0;
    }

    if (isNaN(y)) {
      y = 0;
    }

    return [+x, +y];
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
    const stateData = { on: (changeInfo.state === 'on') };

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
          callback({ success: false, name: changeInfo.name, info: jsonData[0].error.description });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }

  lightBrightnessChange(lightId, changeInfo, callback) {
    const brState = changeInfo.brightnessState;
    const brPercent = changeInfo.hueBrightness;

    let brightnessIncrease = 30;
    if (brPercent !== null) {
      brightnessIncrease = brPercent;
    }

    let brString = 'brightened';
    if (['dimmer', 'dim', 'darker'].includes(brState)) {
      brightnessIncrease = -brightnessIncrease;
      brString = 'dimmed';
    }

    let stateData = {};
    if (brState !== undefined) {
      stateData = {
        bri_inc: brightnessIncrease,
      };
    } else {
      stateData = {
        bri: brightnessIncrease,
      };
    }

    this.hue_api.put(`/lights/${lightId}/state`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          let changeResponse = `has been ${brString}`;
          if (brState === undefined) {
            changeResponse = `has been set to ${Math.ceil(brightnessIncrease / 2.54)} percent`;
          }

          const response = {
            success: true,
            name: changeInfo.name,
            response: changeResponse,
          };

          callback(response);
        } else {
          callback({
            success: false,
            name: changeInfo.name,
            info: jsonData[0].error.description,
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

  lightColourChange(lightId, changeInfo, callback) {
    const colour = changeInfo.colour;
    const rgb = this.colours[colour];
    const xy = HueController.rgbToCie(rgb[0], rgb[1], rgb[2]);

    const stateData = { xy };

    this.hue_api.put(`/lights/${lightId}/state`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          const response = {
            success: true,
            name: changeInfo.name,
            colour,
          };

          callback(response);
        } else {
          callback({ success: false, name: changeInfo.name, info: jsonData[0].error.description });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }

  getGroups(callback) {
    this.hue_api.get('/groups',
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      callback(HueController.groupArrFromDict(jsonData));
    });
  }

  getGroupsState(groupState, callback) {
    this.hue_api.get('/groups',
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      callback(HueController.groupArrFromDict(jsonData, (item) => {
        if (item.state.anyOn === groupState) {
          return true;
        }
        return false;
      }));
    });
  }

  groupStateChange(groupId, changeInfo, callback) {
    const stateData = { on: (changeInfo.state === 'on') };

    this.hue_api.put(`/groups/${groupId}/action`, stateData,
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
          callback({ success: false, name: changeInfo.name, info: jsonData[0].error.description });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }

  groupColourChange(groupId, changeInfo, callback) {
    const colour = changeInfo.colour;
    const rgb = this.colours[colour];
    const xy = HueController.rgbToCie(rgb[0], rgb[1], rgb[2]);

    const stateData = { xy };

    this.hue_api.put(`/groups/${groupId}/action`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          const response = {
            success: true,
            name: changeInfo.name,
            colour,
          };

          callback(response);
        } else {
          callback({ success: false, name: changeInfo.name, info: jsonData[0].error.description });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }

  groupBrightnessChange(groupId, changeInfo, callback) {
    const brState = changeInfo.brightnessState;
    const brPercent = changeInfo.hueBrightness;

    let brightnessIncrease = 30;
    if (brPercent !== null) {
      brightnessIncrease = brPercent;
    }

    let brString = 'brightened';
    if (['dimmer', 'dim', 'darker'].includes(brState)) {
      brightnessIncrease = -brightnessIncrease;
      brString = 'dimmed';
    }

    let stateData = {};
    if (brState !== undefined) {
      stateData = {
        bri_inc: brightnessIncrease,
      };
    } else {
      stateData = {
        bri: brightnessIncrease,
      };
    }

    this.hue_api.put(`/groups/${groupId}/action`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          let changeResponse = `has been ${brString}`;
          if (brState === undefined) {
            changeResponse = `has been set to ${Math.ceil(brightnessIncrease / 2.54)} percent`;
          }

          const response = {
            success: true,
            name: changeInfo.name,
            response: changeResponse,
          };

          callback(response);
        } else {
          callback({
            success: false,
            name: changeInfo.name,
            info: jsonData[0].error.description,
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

  groupSceneChange(groupId, changeInfo, callback) {
    const scene = changeInfo.scene;
    const sceneId = this.scenes[scene];
    const stateData = { scene: sceneId };

    this.hue_api.put(`/groups/${groupId}/action`, stateData,
    (err, res, data) => {
      const jsonData = JSON.parse(data);
      if (jsonData[0]) {
        if (jsonData[0].success) {
          const response = {
            success: true,
            name: changeInfo.name,
            scene,
          };

          callback(response);
        } else {
          callback({ success: false, name: changeInfo.name, info: jsonData[0].error.description });
        }
      } else {
        callback({ success: false, name: changeInfo.name, info: 'Failed' });
      }
    });
  }
}

module.exports = new HueController();
