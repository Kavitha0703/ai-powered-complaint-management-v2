const { match } = require('path-to-regexp');
const fn = match('*all');
console.log('match / :', fn('/'));
console.log('match /foo :', fn('/foo'));
