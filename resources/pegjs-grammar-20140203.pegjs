start
 = call+

call
 = grammar 

grammar
 = IfStatement _ lb*
 / command:(command) _ lb* { return command }


command
 = _ cmd:[A-Za-z0-9?]+ args:((ws+ value)+)? _ lb* {
     return {
       type: "command",
       name: cmd.join("").toLowerCase(),
       args: args ? args.map(function(a) { return a[1] }) : null
     }
   }


IfStatement
  = "if" _ "(" _ condition:command _ ")" _ ifStatement:Block elseStatement:(_ "else" _ Block)? _ lb+ {
      return {
        type:     "IfStatement",
        When:     condition,
        IsTrue:   ifStatement,
        IsFalse: elseStatement !== null ? elseStatement[3] : null
      };
   }


Block
  = "{{" _ statements:(StatementList _)? "}}" {
      return {
        type:       "Block",
        statements: statements !== null ? statements[0] : []
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
  / command+
  



/* value types */

boolean 
 = "true" {return{ "type":"boolean", "value": true }}
 / "false" {return{ "type":"boolean", "value": false }}

// longopt start with a --
longopt
 = "--" k:([a-zA-Z]+) "=" v:( value )  {
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
     return { type:"hexcolor", value: v.join("")  }
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
 = longopt / variable / integer / scalar / boolean / hexcolor / additive 

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

