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

    return parser;

})));
