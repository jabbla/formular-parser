import { CHAR_MAPS, tokenTypeEq } from '../token';

function createStop(processor) {
    return () => ({
        isStop: true,
        astCreator(astArray) {
            return processor(astArray);
        }
    });
}

const ExpStop = createStop((astArray) => {
    const centerIndex = astArray.length - 2;
    astArray.splice(centerIndex - 1, 3, {
        ...astArray[centerIndex],
        leftNode: astArray[centerIndex - 1],
        rightNode: astArray[centerIndex + 1],
    })
});

/**
 * Sentence -> AddExp
 */
export function Sentence() {
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
        bnf: [add, MulExp, ExpStop, AddExp1],
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
        bnf: [mul, Exp, ExpStop, MulExp1],
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

function multiple(token) {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.MULTIPLE],
        astCreator() {
            return {
                opt: token.type,
                leftNode: {},
                rightNode: {},
            };
        }
    };
}

function division(token) {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.DIVISION],
        astCreator() {
            return {
                opt: token.type,
                leftNode: {},
                rightNode: {},
            };
        }
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

function plus(token) {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.PLUS],
        astCreator() {
            return {
                opt: token.type,
                leftNode: {},
                rightNode: {},
            };
        }
    };
}

function subtract(token) {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.SUBTRACT],
        astCreator() {
            return {
                opt: token.type,
                leftNode: {},
                rightNode: {},
            };
        }
    };
}

function alphabet(token) {
    return {
        bnf: [],
        firstSet: [CHAR_MAPS.ALPHABET],
        astCreator() {
            return {
                opt: 'atomic',
                value: token.lexeme,
            };
        }
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