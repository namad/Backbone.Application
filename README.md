# Basic MVC implementation for backbone.js

This is simply yet effective implementation of the MVC pattern. 2 new classes has been added to the Backbone namespace:
* Backbone.Application
* Backbone.Controller

# Usage
## Setting up namespace
Before you start, it might be good idea to define application namespace, where all parts will be defined.
```Javascript
var FormBuilder = {
	controller: {},
	model: {},
	view: {},
	collection: {}
}
```
## Defining new application
Each application should start from defining your application constructor. Setup nameSpace property to define the global variable for the entire application and name property to define a variable for application instance within global namespace.
```Javascript
FormBuilder.Application = Backbone.Application.extend({
	Controllers: {},
	Models: {},
	Views: {},
	Collections: {},
	
	name: 'app',
	nameSpace: 'FormBuilder',
	
	controllers: [
		'FormBuilder.Controllers.FormManager',
		'FormBuilder.Controllers.Administration',
		'FormBuilder.Controllers.RunTime'
	]
});
```
In result, application will be available in window.FormBuilder.app varible.

## Defining a controller
Controllers are used to bind all application parts together. All they really do is listen for events (usually from views and other controllers) and take some action.
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	models: [
		'FormBuilder.Models.Form',
		...
	],
	collections: [
		'FormBuilder.Collections.Forms',
		...
	],
	views: [
		'FormBuilder.Views.FormManager',
		...
	]
});
```

Controller.initialize function is a great place to setup controller event listeners. Simply call Controller.addListeners function and pass the list of views in order to handle view events. In our example, let's listen for 'toolbar.action' event from FormManager view:
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	...		
	initialize: function() {
		this.addListeners({
			'FormManager': {
				'toolbar.action': this.toolbarAction
			}
		});
	},
	
	toolbarAction: function(action) {
		// code here
	}
});
```

Each controller has onLauch callback which is great place to set up controller basics. Let's create Form model, then FormManager view and render it.
```Javascript
FormBuilder.Controllers.UserManager = Backbone.Controller.extend({
	...		
	onLaunch: function() {
		var formModel = this.getModel('Form');
		var formView = this.createView('FormManager', {
			model: formModel
		});
		
		formView.render();
	}
	...
});
```

## Defining a view