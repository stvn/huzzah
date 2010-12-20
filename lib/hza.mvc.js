gin.Class('hza.Model', {
  _dataStore: {},

  init: function () {

  },

  create: function (key, value) {
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
  
  _controller: {},

  _views: [],

  _registerController: function (controller) {
    this._controller = controller;
  },

  _registerView: function (view) {
    this._views.push(view);
  },

  _notify: function (topic, message) {
    gin.events.publish(this.definedClass + '/' + topic, message);
  }
  
});

gin.Class('hza.Controller', {
  init:  function (model) {
    if (!model) { throw new Error('A model is required.') }
    this._registerModel(model);
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
    this.redirectTo('edit', this._model.find(key));
  },

  destroy: function (key) {
    this._model.destroy(key);
    this.redirectTo('index');
  },

_currentView: null,

  render: function (viewName, data) {
    if (this._currentView) { this._currentView.hide(); }
    var view = this._getView('view');
    if (!view) { throw new Error(viewName + ' does not exist.'); }
    view.render(data);
  },

  redirectTo: function (view, data) {
    this.render(view, data)
  },
  
  _model: {},

  _views: [],

  _registerModel: function (model) {
    this._model = model;
    this._model._registerController(this);
  },

  _registerView: function (view) {
    this._views.push(view);
    this._viewMap[view.name] = this._views.length - 1;
    this._model._registerView(view);
  },

  _viewMap: {},

  _getView: function (name) {
    return this._views[this.viewMap[name]];
  }
});


gin.Class('hza.View', {
  init: function (name, controller) {
    if (!name && !controller) { throw new Error('A name and/or controller required.'); } 
    this.name = name;
    this._registerController(controller);
    this.render();
  },

  name: null,
  
  _controller: {},

  _components : [],

  render: function (data) {
    this._beforeRender();
    // render code
    this._afterRender();
  },

  _beforeRender: function () {
    gin.events.publish('view/beforeRender');
  },

  _afterRender: function () {
    gin.events.publish('view/afterRender');
  },

  _registerController: function (controller) {
    this._controller = controller;
    this._controller._registerView(this);
  },

  _registerComponent: function (component) {
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
  }
});


gin.Class('hza.Component', {
  init: function (options) {
    this.id = gin.utils.random();
    this.html = options.html;
  },

  id: null,

  html: null,

  render: function () {
    this._beforeRender();
    var component = '';
    component += '<div id="' + this.id + '">';
    component += this.html;
    component += '</div>';
    this.container.appendChild(component);
    this._afterRender();
  },

  hide: function () {
    this._cachedStyleDisplay = this.component.style.display;
    this.component.style.display = 'none';
  },

  show: function () {
    this.component.style.display = this._cachedStyleDisplay;
  },

  addToView: function (view) {
    this._registerView(view);         
  },

  _beforeRender: function () {
    gin.events.publish('component/beforeRender');
  },

  _afterRender: function () {
    gin.events.publish('component/beforeRender');
  },

  _registerView: function (view) {
    this._view = view;
    this._view._registerComponent(this);
  },

  _view: null,

  _cachedStyleDisplay:  ''
    
});
