'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../../lib/sync/poll_handler');
const Db = require('../../../../lib/db_connectors/NeDB/db');
const { CREATE } = require('../../../../lib/sync/types');

const logger = {
  file: {
    info() {
    },
    error() {
    },
  },
  console: {
    info() {
    },
    error() {
    },
  },
};

describe('Poll: Subsequent Synchronization', () => {
  let db;
  let handler;

  beforeEach((done) => {
    db = new Db({ inMemoryOnly: true }, logger);
    db.init()
        .then(() => {
          handler = syncHandler(db, logger, { partialsThreshold: 1000 });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should not return server changes to the client when those have the same clientIdentity', (done) => {
    const create = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 1,
    };
    db.addChangesData(create)
        .then(() => handler({ changes: [], requestId: 1, clientIdentity: 1 }))
        .then((dataToSend) => {
          expect(dataToSend.changes.length).to.equal(0);
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should ignore changes on the server which are older than the given syncedRevision', (done) => {
    const create1 = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 2,
    };
    const create2 = {
      rev: 2,
      type: CREATE,
      obj: { bar: 'baz' },
      key: 2,
      table: 'foo',
      source: 2,
    };
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({
          changes: [],
          requestId: 1,
          clientIdentity: 1,
          syncedRevision: 1,
        }))
        .then((dataToSend) => {
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });
          done();
        })
        .catch((e) => {
          done(e);
        });
  });

  it('should send again the same changes if the client syncedRevision did not change', (done) => {
    const create1 = {
      rev: 1,
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
      source: 2,
    };
    const create2 = {
      rev: 2,
      type: CREATE,
      obj: { bar: 'baz' },
      key: 2,
      table: 'foo',
      source: 2,
    };
    db.addChangesData(create1)
        .then(() => db.addChangesData(create2))
        .then(() => handler({
          changes: [],
          requestId: 1,
          clientIdentity: 1,
          syncedRevision: 1,
        }))
        .then((dataToSend) => {
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });

          return handler({
            changes: [],
            requestId: 1,
            clientIdentity: 1,
            syncedRevision: 1,
          });
        })
        .then((dataToSend) => {
          expect(dataToSend.changes.length).to.equal(1);
          expect(dataToSend.changes[0]).to.deep.equal({
            type: create2.type,
            obj: create2.obj,
            key: create2.key,
            table: create2.table,
          });
          done();
        }).catch((e) => {
          done(e);
        });
  });
});
