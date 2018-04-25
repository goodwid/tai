const assert = require('chai').assert;
const execSync = require('child_process').execSync;
const exec = cmd => execSync(cmd, { encoding: 'utf-8' });
const read = require('fs').readFileSync;

const tai = './tai';

describe('tai', () => {

  it('config', () => {
    const expected = 
    exec('./tai clear');
    assert.equal(exec('./tai org'), '[*] There is no current Github organization selected.\n');
    exec('./tai config -g githubtoken -t travistoken -o githuborg');
    assert.equal(exec('./tai show-config'), '[*] Current selected organization is my-org\n');
        
  });

  it('team', () => {
    const set = exec('./tai team ./test/students.json');
    const branches = exec('./tai team');
    const expected = read('./test/students.json');
    assert.include( branches, expected );
  });
});