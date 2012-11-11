/*global describe:true, it:true, expect: true, Backbone: true, beforeEach: true, chai:true*/
/*jshint expr:true */

describe("Backbone.ViewMaster", function(){

  var Puppet = Backbone.ViewMaster.extend({
    name: "puppet",

    constructor: function(opts) {
      Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
      if (opts && opts.name) {
        this.name = opts.name;
      }
    },

    template: function(){
      return "<h1 class=child>" + this.name + "</h1>";
    }
  });


  var Master = Backbone.ViewMaster.extend({
    template: function(){
      return '<div class="container"></div>';
    }
  });

  it("is installed to Backbone namespace", function(){
    expect(Backbone.ViewMaster).to.be.ok;
  });


  it("renders child view from setViews", function(){
    var m = new Master();
    m.setViews(".container", new Puppet());
    m.render();
    expect(m.$el).to.have.text("puppet");
  });

  it("renders child view from setViews using an array", function(){
    var m = new Master();
    m.setViews(".container", [new Puppet()]);
    m.render();
    expect(m.$el).to.have.text("puppet");
  });

  it("renders child view from constructor", function(){
    var m = new Master({
      views: {
        ".container": new Puppet()
      }
    });
    m.render();
    expect(m.$el).to.have.text("puppet");
  });

  it("renders child view from constructor using an array", function(){
    var m = new Master({
      views: {
        ".container": [new Puppet()]
      }
    });
    m.render();
    expect(m.$el).to.have.text("puppet");
  });


  it("does not render child views twice", function(){
    var m = new Master();
    var p = new Puppet();
    var spy = p.render = chai.spy(p.render);

    m.setViews(".container", p);
    m.render();
    m.render();
    expect(spy).to.have.been.called.once;
  });

  it("force option renders child views", function(){
    var m = new Master();
    var p = new Puppet();
    var spy = p.render = chai.spy(p.render);

    m.setViews(".container", p);
    m.render();
    m.render({ force: true });
    expect(spy).to.have.been.called.twice;
  });

  it("can add new views with appendViews() after initial render", function(){
    var m = new Master();
    m.setViews(".container", new Puppet());
    m.render();

    m.appendViews(".container", new Puppet({ name: "newview" }));
    m.render();
    var childs = m.$(".child");

    expect(childs[0].innerHTML).to.eq("puppet");
    expect(childs[1].innerHTML).to.eq("newview");
  });

  it("can add new views with prependViews() after initial render", function(){
    var m = new Master();
    m.setViews(".container", new Puppet());
    m.render();

    m.prependViews(".container", new Puppet({ name: "newview" }));
    m.renderViews();
    var childs = m.$(".child");
    expect(childs[1].innerHTML).to.eq("puppet");
    expect(childs[0].innerHTML).to.eq("newview");
  });

  it("updates view order", function(){
    var m = new Master();
    var first = new Puppet({ name: "first" });
    var second = new Puppet({ name: "second" });

    m.setViews(".container", [first, second]);
    m.render();

    m.setViews(".container", [second, first]);
    m.renderViews();

    var childs = m.$(".child");
    expect(childs[0].innerHTML).to.eq("second");
    expect(childs[1].innerHTML).to.eq("first");
  });

  it("setViews&renderViews() removes old views", function(){
    var m = new Master();
    var views = [
      new Puppet({ name: "first" }),
      new Puppet({ name: "second" })
    ];

    m.setViews(".container", views);
    m.render();

    m.setViews(".container", views[1]);
    m.renderViews();

    expect(m.$el).to.not.have(views[0].$el);
    expect(m.$el).to.have(views[1].$el);

  });

  it("removeViews() removes view", function(){
    var m = new Master();
    var views = [
      new Puppet({ name: "first" }),
      new Puppet({ name: "second" })
    ];

    m.setViews(".container", views);
    m.render();

    m.removeViews(".container", views[0]);

    m.renderViews();

    expect(m.$el).to.not.have(views[0].$el);
    expect(m.$el).to.have(views[1].$el);

  });


  describe("with deeply nested views", function(){

    var ViewList = Backbone.ViewMaster.extend({
      template: function() {
        return '<h1>List<h1><div class="items"></div>';
      }
    });

    var Layout = Backbone.ViewMaster.extend({

      template: function() {
        return '<h1>Title<h1><div class="container"></div>';
      }

    });

    it("renders them all", function(){
      var children = [
        new Puppet({ name: "first" }),
        new Puppet({ name: "second" })
      ];
      var list = new ViewList({
        views: {
          ".items": children
        }
      });
      var layout = new Layout({
        views: {
          ".container": list
        }
      });

      layout.render();

      expect(layout.$el).to.contain("List");
      expect(layout.$el).to.contain("first");
      expect(layout.$el).to.contain("second");

    });

    it("does not render nested views twice", function(){

      var children = [
        new Puppet({ name: "first" }),
        new Puppet({ name: "second" })
      ];

      var spy = children[1].render = chai.spy(children[1].render);

      var list = new ViewList({
        views: {
          ".items": children
        }
      });

      var layout = new Layout({
        views: {
          ".container": list
        }
      });

      layout.render();
      layout.render();

      expect(spy).to.have.been.called.once;

    });

    it("option force calls nested views twice", function(){

      var children = [
        new Puppet({ name: "first" }),
        new Puppet({ name: "second" })
      ];

      var spy = children[1].render = chai.spy(children[1].render);

      var list = new ViewList({
        views: {
          ".items": children
        }
      });

      var layout = new Layout({
        views: {
          ".container": list
        }
      });

      layout.render();
      layout.render({ force: true });

      expect(spy).to.have.been.called.twice;

    });


  });
});
