const GitHub = require('github-api');
const {alertErr} = require('./cli-tools');

module.exports = (repoName, prefs) => {
  if (!prefs.branches) return alertErr('no branches provided. either set with "tai team branches.json" or supply "-b $(cat branches.json)"');
  let branches = JSON.parse(prefs.branches);
  const gh = new GitHub({ token: prefs.githubToken });
  const repo = gh.getRepo(prefs.githubOrg, repoName);
  const promises = branches.map(b => repo.createBranch('master', b));
  return Promise.all(promises);
};