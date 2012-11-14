/*global Backbone:true,  _:true, define:true */
/*jshint boss:true */

(function() {
  var ViewMaster;

  function ensureArray(ob){
    return _.isArray(ob) ? ob : [ob];
  }

  function factory(Backbone, _) {
    if (ViewMaster) return;

    ViewMaster = Backbone.View.extend({

      constructor: function(opts) {
        Backbone.View.prototype.constructor.apply(this, arguments);
        if (opts) this.views = opts.views;
        var views = this.views = this.views || {};
        this._eventBindings = [];

        _.keys(views).forEach(function(key){
          views[key] = ensureArray(views[key]);
        });

        this._remove = [];
      },


      template: function(){
        throw new Error("Template function not defined!");
      },

      elements: {},

      viewJSON: function() {
        if (this.model) return this.model.toJSON();
        return {};
      },

      refreshElements: function() {
        var key, selector;
        for (key in this.elements) {
          selector = this.elements[key];
          this[key] = this.$(selector);
        }
      },

      render: function(opts) {
        opts = _.extend({}, opts);

        // Remove subviews with detach. This way they don't lose event handlers
        this._detachViews();
        opts.detach = false;

        this.$el.html(this.template(this.viewJSON()));
        this.refreshElements();

        this.rendered = true;

        this.renderViews(opts);

        return this;
      },

      bindTo: function(emitter, event, callback, context) {
        var binding;
        context = context || this;
        if (typeof callback === "string") {
          callback = this[callback];
        }
        if (!emitter || !event || !callback) {
          throw new Error("Bad arguments. The signature is <emitter>, <event>, <callback / callback name>, [context]");
        }
        emitter.on(event, callback, context);
        binding = {
          emitter: emitter,
          context: context,
          callback: callback,
          event: event
        };
        this._eventBindings.push(binding);
        return binding;
      },

      unbindAll: function() {
        var binding, i;
        for (i = 0; i < this._eventBindings.length; i += 1) {
          binding = this._eventBindings[i];
          binding.emitter.off(binding.event, binding.callback, binding.context);
        }
        this._eventBindings = [];
      },

      remove: function() {
        Backbone.View.prototype.remove.apply(this, arguments);
        this.unbindAll();
        return this;
      },

      eachView: function(fn) {
        var self = this;
        _.keys(this.views).forEach(function(containerSelector) {
          var views = self.views[containerSelector];
          if (!views) return;
          views.forEach(function(view) {
            fn(containerSelector, view);
          });
        });
      },

      _detachViews: function() {
        this.eachView(function(containerSelector, view) {
          view.$el.detach();
        });
      },


      renderViews: function(opts) {
        var self = this;
        opts = _.extend({ detach: true }, opts);

        var oldView;
        while (oldView = this._remove.shift()) oldView.remove();
        if (opts.detach) this._detachViews();

        this.eachView(function(containerSelector, view) {
          if (opts.force || !view.rendered) {
            view.render(opts);
          }
        });

        this.eachView(function(containerSelector, view) {
          self.$(containerSelector).append(view.el);
        });

        return this;
      },

      setViews: function(containerSelector, currentViews) {
        var self = this;
        var previousViews;
        currentViews = ensureArray(currentViews);

        if (previousViews = this.views[containerSelector]) {
          var removedViews = _.difference(previousViews, currentViews);
          removedViews.forEach(function(view) {
            self._remove.push(view);
          });
        }

        this.views[containerSelector] = currentViews;
        return this;
      },

      getViews: function(containerSelector) {
        return this.views[containerSelector];
      },

      appendViews: function(containerSelector, views) {
        this.views[containerSelector] =
          (this.views[containerSelector] || []).concat(ensureArray(views));
        return this;
      },

      prependViews: function(containerSelector, views) {
        this.views[containerSelector] =
          (ensureArray(views)).concat(this.views[containerSelector] || []);
        return this;
      },

      removeViews: function(containerSelector, toBeRemoved){
        var self = this;
        if (!this.views[containerSelector]) return this;

        toBeRemoved = ensureArray(toBeRemoved);

        this.views[containerSelector] = _.reject(this.views[containerSelector], function(view) {
          return _.contains(toBeRemoved, view);
        });

        toBeRemoved.forEach(function(view){
          self._remove.push(view);
        });

        return this;
      }

    });

  }

  if (typeof Backbone === "object" && typeof _ === "function") {
    factory(Backbone, _);
    Backbone.ViewMaster = ViewMaster;
  }

  if (typeof define === "function" && define.amd) {
    define(["backbone", "underscore"], function(Backbone, _) {
      factory(Backbone, _);
      return ViewMaster;
    });
  }

}());
