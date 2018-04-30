'use strict';
// const Git = require('nodegit');
const childProcess = require('child_process');
const path = require('path');
const sander = require('sander');
const GitHub = require('github-api');
const { alertErr } = require('./cli-tools');
const TMP_PATH = path.join(__dirname, '/../tmp_repo');

const exec = (cmd, cwd) => childProcess.execSync(cmd, {cwd, encoding: 'utf-8'});

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
      if (exists) exec('rm -rf tmp_repo', TMP_PATH + '/../');
    });
    
  const repoUrl = `https://github.com/${prefs.githubOrg}/${repoName}`;
  
  clean
    .then(() => {
      exec(`git clone -v ${repoUrl} ${TMP_PATH}`, __dirname + '/../' );
    })
    .catch( alertErr );

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

  return sander.readdir(TMP_PATH)
    .then(files => files.filter(excludes))
    .then(files => files.length ? files : Promise.reject('no files'))
    .then(files => files.map(file => sander.rename(TMP_PATH, file).to(TMP_PATH, branch, file)))
    .then(promises => Promise.all(promises))
    .then( () => {
      exec(`mkdir -p ${branch}`);
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
