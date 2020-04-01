(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.formulaParser = factory());
}(this, (function () { 'use strict';

    const CHAR_MAPS = {
        ALPHABET: {
            key: 'ALPHABET',
            pattern: /[a-zA-Z]/,
        },
        LEFT_PARENTHESES: {
            key: 'LEFT_PARENTHESES',
            pattern: /[\uff08\u0028]/,
        },
        RIGHT_PARENTHESES: {
            key: 'RIGHT_PARENTHESES',
            pattern: /[\uff09\u0029]/,
        },
        PLUS: {
            key: 'addition',
            pattern: /\+/,
        },
        SUBTRACT: {
            key: 'subtraction',
            pattern: /-/,
        },
        MULTIPLE: {
            key: 'multiplication',
            pattern: /[\*×]/,
        },
        DIVISION: {
            key: 'division',
            pattern: /[\/÷]/,
        },
        END: {
            key: 'END',
        }
    };

    const tokenTypeEq = (token, charMap) => token.type === charMap.key;

    function error(type, lexeme) {
        switch(type) {
            case 'lex': throw new Error(`非法字符: ${lexeme}`);
            case 'syntax': throw new Error(`语法错误: ${lexeme}`);
            case 'end': throw new Error(`不应以 ${lexeme} 结尾`);
            default: throw new Error(`未知错误`);
        }
    }

    function lexer(input) {
        const tokens = [];
        const CHAR_MAPS_VALUES = Object.values(CHAR_MAPS);

        for(let i = 0; i < input.length; i++) {
            const char = input[i];
            const charMap = CHAR_MAPS_VALUES.find(charMap => charMap.pattern && charMap.pattern.test(char));

            if(!charMap) {
                error('lex', char);
            }

            tokens.push({
                type: charMap.key,
                lexeme: char,
            });
        }
        tokens.push({
            type: CHAR_MAPS.END.key
        });

        return tokens;
    }

    function createAstNode(defaultNode, transformer) {
        return transformer? transformer(defaultNode) : defaultNode;
    }

    function parser(input, options = {}) {
        const { astTransformer } = options;
        const tokens = lexer(input);
        let index = 0;

        function match(charMap) {
            if(!tokenTypeEq(tokens[index], charMap)) {
                error('syntax', tokens[index - (tokenTypeEq(tokens[index], CHAR_MAPS.END)? 1 : 0)].lexeme);
            }
            index++;
        }
        function additiveExp() {
            let node = multiplicativeExp();
            
            while([CHAR_MAPS.PLUS.key, CHAR_MAPS.SUBTRACT.key].includes(tokens[index].type)) {
                index++;
                node = createAstNode({
                    opt: tokens[index - 1].type,
                    leftNode: node,
                    rightNode: multiplicativeExp()
                }, astTransformer);
            }

            return node;
        }    function multiplicativeExp() {
            let node = atomicExp();

            while([CHAR_MAPS.MULTIPLE.key, CHAR_MAPS.DIVISION.key].includes(tokens[index].type)) {
                index++;
                node = createAstNode({
                    opt: tokens[index - 1].type,
                    leftNode: node,
                    rightNode: atomicExp()
                }, astTransformer);
            }
            return node;
        }    function atomicExp() {
            let node;

            switch(tokens[index].type) {
                case CHAR_MAPS.LEFT_PARENTHESES.key:
                    index++;
                    node = additiveExp();
                    match(CHAR_MAPS.RIGHT_PARENTHESES);
                    break;
                case CHAR_MAPS.ALPHABET.key:
                    node = createAstNode({
                        opt: 'atomic',
                        value: tokens[index].lexeme
                    }, astTransformer);
                    index++;
                    break;
                default: error('syntax', tokens[index - (tokenTypeEq(tokens[index], CHAR_MAPS.END)? 1 : 0)].lexeme);
            }

            return node;
        }    let ast = additiveExp();
        if(!tokenTypeEq(tokens[index], CHAR_MAPS.END)) {
            error('syntax', tokens[index].lexeme);
        }

        return ast;
    }

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
        });
    });

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
        ];

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

    function parser$1(input) {
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
    }

    function getParser(type = 'recursiveDescent') {
        return {
            recursiveDescent: parser,
            ll: parser$1
        }[type];
    }

    return getParser;

})));
