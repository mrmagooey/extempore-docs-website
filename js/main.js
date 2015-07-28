/*! extempore-docs-website 2015-07-28 */
"use strict";

var MAX_DOCS_SHOWN = 30, DocumentBox = React.createClass({
    displayName: "DocumentBox",
    getInitialState: function() {
        return {
            status: "",
            currentData: [],
            fullData: [],
            searchTerm: "",
            categories: [ {
                name: "builtin",
                active: !0
            }, {
                name: "polymorphic closure",
                active: !0
            }, {
                name: "closure",
                active: !0
            }, {
                name: "type alias",
                active: !0
            }, {
                name: "named type",
                active: !0
            }, {
                name: "generic closure",
                active: !0
            }, {
                name: "global var",
                active: !0
            }, {
                name: "C function",
                active: !1
            } ]
        };
    },
    componentDidMount: function() {
        var _this = this, request = new XMLHttpRequest();
        request.open("GET", this.props.url, !0), request.onload = function(data) {
            var jsonData = JSON.parse(request.responseText), sortedJsonData = _.sortBy(jsonData, function(a) {
                return a.name.toLowerCase();
            });
            _this.setState({
                fullData: sortedJsonData
            }), _this.updateDocsList();
        }, request.send();
    },
    render: function() {
        return React.createElement("div", {
            className: "documentBox"
        }, React.createElement("h1", null, "Documentation"), React.createElement(SearchForm, {
            onSearchUpdate: this.handleSearchTerm,
            onCategoryUpdate: this.handleCategoryUpdate,
            categories: this.state.categories,
            searchTerm: this.state.searchTerm
        }), React.createElement(DocumentStatus, {
            status: this.state.status
        }), React.createElement(DocumentList, {
            data: this.state.currentData
        }));
    },
    handleCategoryUpdate: function(active, name) {
        var newCats = (this.state.categories, _.map(this.state.categories, function(category) {
            return category.name == name && (category.active = active), category;
        }));
        this.setState({
            categories: newCats
        }, function() {
            this.updateDocsList();
        });
    },
    handleSearchTerm: function(newTerm) {
        this.setState({
            searchTerm: newTerm
        }, function() {
            this.updateDocsList();
        });
    },
    updateDocsList: function() {
        var newData, _this = this, filteredData = _.chain(this.state.fullData).filter(function(a) {
            return _.startsWith(a.name, _this.state.searchTerm);
        }).filter(function(a) {
            var activeCategories = _.chain(_this.state.categories).filter("active").pluck("name").value();
            return _.contains(activeCategories, a.category);
        }).value();
        filteredData.length > MAX_DOCS_SHOWN ? (newData = _.slice(filteredData, 0, MAX_DOCS_SHOWN), 
        this.setState({
            status: "Showing " + MAX_DOCS_SHOWN + " records out of " + filteredData.length
        })) : (newData = filteredData, 0 == filteredData.length ? this.setState({
            status: "No records found"
        }) : this.setState({
            status: ""
        })), this.setState({
            currentData: newData
        });
    }
}), DocumentStatus = React.createClass({
    displayName: "DocumentStatus",
    render: function() {
        return React.createElement("div", {
            className: "documentStatus"
        }, this.props.status);
    }
}), DocumentList = React.createClass({
    displayName: "DocumentList",
    render: function() {
        var docItems = this.props.data.map(function(doc) {
            return React.createElement(DocumentItem, {
                key: doc.category + doc.name,
                category: doc.category,
                name: doc.name,
                args: doc.args,
                type: doc.type,
                docstring: doc.docstring
            });
        });
        return React.createElement("div", {
            className: "documentList"
        }, docItems);
    }
}), DocumentItem = React.createClass({
    displayName: "DocumentItem",
    render: function() {
        var types, inputPairs = [];
        if (_.contains([ "builtin", "closure", "named type", "generic closure" ], this.props.category)) {
            types = getTypes(this.props.type);
            var inputTypes = (types[0], types.slice(1)), args = this.props.args.replace(/[\(\)]+/g, "").split(" ");
            args.length === inputTypes.length && args.forEach(function(arg, index) {
                var type = inputTypes[index];
                inputPairs.push(React.createElement("li", {
                    key: index
                }, arg, " : ", type));
            });
        } else "type alias" === this.props.category && (types = this.props.type);
        if (this.props.args && this.props.type) var types = this.props.type.replace(/[\[\]]+/g, "").split(",");
        var typeArgs = void 0;
        inputPairs.length > 0 && (typeArgs = inputPairs);
        var docStringElements = void 0;
        _.isString(this.props.docstring) && (docStringElements = _.chain(this.props.docstring.split("\n")).compact().map(function(doc, index) {
            return React.createElement("p", {
                key: index
            }, doc);
        }).value());
        var functionHeading = React.createElement("h2", {
            className: "documentName"
        }, this.props.name, React.createElement("span", {
            className: "documentCategory"
        }, this.props.category));
        React.createElement("table", {
            className: "table table-bordered"
        });
        return React.createElement("div", {
            className: "documentItem"
        }, functionHeading, docStringElements, React.createElement("p", null, "Type Signature: ", this.props.type), React.createElement("ul", null, inputPairs));
    }
}), SearchForm = React.createClass({
    displayName: "SearchForm",
    render: function() {
        var _this = this, buttons = this.props.categories.map(function(category) {
            return React.createElement(CategoryButton, {
                key: category.name,
                name: category.name,
                active: category.active,
                onCategoryChange: _this.handleCategoryUpdate
            });
        });
        return React.createElement("div", {
            className: "form-group"
        }, React.createElement("form", {
            className: "searchForm",
            onSubmit: this.handleSubmit
        }, React.createElement("div", {
            className: "form-group"
        }, React.createElement("input", {
            type: "text",
            ref: "term",
            className: "form-control",
            placeholder: "Search",
            onKeyUp: this.handleKeyPress
        })), " ", React.createElement("div", {
            className: "form-group"
        }, React.createElement("div", {
            className: "btn-group",
            "data-toggle": "buttons"
        }, buttons), " "), " "));
    },
    handleCategoryUpdate: function(active, name) {
        this.props.onCategoryUpdate(active, name);
    },
    handleKeyPress: function(evt) {
        var searchTerm = React.findDOMNode(this.refs.term).value;
        this.props.onSearchUpdate(searchTerm);
    },
    handleSubmit: function(evt) {
        evt.preventDefault();
    }
}), CategoryButton = React.createClass({
    displayName: "CategoryButton",
    getInitialState: function() {
        return {
            active: this.props.active
        };
    },
    handleChange: function(evt) {
        this.setState({
            active: !this.state.active
        }, function() {
            this.props.onCategoryChange(this.state.active, this.props.name);
        });
    },
    handleFocus: function(evt) {
        React.findDOMNode(this).blur();
    },
    render: function() {
        var classes = "categoryButton btn btn-primary btn-sm ";
        return this.state.active && (classes += "active"), React.createElement("button", {
            tabIndex: "-1",
            className: classes,
            onFocus: this.handleFocus,
            onClick: this.handleChange
        }, this.props.name);
    }
});

