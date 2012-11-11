
class window.CoffeeView extends Backbone.ViewMaster

  constructor: ->
    super

    @bindTo @model, "test", @callback

  callback: ->
    @model.trigger "done"
