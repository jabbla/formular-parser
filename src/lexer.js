import { CHAR_MAPS } from './token';
import { error } from './utils';

export default function lexer(input) {
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