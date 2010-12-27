gin.ns('hza.router', {
  controllers: {},
  current: null,

  route: function (path) {
    //sample path: controller/view/id
    var segments = path.split('/'),
        controller = segments[0],
        view = segments[1],
        id = segments[2 ? segments[2] : null];
    
    this.getResource(controller, view, id);
    this.current = path;
  },

  getResource: function (controller, view, id) {
    if (this.controllers[controller] && this.controllers[controller][view]) {
      this.current = [controller, view, id]; 
      this.controllers[controller][view](id);
    } else {
      throw new Error('Routing Error: No matching route.');
    }
  },

  loadCurrent: function () {
    this.getResource(this.current);           
  },

  registerController: function (controller) {
    this.controllers[controller.name] = controller;
  }

});

gin.Class('hza.Model', {
  name: null,
  _dataStore: {},
  _controller: {},
  _views: [],  

  init: function (name) {
    if (!name) {throw new Error('A name is required.'); }
    this.name = name;
  },

  create: function (key, value) {
    //TODO: additionally accept an object literal
    this._beforeCreate();
    this._dataStore[key] = value;
    this._afterCreate();
    this._notify('create', value);
  },

  find: function (key) {
    return this._dataStore[key];
  },  

  all: function () {
    return this._dataStore;
  },

  update: function (key, value) {
    this._beforeUpdate();
    this._dataStore[key] = value;
    this._afterUpdate();
    this._notify('update', [key, value]);
  },

  destroy: function (key) {
    this._beforeDestroy();
    delete this._dataStore[key];
    this._afterDestroy();
    this._notify('destroy', key);
  },

  _beforeCreate: function () {
    
  },

  _afterCreate: function () {

  },

  _beforeUpdate: function () {
                 
  },

  _afterUpdate: function () {
               
  },

  _beforeDestroy: function () {
                                
  },

  _afterDestroy: function () {
                
  },

  toString: function (key) {
    var value = this._dataStore[key];
    return 'key: ' + key + ' value: ' + value + ' type: ' + typeof value;
  },

  _registerController: function (controller) {
    this._controller = controller;
  },

  _registerView: function (view) {
    this._views.push(view);
  },

  _notify: function (topic, message) {
    gin.events.publish(this.name + '/' + topic, [message]);
  }
  
});

gin.Class('hza.Controller', {
  name: null,
  router: hza.router,
  _currentView: null,
  _viewMap: {},
  _model: {},
  _views: [],

  init:  function (name, model) {
    if (!name || !model) { throw new Error('A name and/or model required.'); } 
    this.name = name;
    this._registerModel(model);
    this._registerWithRouter();
  },

  index: function () {
    var data = this._model.all();
    this.render('index', data); 
  },

  new: function () {
    this.render('new');
  },

  create: function (key, value) {
    this._model.create(key, value);
    this.redirectTo('show', this._model.find(key));
  },

  show: function (key) {
    var data = this._model.find(key);
    this.render('show', data);
  },

  edit: function (key) {
    var data = this._model.find(key);
    this.render('edit', data);
  },

  update: function (key, value) {
    this._model.update(key, value);
    this.redirectTo('show', this._model.find(key));
  },

  destroy: function (key) {
    this._model.destroy(key);
    this.redirectTo('index');
  },

  render: function (viewName, data) {
    if (this._currentView) { this._currentView.hide(); }
    var view = this._getView(viewName);
    if (!view) { throw new Error(viewName + ' does not exist.'); }
    view.render(data);
  },

  redirectTo: function (view, data) {
    this.render(view, data)
  },

  _registerModel: function (model) {
    this._model = model;
    this._model._registerController(this);
  },

  _registerView: function (view, bindData) {
    this._views.push(view);
    this._viewMap[view.name] = this._views.length - 1;
    this._model._registerView(view);
    if (!this[view.name]) {
      this._createViewAction(view, bindData);
    }
  },

  _registerWithRouter: function () {
    this.router.registerController(this);
  },

  _createViewAction: function (view, bindData) {
    this[view.name] = gin.bind(this, function () {
      this.render(view.name, bindData);
    });
  },

  _getView: function (name) {
    return this._views[this._viewMap[name]];
  }
});


gin.Class('hza.View', {
  name: null,
  _controller: {},
  _components : [],
    
  init: function (name, controller, bindData) {
    if (!name || !controller) { throw new Error('A name and/or controller required.'); } 
    this.name = name;
    this._registerController(controller, bindData);
    //this.render();
  },

  render: function (data) {
    this._beforeRender();
    for (var i = 0, ii = this._components.length; i < ii; i++ ) {
      this._components[i].show();
    }
    this._afterRender();
  },

  _beforeRender: function () {
    //gin.events.publish('view/beforeRender');
    this._notify('beforeRender', this.name);
  },

  _afterRender: function () {
    //gin.events.publish('view/afterRender');
    this._notify('afterRender', this.name);
  },

  _registerController: function (controller, bindData) {
    this._controller = controller;
    this._controller._registerView(this, bindData);
  },

  registerComponent: function (component) {
    this._components.push(component);
    component.render();    
  },

  _getComponent: function (id) {
    var component;
    for (var i = 0, ii = this._components.length; i < ii; i++) {
      if (this._components[i].id === id) {
        component = this._components[i].id;
      }
    }
    return component;
  },

  _notify: function (topic, message) {
    gin.events.publish(this.name + '/' + topic, [message]);
  }

});


gin.Class('hza.Component', {
  id: null,
  html: null,
  container: null,
  _view: null,
  _cachedStyleDisplay:  '',

  init: function (id, html, container) {
    this.id = id || gin.utils.random();
    this.html = html;
    this.container = $('#' + container) || $('body');
  },

  render: function () {
    this._beforeRender();
    var component = '';
    component += '<div id="' + this.id + '">';
    component += this.html.html;
    component += '</div>';
    $(this.container).append(component);
    this._afterRender();
  },

  hide: function () {
    this._cachedStyleDisplay = this.container[0].style.display;
    this.container[0].style.display = 'none';
  },

  show: function () {
    this.container[0].style.display = this._cachedStyleDisplay;
  },

  addToView: function (view) {
    this._registerView(view);         
  },

  _beforeRender: function () {
    gin.events.publish('component/'+this.id+'/beforeRender', []);
  },

  _afterRender: function () {
    gin.events.publish('component/'+this.id+'/afterRender', ['component/afterRender']);
  },

  _registerView: function (view) {
    this._view = view;
    this._view.registerComponent(this);
  }
});


