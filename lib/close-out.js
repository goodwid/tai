'use strict';
const Git = require('nodegit');
const childProcess = require('child_process');
const path = require('path');
const sander = require('sander');
const GitHub = require('github-api');
const { alertErr } = require('./cli-tools');
const TMP_PATH = path.join('/tmp/tai');

const exec = (cmd, cwd = TMP_PATH) => childProcess.execSync(cmd, {cwd, encoding: 'utf-8'});

module.exports = (repoName, prefs) => {
  const gh = new GitHub({token: prefs.githubToken});
  const repo = gh.getRepo( prefs.githubOrg, repoName );

  const listBranches = repo.listBranches()
    .then( ({ data }) => {
      return data
        .filter( b => b.name !== 'master' )
        .map( b => b.name );
    })
    .then( branches => {
      if (!branches.length) return alertErr('no branches on repository to close');
      return branches;
    });


  const clean = sander.exists(TMP_PATH)
    .then(exists => {
      if (exists) exec('rm -rf tai', TMP_PATH + '/../');
    });
    
  const repoUrl = `https://github.com/${prefs.githubOrg}/${repoName}`;
  
  clean
    .then(() => {
      exec(`git clone -q ${repoUrl} ${TMP_PATH}`, __dirname + '/../' );
    })
    .catch( alertErr );

  return listBranches
    .then(branches => closeBranches( branches ));
};  

function closeBranches(branches) {
  Promise.all(branches.map(branch => closeBranch(branch)))
    .then( () => travisAndPush())
    .catch( alertErr );
}

function closeBranch(branch) {
  function excludes(file) {
    return !file.startsWith('LAB') && file !== '.git' && file !== branch;
  }
  exec(`git checkout -q ${branch}`);
  exec('git status');

  return sander.readdir(TMP_PATH)
    .then(files => files.filter(excludes))
    .then(files => files.length ? files : Promise.reject('no files'))
    .then(files => files.map(file => sander.rename(TMP_PATH, file).to(TMP_PATH, branch, file)))
    .then(promises => Promise.all(promises))
    .then( () => {
      exec(`mkdir -p ${branch}`);
      exec('git add -vA');
      exec('git commit -m \'moved student work to folder\'');
      exec('git checkout master');
      try {
        exec(`git merge origin/${branch}`);

      } catch (err) {
        exec('git add -A');
        exec('git commit -m \'merge conflicts\'');
      }
    })
    .catch(err => {
      if (err === 'no files') {
        alertErr(`WARNING: no files for ${branch}`);
        exec('git checkout master');
      } else alertErr(err);
    });
}

function travisAndPush() {
  exec('cp ./.travis.yml '+ TMP_PATH, __dirname+'/../');
  exec('git add -A');
  exec('git commit -m \'moved student work from branches to team folders\'');
  exec('git push origin master');
}
