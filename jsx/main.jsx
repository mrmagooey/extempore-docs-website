
var DocumentBox = React.createClass({
    getInitialState: function() {
        return {
            data: [],
            currentData: [],
            fullData: [],
        };
    },
    
    componentDidMount: function() {
        var _this = this;
        var request = new XMLHttpRequest();
        request.open('GET', this.props.url, true);
        
        request.onload = function(data) {
            var jsonData = JSON.parse(request.responseText);
            var sortedJsonData = _.sortBy(jsonData, function(a){
                return a.name.toLowerCase();
            });
            _this.setState({fullData:sortedJsonData});
            _this.setState({currentData:sortedJsonData});
            window.test = jsonData;
        };
        request.send();
    },
    
    handleSearchTerm: function(newTerm) {
        var filteredData = _.filter(this.state.fullData, function(a){
            return _.startsWith(a.name, newTerm);
        });
        this.setState({currentData:filteredData});
    },
    
    render: function(){
        console.log(this.state.currentData.length);
        return (
            <div className="documentBox">
            <h1>Documentation</h1>
            <SearchForm onSearchTerm={this.handleSearchTerm}/>
            <DocumentList data={this.state.currentData}/>
            </div>
        );
    }
});

var DocumentList = React.createClass({
    render: function() {
        var docItems = this.props.data.map(function(doc) {
            return (
                <DocumentItem 
                key={doc.category + doc.name}
                category={doc.category}
                name={doc.name}
                args={doc.args}
                type={doc.type}
                docstring={doc.docstring}
                ></DocumentItem>
            );
        });
        return (
            <div className="documentList">
            {docItems}
            </div>
        );
    }
})


var DocumentItem = React.createClass({
    render: function(){
        return (
            <div className="documentItem">
            <h2 className="documentName">{this.props.name}</h2>
            <ul>
            <li>{this.props.category}</li>
            <li>{this.props.args}</li>
            <li>{this.props.type}</li>
            <li>{this.props.docstring}</li>
            </ul>
            </div>
        );
    }
})

var SearchForm = React.createClass({
    
    render: function() {
        return (
            <div className="form-group">
            <form className="searchForm" onSubmit={this.handleSubmit}>
            <input type="text" ref="term" className="form-control" placeholder="Search" onKeyUp={this.handleKeyPress} ></input>
            </form>
            </div>
        )
    },
    
    handleSubmit: function(evt) {
        evt.preventDefault();
    },
    
    handleKeyPress: function(evt){
        var searchTerm = React.findDOMNode(this.refs.term).value;
        this.props.onSearchTerm(searchTerm);
    }
})

React.render(
    <DocumentBox url="xtmdoc.json"/>,
    document.getElementById('content')
)
