/*global Backbone:true,  _:true */
/*jshint boss:true, browser:true */

(function() {
  var VERSION = "1.1.0pre";

  function ensureArray(ob){
    return _.isArray(ob) ? ob : [ob];
  }

  /**
   * Few tested opinions on how to handle deeply nested views in Backbone.js focusing on encapsulation and reusability.
   *
   * <https://github.com/epeli/backbone.viewmaster>
   *
   * @class Backbone.ViewMaster
   * @extends Backbone.View
   * */
  Backbone.ViewMaster = Backbone.View.extend({

    constructor: function(opts) {
      Backbone.View.prototype.constructor.apply(this, arguments);


      /**
       * Boolean indicating whether this view has been rendered at least once.
       * Set by the `render` method and used by the parent view.
       *
       * @property rendered
       * @type Boolean
       **/
      this.rendered = false;

      /**
      * Reference to the parent view.
      *
      * @property parent
      * @type Object
      **/
      this.parent = null;

      /**
      * Object containing all child views. Key are CSS selectors and values
      * are arrays of views
      *
      * @private
      * @property _views
      * @type Object
      **/
      this._views = {};


      /**
      * Array containing all event binding bound with `bindTo`
      *
      * @private
      * @property _eventBindings
      * @type Array
      **/
      this._eventBindings = [];

      /**
      * Array of views to be removed on next `refreshViews` call.
      *
      * @private
      * @property _remove
      * @type Array
      **/
      this._remove = [];

      /**
      * Event bubbling binding.
      * @private
      * @property _bubble
      * @type Object
      **/
      this._bubble = null;

      /**
      * Record of view container with changes
      *
      * @private
      * @type Object
      **/
      this._dirty = {};
    },



    /**
     * Bind a callback function to a given Backbone event emitter for the
     * lifetime of the view.
     *
     * @method bindTo
     * @param {Object} emitter Any Backbone events object
     * @param {String} event
     * @param {Function/String} callback Callback function or view method as string
     * @param {Object} [context] Callback context. Defaults to view instance
     * @return {Object} binding
     *
     **/
    bindTo: function(emitter, event, callback, context) {
      var binding;
      context = context || this;
      if (typeof callback === "string") {
        callback = this[callback];
      }

      binding = {
        emitter: emitter,
        context: context,
        callback: callback,
        event: event
      };

      emitter.on(event, callback, context);
      this._eventBindings.push(binding);
      return binding;
    },


    /**
     * Unbind all event callbacks this view has bound with `bindTo`.
     *
     * @method unbindAll
     * @return {Object} this
     **/
    unbindAll: function() {
      var binding;
      while(binding = this._eventBindings.shift()) this.unbindFrom(binding);
      return this;
    },


    /**
     * Unbind single `binding` bound with `bindTo`.
     *
     * @method unbindFrom
     * @param {Object} binding
     **/
    unbindFrom: function(binding) {
      binding.emitter.off(binding.event, binding.callback, binding.context || this);
      return this;
    },

    elements: {},

    /**
     * Template function. User must override this!
     *
     * @method template
     * @param {Object} context
     * @return {String / DOM object} rendered template
     **/
    template: function(){
      throw new Error("Template function not defined!");
    },

    /**
     * Returns the context object for the `template` method.
     *
     * Default: `this.model.toJSON()` or an empty object if view has no model.
     *
     * @method context
     * @return {Object} context
     **/
    context: function() {
      if (this.model) return this.model.toJSON();
      return {};
    },


    /**
     * Render this view with `this.template(this.context())` and refresh child
     * views with `this.refreshViews(options)`.
     *
     * @method render
     * @param {Object} options
     *   @param {Boolean} [options.force]
     *   force rerendering of child views
     * @return {Object} this
     **/
    render: function(opts) {
      opts = opts || {};

      // Remove subviews with detach. This way they don't lose event handlers
      // and parent view can rerender itself
      this.eachView(function(containerSel, view) {
        view.$el.detach();
      });

      opts.detached = true;

      this.$el.html(this.template(this.context()));

      // Set element properties from this.elements
      var key, selector;
      for (key in this.elements) {
        selector = this.elements[key];
        this[key] = this.$(selector);
      }

      // Mark this view as rendered. Parent view wont try to render this
      // anymore unless force:true is passed
      this.rendered = true;

      this.refreshViews(opts);

      return this;
    },


    /**
     *
     * Refresh any child view changes made with `setView`, `appendView`,
     * `prependView` or `insertView`. Trys to avoid doing any work unless
     * it is absolutely needed or `{ force: true }` is passed.
     *
     * It calls `render` on child views only when a child has never been
     * rendered before.
     *
     * @method refreshViews
     * @param {Object} options
     *   @param {Boolean} [options.force]
     *   force rerendering of child views
     * @return {Object} this
     **/
    refreshViews: function(opts) {
      opts = opts || {};
      var self = this;
      var dirty = this._dirty;

      var oldView;
      while (oldView = this._remove.shift()) oldView.remove();

      this.eachView(function(containerSel, view) {
        // Detach view from container if it is dirty to update possible view
        // order changes.
        var refresh = dirty[containerSel] || opts.force;

        // Render child view only if it never has been rendered before.
        var render = !view.rendered || opts.force;

        if (refresh) view.$el.detach();
        if (render) view.render(opts);
        if (refresh || opts.detached) self.$(containerSel).append(view.el);
      });

      this._dirty = {};
      return this;
    },

    /**
     * Detach view from its parent but keep it in DOM.
     *
     * @private
     * @method _removeParent
     * @return {Object} this
     **/
    _removeParent: function() {

      if (!this.parent) return;

      var key;
      for (key in this.parent._views) {
        this.parent._views[key] = _.without(
          this.parent._views[key], this
        );
      }

      this.unbindFrom(this._bubble);
      this._bubble = null;
      this.parent = null;

      return this;
    },


    /**
     * Prepare views to be nested in this view. Set up event bubbling and
     * remove possible previous parent.
     *
     * @private
     * @method _prepareViews
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    _prepareViews: function(views) {
      var self = this;
      _.each(ensureArray(views), function(view) {

        // when parent is changing remove it from previous
        if (view.parent && view.parent !== self) {
          view._removeParent();
        }

        // Bind bubbling
        if (!view._bubble) {
          view._bubble = view.bindTo(view, "all", function() {
            var arg = arguments[1];
            if (!arg || typeof(arg.parent) === "undefined" || arg.parent) {
              self.trigger.apply(self, arguments);
            }
          }, view);
        }

        view.parent = self;
      });
    },

    /**
     * Same as original Backbone trigger, but the events are bubbled up to the
     * parent views unless object with `parent: false` or `parent: null` is
     * passed with the first event object.
     *
     * @method trigger
     * @param {String} event Event name
     * @param {Object} [object*] Zero or more objects to be passed along with
     * the event
     * @return {Object} this
     **/
    // trigger: function() { },

    /**
     * Iterate each child view.
     *
     * @method eachView
     * @param {Function} iterator
     *   @param {String} iterator.selector CSS selector for the view container
     *   @param {Object} iterator.view The view object
     * @return {Object} this
     **/
    eachView: function(fn) {
      var containerSel, view, i, views = this._views;
      for (containerSel in views) {
        for (i = 0; i < views[containerSel].length; i++) {
          view = views[containerSel][i];
          fn(containerSel, view);
        }
      }
    },


    /**
     * Set a view or an array of views to a given view container.
     *
     * If previous set of views is replaced by a new set — the views not
     * present in the new set will be discarded with `remove` on the next
     * `refreshViews` call unless detached with `detach` method.
     *
     * @protected
     * @method setView
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    setView: function(containerSel, currentViews) {
      var previousViews;
      currentViews = ensureArray(currentViews);

      if (previousViews = this._views[containerSel]) {
        this._remove = this._remove.concat(
            _.difference(previousViews, currentViews)
        );
      }

      this._prepareViews(currentViews);
      this._views[containerSel] = currentViews;
      this._dirty[containerSel] = true;
      return this;
    },

    /**
     * Insert view or array of views to specific index in the view array.
     *
     * @protected
     * @method insertView
     * @param {String} selector CSS selector for the view container
     * @param {Number} index Index to insert view(s)
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    insertView: function(containerSel, index, views) {
      var current;
      if (current = this._views[containerSel]) {
        current.splice.apply(current, [index, 0].concat(ensureArray(views)));
      }
      else {
        this._views[containerSel] = ensureArray(views);
      }

      this._dirty[containerSel] = true;
      return this;
    },

    /**
     * Append a view or an array of views to a given view container.
     *
     * @protected
     * @method appendView
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    appendView: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = (this._views[containerSel] || []).concat(
        ensureArray(views)
      );

      this._dirty[containerSel] = true;
      return this;
    },

    /**
     * Prepend a view or an array of views to a given view container.
     *
     * @protected
     * @method prependView
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    prependView: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = ensureArray(views).concat(
        this._views[containerSel] || []
      );

      this._dirty[containerSel] = true;
      return this;
    },

    /**
     * Get views for given container
     *
     * @protected
     * @method getViews
     * @param {String} selector container CSS selector
     * @return {Array} views
     **/
    getViews: function(containerSel) {
      var views;
      if (views = this._views[containerSel]) return views.slice();
    },

    /**
     * Detaches view from its parent and DOM.
     *
     * @method detach
     * @return {Object} this
     **/
    detach: function() {
      this._removeParent();
      this.$el.detach();
      return this;
    },


    /**
     * Discard this view and all its children for good. Clears all events bound
     * for the view. Use `detach` instead if you need to use the view again
     * some time later.
     *
     * @method remove
     * @return {Object} this
     **/
    remove: function() {
      Backbone.View.prototype.remove.apply(this, arguments);
      this.unbindAll();
      this._removeParent();
      this.eachView(function(containerSel, view) {
        view.remove();
      });
      return this;
    }

  });

  Backbone.ViewMaster.VERSION = VERSION;


})();
