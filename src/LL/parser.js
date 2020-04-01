import { tokenTypeEq } from '../token';
import lexer from '../lexer';
import { error } from '../utils';
import { Sentence } from './grammar';

export default function parser(input) {
    let index = 0;
    const tokens = lexer(input);
    const stack = [Sentence];
    const astArray = [];

    function match(gram) {
        return gram.firstSet.some(charMap => tokenTypeEq(tokens[index], charMap));
    }

    function followMatch(gram) {
        return gram.hasEpsilon && gram.followSet.some(charMap => tokenTypeEq(tokens[index], charMap));
    }

    function isTerminal(gram) {
        return !gram.bnf.length;
    }

    function isStop(gram) {
        return !!gram.isStop;
    }

    function processTerminal(gram) {
        const { astCreator } = gram;
        if(astCreator) {
            astArray.push(astCreator());
        }
    }
    
    while(stack.length) {
        const topItem = stack[0](tokens[index]);
        if(isStop(topItem)) {
            topItem.astCreator(astArray);
            stack.splice(0, 1);
        }else if(match(topItem)) {
            stack.splice(0, 1, ...topItem.bnf);
            if(isTerminal(topItem)) {
                processTerminal(topItem);
                index++;
            }
        } else if(followMatch(topItem)) {
            stack.splice(0, 1);
        } else {
            console.log(tokens[index]);
            error('syntax', tokens[index].lexeme);
        }
    }

    return astArray[0];
};
