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

  var defaults = this.defaults = {};

  var modelDefaults = this.defaults.model = {
    idAttribute: 'id',
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
      initialize: function () {
        var model = this,
            attributes = this.attributes;

        // Defining methods
        _.forEach(this.methods, function (value, key) {
          var httpOptions = {
            method: 'GET'
          };

          _.extend(httpOptions, value);

          this[key] = function (methodAttrs, options) {
            var methodUrl,
                isSaving = (key === 'save'),
                isNew = model.isNew();

            if(_.isUndefined(options)) {
              options = {};
            }

            if(isSaving && (!isNew || options.patch === true)) {
              httpOptions.method = 'PATCH';
            }

            httpOptions.method = toUpperCase(httpOptions.method);

            if(angular.isDefined(value.url)) {
              methodUrl = value.url;
            } else if (angular.isDefined(model.url)) {
              methodUrl = model.url;
            }

            httpOptions.url = resolve(methodUrl, attributes);

            httpOptions.data = {};

            if(httpOptions.method === 'POST') {
              _.extend(httpOptions.data, this.attributes);
            } else if (httpOptions.method === 'PATCH' || httpOptions.method === 'PUT') {
              if(angular.isDefined(methodAttrs)) {
                _.extend(httpOptions.data, methodAttrs);
              }
            }

            return $http(httpOptions).then(function resolved (res) {
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
