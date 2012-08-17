(function(){
    var resolveNamespace = function(className, root) {
        var parts = className.split('.'),
            root = root || window,
            current = root;

        for(var a = 0, b = parts.length; a < b; a++) {
            current = current[parts[a]] || {};
        }

        return current;
    };

    /**
     * @class Backbone.Application
     * @cfg {Object} options The list of options available within Application
     */
    var Application = function(options) {
        _.extend(this, options || {});
        
        this.eventbus = new EventBus({application: this});
        
        this.createApplicationNamespace();
        this.initialize.apply(this, arguments);

        $($.proxy(this.onReady, this));
    };

    _.extend(Application.prototype, {
        /**
         * @cfg {Object} nameSpace
         * Define the application namespace       
         */
        nameSpace: 'Application',
        
        models: {},
        collections: {},
        controllers: {},
        
        /**
         * @cfg {Object} allocationMap
         * Define the inner structure of our application object         
         * @cfg {String} allocationMap.model
         * @cfg {String} allocationMap.collection
         * @cfg {String} allocationMap.controller
         * @cfg {String} allocationMap.view
         */        
        allocationMap: {
            model: 'Models',
            collection: 'Collections',
            controller: 'Controllers',
            view: 'Views'
        },

        /**
         * Function to create inner sctructore of the application using {@link #allocationMap allocationMap} config
         */           
        createApplicationNamespace: function() {
            var nameSpace = window;

            // create global reference in the defined namespace
            if(this.nameSpace) {
                // if it wasn't already defined, create it
                if(typeof nameSpace[this.nameSpace] == 'undefined') {
                    nameSpace[this.nameSpace] = {}
                }
            }

            // let's have a link to the application namespace
            // this way we will be able to get all references to Models, Collections and Controllers
            // using givin namespace
            nameSpace[this.nameSpace] = this
            
            _.each(this.allocationMap, function(name, key) {
                this[name] = this[name] || {};
            }, this);
        },
        
        /**
         * Fuction that will be called during application instance creation
         */
        initialize: function() {},

        /**
         * Called on documentReady. This is global callback is used to:
         * * Used to initialize controllers and execute {@link Backbone.Controller#onLaunch onLaunch} callback
         * * Execute {@link Backbone.Application#launch launch} callback
         */
        onReady: function() {
            // initialize controllers
            this.initializeControllers(this.controllers || {});
            // call to controller.onLauch callback
            this.launchControllers();
            // call application.lauch callback
            this.launch.call(this);
        },

        /**
         * Function that will convert string identifier into the instance reference
         * @param {String} type Type of instance that should be resolved. See {@link #allocationMap} for valid values
         * @param {String[]} classes The list of class references
         * @return {Object} The objects map
         */ 
        getClasseRefs: function(type, classes) {
            var hashMap = {},
                allocationMap = this.allocationMap[type],
                root = this[allocationMap];

            _.each(classes, function(cls) {
                var classReference = resolveNamespace(cls, root),
                    id = cls.split('.').pop();

                hashMap[cls] = classReference;
            }, this);

            return hashMap;
        },
        
        /**
         * Fuction that will loop through all application conrollers and create their instances
         * Additionaly, read the list of models and collections from each controller and save the reference within application
         */
        initializeControllers: function(controllers) {
            this.controllers = {};

            _.each(controllers, function(ctrl) {
                var root =  this[this.allocationMap.controller],
                    classReference = resolveNamespace(ctrl, root),
                    id = ctrl.split('.').pop();

                var controller = new classReference({
                    id: ctrl,
                    application: this
                });

                controller.views = this.getClasseRefs('view', controller.views || []);

                _.extend(this.models, this.getClasseRefs('model', controller.models || []));
                _.extend(this.collections, this.getClasseRefs('collection', controller.collections || {}));

                this.buildCollections();
                this.controllers[ctrl] = controller;
            }, this);
        },

        /**
         * Launch all controllers using {@link Backbone.Controller#onLaunch callback}
         */
        launchControllers: function() {
            _.each(this.controllers, function(ctrl, id) {
                ctrl.onLaunch(this);
            }, this);
        },

        /**
         * Abstract fuction that will be called during application lauch
         */
        launch: function() {},

        /**
         * Function to add event listeners to the {@link #Backbone.EventBus EventBus}
         */
        addListeners: function(listeners, controller) {
            this.eventbus.addListeners(listeners, controller)
        },

        /**
         * Getter to retreive link to the particular controller instance by name
         * @param {String} name
         * @return {Backbone.Controller} The controller instance
         */
        getController: function(name) {
            return this.controllers[name];
        },

        /**
         * Getter to retreive link to the particular model instance by name
         * If model instance isn't created, create it
         * @param {String} name
         * @return {Backbone.Model} The model instance
         */
        getModel: function(name) {
            this._modelsCache = this._modelsCache || {};

            var model = this._modelsCache[name],
                modelClass = this.getModelConstructor(name);

            if(!model && modelClass) {
                model = this.createModel(name);
                this._modelsCache[name] = model;
            }

            return model || null;
        },

        /**
         * Getter to retreive link to the particular model consturctor by name
         * @param {String} name
         * @return {Backbone.Model} The model constructor
         */
        getModelConstructor: function(name) {
            return this.models[name];
        },

        /**
         * Function to create new model instance
         * @param {String} name The name of the model that needs to be created
         * @param {Object} options The list of option that should be passed to the model constructor
         */
        createModel: function(name, options) {
            var modelClass = this.getModelConstructor(name),
                options = _.extend(options || {});

            var model = new modelClass(options);

            return model;
        },

        /**
         * Getter to retreive link to the particular collection instance by name
         * If collection instance isn't created, create it
         * @param {String} name
         * @return {Backbone.Collection} The collection instance         
         */
        getCollection: function(name) {
            this._collectionsCache = this._collectionsCache || {};

            var collection = this._collectionsCache[name],
                collectionClass = this.getCollectionConstructor(name);

            if(!collection && collectionClass) {
                collection = this.createCollection(name);
                this._collectionsCache[name] = collection;
            }

            return collection || null;
        },

        /**
         * Getter to retreive link to the particular collection consturctor
         * @param {String} name
         * @return {Backbone.Collection} The collection constructor               
         */	
        getCollectionConstructor: function(name) {
            return this.collections[name];
        },

        /**
         * Function to create new collection instance
         * @param {String} name The name of the collection that needs to be created
         * @param {Object} options The list of option that should be passed to the collection constructor         
         */	
        createCollection: function(name, options) {
            var collectionClass = this.getCollectionConstructor(name),
                options = _.extend(options || {});

            var collection = new collectionClass()

            return collection;
        },

        /**
         * Function that will loop throught the list of collection constructors and create instances
         */
        buildCollections: function() {
            _.each(this.collections, function(collection, alias) {
                this.getCollection(alias);
            }, this);
        }
    });


    // Since we are using Backbone let's make sure that there are no conflicts in namespaces
    if(typeof Backbone.Application == 'undefined') {
        Backbone.Application = Application;
        /**
         * Method to create new Backbone.Application class
         * @static
         */    
        Backbone.Application.extend = Backbone.Model.extend;        
    }
    else {
        throw ('Native Backbone.Application instance already defined.')
    }

    /**
     * @class Backbone.Controller
     * @cfg {Object} options The list of options available within Controller
     */    
    var Controller = function(options) {
        _.extend(this, options || {});
        this.initialize.apply(this, arguments);
    };

    _.extend(Controller.prototype, {
        name: null,
        views: {},
        models: {},
        collections: {},

        initialize: function(options) {
        },

        /**
         * Add new listener to the application event bus
         * Delegate to {@link Backbone.Application#addListeners addListeners} callback
         */
        addListeners: function(listeners) {
            this.getApplication().addListeners(listeners, this);
        },

        /**
         * Callback fuction that will be executed after application lauch
         */	
        onLaunch: function(application) {
        },

        /**
         * Getter that will return the reference to the application instance
         
         */	
        getApplication: function() {
            return this.application;
        },

        /**
         * Getter that will return the reference to the view constructor by name
         * @param {String} name
         * @return {Backbone.View} The view constructor            
         */		
        getViewConstructor: function(name) {
            return this.views[name];
        },

        /**
         * Function to create a new view instance
         * All views are cached within _viewsCache hash map
         * @param {String} name
         * @param {Object} options Options to be passed within view constructor
         * @return {Backbone.View} The view instance            
         */
        createView: function(name, options) {
            var view = this.getViewConstructor(name),
                options = _.extend(options || {}, {
                    alias: name
                });

            return new view(options);
        },

        /**
         * Method to get model instance reference by name
         * Delegate to {@link Backbone.Application#getModel getModel} method
         */		
        getModel: function(name) {
            return this.application.getModel(name);
        },

        /**
         * Method to get model constructor reference by name
         * Delegate to {@link Backbone.Application#getModelConstructor getModelConstructor} method
         */		
        getModelConstructor: function(name) {
            return this.application.getModelConstructor(name);
        },

        /**
         * Method to create model instance by name
         * Delegate to {@link Backbone.Application#createModel createModel} method
         */		
        createModel: function(name, options) {
            return this.application.createModel(name)
        },

        /**
         * Delegate method to get collection instance reference by name
         * Delegate to {@link Backbone.Application#getCollection getCollection} method
         */		
        getCollection: function(name) {
            return this.application.getCollection(name);
        },

        /**
         * Delegate method to get collection constructor reference by name
         * Delegate to {@link Backbone.Application#getCollectionConstructor getCollectionConstructor} method
         */		
        getCollectionConstructor: function(name) {
            return this.application.getCollectionConstructor(name);
        },

        /**
         * Delegate method to create collection instance
         * Delegate to {@link Backbone.Application#createCollection createCollection} method
         */		
        createCollection: function(name, options) {
            return this.application.createCollection(name);
        },

        /**
         * Method to fire cross-controller event
         * Delegate to {@link Backbone.Application#fireEvent fireEvent} method
         */		
        fireEvent: function(selector, event, args) {
            this.application.eventbus.fireEvent(selector, event, args);
        }
    });

    if(typeof Backbone.Controller == 'undefined') {
        Backbone.Controller = Controller;
        /**
         * Method to create new Backbone.Controller class
         * @static
         */
        Backbone.Controller.extend = Backbone.Model.extend;        
    }
    else {
        throw ('Native Backbone.Controller instance already defined.')
    }

    /**
     * @class Backbone.EventBus
     * @cfg {Object} options The list of options available within Controller
     * @private
     */     
    var EventBus = function(options) {
        var me = this;

        _.extend(this, options || {});

        _.extend(Backbone.View.prototype, {
            alias: null,
            hidden: false,
            getAlias: function() {
                return this.options.alias;
            },
            /**
             * Instead of calling View.trigger lets use custom function
             * It will notify the EventBus about new event
             */
            fireEvent: function(event, args) {
                this.trigger.apply(this, arguments);
                me.fireEvent(this.getAlias(), event, args);
            },
            hide: function() {
                this.$el.hide();
                this.hidden = true;
            },
            show: function() {
                this.$el.show();
                this.hidden = false;
            }
        });
    };

    _.extend(EventBus.prototype, {
        pool: {},
        /**
         * Add new listeners to the event bus
         */
        addListeners: function(selectors, controller) {

            this.pool[controller.id] = this.pool[controller.id] || {};
            var pool = this.pool[controller.id];

            if(_.isArray(selectors)) {
                _.each(selectors, function(selector) {
                    this.addListeners(selector, controller);
                }, this)
            }
            else if(_.isObject(selectors)) {
                _.each(selectors, function(listeners, selector) {
                    _.each(listeners, function(listener, event) {
                        pool[selector] = pool[selector] || {};
                        pool[selector][event] = pool[selector][event] || [];

                        pool[selector][event].push(listener);

                    }, this);
                }, this)

            }
        },

        /**
         * Execute event listener by given selector and event name
         */
        fireEvent: function(selector, event, args) {
            var application = this.getApplication();

            _.each(this.pool, function(eventsPoolByAlias, controllerId) {
                var events = eventsPoolByAlias[selector];

                if(events) {
                    var listeners = events[event]
                        controller = application.getController(controllerId);

                    _.each(listeners, function(fn) {
                        fn.apply(controller, args);
                    });
                }


            }, this);
        },

        getApplication: function() {
            return this.application;
        }
    });

    // Since we are using Backbone let's make sure that there are no conflicts in namespaces
    if(typeof Backbone.EventBus == 'undefined') {
        Backbone.EventBus = EventBus;
    }
    else {
        throw ('Native Backbone.Application instance already defined.')
    }
    


})();