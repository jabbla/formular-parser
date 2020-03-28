export function error(type, lexeme) {
    switch(type) {
        case 'lex': throw new Error(`非法字符: ${lexeme}`);
        case 'syntax': throw new Error(`语法错误: ${lexeme}`);
        case 'end': throw new Error(`不应以 ${lexeme} 结尾`);
        default: throw new Error(`未知错误`);
    }
}