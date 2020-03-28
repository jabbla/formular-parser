import { CHAR_MAPS, tokenTypeEq } from './token';
import { error } from './utils';
import lexer from './lexer';

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
    };
    function multiplicativeExp() {
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
    };
    function atomicExp() {
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
    };
    let ast = additiveExp();
    if(!tokenTypeEq(tokens[index], CHAR_MAPS.END)) {
        error('syntax', tokens[index].lexeme)
    }

    return ast;
}

export default parser;