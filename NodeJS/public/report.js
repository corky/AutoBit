(function() {
    var app = angular.module('myApp', ['ui.bootstrap']);


    app.controller('ReportController', function($scope, $http) {
        $scope.reportData;
        $scope.model = {reportData: '', startDate:'', endDate:''};
    });

    app.controller('DatePickerController', function ($scope) {
        $scope.today = function() {
            $scope.dt = new Date();
        };
        $scope.clear = function () {
            $scope.dt = null;
        };
        $scope.maxDate = new Date(2020, 5, 22);
        $scope.open = function($event) {
            $scope.status.opened = true;
        };
        $scope.setDate = function(year, month, day) {
            $scope.dt = new Date(year, month, day);
        };
        $scope.format = 'shortDate';
        $scope.status = {
            opened: false
        };
    });

    app.controller('ButtonController', function ($scope, $http) {
        $scope.open = function($event) {
            var s = $scope.$parent.model.startDate
            var sdate = null;
            if (s!=null && s!=undefined && s!='')
            {
                sdate = (s.getMonth() + 1) + "/" +  s.getDate() + "/" +  s.getFullYear();
            }
            var e = $scope.$parent.model.endDate
            var edate =  null;
            if(e!=null && e!=undefined && e!='')
            {
                edate = (e.getMonth() + 1) + "/" +  e.getDate() + "/" +  e.getFullYear();
            }
            $http.get('/reports/1?betweenStart=' + sdate + '&betweenEnd=' + edate).
                success(function(rdata) {
                    //process data
                    //give title to logs that have no tags
                    if(rdata[0]!=undefined && rdata[0]!=null && rdata[0].tagname==null) {
                        rdata[0].tagname = "Unknown";
                    }
                    //turn duration into a report friendly string
                    for (var i = 0, len = rdata.length; i < len; i++) {
                        var seconds = rdata[i].duration;
                        var numdays = Math.floor(seconds / 86400);
                        var numhours = Math.floor((seconds % 86400) / 3600);
                        var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
                        var numseconds = ((seconds % 86400) % 3600) % 60;
                        rdata[i].duration = numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
                    }

                    //no report data, dummy up a default record for the UI
                    if(rdata==undefined || rdata==null || rdata.length==0)
                    {
                        var newArray = [];
                        var dummyData = {
                            tagname: "No data.",
                            duration: ''
                        };
                        newArray.push(dummyData);
                        rdata = newArray;
                    }

                    $scope.$parent.reportData = rdata;
                });
        };
    });

})();