React.render(React.createElement(DocumentBox, {
    url: "xtmdoc.json"
}), document.getElementById("content"));

var getTypes = function(typeString) {
    var currentState = void 0, nestedTypeStack = [], typesList = [], currentType = "", states = {
        start: function(character) {
            if ("[" === character || ">" === character) return states.readType;
            throw "incorrect start character";
        },
        readType: function(character) {
            return currentType += character, _.contains([ "[", "<", "/" ], character) ? (nestedTypeStack.push(character), 
            states.withinNestedType) : "|" === character ? 0 === currentType.length ? (nestedTypeStack.push(character), 
            states.withinNestedType) : states.readType : "," === character ? (currentType = currentType.substring(0, currentType.length - 1), 
            typesList.push(currentType), currentType = "", states.readType) : "]" === character ? (currentType = currentType.substring(0, currentType.length - 1), 
            typesList.push(currentType), states.finish) : ">" === character ? (currentType = currentType.substring(0, currentType.length - 1), 
            typesList.push(currentType), states.finish) : states.readType;
        },
        withinNestedType: function(character) {
            var lastNestedType = nestedTypeStack[nestedTypeStack.length - 1];
            if (currentType += character, _.contains([ "[", "<" ], character)) return nestedTypeStack.push(character), 
            states.withinNestedType;
            switch (character) {
              case "]":
                return nestedTypeStack.pop(), 0 === nestedTypeStack.length ? states.readType : states.withinNestedType;

              case ">":
                return nestedTypeStack.pop(), 0 === nestedTypeStack.length ? states.readType : states.withinNestedType;

              case "|":
                return "|" === lastNestedType ? (nestedTypeStack.pop(), 0 === nestedTypeStack.length ? states.readType : states.withinNestedType) : (nestedTypeStack.push("|"), 
                states.withinNestedType);

              case "/":
                return "/" === lastNestedType ? (nestedTypeStack.pop(), 0 === nestedTypeStack.length ? states.readType : states.withinNestedType) : (nestedTypeStack.push("/"), 
                states.withinNestedType);

              default:
                return states.withinNestedType;
            }
        },
        finish: function(character) {
            return states.finish;
        }
    };
    currentState = states.start;
    for (var i = 0; i < typeString.length; i++) currentState = currentState(typeString[i]);
    return typesList;
};