# Basic MVC implementation for backbone.js

This is simply yet effective implementation of the MVC pattern. 2 new classes has been added to the Backbone namespace:
* Backbone.Application
* Backbone.Controller

# Usage
## Setting up namespace
Before you start, it might be good idea to define application namespace, where all parts will be defined. Let'd do the quick setup for our FormBuilder application.
```Javascript
var FormBuilder = {
	Controllers: {},
	Models: {},
	Views: {},
	Collections: {}
}
```
## Defining new application
Each application should start from defining your application constructor. Setup `nameSpace` property to define the global variable for the entire application and `name` property to define a variable for application instance within global namespace.
```Javascript
FormBuilder.Application = Backbone.Application.extend({
	name: 'app',
	nameSpace: 'FormBuilder',
	
	controllers: [
		'FormBuilder.Controllers.FormManager',
		'FormBuilder.Controllers.Administration',
		'FormBuilder.Controllers.RunTime'
	]
});
```
In result, application will be available in global FormBuilder.app varible.

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

`Controller.initialize` function is a great place to setup controller event listeners. Simply call `Controller.addListeners` function and pass the list of views in order to handle view events. In our example, let's listen for `'toolbar.action'` event from `FormManager` view:
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

Each controller has `onLauch` callback which is great place to set up controller basics. Let's create `Form` model, then `FormManager` view and render it.
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
It's pretty much the same as original [Backbone.View](http://backbonejs.org/#View), but there are small difference. In order to enable controller level events, use `View.fireEvent` method instead of default `View.trigger`. Let's see how we can fire up `'toolbar.action'` events from `FormManager` view in order to notify `UserManager` controller about that actions.
```Javascript
FormBuilder.Views.FormManager = Backbone.View.extend({
	events: {
		'click .toolbar button': 'onToolbarButtonClick'
	},
	...		
	onToolbarButtonClick: function(event) {
		var button = $(event.currentTarget),
			action = button.data('action');
			
		this.fireEvent('toolbar.action', [action]);
	}
	...
});
```
That's it! All controllers, that are listen for the `FormManager` will know about that event.

## Runnin an application
When all parts are defined, it's time to launch our application. 
```Javascript
new FormBuilder.Application();
```
Yay! New application instance is created and ready to rock ;)