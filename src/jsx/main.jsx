
// the maximum number of documentation artifacts that will be displayed at a time
var MAX_DOCS_SHOWN = 30;

var DocumentBox = React.createClass({
    getInitialState: function() {
        return {
            status: "",
            currentData: [],
            fullData: [],
            searchTerm: "",
            categories: [
            {
                name: "xtlang builtin",
                active: true
            }, 
            {
                name:"polymorphic closure", 
                active: true
            },
            {
                name:"xtlang closure", 
                active: true
            },
            {
                name:"xtlang alias", 
                active: true
            },
            {
                name:"named type", 
                active: true
            },
            {
                name:"generic closure", 
                active: true
            },
            {
                name:"global var",
                active: true
            },
            {
                name:"C function", 
                active: false
            },
        ],
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
            _this.updateDocsList(); // start with no filter in place

        };
        request.send();
    },
    
    render: function(){
        return (
                <div className="documentBox">
                <h1>Documentation</h1>
                
                <SearchForm 
            onSearchUpdate={this.handleSearchTerm} 
            onCategoryUpdate={this.handleCategoryUpdate}
            categories={this.state.categories}
            searchTerm={this.state.searchTerm}
                />
                
                <DocumentStatus status={this.state.status}/>
                <DocumentList data={this.state.currentData}/>
                </div>
        );
    },
    
    handleCategoryUpdate:function(active, name) {
        var cats = this.state.categories;
        var newCats = _.map(this.state.categories, function(category){
            if (category.name == name){
                category.active = active;
            }
            return category;
        });
        
        this.setState({categories: newCats}, function() {
            this.updateDocsList();
        });
    },
    
    handleSearchTerm: function(newTerm) {
        this.setState({searchTerm:newTerm}, function() {
            this.updateDocsList();
        });
    },
    
    updateDocsList: function() {
        var _this = this;
        var filteredData =  _.chain(this.state.fullData)
                .filter(function(a){
                    return _.startsWith(a.name, _this.state.searchTerm);
                }).filter(function(a) {
                    var activeCategories = _.chain(_this.state.categories)
                            .filter('active')
                            .pluck('name')
                            .value();
                    return _.contains(activeCategories, a.category);
                })
                .value();
        
        var newData;
        if (filteredData.length > MAX_DOCS_SHOWN) {
            newData = _.slice(filteredData, 0, MAX_DOCS_SHOWN);
            this.setState({"status": "Showing " + MAX_DOCS_SHOWN + " records out of " + filteredData.length});
        } else {
            newData = filteredData;
            if (filteredData.length == 0){
                this.setState({"status": "No records found"});
            } else {
                this.setState({"status": ""});
            }
        }
        
        this.setState({currentData:newData});        
    },
    
    
});

var DocumentStatus = React.createClass({
    render: function() {
        return (
                <div className="documentStatus">{this.props.status}</div>
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
});

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
});

var SearchForm = React.createClass({
    render: function() {
        var _this = this;
        var buttons = this.props.categories.map(function(category){
            return (
                    <CategoryButton key={category.name}
                name={category.name}
                active={category.active}
                onCategoryChange={_this.handleCategoryUpdate}
                    ></CategoryButton>
            );
        });
        return (
                <div className="form-group">
                <form className="searchForm" onSubmit={this.handleSubmit}>
                <div className="form-group">
                <input type="text" ref="term" className="form-control" placeholder="Search" onKeyUp={this.handleKeyPress} ></input>
                </div> {/*  end form-group */}
                <div className="form-group"> 
                <div className="btn-group" data-toggle="buttons">
                {buttons}
                </div> {/* end btn-group */}
                </div> {/* end form-group */}
                </form>
                </div>
        );
    },
    
    handleCategoryUpdate: function(active, name) {
        this.props.onCategoryUpdate(active, name);
    },
    
    handleKeyPress: function(evt){
        var searchTerm = React.findDOMNode(this.refs.term).value;
        this.props.onSearchUpdate(searchTerm);
    },
    
    // this is to stop the textinput trying to post and refreshing the page
    handleSubmit: function(evt) {
        evt.preventDefault();
    },
    
});

var CategoryButton = React.createClass({
    getInitialState: function() {
        return {active: this.props.active};
    },
    
    handleChange: function(evt) {
        this.setState({active: (!this.state.active)}, function() {
            this.props.onCategoryChange(this.state.active, this.props.name);    
        });
    },
    
    // 
    handleFocus:function(evt) {
        React.findDOMNode(this).blur();
    },
    
    render: function() {
        var classes = "categoryButton btn btn-primary btn-sm ";
        if (this.state.active){
            classes += 'active';
        }
        return (
                <button tabindex="-1" 
            className={classes} 
            onFocus={this.handleFocus} 
            onClick={this.handleChange}>
                {this.props.name}
            </button>
        );
    }
});

React.render(
        <DocumentBox url="xtmdoc.json"/>,
    document.getElementById('content')
);
