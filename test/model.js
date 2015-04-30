describe('victorqueiroz.ngRestcase', function () {
  var $restcase, $httpBackend;
  var User, Post;

  beforeEach(module('victorqueiroz.ngRestcase'));

  beforeEach(inject(function ($injector) {
    $restcase = $injector.get('$restcase');
    $httpBackend = $injector.get('$httpBackend');

    Post = $restcase.Model.extend({
      url: '/api/post/{id}',
      author: function () {
        return this.belongsTo(User, {
          url: '/api/post/{modelId}/author'
        });
      }
    });
    User = $restcase.Model.extend({
      url: '/api/user/{id}',
      posts: function () {
        return this.hasMany(Post, {
          url: '/api/user/{modelId}/posts/{id}'
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
        return this.belongsTo(User, '/api/post/{modelId}/author');
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

  it('should accept locals while defining relation', function () {
    $httpBackend.expectGET('/api/user/10/comments/limit/5').respond([{
      id: 1,
      user_id: 10,
      body: 'Comment 1'
    }, {
      id: 2,
      user_id: 10,
      body: 'Comment 2'
    }, {
      id: 3,
      user_id: 10,
      body: 'Comment 3'
    }, {
      id: 4,
      user_id: 10,
      body: 'Comment 4'
    }, {
      id: 5,
      user_id: 10,
      body: 'Comment 5'
    }]);

    var Comment = $restcase.Model.extend();

    var NewUser = User.extend({
      comments: function (options) {
        return this.belongsTo(Comment, {
          url: '/api/user/{modelId}/comments/limit/{limit}',
          locals: options
        });
      }
    });

    new NewUser({
      id: 10
    }).comments({
      limit: 5
    }).fetch().then(function (comments) {
      expect(comments.length).toBe(5);
    });

    $httpBackend.flush();
  });

  it('should support nested relation', function () {
    $httpBackend.expectPOST('/api/user', {
      name: 'My user name'
    }).respond({
      id: 10,
      name: 'My user name'
    });

    $httpBackend.expectGET('/api/user/10/comments').respond([{
      id: 1,
      author_id: 10,
      body: 'The comment body'
    }]);

    $httpBackend.expectGET('/api/comment/1/author').respond({
      id: 10,
      name: 'My user name'
    });

    $httpBackend.expectGET('/api/user/10/comments').respond([{
      id: 1,
      author_id: 10,
      body: 'The comment body'
    }]);

    var Comment = $restcase.Model.extend({
      url: '/api/comment/{id}',
      author: function () {
        return this.belongsTo(NewUser, {
          url: '/api/comment/{modelId}/author'
        });
      }
    });

    var NewUser = User.extend({
      url: '/api/user/{id}',
      comments: function () {
        return this.hasMany(Comment, {
          url: '/api/user/{modelId}/comments'
        });
      }
    });

    var newUser = new NewUser();

    newUser.set({
      name: 'My user name'
    });

    newUser.save().then(function (user) {
      expect(user.get('id')).toBe(10);
      expect(user.get('name')).toBe('My user name');

      return user.comments().fetch();
    }).then(function (comments) {
      expect(comments[0].get('body')).toBe('The comment body');
      expect(comments[0].get('author_id')).toBe(10);

      return comments[0].author().fetch();
    }).then(function (author) {
      expect(author.get('id')).toBe(10);

      return author.comments().fetch();
    }).then(function (comments) {
      expect(comments[0].get('body')).toBe('The comment body');
      expect(comments[0].get('author_id')).toBe(10);
    });

    $httpBackend.flush();
  });
});
