/**
 * Lets create new application instance with ToDo namespace defined
 */
new Backbone.Application({
    nameSpace: 'ToDoApplication',
    controllers : [
        'ToDo'
    ]
});

console.log('ToDoApplication has been created! ', ToDoApplication);

/**
 * This is out main controller which will do most of job
 * It will listen for view and collection events and manage all data-related operations
 */
ToDoApplication.Controllers.ToDo = Backbone.Controller.extend({
    // Specifying a ToDo model
    models: [
        'ToDo'
    ],

    // Specifying a collection of out ToDos
    collections: [
        'ToDos'
    ],

    // Specifying application views
    views: [
        'Portal',   // is main application layout
        'ToDoItem'  // a single ToDo item
    ],


    // When controller is created let's setup view event listeners
    initialize: function() {
        // This most important part when we will tell our controller what events should be handled
        this.addListeners({
            // Events generated by main view
            'Portal': {
                // Fired when user create new ToDo by typing it name
                'todo.add': this.createNewTodo,
                // Fired when use check/uncheck [] Mark all as complete checkbox
                'toggle.completed': this.toggleComplete,
                // Fired when use clicks [Clear completed] link
                'clear.completed': this.clearCompleted
            },
            // Events generated by single ToDo item
            'ToDoItem': {
                // Fired when user click remove icon
                'todo.remove': this.removeTodo,
                // Fired once user complete edit
                'todo.save': this.saveTodo,
                // Fired when used checks/unchecks [] complete checkbox
                'todo.toggle': this.toggleTodo            
            }
        });
    },

    // When our application is ready, lets get started
    onLaunch: function() {
        // Create and render main view
        this.portal = this.createView('Portal').render();        

        // Subscribe for ToDos collection events
        this.getCollection('ToDos').on('reset', this.populateList, this); // Populate previously saved ToDo list
        this.getCollection('ToDos').on('all', this.refreshPortalView, this); // Update portal view and stats

        // Fetch data from localStorage
        this.getCollection('ToDos').fetch();
    },

    // This event listener is evoked every time when user type new ToDo name in main textbox and hits enter
    // Also we are using this function to populate previously saved ToDo list from localStorage
    createNewTodo: function(data) {
        var modelClass = this.getModelConstructor('ToDo'),
            model;
        
        if(typeof data == 'string') {
            model = new modelClass({
                order: this.getCollection('ToDos').nextOrder(),
                title: data
            });
        }
        else if(data instanceof Backbone.Model) {
            model = data;
        }

        this.getCollection('ToDos').create(model);

        this.createView('ToDoItem', {
            renderTo: this.portal.$list,
            model: model
        });

    },

    // When data in ToDos collection is changed, we need to update main view accordingly
    // Controller not doing this update, instead it send the command to the view with necessary params
    refreshPortalView: function() {
        var collection = this.getCollection('ToDos');
        var done = collection.done().length;
        var remaining = collection.remaining().length;

        this.portal.updateView(done, remaining);
    },

    // Called every time when ToDoItem['todo.remove'] is fired
    removeTodo: function(view) {
        view.model.destroy();
    },

    // Called every time when ToDoItem['todo.toggle'] is fired
    toggleTodo: function(view) {
        view.model.toggle();
    },

    // Called every time when ToDoItem['todo.save'] is fired
    saveTodo: function(view, value) {
        if (value) {
            view.model.save({title: value});
        }
        else {
            this.removeTodo(view);
        }
    },

    // Called by ToDos collection when list of items are loaded
    populateList: function() {
        this.getCollection('ToDos').each(this.createNewTodo, this);
    },

    // Called every time when Portal['clear.completed'] is fired
    clearCompleted: function() {
        _.each(this.getCollection('ToDos').done(), function(todo){
            todo.clear();
        });
    },

    // Called every time when Portal['toggle.completed'] is fired
    toggleComplete: function(view, state) {
        this.getCollection('ToDos').each(function (todo) {
            todo.save({'done': state});
        });
    }

});

/**
 * Todo Model
 * Our basic Todo model has `title`, `order`, and `done` attributes.
 */
ToDoApplication.Models.ToDo = Backbone.Model.extend({

    // Default attributes for the todo item.
    defaults: function() {
      return {
        title: "empty todo...",
        order: null,
        done: false
      };
    },

    // Ensure that each todo created has `title`.
    initialize: function() {
      if (!this.get("title")) {
        this.set({"title": this.defaults().title});
      }
    },

    // Toggle the `done` state of this todo item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },

    // Remove this Todo from *localStorage* and delete its view.
    clear: function() {
        this.destroy();
    }
});

/**
 * Todo Collection
 * The collection of todos is backed by *localStorage* instead of a remote server.
 */
ToDoApplication.Collections.ToDos = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: ToDoApplication.Models.ToDo,

    // Save all of the todo items under the `"todos"` namespace.
    localStorage: new Store("todos-backbone"),

    // Filter down the list of all todo items that are finished.
    done: function() {
      return this.filter(function(todo){ return todo.get('done'); });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Todos in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Todos are sorted by their original insertion order.
    comparator: function(todo) {
      return todo.get('order');
    }

});

