/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true*/
/*jshint expr:true */

describe("Backbone.PuppetView", function(){

  it("is installed to Backbone namespace", function(){
    expect(Backbone.PuppetView).to.be.ok;
  });

  it("Adds model to instance", function(){
    var model = new Backbone.Model();
    var view = new Backbone.PuppetView({
      model: model
    });
    expect(view.model === model).to.be.ok;
  });


  describe("event binding", function() {

    var model = new Backbone.Model();

    function createView(bindTestEvent, done){
      var View = Backbone.PuppetView.extend({
        constructor: function() {
          Backbone.PuppetView.prototype.constructor.apply(this, arguments);
          bindTestEvent.call(this);
        },
        callback: function() {
          done(null, this);
        }
      });
      return new View({ model: model });
    }


    it("binds events with .bindTo(emitter, event, Function)", function(done){
      createView(function(){
        this.bindTo(this.model, "test", this.callback);
      }, done);
      model.trigger("test");
    });

    it("binds events with .bindTo(emitter, event, method string)", function(done){
      createView(function(){
        this.bindTo(this.model, "test", "callback");
      }, done);
      model.trigger("test");
    });

    it("binds events with .bindTo(emitter, event, Function, context)", function(done){
      var myContext = {};
      createView(function(){
        this.bindTo(this.model, "test", this.callback, myContext);
      }, function(err, context) {
        expect(context === myContext).to.be.ok;
        done();
      });
      model.trigger("test");
    });

  });


  describe("events management", function() {


    it("should remove binding on view.remove()", function(){
      var model = new Backbone.Model();
      var view = new Backbone.PuppetView();
      var spy = chai.spy();

      view.bindTo(model, "test", spy);
      model.trigger("test");
      view.remove();
      model.trigger("test");

      expect(spy).to.have.been.called.once;
    });



  });

  describe("elements object", function(){
    var View = Backbone.PuppetView.extend({
      elements: {
        "title": "h1",
        "items": "li"
      },

      template: function() {
        return "<h1>Elements test</h1><ul><li>first</li><li>second</li><ul>";
      }

    });

    it("fetches elements to view instance after render", function(){
      var view = new View();
      expect(view.title).to.be.not.ok;
      view.render();

      expect(view.title).to.be.ok;
      expect(view.title.text()).to.eq("Elements test");

      expect(view.items.size()).to.eq(2);

    });


  });


});
