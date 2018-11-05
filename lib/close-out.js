'use strict';
const Git = require('nodegit');
const childProcess = require('child_process');
const fs = require('fs-extra');
const sander = require('sander');
const GitHub = require('github-api');
const { alertErr } = require('./cli-tools');
const TMP_PATH = '/tmp/tai';

const exec = (cmd, cwd) => childProcess.execSync(cmd, {cwd, encoding: 'utf-8'});

module.exports = (repoName, prefs) => {
  const gh = new GitHub({token: prefs.githubToken});
  const repo = gh.getRepo( prefs.githubOrg, repoName );
  const repoUrl = `https://github.com/${prefs.githubOrg}/${repoName}`;

  const listBranches = repo.listBranches()
    .then( ({ data }) => {
      return data
        .filter( b => b.name !== 'master' )
        .map( b => b.name );
    })
    .then( branches => {
      if (!branches.length) return console.log('no branches on repository to close');
      return branches;
    });

  if (fs.existsSync(TMP_PATH)) fs.removeSync(TMP_PATH);

  Git.Clone(repoUrl, TMP_PATH)
    .then(result => console.log(result))
    .catch(err => {
      console.log('Clone: ', err);
    });

  return listBranches
    .then(branches => closeBranches( branches ));
};  

function closeBranches(branches) {
  Promise.all(branches.map(branch => closeBranch(branch)))
    .then( () => travisAndPush());
}

function closeBranch(branch) {
  console.log(`Working on ${branch}` );
  fs.mkdirpSync(branch, TMP_PATH);
  exec(`git checkout ${branch}`, TMP_PATH);
  exec('git status', TMP_PATH);

  function excludes(file) {
    return !file.startsWith('LAB') && file !== '.git' && file !== branch;
  }

  const filesInRepo = fs.readdirSync(TMP_PATH)
  
  const filteredFiles = filesInRepo.filter(excludes);
  if (!filteredFiles.length) return Promise.reject('no files');
  filteredFiles.forEach(file => {
      fs.moveSync(`${TMP_PATH}/${file}`,`${TMP_PATH}/${branch}/${file}`)
    });

  exec('git add -A', TMP_PATH);
  exec('git commit -m \'moved student work to folder\'', TMP_PATH);
  exec('git checkout master', TMP_PATH);
  try {
    exec(`git merge ${branch}`, TMP_PATH);

  } catch (err) {
    exec('git add -A', TMP_PATH);
    exec('git commit -m \'merge conflicts\'', TMP_PATH);
  }
}

function travisAndPush() {
  console.log('got to travisAndPush');
  exec('cp ./.travis.yml '+ TMP_PATH, __dirname+'/../');
  exec('git add -A', TMP_PATH);
  exec('git commit -m \'moved student work from branches to team folders\'', TMP_PATH);
  exec('git push origin master', TMP_PATH);
}
