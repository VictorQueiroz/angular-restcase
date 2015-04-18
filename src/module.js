var url_resolve_regexp = /(?:\{)(\w)+(?:\})/g;

function toLowerCase (string) {
  return string.toLowerCase();
}

function toUpperCase (string) {
  return string.toUpperCase();
}

function $RestcaseProvider () {
  if(angular.isUndefined(Restcase)) {
    throw new Error('You must load Restcase before load this module, aborting');
  }

  this.$get = $RestcaseFactory;

  var defaults = this.defaults = {
    apiPrefix: '/api'
  };

  var modelDefaults = this.defaults.modelDefaults = {
    idAttribute: 'id',
    methodDefaults: {
      method: 'GET'
    },
    url: '',
    methods: {
      fetch: {
        method: 'GET'
      },
      destroy: {
        method: 'DELETE'
      },
      save: {
        method: 'POST'
      }
    }
  };

  var collectionDefaults = this.defaults.collectionDefaults = {};

  function $RestcaseFactory ($http) {
    var $restcase = {};

    function attribute (key) {
      return '{' + key + '}';
    }

    function pluralize (string) {
      return string + 's';
    }

    function resolve (url, attributes) {
      if(!_.isString(url)) {
        throw new Error('Url must be a string');
      }

      var newUrl = url;
      var matches = url.match(url_resolve_regexp);
      var urlAttrs = matches ? matches.map(function (match) {
        var regexp = /[\{\}]/g;
        return match.replace(regexp, '');
      }) : [];

      _.forEach(attributes, function (value, key) {
        if(urlAttrs.indexOf(key) !== -1) {
          newUrl = newUrl.replace(attribute(key), value);
        }
      });

      // Search for url attributes that are not
      // defined in attributes for we can exclude
      // them from the url, because they can't stay
      // there.
      _.forEach(urlAttrs, function (key) {
        var value = attributes[key];

        if(_.isUndefined(value) || _.isEmpty(value)) {
          newUrl = newUrl.replace(attribute(key), '');
        }
      });

      // Remove possible unutilized /
      // at the end of the url, which is
      // very creepy. We don't wanna see
      // that
      newUrl = newUrl.replace(/(\/)+$/, '');

      return newUrl;
    }

    var Collection = Restcase.Collection.extend(collectionDefaults);

    var Model = Restcase.Model;

    _.extend(Model.prototype, Restcase.Events, modelDefaults, {
      hasMany: function hasMany (Target, foreignKey) {
        var targetModelName = Target.prototype.modelName.toLowerCase();
        var targetNewUrl = defaults.apiPrefix + '/' + this.modelName.toLowerCase() + '/' + attribute(this.idAttribute) + '/' + pluralize(targetModelName);

        targetNewUrl = resolve(targetNewUrl, this.attributes);

        var attributes = {};
        var newTargetMethods = {};

        _.extend(newTargetMethods, modelDefaults.methods, {
          fetch: {
            url: targetNewUrl
          }
        });

        var NewTarget = Target.extend({
          methods: newTargetMethods
        });

        if(_.isUndefined(foreignKey)) {
          foreignKey = toLowerCase(this.modelName) + '_id';
        }

        attributes[foreignKey] = this.get(this.idAttribute);

        var newTarget = new NewTarget(attributes);

        return newTarget.fetch();
      },
      initialize: function () {
        var model = this;
        var attributes = this.attributes;

        if(_.isUndefined(this.url) || _.isEmpty(this.url)) {
          this.url = defaults.apiPrefix + '/' + toLowerCase(this.modelName) + '/' + attribute(this.idAttribute);
        }

        // Defining methods
        _.forEach(this.methods, function (value, key) {
          var options = _.extend({}, modelDefaults.methodDefaults, value);

          this[key] = function (methodAttrs) {
            var methodUrl;

            if(key === 'save' && !model.isNew()) {
              options.method = 'PATCH';
            }

            options.method = toUpperCase(options.method);

            if(angular.isDefined(value.url)) {
              methodUrl = value.url;
            } else if (angular.isDefined(model.url)) {
              methodUrl = model.url;
            }

            options.url = resolve(methodUrl, attributes);

            options.data = {};

            if(options.method === 'POST') {
              _.extend(options.data, this.attributes);
            } else if (options.method === 'PATCH' || options.method === 'PUT') {
              if(angular.isDefined(methodAttrs)) {
                _.extend(options.data, methodAttrs);
              }
            }

            return $http(options).then(function resolved (res) {
              return res.data;
            }).then(function (data) {
              // If the data is beeing received from the serverside
              // Just update our model and pass it, and return itself
              if(!_.isArray(data) && (key === 'fetch' || key === 'save')) {
                if(_.isObject(data) && !(_.isUndefined(data[model.idAttribute]))) {
                  model.set(data);
                }

                return model;
              }

              // If the data returned from serverside is an array
              // put this into an collection
              if(_.isArray(data)) { // fixme
                data = data.map(function (data) {
                  var newModel = model.clone();
                  newModel.set(data);
                  return newModel;
                });
              }

              return data;
            });
          };
        }, this);
      }
    });

    $restcase.Model = Model;
    $restcase.Collection = Collection;

    return $restcase;
  }
}

angular.module('victorqueiroz.ngRestcase', [])
  .provider('$restcase', $RestcaseProvider);
