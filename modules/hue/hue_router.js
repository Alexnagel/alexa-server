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

    let alexaStr = `No lights are turned ${state} at the moment`;
    if (lights.length > 0) {
      alexaStr = `The following lights are turned ${state}: ${summarizedJoin(lights)}`;
    }
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
            res.send(`${changeObj.name} ${changeResponse.response}`);
          } else {
            res.send(`Failed with: ${changeResponse.info}`);
          }
        }); break;
      case lightActions.CHANGECOLOUR:
        hueController.lightColourChange(lightId, changeObj.data, (changeResponse) => {
          if (changeResponse.success) {
            res.send(`${changeObj.name} colour has been set to ${changeResponse.colour}`);
          } else if (changeResponse.info === 'parameter, xy, not available') {
            res.send(`Sorry, the ${changeObj.name} light doesn't support colours`);
          } else {
            res.send(`Failed with: ${changeResponse.info}`);
          }
        }); break;
      default:
        res.send('Unknown'); break;
    }
  } else {
    res.send('Undefined action');
  }
});

router.get('/groups', (req, res) => {
  hueController.getGroups((groups) => {
    res.send(groups);
  });
});

router.get('/groups/:state', (req, res) => {
  const state = req.params.state;
  const checkOnState = (state === 'on');

  hueController.getGroupsState(checkOnState, (data) => {
    const groups = data.map(group => group.class);

    let alexaStr = `No rooms are turned ${state} at the moment`;
    if (groups.length > 0) {
      alexaStr = `The following rooms are turned ${state}: The ${summarizedJoin(groups)}`;
    }
    res.send(alexaStr);
  });
});

router.post('/groups/:id', (req, res) => {
  const groupId = req.params.id;
  const changeObj = req.body;

  switch (changeObj.action) {
    case lightActions.CHANGESTATE:
      hueController.groupStateChange(groupId, changeObj.data, (changeResponse) => {
        if (changeResponse.success) {
          res.send(`${changeObj.name} has been turned ${changeResponse.state}`);
        } else {
          res.send(`Failed with: ${changeResponse.info}`);
        }
      }); break;
    case lightActions.CHANGEBRIGHTNESS:
      hueController.groupBrightnessChange(groupId, changeObj.data, (changeResponse) => {
        if (changeResponse.success) {
          res.send(`${changeObj.name} ${changeResponse.response}`);
        } else {
          res.send(`Failed with: ${changeResponse.info}`);
        }
      }); break;
    case lightActions.CHANGECOLOUR:
      hueController.groupColourChange(groupId, changeObj.data, (changeResponse) => {
        if (changeResponse.success) {
          res.send(`${changeObj.name} colour has been set to ${changeResponse.colour}`);
        } else if (changeResponse.info === 'parameter, xy, not available') {
          res.send(`Sorry, the ${changeObj.name} doesn't support colours`);
        } else {
          res.send(`Failed with: ${changeResponse.info}`);
        }
      }); break;
    case lightActions.CHANGESCENE:
      hueController.groupSceneChange(groupId, changeObj.data, (changeResponse) => {
        if (changeResponse.success) {
          res.send(`Scene ${changeResponse.scene} has been set for ${changeResponse.name}`);
        } else {
          res.send(`Failed with: ${changeResponse.info}`);
        }
      }); break;
    default:
      res.send('Unknown action'); break;
  }
});
module.exports = router;
