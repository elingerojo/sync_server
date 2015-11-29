const NeDBDataStore = require('nedb');

const settings = require('./settings.js');

class DataStore {
  constructor(collectionName) {
    const filename = `${settings.dataPath}/${collectionName}.db`;
    const options = {
      filename,
      autoload: true
    };
    this.datastore = new NeDBDataStore(options);
  }
  save(changeObject) {
    const promise = new Promise((resolve, reject) => {
      this.datastore.insert(changeObject, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    return promise;
  }
  find(query) {
    const promise = new Promise((resolve, reject) => {
      this.datastore.find(query, function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
    return promise;
  }
}

module.exports = DataStore;
