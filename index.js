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
  .command( 'config' )
  .option( '-g --githubToken')
  .option( '-t --travisToken')
  .option( '-r --githubOrg')
  .description( 'Configure the application.' )
  .action((...options) => {
    const { githubOrg, githubToken, travisToken } = options[options.length-1];
    if (githubOrg) {
      prefs.githubOrg = githubOrg;
      alert( 'github organization configured' );
    }
    if (githubToken) {
      prefs.githubToken = githubToken;
      alert( 'github token configured.' );
    }
    if (travisToken) {
      prefs.travisToken = travisToken;
      alert( 'travis token configured' );
    }
  });

program
  .command('show-config')
  .option('-s --showKeys')
  .description('Display current configuration data.')
  .action((cmd) => {
    if (cmd.showKeys && prefs.githubToken) alert(`Current github token is ${prefs.githubToken}`);
    if (cmd.showKeys && prefs.travisToken) alert(`Current travis token is ${prefs.travisToken}`);
    if (prefs.githubOrg) alert(`Current selected organization is ${prefs.githubOrg}`);
    else return alert( 'There is no current Github organization selected.' );
  });

program
  .command('clear')
  .description('Clear current Github and Travis data.')
  .action(() => {
    prefs.githubOrg = undefined;
    prefs.githubToken = undefined;
    prefs.travisToken = undefined;
    return alertErr( 'Github and Travis configurations have been removed.' );
  });

program
  .command('setup-branches <repoName> [branches]')
  .description('Create branches for the specified team')
  .action((repoName, branches) => {
    if (!prefs.githubOrg) return alertErr('No configuration found.  run config');
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
    if (!prefs.githubOrg) return alertErr('No configuration found.  run config');
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
