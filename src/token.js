export const CHAR_MAPS = {
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

export const tokenTypeEq = (token, charMap) => token.type === charMap.key;