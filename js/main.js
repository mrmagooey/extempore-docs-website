
// the maximum number of documentation artifacts that will be displayed at a time
"use strict";

var MAX_DOCS_SHOWN = 30;

var DocumentBox = React.createClass({
    displayName: "DocumentBox",

    getInitialState: function getInitialState() {
        return {
            status: "",
            currentData: [],
            fullData: [],
            searchTerm: "",
            categories: [{
                name: "builtin",
                active: true
            }, {
                name: "polymorphic closure",
                active: true
            }, {
                name: "closure",
                active: true
            }, {
                name: "type alias",
                active: true
            }, {
                name: "named type",
                active: true
            }, {
                name: "generic closure",
                active: true
            }, {
                name: "global var",
                active: true
            }, {
                name: "C function",
                active: false
            }]
        };
    },

    componentDidMount: function componentDidMount() {
        var _this = this;
        var request = new XMLHttpRequest();
        request.open('GET', this.props.url, true);

        request.onload = function (data) {
            var jsonData = JSON.parse(request.responseText);
            var sortedJsonData = _.sortBy(jsonData, function (a) {
                return a.name.toLowerCase();
            });
            _this.setState({ fullData: sortedJsonData });
            _this.updateDocsList(); // start with no filter in place
        };
        request.send();
    },

    render: function render() {
        return React.createElement(
            "div",
            { className: "documentBox" },
            React.createElement(
                "h1",
                null,
                "Documentation"
            ),
            React.createElement(SearchForm, {
                onSearchUpdate: this.handleSearchTerm,
                onCategoryUpdate: this.handleCategoryUpdate,
                categories: this.state.categories,
                searchTerm: this.state.searchTerm
            }),
            React.createElement(DocumentStatus, { status: this.state.status }),
            React.createElement(DocumentList, { data: this.state.currentData })
        );
    },

    handleCategoryUpdate: function handleCategoryUpdate(active, name) {
        var cats = this.state.categories;
        var newCats = _.map(this.state.categories, function (category) {
            if (category.name == name) {
                category.active = active;
            }
            return category;
        });

        this.setState({ categories: newCats }, function () {
            this.updateDocsList();
        });
    },

    handleSearchTerm: function handleSearchTerm(newTerm) {
        this.setState({ searchTerm: newTerm }, function () {
            this.updateDocsList();
        });
    },

    updateDocsList: function updateDocsList() {
        var _this = this;
        var filteredData = _.chain(this.state.fullData).filter(function (a) {
            return _.startsWith(a.name, _this.state.searchTerm);
        }).filter(function (a) {
            var activeCategories = _.chain(_this.state.categories).filter('active').pluck('name').value();
            return _.contains(activeCategories, a.category);
        }).value();

        var newData;
        if (filteredData.length > MAX_DOCS_SHOWN) {
            newData = _.slice(filteredData, 0, MAX_DOCS_SHOWN);
            this.setState({ "status": "Showing " + MAX_DOCS_SHOWN + " records out of " + filteredData.length });
        } else {
            newData = filteredData;
            if (filteredData.length == 0) {
                this.setState({ "status": "No records found" });
            } else {
                this.setState({ "status": "" });
            }
        }

        this.setState({ currentData: newData });
    }

});

var DocumentStatus = React.createClass({
    displayName: "DocumentStatus",

    render: function render() {
        return React.createElement(
            "div",
            { className: "documentStatus" },
            this.props.status
        );
    }
});

var DocumentList = React.createClass({
    displayName: "DocumentList",

    render: function render() {
        var docItems = this.props.data.map(function (doc) {
            return React.createElement(DocumentItem, {
                key: doc.category + doc.name,
                category: doc.category,
                name: doc.name,
                args: doc.args,
                type: doc.type,
                docstring: doc.docstring
            });
        });
        return React.createElement(
            "div",
            { className: "documentList" },
            docItems
        );
    }
});

