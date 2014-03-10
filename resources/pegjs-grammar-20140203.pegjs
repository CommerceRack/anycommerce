dataTLC
 = grammar+

grammar
 = cmd:(IfStatement) _ lb* { return cmd; }
 / cmd:(WhileLoopStatement) _ lb* { return cmd; }
 / cmd:(ForeachLoopStatement) _ lb* { return cmd; }
 / cmd:(BindStatement) _ lb* { return cmd; } 
 / cmd:(SetStatement) _ lb* { return cmd; } 
 / cmd:(ExportStatement) _ lb* { return cmd; } 
 / cmd:(command) _ lb* { return cmd; }

command
 = _ module:([a-z_]+ "#")? cmd:[a-z?]+ args:((ws+ value)+)? _ lb* {
     return {
       type: "command",
       module: module ? module[0].join("") : "core",
       name: cmd.join("").toLowerCase(),
       args: args ? args.map(function(a) { return a[1] }) : null
     }
   }


// ** BIND **
// bind $var 'something'; (jsonpath lookup)
// bind $var $someothervar; (jsonpath lookup)
// bind $var ~tag; (returns tag id/path)
// bind ~tag '#tagid'; jQuery('#tagid')
// bind ~tag $tagid jQuery($tagid)
BindStatement
 = "bind" _ set:(variable / tag) _ src:(variable / scalar / tag) _ lb+ {
  return { type:"BIND", Set:set, Src:src }
  }


// ** EXPORT **
// export 'dataset-var' $var
ExportStatement
= "export" _ set:(variable / tag) _ src:(variable / scalar ) _ lb+ {
  return { type:"EXPORT", Set:set, Src:src }
  }


// ** SET ** 
// set $dst $src --path='.xyz';
SetStatement
 = "set" _ set:(variable / tag) _ src:(variable / scalar / tag) args:((ws+ value)+)? _ lb+ {
  return { type:"SET", Set:set, Src:src, args: args ? args.map(function(a) { return a[1] }) : null }
  }

// if (command) {{ }} else {{ }};
IfStatement
  = "if" _ "(" _ condition:command _ ")" _ ifStatement:Block elseStatement:(_ "else" _ Block)? _ lb+ {
      return ({
        type: "IF",
        When: condition,
        IsTrue: ifStatement,
        IsFalse: elseStatement !== null ? elseStatement[3] : null
      });
   }

// while (something) {{ inner loop }};
WhileLoopStatement
  = "while" _ "(" _ condition:command _ ")" _ whileStatement:Block lb+ {
      return ({
        type: "WHILE",
        While: condition,
        Loop: whileStatement,
      });
   }


// foreach $item in $items {{ inner loop }};
ForeachLoopStatement
  = "foreach" _ set:(variable) _ "in" _ members:(variable) _ loop:Block lb+ {
      return ({
        type: "FOREACH",
        Set: set,
        Members: members,
        Loop: loop,
      });
   }


Block
  = "{{" _ statements:(StatementList _)? "}}" {
      return {
        type: "Block",
        statements: statements !== null ? statements[0][0] : []
      };
    }

StatementList
  = head:Statement tail:(_ Statement)* {
      var result = [head];
      for (var i = 0; i < tail.length; i++) {
        result.push(tail[i][1]);
      }
      return result;
    }

Statement
  = Block
  / BindStatement+
  / command+
  



/* value types */

// ~tag is a reference to a jquery object
tag
 = "~" tag:([a-zA-Z]+) {
   // tag table should maintain reference to tags on DOM
   return { type:"tag", tag:tag.join(""), jq:null }
   }

boolean
 = "true" {return{ "type":"boolean", "value": true }}
 / "false" {return{ "type":"boolean", "value": false }}

// longopt start with a --
longopt
 = "--" k:([a-zA-Z]+) "=" v:( value ) {
    return {
       type: "longopt",
       key: k.join(""),
       value: v
       }
    }
 / "--" k:([a-zA-Z]+) {
    return {
      type: "longopt",
      key: k.join(""),
      value: null
      }
    }


// scalar (string)
// NOTE: at this point there is no way to escape a ' in a string.
//
scalar
 = "'" v:([^']*) "'" {
     return {
       type: "scalar",
       value: v.join("")
     }
   }

// Variables can't start with a number
variable
 = "$" v:([a-zA-Z0-9_]*) {
     return {
       type: "variable",
       value: v.join("")
     }
   }

integer
  = digits:[0-9]+ {
      return {
        type: "integer",
        value: parseInt(digits.join(""), 10)
      }
    }

hexcolor
  = "#" v:([A-Fa-f0-9][A-Fa-f0-9][A-Fa-f0-9][A-Fa-f0-9][A-Fa-f0-9][A-Fa-f0-9]) {
     return { type:"hexcolor", value: v.join("") }
     }

additive
  = left:muldiv _ sign:[+-] _ right:additive {
      return {
        type: "command",
        name:sign,
        args:[left,right]
      }
    }
  / muldiv

muldiv
  = left:primary _ sign:[*/] _ right:muldiv {
      return {
        type: "command",
        name: sign,
        args:[left, right]
      }
    }
  / primary

primary
  = (variable / integer)
  / "(" _ additive:additive _ ")" { return additive; }

value
 = longopt / variable / integer / scalar / boolean / tag / hexcolor / additive

// /* i am a comment (i can only appear before a command) */
comment
  = "/*" (!"*/" SourceCharacter)* "*/" { return{}; }

SourceCharacter
  = .

ws
 = [ \t\n]

_
 = (ws / comment)*

lb
 = ";"

