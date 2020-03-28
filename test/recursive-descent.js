const getParser = require('../dist/bundle');

console.log(getParser('ll')('(A+(B*C))'));