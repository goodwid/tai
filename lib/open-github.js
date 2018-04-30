const execP = (cmd, cwd) => console.log(require('child_process').execSync(cmd,{cwd: cwd || __dirname}).toString());

module.exports = (repoName, prefs) => {
  let url = `https://github.com/${prefs.githubOrg}/${repoName}`;
  if (process.env.OSTYPE === 'linux') {
    return console.log(`Repo is available at ${url}`);
  } 
  try {
    execP(`open ${url}`);
  }
  catch(e) {
    console.log(`Repo is available at ${url}`);
  }

};
