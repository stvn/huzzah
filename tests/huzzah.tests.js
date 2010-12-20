TestCase('hza.mvc', {
  'test should define Model': function () {
    assertFunction(hza.Model);
  },

  'test should define Controller': function () {
    assertFunction(hza.Controller);
  },

  'test should define View': function () {
    assertFunction(hza.View);
  },

  'test should define Component': function () {
    assertFunction(hza.Component);
  }
});

TestCase('hza.Model', {
  'test should be albe to instantiate a model': function () {
    var model = new hza.Model();
    assertObject(model);
  }    
});

TestCase('hza.Controller', {
  setUp: function () {
    this.model = new hza.Model();
  },

  'test should be albe to instantiate a model': function () {
    controller = new hza.Controller(this.model);
  }    
});

TestCase('hza.View', {
  setUp: function () {
    this.model = new hza.Model();
    this.controller = new hza.Controller(this.model);
  },

  'test should be albe to instantiate a model': function () {
    var view = new hza.View('view', this.controller);
  }    
});
