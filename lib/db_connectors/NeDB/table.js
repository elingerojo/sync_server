'use strict';

const NeDBDataStore = require('nedb');

class Table {
  constructor(name, dbOptions) {
    const filename = `${name}.table`;
    const options = {
      filename,
      autoload: true,
    };
    this.store = new NeDBDataStore(Object.assign({}, options, dbOptions));
  }

  _addID(obj) {
    return Object.assign({}, obj, { _id: obj.key });
  }

  add(changeObject) {
    return new Promise((resolve, reject) => {
      this.store.insert(this._addID(changeObject), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.store.findOne({ _id: key }, {}, (err, res) => {
        if (err) {
          reject();
        } else {
          resolve(res);
        }
      });
    });
  }

  update(changeObject) {
    return new Promise((resolve, reject) => {
      this.store.insert(this._addID(changeObject), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  remove(key) {
    return new Promise((resolve, reject) => {
      this.store({ _id: key }, {}, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = Table;
