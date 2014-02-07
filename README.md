<img src="https://github.com/epeli/backbone.viewmaster/raw/master/public_source/yuidoc-theme/assets/css/logo.png" >
<div class="github-only">

<div>
Read the stable release documention <a href="http://epeli.github.com/backbone.viewmaster/">here</a>.
</div>

[![Build Status](https://travis-ci.org/epeli/backbone.viewmaster.png?branch=master)](https://travis-ci.org/epeli/backbone.viewmaster)

</div>

# Backbone.Viewmaster

Few **tested** opinions on how to handle deeply nested views in [Backbone.js][]
focusing on modularity. This is implemented after writing several Backbone.js
applications and by carefully picking the recurring patterns seen on them.

Backbone.Viewmaster is a single View extended from Backbone.View. Views
extended from it can be infinitely nested with each others using the four
nesting methods [setView][], [appendView][], [prependView][] and
[insertView][].  There is no separate concept of layouts or list views. It's
just a humble Backbone View Class with versatile nesting capabilities.

The main idea behind Backbone.Viewmaster is that views should be small and
independent building blocks of application UI. Read the tutorial to see how
it's encouraged.

Created by [Esa-Matti Suuronen][esa] [@EsaMatti][].

# Download

  - [backbone.viewmaster.js][dev] 11kb, with comments
  - [backbone.viewmaster.min.js][production] 1kb, minified and gzipped

or use from npm with [Browserify](http://browserify.org/)

    npm install viewmaster

## Dependencies

  - [Backbone.js][] 0.9.9 or later

# API Docs

[Here][api]

# Tutorial

In this tutorial we build the classic TODO app and go through the most
important features of Backbone.Viewmaster while discussing the ideas behind
them.


## Basics

`Backbone.Viewmaster` is a View extended from `Backbone.View`. You start by
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
var TodoLayout = Backbone.Viewmaster.extend({

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

First thing you do for every Viewmaster view is set a [template][] function for
it.  It can be any function which takes a context object as the first argument
and returns neither a HTML string or a DOM object. The context object is by
default `this.model.toJSON()` or an empty object if your view does not have a
model.  You can customize this behavior by overriding the [context][] method.
There is no need to define the [render][] method. Viewmaster already defines it
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
var AddTodoItem = Backbone.Viewmaster.extend({

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

Nested views are also extended from `Backbone.Viewmaster`. Any Viewmaster view
can be nested in any Viewmaster view and you can do as deep nesting as you
want.

Since we wanted this to be the view for the `addview-container` and because
it's an element of `TodoLayout` it is the responsibility of `TodoLayout` to
nest it.  We do that in its constructor using the [setView][] method.

```javascript
// TodoLayout
constructor: function(){
  Backbone.Viewmaster.prototype.constructor.apply(this, arguments);
  // Nest AddTodoItem inside TodoLayout
  this.setView(".addview-container", new AddTodoItem({
    collection: this.collection
  }));
  // Render layout on when a todo is removed or added to update
  // the todo count
  this.listenTo(this.collection, "add remove", this.render);
},
```

Here it's important to notice that [setView][] and its friends, [appendView][],
[prependView][], [insertView][] and [getViews][] should be considered in Java
terms as protected methods. Which means you should use them only from within
the view definition. This is because they all take a CSS selector as the first
argument and because the CSS selectors are very implementation specific details
of your view. If you need to set the view from the outside create a setter
method for it to keep your views modular and maintainable.

Backbone 0.9.9 and later has a [listenTo][] method on every event emitter
object. This should be always used in views instead of the [on][] method. Using
it Backbone and Backbone.Viewmaster can automatically remove your view related
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
itself. The parent view only initialize child views.

### Multiple views in single container

We add new TodoItem views to our layout using the [appendView][] method
whenever a todo model is added to the collection. [refreshViews][]
is used to make child view changes visible.

Every view container can contain multiple views. Just start adding more views
to it if you need lists.

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.listenTo(this.collection, "add", this.addItem);
},

addItem: function(model){
  // Create new view for the todo item
  this.appendView("ul", new TodoItem({
    model: model
  }));
  // Render the new item and put it to DOM tree
  this.refreshViews();
}
```

The difference between [render][] and [refreshViews][] is that the latter one
updates only child view changes made with [setview][], [appendView][],
[prependView][] and [insertView][] and does not touch the parent itself. The
former renders the parent and then calls [refreshViews][].

[refreshViews][] will also take of of the initial rendering of child views if
they have not been rendered before.

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
```

Views can be also removed by replacing them with [setView][]. Viewmaster
automatically figures out which views were left out and calls [remove][] on
them on the next [refreshViews][] call.

If you need to use the view and its children again some time later use the
[detach][] method. It detaches the view from in its parent view, but leaves the
event callbacks and children untouched.

## Event bubbling and broadcasting

In order to keep views decoupled and resusable their implementation should not
assume too much about their children and especially about their parents.
Backbone.Viewmaster helps with this by implementing event bubbling and
broadcasting.

Event bubbling works exactly like in the DOM. Events triggered with the
[bubble][] method are bubbled up to their parents too. Broadcasting is the
opposite of this. Events triggered with the [broadcast][] method are
broadcasted down to the all child views too. These can be combined to make
loose dependencies between sibling views too.

Lets add search capabilities to our TODO app. We create a simple Search view
which bubbles 'search' events up to its parents.

```javascript
var Search = Backbone.Viewmaster.extend({

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
var TodoItemList = Backbone.Viewmaster.extend({

  constructor: function(){
    Backbone.Viewmaster.prototype.constructor.apply(this, arguments);

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

In [afterTemplate][]. It is executed right after the template is rendered but
before child views are added making it the perfect place to add them without
having to worry about side effects to the child views.

```javascript
afterTemplate: function(){
  this.$("element").jqueryPlugin();
}
```

# Changelog

## 1.2.3

  - README fix for npmjs.org

## 1.2.2

  - Backbone.Viewmaster is now prefed way to access the View.
    Backbone.ViewMaster is still available for backwards compatibility.
  - Backbone namespace is not polluted when Viewmaster is loaded as node
    module.

## 1.2.1

  - Define node module files

## 1.2.0

  - Add [afterTemplate][]
  - Views can be added as constructor functions now too. They will get `model`
    and `collection` attributes from their parent views automatically.
  - Removed experimental `elements` object which was never documented. Use
    `afterTemplate` from now on.

## 1.1.2

  - Release to npm for Browserify usage

## 1.1.1

  - Make sure view arrays don't mutate during iteration

## 1.1.0

  - Support Backbone.js 0.9.9
  - Remove `bindTo`, `unbindFrom` and `unbindAll` in favour of new Backbone
    methods [listenTo][] and [stopListening][] introduced in 0.9.9
  - Add [broadcast][] method
  - Replace implicit event bubbling on trigger with simpler explicit [bubble][]
    method
  - Rename `renderViews` to [refreshViews][]
  - Avoid detaches on [refreshViews][] call unless it is absolutely necessary
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
[api]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html

[listenTo]: http://backbonejs.org/#Events-listenTo
[stopListening]: http://backbonejs.org/#Events-stopListening
[on]: http://backbonejs.org/#Events-on

[setView]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_setView
[appendView]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_appendView
[prependView]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_prependView
[insertView]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_insertView
[template]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_template
[render]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_render
[afterTemplate]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_afterTemplate
[refreshViews]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_refreshViews
[context]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_context
[rendered]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#property_rendered
[getViews]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_getViews
[detach]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_detach
[remove]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_remove
[bubble]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_bubble
[broadcast]: http://epeli.github.com/backbone.viewmaster/classes/Viewmaster.html#method_broadcast

[todo-example]: https://github.com/epeli/backbone.viewmaster/tree/master/examples/todos
[todo-live]: http://epeli.github.com/backbone.viewmaster/examples/todos
