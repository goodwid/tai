const request = require( 'superagent' );
const travisUrl = 'https://api.travis-ci.org';

module.exports = ( repoName, prefs ) => {
  return request
    .post(`${travisUrl}/repo/${prefs.github_org}%2F${repoName}/activate`)
    .set('content-type', 'application/json')
    .set('Travis-API-Version', '3')
    .set('Authorization',`token ${prefs.travis_token}`);
};
