
# Backbone.ViewMaster

Few **tested** opinions on how to handle deeply nested views in [Backbone.js][]
focusing on encapsulation and reusability. This is implemented after writing
several Backbone.js applications and by carefully picking the recurring
patterns seen on them.

Backbone.ViewMaster is a single View extended from Backbone.View. Views created
from it can be infinitely nested with each others using the four nesting
methods: [setView][], [appendView][], [prependView][] and [insertView][]. They
work also with arrays of views. There is no separate concept of layouts or list
views. It's just a humble Backbone view boosted with nesting capabilities.


# Download

  - [backbone.viewmaster.js][dev] **5.9K**
  - [backbone.viewmaster.min.js][production] **2.9K**

# API

[Here][api]

# Tutorial

In this tutorial we build the classic TODO app and go through the most
important features of Backbone.ViewMaster while discussing the ideas behind
them.


## Basics

`Backbone.ViewMaster` is a View extended from `Backbone.View`. You start by
extending your custom views from it. Lets define a layout for our app with some
container elements for our nested views.

```html
<script type="template" id="layout">
<h1><%= name %> TODOs</h1>
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
and returns neighter a HTML string or a DOM object. The context object is by
default `this.model.toJSON()` or an empty object if your view does not have a
model.  You can customize this behavior by overriding the [context][] method.
There is no need to define the [render][] method. ViewMaster already defines it
and uses your template function to populate the `this.el` element.

## Event management

Next we bind to the model object's change events to reflect the model state. We
do that in the constructor of the `TodoLayout`.

```javascript
// TodoLayout
constructor: function(){
  Backbone.ViewMaster.prorotype.constructor.apply(this, arguments);
  this.bindTo(this.model, "change", this.render);
},
```

We use the [bindTo][] method of the MasterView instead of using the
`this.model.on(...)` method of the model to make sure that all the view related
event callbacks are automatically unbound when the view is discarded.

## Nesting

Now we create a nested view for the `addview-container`.

```html
<script type="template" id="addview">
<input type="text">
<button>Add</button>
</script>
```

```javascript
var AddView = Backbone.ViewMaster.extend({

  template: function(context){
    return _.template($("#addview").html(), context);
  },

  events: {
    "click button": "addTodo"
  },

  addTodo: function(e){
    e.preventDefault();
    this.collection.add(new Backbone.Model({
      action: this.$("input").text()
    });
  }

});
```

Nested views are also extended from `Backbone.ViewMaster`. Any ViewMaster view
can be nested in any ViewMaster view and you can do as deep nesting as you
want. You could also nest plain Backbone views if you handle manually event
callback unbinding and make sure that it won't collide with the [rendered][]
property.

Since we wanted this to be the view for the `addview-container` and because
it's an element of `TodoLayout` — it is the responsibility of `TodoLayout` to
nest it.  We do that in its constructor using the [setView][] method.

```javascript
// TodoLayout
constructor: function(){
  Backbone.ViewMaster.prorotype.constructor.apply(this, arguments);
  this.bindTo(this.model, "change", this.render);
  this.setView(".addview-container", new AddView({
    collection: this.collection
  });
},
```

Here it's important to notice that [setView][] and its friends, [appendView][],
[prependView][], [insertView][] and [getViews][] should be considered in Java
terms as protected methods. Which means you should use them only from within
the view definition. This is because they all take a CSS selector as the first
argument and because the CSS selectors are very implementation specific details
of your view. If you need to set the view from the outside create a setter
method for it to keep your views encapsulated and maintainable.


## Rendering

Now we are ready to create and render our nested view. We do that by calling
the default render method.

```javascript
var layout = new TodoLayout();
layout.render();
$("body").append(layout.el);
```

The render method takes care of rendering itself and the intial rendering of
its child views. This means it will **render child views only once** unless `{
force: true }` is passed to the render method. This is because normally it
should be the responsibility of the child view to know when it should render
itself. The parent view only helps child views to get started.

### Child views

When new child views are added you need to call [render][] or [renderViews][]
on the parent view to make them visible.

```javascript
// TodoLayout
constructor: function(){
  ... snip ...
  this.bindTo(this.collection, "add", this.addItem);
},

addItem: function(model){
  // The trivial TodoItem implementation is omitteted here. See the examples
  // directory
  this.appendView(".todo-container", new TodoItem({
    model: model
  }));
  this.renderViews();
}
```

Here we use the [appendView][] method to append a view to `.todo-container`
when a model is added to the collection. Every view container can contain
multible views. Just start adding more views to it if you need lists.

The difference between [render][] and [renderViews][] is that the latter one
renders only the new child views and adds them to the parent DOM tree leaving
the parent untouched otherwise while the former renders the parent itself and
the children.

## Removing views

Any view, parent or child, can be discarded anytime with the [remove][] method.
It removes automatically all the Backbone and DOM event callbacks. If the view
is a parent to other views it will call remove on them also.

If you need to use the view or its children again some time later use the
[detach][] method. It removes the view from in its parent view, but leaves the
event callbacks untouched and children untouched.

## Event bubbling

In order to keep views resusable their implementation should not asume anything
about their parents. When you need to communicate with the parent use events to
send messages to them. Backbone.ViewMaster helps with this by implementing DOM
like event bubbling: Event triggered in a child view is also seen on its
parents all the way up to the view tree unless explicitly silenced.


[Backbone.js]: http://backbonejs.org/
[dev]: https://github.com/epeli/backbone.viewmaster/raw/master/lib/backbone.viewmaster.js
[production]: https://github.com/epeli/backbone.viewmaster/raw/master/lib/backbone.viewmaster.min.js
[api]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html

[setView]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_setView
[appendView]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_appendView
[prependView]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_prependView
[insertView]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_insertView
[bindTo]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_bindTo
[template]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_template
[render]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_render
[renderViews]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_renderViews
[context]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_context
[rendered]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#property_rendered
[getViews]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_getViews
[detach]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_detach
[remove]: http://epeli.github.com/backbone.viewmaster/docs/classes/Backbone.ViewMaster.html#method_remove

