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


});
