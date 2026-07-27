const { match } = require('path-to-regexp');
const fn2 = match('/*path');
console.log('/*path match / :', fn2('/'));
console.log('/*path match /foo :', fn2('/foo'));
const fn3 = match('{/*path}');
console.log('{/*path} match / :', fn3('/'));
console.log('{/*path} match /foo :', fn3('/foo'));
