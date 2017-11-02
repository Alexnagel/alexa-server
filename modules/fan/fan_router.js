const express = require('express');
const fanController = require('./fan_controller');

const router = express.Router();

router.post('/state', (req, res) => {
  const state = req.body;

  fanController.fanToggleState((changeResponse) => {
    if (changeResponse.success) {
      res.send(`Fan state change request to ${state} has been sent`);
    } else {
      res.send(`Failed with: ${changeResponse.info}`);
    }
  });
});

router.post('/speed', (req, res) => {
  const speed = req.body;

  if (speed) {
    let speedKeword = 'low';
    if (['faster', 'fast', 'high', 'higher'].includes(speed)) {
      speedKeyword = 'high';
    }

    fanController.fanSetSpeed(speedKeyword, (changeResponse) => {
      if (changeResponse.success) {
        res.send(`Fan speed change request for ${speed} has been sent`);
      } else {
        res.send(`Failed with: ${changeResponse.info}`);
      }
    });
  } else {
    res.send('Invalid data received');
  }
});

router.get('/oscillate', (req, res) => {
  fanController.fanToggleOscillate((changeResponse) => {
    if (changeResponse.success) {
      res.send(`Fan oscillate toggle request has been sent`);
    } else {
      res.send(`Failed with: ${changeResponse.info}`);
    }
  });
});
module.exports = router;
