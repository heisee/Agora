/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

require('chai').should();

var Member = require('../lib/members/member');

var dummymember = new Member('hada', 'hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier');

// will eventually be removed:
var storeStub = {
  allMembers: function (callback) { callback(null, [dummymember]); },
  getMember: function (nickname, callback) { callback(null, dummymember); }
};

var groupsAPIStub = {
  getSubscribedGroupsForUser: function (email, callback) { callback(null, []); }
};

var membersInternalAPIStub = {
  getMember: function (nickname, callback) { callback(null, dummymember); }
};

var groupsAndMembers = proxyquire('../lib/groupsAndMembers/groupsAndMembersAPI', {
  '../groups/groupsAPI': function () { return groupsAPIStub; },
  '../members/internalAPI': function () { return membersInternalAPIStub; }
});

var memberApp = proxyquire('../lib/members', {
  './memberstore': function () { return storeStub; },
  '../groupsAndMembers/groupsAndMembersAPI': groupsAndMembers
});
var app = memberApp(express());

describe('Members application', function () {

  it('shows the list of members as retrieved from the membersstore', function (done) {
    var allMembers = sinon.spy(storeStub, 'allMembers');
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="hada"/)
      .expect(/hans.dampf@gmail.com/, function () {
        allMembers.calledOnce.should.be.ok;
        done();
      });
  });

  it('renders the link for single parent dir', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo')
      .expect(/href="hada"/, done);
  });

  it.skip('renders the link for two parent dirs', function (done) {
    var root = express();
    root.use('/foo/bar', app);
    request(root)
      .get('/foo/bar')
      .expect(/href="hada"/, done);
  });

  it.skip('renders the link for a get request with parameters', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo?param=value')
      .expect(/href="hada"/, done);
  });

  it('shows the details of one members as retrieved from the membersstore', function (done) {
    var nickname = dummymember.nickname,
      email = dummymember.email,
      getMember = sinon.spy(membersInternalAPIStub, 'getMember'),
      getSubscribedGroupsForUser = sinon.spy(groupsAPIStub, 'getSubscribedGroupsForUser');
    request(app)
      .get('/' + nickname)
      .expect(200)
      .expect(/Blog: http:\/\/my.blog/)
      .expect(/Wie ich von der Softwerkskammer erfahren habe: beim Bier/, function () {
        getMember.calledWith(nickname).should.be.true;
        getSubscribedGroupsForUser.calledWith(email).should.be.true;
        done();
      });
  });
});
