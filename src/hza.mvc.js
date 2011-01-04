gin.ns('hza.router', {
  _registeredControllers: [],
  _currentResource:       null,
  _currentId:             null,
  _lastRequestedPath:     null,

  route: function (path, args) {
    //path: controller/view/id
    var parsedPath          = path.split('/');
    this._lastRequestedPath = path;
    this._lastArguments     = args;
    this.getResource(parsedPath);
  },

  getCurrent: function () {
    if (!this._currentResource) { return; }
    this._currentResource(this._currentId);
  },

  setCurrent: function (resource, id) {
    this._currentResource = resource;
    this._currentId       = id;
  },

  hideCurrent: function () {
    this.currentView.hide();
  },

  _getController: function (controllerName) {
    return this.registerControllers[controllerName];
  },

  registerController: function (controller) {
    this._registeredControllers[controller.name] = controller;
  },

  getResource: function (pathArray) {
    var controller = this._registeredControllers[pathArray[0]],
        view       = controller ? controller[pathArray[1]] : undefined,
        id         = view ? pathArray[3] : undefined;
  
    if (controller && view) {
      if (this.currentView) { this.hideCurrent(); }
      controller[pathArray[1]](id, this._lastArguments);
      this.setCurrent(controller[pathArray[1]], id);
      this.currentView = controller._getView(pathArray[1]);
    } else {
      throw new Error('Routing Error: No matching route: ' + this._lastRequestedPath);
    }
  }
});

gin.ns('hza.registry', {
  lastId: 0,
  nextId: function () {
    this.lastId += 1;
    return this.lastId;
  },

  add: function (type, obj) {
    this[type]         = this[type] || {};
    this[type][obj.id] = obj;
  },

  getById: function (type, id) {
    this[type] = this[type] || {};
    return this[type][id];
  },

  getByName: function (type, name) {
    for (var p in this[type]) {
      if (p === name) {
        return this[type][p];
      }
    }
  }
});

gin.Class('hza.Model', {
  init: function (name, extend) {
    if (!name) {throw new Error('A name is required.'); }
    this._dataStore = {};
    this.id         = hza.registry.nextId();
    this.name       = name;
    if (extend && typeof extend === 'object') { gin.merge(this, extend); }  
    hza.registry.add('models', this);   
  },

  create: function (key, value) {
    this._beforeCreate();
    this._dataStore[key] = value;
    this._afterCreate();
    this._notify('create/' + key, value);
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
    this._notify('update/' + key, [key, value]);
  },

  destroy: function (key) {
    this._beforeDestroy();
    delete this._dataStore[key];
    this._afterDestroy();
    this._notify('destroy/' + key, key);
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

  _notify: function (topic, message) {
    gin.events.publish(this.name + '/' + topic, [message]);
  }
});

gin.Class('hza.Controller', {
  _router: hza.router,

  init: function (name, model, extend) {
    if (!name || !model) { throw new Error('A name and/or model required.'); } 
    this.id       = hza.registry.nextId();
    this.name     = name;
    this.model    = model,
    this._views   = [];
    this._viewMap = {};
    this._registerWithRouter();
    if (extend && typeof extend === 'object') { gin.merge(this, extend); }    
    hza.registry.add('controllers', this);
  },

  render: function (viewName, data) {
    var view = this._getView(viewName);
    if (!view) { throw new Error(viewName + ' does not exist.'); }
    view.render(data);
  },

  _registerView: function (view, bindData) {
    this._views.push(view);
    this._viewMap[view.name] = this._views.length - 1;
    //create views on the fly
    if (!this[view.name]) {
      this._createViewAction(view, bindData);
    }
  },

  _registerWithRouter: function () {
    this._router.registerController(this);
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
  init: function (name, controller, extend) {
    if (!name || !controller) { throw new Error('A name and/or controller is required.'); }
    this.id           = hza.registry.nextId();
    this.name         = name;
    this.components   = [];
    this._hasRendered = false;
    this._cachedStyleDisplay = '';
    this._registerController(controller);
    this._createDomNode();
    this._afterInit();
    if (extend && typeof extend === 'object') { gin.merge(this, extend); }
    hza.registry.add('views', this);
  },

  render: function (data) {
    this.data = data;
    this._beforeRender();
    for (var i = 0, ii = this.components.length; i < ii; i++ ) {
      var component = this.components[i];
      if (component.hasRendered) {
        component.show()
      } else {
        component.render();
      }
    }
    this._afterRender();    
    this._hasRendered = true;
    this.show();
  },

  show: function () {
    var style = this._cachedStyleDisplay === 'none' ? '' : this._cachedStyleDisplay;
    this.domNode.style.display = style;
  },

  hide: function () {
    if (!this._hasRendered) { return; }      
    this._cachedStyleDisplay   = this.domNode.style.display;
    this.domNode.style.display = 'none';
  },
        
  registerComponent: function (component) {
    this.components.push(component);
    component._view = this;
    //component.render();    
  },

  _createDomNode: function () {
    this.domNode    = document.createElement('div');
    this.domNode.id = this.name + 'View';
    this.domNode.style.display = 'none';
    document.body.appendChild(this.domNode);
  },

  _beforeRender: function () {
                 
  },

  _afterRender: function () {
                
  },

  _afterInit: function () {
              
  },

  _registerController: function (controller) {
    this.controller = controller;
    this.controller._registerView(this);
  }
    
});

gin.Class('hza.Component', {
  init: function (settings, extend) {
    this.id           = hza.registry.nextId();
    this.settings     = {};
    this.dataHooks    = {};
    this._hasRendered = false;
    this._view        = null;
    this.script       = null; 
    gin.merge(this, settings);
    hza.registry.add('components', this);
  },

  render: function () {
    if (this._hasRendered) { return; }
    this._beforeRender();
    this.container = document.getElementById(this.container) || this._view.domNode;
    var component = document.createElement('div');
    component.id = this.domId;
    component.innerHTML = this.html;
    this.container.appendChild(component);
    this._afterRender();
    this._processDataHooks();
    this._hasRendered = true;
    this._loadScript();
    this.component = component;
  },

  hide: function () {
    if (!this._hasRendered) { return; }
    this._cachedStyleDisplay = this.component.style.display;
    this.component.style.display = 'none';
  },

  show: function () {
    this.component.style.display = this._cachedStyleDisplay;
  },

  update: function (elementId, data) {
    var element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = data;
    }
  },
          
  decorate: function (obj) {
    if (!obj) { return; }
    gin.merge(this, obj);
  },

  addDataHook: function (id, topic) {
    this.dataHooks[id] = topic;
    this._registerDataHook(id, topic);
  },

  removeDataHook: function (id) {
    var dataHook = this.dataHooks[id];
    gin.events.unsubscribe(this._view._controller._model.name + '/' + dataHook);
    delete dataHook;
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
  },

  _processDataHooks: function () {
    if (this._hasRendered) { return; }
    for (var dh in this.dataHooks) {
      this._registerDataHook(dh, this.dataHooks[dh]);
    }
  },

  _registerDataHook: function (id, topic) {
    var model = this._view._controller._model.name;
    gin.events.subscribe(model + '/' + topic, gin.bind(this, function (data) {
      this.update(id, data);
    }));
  },

  _loadScript: function () {
    if (!this.script) { return; };
    this.script();
  }


});
