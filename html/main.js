// Filename: main.js

//app object contains global app information
var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};


$(document).ready(function(){
	require.config({});
    //The global router declaration, handles all of the app's URLs
	var AppRouter = Backbone.Router.extend({
        routes: {
            "update": "updateObservation", //inits the add record "wizard", leads to the edit pages
            "update/trees/site/:location/plot/:plot": "editPlot",
            "update/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "editTree",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        }
	});
	
	//build an options list
	var selectionOptionsView = Backbone.View.extend({
    	template: '<option value="<%= value %>"><%= name %></option>',
    	initialize: function(){
    		 _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
			 this.collection.on('add', this.render); 
			 this.collection.on('reset',  this.render);
    	},
    	render: function(){
    		this.collection.each(function(option){
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	
	//build a row in the plot table representing a tree
	var plotRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<button class="update-btn btn btn-mini btn-primary" type="button">Update</button>\
			</td>\
			<td>\
				<%= tree.full_tree_id %>\
			</td>\
			<td>\
				<%= tree.species %>\
			</td>\
			<td>\
				<%= tree.angle %>\
			</td>\
			<td>\
				<%= tree.distance %>\
			</td>\
			<td>\
				<%= tree.thisDiameter %> on <%= tree.thisDate.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>\
			</td>\
			<td>\
				<%= tree.thisComment %>\
		</td>',
		initialize: function(){
			this.render();
		},
		render: function(){
			var thisTree = this.model.toJSON();
			thisTree.thisDate = "";
			for (date in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > thisTree.thisDate){					  //Date format is YYYYMMDD (reformated in template html above)
					thisTree.thisDate = date;
				}
			}
			thisTree.thisDiameter = thisTree.diameter[thisTree.thisDate].value;    //gets diameter from most recent measurement
			thisTree.thisComment = thisTree.diameter[thisTree.thisDate].notes;     //gets comments from most recent measurement
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.template, {tree: thisTree}));
			
			this.options.targetEl.append(this.el);								   //appends the tree's row element to table
		},
		events: {
			'click .update-btn': 'updateTree'									//if update button is clicked, runs updateTree function
		},
		updateTree: function(){
			//goto update tree page
			var subId = this.model.get("sub_tree_id");
			var treeUrl = "/treeid/" + this.model.get("tree_id") + ((subId) ? '/subtreeid/' + subId : '');
			document.location.hash = document.location.hash + treeUrl
			//save a tree to the DB
			//this.model.save();
		}
	});
	
	//build a row in the plot table representing a tree
	var treeEditView = Backbone.View.extend({
		tagName: 'div',
		template: '\
		<div id="tree-info">\
			<ul>\
				<li>Species: <%= tree.species %><i class="icon-edit"></i></li>\
				<li>Angle Degrees: <%= tree.angle %><i class="icon-edit"></i></li>\
				<li>Distance Meters: <%= tree.distance %><i class="icon-edit"></i></li>\
			</ul>\
		</div>\
		<div class="button-row">\
			<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
		</div>\
		<table id="tree_observations" class="table-striped">\
			<thead>\
				<tr>\
					<th></th>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.datesDesc, function(date){ %>\
			<tr>\
				<td>\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %></span><span class="edit_cell date_select"><input type="text" value="<%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>"/>\
				<input type="hidden" class="formatted_date" value="<%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>"></span></td>\
				<td class="editable"><span class="display_cell observers"><%= (tree.diameter[date].observers || []).join(", ") %></span><span class="edit_cell observers"><input type="text" value="<%= (tree.diameter[date].observers || []).join(", ") %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= tree.diameter[date].value %></span><span class="edit_cell diameter"><input type="text" value="<%= tree.diameter[date].value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= tree.diameter[date].notes %></span><span class="edit_cell notes"><input type="text" value="<%= tree.diameter[date].notes %>"></span></span></td>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		initialize: function(){
			this.render();
			this.model.on('change:diameter', this.render, this); //diameter will change when new observation is added
		},
		render: function(){
			console.log('render edit');
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			thisTree.datesDesc = _.keys(thisTree.diameter).sort().reverse();
			this.$el.html(_.template(this.template, {tree: thisTree}));
		},
		
		events: {
			'click .btn-new-observation': 'newObservation',	
			'click td.editable': 'editValue',
			'click .btn-save-observation': 'saveObservation',
			'click .btn-cancel-observation': 'render'
		},
		
		newObservation: function(){
			//add a new blank row to the observation table
			var diameters = _.clone(this.model.get('diameter')); //must clone object to update it
			var today = new Date();
			var newDateKey = [today.getFullYear(),((today.getMonth() < 9) ? 0 : ""),(today.getMonth() + 1),((today.getDate() < 10) ? 0 : ""),today.getDate()].join(""); //yes it generates the date in YYYYMMDD format
			if (diameters[newDateKey] == undefined){ //prevent overwriting of dates
				diameters[newDateKey] = {
					value: 'n/a',
					note: ""
				};
				this.model.set({"diameter": diameters});
			}

			// Render new row
			this.render();
			
			// Disable all the fields from being editing
			$("#tree_observations .btn.display_cell").hide();
			
			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$("#tree_observations > tbody > tr:first .edit_cell").show();
			$("#tree_observations > tbody > tr:first .display_cell").hide();
			$("#tree_observations > tbody > tr:first .edit_cell.date_select :input" ).datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date"});
			$("#tree_observations > tbody > tr:first .edit_cell.date_select :input" ).datepicker("setDate", today ); // Makes sure alt field is populated
					
		},
		
		saveObservation: function(event) {
			
			
			var newDateKey = $("#tree_observations > tbody > tr .edit_cell .formatted_date").val();
			var newValue = $("#tree_observations > tbody > tr .edit_cell.diameter :input").val();
			var newObservers = $("#tree_observations > tbody > tr .edit_cell.observers :input").val();
			var newNotes = $("#tree_observations > tbody > tr .edit_cell.notes :input").val();
			
			//must clone object to update it
			var diameters = _.clone(this.model.get('diameter')); 
			diameters[newDateKey] = {
					value: newValue,
					notes: newNotes,
					//observers: newObservers
				};
			this.model.set({"diameter": diameters});
			alert("Save this observation " + newDateKey + newValue + newObservers + newNotes);
			this.model.save();			
		},
		
		editValue: function(event){
			$(event.target).css("color", "red"); //event attaching test
		},
		updateTree: function(){
			//goto update tree page
			var subId = this.model.get("sub_tree_id");
			var treeUrl = "/treeid/" + this.model.get("tree_id") + ((subId) ? '/' + subId : '');
			document.location.hash = document.location.hash + treeUrl
			//save a tree to the DB
			//this.model.save();
		}
	});
	
	var singleOption = Backbone.Model.extend({});								//creates empty Model (to be a site, once information is loaded)
	
	
	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",													//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsedOptions = [];												
    		for (element in response){											//for objects within JSON return object
    			if (_.isString(response[element])){								//if the response is a string (e.g., a location), store it in the array:
    				parsedOptions.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1)
    				});
    			} else {
    				parsedOptions.push(response[element]);						//<WHAT DOES THIS DO?> [ ]
    			}
    		}
    		return parsedOptions;
    	}
	});
	
	
	//Declare the tree object (Model)
	var Tree = Backbone.Model.extend({
		defaults: {
			site: '',
			plot: '',
			_id: '',
			tree_id: 0,
			sub_tree_id: 0,
			angle: 0.0,
			distance: 0,
			diameter: {},
			species: '',
			species_certainty: 0,
			dead: true,
			dbh_marked: false,
			url: '',
			lat: 0,
			lng: 0
		},
		initialize: function(){
			if (this.get('editView')){
				this.on('change:_id', this.editViewInitialize, this);
			}
		},
		plotViewInitialize: function(){
			var plotRow = new plotRowView({
				targetEl: $("#plot-table"),
				model: this
			});
		},
		editViewInitialize: function(){
			var editForm = new treeEditView({
				el: $('#treeEditView'),
				model: this
			});
			console.log(this.toJSON());
		},
		parse: function(response){
			response.full_tree_id = response.tree_id + (response.sub_tree_id * .1);
			return response;
		}
	});
	
	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
  		initialize: function(){
  			 this.on('reset', this.renderTrees); 
  			 this.on('add', this.renderTrees); 
  		},
  		renderTrees: function(){
  			this.each(function(tree){
  				tree.plotViewInitialize();
  			}, this);
  		}
	});
	
    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	var  templateFile = 'index.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//require's library takes HTML templates
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:updateObservation', function () {											//listening for user action (for user to select location and plot)
    	var  templateFile = 'update.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			
			$('#main').html(templateHTML);
			var locationOptions = new selectionOptions;
			locationOptions.url = app.config.cgiDir + "litterfall.py?site=all";						//creates list with all possible locations
			var locationSelect = new selectionOptionsView({
				el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
				collection: locationOptions
			});
			locationOptions.fetch();
			$('#get-plot').click(function(){														//waits for user to select plot
				var getPlotUrl = "update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
		});
    });
    
    //Plot view
    app_router.on('route:editPlot', function(site, plot) {											//reloads page based on selected location (site) and plot
    	var  templateFile = 'update2.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot
			}));
			
			//DBH Tooltip 
			updateFunctions();

			
			var thisPlot = new Plot;
			//need to use site and plot variable to build url to python script
			thisPlot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			thisPlot.fetch();
		});
    });
    
    //Edit tree view
    app_router.on('route:editTree', function(site, plot, treeId, subTreeId) {						//reloads page based on selected location (site) and plot
    	var  templateFile = 'update-tree.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			
			if(typeof subTreeId === 'undefined'){
   				subTreeId = '0';
 			} else {
 				subTreeId = subTreeId;
 			}
			
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				treeId: treeId,
				subTreeId: subTreeId
			}));
			

			var thisTree = new Tree({editView: true});
			thisTree.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot + '&treeid=' + treeId + '&subtreeid=' + subTreeId;
			thisTree.fetch();

			//DBH Tooltip 
			updateFunctions();
		});
    });
    // Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
    Backbone.history.start();
	
		
	
});
// Start Bootstrap and template related jQuery
	
function updateFunctions(){
	$('.dbh').tooltip({trigger:'hover'})
	$('.dropdown-toggle').dropdown()
}
// End Bootstrap and template related jQuery

// Start Active Nav Tracking
$(function(){
  $(".nav a").click(function(){
    $(this).parent().addClass('active'). // <li>
      siblings().removeClass('active');
  });
});
// End Active Nav Tracking

/*

$('#plot-table').dataTable( {
    "bPaginate": false,
    "bLengthChange": false,
    "bFilter": true,
    "bSort": true,
    "bInfo": false,
    "bAutoWidth": false
} )
*/