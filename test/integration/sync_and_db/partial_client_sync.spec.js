'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const syncHandler = require('../../../lib/sync/handler');
const Db = require('../../../lib/db_connectors/NeDB/db');
const { CREATE } = require('../../../lib/sync/types');

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

describe('Partial client synchronization', () => {
  let db;
  let handler;

  beforeEach(() => {
    db = new Db({ inMemoryOnly: true }, logger);
    handler = syncHandler(db, logger, { partialsThreshold: 1000 });
  });

  function expectWrapper(done, fn) {
    try {
      fn();
    } catch (e) {
      done(e);
    }
  }

  it('should add the partial data to the uncommittedChanges table', (done) => {
    const create = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    handler({
      changes: [create],
      partial: true,
    }).then((dataToSend) => {
      db.uncommittedChanges
        .get(dataToSend.clientIdentity)
        .then((uncommittedChanges) => {
          expectWrapper(done, () => {
            expect(uncommittedChanges.changes).to.deep.equal([create]);
            done();
          });
        });
    });
  });

  it(`should add the data to the given tables and clear uncommittedChanges table
after we received partial = false`, (done) => {
    let clientIdentity;
    const create1 = {
      type: CREATE,
      obj: { foo: 'bar' },
      key: 1,
      table: 'foo',
    };
    const create2 = {
      type: CREATE,
      obj: { foo: 'baz' },
      key: 2,
      table: 'foo',
    };
    handler({ changes: [create1], partial: true })
      .then((dataToSend) => {
        clientIdentity = dataToSend.clientIdentity;
        return handler({
          changes: [create2],
          partial: false,
          clientIdentity,
        });
      })
    .then(() => {
      db.uncommittedChanges
        .get(clientIdentity)
        .then((uncommittedChanges) => {
          expectWrapper(done, () => {
            expect(uncommittedChanges.changes).to.deep.equal([]);
          });
          db.getData('foo', 1)
            .then((data) => {
              expectWrapper(done, () => {
                expect(data.foo).to.equal('bar');
              });
              return db.getData('foo', 2);
            })
            .then((data) => {
              expectWrapper(done, () => {
                expect(data.foo).to.equal('baz');
                done();
              });
            });
        });
    });
  });
});
