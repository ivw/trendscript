grammar TrendScript;

program: declarationList EOF;

declarationList: NL* (declaration (NL+ declaration)* NL*)?;

declaration
  : 'var' Name '=' number # VarDeclaration
  | 'date' Name '=' datePattern # DateDeclaration
  | 'at' (datePattern | Name) ',' action # RuleDeclaration
  ;

action
  : Name ActionOperator (number | Name)
  ;

number: '-'? DecimalLiteral;

datePattern: datePatternPart '/' datePatternPart '/' datePatternPart;
datePatternPart: number | '*';

// LEXER TOKENS

ActionOperator: '+=' | '-=' | '*=' | '/=';

DecimalLiteral
  : DecimalIntegerLiteral '.' DecimalIntegerLiteral ExponentPart?
  | '.' DecimalIntegerLiteral ExponentPart?
  | DecimalIntegerLiteral ExponentPart?
  ;

fragment DecimalIntegerLiteral: [0-9]+;

fragment ExponentPart: [eE] [+-]? [0-9]+;

Name: [a-zA-Z0-9]+;

NL: [\r\n]+;

WS: [ \t\u000C]+ -> skip;

LineComment: '//' ~[\r\n]* -> channel(HIDDEN);
