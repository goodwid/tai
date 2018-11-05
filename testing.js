const git = require('simple-git')();
const childProcess = require('child_process');
const path = require('path');
const sander = require('sander');

const TMP_PATH = '/tmp/tai-test';
const repoUrl = 'https://github.com/alchemy-fullstack-js-spring-2018/submit-career-track-way' + '.git'

const exists = sander.existsSync(TMP_PATH)
if (exists) sander.rimrafSync(TMP_PATH);

let repo, index;
const branchName = 'kelihansen';

git.clone(repoUrl,TMP_PATH)
  // .branch(branchName)
  .checkout(branchName);







  // .then(r => repo = r)
  // .then(r => r.refreshIndex())
  // .then(i => index = i)
  // .then( () => {
  //   console.log(index, repo);
  //   return repo.getBranch(`refs/remotes/origin/${branchName}`)
  // })
  // .then(reference => repo.checkoutRef(reference))
  // .then(x => {
  //   console.log('x: ', x)
  // })
  // .catch( console.log );
