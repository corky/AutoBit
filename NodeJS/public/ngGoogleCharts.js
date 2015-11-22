var googleChart = googleChart || angular.module("google-chart",[]);

googleChart.directive("googleChart",function(){
    return{
        restrict : "A",
        link: function($scope, $elem, $attr){
            var initChart = function() {
                var dt = $scope[$attr.ngModel].dataTable;
                var dt1 = $scope[$attr.ngModel].dataTable1;
                var colors = $scope[$attr.ngModel].colors;
                var options2 = {
                    animation: {
                        duration: 1500,
                        easing: 'out',
                    },
                    colors: colors
                };

                var options = {};
                if ($scope[$attr.ngModel].title)
                    options.title = $scope[$attr.ngModel].title;

                var googleChart = new google.visualization[$attr.googleChart]($elem[0]);
                googleChart.draw(dt, options2)
                googleChart.draw(dt1, options2)
            };

            $scope.$watch($attr.trigger, function(val){
                if (val === true) {
                    initChart();
                }
            });
        }
    }
});