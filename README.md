# ![ACL](http://res.cloudinary.com/hrscywv4p/image/upload/c_limit,fl_lossy,h_50,w_50,f_auto,q_auto/v1/983693/axmqlpjyo3zmeszdr9qt.png ) tai
a tool for managing student assignment repos

## setup
**tai config-github-org** - to store github data
```
tai config-github <githubOrganization> <githubToken>
```
**tai config-githubToken** - to store github data
```
tai config-github <githubOrganization> <githubToken>
```
**tai config-travisToken** - to store travis-ci token
```
tai config-travis <travisToken>
```
**tai show-config**: show current configuration

use -s flag to show tokens.
```
tai show-config -s
```
**tai clear**: remove current organization and Github token
```
tai clear
```

**tai team** - to set teams
```
tai team <json_filepath>
```
json file:
```
[ "tad-and-anki", "plz-and-respond" ]
```
teams must be valid branch names

## run
**tai setup-branches** - to create unique branch for each team 
Optional [branches] flag available to specify a set of branches different from the stored team.  JSON format required.
```
tai setup-branches <repo_name> [branches]
```
**tai setup-travis** - to activate travis on a repo
```
tai setup-travis <repo_name>
```

**tai close** - to merge team branches into unique folders in master
```
tai close <repo_name>
```
**tai open** - shows the URI for the repo on github.com
```
tai open <repo_name>
```