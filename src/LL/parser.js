import { CHAR_MAPS, tokenTypeEq } from '../token';
import lexer from '../lexer';
import { error } from '../utils';

/**
 * Sentence -> AddExp
 */
function Sentence() {
    return {
        bnf: [AddExp],
        firstSet: [CHAR_MAPS.ALPHABET, CHAR_MAPS.LEFT_PARENTHESES],
    };
}

/**
 * AddExp -> MulExp AddExp1
 */
function AddExp() {
    return {
        bnf: [MulExp, AddExp1],
        firstSet: [CHAR_MAPS.ALPHABET, CHAR_MAPS.LEFT_PARENTHESES],
    };
}

/**
 * AddExp1 -> add MulExp AddExp1 | epsilon（空）
 */
function AddExp1() {
    return {
        bnf: [add, MulExp, AddExp1],
        firstSet: [CHAR_MAPS.PLUS, CHAR_MAPS.SUBTRACT],
        hasEpsilon: true,
        followSet: [CHAR_MAPS.RIGHT_PARENTHESES, CHAR_MAPS.END],
    }
}

/**
 * MulExp -> Exp MulExp1
 */
function MulExp() {
    return {
        bnf: [Exp, MulExp1],
        firstSet: [CHAR_MAPS.ALPHABET, CHAR_MAPS.LEFT_PARENTHESES]
    };
}

/**
 * MulExp1 -> mul Exp MulExp1 | epsilon（空）
 */
function MulExp1() {
    return {
        bnf: [mul, Exp, MulExp1],
        firstSet: [CHAR_MAPS.MULTIPLE, CHAR_MAPS.DIVISION],
        hasEpsilon: true,
        followSet: [CHAR_MAPS.PLUS, CHAR_MAPS.SUBTRACT, CHAR_MAPS.RIGHT_PARENTHESES, CHAR_MAPS.END],
    };
}

/**
 * Exp -> Alphabet | (AddExp)
 */
function Exp(token) {
    const bnf = tokenTypeEq(token, CHAR_MAPS.ALPHABET)? [alphabet] : [
        leftParentheses,
        AddExp,
        rightParentheses
    ]

    return  {
        bnf,
        firstSet: [CHAR_MAPS.ALPHABET, CHAR_MAPS.LEFT_PARENTHESES],
    };
}

/**
 * mul -> * | /
 */
function mul(token) {
    const bnf = tokenTypeEq(token, CHAR_MAPS.MULTIPLE)? [multiple] : [division];

    return {
        bnf,
        firstSet: [CHAR_MAPS.MULTIPLE, CHAR_MAPS.DIVISION],
    };
}

function multiple() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.MULTIPLE],
    };
}

function division() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.DIVISION],
    };
}


/**
 * add -> + | -
 */
function add(token) {
    const bnf = tokenTypeEq(token, CHAR_MAPS.PLUS)? [plus] : [subtract];

    return {
        bnf,
        firstSet: [CHAR_MAPS.PLUS, CHAR_MAPS.SUBTRACT],
    };
}

function plus() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.PLUS],
    };
}

function subtract() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.SUBTRACT],
    };
}

function alphabet() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.ALPHABET],
    };
}

function leftParentheses() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.LEFT_PARENTHESES],
    };
}

function rightParentheses() {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.RIGHT_PARENTHESES],
    };
}

export default function parser(input) {
    let index = 0;
    const tokens = lexer(input);
    const stack = [Sentence];

    function match(gram) {
        console.log(index);
        return gram.firstSet.some(charMap => tokenTypeEq(tokens[index], charMap));
    }

    function followMatch(gram) {
        return gram.hasEpsilon && gram.followSet.some(charMap => tokenTypeEq(tokens[index], charMap));
    }

    function isTerminal(gram) {
        return !gram.bnf.length;
    }
    
    while(stack.length) {
        const topItem = stack[0](tokens[index]);
        if(match(topItem)) {
            stack.splice(0, 1, ...topItem.bnf);
            if(isTerminal(topItem)) {
                index++;
            }
        } else if(followMatch(topItem)) {
            stack.splice(0, 1);
        } else {
            console.log(tokens[index]);
            error('syntax', tokens[index].lexeme);
        }
    }
};
