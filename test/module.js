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
});
