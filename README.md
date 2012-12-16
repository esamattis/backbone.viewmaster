
<img src="https://github.com/epeli/backbone.viewmaster/raw/master/public_source/yuidoc-theme/assets/css/logo.png" >
<div class="github-only">

<div>
Read the stable release documention <a href="http://epeli.github.com/backbone.viewmaster/">here</a>.
</div>

[![Build Status](https://travis-ci.org/epeli/backbone.viewmaster.png?branch=master)](https://travis-ci.org/epeli/backbone.viewmaster)

</div>

# Backbone.ViewMaster

Few **tested** opinions on how to handle deeply nested views in [Backbone.js][]
focusing on encapsulation and reusability. This is implemented after writing
several Backbone.js applications and by carefully picking the recurring
patterns seen on them.

Backbone.ViewMaster is a single View extended from Backbone.View. Views
extended from it can be infinitely nested with each others using the four
nesting methods [setView][], [appendView][], [prependView][] and
[insertView][].  There is no separate concept of layouts or list views. It's
just a humble Backbone View Class with versatile nesting capabilities.

The main idea behind Backbone.ViewMaster is that views should be small and
independent building blocks of application UI. Read the tutorial to see how
it's encouraged.

Created by [Esa-Matti Suuronen][esa] [@EsaMatti][].

# Download

  - [backbone.viewmaster.js][dev] 11kb, with comments
  - [backbone.viewmaster.min.js][production] 1kb, minified and gzipped

## Dependencies

  - [jQuery](http://jquery.com/)
  - [Backbone.js][] 0.9.9 or later
  - [Underscore.js](http://underscorejs.org)

# API Docs

[Here][api]

# Tutorial

In this tutorial we build the classic TODO app and go through the most
important features of Backbone.ViewMaster while discussing the ideas behind
them.


## Basics

`Backbone.ViewMaster` is a View extended from `Backbone.View`. You start by
extending your custom views from it. Lets define a layout for our app with some
container elements for our nested views.

```
<script type="template" id="layout">
  <div class="header"></div>
  <hr>

  <h1>TODOs</h1>
  <div class="addview-container"></div>
  <div class="todo-container"></div>
  <div>You have <%= count %> todos</div>

  <hr>
  <div class="footer"></div>
</script>
```

```javascript
var TodoLayout = Backbone.ViewMaster.extend({

  template: function(context){
    return _.template($("#layout").html(), context);
  },

  context: function() {
    return {
      count: this.collection.size()
    };
  }

});
```

First thing you do for every ViewMaster view is set a [template][] function for
it.  It can be any function which takes a context object as the first argument
and returns neither a HTML string or a DOM object. The context object is by
default `this.model.toJSON()` or an empty object if your view does not have a
model.  You can customize this behavior by overriding the [context][] method.
There is no need to define the [render][] method. ViewMaster already defines it
and uses your template function to populate the `this.el` element.


## Nesting

Now we create a nested view for the `addview-container`.

```
<script type="template" id="addview">
  <input type="text">
  <button>Add</button>
</script>
```

```javascript
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
      text: this.$("input").text()
    });
  }

});
```

Nested views are also extended from `Backbone.ViewMaster`. Any ViewMaster view
can be nested in any ViewMaster view and you can do as deep nesting as you
want.

Since we wanted this to be the view for the `addview-container` and because
it's an element of `TodoLayout` it is the responsibility of `TodoLayout` to
nest it.  We do that in its constructor using the [setView][] method.

```javascript
// TodoLayout
constructor: function(){
  Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
  // Nest AddTodoItem inside TodoLayout
  this.setView(".addview-container", new AddTodoItem({
    collection: this.collection
  }));
  // Rerender layout to update todo count
  this.listenTo(this.collection, "add remove", this.render);
},
```

Here it's important to notice that [setView][] and its friends, [appendView][],
[prependView][], [insertView][] and [getViews][] should be considered in Java
terms as protected methods. Which means you should use them only from within
the view definition. This is because they all take a CSS selector as the first
argument and because the CSS selectors are very implementation specific details
of your view. If you need to set the view from the outside create a setter
method for it to keep your views encapsulated and maintainable.

Backbone 0.9.9 and later has a [listenTo][] method on every event emitter
object. This should be always used in views instead of the [on][] method. Using
it Backbone and Backbone.ViewMaster can automatically remove your view related
event bindings when you discard your views.

## Rendering

Now we are ready to create and render our nested view. We do that by calling
the default render method.

```javascript
var items = new Backbone.Collection();
var layout = new TodoLayout({
  collection: items
});

layout.render();
$("body").append(layout.el);
```

The [render][] method takes care of rendering itself and the initial rendering
of its child views. This means it will **render child views only once** unless
`{ force: true }` is passed to the render method. This is because normally it
should be the responsibility of the child view to know when it should render
itself. The parent view only helps child views to get started.

### Multiple views in single container

We add new TodoItem views to our layout whenever a todo model is added to the
collection. When a new child view is added you need to call [render][] or
[refreshViews][] on the parent view to make them visible.

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.listenTo(this.collection, "add", this.addItem);
},

addItem: function(model){
  this.appendView(".todo-container", new TodoItem({
    model: model
  }));
  this.refreshViews();
}
```

Here we use the [appendView][] method to append a view to `.todo-container`.
Every view container can contain multiple views. Just start adding more views
to it if you need lists.

The difference between [render][] and [refreshViews][] is that the latter one
renders only the new child views and adds them to the parent DOM tree leaving
the parent untouched otherwise while the former renders the parent itself and
the children.

## Removing views

Any view, parent or child, can be discarded with the [remove][] method. It
removes automatically all the Backbone and DOM event listeners. If the view is
a parent to other views it will call remove on them also.

```
<script type="template" id="item">
  <span class="item"><%= text %></span>
  <button class="edit">edit</button>
  <button class="done">x</button>
</script>
```

```javascript
var TodoItem = Backbone.ViewMaster.extend({

  constructor: function(){
    Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
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
    this.model.destroy();
    this.remove();
  },

  edit: function() {
    var newContent = prompt("Edit todo", this.$(".item").text());
    if (newContent !== null) this.model.set("text", newContent);
  }

});
```

Views can be also removed by replacing them with [setView][]. ViewMaster
automatically figures out which views were left out and calls [remove][] on
them on the next [refreshViews][] call.

If you need to use the view and its children again some time later use the
[detach][] method. It detaches the view from in its parent view, but leaves the
event callbacks and children untouched.

## Event bubbling and broadcasting

In order to keep views decoupled and resusable their implementation should not
assume too much about their children and especially about their parents.
Backbone.ViewMaster helps with this by implementing event bubbling and
broadcasting.

Event bubbling works exactly like in the DOM. Events triggered with the
[bubble][] method are bubbled up to their parents too. Broadcasting is the
opposite of this. Events triggered with the [broadcast][] method are
broadcasted down to the all child views too. These can be combined to make
loose dependencies between sibling views too.

Lets add search capabilities to our TODO app. We create a simple Search view
which bubbles 'search' events up to its parents.

```javascript
var Search = Backbone.ViewMaster.extend({

  template: function() {
    return "<input type=text placeholder=Search >";
  },

  events: {
    "keyup input": function(e) {
      // Bubble 'search' event up to parent layout
      this.bubble("search", $(e.target).val());
    }
  }

});
```

We'll abstract TodoItem listing to its own view and make it handle 'search'
event broadcasts.

```javascript
var TodoItemList = Backbone.ViewMaster.extend({

  constructor: function(){
    Backbone.ViewMaster.prototype.constructor.apply(this, arguments);

    // On load display all items
    this.setItems();

    // Add new TodoItem view on new item model
    this.listenTo(this.collection, "add", function(model) {
      this.appendView("ul", new TodoItem({
        model: model
      }));
      this.refreshViews();
    });

    // Filter out todos on 'search' event broadcasts
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
```

Now in the layout we just retrigger the bubbling 'search' event as a broadcast
to the TodoItemList.

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.todoItemList = new TodoItemList({ collection this.collection ));
  this.setView(".todo-container" this.todoItemList);
  this.setView(".header" new Search());

  // Listen on bubbled 'search' events from Search view
  this.listenTo(this, "search", function(searchString) {
    // Broadcast them to TodoItemList view
    this.todoItemList.broadcast("search", searchString);
  }
},
```

The cool thing about this is that the connection between the TodoItemList and
the Search view is completely decoubled without introducing a global event
object or manually passing some vent object to all your views. This makes unit
testing simpler and if we wanted to add an another search box to a footer
container we can just do that and that's it. No need to bind anything extra.

```javascript
this.setView(".footer" new Search());
```

Another important feature of bubbling and broadcasting is that the views can be
easily wrapped with other views and the event bindings would still work. You
don't have to do anything in your wrapper view. The events will simply bubble
and broadcast through it.


## Conclusion

That's about it. Check out the full working todo app in the examples
[directory][todo-example] or play with the live app [here][todo-live].


# FAQ

## How do I use jQuery plugins?

Just override the render method, call the super method and then do your jQuery
plugin stuff:

```javascript
render: function(){
  Backbone.ViewMaster.prototype.render.apply(this, arguments);
  this.$("element").jqueryPlugin();
}
```

# Changelog

## 1.1.0pre

  - Support Backbone.js 0.9.9
  - Remove `bindTo`, `unbindFrom` and `unbindAll` in favour of new Backbone
    methods [listenTo][] and [stopListening][] introduced in 0.9.9
  - Add [broadcast][] method
  - Replace implicit event bubbling on trigger with simpler explicit [bubble][]
    method
  - Rename `renderViews` to [refreshViews][]
  - Avoid detaches on [refreshViews][] call unless its absolutely necessary
  - Documentation updates

## 1.0.0

  - First release

# License

The MIT License. See LICENSE.

[Backbone.js]: http://backbonejs.org/
[@EsaMatti]: https://twitter.com/EsaMatti
[esa]: http://esa-matti.suuronen.org/
[dev]: http://epeli.github.com/backbone.viewmaster/lib/backbone.viewmaster.js
[production]: http://epeli.github.com/backbone.viewmaster/lib/backbone.viewmaster.min.js
[api]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html

[listenTo]: http://backbonejs.org/#Events-listenTo
[stopListening]: http://backbonejs.org/#Events-stopListening
[on]: http://backbonejs.org/#Events-on

[setView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_setView
[appendView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_appendView
[prependView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_prependView
[insertView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_insertView
[template]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_template
[render]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_render
[refreshViews]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_refreshViews
[context]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_context
[rendered]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#property_rendered
[getViews]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_getViews
[detach]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_detach
[remove]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_remove
[bubble]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_bubble
[broadcast]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_broadcast


[todo-example]: https://github.com/epeli/backbone.viewmaster/tree/master/examples/todos
[todo-live]: http://epeli.github.com/backbone.viewmaster/examples/todos
