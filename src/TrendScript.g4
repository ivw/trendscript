grammar TrendScript;

program: declarationList ('options' optionsBlock NL*)? EOF;

declarationList: NL* (declaration (NL+ declaration)* NL*)?;

declaration
  : 'var' Name '=' numberExpression optionsBlock? # VarDeclaration
  | 'date' Name '=' datePattern # DateDeclaration
  | 'at' datePatternExpression ',' action # RuleDeclaration
  ;

action
  : Name actionOperator numberExpression # OperatorAction
  | 'if' '(' booleanExpression ')' ifBlock=actionBlock
    ('else' elseBlock=actionBlock)? # ConditionalAction
  | actionBlock # BlockAction
  ;

actionBlock: '{' NL* (action ((';' | NL+) action)* NL*)? '}';

actionOperator: '=' | '+=' | '-=' | '*=' | '/=' | '**=' | '%=';

numberExpression
  : '-'? DecimalLiteral # LiteralNumberExpression
  | '(' numberExpression ')' # ParenNumberExpression
  | Name # ReferenceNumberExpression
  | numberExpression numberOperator numberExpression # OperatorNumberExpression
  | unaryNumberFunction '(' NL* numberExpression NL* ')' # UnaryFunctionNumberExpression
  | binaryNumberFunction '(' NL* numberExpression (',' | NL+) numberExpression NL* ')' # BinaryFunctionNumberExpression
  ;

numberOperator: '+' | '-' | '*' | '/' | '**' | '%';

unaryNumberFunction: 'sqrt' | 'log' | 'abs' | 'round' | 'floor' | 'ceil';

binaryNumberFunction: 'min' | 'max';

datePatternExpression: datePattern | Name;

datePattern: datePatternPart '-' datePatternPart '-' datePatternPart;
datePatternPart: DecimalLiteral | '*';

booleanExpression
  : numberExpression comparisonOperator numberExpression # ComparisonBooleanExpression
  | '(' booleanExpression ')' # ParenBooleanExpression
  | booleanExpression binaryBooleanOperator booleanExpression # BinaryOperatorBooleanExpression
  ;

comparisonOperator: '==' | '>' | '<' | '>=' | '<=';

binaryBooleanOperator: '&&' | '||' | '==';

optionsBlock: '{' NL* (option ((',' | NL+) option)* NL*)? '}';

option: Name ':' (StringLiteral | numberExpression);

// LEXER TOKENS

DecimalLiteral
  : DecimalIntegerLiteral '.' DecimalIntegerLiteral ExponentPart?
  | '.' DecimalIntegerLiteral ExponentPart?
  | DecimalIntegerLiteral ExponentPart?
  ;

fragment DecimalIntegerLiteral: [0-9]+;

fragment ExponentPart: [eE] [+-]? [0-9]+;

StringLiteral: '"' StringCharacter* '"';

fragment StringCharacter: ~["\\];

Name: [a-zA-Z0-9]+;

NL: [\r\n]+;

WS: [ \t\u000C]+ -> skip;

LineComment: '//' ~[\r\n]* -> channel(HIDDEN);
