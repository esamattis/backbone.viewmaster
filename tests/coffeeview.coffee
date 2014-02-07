
class window.CoffeeView extends Backbone.Viewmaster

  constructor: ->
    super

    @listenTo @model, "test", @callback

  callback: ->
    @model.trigger "done"
