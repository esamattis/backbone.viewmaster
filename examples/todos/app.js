/*global Backbone:true,  _:true, define:true, $:true, prompt:true */
/*jshint boss:true, browser:true */


var AddTodoItem = Backbone.Viewmaster.extend({

  template: function(context){
    return $("#addview").html();
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

var TodoItem = Backbone.Viewmaster.extend({

  constructor: function(){
    Backbone.Viewmaster.prototype.constructor.apply(this, arguments);
    // Rerender view after edit
    this.listenTo(this.model, "change", this.render);
  },

  template: function(context){
    return _.template($("#item").html(), context);
  },

  events: {
    "click .done": "done",
    "click .edit": "edit"
  },

  done: function(){
    // When todo task is completed destroy the model and remove the view
    this.model.destroy();
    this.remove();
  },

  edit: function() {
    var newContent = prompt("Edit todo", this.model.get("text"));
    if (newContent !== null) this.model.set("text", newContent);
  }

});

var TodoItemList = Backbone.Viewmaster.extend({

  constructor: function(){
    Backbone.Viewmaster.prototype.constructor.apply(this, arguments);

    // On load display all items
    this.setItems();

    // Add new TodoItem view on new item model
    this.listenTo(this.collection, "add", function(model) {
      // Create new view for the todo item
      this.appendView("ul", new TodoItem({
        model: model
      }));
      // Render the new item and put it to DOM tree
      this.refreshViews();
    });

    // Filter out todos on 'search' broadcast events
    this.listenTo(this, "search", function(searchString) {
      this.setItems(this.collection.filterSearch(searchString));
      this.refreshViews();
    });

  },

  template: function() {
    return "<ul></ul>";
  },

  setItems: function(items) {
    items = items || this.collection;
    this.setView("ul", items.map(function(model) {
      return new TodoItem({
        model: model
      });
    }));
  }

});

var Search = Backbone.Viewmaster.extend({

  template: function() {
    return "<input type=text placeholder=Search >";
  },

  events: {
    "keyup input": function(e) {
      // Bubble search event up to parent layout
      this.bubble("search", $(e.target).val());
    }
  }

});

var TodoLayout = Backbone.Viewmaster.extend({

  constructor: function(){
    Backbone.Viewmaster.prototype.constructor.apply(this, arguments);

    // Nest AddTodoItem inside TodoLayout
    this.setView(".addview-container", AddTodoItem);

    this.todoItemList = new TodoItemList({
      collection: this.collection
    });
    this.setView(".todo-container", this.todoItemList);

    // Add two search fields
    this.setView(".header", Search);
    this.setView(".footer", Search);

    // Listen on bubbled search events from both Search views
    this.listenTo(this, "search", function(searchString) {
      // Broadcast them to TodoItemList view
      this.todoItemList.broadcast("search", searchString);
    });

    // Render layout on when a todo is removed or added to update
    // the todo count
    this.listenTo(this.collection, "add remove", this.render);
  },

  template: function(context){
    return _.template($("#layout").html(), context);
  },

  context: function() {
    return {
      count: this.collection.size()
    };
  }

});


$(document).ready(function() {
  // Collection containing all todo items
  var items = new Backbone.Collection();

  items.filterSearch = function(searchString) {
    // Do not filter anything on empty string
    if (!searchString.trim()) return null;

    return this.filter(function(item) {
      return item.get("text").indexOf(searchString) !== -1;
    });
  };

  // Initialize whole layout
  var layout = new TodoLayout({
    collection: items
  });

  layout.render();
  $("body").append(layout.el);
});
