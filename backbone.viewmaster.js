/*global Backbone:true,  _:true, define:true */
/*jshint boss:true, browser:true */

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
        if (opts) this._views = opts.views;
        var views = this._views = this._views || {};
        this._eventBindings = [];

        _.keys(views).forEach(function(key){
          views[key] = ensureArray(views[key]);
        });

        this._remove = [];
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

      // Unbind all event bound with bindTo
      unbindAll: function() {
        var binding, i;
        for (i = 0; i < this._eventBindings.length; i += 1) {
          binding = this._eventBindings[i];
          binding.emitter.off(binding.event, binding.callback, binding.context);
        }
        this._eventBindings = [];
      },



      elements: {},

      template: function(){
        throw new Error("Template function not defined!");
      },

      context: function() {
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

        this.$el.html(this.template(this.context()));
        this.refreshElements();

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
          if (opts.force || !view.rendered) {
            view.render(opts);
          }
        });

        this.eachView(function(containerSel, view) {
          self.$(containerSel).append(view.el);
        });

        return this;
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
        var self = this;
        var previousViews;
        currentViews = ensureArray(currentViews);

        if (previousViews = this._views[containerSel]) {
          var removedViews = _.difference(previousViews, currentViews);
          removedViews.forEach(function(view) {
            self._remove.push(view);
          });
        }

        this._views[containerSel] = currentViews;
        return this;
      },

      getViews: function(containerSel) {
        return this._views[containerSel];
      },

      appendViews: function(containerSel, views) {
        this._views[containerSel] =
          (this._views[containerSel] || []).concat(ensureArray(views));
        return this;
      },

      prependViews: function(containerSel, views) {
        this._views[containerSel] =
          (ensureArray(views)).concat(this._views[containerSel] || []);
        return this;
      },

      removeViews: function(containerSel, toBeRemoved){
        var self = this;
        if (!this._views[containerSel]) return this;

        toBeRemoved = ensureArray(toBeRemoved);

        this._views[containerSel] =
          _.reject(this._views[containerSel], function(view) {
          return _.contains(toBeRemoved, view);
        });

        toBeRemoved.forEach(function(view){
          self._remove.push(view);
        });

        return this;
      },

      remove: function() {
        Backbone.View.prototype.remove.apply(this, arguments);
        this.unbindAll();
        return this;
      }

    });

  }

  if (typeof Backbone === "object" && typeof _ === "function") {
    factory(Backbone, _);
    window.ViewMaster = Backbone.ViewMaster = ViewMaster;
  }

  if (typeof define === "function" && define.amd) {
    define(["backbone", "underscore"], function(Backbone, _) {
      factory(Backbone, _);
      return ViewMaster;
    });
  }

}());
