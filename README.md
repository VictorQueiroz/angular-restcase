# angular-restcase

## Dependencies
- Restcase
- Angular
- Lodash

## Installation
```
bower install --save angular-restcase
```

## Usage
```js
angular.module('app', ['victorqueiroz.ngRestcase'])
  .config(function ($restcaseProvider) {
    // Because I'm a MongoDB guy.
    $restcaseProvider.modelDefaults.idAttribute = '_id';
    // Or not:
    $restcaseProvider.modelDefaults.idAttribute = 'id';
  })
  .factory('User', function ($restcase) {
    return $restcase.Model.extend({
      url: '/api/user/{id}',
      // By default, there is no need for defining
      // new methods, but you can do that if you want
      methods: {
        myMethod: {
          method: 'GET',
          url: '/api/my-custom-method/{id}'
        }
      }
    });
  })
  .controller('UserController', function ($scope) {
    $scope.user = new User();

    // It will save as a new model
    this.store = function (user) {
      return user.save();
    };
  })
  .controller('PostController', function ($scope) {
    $scope.post = new Post({
      id: Math.floor((Math.random() * 10) + 1)
    });

    // It will update the model,
    // for it's already have an id
    // And it will bring the 'id' attribute
    // that we setted below to the url
    // of the operation (GET, POST, PATCH, ...)
    this.store = function (post) {
      return post.save();
    };
  });
```
