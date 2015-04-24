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
    $restcaseProvider.defaults.model.idAttribute = '_id';
    // Or not:
    $restcaseProvider.defaults.model.idAttribute = 'id';
  })
  .factory('User', function ($restcase) {
    return $restcase.Model.extend({
      url: '/api/user/{id}',
      // By default, there is no need for defining
      // new methods, but you can do that if you want
      methods: {
        saveMe: {
          method: 'GET',
          url: '/api/my-custom-method/{id}',
          headers: {
            'X-CSRF-Token': 'm4n82hc9q8rknu9k608h9vuqvas0'
          }
        }
      }
    });
  })
  .controller('UserController', function ($scope, Post) {
    $scope.user = new User();

    // It will save as a new model
    this.store = function (user) {
      return user.save();
    };
  })
  .controller('PostController', function ($scope, Post) {
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

## Relationship (approaches)

```js
angular.module('app', ['victorqueiroz.ngRestcase'])
.factory('Post', function ($restcase) {
  return $restcase.Model.extend({
    url: '/api/post/{id}',
    getPostTitle: function () {
      return this.get('title');
    }
  });
})
.factory('User', function (Post, $restcase) {
  return $restcase.Model.extend({
    url: '/api/user/{id}',
    modelName: 'User',
    posts: function () {
      var Target = Post.extend({
        url: '/api/user/{user_id}/posts/{id}'
      });

      return new Target({
        user_id: this.get('id')
      });
    }
  });
})
.controller('MyAppController', function ($scope, User) {
  $scope.posts = [];

  new User({
    id: 1
  }).posts().fetch().then(function (posts) {
    $scope.posts = posts;
  });

  $scope.save = function (post) {
    return post.save();
  };
});
```

The code bellow, will make a request like this at `new User({ id: 1 }).posts().fetch()`:

```
GET /api/user/1/posts
```
