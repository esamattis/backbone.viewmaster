
class window.CoffeeView extends Backbone.ViewMaster

  constructor: ->
    super

    @listenTo @model, "test", @callback

  callback: ->
    @model.trigger "done"
