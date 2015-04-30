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
    _.extend($restcaseProvider.defaults.model, {
      idAttribute: '_id'
    });
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
      return this.hasMany(Post, {
        url: '/api/user/{modelId}/posts/{id}'
      });
    }
  });
})
```

At the example below, `{modelId}` will be resolved as `User` model idAttribute value, but `{id}` will stay put, but will be filled when you execute any task (`fetch`, `save`) at extended model `Post` returned from `new User({ id: XX }).posts().fetch()`. It will make a request to:
```
GET /api/user/1/posts
```

And if you attribute try to save any returned model from `posts().fetch()`:

```js
new User({
  id: 1
}).posts().fetch().then(function (posts) {
  return posts[0].save({
    body: 'New post body'
  });
});
```

Assuming that: `posts[0].get('id') === 10`. It will make a request to:
```
GET /api/user/1/posts/10
```

```js
.controller('MyAppController', function ($scope, User) {
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
