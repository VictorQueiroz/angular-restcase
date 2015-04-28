describe('victorqueiroz.ngRestcase', function () {
  var User, Post;

  beforeEach(module('victorqueiroz.ngRestcase'));

  beforeEach(inject(function ($restcase) {
    Post = $restcase.Model.extend({
      url: '/api/post/{id}',
      author: function () {
        return this.belongsTo(User, {
          url: '/api/post/' + this.get('id') + '/author'
        });
      }
    });
    User = $restcase.Model.extend({
      url: '/api/user/{id}',
      posts: function () {
        return this.hasMany(Post, {
          url: '/api/user/' + this.get('id') + '/posts/{id}'
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

  it('should get a related of a related model', inject(function ($httpBackend) {
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

    $httpBackend.expectGET('/api/user/1/posts/4').respond({
      id: 4,
      user_id: 1,
      title: 'My first post',
      body: '<p>My new body here</p>'
    });

    $httpBackend.expectGET('/api/post/4/author').respond({
      id: 1,
      name: 'Victor Queiroz'
    });

    new User({
      id: 1
    }).posts().fetch().then(function (posts) {
      return posts[0].save({
        body: '<p>My new body here</p>'
      });
    }).then(function (post) {
      expect(post.get('body')).toBe('<p>My new body here</p>');

      return post.clone().set({
        user_id: 1,
        id: 4
      });
    }).then(function (post) {
      return post.fetch();
    }).then(function (post) {
      expect(post.get('user_id')).toBe(1);

      return post.author().fetch();
    }).then(function (author) {
      expect(author.get('name')).toBe('Victor Queiroz');
    });

    $httpBackend.flush();
  }));

  it('should update a related of a related model', inject(function ($httpBackend) {
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

    $httpBackend.expectGET('/api/user/1/posts/4').respond({
      id: 4,
      user_id: 1,
      title: 'My first post',
      body: '<p>My new body here</p>'
    });

    $httpBackend.expectGET('/api/post/4/author').respond({
      id: 1,
      name: 'Victor Queiroz'
    });

    $httpBackend.expectPATCH('/api/post/4/author', {
      name: 'New author name'
    }).respond({
      id: 1,
      name: 'New author name'
    });

    new User({
      id: 1
    }).posts().fetch().then(function (posts) {
      return posts[0].save({
        body: '<p>My new body here</p>'
      });
    }).then(function (post) {
      expect(post.get('body')).toBe('<p>My new body here</p>');

      return post.clone().set({
        user_id: 1,
        id: 4
      });
    }).then(function (post) {
      return post.fetch();
    }).then(function (post) {
      expect(post.get('user_id')).toBe(1);

      return post.author().fetch();
    }).then(function (author) {
      expect(author.get('name')).toBe('Victor Queiroz');

      return author.save({
        name: 'New author name'
      });
    });

    $httpBackend.flush();
  }));

  it('should relate with options as a string', inject(function ($httpBackend) {
    $httpBackend.expectGET('/api/post/30/author').respond({
      id: 1,
      name: 'Victor Queiroz'
    });

    $httpBackend.expectPATCH('/api/post/30/author', {
      name: 'New name for the author'
    }).respond({
      id: 1,
      name: 'New name for the author'
    });

    var NewPost = Post.extend({
      author: function () {
        return this.belongsTo(User, '/api/post/{targetId}/author');
      }
    });

    new NewPost({
      id: 30
    }).author().fetch().then(function (author) {
      expect(author.get('name')).toBe('Victor Queiroz');

      return author.save({
        name: 'New name for the author'
      }, {
        patch: true
      });
    }).then(function (author) {
      expect(author.get('id')).toBe(1);
    });

    $httpBackend.flush();
  }));
});
