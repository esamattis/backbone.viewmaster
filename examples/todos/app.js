/*global Backbone:true,  _:true, define:true, $:true, prompt:true */
/*jshint boss:true, browser:true */


var AddTodoItem = Backbone.ViewMaster.extend({

  template: function(context){
    return _.template($("#addview").html(), context);
  },

  events: {
    "click button": "addTodo"
  },

  addTodo: function(e){
    e.preventDefault();
    this.collection.add(new Backbone.Model({
      text: this.$("input").val()
    }));
    this.$("input").val("");
  }

});

var TodoItem = Backbone.ViewMaster.extend({

  constructor: function(){
    Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
    this.bindTo(this.model, "change", this.render);
  },

  template: function(context){
    return _.template($("#item").html(), context);
  },

  events: {
    "click .done": "done",
    "click .edit": "edit"
  },

  done: function(){
    this.model.destroy();
    this.remove();
  },

  edit: function() {
    var newContent = prompt("Edit todo", this.$(".item").text());
    if (newContent !== null) this.model.set("text", newContent);
  }

});


var TodoLayout = Backbone.ViewMaster.extend({

  constructor: function(){
    Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
    this.setView(".addview-container", new AddTodoItem({
      collection: this.collection
    }));
    this.bindTo(this.model, "change", this.render);
    this.bindTo(this.collection, "add", this.addItem);
  },

  template: function(context){
    return _.template($("#layout").html(), context);
  },

  addItem: function(model){
    this.appendView(".todo-container", new TodoItem({
      model: model
    }));
    this.refreshViews();
  }

});


$(document).ready(function() {
  var items = new Backbone.Collection();
  var app = new Backbone.Model();
  var layout = new TodoLayout({
    model: app,
    collection: items
  });

  layout.render();
  $("body").append(layout.el);
  app.set("name", prompt("Your name"));
});
