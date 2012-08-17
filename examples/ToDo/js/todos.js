new Backbone.Application({
    nameSpace: 'ToDo',
    controllers : [
        'ToDo'
    ]
});

ToDo.Controllers.ToDo = Backbone.Controller.extend({
    models: [
        'ToDo'
    ],
    
    collections: [
        'ToDos'
    ],
    
    views: [
        'Portal',
        'ToDoItem'
    ],
    
    initialize: function() {
        this.addListeners({
            'Portal': {
                'todo.add': this.createNewTodo,
                'toggle.completed': this.toggleComplete,
                'clear.completed': this.clearCompleted
            },
            'ToDoItem': {
                'todo.remove': this.removeTodo,
                'todo.edit': this.editTodo,
                'todo.save': this.saveTodo,
                'todo.toggle': this.toggleTodo            
            }
        });
    },
    
    onLaunch: function() {
        this.portal = this.createView('Portal').render();        
        
        this.getCollection('ToDos').on('reset', this.populateList, this);
        this.getCollection('ToDos').on('all', this.refreshPortalView, this);
        this.getCollection('ToDos').fetch();
    },
    
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

    refreshPortalView: function() {
        var collection = this.getCollection('ToDos');
        var done = collection.done().length;
        var remaining = collection.remaining().length;

        this.portal.updateView(done, remaining);
    },

    removeTodo: function(view) {
        view.model.destroy();
    },
    
    toggleTodo: function(view) {
        view.model.toggle();
    },
    
    editTodo: function(view) {
    },

    saveTodo: function(view, value) {
        if (value) {
            view.model.save({title: value});
        }
        else {
            this.removeTodo(view);
        }
    },

    populateList: function() {
        this.getCollection('ToDos').each(this.createNewTodo, this);
    },

    clearCompleted: function() {
        _.each(this.getCollection('ToDos').done(), function(todo){
            todo.clear();
        });
    },

    toggleComplete: function(view, state) {
        this.getCollection('ToDos').each(function (todo) {
            todo.save({'done': state});
        });
    }

});

// Todo Model
// ----------
// Our basic **Todo** model has `title`, `order`, and `done` attributes.
ToDo.Models.ToDo = Backbone.Model.extend({

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

// Todo Collection
// ---------------

// The collection of todos is backed by *localStorage* instead of a remote
// server.
ToDo.Collections.ToDos = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: ToDo.Models.ToDo,

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

// Todo Item View
// --------------
// The DOM element for a todo item...
ToDo.Views.ToDoItem = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: [
        '<div class="view">',
            '<input class="toggle" type="checkbox" <%= done ? \'checked="checked"\' : \'\' %> />',
            '<label><%- title %></label>',
            '<a class="destroy"></a>',
        '</div>',
        '<input class="edit" type="text" value="<%= title %>" /> '
    ],

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

    // Re-render the titles of the todo item.
    render: function() {
        this.update();

        this.$el.appendTo(this.options.renderTo);
        return this;
    },

    update: function() {
        var html = _.template(this.template.join(''), this.model.toJSON());
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

    // Close the `"editing"` mode, saving changes to the todo.
    close: function() {
        var value = this.input.val();
        this.fireEvent('todo.remove', [this, value]);
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
        if (e.keyCode == 13){
            this.save();
        }
    },

    // Remove the item, destroy the model.
    save: function(event) {
        var value = this.input.val();
        this.$el.removeClass("editing");
        this.fireEvent('todo.save', [this, value]);
        return false;
    },

    destroy: function() {
        this.fireEvent('todo.remove', [this]);
        return false;
    }

});


// The Application
// ---------------
// Our overall **AppView** is the top-level piece of UI.
ToDo.Views.Portal = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    template: [
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
    ],

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template(
        ([
            '<% if (done) { %>',
                '<a id="clear-completed">Clear <%= done %> completed <%= done == 1 ? \'item\' : \'items\' %></a>',
            '<% } %>',
            '<div class="todo-count"><b><%= remaining %></b> <%= remaining == 1 ? \'item\' : \'items\' %> left</div>',
        ]).join('')
    ),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
        "keypress #new-todo":  "createOnEnter",
        "click #clear-completed": "clearCompleted",
        "click #toggle-all": "toggleAllComplete"
    },

    initialize: function() {
        this.$el.html(this.template.join(''));

        this.$input = this.$("#new-todo");
        this.allCheckbox = this.$("#toggle-all")[0];
        this.$list = this.$('#todo-list');
        this.$footer = this.$('footer');
        this.$header = this.$('header');
        this.$main = this.$('#main');
    },

    render: function() {
        this.$el.appendTo(document.body);
        return this;
    },
    
    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
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

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
        var value = this.$input.val()
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

    toggleAllComplete: function () {
        var done = this.allCheckbox.checked;
        this.fireEvent('toggle.completed', [this, done]);
    }

});



