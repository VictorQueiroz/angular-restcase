describe('victorqueiroz.ngRestcase', function () {
  var User, Post;

  beforeEach(module('victorqueiroz.ngRestcase'));

  beforeEach(inject(function ($restcase) {
    Post = $restcase.Model.extend({
      url: '/api/post/{id}',
      modelName: 'Post'
    });
    User = $restcase.Model.extend({
      url: '/api/user/{id}',
      modelName: 'User',
      posts: function () {
        return this.hasMany(Post);
      }
    });
  }));

  afterEach(inject(function ($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should resolve the url', inject(function ($restcase, $rootScope, $httpBackend) {
    $httpBackend.whenGET('/api/user/1').respond(200, {
      id: 1,
      name: 'Victor Queiroz'
    });

    var user = new User({
      id: 1
    });

    user.fetch().then(function (user) {
      expect(user.get('name')).toBe('Victor Queiroz');
    });

    $httpBackend.flush();
  }));

  it('should update the model with the new attributes returned from server', inject(function ($restcase, $rootScope, $httpBackend) {
    $httpBackend.whenGET('/api/user/2').respond(200, {
      id: 2,
      name: 'Victor Queiroz'
    });

    $httpBackend.whenPATCH('/api/user/2').respond(200, {
      id: 2,
      name: 'My new name',
      age: 19
    });

    var user = new User({
      id: 2
    });

    user.fetch().then(function (user) {
      expect(user.get('name')).toBe('Victor Queiroz');

      user.set({
        name: 'My new name',
        age: 19
      });

      return user.save();
    }).then(function (user) {
      expect(user.get('name')).toBe('My new name');
      expect(user.get('age')).toBe(19);
    });

    $httpBackend.flush();
  }));

  it('should save the new models', inject(function ($restcase, $rootScope, $httpBackend) {
    $httpBackend.whenPOST('/api/user').respond(200, {
      id: 1,
      name: 'My new name',
      age: 19
    });

    var user = new User({
      name: 'My new name',
      age: 19
    });

    user.save().then(function (user) {
      expect(user.get('name')).toBe('My new name');
      expect(user.get('age')).toBe(19);
    });

    $httpBackend.flush();
  }));

  it('should store new models and update not newer models', inject(function ($restcase, $rootScope, $httpBackend) {
    $httpBackend.whenPOST('/api/user').respond(200, {
      id: 4,
      name: 'My new name',
      age: 19
    });

    $httpBackend.whenPATCH('/api/user/4').respond(200, {
      id: 4,
      name: 'Victor Queiroz',
      age: 19
    });

    var user = new User({
      name: 'My new name',
      age: 19
    });

    user.save().then(function (user) {
      expect(user.get('name')).toBe('My new name');
      expect(user.get('age')).toBe(19);

      user.set('name', 'Victor Queiroz');

      return user.save();
    }).then(function (user) {
      expect(user.get('name')).toBe('Victor Queiroz');
    });

    $httpBackend.flush();
  }));

  it('should do a hasMany relation', inject(function ($restcase, $rootScope, $httpBackend) {
    $httpBackend.whenPOST('/api/user').respond(200, {
      id: 4,
      name: 'My new name',
      age: 19
    });

    $httpBackend.whenPATCH('/api/user/4').respond(200, {
      id: 4,
      name: 'Victor Queiroz',
      age: 19
    });

    $httpBackend.whenGET('/api/user/4/posts').respond(200, [{
      id: 1,
      title: 'My post',
      body: 'That\'s it, you have just one post'
    }]);

    var user = new User({
      name: 'My new name',
      age: 19
    });

    user.save().then(function (user) {
      expect(user.get('name')).toBe('My new name');
      expect(user.get('age')).toBe(19);

      user.set('name', 'Victor Queiroz');

      return user.save();
    }).then(function (user) {
      expect(user.get('name')).toBe('Victor Queiroz');

      return user.posts();
    }).then(function (posts) {
      posts.forEach(function (post) {
        expect(post.get('body')).toBe('That\'s it, you have just one post');
        expect(post.get('id')).toBe(1);
      });
    });

    $httpBackend.flush();
  }));

  it('should update the pivot', inject(function ($restcase, $httpBackend) {
    $httpBackend.expectPOST('/api/user', {
      name: 'Tom Morry'
    }).respond({
      name: 'Tom Morry',
      id: 4
    });

    $httpBackend.expectGET('/api/user/4/posts').respond([{
      title: 'Post 1',
      id: 1
    }, {
      title: 'Post 2',
      id: 2
    }, {
      title: 'Post 3',
      id: 3
    }]);

    var User = $restcase.Model.extend({
      modelName: 'User',
      posts: function () {
        return this.hasMany(Post);
      }
    });

    var Post = $restcase.Model.extend({
      modelName: 'Post'
    });

    var user = new User({
      name: 'Tom Morry'
    });

    var createdAt = new Date();

    user.save().then(function (user) {
      expect(user.get('id')).toBe(4);

      return user.posts();
    }).then(function (posts) {
      expect(posts.length).toBe(3);

      var post = posts[0];

      return post.save({
        createdAt: createdAt
      });
    }).then(function (post) {
      
    });

    $httpBackend.flush();
  }));
});
