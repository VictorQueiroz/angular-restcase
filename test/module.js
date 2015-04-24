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
        var Target = Post.extend({
          url: '/api/user/{user_id}/posts/{id}'
        });

        return new Target({
          user_id: this.get('id')
        });
      }
    });
  }));

  afterEach(inject(function ($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should fetch a model', inject(function ($httpBackend) {
    $httpBackend.expectGET('/api/user/1/posts').respond([{
      id: 4,
      title: 'My first post',
      body: '<p>Text here</p>'
    }]);

    new User({
      id: 1
    }).posts().fetch().then(function (posts) {
      expect(posts[0].get('body')).toBe('<p>Text here</p>');
    });

    $httpBackend.flush();
  }));

  it('should save a model', inject(function ($httpBackend) {
    $httpBackend.expectGET('/api/user/1/posts').respond([{
      id: 4,
      title: 'My first post',
      body: '<p>Text here</p>'
    }]);

    $httpBackend.expectPATCH('/api/user/1/posts/4', {
      body: '<p>My new body here</p>'
    }).respond({
      id: 4,
      title: 'My first post',
      body: '<p>My new body here</p>'
    });

    new User({
      id: 1
    }).posts().fetch().then(function (posts) {
      return posts[0].save({
        body: '<p>My new body here</p>'
      });
    }).then(function (post) {
      expect(post.get('body')).toBe('<p>My new body here</p>');
    });

    $httpBackend.flush();
  }));

  it('should resolve fn at method headers', inject(function ($httpBackend) {
    $httpBackend.expectPATCH('/api/user/1', {
      name: 'Victor'
    }).respond({
      id: 1,
      name: 'Victor',
      age: 18
    });

    var UserModel = User.extend({
      method: {
        save: {
          headers: {
            'My-Header': function () {
              return 'My_Header_Value';
            }
          }
        }
      }
    });

    new UserModel({
      id: 1
    }).save({
      name: 'Victor'
    }).then(function (user) {
    });

    $httpBackend.flush();
  }));
});
