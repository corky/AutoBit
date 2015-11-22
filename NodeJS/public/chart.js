

google.setOnLoadCallback(function () {
    angular.bootstrap(document.body, ['my-app']);
});
google.load('visualization', '1', {packages: ['corechart']});


var app = app || angular.module("my-app",["google-chart"]);

app.controller("chartController",function($scope, $http){

    $scope.ChartType = "ColumnChart";
    $scope.data1 = {};

    $scope.activateChart = false;


});

app.controller('SelectController', function ($scope, $sce, $http) {


    $scope.update = function($event) {
        $scope.$parent.activateChart=false;
        if($scope.selChart==1) {
            $scope.$parent.data1.colors=['blue','red'];
            $scope.$parent.ChartType = "BarChart";

            var sdate = null;
            var edate = null;
            var s1date = null;
            var e1date = null;

            $scope.$parent.ChartType = "ColumnChart";
            var s = new Date();
            s.setDate(s.getDate() - 6);
            if (s != null && s != undefined && s != '') {
                sdate = (s.getMonth() + 1) + "/" + s.getDate() + "/" + s.getFullYear();
            }
            var e = new Date();
            if (e != null && e != undefined && e != '') {
                edate = (e.getMonth() + 1) + "/" + e.getDate() + "/" + e.getFullYear();
            }

            var s1 = new Date();
            s1.setDate(s1.getDate() - 13);
            if (s1 != null && s1 != undefined && s != '') {
                s1date = (s1.getMonth() + 1) + "/" + s1.getDate() + "/" + s1.getFullYear();
            }
            var e1 = new Date();
            e1.setDate(e1.getDate() - 7);
            if (e1 != null && e1 != undefined && e1 != '') {
                e1date = (e1.getMonth() + 1) + "/" + e1.getDate() + "/" + e1.getFullYear();
            }


            $http.get('/reports/1?betweenStart=' + sdate + '&betweenEnd=' + edate).
                success(function (rdata) {
                    //process data
                    //give title to logs that have no tags
                    if (rdata[0] != undefined && rdata[0] != null && rdata[0].tagname == null) {
                        rdata[0].tagname = "Unknown";
                    }

                    var keys = [];
                    for (var j = 0; j < rdata.length; j++) {
                        var found = false;
                        for (var k = 0; k < keys.length; k++) {
                            if (keys[k] == rdata[j].tagname) {
                                found = true;
                            }
                        }
                        if (found == false && rdata[j].tagname!=null) {
                            keys.push(rdata[j].tagname);
                        }
                    }

                    var dt0 = [];
                    dt0.push(['Tag', 'Last 7 Days']);
                    for (var j = 0; j < keys.length; j++) {
                        var val1 = 0;
                        var row = [keys[j], val1];
                        dt0.push(row);
                    }

                    var dt1 = [];
                    dt1.push(['Tag', 'Last 7 Days']);
                    for (var k = 0; k < keys.length; k++) {
                        if(keys[k]!=null && keys[k]!=undefined && keys[k]!='') {
                            var val1 = 0;
                            for (var j = 0; j < rdata.length; j++) {
                                if (rdata != null && rdata != undefined && rdata[j].tagname == keys[k]) {
                                    val1 = rdata[j].duration;
                                    break;
                                }
                            }
                            var row = [keys[k], val1];
                            dt1.push(row);
                        }
                    }

                    var data6 = google.visualization.arrayToDataTable(dt0);
                    var data7 = google.visualization.arrayToDataTable(dt1);
                    $scope.$parent.data1.dataTable = data6;
                    $scope.$parent.data1.dataTable1 = data7;
                    console.log($scope.$parent);
                    $scope.$parent.activateChart = true;
                });
        }
        if($scope.selChart==2 ) {

            var sdate = null;
            var edate = null;
            var s1date = null;
            var e1date = null;


            $scope.$parent.data1.colors=['#d95f02','#7570b3'];
            $scope.$parent.ChartType = "BarChart";

            var date = new Date();
            var s = new Date(date.getFullYear(), date.getMonth(), 1);
            var e = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            sdate = (s.getMonth() + 1) + "/1/" + s.getFullYear();
            edate = (e.getMonth() + 1) + "/" + e.getDate() + "/" + e.getFullYear();


            var s1 = new Date(s);
            s1.setMonth(s1.getMonth() - 1);
            var s1a = new Date(s1.getFullYear(), s1.getMonth() + 1, 1);
            var e1 = new Date(s1a.getFullYear(), s1a.getMonth() + 1, 0);
            s1date = (s1a.getMonth()) + "/1/" + s1a.getFullYear();
            e1date = (e1.getMonth()) + "/" + e1.getDate() + "/" + e1.getFullYear();


            $http.get('/reports/1?betweenStart=' + sdate + '&betweenEnd=' + edate).
                success(function (rdata) {
                    //process data
                    //give title to logs that have no tags
                    if (rdata[0] != undefined && rdata[0] != null && rdata[0].tagname == null) {
                        rdata[0].tagname = "Unknown";
                    }
                    $http.get('/reports/1?betweenStart=' + s1date + '&betweenEnd=' + e1date).
                        success(function (rdata1) {
                            if (rdata1[0] != undefined && rdata1[0] != null && rdata1[0].tagname == null) {
                                rdata1[0].tagname = "Unknown";
                            }
                            var keys = [];
                            for (var j = 0; j < rdata.length; j++) {
                                var found = false;
                                for (var k = 0; k < keys.length; k++) {
                                    if (keys[k] == rdata[j].tagname) {
                                        found = true;
                                    }
                                }
                                if (found == false && rdata[j].tagname!=null) {
                                    keys.push(rdata[j].tagname);
                                }
                            }
                            for (var j = 0; j < rdata1.length; j++) {
                                var found = false;
                                for (var k = 0; k < keys.length; k++) {
                                    if (keys[k] == rdata1[j].tagname) {
                                        found = true;
                                    }
                                }
                                if (found == false) {
                                    keys.push(rdata1[j].tagname);
                                }
                            }

                            var dt0 = [];
                            dt0.push(['Tag', 'Last', 'This']);
                            for (var j = 0; j < keys.length; j++) {
                                var val1 = 0;
                                var val2 = 0;
                                var row = [keys[j], val1, val2];
                                dt0.push(row);
                            }

                            var dt1 = [];
                            dt1.push(['Tag', 'Last', 'This']);
                            for (var k = 0; k < keys.length; k++) {
                                if(keys[k]!=null && keys[k]!=undefined && keys[k]!='') {
                                    var val1 = 0;
                                    var val2 = 0;
                                    for (var j = 0; j < rdata.length; j++) {
                                        if (rdata != null && rdata != undefined && rdata[j].tagname == keys[k]) {
                                            val1 = rdata[j].duration;
                                            break;
                                        }
                                    }
                                    for (var j = 0; j < rdata1.length; j++) {
                                        if (rdata1 != null && rdata1 != undefined && rdata1[j].tagname == keys[k]) {
                                            val2 = rdata1[j].duration;
                                            break;
                                        }
                                    }
                                    var row = [keys[k], val1, val2];
                                    dt1.push(row);
                                }
                            }

                            var data6 = google.visualization.arrayToDataTable(dt0);
                            var data7 = google.visualization.arrayToDataTable(dt1);
                            $scope.$parent.data1.dataTable = data6;
                            $scope.$parent.data1.dataTable1 = data7;
                            console.log($scope.$parent);
                            $scope.$parent.activateChart = true;
                        });
                });
        }
        if($scope.selChart==3)
        {
            $scope.$parent.ChartType = "LineChart";
            $scope.$parent.data1.colors=['purple','orange', 'green', 'red','blue'];

            var date = new Date();

            var s1date = "1/1/" + date.getFullYear();
            var e1date = "12/31/" + date.getFullYear();

            $http.get('/reports/1?betweenStart=' + s1date + '&betweenEnd=' + e1date).
                success(function (rdatab) {
                    if (rdatab[0] != undefined && rdatab[0] != null && rdatab[0].tagname == null) {
                        rdatab[0].tagname = "Unknown";
                    }
                    s1date = "1/1/" + date.getFullYear();
                    e1date = "1/31/" + date.getFullYear();

                    $http.get('/reports/1?betweenStart=' + s1date + '&betweenEnd=' + e1date).
                        success(function (rdata1) {
                            if (rdata1[0] != undefined && rdata1[0] != null && rdata1[0].tagname == null) {
                                rdata1[0].tagname = "Unknown";
                            }
                            var s2date = "2/1/" + date.getFullYear();
                            var e2date = "2/31/" + date.getFullYear();
                            $http.get('/reports/1?betweenStart=' + s2date + '&betweenEnd=' + e2date).
                                success(function (rdata2) {
                                    if (rdata2[0] != undefined && rdata2[0] != null && rdata2[0].tagname == null) {
                                        rdata2[0].tagname = "Unknown";
                                    }
                                    var s3date = "3/1/" + date.getFullYear();
                                    var e3date = "3/31/" + date.getFullYear();
                                    $http.get('/reports/1?betweenStart=' + s3date + '&betweenEnd=' + e3date).
                                        success(function (rdata3) {
                                            if (rdata3[0] != undefined && rdata3[0] != null && rdata3[0].tagname == null) {
                                                rdata3[0].tagname = "Unknown";
                                            }
                                            var s4date = "4/1/" + date.getFullYear();
                                            var e4date = "4/31/" + date.getFullYear();
                                            $http.get('/reports/1?betweenStart=' + s4date + '&betweenEnd=' + e4date).
                                                success(function (rdata4) {
                                                    if (rdata4[0] != undefined && rdata4[0] != null && rdata4[0].tagname == null) {
                                                        rdata4[0].tagname = "Unknown";
                                                    }

                                                    var s5date = "5/1/" + date.getFullYear();
                                                    var e5date = "5/31/" + date.getFullYear();
                                                    $http.get('/reports/1?betweenStart=' + s5date + '&betweenEnd=' + e5date).
                                                        success(function (rdata5) {
                                                            if (rdata5[0] != undefined && rdata5[0] != null && rdata5[0].tagname == null) {
                                                                rdata5[0].tagname = "Unknown";
                                                            }

                                                            var s6date = "6/1/" + date.getFullYear();
                                                            var e6date = "6/31/" + date.getFullYear();
                                                            $http.get('/reports/1?betweenStart=' + s6date + '&betweenEnd=' + e6date).
                                                                success(function (rdata6) {
                                                                    if (rdata6[0] != undefined && rdata6[0] != null && rdata6[0].tagname == null) {
                                                                        rdata6[0].tagname = "Unknown";
                                                                    }

                                                                    var s7date = "7/1/" + date.getFullYear();
                                                                    var e7date = "7/31/" + date.getFullYear();
                                                                    $http.get('/reports/1?betweenStart=' + s7date + '&betweenEnd=' + e7date).
                                                                        success(function (rdata7) {
                                                                            if (rdata7[0] != undefined && rdata7[0] != null && rdata7[0].tagname == null) {
                                                                                rdata7[0].tagname = "Unknown";
                                                                            }

                                                                            var s8date = "8/1/" + date.getFullYear();
                                                                            var e8date = "8/31/" + date.getFullYear();
                                                                            $http.get('/reports/1?betweenStart=' + s8date + '&betweenEnd=' + e8date).
                                                                                success(function (rdata8) {
                                                                                    if (rdata8[0] != undefined && rdata8[0] != null && rdata8[0].tagname == null) {
                                                                                        rdata8[0].tagname = "Unknown";
                                                                                    }

                                                                                    var s9date = "9/1/" + date.getFullYear();
                                                                                    var e9date = "9/31/" + date.getFullYear();
                                                                                    $http.get('/reports/1?betweenStart=' + s9date + '&betweenEnd=' + e9date).
                                                                                        success(function (rdata9) {
                                                                                            if (rdata9[0] != undefined && rdata9[0] != null && rdata9[0].tagname == null) {
                                                                                                rdata9[0].tagname = "Unknown";
                                                                                            }

                                                                                            var s10date = "10/1/" + date.getFullYear();
                                                                                            var e10date = "10/31/" + date.getFullYear();
                                                                                            $http.get('/reports/1?betweenStart=' + s10date + '&betweenEnd=' + e10date).
                                                                                                success(function (rdata10) {
                                                                                                    if (rdata10[0] != undefined && rdata10[0] != null && rdata10[0].tagname == null) {
                                                                                                        rdata10[0].tagname = "Unknown";
                                                                                                    }

                                                                                                    var s11date = "11/1/" + date.getFullYear();
                                                                                                    var e11date = "11/31/" + date.getFullYear();
                                                                                                    $http.get('/reports/1?betweenStart=' + s11date + '&betweenEnd=' + e11date).
                                                                                                        success(function (rdata11) {
                                                                                                            if (rdata11[0] != undefined && rdata11[0] != null && rdata11[0].tagname == null) {
                                                                                                                rdata11[0].tagname = "Unknown";
                                                                                                            }
                                                                                                            var s12date = "12/1/" + date.getFullYear();
                                                                                                            var e12date = "12/31/" + date.getFullYear();
                                                                                                            $http.get('/reports/1?betweenStart=' + s12date + '&betweenEnd=' + e12date).
                                                                                                                success(function (rdata12) {
                                                                                                                    if (rdata12[0] != undefined && rdata12[0] != null && rdata12[0].tagname == null) {
                                                                                                                        rdata12[0].tagname = "Unknown";
                                                                                                                    }


                                                                                                                    var adddata = function(smonth, tdata, keys1, monthly) {
                                                                                                                        var row = [];
                                                                                                                        row.push(smonth);
                                                                                                                        for (var k = 0; k < keys.length; k++) {
                                                                                                                            var val = 0;
                                                                                                                            for (var j = 0; j < tdata.length; j++) {
                                                                                                                                if (keys1[k] == tdata[j].tagname) {
                                                                                                                                    val = tdata[j].duration;
                                                                                                                                }
                                                                                                                            }
                                                                                                                            row.push(val);
                                                                                                                        }
                                                                                                                        monthly.push(row);
                                                                                                                    };

                                                                                                                    var monthlydata = [];
                                                                                                                    var monthlydata2 = [];

                                                                                                                    var keys = [];

                                                                                                                    for (var j = 0; j < rdatab.length; j++) {
                                                                                                                        keys.push(rdatab[j].tagname);
                                                                                                                        if(j>3)
                                                                                                                        {
                                                                                                                            break;
                                                                                                                        }
                                                                                                                    }

                                                                                                                    var row1 = [];
                                                                                                                    row1.push("Month");
                                                                                                                    for (var y = 0; y < keys.length; y++) {
                                                                                                                        row1.push(keys[y]);
                                                                                                                    }
                                                                                                                    var emptydata = [];
                                                                                                                    console.log(row1);
                                                                                                                    monthlydata.push(row1);
                                                                                                                    monthlydata2.push(row1);
                                                                                                                    adddata("Jan", rdata1, keys, monthlydata);
                                                                                                                    adddata("Feb", rdata2, keys, monthlydata);
                                                                                                                    adddata("Mar", rdata3, keys, monthlydata);
                                                                                                                    adddata("Apr", rdata4, keys, monthlydata);
                                                                                                                    adddata("May", rdata5, keys, monthlydata);
                                                                                                                    adddata("Jun", rdata6, keys, monthlydata);
                                                                                                                    adddata("Jul", rdata7, keys, monthlydata);
                                                                                                                    adddata("Aug", rdata8, keys, monthlydata);
                                                                                                                    adddata("Sep", rdata9, keys, monthlydata);
                                                                                                                    adddata("Oct", rdata10, keys, monthlydata);
                                                                                                                    adddata("Nov", rdata11, keys, monthlydata);
                                                                                                                    adddata("Dec", rdata12, keys, monthlydata);

                                                                                                                    adddata("Jan", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Feb", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Mar", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Apr", emptydata, keys, monthlydata2);
                                                                                                                    adddata("May", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Jun", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Jul", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Aug", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Sep", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Oct", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Nov", emptydata, keys, monthlydata2);
                                                                                                                    adddata("Dec", emptydata, keys, monthlydata2);

                                                                                                                    var data8 = google.visualization.arrayToDataTable(monthlydata2);
                                                                                                                    var data9 = google.visualization.arrayToDataTable(monthlydata);
                                                                                                                    $scope.$parent.data1.dataTable = data8;
                                                                                                                    $scope.$parent.data1.dataTable1 = data9;
                                                                                                                    $scope.$parent.activateChart = true;

                                                                                                                });


                                                                                                        });

                                                                                                });

                                                                                        });

                                                                                });

                                                                        });

                                                                });

                                                        });

                                                });


                                        });


                                });
                        });
                });
            //$scope.$parent.data1.dataTable = data5;
            //$scope.$parent.data1.dataTable1 = data5;
            //$scope.$parent.activateChart = true;

        }

        if($scope.selChart==4)
        {
            $scope.$parent.ChartType = "PieChart";

            var date = new Date();

            s1date = "1/1/" + date.getFullYear();
            e1date = "12/31/" + date.getFullYear();

            $http.get('/reports/1?betweenStart=' + s1date + '&betweenEnd=' + e1date).
                success(function (rdata) {
                    //process data
                    //give title to logs that have no tags
                    if (rdata[0] != undefined && rdata[0] != null && rdata[0].tagname == null) {
                        rdata[0].tagname = "Unknown";
                    }

                    var dataArray= [];
                    var dataArray2= [];
                    var titles = ['Location', 'Time Spent']
                    dataArray.push(titles);
                    dataArray2.push(titles);
                    for(var i=0;i<rdata.length;i++)
                    {
                        if(rdata[i].tagname!=null) {
                            var row = [rdata[i].tagname, rdata[i].duration];
                            var row1 = [rdata[i].tagname, 0];
                            dataArray.push(row);
                            dataArray2.push(row1);
                        }
                    }
                    var data11 = google.visualization.arrayToDataTable(dataArray2);
                    var data12 = google.visualization.arrayToDataTable(dataArray);

                    $scope.$parent.data1.colors=['purple','orange', 'green', 'black','grey','yellow','red','blue'];
                    $scope.$parent.data1.dataTable = data11;
                    $scope.$parent.data1.dataTable1 = data12;
                    $scope.$parent.activateChart = true;
                });
        }
    };
});


app.controller('ButtonController', function ($scope, $sce, $http) {
    $scope.open = function($event) {




    }
});
