// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'lib/jquery.min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    bootstrap: 'templates/js/bootstrap',
    templates: 'templates'
  },
  shim: {
        backbone: {
            deps: ['jquery','underscore','bootstrap'],
            exports: 'Backbone'
        },
         'underscore': {
            exports: '_'
        }
    }

});

var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};

require([
  // Load our app module and pass it to our definition function
  'app',

], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});

Date.prototype.toLitterfallDateObject = function() {
	return {
		'y': this.getFullYear(),
		'm': this.getMonth() + 1,
		'd': this.getDate()
	};
};

Date.prototype.fromLitterfallDateObject = function(date) {
	this.setFullYear(date.y);
	this.setMonth(date.m - 1);
	this.setDate(date.d);
};

//app object contains global app information

/* 
toFormattedDate(date)
Variables:	date	A JSON object (or a dictionary-like Javascript object) that contains attributes y, m, d
					{y: ####, m: ##, d: ##}
----------------------

It converts the date object to a nicely formatted string
*/
function toFormattedDate(date){
	
	// i'm just trying to be fancy
	// this loop loops to add an appropriate amount of zeros before the number
	function looper(num, i, num_digit, string) {
		
		var this_digit = (num%(Math.pow(10,i)) - num%(Math.pow(10,i-1)))/Math.pow(10,i-1);
		
		string = this_digit + string;
		if (i == num_digit) return string;
		i++;
		return looper(num, i, num_digit, string);
	}
	
	return looper(date.m, 1, 2, "") + "/" + looper(date.d, 1, 2, "") + "/" + looper(date.y, 1, 4, "");
	
}