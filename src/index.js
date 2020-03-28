import recursiveDescentParser from './recursiveDescent/parser';
import llParser from './LL/parser';

export default function getParser(type = 'recursiveDescent') {
    return {
        recursiveDescent: recursiveDescentParser,
        ll: llParser
    }[type];
};