/**
 * Todo Item View
 * The DOM element for a todo item...
 */
ToDoApplication.Views.ToDoItem = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template:_.template(
        ([
            '<div class="view">',
                '<input class="toggle" type="checkbox" <%= done ? \'checked="checked"\' : \'\' %> />',
                '<label><%- title %></label>',
                '<a class="destroy"></a>',
            '</div>',
            '<input class="edit" type="text" value="<%= title %>" /> '
        ]).join('')
    ),

    // The DOM events specific to an item.
    events: {
        "click .toggle": "toggleDone",
        "dblclick .view": "edit",
        "click a.destroy": "destroy",
        "keypress .edit": "updateOnEnter",
        "blur .edit": "save"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
        this.model.on('change', this.update, this);
        this.model.on('destroy', this.remove, this);
        this.render()
    },

    // Render element to corresponding container, specified in options.renderTo
    render: function() {
        this.update();

        this.$el.appendTo(this.options.renderTo);
        return this;
    },

    // Update view every time when model is changed
    update: function() {
        var html = this.template(this.model.toJSON());
        this.$el.html(html);
        this.$el.toggleClass('done', this.model.get('done'));
        this.input = this.$('.edit');
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
        this.fireEvent('todo.toggle', [this]);
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
        this.$el.addClass("editing");
        this.input.focus();
        return false;    
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
        if (e.keyCode == 13){
            this.save();
        }
    },

    // Save the item
    save: function(event) {
        var value = this.input.val();
        this.$el.removeClass("editing");
        this.fireEvent('todo.save', [this, value]);
        return false;
    },

    // Remove the item, destroy the model.
    destroy: function() {
        this.fireEvent('todo.remove', [this]);
        return false;
    }

});


// The Application
// ---------------
// Our overall **AppView** is the top-level piece of UI.
ToDoApplication.Views.Portal = Backbone.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    template: _.template(
        ([
            '<div id="todoapp">',

                '<header>',
                    '<h1>Todos</h1>',
                    '<input id="new-todo" type="text" placeholder="What needs to be done?">',
                '</header>',

                '<section id="main">',
                    '<input id="toggle-all" type="checkbox">',
                    '<label for="toggle-all">Mark all as complete</label>',
                    '<ul id="todo-list"></ul>',
                '</section>',

                '<footer>',
                    '<a id="clear-completed">Clear completed</a>',
                    '<div id="todo-count"></div>',
                '</footer>',

            '</div>',

            '<div id="instructions">',
                'Double-click to edit a todo.',
            '</div>',

            '<div id="credits">',
                'Created by',
                '<br />',
                '<a href="http://jgn.me/">J&eacute;r&ocirc;me Gravel-Niquet</a>.',
                '<br />Rewritten by: <a href="http://addyosmani.github.com/todomvc">TodoMVC</a>.',
            '</div>'
        ]).join('')
    ),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template(
        ([
            '<% if (done) { %>',
                '<a id="clear-completed">Clear <%= done %> completed <%= done == 1 ? \'item\' : \'items\' %></a>',
            '<% } %>',
            '<div class="todo-count"><b><%= remaining %></b> <%= remaining == 1 ? \'item\' : \'items\' %> left</div>'
        ]).join('')
    ),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
        "keypress #new-todo":  "createOnEnter",
        "click #clear-completed": "clearCompleted",
        "click #toggle-all": "toggleAllComplete"
    },

    // Set innerHTML and get the references to the DOM elements
    initialize: function() {
        this.$el.html(this.template.join(''));

        this.$input = this.$("#new-todo");
        this.allCheckbox = this.$("#toggle-all")[0];
        this.$list = this.$('#todo-list');
        this.$footer = this.$('footer');
        this.$header = this.$('header');
        this.$main = this.$('#main');
    },

    // Render layout
    render: function() {
        this.$el.appendTo(document.body);
        return this;
    },
    
    // RUpdating the main view just means refreshing the statistics -- the rest
    // of the layout doesn't change.
    updateView: function(done, remaining) {
        var length = done + remaining;

        if (length) {
            this.$main.show();
            this.$footer.show();
            this.$footer.html(this.statsTemplate({done: done, remaining: remaining}));
        }
        else {
            this.$main.hide();
            this.$footer.hide();
        }

        this.allCheckbox.checked = !remaining;
    },

    // If you hit return in the main input field, create new Todo model,
    // persisting it to localStorage
    createOnEnter: function(e) {
        var value = this.$input.val();
        if (e.keyCode == 13 && value) {
            this.fireEvent('todo.add', [value]);
            this.$input.val('');
        }
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
        this.fireEvent('clear.completed', [this]);
        return false;
    },

    // Toggle all items completed or not
    toggleAllComplete: function () {
        var done = this.allCheckbox.checked;
        this.fireEvent('toggle.completed', [this, done]);
    }

});


