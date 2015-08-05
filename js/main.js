/*! extempore-docs-website 2015-08-05 */
"use strict";

var MAX_DOCS_SHOWN = 50, DocumentBox = React.createClass({
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
        }, request.send(), window.location.hash && this.setState({
            searchTerm: window.location.hash.slice(1)
        }), window.onpopstate = function(evt) {
            _this.setState({
                searchTerm: window.location.hash.slice(1)
            });
        };
    },
    render: function() {
        return React.createElement("div", {
            className: "documentBox"
        }, React.createElement("h1", null, "Extempore Documentation"), React.createElement(SearchForm, {
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
        var newCats = _.map(this.state.categories, function(category) {
            return category.name == name ? {
                name: category.name,
                active: active
            } : category;
        });
        this.setState({
            categories: newCats
        });
    },
    handleSearchTerm: function(newTerm) {
        history.pushState ? history.pushState(null, null, "#" + newTerm) : location.hash = "#" + newTerm, 
        this.setState({
            searchTerm: newTerm
        });
    },
    componentDidUpdate: function(previousProps, previousState) {
        previousState.searchTerm !== this.state.searchTerm ? this.updateDocsList() : _.isEqual(previousState.categories, this.state.categories) || this.updateDocsList();
    },
    updateDocsList: function() {
        var newData, _this = this, filteredData = _.chain(this.state.fullData).filter(function(doc) {
            return _.startsWith(doc.name.toLowerCase(), _this.state.searchTerm.toLowerCase());
        }).filter(function(doc) {
            var activeCategories = _.chain(_this.state.categories).filter("active").pluck("name").value();
            return _.contains(activeCategories, doc.category);
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
        var docItems = this.props.data.map(function(doc, index) {
            return React.createElement(DocumentItem, {
                key: doc.category + " " + doc.name,
                category: doc.category,
                name: doc.name,
                args: doc.args,
                type: doc.type,
                docstring: doc.docstring,
                odd: index % 2 === 1
            });
        });
        return React.createElement("div", {
            className: "documentList"
        }, docItems);
    }
}), DocumentItem = React.createClass({
    displayName: "DocumentItem",
    fragmentPoly: function(ds) {
        if (ds.docstringPoly.length > 0) {
            var polyItems = ds.docstringPoly.map(function(x, index) {
                var hrefHash = "#" + x[0];
                return React.createElement("p", {
                    key: x[0]
                }, " ", React.createElement("a", {
                    href: hrefHash
                }, x[0], ":", x[1]));
            });
            return React.createElement("tr", null, React.createElement("td", {
                className: "col-md-2 description"
            }, "Poly"), React.createElement("td", null, polyItems));
        }
        return void 0;
    },
    fragmentSees: function(ds) {
        if (ds.docstringSees.length > 0) {
            var seeItems = ds.docstringSees.map(function(x, index) {
                var hrefHash = "#" + x[0];
                return React.createElement("p", null, " ", React.createElement("a", {
                    href: hrefHash
                }, x[0], " - ", x[1]));
            });
            return React.createElement("tr", null, React.createElement("td", {
                className: "col-md-2 description"
            }, "See"), React.createElement("td", null, seeItems));
        }
        return void 0;
    },
    fragmentReturns: function(ds) {
        if (_.isNull(this.props.args)) return void 0;
        this.props.args[0];
        return ds.docstringReturn.length > 0 ? React.createElement("tr", null, React.createElement("td", {
            className: "description"
        }, "Returns"), React.createElement("td", null, React.createElement("p", null, " ", ds.returns, " "))) : void 0;
    },
    fragmentParams: function(ds) {
        if (_.isNull(this.props.args) || this.props.args.length < 2) return void 0;
        var inputTypes = this.props.args.slice(1), argumentItems = [];
        return inputTypes.forEach(function(arg, index) {
            var paramDescription = _.chain(ds.docstringParams).filter(function(x, index) {
                return x[0] === arg[0];
            }).pluck(1).first().value();
            argumentItems.push(React.createElement("tr", {
                key: index
            }, React.createElement("td", null, arg[0]), React.createElement("td", null, arg[1]), React.createElement("td", null, paramDescription)));
        }), React.createElement("tr", null, React.createElement("td", {
            className: "col-md-2 description"
        }, " Parameters "), React.createElement("td", null, React.createElement("table", {
            className: "table"
        }, React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, "Parameter Name"), React.createElement("th", null, "Type"), React.createElement("th", null, "Parameter Description"))), React.createElement("tbody", null, argumentItems))));
    },
    fragmentDescription: function(ds) {
        return ds.longDescription.length > 0 ? React.createElement("tr", null, React.createElement("td", {
            className: "col-md-2 description"
        }, React.createElement("p", null, "Long Description")), React.createElement("td", null, React.createElement("p", null, ds.longDescription))) : void 0;
    },
    renderCallable: function() {
        var parsedDocstring = parseDocstring(this.props.docstring || ""), description = this.fragmentDescription(parsedDocstring), paramsTable = this.fragmentParams(parsedDocstring), returns = this.fragmentReturns(parsedDocstring), sees = this.fragmentSees(parsedDocstring);
        return React.createElement("tbody", null, description, paramsTable, returns, sees);
    },
    renderNonCallables: function() {
        var parsedDocstring = parseDocstring(this.props.docstring || ""), description = this.fragmentDescription(parsedDocstring);
        return React.createElement("tbody", null, description);
    },
    renderPolyClosure: function() {
        var parsedDocstring = parseDocstring(this.props.docstring || ""), description = this.fragmentDescription(parsedDocstring), sees = this.fragmentSees(parsedDocstring), polys = this.fragmentPoly(parsedDocstring);
        return React.createElement("tbody", null, description, polys, sees);
    },
    render: function() {
        var body, parsedDocstring = parseDocstring(this.props.docstring || ""), functionHeading = React.createElement("h2", {
            className: "documentName code"
        }, this.props.name, React.createElement("span", {
            className: "documentCategory"
        }, this.props.category));
        _.contains([ "builtin", "closure", "named type", "generic closure" ], this.props.category) ? body = this.renderCallable() : "type alias" === this.props.category || "global var" === this.props.category ? body = this.renderNonCallables() : "polymorphic closure" === this.props.category && (body = this.renderPolyClosure());
        var classes = "documentItem";
        return this.props.odd && (classes += " odd"), React.createElement("div", {
            className: classes
        }, functionHeading, React.createElement("p", null, parsedDocstring.shortDescription), React.createElement("table", {
            className: "table table-bordered"
        }, React.createElement("thead", null), body));
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
            onChange: this.handleOnChange,
            value: this.props.searchTerm
        })), " ", React.createElement("div", {
            className: "form-group"
        }, React.createElement("div", {
            className: "btn-group",
            "data-toggle": "buttons"
        }, buttons), " "), " "));
    },
    handleOnChange: function(evt) {
        this.props.onSearchUpdate(evt.target.value);
    },
    handleCategoryUpdate: function(active, name) {
        this.props.onCategoryUpdate(active, name);
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

var parseType = function(typeString) {
    var currentState = void 0, nestedTypeStack = [], typesList = [], currentType = "";
    if ("[" !== typeString[0] && "<" !== typeString[0]) return [ typeString ];
    var states = {
        start: function(character) {
            return states.readType;
        },
        simpleType: function(character) {
            return currentType += character, states.simpleType;
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
}, SHORT_DESCRIPTION_RE = /^(.*)(\n|$)/, LONG_DESCRIPTION_RE = /(?:[\n\r]+)(?!@)([\w\s\S]*?)(?:(\n+@)|$)/, DOCSTRING_PARAM = /@param(?: )?(\w*)? - (.*)/gm, DOCSTRING_RETURN = /@return(?:.*?) - (.*)/gm, DOCSTRING_SEE = /@see (.*?) - (.*)/g, DOCSTRING_POLY = /@poly (.*?):(.*)/g, DOCSTRING_EXAMPLE = /@example([\w\s\S]*?)(\n@|$)/g, parseDocstring = function(docstring) {
    for (var regexArray, paramsList = [], seeList = [], examplesList = [], polyList = []; null !== (regexArray = DOCSTRING_PARAM.exec(docstring)); ) paramsList.push([ regexArray[1] || "", regexArray[2] ]);
    for (;null !== (regexArray = DOCSTRING_SEE.exec(docstring)); ) seeList.push([ regexArray[1], regexArray[2] ]);
    for (;null !== (regexArray = DOCSTRING_EXAMPLE.exec(docstring)); ) examplesList.push(regexArray[1]);
    for (;null !== (regexArray = DOCSTRING_POLY.exec(docstring)); ) polyList.push([ regexArray[1], regexArray[2] ]);
    return {
        shortDescription: _.get(SHORT_DESCRIPTION_RE.exec(docstring), 1, ""),
        longDescription: _.get(LONG_DESCRIPTION_RE.exec(docstring), 1, ""),
        docstringParams: paramsList,
        docstringReturn: _.get(DOCSTRING_RETURN.exec(docstring), 1, ""),
        docstringSees: seeList,
        docstringExamples: examplesList,
        docstringPoly: polyList
    };
};