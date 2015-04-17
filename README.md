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
    $restcaseProvider.defaults.modelDefaults.idAttribute = '_id';
    // Or not:
    $restcaseProvider.defaults.modelDefaults.idAttribute = 'id';
  })
  .factory('User', function ($restcase) {
    return $restcase.Model.extend({
      modelName: 'User',
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

## Relationship (methods)
### hasMany(Target, foreignKey)
```js
var Post = $restcase.Model.extend({
  url: '/api/post/{id}',
  modelName: 'Post',
  getPostTitle: function () {
    return this.get('title');
  }
});

var User = $restcase.Model.extend({
  url: '/api/user/{id}',
  modelName: 'User',
  posts: function () {
    return this.hasMany(Post);
  }
});

new User({
  id: 1
}).posts().then(function (posts) {
  posts.forEach(function (post) {
    expect(post.get('name')).toBe('The post title');
  });
});
```

The code bellow, will make a request like this

```
$restcaseProvider.defaults.apiPrefix/User.prototype.modelName/User.prototype.idAttribute/Target.prototype.modelName + s
```

Resulting on this:

```
GET /api/user/1/posts
```
