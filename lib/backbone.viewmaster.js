/*global Backbone:true,  _:true, define:true */
/*jshint boss:true, browser:true */

(function(root, factory) {

  // Expose into global Backbone namespace if Backbone is global
  if (typeof root.Backbone === "object" && typeof root._ === "function") {
    root.Backbone.ViewMaster = factory(Backbone, _);
  }

  // If we have AMD try requiring Backbone and build with it
  if (typeof define === "function" && define.amd) {
    define(["backbone", "underscore"], function(Backbone, _) {
      return Backbone.ViewMaster || factory(Backbone, _);
    });
  }

}(this, function (Backbone, _) {

  function ensureArray(ob){
    return _.isArray(ob) ? ob : [ob];
  }

  /**
   * Few tested opinions on how to handle deeply nested views in Backbone.js focusing on encapsulation and reusability.
   *
   * <https://github.com/epeli/backbone.viewmaster>
   *
   * ***NOTE**: Most important methods `setView`, `appendView`, `prependView`
   * and `removeView` are protected methods.*
   *
   * @class Backbone.ViewMaster
   * @extends Backbone.View
   * */
  return Backbone.View.extend({

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

      this._views = {};
      this._eventBindings = [];
      this._remove = [];
      this._parent = null;
      this._bubble = null;
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
      if (!emitter || !event || !callback) {
        throw new Error("Bad arguments. The signature is <emitter>, <event>, <callback / callback name>, [context]");
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
     * Unbind all event callbacks this view has bound with `bindTo`. Internally
     * called by `remove`.
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

    /**
     * TODO: doc me
     *
     * @property elements
     **/
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
     * Default: this.model.toJSON() or an empty object if view has no model.
     *
     * @method context
     * @return {Object} context
     **/
    context: function() {
      if (this.model) return this.model.toJSON();
      return {};
    },


    /**
     * Render view with `this.template(this.context())` and call
     * `this.renderViews(options)` to render childViews.
     *
     * @method render
     * @param {Object} options
     *   @param {Boolean} [options.force]
     *   force rerendering of child views
     * @return {Object} this
     **/
    render: function(opts) {
      opts = _.extend({}, opts);

      // Remove subviews with detach. This way they don't lose event handlers
      this._detachViews();
      opts.detach = false;

      this.$el.html(this.template(this.context()));
      var key, selector;
      for (key in this.elements) {
        selector = this.elements[key];
        this[key] = this.$(selector);
      }

      // Mark this view as rendered. Parent view wont try to render this
      // anymore unless force:true is passed
      this.rendered = true;

      this.renderViews(opts);

      return this;
    },


    /**
     *
     * Render child views only.
     *
     * @method renderViews
     * @param {Object} options
     *   @param {Boolean} [options.force]
     *   force rerendering of child views
     * @return {Object} this
     **/
    renderViews: function(opts) {
      var self = this;
      opts = _.extend({ detach: true }, opts);

      var oldView;
      while (oldView = this._remove.shift()) oldView.remove();
      if (opts.detach) this._detachViews();

      this.eachView(function(containerSel, view) {
        if (opts.force || !view.rendered) view.render(opts);
        self.$(containerSel).append(view.el);
      });

      return this;
    },

    /**
     * Detach view from its parent.
     *
     * @private
     * @method _removeParent
     * @return {Object} this
     **/
    _removeParent: function() {

      if (!this._parent) return;

      var key;
      for (key in this._parent._views) {
        this._parent._views[key] = _.without(
          this._parent._views[key], this
        );
      }

      this.unbindFrom(this._bubble);
      this._bubble = null;
      this._parent = null;

      return this;
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

    _prepareViews: function(views) {
      var self = this;
      ensureArray(views).forEach(function(view) {

        // when parent is changing remove it from previous
        if (view._parent && view._parent !== self) {
          view._removeParent();
        }

        if (!view._bubble) {
          view._bubble = view.bindTo(view, "all", function(eventName, arg) {
            self.trigger(eventName, view, arg);
          }, view);
        }

        view._parent = self;
      });
    },

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
      var self = this;
      _.keys(this._views).forEach(function(containerSel) {
        var views = self._views[containerSel];
        if (!views) return;
        views.forEach(function(view) {
          fn(containerSel, view);
        });
      });
    },

    _detachViews: function() {
      this.eachView(function(containerSel, view) {
        view.$el.detach();
      });
    },

    /**
     * Set a view or an array of views to a given view container.
     *
     * @method setView
     * @protected
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
      return this;
    },

    getViews: function(containerSel) {
      return this._views[containerSel];
    },

    /**
     * Append a view or an array of views to a given view container.
     *
     * @method appendView
     * @protected
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    appendView: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = (this._views[containerSel] || []).concat(
        ensureArray(views)
      );
      return this;
    },

    /**
     * Prepend a view or an array of views to a given view container.
     *
     * @method prependView
     * @protected
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View object or an array of view objects
     **/
    prependView: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = ensureArray(views).concat(
        this._views[containerSel] || []
      );
      return this;
    },

    /**
     * Remove a child view or an array of views from this view.
     *
     * @method removeView
     * @protected
     * @param {String} selector CSS selector for the view container
     * @param {Object/Array} view(s) View or array of views
     * @return {Object} this
     **/
    removeViews: function(containerSel, toBeRemoved){
      if (!this._views[containerSel]) return this;
      toBeRemoved = ensureArray(toBeRemoved);

      this._views[containerSel] = _.difference(
        this._views[containerSel],
        toBeRemoved
      );

      this._remove = this._remove.concat(toBeRemoved);
      return this;
    },

    /**
     * Remove this view and all its children for good. Clears all events bound
     * for this view.  Use `detach` instead if you need to use the view again
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
}));
