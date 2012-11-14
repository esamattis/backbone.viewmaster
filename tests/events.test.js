/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true*/
/*jshint expr:true */


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

  });


  describe("management", function() {

    it("should remove binding on view.remove()", function(){
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

});
