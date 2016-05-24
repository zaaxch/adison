var app = angular.module('Adison', [
    'ngRoute',
    'ngStorage',
    'ngAnimate'
]);

app.config(['$localStorageProvider',
    function ($localStorageProvider) {
        $localStorageProvider.setKeyPrefix('ADLS');
    }
])

var users = new PouchDB('https://adison.cloudant.com/users', {
    ajax: {
        cache: false
    },
    auth: {
        username: 'birseltedearinhistoodert',
        password: '6e88c4261fff2c1084120d30d36212169574c17a'
    }
});

var posts = new PouchDB('https://adison.cloudant.com/posts', {
    ajax: {
        cache: false
    }
});

app.controller('AdisonWrap', function($scope, $localStorage, $sessionStorage) {
    $scope.$storage = $localStorage.$default({
        loggedIn: false
    });
    $scope.logout = function() {
        $scope.$storage.user = {};
        $scope.$storage.loggedIn = false;
        document.location = "./";
    };
});

app.controller('AdisonSearch', function($scope, $localStorage, $sessionStorage, $http) {
    $scope.$storage = $localStorage.$default({
        loggedIn: false
    });
    $scope.q = null;
    $scope.posts = [];
    $scope.networking = false;
    $scope.search = function() {
        $http({
            method: 'GET',
            url: 'https://adison.cloudant.com/posts/_design/posts/_search/text',
            params: {
                q: $scope.q,
                include_docs: true
            }
        }).then(function(res) {
            $scope.posts = res.data.rows;
            $scope.$apply();
        });
    };
});

app.controller('AdisonFeed', function($scope, $localStorage, $sessionStorage) {
    $scope.$storage = $localStorage.$default({
        loggedIn: false
    });
    $scope.text = null;
    $scope.posts = [];
    $scope.networking = false;
    $scope.post = function() {
        if (!$scope.text) {
            alert("Enter something to post!");
            return;
        }
        var post = {
            email: $scope.$storage.user.email,
            author: $scope.$storage.user.id,
            text: $scope.text,
            time: (Math.round(new Date().getTime()/1000))
        };
        posts.post(post).then(function(res) {
            post.id = res.id;
            post.doc = post;
            $scope.posts.unshift(post);
            $scope.text = null;
            $scope.networking = false;
            $scope.$apply();
            return;
        }).catch(function(err) {
            alert("Something went wrong, please try again!");
            $scope.networking = false;
            return;
        });
    };
    $scope.load = function() {
        posts.query('posts/posts', {
            descending: true,
            limit: 30,
            include_docs: true
        }).then(function (res) {
            $scope.posts = res.rows;
            $scope.$apply();
        });
    };
    $scope.load();
});

app.controller('AdisonAccessForm', function($scope, $localStorage, $sessionStorage) {
    $scope.user = {};
    $scope.networking = false;
    if ($scope.$storage.loggedIn == true) {
        document.location = "../";
    }
    $scope.login = function() {
        if ($scope.networking) {
            return;
        } else {
            $scope.networking = true;
            users.query('users/login', {
                key: [
                    $scope.user.email,
                    md5($scope.user.password)
                ]
            }).then(function (res) {
                console.log(res);
                if (res.rows.length > 0) {
                    $scope.$storage.loggedIn = true;
                    $scope.$storage.user = {
                        "id": res.rows[0].id,
                        "email": $scope.user.email
                    };
                    document.location = "../";
                    $scope.networking = false;
                    return;
                } else {
                    alert("Wrong email or password!");
                    $scope.networking = false;
                    return;
                }
            }).catch(function (err) {
                alert("Something went wrong, please try again!");
                $scope.networking = false;
                return;
            });
        }
    };
});

app.controller('AdisonRegisterForm', function($scope, $localStorage, $sessionStorage) {
    $scope.user = {};
    $scope.networking = false;
    if ($scope.$storage.loggedIn == true) {
        document.location = "../";
    }
    $scope.register = function() {
        if ($scope.networking) {
            return;
        } else {
            $scope.networking = true;
            if ($scope.user.email && $scope.user.password) {
                users.query('users/email', {
                    key: $scope.user.email
                }).then(function (res) {
                    if (res.rows.length > 0) {
                        alert("That email is already in use!");
                        $scope.networking = false;
                        return;
                    } else {
                        users.post({
                            email: $scope.user.email,
                            password: md5($scope.user.password)
                        }).then(function(res) {
                            $scope.$storage.loggedIn = true;
                            $scope.$storage.user = {
                                "id": res.id,
                                "email": $scope.user.email
                            };
                            document.location = "../";
                            $scope.networking = false;
                            return;
                        }).catch(function(err) {
                            alert("Something went wrong, please try again!");
                            $scope.networking = false;
                            return;
                        });
                    }
                }).catch(function (err) {
                    alert("Something went wrong, please try again!");
                    $scope.networking = false;
                    return;
                });
            } else {
                alert("Please fill out all fields!");
                $scope.networking = false;
                return;
            }
        }
    }
});
