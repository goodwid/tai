'use strict';
const Git = require('nodegit');
const childProcess = require('child_process');
const path = require('path');
const sander = require('sander');
const GitHub = require('github-api');
const { alertErr } = require('./cli-tools');

const exec = (cmd, cwd) => childProcess.execSync(cmd, {cwd: cwd || TMP_PATH});
const execP = (cmd, cwd) => console.log(exec(cmd, cwd).toString());

const TMP_PATH = path.join(__dirname, '/../tmp_repo');

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


  const cleanAndClone = sander.exists(TMP_PATH)
    .then(exists => {
      if (exists) execP('rm -rf tmp_repo', TMP_PATH + '/../');
    })
    .then( () => Git.Clone(repoUrl, TMP_PATH) );

  const repoUrl = `https://github.com/${prefs.githubOrg}/${repoName}`;

  return Promise.all([ listBranches, cleanAndClone ])
    .then(([branches]) => closeBranches( branches ))
    .catch( alertErr );
};

function closeBranches(branches) {
  if ( branches.length ) {
    closeBranch( branches.shift() )
      .then( () => closeBranches( branches ));
  }
  else {
    return travisAndPush();
  }
}

function closeBranch(branch) {
  console.log( branch );
  execP(`git checkout ${branch}`);
  execP('git status');

  function excludes(file) {
    return !file.startsWith('LAB') && file !== '.git' && file !== branch;
  }

  function rename(file) {

  }

  return sander.readdir(TMP_PATH)
    .then(files => files.filter(excludes))
    .then(files => files.length ? files : Promise.reject('no files'))
    .then(files => files.map(file => sander.rename(TMP_PATH, file).to(TMP_PATH, branch, file)))
    .then(promises => Promise.all(promises))
    .then( () => {
      execP(`mkdir -p ${branch}`);
      execP('git add -A');
      execP(`git commit -m 'moved student work to folder'`);
      execP(`git checkout master`);
      try {
        execP(`git merge ${branch}`);

      } catch (err) {
        execP('git add -A');
        execP(`git commit -m 'merge conflicts'`);
      }
    })
    .catch(err => {
      if (err === 'no files') {
        alertErr(`WARNING: no files for ${branch}`);
        execP(`git checkout master`);
      } else alertErr(err);
    });
}

function travisAndPush() {
  execP('cp ./.travis.yml '+ TMP_PATH, __dirname+'/../');
  execP('git add -A');
  execP(`git commit -m 'moved student work from branches to team folders'`);
  execP('git push origin master');
}
