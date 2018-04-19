#!/usr/bin/env node

const program = require('commander');
const sander = require('sander');
const Preferences = require('preferences');

const activateTravis = require('./lib/activate-travis');
const close = require('./lib/close-out');
const openGithub = require('./lib/open-github');
const addBranches = require('./lib/add-branches');
const {alert, alertErr} = require('./lib/cli-tools');

const prefs = new Preferences('tai-v2');

program
  .command('config-github <github_org> <github_token>' )
  .description( 'Configure Github org and auth token.' )
  .action((github_org, github_token) => {
    prefs.github_org = github_org;
    prefs.github_token = github_token;
    alert( 'github data configured.' );
  });

program
  .command('config-travis <travis_token>')
  .description('Configure Travis-ci.org token')
  .action(travis_token => {
    prefs.travis_token = travis_token;
    alert( 'travis data configured.' );
  });

program
  .command('show-config')
  .option('-s --show_keys')
  .description('Display current configuration data.')
  .action((cmd) => {
    if (cmd.show_keys && prefs.github_token) alert(`Current github token is ${prefs.github_token}`);
    if (cmd.show_keys && prefs.travis_token) alert(`Current travis token is ${prefs.travis_token}`);
    if (prefs.github_org) alert(`Current selected organization is ${prefs.github_org}`);
    else return alert( 'There is no current Github organization selected.' );
  });

program
  .command('clear')
  .description('Clear current Github and Travis data.')
  .action(() => {
    prefs.github_org = undefined;
    prefs.github_token = undefined;
    prefs.travis_token = undefined;
    return alertErr( 'Github and Travis configurations have been removed.' );
  });

program
  .command('setup-branches <repoName> [branches]')
  .description('Create branches for the specified team')
  .action((repoName, branches) => {
    if (!prefs.github_org) return alertErr('No configuration found.  run config');
    prefs.branches = branches ? JSON.parse(branches) : prefs.students;
    addBranches( repoName, prefs )
      .then(() => alert( `Branches created for ${repoName}` ))
      .catch( (err) => {
        alertErr('Error setting up repo.');
        alertErr(err);
      });
  });

program
  .command('setup-travis <repoName>')
  .description('Activate Travis for the specified repo')
  .action( ( repoName ) => {
    activateTravis( repoName, prefs )
      .then(() => alert(`Travis-CI activated for ${repoName}`))
      .catch( err => {
        alertErr('Error setting up Travis-CI.');
        alertErr(err);
      });
  });
    
program
  .command('close <repoName>')
  .description('merge student branches into master folders')
  .action((repoName) => {
    if (!prefs.github_org) return alertErr('No configuration found.  run config');
    close(repoName, prefs)
      .then( () => alert(`repo "${repoName}" closed out`))
      .catch(err => {
        alertErr('error closing repo');
        alertErr(err);
      });
  });

program
  .command('team [filepath]')
  .description('set teams to specified json filepath')
  .action((filepath) => {
    if (!prefs.students) return alertErr('No team is setup.');
    if (!filepath && prefs.students) {
      alert('Teams currently set to: ');
      return console.log(prefs.students);
    }
    sander.readFile(filepath)
      .then(data => {
        alert('setting student teams to \n' + data);
        prefs.students = data.toString();
      })
      .catch((err) => {
        alertErr('error setting teams');
        console.log(err);
      });
  });

program
  .command('open <repo_name>')
  .description('open repo on github')
  .action(repoName => openGithub(repoName, prefs));

program.parse(process.argv);
