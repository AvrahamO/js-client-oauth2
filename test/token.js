/* global describe, it */
var expect = require('chai').expect
var ClientOAuth2 = require('../')

describe('token', function () {
  var authorizationUri = 'https://github.com/login/oauth/authorize'

  var accessToken = '4430eb16f4f6577c0f3a15fb6127cbf828a8e403'
  var uri = 'http://example.com/auth/callback' +
    '#access_token=' + accessToken + '&token_type=bearer'

  var githubAuth = new ClientOAuth2({
    clientId: 'abc',
    authorizationUri: authorizationUri,
    authorizationGrants: ['token'],
    redirectUri: 'http://example.com/auth/callback',
    scopes: ['notifications']
  })

  githubAuth._request = function (req) {
    if (req.method === 'GET' && req.url === 'http://api.github.com/user') {
      expect(req.headers.Authorization).to.equal('Bearer ' + accessToken)

      return Promise.resolve({
        status: 200,
        body: {
          username: 'blakeembrey'
        },
        headers: {
          'content-type': 'application/json'
        }
      })
    }

    return Promise.reject(new TypeError('Not here'))
  }

  describe('#getUri', function () {
    it('should return a valid uri', function () {
      expect(githubAuth.token.getUri()).to.equal(
        'https://github.com/login/oauth/authorize?client_id=abc&' +
        'redirect_uri=http%3A%2F%2Fexample.com%2Fauth%2Fcallback&' +
        'scope=notifications&response_type=token&state='
      )
    })
  })

  describe('#getToken', function () {
    it('should parse the token from the response', function () {
      return githubAuth.token.getToken(uri)
        .then(function (user) {
          expect(user).to.an.instanceOf(ClientOAuth2.Token)
          expect(user.accessToken).to.equal(accessToken)
          expect(user.tokenType).to.equal('bearer')
        })
    })

    describe('#sign', function () {
      it('should be able to sign a standard request object', function () {
        return githubAuth.token.getToken(uri)
          .then(function (token) {
            var obj = token.sign({
              method: 'GET',
              url: 'http://api.github.com/user'
            })

            expect(obj.headers.Authorization).to.equal('Bearer ' + accessToken)
          })
      })
    })
  })
})
