
// state machine for getting types
var parseType = function(typeString){
    var currentState = undefined,
        nestedTypeStack = [],
        closureCount = 0,
        tupleCount = 0,
        arrayCount = 0,
        vectorCount = 0,
        typesList = [],
        currentType = "";
    
    // shortcircuit on non callable or non type typestrings
    if (!(typeString[0] === '[' || typeString[0] === '<')){    
        return [typeString];
    }
    
    var states = {
        start: function(character) {
            return states.readType;
        },
        
        simpleType: function(character) {
            currentType += character;
            return states.simpleType;
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

// // testing for state machine //
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
//      ["BTree:<!v,BTree*,BTree*>*", "BTree:<!b,BTree*,BTree*>*", "[!v,!r]*"]],
//     ["<i8*,i32,i8*,i64,clsvar*>", ["i8*", "i32","i8*", "i64", "clsvar*"]],
//     ["<i64,i8*>", ["i64", "i8*"]],
//     ["<i8*,i64,i64,i64,mzone*>", ["i8*", "i64", "i64", "i64", "mzone*"]],
//     ["i32", ["i32"]],
//     ["float", ["float"]],
// ];

// testTypeStrings.forEach(function(x) {
//     var result = parseType(x[0]);
// });

var SHORT_DESCRIPTION_RE = /^(.*)(\n|$)/;
var LONG_DESCRIPTION_RE = /(?:[\n\r]+)(?!@)([\w\s\S]*?)(?:(\n+(@|$))|$)/g;
var DOCSTRING_PARAM = /@param(?: )?(\w*)? - (.*)(@|$)/gm;
var DOCSTRING_RETURN = /@return(?:.*?) - (.*?)(?:(@|$))/gm;
var DOCSTRING_SEE = /@see (\w*?) - (.*?)(?:(\n@|$))/gm;
var DOCSTRING_EXAMPLE = /@example([\w\s\S]*?)(\n@|$)/g;

var parseDocstring = function(docstring) {
    var regexArray, 
        paramsList = [],
        seeList = [],
        examplesList = [];
    
    while ((regexArray = DOCSTRING_PARAM.exec(docstring)) !== null) {
        paramsList.push([regexArray[1]|| "", regexArray[2]]);
    }

    while ((regexArray = DOCSTRING_SEE.exec(docstring)) !== null) {
        seeList.push([regexArray[1], regexArray[2]]);
    }
    
    while ((regexArray = DOCSTRING_EXAMPLE.exec(docstring)) !== null) {
        examplesList.push(regexArray[1]);
    }
    
    return {
        shortDescription: _.get(SHORT_DESCRIPTION_RE.exec(docstring), 1, ""),
        longDescription: _.get(LONG_DESCRIPTION_RE.exec(docstring), 1, ""),
        docstringParams: paramsList,
        docstringReturn: _.get(DOCSTRING_RETURN.exec(docstring), 1, ""),
        docstringSees: seeList,
        docstringExamples: examplesList,
    };
};

var testDocstrings = [
    ["Takes a String* and returns the size of allocated memory\n\nNot necessarily the same as String_length\n@param str - the String\n@return size - size of alloc'ed memory", 
     { shortDescription: "Takes a String* and returns the size of allocated memory",
       longDescription: "Not necessarily the same as String_length",
       docstringParams: [["str", "the String"]],
       docstringReturn: "size of alloc'ed memory",
       docstringSees: [],
       docstringExamples: [],
     }],
    ["a (one-line) description of the function: this is Ben's great function for adding two numbers together\n\
\n\
Here's some more detail. Sometimes, you just need to add two numbers.\n\
And the + operator just isn't up to the job.  Well, that's when you need\n\
bens_great_function (well, as long as the numbers are i64).\n\
\n\
@param - the first number to add\n\
@param - the second number to add\n\
@return - the sum of the two input arguments\n\
@example\n\
(bens_great_function 4 7) ;; returns 11\n\
@see bens_other_great_function - another great function to check out", 
     { shortDescription: "a (one-line) description of the function: this is Ben's great function for adding two numbers together",
       longDescription: "Here's some more detail. Sometimes, you just need to add two numbers.\n\
And the + operator just isn't up to the job.  Well, that's when you need\n\
bens_great_function (well, as long as the numbers are i64).",
       docstringParams: [["", "the first number to add"], ["", "the second number to add"]],
       docstringReturn: "the sum of the two input arguments",
       docstringExamples: ["\n(bens_great_function 4 7) ;; returns 11"],
       docstringSees: [['bens_other_great_function', 'another great function to check out']]
     }],
    ["Just a short description", 
     { shortDescription: "Just a short description",
       longDescription: "",
       docstringParams: [],
       docstringReturn: "",
       docstringSees: [],
       docstringExamples: [],
     }],
    ["Return an i8* pointer to the underlying char array\n\
\n\
@param str\n\
@return c_str - the underlying i8 'char' array", 
     {shortDescription: "Return an i8* pointer to the underlying char array",
      longDescription: "",
      docstringParams: [],
      docstringReturn: "the underlying i8 'char' array",
      docstringSees: [],
      docstringExamples: [],
     }],
];

testDocstrings.forEach(function(x) {
    var result = parseDocstring(x[0]);
    var eq = _.isEqual(result, x[1]);
    if (eq){
        console.log(eq);
    } else {
        console.log("not equal");
        console.log("result", JSON.stringify(result, null, 4));
        console.log("expected", JSON.stringify(x[1], null, 4));
        console.log('\n');
    }
});
