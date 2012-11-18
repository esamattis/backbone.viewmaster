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

  return Backbone.View.extend({

    constructor: function(opts) {
      Backbone.View.prototype.constructor.apply(this, arguments);

      this.rendered = false;
      this._views = {};
      this._eventBindings = [];
      this._remove = [];
      this._parent = null;
      this._bubble = null;
    },



    // Managed event bind
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

    // Unbind all event bound with bindTo
    unbindAll: function() {
      var binding;
      while(binding = this._eventBindings.shift()) this.unbindFrom(binding);
      return this;
    },

    unbindFrom: function(binding) {
      binding.emitter.off(binding.event, binding.callback, binding.context || this);
      return this;
    },

    elements: {},

    template: function(){
      throw new Error("Template function not defined!");
    },

    context: function() {
      if (this.model) return this.model.toJSON();
      return {};
    },


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


    renderViews: function(opts) {
      var self = this;
      opts = _.extend({ detach: true }, opts);

      var oldView;
      while (oldView = this._remove.shift()) oldView.remove();
      if (opts.detach) this._detachViews();

      this.eachView(function(containerSel, view) {


        if (opts.force || !view.rendered) view.render(opts);
      });

      this.eachView(function(containerSel, view) {
        self.$(containerSel).append(view.el);
      });

      return this;
    },

    detachParent: function() {

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
    },

    _prepareViews: function(views) {
      var self = this;
      ensureArray(views).forEach(function(view) {

        // when parent is changing remove it from previous
        if (view._parent && view._parent !== self) {
          view.detachParent();
        }

        if (!view._bubble) {
          view._bubble = view.bindTo(view, "all", function(eventName, arg) {
            self.trigger(eventName, view, arg);
          }, view);
        }

        view._parent = self;
      });
    },

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

    setViews: function(containerSel, currentViews) {
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

    appendViews: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = (this._views[containerSel] || []).concat(
        ensureArray(views)
      );
      return this;
    },

    prependViews: function(containerSel, views) {
      this._prepareViews(views);
      this._views[containerSel] = ensureArray(views).concat(
        this._views[containerSel] || []
      );
      return this;
    },

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

    remove: function() {
      Backbone.View.prototype.remove.apply(this, arguments);
      this.unbindAll();
      this.detachParent();
      return this;
    }

  });

}));
