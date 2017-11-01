const config = require('./config');
const request = require('request');

class HueAPI {

  constructor() {
    this.host = `http://${config.hueBridgeIP}/api/${config.hueUserId}`;
  }

  static validateResource(resource) {
    if (resource.startsWith('/')) {
      return resource.substring(1);
    }
    return resource;
  }

  retrieveResource(resource, callback, method = 'GET', data = null) {
    const validResource = HueAPI.validateResource(resource);
    const url = `${this.host}/${validResource}`;

    const options = {
      method,
      url,
      headers: [
        {
          name: 'content-type',
          value: 'application/json',
        },
      ],
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    request(options, callback);
  }

  get(resource, callback) {
    this.retrieveResource(resource, callback);
  }

  post(resource, callback) {
    this.retrieveResource(resource, callback, 'POST');
  }

  put(resource, data, callback) {
    this.retrieveResource(resource, callback, 'PUT', data);
  }

  delete(resource, callback) {
    this.retrieveResource(resource, callback, 'DELETE');
  }

}

module.exports = HueAPI;
