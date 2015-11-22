(function() {
    var app = angular.module('myApp', ['ui.bootstrap']);

    app.controller('TagController', ['$scope', '$sce', '$http', function($scope, $sce, $http) {
        $scope.logDataImgs = [];
        $scope.logOptions = [];
        $scope.tagOptions = [];
        $scope.myAlerts = [];
        $scope.mySelectScope;
        $scope.myTagSelectScope;

        $scope.model = {newTag:'', existingTag:'', imgUrl:'', currentLog:''};

        $http.get('/tags').
            success(function(tdata) {
                for (var i = 0, len = tdata.length; i < len; i++) {
                    var tagOption = {
                        name: tdata[i].tagname,
                        value: tdata[i].id
                    };
                    $scope.tagOptions.push(tagOption);
                }
            })

        $http.get('/logs?tagid=0').
            success(function(ldata) {
                if(ldata.length>0) {
                    $scope.model.imgUrl =   $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q=" + ldata[0].locationLon + "%2C" + ldata[0].locationLat + "&key=AIzaSyCi2S5MWhfezR1SbEOMH0PqA2BpeDqSMas&zoom=15");
                    $scope.model.currentLog = ldata[0].id;
                    $scope.selLog = ldata[0].id;
                }
                else
                {
                    $scope.myAlerts.push({
                        msg: 'All logs are currently tagged.',
                        type: 'success'
                    })

                }

                for (var i = 0, len = ldata.length; i < len; i++) {
                    var dataOption = {
                        name:  ldata[i].locationLon + ' ' + ldata[i].locationLat,
                        value : ldata[i].id
                    };
                    $scope.logOptions.push(dataOption);
                    var logDataImg = {
                        id: ldata[i].id,
                        name: ldata[i].locationLon + ' ' + ldata[i].locationLat,
                        locationLat: ldata[i].locationLat,
                        locationLon: ldata[i].locationLon,
                        img : "https://www.google.com/maps/embed/v1/place?q=" + ldata[i].locationLon + "%2C" + ldata[i].locationLat + "&key=AIzaSyCi2S5MWhfezR1SbEOMH0PqA2BpeDqSMas&zoom=15"
                    };
                    $scope.logDataImgs.push(logDataImg);
                }
            })
    }]);

    app.controller('AlertController', function ($scope) {
        $scope.alerts = $scope.$parent.myAlerts;

        $scope.addAlert = function(alertString) {
            $scope.alerts.push({msg: alertString});
        };

        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
    });

    app.controller('SelectController', function ($scope, $sce, $http) {
        $scope.fooOptions = $scope.$parent.logOptions;
        $scope.$parent.mySelectScope = $scope;

        $scope.update = function($event) {
            for (var i = 0, len = $scope.$parent.logDataImgs.length; i < len; i++) {
                if ($scope.$parent.logDataImgs[i].id == $scope.selLog) {
                    $scope.$parent.model.currentLog = $scope.selLog;
                    $scope.$parent.model.imgUrl = $sce.trustAsResourceUrl($scope.$parent.logDataImgs[i].img);
                }
            }
        };
    });
    app.controller('SelectController2', function ($scope, $sce, $http) {
        $scope.fooOptions2 = $scope.$parent.tagOptions;
        $scope.$parent.myTagSelectScope = $scope;
    });

    app.controller('ButtonController1', function ($scope, $sce, $http) {
        $scope.open = function($event) {
            if ($scope.$parent.model.currentLog != 0) {
                var newTagName = $scope.$parent.model.newTag;
                var dataObj = {
                    locationLon: '',
                    locationLat: '',
                    tagname: $scope.$parent.model.newTag
                };

                var myid = 0;
                for (var i = 0, len = $scope.$parent.logDataImgs.length; i < len; i++) {
                    if ($scope.$parent.logDataImgs[i].id == $scope.$parent.model.currentLog) {
                        dataObj.locationLon = $scope.$parent.logDataImgs[i].locationLon;
                        dataObj.locationLat = $scope.$parent.logDataImgs[i].locationLat;
                        myid = $scope.$parent.logDataImgs[i].id;
                    }
                }

                $http.post('/tags', dataObj).
                    success(function (tdata, status, headers, config) {
                        $scope.$parent.model.newTag = "";
                        $scope.$parent.myAlerts.push({
                            msg: 'Success.   Created new tag named "' + newTagName + '".',
                            type: 'success'
                        })

                        var newid = tdata.id
                        var dataObj2 = {
                            tagid: newid
                        };

                        var tagOpts = $scope.$parent.myTagSelectScope.fooOptions2;
                        var tagOptionNew = {
                            name: newTagName,
                            value: newid
                        };
                        tagOpts.push(tagOptionNew)

                        $http.put('/logs/' + myid, dataObj2).
                            success(function () {
                                $scope.$parent.myAlerts.push({
                                    msg: 'Success.   Associated log to tag named "' + newTagName + '".',
                                    type: 'success'
                                })

                                var opts = $scope.$parent.mySelectScope.fooOptions;
                                for (var i = 0, len = opts.length; i < len; i++) {
                                    if (opts[i].value == myid) {
                                        opts.splice(i, 1);
                                        break;
                                    }
                                }
                                if (opts != null && opts != undefined && opts.length > 0) {
                                    $scope.$parent.mySelectScope.selLog = opts[0].value;
                                    $scope.$parent.model.currentLog = opts[0].value;
                                    var log = $scope.$parent.logDataImgs;
                                    for (var i = 0, len = log.length; i < len; i++) {
                                        if (log[i].id == opts[0].value) {
                                            $scope.$parent.model.imgUrl = $sce.trustAsResourceUrl(log[i].img);
                                        }
                                    }
                                }
                                else {
                                    $scope.$parent.mySelectScope.selLog = 0;
                                    $scope.$parent.model.currentLog = 0;
                                    $scope.$parent.model.imgUrl = '/blank.jpg';
                                    $scope.$parent.myAlerts.push({
                                        msg: 'All logs are currently tagged.',
                                        type: 'success'
                                    })

                                }

                            });
                    });
            }
        };
    });

    app.controller('ButtonController2', function ($scope, $sce, $http) {
        $scope.open = function($event) {
            if ( $scope.$parent.model.currentLog != 0) {

                var myid = 0;

                for (var i = 0, len = $scope.$parent.logDataImgs.length; i < len; i++) {
                    if ($scope.$parent.logDataImgs[i].id == $scope.$parent.model.currentLog) {
                        myid = $scope.$parent.logDataImgs[i].id;
                    }
                }

                var dataObj2 = {
                    tagid: $scope.$parent.model.existingTag
                };

                $http.put('/logs/' + myid, dataObj2).
                    success(function () {
                        var tagOpts = $scope.$parent.myTagSelectScope.fooOptions2;
                        var exTagName = '';
                        for (var i = 0, len = tagOpts.length; i < len; i++) {
                            if(tagOpts[i].value==$scope.$parent.model.existingTag)
                            {
                                exTagName = tagOpts[i].name;
                            }
                        }

                        $scope.$parent.myAlerts.push({
                            msg: 'Success.   Associated log to existing tag "' + exTagName + '".',
                            type: 'success'
                        })
                        var opts = $scope.$parent.mySelectScope.fooOptions;
                        for (var i = 0, len = opts.length; i < len; i++) {
                            if (opts[i].value == myid) {
                                opts.splice(i, 1);
                                break;
                            }
                        }
                        if (opts != null && opts != undefined && opts.length > 0) {
                            $scope.$parent.mySelectScope.selLog = opts[0].value;
                            $scope.$parent.model.currentLog = opts[0].value;
                            var log = $scope.$parent.logDataImgs;
                            for (var i = 0, len = log.length; i < len; i++) {
                                if (log[i].id == opts[0].value) {
                                    console.log('here');
                                    $scope.$parent.model.imgUrl = $sce.trustAsResourceUrl(log[i].img);
                                }
                            }
                        }
                        else {
                            $scope.$parent.mySelectScope.selLog = 0;
                            $scope.$parent.model.currentLog = 0;
                            $scope.$parent.model.imgUrl = '/blank.jpg';
                            $scope.$parent.myAlerts.push({
                                msg: 'All logs are currently tagged.',
                                type: 'success'
                            })
                        }
                    });
            }
        };

    });
})();






