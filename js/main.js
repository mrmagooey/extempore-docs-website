"use strict";

var DocumentBox = React.createClass({
    displayName: "DocumentBox",

    getInitialState: function getInitialState() {
        return {
            currentData: [],
            fullData: []
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
            _this.setState({ currentData: sortedJsonData });
            window.test = jsonData;
        };
        request.send();
    },

    handleSearchTerm: function handleSearchTerm(newTerm) {
        var filteredData = _.filter(this.state.fullData, function (a) {
            return _.startsWith(a.name, newTerm);
        });
        this.setState({ currentData: filteredData });
    },

    render: function render() {
        console.log(this.state.currentData.length);
        return React.createElement(
            "div",
            { className: "documentBox" },
            React.createElement(
                "h1",
                null,
                "Documentation"
            ),
            React.createElement(SearchForm, { onSearchTerm: this.handleSearchTerm }),
            React.createElement(DocumentList, { data: this.state.currentData })
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
        return React.createElement(
            "div",
            { className: "documentItem" },
            React.createElement(
                "h2",
                { className: "documentName" },
                this.props.name
            ),
            React.createElement(
                "ul",
                null,
                React.createElement(
                    "li",
                    null,
                    this.props.category
                ),
                React.createElement(
                    "li",
                    null,
                    this.props.args
                ),
                React.createElement(
                    "li",
                    null,
                    this.props.type
                ),
                React.createElement(
                    "li",
                    null,
                    this.props.docstring
                )
            )
        );
    }
});

var SearchForm = React.createClass({
    displayName: "SearchForm",

    render: function render() {
        return React.createElement(
            "div",
            { className: "form-group" },
            React.createElement(
                "form",
                { className: "searchForm", onSubmit: this.handleSubmit },
                React.createElement("input", { type: "text", ref: "term", className: "form-control", placeholder: "Search", onKeyUp: this.handleKeyPress })
            )
        );
    },

    handleSubmit: function handleSubmit(evt) {
        evt.preventDefault();
    },

    handleKeyPress: function handleKeyPress(evt) {
        var searchTerm = React.findDOMNode(this.refs.term).value;
        this.props.onSearchTerm(searchTerm);
    }
});

React.render(React.createElement(DocumentBox, { url: "xtmdoc.json" }), document.getElementById('content'));
