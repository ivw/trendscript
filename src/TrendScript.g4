grammar TrendScript;

program: declarationList EOF;

declarationList: NL* (declaration (NL+ declaration)* NL*)?;

declaration
  : 'var' Name '=' numberExpression # VarDeclaration
  | 'date' Name '=' datePattern # DateDeclaration
  | 'at' datePatternExpression ',' action # RuleDeclaration
  ;

action
  : Name actionOperator numberExpression # OperatorAction
  | 'if' '(' booleanExpression ')' '{' ifAction=action '}'
    ('else' '{' elseAction=action '}')? # ConditionalAction
  ;

actionOperator: '=' | '+=' | '-=' | '*=' | '/=';

numberExpression
  : '-'? DecimalLiteral # LiteralNumberExpression
  | Name # ReferenceNumberExpression
  | numberExpression numberOperator numberExpression # OperatorNumberExpression
  ;

numberOperator: '+' | '-' | '*' | '/';

datePatternExpression: datePattern | Name;

datePattern: datePatternPart '/' datePatternPart '/' datePatternPart;
datePatternPart: ('-'? DecimalLiteral) | '*';

booleanExpression: numberExpression comparisonOperator numberExpression;

comparisonOperator: '==' | '>' | '<' | '>=' | '<=';

// LEXER TOKENS

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
