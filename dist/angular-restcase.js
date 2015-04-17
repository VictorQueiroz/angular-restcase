/**
 * angular-restcase - 
 * @version v0.0.1
 * @link https://github.com/VictorQueiroz/angular-restcase
 * @license MIT
 */
(function () {
var url_resolve_regexp = /(?:\{)(\w)+(?:\})/g;

function $RestcaseProvider () {
  if(angular.isUndefined(Restcase)) {
    throw new Error('You must load Restcase before load this module, aborting');
  }

  this.$get = $RestcaseFactory;

  this.defaults = {};

  var modelDefaults = this.defaults.modelDefaults = {
    idAttribute: 'id',
    methodDefaults: {
      method: 'GET'
    },
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

  function $RestcaseFactory ($http) {
    var $restcase = {};

    function attribute (key) {
      return '{' + key + '}';
    }

    function resolve (url, attributes) {
      var newUrl = url;
      var urlAttrs = url.match(url_resolve_regexp).map(function (match) {
        return match.replace(/[\{\}]/g, '');
      });

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

    var Model = Restcase.Model.extend(modelDefaults).extend({
      getUrl: function () {
        return this.url;
      },
      initialize: function () {
        var model = this;
        var attributes = this.attributes;
        var url = this.getUrl();

        _.forEach(this.methods, function (value, key) {
          var options = _.extend({}, modelDefaults.methodDefaults, value);

          this[key] = function () {
            if(key === 'save' && !model.isNew()) {
              options.method = 'PATCH';
            }

            options.url = resolve(url, attributes);

            var promise = $http(options).then(function resolved (res) {
              return res.data;
            });

            return promise.then(function (data) {
              // If the data is beeing received from the serverside
              // Just update our model and pass it, and return itself
              if(key === 'fetch' || key === 'save') {
                if(_.isObject(data) && !(_.isUndefined(data[model.idAttribute]))) {
                  model.set(data);
                }

                return model;
              }

              return data;
            });

            return promise;
          };
        }, this);
      }
    });

    $restcase.Model = Model;

    return $restcase;
  }
  $RestcaseFactory.$inject = ["$http"];
}

angular.module('victorqueiroz.ngRestcase', [])
  .provider('$restcase', $RestcaseProvider);

});