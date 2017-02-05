const express = require('express');
const hueController = require('./hue_controller');

const router = express.Router();
const lightActions = {
  CHANGESTATE: 0,
  CHANGECOLOUR: 1,
  CHANGESCENE: 2,
  CHANGEROOM: 3,
  CHANGEROOMSCENE: 4,
  CHANGEBRIGHTNESS: 5,
};

function summarizedJoin(inputArr) {
  return [inputArr.slice(0, -1).join(', '), inputArr.slice(-1)[0]].join(inputArr.length < 2 ? '' : ' and ');
}

function validLightObj(lightObj) {
  return (lightObj.name && (lightObj.action !== null) && lightObj.data);
}

router.get('/', (req, res) => {
  res.send('hello');
});

router.get('/lights', (req, res) => {
  hueController.getLights((lights) => {
    res.send(lights);
  });
});

router.get('/lights/:state', (req, res) => {
  const state = req.params.state;
  const checkOnState = (state === 'on');

  hueController.getLightsState(checkOnState, (data) => {
    const lights = data.map(light => light.name);
    const alexaStr = `The following lights are turned ${state}: ${summarizedJoin(lights)}`;
    res.send(alexaStr);
  });
});

router.post('/light/:id', (req, res) => {
  const lightId = req.params.id;
  const changeObj = req.body;

  if (validLightObj(changeObj)) {
    switch (changeObj.action) {
      case lightActions.CHANGESTATE:
        hueController.lightStateChange(lightId, changeObj.data, (changeResponse) => {
          if (changeResponse.success) {
            res.send(`${changeObj.name} has been turned ${changeResponse.state}`);
          } else {
            res.send(`Failed with: ${changeResponse.info}`);
          }
        }); break;
      case lightActions.CHANGEBRIGHTNESS:
        hueController.lightBrightnessChange(lightId, changeObj.data, (changeResponse) => {
          if (changeResponse.success) {
            res.send(`${changeObj.name} has been ${changeResponse.brType}`);
          } else {
            res.send(`Failed with: ${changeResponse.info}`);
          }
        }); break;
      default:
        res.send('Unkown'); break;
    }
  } else {
    res.send('Undefined action');
  }
});
module.exports = router;
