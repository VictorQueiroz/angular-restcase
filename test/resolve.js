describe('victorqueiroz.ngRestcase', function () {
  var $restcase;

  beforeEach(module('victorqueiroz.ngRestcase'));

  beforeEach(inject(function ($injector) {
  	$restcase = $injector.get('$restcase');
  }));

  it('should not crop undefined locals', function () {
  	var str = $restcase.resolve('/my-custom/{id}/some-other/{anotherId}')({
  		anotherId: 100
  	}, {
  		crop: false
  	});

  	expect(str).toBe('/my-custom/{id}/some-other/100');
  });

  it('should resolve recursive interpolations', function () {
    var locals = {
      key: {
        object: 1
      },
      anotherKey: {
        value: 10
      }
    };

    expect($restcase.resolve('/api/my-url/{key.object}/{anotherKey.value}')(locals)).toBe('/api/my-url/1/10');
  });
});