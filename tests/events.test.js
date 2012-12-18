/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true, _:true*/
/*jshint expr:true, browser:true */


describe("Event", function() {

  describe("binding", function() {

    var model = new Backbone.Model();

    it("context is the view", function(done){
      var view = new Backbone.ViewMaster();
      var emitter = _.extend({}, Backbone.Events);
      view.listenTo(emitter, "test", function() {
        expect(this).to.eq(view);
        done();
      });
      emitter.trigger("test");
    });


    it("should be removed on view.remove()", function(){
      var model = new Backbone.Model();
      var view = new Backbone.ViewMaster();
      var spy = chai.spy();

      view.listenTo(model, "test", spy);
      model.trigger("test");
      view.remove();
      model.trigger("test");

      expect(spy).to.have.been.called.once;
    });

    it("is unbound on parent.remove()", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setView(".container", child);
      parent.render();

      var spy = chai.spy();
      var emitter = new Backbone.Model();
      child.listenTo(emitter, "test", spy);

      parent.remove();

      emitter.trigger("test");
      expect(spy).to.not.have.been.called.once;
    });

    it("is not unbound on view.detach()", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setView(".container", child);
      parent.render();

      var spy = chai.spy();
      var emitter = new Backbone.Model();
      child.listenTo(emitter, "test", spy);

      parent.detach();
      emitter.trigger("test");
      expect(spy).to.have.been.called.once;
    });

  });



  describe("bubbling", function() {

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
      parent.setView(".container", child);
      parent.setView(".container", child);

      parent.render();

      var spy = chai.spy();
      parent.on("test", spy);
      child.bubble("test");
      expect(spy).to.have.been.called.once;
    });

    it("passes options to parent", function(done){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setView(".container", child);

      parent.render();

      parent.on("test", function(arg1, arg2) {
        expect(arg1).to.eq(1);
        expect(arg2).to.eq(2);
        done();
      });

      child.bubble("test", 1, 2);
    });

    it("multiple levels", function(done){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      var grandparent = new Backbone.ViewMaster();
      grandparent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setView(".container", child);
      grandparent.setView(".container", parent);

      grandparent.render();

      grandparent.on("test", function(arg1, arg2) {
        expect(arg1).to.eq(1);
        expect(arg2).to.eq(2);
        done();
      });

      child.bubble("test", 1, 2);
    });

    it("dont break dom bubbling", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      // to make sure there are no double event bindings
      parent.setView(".container", child);
      parent.setView(".container", child);

      parent.render();

      var spy = chai.spy();

      parent.$el.on("click", spy);
      child.$("p").click();
      expect(spy).to.have.been.called.once;

    });


    _.each(["setView", "appendView", "prependView"], function(viewMethod) {
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
        child.bubble("test");

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

      parent.setView(".container", child);
      parent.render();
      child.remove();

      var spy = chai.spy();
      parent.on("test", spy);
      child.trigger("test");

      expect(spy).to.not.have.been.called.once;
    });

    it("is unbound when parent is removed", function(){
      var child = new Backbone.ViewMaster();
      child.template = function() {
        return "<p>child</p>";
      };

      var parent = new Backbone.ViewMaster();
      parent.template = function() {
        return "<div class=container ></div>";
      };

      parent.setView(".container", child);
      parent.render();

      var spy = chai.spy();
      parent.on("test", spy);

      parent.remove();

      child.trigger("test");

      expect(spy).to.not.have.been.called.once;
    });


  });

  describe("broadcasting", function() {

    it("broadcasts events to all children", function(){
      var layout = new VM({ name: "layout" });
      var header = new VM({ name: "header" });
      var main = new VM({ name: "main" });
      var child = new VM({ name: "child" });

      layout.setView(".header", header);
      layout.setView(".container", main);
      main.setView(".container", child);
      layout.render();

      var spy = chai.spy();
      header.on("test", spy);
      main.on("test", spy);
      child.on("test", spy);

      layout.broadcast("test");

      expect(spy).to.have.been.called.exactly(3);
    });

    it("sends arguments", function(done){
      var layout = new VM({ name: "layout" });
      var main = new VM({ name: "main" });
      layout.setView(".container", main);
      layout.render();

      main.on("test", function(arg1, arg2) {
        expect(arg1).to.eq(1);
        expect(arg2).to.eq(2);
        done();
      });

      layout.broadcast("test", 1, 2);

    });

    it("events does not bubble up", function() {
      var layout = new VM({ name: "layout" });
      var main = new VM({ name: "main" });
      layout.setView(".container", main);
      layout.render();

      var spy = chai.spy();
      layout.on("test", spy);
      main.broadcast("test");

      // expect(spy).to.have.been.not_called; // TODO: does not really assert not called!!?
      expect(spy.__spy.calls.length).to.eq(0);
    });

    it("does not interfere with other bubbling events", function() {
      var layout = new VM({ name: "layout" });
      var main = new VM({ name: "main" });
      layout.setView(".container", main);
      layout.render();

      main.on("test", function() {
        main.bubble("other");
      });

      var spy = chai.spy();
      layout.on("other", spy);
      layout.broadcast("test");

      expect(spy).to.have.been.called.once;
    });

  });

});
