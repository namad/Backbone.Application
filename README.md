# Базовая реализация MVC для backbone.js

Backbone.Application - это простая и эффективная реализация MVC паттерна для backbone.js. В основе всего 2 новых класса, которые доступны в неймспейсе Backbone:
* Backbone.Application
* Backbone.Controller

# Usage
## Defining application and namespaces
### Automated creation of the application namespace
To get started, lets create a new application instance. `Backbone.Application` creates application sceleton automatically with all namespaces, that can be used for further definition of components. 
```Javascript
new Backbone.Application({
	nameSpace: 'SteakMaker'
});
```
In result we will have ready to use object that can host all part of the future app.
```Javascript
window.SteakMaker = {
    ...
    Controllers: {},
    Models: {},
    Collections: {}
}

```
`window.SteakMaker` is an instance of the Backbone.Application`.
```Javascript
console.log(SteakMaker instanceof Backbone.Application); // -> true
```

The application will automatically define namespace using `nameSpace` config. Internal strcuture will be created based on 'allocationMap' properties. THe default values of the 'allocationMap' is the following:
```Javascript
allocationMap: {
    model: 'Models',
    collection: 'Collections',
    controller: 'Controllers',
    view: 'Views'
}
```

Fields model`, `collection`, `controller` and `view` are required. We can redefine or extend internal structure by redefining `allocationMap` config. 
For example:
```Javascript
new Backbone.Application({
    ...    
    allocationMap: {
        model: 'models',
        collection: 'stores',
        controller: 'controllers',
        view: 'views',
        lib: 'libs'
    }
});
```
In result, our application will have the following structure:
```Javascript
window.SteakMaker = {
    ...
    controllers: {},
    models: {},
    stores: {},
    libs: {}    
}
```
##### Imporant
In order to use automated namespace generation we need to make sure that application instance is created right before all other resurses are being loaded.

### Defining application compoments
Lets extend our example and add several controllers.
```Javascript
new Backbone.Application({
	nameSpace: 'SteakMaker',
	
	controllers: [
		'MeatManager',      // -> SteakMaker.Controllers.MeatManager
		'Administration',   // -> SteakMaker.Controllers.Administration
        ...
	]
});
```
Please note, in controller definition we are using simple string identifier which doesn't contains `SteakMaker.Controllers`. Using `nameSpace` property, the application class will resolve refences to all required components. In order to keet it running, we need to use choosen namespace when defining all other components.
```Javascript
SteakMaker.Controllers.Administration = Backbone.Controller.extend({});
SteakMaker.Models.Steak = Backbone.Model.extend({});
SteakMaker.Views.Kitchen = Backbone.View.extend({});
```

## Defining a controller 
Controllers are used to bind all application parts together. All they really do is listen for events (usually from views and other controllers) and take some action.
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	models: [
		'Meat',
		...
	],
	collections: [
		'Dishes',
		...
	],
	views: [
		'Kitchen',
		...
	],
    
    initialize: function() {
        ...
    }
});
```

`Controller.initialize` function is a great place to setup controller event listeners. Simply call `Controller.addListeners` function and pass the list of views in order to handle view events. In our example, let's listen for `'toolbar.action'` event from `Kitchen` view:
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	...		
	initialize: function() {
		this.addListeners({
			'Kitchen': {
				'toolbar.action': this.toolbarAction
			}
		});
	},
	
	toolbarAction: function(action) {
		// code here
	}
});
```

Each controller has `onLauch` callback which is great place to set up controller basics. Let's create `Meat` model, then `Kitchen` view and render it.
```Javascript
SteakMaker.Controllers.MeatManager = Backbone.Controller.extend({
	...		
	onLaunch: function() {
		var model = this.getModel('Meat');
		var view = this.createView('Kitchen', {
			model: model
		});
		
		view.render();
	}
	...
});
```

## Defining a view
It's pretty much the same as original [Backbone.View](http://backbonejs.org/#View), but there are small difference. In order to enable controller level events, use View.fireEvent method instead of default `View.fireEvent`. Let's see how we can fire up `'toolbar.action'` events from `MeatManager` view in order to notify `MeatManager` controller about that actions.
```Javascript
SteakMaker.Views.Kitchen = Backbone.View.extend({
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
That's it! All controllers, that are listen for the `Kitchen` events will know when it fire.

##Examples