
// the maximum number of documentation artifacts that will be displayed at a time
var MAX_DOCS_SHOWN = 50;

var DocumentBox = React.createClass({
    getInitialState: function() {
        return {
            status: "",
            currentData: [],
            fullData: [],
            searchTerm: "",
            categories: [
                {
                    name: "builtin",
                    active: true
                }, 
                {
                    name:"polymorphic closure", 
                    active: true
                },
                {
                    name:"closure", 
                    active: true
                },
                {
                    name:"type alias", 
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
        
        // history and hash url routing
        if (window.location.hash){
            this.setState({searchTerm: (window.location.hash.slice(1))});
        }
        // set up event watching the browser url
        window.onpopstate = function(evt) {
            _this.setState({searchTerm: (window.location.hash.slice(1))});
        };
    },
    
    render: function(){
        return (
                <div className="documentBox">
                <h1>Extempore Documentation</h1>
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
        var newCats = _.map(this.state.categories, function(category){
            if (category.name == name){
                return {name: category.name, active: active};
            } else {
                return category;
            }
            
        });
        this.setState({categories: newCats});
    },
    
    handleSearchTerm: function(newTerm) {
        if(history.pushState) {
            history.pushState(null, null, '#' + newTerm);
        }
        else {
            location.hash = '#' + newTerm;
        }
        this.setState({searchTerm: newTerm});
    },
    
    componentDidUpdate: function(previousProps, previousState) {
        // setup interdepence between states
        if (previousState.searchTerm !== this.state.searchTerm){
            this.updateDocsList();
        } else if (!_.isEqual(previousState.categories, this.state.categories)){
            this.updateDocsList();
        }
        
    },
    
    updateDocsList: function() {
        var _this = this;
        var filteredData =  _.chain(this.state.fullData)
                .filter(function(doc){
                    return _.startsWith(doc.name.toLowerCase(), _this.state.searchTerm.toLowerCase());
                }).filter(function(doc) {
                    var activeCategories = _.chain(_this.state.categories)
                            .filter('active')
                            .pluck('name')
                            .value();
                    return _.contains(activeCategories, doc.category);
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
        var docItems = this.props.data.map(function(doc, index) {
            return (
                    <DocumentItem 
                key={doc.category + " " + doc.name}
                category={doc.category}
                name={doc.name}
                args={doc.args}
                type={doc.type}
                docstring={doc.docstring}
                odd={index%2 === 1}
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
    
    fragmentPoly: function(ds) {
        if (ds.docstringPoly.length > 0){
            var polyItems = ds.docstringPoly.map(function(x, index) {
                var hrefHash = "#" + x[0];
                return (<p key={x[0]}> <a href={hrefHash}>{x[0]}:{x[1]}</a></p>);
            });
            return (
                    <tr>
                    <td className="col-md-2 description">
                    Poly
                    </td>
                    <td>
                    {polyItems}
                    </td>
                    </tr>
            );
        } else {
            return undefined;
        }
    },
    
    fragmentSees: function(ds) {
        if (ds.docstringSees.length > 0){
            var seeItems = ds.docstringSees.map(function(x, index) {
                var hrefHash = "#" + x[0];
                return (<p> <a href={hrefHash}>{x[0]} - {x[1]}</a></p>);
            });
            return (
                    <tr>
                    <td className="col-md-2 description">
                    See
                    </td>
                    <td>
                    {seeItems}
                    </td>
                    </tr>
            );
        } else {
            return undefined;
        }
    },
    
    fragmentReturns: function(ds) {
        if (_.isNull(this.props.args)){
            return undefined;
        } else {
            var returnType = this.props.args[0];        
            if (ds.docstringReturn.length > 0){
                return  (
                        <tr>
                        <td className="description">
                        Returns
                    </td>
                        <td>
                        <p> {ds.returns} </p>
                        </td>
                        </tr>
                );
            } else {
                return undefined;
            }
        }
    },

    fragmentParams: function(ds) {
        if (_.isNull(this.props.args) || this.props.args.length < 2){
            return undefined;
        } else {
            var inputTypes = this.props.args.slice(1);
            var argumentItems = [];
            inputTypes.forEach(function(arg, index){
                var paramDescription = _.chain(ds.docstringParams)
                        .filter(function(x, index) {
                            // match docstring and types on argument name
                            return x[0] === arg[0];
                        })
                        .pluck(1)
                        .first()
                        .value();
                argumentItems.push(
                        <tr key={index}>
                        <td className="code">{arg[0]}</td>
                        <td className="code">{arg[1]}</td>
                        <td>{paramDescription}</td>
                        </tr>
                );
            });
            return (
                    <tr>
                    <td className="col-md-2 description"> Parameters </td>
                    <td>
                    <table className="table">
                    <thead> 
                    <tr>
                    <th>Parameter Name</th>
                    <th>Type</th>
                    <th>Parameter Description</th>
                    </tr>
                    </thead> 
                    <tbody>{argumentItems}</tbody>
                    </table>
                    </td>
                    </tr>
            );
        }
    },
    
    fragmentExample: function(ds) {
        if (ds.docstringExamples.length > 0) {
            var exampleItems = ds.docstringExamples.map(function(x, index) {
                return (<p key={index}><code>{x}</code></p>);
            });
            return (
                    <tr>
                    <td className="col-md-2 description">
                    Examples
                    </td>
                    <td>
                    {exampleItems}
                    </td>
                    </tr>
            );
            
        } else {
            return undefined;
        }
    },
    
    fragmentDescription: function(ds) {
        if (ds.longDescription.length > 0) {
            return (
                    <tr>
                    <td className="col-md-2 description">
                    <p>Long Description</p>
                    </td>
                    <td><p>{ds.longDescription}</p></td>
                    </tr>
            );
        } else {
            return undefined;
        }
    },
    
    renderCallable: function() {
        var parsedDocstring = parseDocstring(this.props.docstring || "");
        var description = this.fragmentDescription(parsedDocstring);
        var paramsTable = this.fragmentParams(parsedDocstring);
        var returns = this.fragmentReturns(parsedDocstring);
        var sees = this.fragmentSees(parsedDocstring);
        var examples = this.fragmentExample(parsedDocstring);
        return (<tbody>
                {description}
                {paramsTable}
                {returns}
                {sees}
                {examples}
                </tbody>
               );
    },
    
    renderNonCallables: function(){
        var parsedDocstring = parseDocstring(this.props.docstring || "");
        var description = this.fragmentDescription(parsedDocstring);
        return (<tbody>
                {description}
                </tbody>);
    },
    
    renderPolyClosure: function(){
        var parsedDocstring = parseDocstring(this.props.docstring || "");
        var description = this.fragmentDescription(parsedDocstring);
        var sees = this.fragmentSees(parsedDocstring);
        var polys = this.fragmentPoly(parsedDocstring);
        return (<tbody>
                {description}
                {polys}
                {sees}
                </tbody>);
    },
    
    render: function(){
        var parsedDocstring = parseDocstring(this.props.docstring || "");
        var functionHeading = (
                <h2 className="documentName code">
                {this.props.name}
                <span className="documentCategory">
                {this.props.category}
            </span>
                </h2>
        );
        var body;
        if (_.contains(['builtin', 'closure', 'named type', 'generic closure'], this.props.category)){
            body = this.renderCallable();
        } else if (this.props.category === "type alias" || this.props.category === "global var") {
            body = this.renderNonCallables();
        } else if (this.props.category === "polymorphic closure") {
            body = this.renderPolyClosure();
        }
        
        var classes = 'documentItem';
        if (this.props.odd){
            classes += ' odd';
        }
        
        return (<div className={classes}>
                {functionHeading}
                <p>{parsedDocstring.shortDescription}</p>
                <table className="table table-bordered">
                <thead>
                </thead>
                {body}
                </table>
                </div>);
    },
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
                <input type="text" 
            ref="term" 
            className="form-control" 
            placeholder="Search" 
            onChange={this.handleOnChange}
            value={this.props.searchTerm}>
                </input>
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
    
    handleOnChange: function(evt) {
        this.props.onSearchUpdate(evt.target.value);
    },
    
    handleCategoryUpdate: function(active, name) {
        this.props.onCategoryUpdate(active, name);
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
    
    // try to fix button default behaviour
    handleFocus:function(evt) {
        React.findDOMNode(this).blur();
    },
    
    render: function() {
        var classes = "categoryButton btn btn-primary btn-sm ";
        if (this.state.active){
            classes += 'active';
        }
        return (
                <button tabIndex="-1" 
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
