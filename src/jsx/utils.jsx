
// state machine for getting types
var getTypes = function(typeString){
    var currentState = undefined,
        nestedTypeStack = [],
        closureCount = 0,
        tupleCount = 0,
        arrayCount = 0,
        vectorCount = 0,
        typesList = [],
        currentType = "";
    
    var states = {
        start: function(character) {
            if (character === '[' || character === '>'){
                return states.readType;
            } else {
                throw "incorrect start character";
            }
        },
        
        readType: function(character){
            currentType += character;
            if (_.contains(["[", "<", "/"], character)){
                nestedTypeStack.push(character);
                return states.withinNestedType;
            } else if (character === '|'){
                // the pipe can be either the start of a array
                // or a boolean or between types
                // if it's the start of a new type then we know it's an array
                // otherwise it is an `or`
                if (currentType.length === 0){
                    nestedTypeStack.push(character);
                    return states.withinNestedType;
                } else {
                    return states.readType;
                }
            } else if (character === ","){
                currentType = currentType.substring(0, currentType.length - 1);
                typesList.push(currentType);
                currentType = "";
                return states.readType;
            } else if (character === ']') {
                currentType = currentType.substring(0, currentType.length - 1);
                typesList.push(currentType);
                return states.finish;
            } else if (character === '>') {
                currentType = currentType.substring(0, currentType.length - 1);
                typesList.push(currentType);
                return states.finish;
            } else {
                return states.readType;
            }
        },
        
        withinNestedType: function(character) {
            var lastNestedType = nestedTypeStack[nestedTypeStack.length -1];
            currentType += character;
            if (_.contains(["[", "<"], character)){
                nestedTypeStack.push(character);
                return states.withinNestedType;
            }
            switch (character) {
            case "]":
                nestedTypeStack.pop();
                if (nestedTypeStack.length === 0){
                    return states.readType;
                } else {
                    return states.withinNestedType;
                }
            case ">":
                nestedTypeStack.pop();
                if (nestedTypeStack.length === 0){
                    return states.readType;
                } else {
                    return states.withinNestedType;
                }
            case "|":
                // TODO this doesn't work for boolean or's
                if (lastNestedType === "|") { // closing states array
                    nestedTypeStack.pop();
                    if (nestedTypeStack.length === 0){ 
                        return states.readType;
                    } else {
                        return states.withinNestedType;
                    }
                } else { //opening new array
                    nestedTypeStack.push('|');
                    return states.withinNestedType;
                }
            case "/":
                if (lastNestedType === "/"){ // closing states vector
                    nestedTypeStack.pop();
                    if (nestedTypeStack.length === 0){
                        return states.readType;
                    } else {
                        return states.withinNestedType;
                    }
                } else {
                    nestedTypeStack.push('/'); // opening new vector
                }
                return states.withinNestedType;
            default:
                return states.withinNestedType;
            }
        },
        
        finish: function(character){
            return states.finish;
        }
    };
    
    currentState = states.start;
    for (var i = 0; i < typeString.length; i++){
        currentState = currentState(typeString[i]);
    }
    return typesList;
};

// testing for state machine //
// var testTypeStrings = [
//     ["[i64,[i32,i8]*]*", ["i64", "[i32,i8]*"]],
//     ["[!a,Point:<!a,!a>*]*", ["!a", "Point:<!a,!a>*"]],
//     ["[i32,i32]*", ["i32", 'i32']],
//     ["[!v,[i32,i8]*]*", ["!v", "[i32,i8]*"]],
//     ["[i64,[i64,i8]*]*", ["i64", "[i64,i8]*"]],
//     ["[!v,!v*,i32|i64,!v]*", ["!v", "!v*", "i32|i64" ,"!v"]],
//     ["[!v*,!v*,i32|i64]*", ["!v*", "!v*", "i32|i64"]],
//     ["[!v,!v*,i32|i64]*", ["!v", "!v*", "i32|i64"]],
//     ["[!v,!v*,...]*", ["!v", "!v*", "..."]],
//     ["[List:<!a,List*>*,[!a,!b,!c,!d]*,List:<!b,List*>*,List:<!c,List*>*,List:<!d,List*>*]*", 
//      ["List:<!a,List*>*", "[!a,!b,!c,!d]*", "List:<!b,List*>*", "List:<!c,List*>*", "List:<!d,List*>*"]],
//     ["[void,float*,float*,i64,i8*]*", ["void", "float*", "float*", "i64", "i8*"]],
//     ["[float,float,i64,i64,float*]*", ["float", "float", "i64", "i64", "float*"]],
//     ["[!ga_103,!ga_103,mzone*,mzone*]*", ["!ga_103", "!ga_103", "mzone*", "mzone*"]],
//     ["[BTree:<!v,BTree*,BTree*>*,BTree:<!b,BTree*,BTree*>*,[!v,!r]*]*", 
//      ["BTree:<!v,BTree*,BTree*>*", "BTree:<!b,BTree*,BTree*>*", "[!v,!r]*"]]
// ];

// testTypeStrings.forEach(function(x) {
//     var result = typeStateMachine(x[0]);
//     console.log(result, x[1], _.isEqual(result, x[1]));
// });

var SHORT_DESCRIPTION_RE = /^.*\n/;
var LONG_DESCRIPTION_RE = /[\w\s\S]*$/gm;

var DOCSTRING_PARAM = /@param (\w)* - (.*)\n/gm;
var DOCSTRING_RETURN = /@return (.*)\n/gm;

var parseDocstring = function(docstring) {
    return {
        shortDescription : docstring.match(SHORT_DESCRIPTION_RE),
        longDescription : docstring.match(LONG_DESCRIPTION_RE),
        docstringParams : docstring.match(DOCSTRING_PARAM),
        docstringReturn : docstring.match(DOCSTRING_RETURN),
    };
};

var getTypeDoctrings = function(docstring) {
    
};
