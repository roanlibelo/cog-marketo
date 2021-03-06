import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { ClientWrapper } from '../../src/client/client-wrapper';
import { Metadata } from 'grpc';

chai.use(sinonChai);

describe('ClientWrapper', () => {
  const expect = chai.expect;
  let marketoClientStub: any;
  let marketoConstructorStub: any;
  let metadata: Metadata;
  let clientWrapperUnderTest: ClientWrapper;

  beforeEach(() => {
    marketoClientStub = {
      lead: {
        find: sinon.spy(),
        createOrUpdate: sinon.spy(),
      },
      _connection: {
        postJson: sinon.spy(),
      },
    };
    marketoConstructorStub = sinon.stub();
    marketoConstructorStub.returns(marketoClientStub)
  });

  it('authentication', () => {
    // Construct grpc metadata and assert the client was authenticated.
    const expectedCallArgs = {
      endpoint: 'https://abc-123-xyz.mktorest.example/rest',
      identity: 'https://abc-123-xyz.mktorest.example/identity',
      clientId: 'a-client-id',
      clientSecret: 'a-client-secret'
    };
    metadata = new Metadata();
    metadata.add('endpoint', expectedCallArgs.endpoint.replace('/rest', ''));
    metadata.add('clientId', expectedCallArgs.clientId);
    metadata.add('clientSecret', expectedCallArgs.clientSecret);

    // Assert that the underlying API client was authenticated correctly.
    clientWrapperUnderTest = new ClientWrapper(metadata, marketoConstructorStub);
    expect(marketoConstructorStub).to.have.been.calledWith(expectedCallArgs);
  });

  it('createOrUpdateLead', () => {
    const expectedLead = { email: 'test@example.com' };
    clientWrapperUnderTest = new ClientWrapper(metadata, marketoConstructorStub);
    clientWrapperUnderTest.createOrUpdateLead(expectedLead);

    expect(marketoClientStub.lead.createOrUpdate).to.have.been.calledWith(
      [expectedLead],
      { lookupField: 'email' }
    );
  });

  it('findLeadByEmail (no options)', () => {
    const expectedEmail = 'test@example.com';
    clientWrapperUnderTest = new ClientWrapper(metadata, marketoConstructorStub);
    clientWrapperUnderTest.findLeadByEmail(expectedEmail);

    expect(marketoClientStub.lead.find).to.have.been.calledWith(
      'email',
      [expectedEmail]
    );
  });

  it('findLeadByEmail (with options)', () => {
    const expectedEmail = 'test@example.com';
    const expectedOps = { fields: ['email', 'firstName'] };
    clientWrapperUnderTest = new ClientWrapper(metadata, marketoConstructorStub);
    clientWrapperUnderTest.findLeadByEmail(expectedEmail, expectedOps);

    expect(marketoClientStub.lead.find).to.have.been.calledWith(
      'email',
      [expectedEmail],
      expectedOps
    );
  });

  it('deleteLeadById', () => {
    const expectedId = 123;
    clientWrapperUnderTest = new ClientWrapper(metadata, marketoConstructorStub);
    clientWrapperUnderTest.deleteLeadById(expectedId);

    expect(marketoClientStub._connection.postJson).to.have.been.calledWith(
      '/v1/leads.json',
      { input: [ { id: expectedId } ] },
      { query: { _method: 'DELETE' } }
    );
  });

});
