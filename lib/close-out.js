'use strict';
const Git = require('nodegit');
const childProcess = require('child_process');
const fs = require('fs-extra');
const GitHub = require('github-api');
const { alert, alertErr } = require('./cli-tools');
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
  
  alert(`Using repo ${repoUrl}`)
  exec(`git clone ${repoUrl} ${TMP_PATH}`);

  return listBranches
    .then(createBranches)
    .then(closeBranches);
};  

function createBranches(branches) {
  return branches.map(branch => {
    exec(`git checkout -b ${branch}`, TMP_PATH);
    exec(`git pull origin ${branch}`, TMP_PATH);
    exec(`git checkout master`, TMP_PATH);
    return branch;
  });
}

function closeBranches(branches) {
  Promise.all(branches.map(branch => closeBranch(branch)))
    .then( () => travisAndPush());
}

function closeBranch(branch) {
  console.log(`Working on ${branch}` );
  exec(`git checkout ${branch}`, TMP_PATH);
  fs.mkdirpSync(`${TMP_PATH}/${branch}`);

  const filesInRepo = fs.readdirSync(TMP_PATH)
  
  const filteredFiles = filesInRepo.filter(excludes);
  if (filteredFiles.length) {
    filteredFiles.forEach(file => {
        fs.moveSync(`${TMP_PATH}/${file}`,`${TMP_PATH}/${branch}/${file}`)
    });
  } else {
    fs.openSync(`${TMP_PATH}/${branch}/.gitkeep`, 'w');
  }
    
  exec('git add -A', TMP_PATH);
  exec('git commit -m \'moved student work to folder\'', TMP_PATH);
  exec('git checkout master', TMP_PATH);
  try {
    exec(`git merge ${branch}`, TMP_PATH);
  } catch (err) {
    exec('git add -A', TMP_PATH);
    exec('git commit -m \'merge conflicts\'', TMP_PATH);
  }

  function excludes(file) {
    return !file.startsWith('LAB') && file !== '.git' && file !== branch;
  }
}

function travisAndPush() {
  exec('cp ./.travis.yml '+ TMP_PATH, __dirname+'/../');
  console.log('Got to the end!');
  exec('git add -A', TMP_PATH);
  exec('git commit -m \'moved student work from branches to team folders\'', TMP_PATH);
  exec('git push origin master', TMP_PATH);
}
