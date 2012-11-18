/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true, _:true*/
/*jshint expr:true, browser:true */


describe("Events", function() {

  describe("binding", function() {

    var model = new Backbone.Model();

    function createView(bindTestEvent, done){
      var View = Backbone.ViewMaster.extend({
        constructor: function() {
          Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
          bindTestEvent.call(this);
        },
        callback: function() {
          done(null, this);
        }
      });
      return new View({ model: model });
    }


    it(".bindTo(emitter, event, Function)", function(done){
      createView(function(){
        this.bindTo(this.model, "test", this.callback);
      }, done);
      model.trigger("test");
    });

    it(".bindTo(emitter, event, method string)", function(done){
      createView(function(){
        this.bindTo(this.model, "test", "callback");
      }, done);
      model.trigger("test");
    });

    it(".bindTo(emitter, event, Function, context)", function(done){
      var myContext = {};
      createView(function(){
        this.bindTo(this.model, "test", this.callback, myContext);
      }, function(err, context) {
        expect(context === myContext).to.be.ok;
        done();
      });
      model.trigger("test");
    });

    it("unbindFrom(binding) removes binding", function(done) {
      var view = new Backbone.ViewMaster();
      var emitter = new Backbone.Model();
      var binding = view.bindTo(emitter, "throw", function() {
        throw new Error("Event not unbound!");
      });

      view.unbindFrom(binding);
      emitter.trigger("throw");
      setTimeout(done, 1);
    });

    it("should be removed on view.remove()", function(){
      var model = new Backbone.Model();
      var view = new Backbone.ViewMaster();
      var spy = chai.spy();

      view.bindTo(model, "test", spy);
      model.trigger("test");
      view.remove();
      model.trigger("test");

      expect(spy).to.have.been.called.once;
    });

  });



  describe("bubble", function() {

    it("from children to parent", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      // to make sure there are no double event bindings
      parent.setViews(".container", child);
      parent.setViews(".container", child);

      parent.render();

      var spy = chai.spy();
      parent.on("test", spy);
      child.trigger("test");
      expect(spy).to.have.been.called.once;
    });


    _.each(["setViews", "appendViews", "prependViews"], function(viewMethod) {
      it("to new parent after a parent change with " + viewMethod, function(){
        var Parent = Backbone.ViewMaster.extend({
          template: function() {
            return "<div class=container></div>";
          }
        });

        var parent1 = new Parent();
        var parent2 = new Parent();
        var child = new Backbone.ViewMaster();
        child.template = function() {
          return "<span class=child>child</span>";
        };

        parent1[viewMethod](".container", child);
        parent1.render();

        parent2[viewMethod](".container", child);

        parent2.render();
        parent1.render();

        parent1.on("test", function() {
          throw new Error("Event on old parent");
        });

        var spy = chai.spy();
        parent2.on("test", spy);
        child.trigger("test");

        expect(spy).to.have.been.called.once;
      });
    });

    it("is unbound on remove()", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setViews(".container", child);
      parent.render();
      child.remove();

      var spy = chai.spy();
      parent.on("test", spy);
      child.trigger("test");

      expect(spy).to.not.have.been.called;
    });


  });



});