var DocumentItem = React.createClass({
    displayName: "DocumentItem",

    render: function render() {

        var inputPairs = [];
        if (this.props.args && this.props.type) {
            var args = this.props.args.replace(/[\(\)]+/g, "").replace(/"/g, "").split(' ');
            var types = this.props.type.replace(/[\[\]]+/g, "").split(',');
            var returnType = types[0];
            var inputTypes = types.slice(1);
            if (args.length === inputTypes.length) {
                args.forEach(function (arg, index) {
                    var type = inputTypes[index];
                    inputPairs.push(React.createElement(
                        "li",
                        { key: index },
                        arg,
                        " : ",
                        type
                    ));
                });
            }
        }

        var typeArgs = undefined;
        if (inputPairs.length > 0) {
            typeArgs = inputPairs;
        }

        var docStringElements = undefined;
        if (_.isString(this.props.docstring)) {
            docStringElements = _.chain(this.props.docstring.split('\n')).compact().map(function (doc, index) {
                return React.createElement(
                    "p",
                    { key: index },
                    doc
                );
            }).value();
        }

        var functionHeading = React.createElement(
            "h2",
            { className: "documentName" },
            this.props.name,
            React.createElement(
                "span",
                { className: "documentCategory" },
                this.props.category
            )
        );

        return React.createElement(
            "div",
            { className: "documentItem" },
            functionHeading,
            docStringElements,
            React.createElement(
                "p",
                null,
                "Type Signature: ",
                this.props.type
            ),
            React.createElement(
                "ul",
                null,
                inputPairs
            )
        );
    }
});

var SearchForm = React.createClass({
    displayName: "SearchForm",

    render: function render() {
        var _this = this;
        var buttons = this.props.categories.map(function (category) {
            return React.createElement(CategoryButton, { key: category.name,
                name: category.name,
                active: category.active,
                onCategoryChange: _this.handleCategoryUpdate
            });
        });
        return React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
                "form",
                { className: "searchForm", onSubmit: this.handleSubmit },
                React.createElement(
                    "div",
                    { className: "form-group" },
                    React.createElement("input", { type: "text", ref: "term", className: "form-control", placeholder: "Search", onKeyUp: this.handleKeyPress })
                ),
                " ",
                React.createElement(
                    "div",
                    { className: "form-group" },
                    React.createElement(
                        "div",
                        { className: "btn-group", "data-toggle": "buttons" },
                        buttons
                    ),
                    " "
                ),
                " "
            )
        );
    },

    handleCategoryUpdate: function handleCategoryUpdate(active, name) {
        this.props.onCategoryUpdate(active, name);
    },

    handleKeyPress: function handleKeyPress(evt) {
        var searchTerm = React.findDOMNode(this.refs.term).value;
        this.props.onSearchUpdate(searchTerm);
    },

    // this is to stop the textinput trying to post and refreshing the page
    handleSubmit: function handleSubmit(evt) {
        evt.preventDefault();
    }

});

var CategoryButton = React.createClass({
    displayName: "CategoryButton",

    getInitialState: function getInitialState() {
        return { active: this.props.active };
    },

    handleChange: function handleChange(evt) {
        this.setState({ active: !this.state.active }, function () {
            this.props.onCategoryChange(this.state.active, this.props.name);
        });
    },

    //
    handleFocus: function handleFocus(evt) {
        React.findDOMNode(this).blur();
    },

    render: function render() {
        var classes = "categoryButton btn btn-primary btn-sm ";
        if (this.state.active) {
            classes += 'active';
        }
        return React.createElement(
            "button",
            { tabIndex: "-1",
                className: classes,
                onFocus: this.handleFocus,
                onClick: this.handleChange },
            this.props.name
        );
    }
});

React.render(React.createElement(DocumentBox, { url: "xtmdoc.json" }), document.getElementById('content'));
/*  end form-group */ /* end btn-group */ /* end form-group */
