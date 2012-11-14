/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true*/
/*jshint expr:true */

describe("Elements object", function(){

  var View = Backbone.ViewMaster.extend({
    elements: {
      "$title": "h1",
      "$items": "li"
    },

    template: function() {
      return "<h1>Elements test</h1><ul><li>first</li><li>second</li><ul>";
    }

  });

  it("fetches elements to view instance after render", function(){
    var view = new View();
    expect(view.$title).to.be.not.ok;
    view.render();

    expect(view.$title).to.be.ok;
    expect(view.$title.text()).to.eq("Elements test");

    expect(view.$items.size()).to.eq(2);

  });

  it("refreshElements()", function() {
    var view = new View();
    view.elements = {
      "$test": ".test"
    };

    view.render();
    expect(view.$test.size()).to.eq(0);

    view.$el.append("<div class=test></div>");
    view.refreshElements();

    expect(view.$test.size()).to.eq(1);

  });

  it("cannot access child views", function(){
    var view = new Backbone.ViewMaster();
    var child = new Backbone.ViewMaster();

    view.template = function() {
      return "<div class=container></div>";
    };

    child.template = function() {
      return "<div class=child>Child!</div>";
    };

    view.setViews(".container", child);

    view.elements = {
      "$child": ".child"
    };

    view.render();

    expect(view.$child).to.be.ok;
    expect(view.$child.size()).to.eq(0);

  });

});
