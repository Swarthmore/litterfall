/*
Collection: Plot
Represents: A specific plot (which can be uniquely identified by site name and plot number
----------------

Plot is a Backbone Collection that contain Tree models. It fetches tree data from the database.
Once it successfully fetches the data, the reset event will be triggered. Reset is bound to
method renderTrees in Plot

Methods:
	initialize()	Built-in method from Backbone's Collection.
	
	renderTrees()	(It seriously should not be here, but oh well.) This method does essentially
					two main things:
					
					First: for each Tree model in this Plot collection, it calls each
					Tree's plotViewInitialize() method, in which a new plotRowView (a Backbone View)
					is instantiated. The newly instantiated plotRowView represents the
					corresponding Tree model; in its initialize() method, the render() method is
					also called, so that only instantiating the new plotRowView will automatically
					render and place the rendered element to the right location.
					
					Second: it implements the functionality that allows the user to export the
					current plot as a CSV file.
					
	populateTreeDiameter()
					In the analysis page of the tree data, the user can specify the range of years
					of data shown. populateTreeDiameter() populates each tree's observation entries
					within the range of years specified by the user.
	
	addTree()		Add a new Tree to the Plot collection *and* to the database. The custom 
					event tree_saved is triggered when the user, after filling out the form in the
					modal created for adding new trees, chooses to save and return to the plot.
					In addTree(), we bind the function that will repopulates the Plot to the event
					tree_saved.
	
	addSubTree()	addSubTree() is sort of like addTree(), but it adds a sub-tree rather than a tree,
					as the method's name suggests. The event tree_saved is bound to the appropriate
					function like in addTree().
					
*/
define([
	'jquery',
	'underscore',
	'backbone', 
	'models/tree_data/Tree',
	'views/tree_data/newTreeModalView'
], function($, _, Backbone, Tree, newTreeModalView){
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
		choosing_parent_tree: false,
  		initialize: function(){
  			
  			this.on('reset', this.renderTrees); 
  			this.on('remove', this.updateSurvivingSiblings);

  		},
  		renderTrees: function(){
  			var site_name = "";
  			var plot_number = 0;
  			
  			// for determining the maximum number of observation entries (aka diameters)
  			var max_diam = 0;
  			
  			var this_plot = this;
  			
  			// for each tree in the collection, creates a plotRowView
  			this.each(function(tree) {
  				
  				tree.plotViewInitialize(this.mode);
  				
  				var num_obvs = tree.get("diameter").length;
  				
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				if (num_obvs > max_diam) {
  					max_diam = num_obvs;
  				}
  				
  			}, this);

			
  			$(".dbh").attr("href", document.location.hash);
    		
    		// add tablesorter jquery plugin (no sorting for first column)
  			$("#plot-table").tablesorter({headers: { 0: { sorter: false}}}); 
  			
  			// populate the diameter entries based on user's given years
  			// only for the analysis page
  			if (window.location.hash.indexOf('reports')) this.populateTreeDiameters();
			
			// bind the export button
  			$('.export').unbind('click.CSVExport').bind('click.CSVExport', $.proxy(this.CSVExport, this));
  			
    	},
    	CSVExport: function() {
  				
			// set up column headers for CSV
			var CSV_head = "Full Tree ID,Species,Angle,Distance"
			/*for (var i = 1; i <= max_diam; i++) {
				CSV += "," + "Obs Date " + i + ",Diameter " + i + ",Notes " + i;
			}*/
			var CSV = "";
			
			var max_num_entries = 0;
			var tree_max_num_entries = 0;
			
			this.each(function(tree) {
				// format Comma Separated Value string with data from each tree
				CSV = CSV + "\r\n" + (parseInt(tree.get("tree_id")) + parseInt(tree.get("sub_tree_id"))*.1) + "," + tree.get("species") + "," + tree.get("angle") + "," + tree.get("distance");
				
				tree_max_num_entries = 0;
				
				_.each(tree.get("diameter"), function(obs) {
				
					tree_max_num_entries++;
					
					if (obs.date != null){
						CSV += "," + toFormattedDate(obs.date) + "," + obs.value + ",";
					}
					
					if (obs.notes != "" && obs.notes != undefined){
						CSV += obs.notes.replace(/[^a-zA-Z 0-9]+/g, '');
					}
					
					if (tree_max_num_entries > max_num_entries) {
						max_num_entries++;
						CSV_head += "," + "Obs Date " + max_num_entries + ",Diameter " + max_num_entries + ",Notes " + max_num_entries;
					}
					
				});
			});
			
			CSV += "\nDisclaimer: dates before 2013 are approximate. All data during that range was collected between September and October of the specified year.";
			this.createCSVFile(CSV_head + CSV);
				
  			
    	},
    	createCSVFile: function(CSV) {
    	
			// --------------
			// the code below is copied from some random website
			// it will post the content to a Python script file, which will create the file with the proper header
			// and file name
			
			// Creating a 1 by 1 px invisible iframe:

			var iframe = $('<iframe>',{
				width:1,
				height:1,
				frameborder:0,
				css:{
					display:'none'
				}
			}).appendTo('body');
	
			var formHTML = '<form action="" method="post">'+
				'<input type="hidden" name="filename" />'+
				'<input type="hidden" name="content" />'+
				'</form>';
	
			// Giving IE a chance to build the DOM in
			// the iframe with a short timeout:
	
			setTimeout(function(){
	
				// The body element of the iframe document:
	
				var body = (iframe.prop('contentDocument') !== undefined) ?
								iframe.prop('contentDocument').body :
								iframe.prop('document').body;	// IE
	
				body = $(body);
	
				// Adding the form to the body:
				body.html(formHTML);
	
				var form = body.find('form');
	
				form.attr('action',app.config.cgiDir + "create_file.py");
				form.find('input[name=filename]').val($(".site-name").text() + "-" + $(".plot-number").text());
				form.find('input[name=content]').val(CSV);
	
				// Submitting the form to download.php. This will
				// cause the file download dialog box to appear.
	
				form.submit();
			}, 50);
			
    	}, 
		populateTreeDiameters: function(){
    		// get year range user wished to view data from
			var start_year = $("#start-year").val();
  			var end_year = $("#end-year").val();
			var num_years = $("#end-year").val()-$("#start-year").val() + 1;
			
			if (start_year > end_year){
				// switch years so user doesn't have to be specific about which direction their date range goes
				var temp_year = start_year;
				start_year = end_year;
				end_year = temp_year;
			}
			
			$('.date-entry').hide();
			for (var i=parseInt(start_year); i<=parseInt(end_year); i++){
				$('.y-'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  		//	document.getElementById("DBH").colSpan = num_years;
    	},
    	updateSurvivingSiblings: function(tree) {
    		var parent_tree_id = tree.get('tree_id');
    		var parent_tree_oid = tree.get('_id');
			this.each(function(stupid_tree) {
				if (parent_tree_id == stupid_tree.get('tree_id') && parent_tree_oid != stupid_tree.get('_id')) {
					stupid_tree.url = app.config.cgiDir + "tree_data.py?oid=" + stupid_tree.get('_id').$oid;
					stupid_tree.fetch();
				}
			}, this);
    	},
  		addTree: function(){

  			
  			// var random_tree = this.find(function(){return true;});
  			
  			var new_tree = new Tree({
  				plot: parseInt($('.plot-number').text()),
  				site: $('.site-name').text()
  			});
  			var new_model = new newTreeModalView({
  				model: new_tree
  			});
  			var this_plot = this;
  			
  			// reload the whole page
  			// this is not a good idea
  			// we have to somehow think about sorting
  			new_model.on("treeSaved", function() {
  				$('#plot-table tbody').empty();
  				this_plot.fetch({
  					reset: true,
  					success: function() {
  						// so that the tablesorter plugin does not bring back the zombie trees
  						$('#plot-table').trigger('update');
  					}
  				});
  			});

  		},
		addSubTree: function(tree_id) {
  			var parent_tree = this.find(function (tree) {return tree.get('tree_id') == tree_id;});
  			
  			var new_tree = new Tree({
  				tree_id: tree_id,
  				sub_tree_id: -1, // telling the server that this is a new sub-tree
  				species: parent_tree.get('species'),
  				plot: parent_tree.get('plot'),
  				site: parent_tree.get('site'),
  				angle: parent_tree.get('angle'),
  				distance: parent_tree.get('distance')
  			});
  			
  			var new_model = new newTreeModalView({
  				model: new_tree
  			});
  			
  			var this_plot = this;
  			
  			// reload the whole page
  			// this is not a good idea
  			// we have to somehow think about sorting
  			new_model.on("treeSaved", function() {
  				$('#plot-table tbody').empty();
  				this_plot.fetch({
  					reset: true,
  					success: function() {
  						// so that the tablesorter plugin does not bring back the zombie trees
  						$('#plot-table').trigger('update');
  					}
  				});
  			});
  		}
  	});
	return Plot;
});
