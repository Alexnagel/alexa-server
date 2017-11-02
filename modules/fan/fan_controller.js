const SerialPort = require('serialport');

class FanController {

  constructor() {
    this.serial = new SerialPort("/dev/ttyUSB0", { baudRate: 9600 });
  }

  sendSerialCommand(command, callback) {
    // Prep the callback for when the arduino sends data back
    this.serial.on('data', (data) => {
      const jsonData = JSON.parse(data);

      if (jsonData !== undefined) {
        if (jsonData.success) {
          callback({ success: true });
        } else {
          const error = {
            success: false,
            message: 'Unable to send data to fan',
          }
          callback(error);
        }
      } else {
        const error = {
          succes: false,
          message: 'unable to determine if data successfully received',
        };
        callback(error);
      }
    });

    // Sending String character by character
    this.serial.write(Buffer.from(command), (err, results) => {
      const error = {
        success: false,
        message: 'Unable to send data to Arduino',
      };
      callback(error);
    });
  }

  fanToggleState(callback) {
    this.sendSerialCommand('fan:toggle_state', callback);
    callback({success: true});
  }

  fanSetSpeed(speed, callback) {
    this.sendSerialCommand(`fan:set_${speed}`, callback);
  }

  fanToggleOscillate(callback) {
    this.sendSerialCommand('fan:toggle_oscillate');
  }
}

module.exports = new FanController();
