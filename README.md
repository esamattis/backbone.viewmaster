<img src="https://github.com/epeli/backbone.viewmaster/raw/master/public_source/yuidoc-theme/assets/css/logo.png" >

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

  - [backbone.viewmaster.js][dev] **5.9K**
  - [backbone.viewmaster.min.js][production] **2.8K**

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
  <h1><%= name %>'s TODOs</h1>
  <div class="addview-container"></div>
  <ul class="todo-container"></ul>
</script>
```

```javascript
var TodoLayout = Backbone.ViewMaster.extend({

  template: function(context){
    return _.template($("#layout").html(), context);
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

<!--
TODO: add tests
You could also nest plain Backbone views as the leaf views if you manually
handle event callback unbinding and make sure that it won't collide with the
[rendered][] and few other private properties.
-->

Since we wanted this to be the view for the `addview-container` and because
it's an element of `TodoLayout` it is the responsibility of `TodoLayout` to
nest it.  We do that in its constructor using the [setView][] method.

```javascript
// TodoLayout
constructor: function(){
  Backbone.ViewMaster.prototype.constructor.apply(this, arguments);
  this.setView(".addview-container", new AddTodoItem({
    collection: this.collection
  }));
},
```

Here it's important to notice that [setView][] and its friends, [appendView][],
[prependView][], [insertView][] and [getViews][] should be considered in Java
terms as protected methods. Which means you should use them only from within
the view definition. This is because they all take a CSS selector as the first
argument and because the CSS selectors are very implementation specific details
of your view. If you need to set the view from the outside create a setter
method for it to keep your views encapsulated and maintainable.

## Event management

Event management is important part of view management in Backbone.js.
Unfortunately the event callbacks start easily leaking memory if you don't
remember to unbind them when you are done with the views. ViewMaster helps with
this by introducing a [bindTo][] method which is bound to the view context.  It
will unbind all event callbacks automatically when you discard the view with
[remove][].

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.bindTo(this.model, "change", this.render);
},
```

## Rendering

Now we are ready to create and render our nested view. We do that by calling
the default render method.

```javascript
var items = new Backbone.Collection();
var app = new Backbone.Model();
var layout = new TodoLayout({
  model: app,
  collection: items
});

layout.render();
$("body").append(layout.el);
app.set("name", prompt("Your name"));
```

The render method takes care of rendering itself and the initial rendering of
its child views. This means it will **render child views only once** unless `{
force: true }` is passed to the render method. This is because normally it
should be the responsibility of the child view to know when it should render
itself. The parent view only helps child views to get started.

### Child views


We add new TodoItems to our layout whenever a todo model is added to the
collection. When a new child view is added you need to call [render][] or
[renderViews][] on the parent view to make them visible.

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.bindTo(this.model, "change", this.render);
  this.bindTo(this.collection, "add", this.addItem);
},

addItem: function(model){
  this.appendView(".todo-container", new TodoItem({
    model: model
  }));
  this.renderViews();
}
```

Here we use the [appendView][] method to append a view to `.todo-container`
when a model is added to the collection. Every view container can contain
multiple views. Just start adding more views to it if you need lists.

The difference between [render][] and [renderViews][] is that the latter one
renders only the new child views and adds them to the parent DOM tree leaving
the parent untouched otherwise while the former renders the parent itself and
the children.

## Removing views

Any view, parent or child, can be discarded with the [remove][] method.  It
removes automatically all the Backbone and DOM event callbacks. If the view is
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
```

Views can be also removed by replacing them with [setView][]. ViewMaster
automatically figures out which views was left out and calls [remove][] on them
on the next [renderViews][] call.

If you need to use the view and its children again some time later use the
[detach][] method. It removes the view from in its parent view, but leaves the
event callbacks untouched and children untouched.

## Event bubbling

In order to keep views decoupled and resusable their implementation should not
assume anything about their parents. When you need to communicate with the
parent use events to send messages to them. Backbone.ViewMaster helps with this
by implementing DOM like event bubbling: Event triggered in a child view is
also seen on its parents all the way up to the view tree unless explicitly
silenced.

```javascript
// Bubbled event "refresh" to parents
view.trigger("refresh");

// Do not bubble event "myevent" to parents
view.trigger("myevent", { parent: false });
```

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

## Doesn't `Backbone.View#dispose()` unbind events already on remove?

Some. It only works with events bound to `this.model` or `this.collection` and
it also requires that the view is passed as the context object to the `on`
method. To make sure that all events are always unbound on remove I recommend
that you use always `view.bindTo(...)` with Backbone.ViewMaster.

*DISCLAIMER: `dispose()` is a feature of unreleased Backbone.js version and it
might change before actual release.*

# License

The MIT License. See LICENSE.

[Backbone.js]: http://backbonejs.org/
[@EsaMatti]: https://twitter.com/EsaMatti
[esa]: http://esa-matti.suuronen.org/
[dev]: http://epeli.github.com/backbone.viewmaster/backbone.viewmaster.js
[production]: http://epeli.github.com/backbone.viewmaster/backbone.viewmaster.min.js
[api]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html

[setView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_setView
[appendView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_appendView
[prependView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_prependView
[insertView]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_insertView
[bindTo]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_bindTo
[template]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_template
[render]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_render
[renderViews]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_renderViews
[context]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_context
[rendered]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#property_rendered
[getViews]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_getViews
[detach]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_detach
[remove]: http://epeli.github.com/backbone.viewmaster/classes/Backbone.ViewMaster.html#method_remove


[todo-example]: https://github.com/epeli/backbone.viewmaster/tree/master/examples/todos
[todo-live]: http://epeli.github.com/backbone.viewmaster/examples/todos
