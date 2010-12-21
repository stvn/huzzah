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
  setUp: function () {
    this.model = new hza.Model('testModel');
    this.model.create('test', 'some value');
  },

  'test should be albe to instantiate a model': function () {
    assertObject(this.model);
  },

  'test should be able to create property':  function () {
    //create moved to setup for use in other tests
    assertEquals('some value', this.model._dataStore.test);
  },

  'test should return string representation of key/value of property': function () {
    assertEquals('key: test value: some value type: string', this.model.toString('test'));
  },

  'test should be able to find a property': function () {
    assertEquals('some value', this.model.find('test'));
  },

  'test should be able to update a property': function () {
    this.model.update('test', 'something else');
    assertEquals('something else', this.model.find('test'));
  },

  'test should be able to destroy a property': function () {
    this.model.destroy('test');
    assertUndefined(this.model.find('test'));
  },

  'test should publish event after create': function () {
    var response;
    gin.events.subscribe('testModel/create', function (value) {
      response = value;
    });
    this.model.create('wicked', 'yippee');
    assertEquals('yippee', response);
  },

  'test should publish event after update': function () {
    var response;
    gin.events.subscribe('testModel/update', function (value) {
      response = value;
    });
    this.model.update('wicked', 'yippee');
    assertEquals(['wicked', 'yippee'], response);  
  },

  'test should publish event after destroy': function () {
    var response;
    gin.events.subscribe('testModel/destroy', function (value) {
      response = value;
    });
    this.model.destroy('wicked');
    assertEquals('wicked', response);    
  },  
});

TestCase('hza.Controller and hza.View', {
  setUp: function () {
    this.model      = new hza.Model('testModel');
    this.controller = new hza.Controller(this.model);
    this.indexView  = new hza.View('index', this.controller);
    this.newView    = new hza.View('new', this.controller);
    this.showView   = new hza.View('show', this.controller);
    this.editView   = new hza.View('edit', this.controller);

    //seed _dataStore
    this.model.create('test1', 'test1');
    this.model.create('test2', 'test2');
    this.model.create('test3', 'test3');
  },

  'test should be albe to instantiate a controller': function () {
    //moved to setup
  },

  'test should have a reference to it\'s model': function () {
    assertTrue(this.controller._model === this.model);
  },

  'test should render index view': function () {
    var response;
    gin.events.subscribe('index/afterRender', function (view) {
      response = view;
    });
    this.controller.index();
    assertEquals('index', response);
  },

  'test should render new view': function () {
    var response;
    gin.events.subscribe('new/afterRender', function (view) {
      response = view;
    });
    this.controller.new();
    assertEquals('new', response);
  },

  'test should render show view': function () {
    var response;
    gin.events.subscribe('show/afterRender', function (view) {
      response = view;
    });
    this.controller.show();
    assertEquals('show', response);
  },

  'test should render edit view': function () {
    var response;
    gin.events.subscribe('edit/afterRender', function (view) {
      response = view;
    });
    this.controller.edit();
    assertEquals('edit', response);
  },

  'test should update model and redirect to show view': function () {
    var response;
    gin.events.subscribe('show/afterRender', function (view) {
       response = view;
    });
    this.controller.update('test1', 'test1_new');
    assertEquals('test1_new', this.model.find('test1'));
    assertEquals('show', response);  
  },

  'test should create model property and redirect to show view': function () {
    var response;
    gin.events.subscribe('show/afterRender', function (view) {
       response = view;
    });
    this.controller.update('test2', 'test1_new');
    assertEquals('test1_new', this.model.find('test2'));
    assertEquals('show', response);  
  },

  'test should destroy property on model and redirect to index view': function () {
    var response;
    gin.events.subscribe('index/afterRender', function (view) {
       response = view;
    });
    this.controller.destroy('test1');
    assertEquals('index', response);
    assertUndefined(this.model.find('test1'));
  }  
});

