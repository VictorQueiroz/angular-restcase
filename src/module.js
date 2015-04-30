var url_resolve_regexp = /(?:\{)([^\/]*)+(?:\})/g;

function toLowerCase (string) {
  return string.toLowerCase();
}

function toUpperCase (string) {
  return string.toUpperCase();
}

function $RestcaseProvider () {
  if(_.isUndefined(_)) {
    throw new Error('You must load underscore/lodash before load this module, aborting');
  }
  if(_.isUndefined(Restcase)) {
    throw new Error('You must load Restcase before load this module, aborting');
  }

  this.$get = $RestcaseFactory;

  var defaults = this.defaults = {};

  this.defaults.model = {
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

  this.defaults.collection = {};

  function $RestcaseFactory ($http, $parse) {
    var $restcase = {};

    function attribute (key) {
      return '{' + key + '}';
    }

    function pluralize (string) {
      return string + 's';
    }

    function build (exp) {
      return function (locals) {
        var obj = locals;
        exp.split('.').forEach(function (key) {
          obj = obj[key];
        });
        return obj;
      };
    }

    function resolve (url, locals, options) {
      function buildExp (exp) {
        return function (locals) {
          var obj = locals;
          exp.split('.').forEach(function (key) {
            if(_.isUndefined(obj)) {
              return;
            } if(!_.isUndefined(obj[key])) {
              obj = obj[key];
            } else {
              obj = undefined;
            }
          });
          return obj;
        };
      }
      
      return function (locals, options) {
        var defaults = {
          crop: true
        };

        if(_.isUndefined(options)) {
          options = {};
        }

        if(!_.isString(url)) {
          throw new Error('Url must be a string');
        }

        options = _.extend({}, defaults, options);

        var newUrl = url;
        var matches = url.match(url_resolve_regexp);
        var urlAttrs = matches ? matches.map(function (match) {
          var regexp = /[\{\}]/g;
          return match.replace(regexp, '');
        }) : [];

        _.forEach(urlAttrs, function (value) {
          var exp = buildExp(value);

          if(exp(locals)) {
            newUrl = newUrl.replace(attribute(value), exp(locals));
          }
        });

        if(options.crop) {
          // Search for url locals that are not
          // defined in locals for we can exclude
          // them from the url, because they can't stay
          // there.
          _.forEach(urlAttrs, function (key) {
            var value = locals[key];

            if(_.isUndefined(value) || _.isEmpty(value)) {
              newUrl = newUrl.replace(attribute(key), '');
            }
          });
        }

        // Remove possible unutilized /
        // at the end of the url, which is
        // very creepy. We don't wanna see
        // that
        newUrl = newUrl.replace(/(\/)+$/, '');

        return newUrl;
      };
    }

    var Model = Restcase.Model;
    var Collection = Restcase.Collection;

    _.extend(Collection.prototype, Restcase.Events, defaults.collection);

    _.extend(Model.prototype, Restcase.Events, defaults.model, {
      belongsTo: function (Target, options) {
        var NewTarget = this._relation(Target, options);

        return new NewTarget();
      },
      hasMany: function (Target, options) {
        var NewTarget = this._relation(Target, options);

        return new NewTarget();
      },
      _relation: function (Target, options) {
        if(_.isString(options)) {
          var url = options;
          options = {
            url: url
          };
        }

        if(_.isUndefined(options.url)) {
          throw new Error('You must specify an url');
        }

        var locals = {
          modelId: this.get(this.idAttribute)
        };

        if(!_.isUndefined(options.locals)) {
          _.extend(locals, options.locals);
        }

        var NewTarget = Target.extend({
          url: resolve(options.url)(locals, {
            crop: false
          })
        });

        return NewTarget;
      },
      initialize: function () {
        var model = this,
            attributes = this.attributes;

        if(_.isFunction(this.url)) {
          this.url.apply(this);
        }

        // Defining methods
        _.forEach(this.methods, function (value, key) {
          var httpOptions = {
            method: 'GET',
            data: {},
            headers: {}
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

            // If value.url is defined
            if(angular.isDefined(value.url)) {
              methodUrl = value.url;
            // Else, use the default one (model.url)
            } else if (angular.isDefined(model.url)) {
              methodUrl = model.url;
            }

            httpOptions.url = resolve(methodUrl)(attributes);

            if(httpOptions.method === 'POST') {
              _.extend(httpOptions.data, this.attributes);
            } else if (httpOptions.method === 'PATCH' || httpOptions.method === 'PUT') {
              if(angular.isDefined(methodAttrs)) {
                _.extend(httpOptions.data, methodAttrs);
              }
            }

            // Defining headers
            if(_.isObject(value.headers)) {
              _.extend(httpOptions.headers, value.headers);
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
    $restcase.resolve = resolve;

    return $restcase;
  }
}

angular.module('victorqueiroz.ngRestcase', [])
  .provider('$restcase', $RestcaseProvider);
