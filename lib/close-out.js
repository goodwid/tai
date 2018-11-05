'use strict';
const Git = require('nodegit');
const childProcess = require('child_process');
const path = require('path');
const sander = require('sander');
const fs = require('fs-extra');
const GitHub = require('github-api');
const { alertErr } = require('./cli-tools');
// const TMP_PATH = path.join(__dirname, '/../tmp_repo');
const TMP_PATH = '/tmp/tai';

const exec = (cmd, cwd) => childProcess.execSync(cmd, {cwd, encoding: 'utf-8'});

module.exports = (repoName, prefs) => {
  const gh = new GitHub({token: prefs.githubToken});
  const repo = gh.getRepo( prefs.githubOrg, repoName );
  const repoUrl = `https://github.com/${prefs.githubOrg}/${repoName}`;
  console.log(repoUrl);


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

    fs.removeSync(TMP_PATH);

  Git.Clone(repoUrl, TMP_PATH)
    .then(repo => console.log(repo))
    .catch( console.log );

  return listBranches
    .then(branches => closeBranches( branches ));
};  

function closeBranches(branches) {
  Promise.all(branches.map(branch => closeBranch(branch)))
    .then( () => travisAndPush());
}

function closeBranch(branch) {
  console.log(`Working on ${branch}` );
  exec(`git checkout ${branch}`, TMP_PATH);
  exec('git status');

  function excludes(file) {
    return !file.startsWith('LAB') && file !== '.git' && file !== branch;
  }

  return fs.readdir(TMP_PATH)
    .then(files => files.filter(excludes))
    .then(files => files.length ? files : Promise.reject('no files'))
    .then(files => files.map(file => sander.rename(TMP_PATH, file).to(TMP_PATH, branch, file)))
    .then(promises => Promise.all(promises))
    .then( () => {
      
      exec('git add -A');
      exec('git commit -m \'moved student work to folder\'');
      exec('git checkout master');
      try {
        exec(`git merge ${branch}`);

      } catch (err) {
        exec('git add -A');
        exec('git commit -m \'merge conflicts\'');
      }
    })
    .catch(err => {
      if (err === 'no files') {
        console.log(`WARNING: no files for ${branch}`);
        exec('git checkout master');
      } else console.log(err);
    });
}

function travisAndPush() {
  exec('cp ./.travis.yml '+ TMP_PATH, __dirname+'/../');
  // exec('git add -A');
  // exec('git commit -m \'moved student work from branches to team folders\'');
  // exec('git push origin master');
}
