'use strict';

var map;
var markers = [];

function initialize() 
{
	var india = {lat: 28.626406, lng: 77.244853};

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 5,
    center: india,
    mapTypeId: 'roadmap'
  });
  
  // Create the search box and link it to the UI element.
 	var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();

    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);
  });

  google.maps.event.addListener(map, 'click', function(event) 
  {
  	// Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];
  
    var latitude = event.latLng.lat();
    var longitude = event.latLng.lng();
    var setRad = 100;

    var rad = prompt("Please enter radius", setRad);
    if (rad != null) {
      setRad = Number(rad);
    }

    markers.push(new google.maps.Circle({map: map,
                                     radius: setRad,
                                     center: event.latLng,
                                     fillColor: '#777',
                                     fillOpacity: 0.1,
                                     strokeColor: '#AA0000',
                                     strokeOpacity: 0.8,
                                     strokeWeight: 2,
                                     draggable: true,    // Dragable
                                     editable: true      // Resizable
                                    }));

    markers.push(new google.maps.Marker({
      map: map,
      position: new google.maps.LatLng(latitude, longitude)
    }));

    console.log( latitude + ', ' + longitude + ', ' + setRad );
  });
}

google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function () 
{
    $('.button').click(function()
    {
         $('ul li').removeClass('selected');
         $(this).closest("li").addClass('selected');
    });
});

var app = angular.module("controllers", ['ui.bootstrap','googlechart']);

app.directive("strToTime", function(){
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ngModelController) {
			ngModelController.$parsers.push(function(data) {     
				if (!data)
					return "";
				return ("0" + data.getHours().toString()).slice(-2) + ":" + ("0" + data.getMinutes().toString()).slice(-2);
			});

			ngModelController.$formatters.push(function(data) {
				if (!data) {
					return null; 
				}
				var d = new Date(1970,1,1);
				var splitted = data.split(":");
				d.setHours(splitted[0]);
				d.setMinutes(splitted[1]);
				return d;
			});
		}
	};
});


app.directive('convertToNumber', function() {
	return {
		require: 'ngModel',
		link: function(scope, element, attrs, ngModel) {
			ngModel.$parsers.push(function(val) {
				return parseInt(val, 10);
			});
			ngModel.$formatters.push(function(val) {
				return '' + val;
			});
		}
	};
});


app.controller("dashboard_controller",['$scope', function ($scope) {
	NProgress.start();
	var no_of_shift=0,no_of_present_emp=0,no_of_absent_emp=0,no_of_late_emp=0;

	$scope.get_dash_data=function(){

		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var org_key = response.websafeKey;

				gapi.client.organisationApi.getAllSites({ 'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {
					$scope.$apply(function () {
						$scope.no_of_sites=response.items.length;
						if(response.items!=null)
							for(var i=0;i<response.items.length;i++){ 
								get_yesterday_attendance(response.items[i].websafeKey);
								gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key':response.items[i].websafeKey}).execute(function(resp){
									$scope.$apply(function () {
										no_of_shift=no_of_shift+resp.items.length;
										$scope.no_of_shifts=no_of_shift;

										var today = new Date();
										var dd = today.getDate(); 
										var yyyy = today.getFullYear();
										var mm=today.getMonth()+1;
										if(dd<10) {
											dd='0'+dd
										} 

										if(mm<10) {
											mm='0'+mm
										} 
										var present=0,no_of_emp=0;;
										today = yyyy+'-'+mm+'-'+dd;
										if(resp.items!=null)
											for(var j=0;j<resp.items.length;j++)
											{
												gapi.client.attendanceApi.getAttendanceByShift({'token': sessionStorage.accessToken, 'shift_key':resp.items[j].websafeKey,'date':today}).execute(function(res){
													$scope.$apply(function () {
														if(!res.error)
														{  
															if(res.absent!=null)
															{ 
																no_of_absent_emp=no_of_absent_emp+res.absent.length;

															}
															if(res.late!=null)
															{
																no_of_late_emp=no_of_late_emp+res.late.length;

															}
															if(res.ontime!=null)
																no_of_present_emp=no_of_present_emp+res.ontime.length;

															$scope.no_of_present=no_of_present_emp;
															$scope.no_of_late=no_of_late_emp;
															$scope.no_of_absent=no_of_absent_emp;
															get_chart();
														}
													});
												});
											}
									});


								});



							}
					});

				});
			});
		});


		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var org_key = response.websafeKey;

				gapi.client.employeeApi.employeelist({'token': sessionStorage.accessToken, 'org_key':org_key}).execute(function(resp){
					$scope.$apply(function () {
						if(!resp.error)
						{
							if(resp.items!=null)
							{ $scope.no_of_emp=resp.items.length;
							}
							else{
								$scope.no_of_emp=0;
							}
						}
					}); 
				});

			});
		});

	};

	var y_no_of_absent_emp=0,y_no_of_present_emp=0,y_no_of_late_emp=0;

	var get_yesterday_attendance=function(key){

		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key':key}).execute(function(resp){
			$scope.$apply(function () {

				var today = new Date();
				today.setDate(today.getDate() - 1);
				var dd = today.getDate(); 
				var yyyy = today.getFullYear();
				var mm=today.getMonth()+1;
				if(dd<10) {
					dd='0'+dd
				} 

				if(mm<10) {
					mm='0'+mm
				} 
				today = yyyy+'-'+mm+'-'+dd;
				for(var j=0;j<resp.items.length;j++)
				{
					gapi.client.attendanceApi.getAttendanceByShift({'token': sessionStorage.accessToken, 'shift_key':resp.items[j].websafeKey,'date':today}).execute(function(res){
						$scope.$apply(function () {
							if(!res.error)
							{  
								if(res.absent!=null)
								{ 
									y_no_of_absent_emp=y_no_of_absent_emp+res.absent.length;

								}
								if(res.late!=null)
								{
									y_no_of_late_emp=y_no_of_late_emp+res.late.length;

								}
								if(res.ontime!=null)
									y_no_of_present_emp=y_no_of_present_emp+res.ontime.length;

								$scope.y_no_of_present=y_no_of_present_emp;
								$scope.y_no_of_late=y_no_of_late_emp;
								$scope.y_no_of_absent=y_no_of_absent_emp;
								y_get_chart();
							}
						});
					});
				}
			});


		});


	};

	function y_get_chart(){
		var chart2 = {};
		chart2.type = "PieChart";
		chart2.cssStyle = "height:400px; width:500px;";
		chart2.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: y_no_of_present_emp}
					]},
					{c: [
						{v: "Absent"},
						{v: y_no_of_absent_emp}
						]},
						{c: [
							{v: "Late"},
							{v: y_no_of_late_emp}

							]}
						]};

		chart2.options = {
				title: "Organisation Attendance Activity",
				isStacked: "true",
				fill: 20,
				colors: ['#1A8CFF', '#E84C3D'],
				displayExactValues: true,
				vAxis: {"title": "Number Of Employees", "gridlines": {"count": 6}},
				hAxis: {"title": "Today"}
		};

		chart2.formatters = {};

		$scope.y_chart = chart2;

	}

	function get_chart(){
		var chart1 = {};
		chart1.type = "PieChart";
		chart1.cssStyle = "height:400px; width:500px;";
		chart1.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: no_of_present_emp}
					]},
					{c: [
						{v: "Absent"},
						{v: no_of_absent_emp}
						]},
						{c: [
							{v: "Late"},
							{v: no_of_late_emp}

							]}
						]};

		chart1.options = {
				title: "Organisation Attendance Activity",
				isStacked: "true",
				fill: 20,
				colors: ['#1A8CFF', '#E84C3D'],
				displayExactValues: true,
				vAxis: {title: "Number Of Employees", "gridlines": {"count": 6}},
				hAxis: {title: "Today"}
		};

		chart1.formatters = {};

		$scope.chart = chart1;
		NProgress.done();
	}

}]);


app.controller("organisation_controller",['$parse','$scope', function ($parse,$scope) {

	NProgress.start();
	var pagination=function(){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil($scope.sites.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};
	}

	$scope.get_org_details = function () {

		$scope.update_org=true;

		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function(response){
			$scope.$apply(function () {
				if(!response.error)
				{
					var org_key=response.websafeKey;


					gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key':org_key}).execute(function(response){
						$scope.$apply(function () {
							var data=[];
							if(!response.error)
							{  
								for(var i=0;i<response.items.length;i++)  
									data[i]=(response.items[i]);

								$scope.sites=data;
								pagination();
							}
						});
					});
				}
			});
		});


		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				if (!response.error) {
					$scope.org_name = response.name;
					$scope.location = response.location;
					$scope.numberOfsites = response.numberOfSites;

				}
			});
		});

	};

	$scope.go_back=function()
	{
		$scope.increased_sites=false;
		$scope.update_org=true;
	}

	$scope.update_org_details=function()
	{
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response)
		{
			if(!response.error)
			{  
				var number_sites=response.numberOfSites;
				var org_key=response.websafeKey;
				
				if($scope.numberOfsites<number_sites)
				{
					swal({
						  title: "Number of Sites cannot be decreased!",
						  text: "Please contact ADMIN for further support",
						  timer: 3000,
						  showConfirmButton: false
						});
				}
				else if ($scope.numberOfsites==number_sites)
				{
					gapi.client.organisationApi.update({'token': sessionStorage.accessToken, 'org_key':org_key,'name':$scope.org_name,'location':$scope.location,'numberOfSites':$scope.numberOfsites}).execute(function(response)
					{
						$scope.$apply(function () 
						{
							if (!response.error) 
							{
								$scope.get_org_details();
								$scope.increased_sites=false;
								swal({
									  title: "Organisation Updated Successfully",
									  type: "success",
									  timer: 3000,
									  showConfirmButton: false
									});
							}
							else
							{
								if (response.error) 
								{
									swal({
										  title: "Organisation Not Updated",
										  text: response.message,
										  type: "error",
										  timer: 3000,
										  showConfirmButton: false
										});
								}
							}
						});
					});
				}
				else
				{
					gapi.client.organisationApi.update({'token': sessionStorage.accessToken, 'org_key':org_key,'name':$scope.org_name,'location':$scope.location,'numberOfSites':$scope.numberOfsites}).execute(function(response)
					{
						$scope.$apply(function () 
						{
							if (!response.error) 
							{
								swal({
									  title: "Organisation Updated Successfully",
									  type: "success",
									  timer: 3000,
									  showConfirmButton: false
									});
								$scope.get_org_details();
								$scope.left_site=$scope.numberOfsites-number_sites;	// Check if site has been added or is same
								$scope.increased_sites=true; 
								$scope.update_org=false;													
							}
							else
							{
								if (response.error) 
								{
									swal({
										  title: "Organisation Not Updated",
										  text: response.message,
										  type: "error",
										  timer: 3000,
										  showConfirmButton: false
										});
								}
							}
						});
					});
				}
			}
		});
	};

	$scope.addsite=function()
	{
		if($scope.left_site>0)	// If site has been added, then count is > 0
		{
			gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) 
			{ 
				//getting org_key from getAdminOrganisation() method of organisationApi
				var org_key = response.websafeKey;
				var num_of_site = response.numberOfSites;

				$scope.$apply(function () 
				{
					if (!response.error) 
					{  //Adding Site to the datastore
						gapi.client.siteApi.insert({ 'token': sessionStorage.accessToken, 'org_key': org_key, 'site_name': $scope.site_name, 'managerEmail': $scope.managerEmail, 'number_of_shifts': $scope.number_of_shifts, 'site_location': $scope.site_location, 'address': $scope.address, 'cityOrTown': $scope.cityOrTown }).execute(function (resp) 
						{
							$scope.$apply(function () 
							{
								if (!resp.error) 
								{									
									// Decrement the New Sites counter
									$scope.left_site=$scope.left_site-1;

									var site_key = resp.websafeKey;
									var num_of_shift = resp.number_of_shifts;
									for (var i = 0; i < num_of_shift; i++) 
									{
										var shift_name=shift_d[i].shift_name;

										var time_from=shift_d[i].time_from;

										var date_f = new Date(time_from);
										var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
										var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
										var  time_f = hours_f + ":" + minutes_f;

										var time_to=shift_d[i].time_to;
										var date_t = new Date(time_to);
										var hours_t = date_f.getHours() < 10 ? "0" + date_t.getHours() : date_t.getHours();
										var minutes_t = date_f.getMinutes() < 10 ? "0" + date_t.getMinutes() : date_t.getMinutes();
										var  time_t = hours_t + ":" + minutes_t;

										console.log(time_t);

										gapi.client.shiftApi.insert({'token': sessionStorage.accessToken, 'site_key': site_key, 'name': shift_name, 'time_from': time_f, 'time_to': time_t }).execute(function (res) 
										{
											$scope.$apply(function () 
											{
												if(!res.error)
												{
													console.log($scope.left_site);													
													$scope.site_name=" ";
													$scope.site_location=" ";
													$scope.managerEmail="abc@xyz.com";
													$scope.address=" ";
													$scope.cityOrTown=" ";
													$scope.number_of_shifts="Select Number Of Shifts";
													swal({
														  title: "Site and Shift Added Successfully",
														  type: "success",
														  timer: 3000,
														  showConfirmButton: false
														});
													$scope.add_shifts();
													$scope.get_org_details();
												}
												else
												{
													if (res.error)
													{
														swal({
															  title: "Shift Not Added",
															  text: res.message,
															  type: "error",
															  timer: 3000,
															  showConfirmButton: false
															});
														$scope.get_org_details();
													}													
												}
											});
										});
									}
								} 
								else
								{
									if (resp.error) 
									{										
										swal({
											  title: "Site and Shifts Not Added",
											  text: resp.message,
											  type: "error",
											  timer: 3000,
											  showConfirmButton: false
											});
										$scope.get_org_details();
									}
								}
							});
						});
					}
				});

			});
		}
		else
		{
			$scope.increased_sites=false;
			$scope.update_org=true;
		}
	}
	
	var shift_d=[];
	$scope.add_shifts=function()
	{
		var shift=[];

		for(var i=0;i<$scope.number_of_shifts;i++)
		{
			shift[i]=[{ shift_name:"shift_name"+i,time_from:"time_from"+i,time_to:"time_to"+i}];

		}
		$scope.shifts=shift;
		shift_d=shift;
		console.log($scope.shifts);
	}

	NProgress.done();

}]);


app.controller("employee_controller",['$scope','$timeout', function ($scope,$timeout) {
	NProgress.start();
	var data=[];
	var site_websafekey="";
	var org_key="";

	$scope.get_emp_details = function () {
		$scope.show_manage=true;
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				org_key = response.websafeKey;

				gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {
					$scope.$apply(function () {
						data=response.items;
						var get_site=[];
						if (!response.error) { 
							for(var i=0;i<response.items.length;i++){
								get_site[i]=(response.items[i].site_name);
							}
							$scope.all_site=get_site;
						}
					});
				});
			});
		});

		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var orgkey = response.websafeKey;

				gapi.client.employeeApi.employeelist({'token': sessionStorage.accessToken, 'org_key':orgkey}).execute(function (response) {
					$scope.$apply(function () {
						if (!response.error) {
							if(response.items!=null)
							{
								$scope.employees = response.items;
								pages();
							}
						}
					});
				});
			});
		});
	};

	$scope.get_managingsite = function () {

		if ($scope.u_SiteManager == "true")
		{
			gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
				$scope.$apply(function () {
					var orgkey = response.websafeKey;

					gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': orgkey}).execute(function (response){
						$scope.$apply(function () {
							data=response.items;
							var get_managingsite=[];
							if (!response.error) { 
								for(var i=0;i<response.items.length;i++){
									get_managingsite[i]=(response.items[i].site_name);
								}
								$scope.u_ManageSite=get_managingsite;
								$('#u_ManageSite').attr("required", "true");
							}
						});
					});	
				});
			});
		}
		else if ($scope.u_SiteManager == "false")
		{
			$scope.u_ManageSite={ };
			$('#u_ManageSite').removeAttr("required");
		}
	};


	$scope.checkDisabled = function () {
		if ($scope.u_SiteManager != null)
		{
			if (($scope.u_SiteManager).toString() == "false") {
				return true;
			}
			else if (($scope.u_SiteManager).toString() == "true") {
				return false;
			}
		}	
	};

	$scope.get_shift = function () {
		var i=0;
		var key;
		for(i=0;i<data.length;i++)
		{
			if(data[i].site_name==$scope.all_site_of_org)
			{
				site_websafekey=data[i].websafeKey;
				break;
			}

		}
		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key': site_websafekey}).execute(function (response) {
			$scope.$apply(function () {
				var get_shift=[];

				if (!response.error) {
					for(var i=0;i<response.items.length;i++){
						get_shift[i]=(response.items[i].name);

					}

					$scope.all_shift=get_shift;
				}
			});
		});
	};

	var pages=function(){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil($scope.employees.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};

	};

	$scope.addemployee = function () {


		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key': site_websafekey}).execute(function (response) {
			var i=0;
			var shift_websafekey="";
			var key;
			for(i=0;i<response.items.length;i++)
			{  
				if(response.items[i].name==$scope.all_shift_of_site)
				{
					shift_websafekey=response.items[i].websafeKey;
					break;
				}

			}
			gapi.client.employeeApi.insertEmployeeDemographic({'token': sessionStorage.accessToken, 'shift_ws_key':shift_websafekey,'employee_id':$scope.employee_id,  'name': $scope.name, 'designation': $scope.designation, 'gender': $scope.gender, 'mobile_number': $scope.mobile_number, 'email': $scope.email, 'address': $scope.address, 'siteManager': $scope.siteManager }).execute(function (response) {
				$scope.$apply(function () {
					if (!response.error) {
						swal({
							  title: "Employee Added Successfully",
							  type: "success",
							  timer: 3000,
							  showConfirmButton: false
							});

						$scope.employee_id=" ";
						$scope.name=" ";
						$scope.designation=" ";
						$scope.gender="Choose Gender";
						$scope.mobile_number=" ";
						$scope.email="abc@xyz.com";
						$scope.address=" ";
						$scope.siteManager="Is SiteManager";
						$scope.all_site_of_org="Select Site";
						$scope.all_shift_of_site="Select Shift";
						$scope.get_emp_details(); 
						$scope.add_employee.$invalid=true;

						$scope.get_emp_details();
					} 
					else 
					{
						swal({
							  title: "Employee Not Added",
							  text: response.message,
							  type: "error",
							  timer: 3000,
							  showConfirmButton: false
							});
					}
				});
			});
		});
	};

	$scope.del_emp=function(index,key){
		swal({
			  title: "Are you sure?",
			  text: "You will not be able to recover!",
			  type: "warning",
			  showCancelButton: true,
			  confirmButtonColor: "#DD6B55",
			  confirmButtonText: "Yes, delete it!",
			  closeOnConfirm: false
			},
			function(){
				$scope.del_employee(index,key);				
			});
	}

	$scope.del_employee=function(index,key){
		gapi.client.employeeApi.remove({'token': sessionStorage.accessToken, 'emp_key':key}).execute(function(resp){
			$scope.$apply(function () {
				if(!resp.error)
				{
					$scope.employees.splice(index,1);
					swal("Deleted!", "Employee data has been deleted.", "success");
				}
				else
				{
					swal("Error!", "Employee could not be deleted. " + resp.message, "error");
				}
			});

		});
	}


	var emp_key="";
	$scope.manage_emp=function(emp){
		$scope.show_manage=false;
		$scope.show_update=true;
		$timeout(function () {
			$scope.u_employee_id=emp.employee_id;
			$scope.u_name=emp.name;
			$scope.u_designation=emp.designation;
			$scope.u_gender=emp.gender;
			$scope.u_mobile_number=emp.mobile_number;
			$scope.u_email=emp.email;
			$scope.u_address=emp.address;
			$scope.all_site_of_org=emp.siteName;			
			$scope.get_shift();
			$scope.all_shift_of_site=emp.shiftName;
			console.log(emp);
			$scope.u_SiteManager=(emp.siteManager).toString();
			if(emp.siteManager)
			{	
				$scope.get_managingsite();
				$scope.u_ManageSite_All=emp.managingSite;
				$('#u_ManageSite').attr("required", "true");
			}			
			else
			{
				$scope.u_ManageSite={ };			
				$('#u_ManageSite').removeAttr("required");
			}
			$scope.checkDisabled();

			emp_key=emp.websafeKey;

		},100);


	};

	$scope.go_manage=function(){
		$scope.show_manage=true;
		$scope.show_update=false;
	};

	$scope.updateemployee=function(){

		if (($scope.u_SiteManager).toString() == "false")
		{
			gapi.client.employeeApi.update({'token': sessionStorage.accessToken, 'emp_key':emp_key,'employee_id':$scope.u_employee_id, 'name': $scope.u_name, 'designation': $scope.u_designation, 'gender': $scope.u_gender, 'mobile_number': $scope.u_mobile_number, 'email': $scope.u_email, 'address': $scope.u_address, 'siteManager': $scope.u_SiteManager, 'shiftName': $scope.all_shift_of_site, 'siteName': $scope.all_site_of_org}).execute(function (response) {
				$scope.$apply(function () {
					if (!response.error) 
					{
						$scope.get_emp_details(); 
						$scope.show_manage=false;
						
						swal({
							  title: "Employee Updated Successfully",
							  type: "success",
							  timer: 3000,
							  showConfirmButton: false
							});
					} 
					else 
					{
						swal({
							  title: "Employee Not Updated",
							  type: "error",
							  timer: 3000,
							  showConfirmButton: false
							});
					}
				});
			});
		}

		else if (($scope.u_SiteManager).toString() == "true")
		{
			if ($scope.u_ManageSite_All != null)
			{
				gapi.client.employeeApi.update({'token': sessionStorage.accessToken, 'emp_key':emp_key,'employee_id':$scope.u_employee_id, 'name': $scope.u_name, 'designation': $scope.u_designation, 'gender': $scope.u_gender, 'mobile_number': $scope.u_mobile_number, 'email': $scope.u_email, 'address': $scope.u_address, 'siteManager': $scope.u_SiteManager, 'managingSite': $scope.u_ManageSite_All, 'shiftName': $scope.all_shift_of_site, 'siteName': $scope.all_site_of_org}).execute(function (response) {
					$scope.$apply(function () {
						if (!response.error) 
						{
							$scope.get_emp_details(); 
							$scope.show_manage=false;
							swal({
								  title: "Employee Updated Successfully",
								  type: "success",
								  timer: 3000,
								  showConfirmButton: false
								});
						} 
						else 
						{
							swal({
								  title: "Employee Not Updated",
								  type: "error",
								  timer: 3000,
								  showConfirmButton: false
								});
						}
					});
				});
			}
			else if ($scope.u_ManageSite_All == null)
			{
				swal({
					  title: "Employee Not Updated",
					  type: "error",
					  timer: 3000,
					  showConfirmButton: false
					});
			}

		}

	};
	NProgress.done();
}]);


app.controller("site_controller",['$scope','$timeout', function ($scope,$timeout) {
	NProgress.start();

	$scope.get_site_data=function(){

		$scope.show_manage=true;
		$scope.show_sites=true;
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function(response){
			$scope.$apply(function () {
				if(!response.error)
				{
					var org_key=response.websafeKey;

					gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key':org_key}).execute(function(response){
						$scope.$apply(function () {
							var data=[];
							if(!response.error)
							{  
								for(var i=0;i<response.items.length;i++)  
									data[i]=(response.items[i]);

								$scope.sites=data;
								pagination($scope.sites);
							}
						});
					});
				}
			});
		});
	};

	$scope.go_manage_show_site=function(){
		$scope.show_sites=true;
		$scope.show_emp_of_site=false;

	}

	$scope.see_details_of_site=function(site){
		$scope.show_sites=false;
		$scope.show_emp_of_site=true;


		gapi.client.employeeApi.employeelist({'token': sessionStorage.accessToken, 'site_key':site.websafeKey}).execute(function (response) {
			$scope.$apply(function () {
				if (!response.error) {
					if(response.items!=null)
					{
						$scope.employees = response.items;
						pagination($scope.employees);
					}else
					{
						$scope.employees=null;
					}
				}
			});
		});

	};


	$scope.del_site=function(index,key)
	{
		swal({
			  title: "Delete site not allowed",
			  text: "Please contact site ADMIN for further support",
			  timer: 3000,
			  showConfirmButton: false
			});
	}


	$scope.addsite=function(){
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) { //getting org_key from getAdminOrganisation() method of organisationApi
			var org_key = response.websafeKey;

			$scope.$apply(function () {
				if (!response.error) {  //Adding Site to the datastore
					gapi.client.siteApi.insert({'token': sessionStorage.accessToken, 'org_key': org_key, 'site_name': $scope.site_name, 'managerEmail': $scope.managerEmail, 'number_of_shifts': $scope.number_of_shifts, 'site_location': $scope.site_location, 'address': $scope.address, 'cityOrTown': $scope.cityOrTown }).execute(function (resp) 
					{
						$scope.$apply(function () 
							{
							if (!resp.error) 
							{
								var site_key = resp.websafeKey;
								var num_of_shift = resp.number_of_shifts;
								
								for (var i = 0; i < num_of_shift; i++) 
								{
									var shift_name=shift_d[i].shift_name;

									var time_from=shift_d[i].time_from;

									var date_f = new Date(time_from);
									var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
									var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
									var  time_f = hours_f + ":" + minutes_f;

									var time_to=shift_d[i].time_to;
									var date_t = new Date(time_to);
									var hours_t = date_f.getHours() < 10 ? "0" + date_t.getHours() : date_t.getHours();
									var minutes_t = date_f.getMinutes() < 10 ? "0" + date_t.getMinutes() : date_t.getMinutes();
									var  time_t = hours_t + ":" + minutes_t;

									console.log(time_t);
									
									gapi.client.shiftApi.insert({'token': sessionStorage.accessToken, 'site_key': site_key, 'name': shift_name, 'time_from': time_f, 'time_to': time_t }).execute(function (res) 
									{
										$scope.$apply(function () 
										{
											if(!res.error)
											{
												swal({
													  title: "Site & Shift Added Successfully",
													  type: "success",
													  timer: 3000,
													  showConfirmButton: false
													});
												console.log($scope.left_site);
												$scope.site_name=" ";
												$scope.site_location=" ";
												$scope.managerEmail="abc@xyz.com";
												$scope.address=" ";
												$scope.cityOrTown=" ";
												$scope.number_of_shifts="Select Number Of Shifts";
												$scope.add_shifts();
												$scope.get_site_data();
											}
											else
											{
												if(res.error)
												{
													swal({
														  title: "Shift Not Added",
														  text: res.message,
														  type: "error",
														  timer: 3000,
														  showConfirmButton: false
														});
													$scope.get_site_data();
												}												
											}
										});
									});
								}
							} 
							else
							{
								if(resp.error)
								{
									swal({
										  title: "Site & Shift Not Added",
										  text: resp.message,
										  type: "error",
										  timer: 3000,
										  showConfirmButton: false
										});
								}
								$scope.get_site_data();
							}

						});
					});

				}
			});

		});

	};
	
	var shift_d=[];
	$scope.add_shifts=function()
	{
		var shift=[];

		for(var i=0;i<$scope.number_of_shifts;i++)
		{
			shift[i]=[{ shift_name:"shift_name"+i,time_from:"time_from"+i,time_to:"time_to"+i}];

		}
		$scope.shifts=shift;
		shift_d=shift;
		console.log($scope.shifts);
	}
	
	
	var site_key="";
	$scope.manage_site=function(site)
	{
		$scope.show_manage=false;
		$scope.show_update=true;

		$timeout(function()
		{
			$scope.u_site_name=site.site_name;
			$scope.u_site_location=site.site_location;
			$("#u_number_of_shifts").val(site.number_of_shifts);
			$scope.u_managerEmail=site.managerEmail;
			$scope.u_address=site.address;
			$scope.u_cityorTown=site.cityOrTown;
			site_key=site.websafeKey;
		},100);
	};

	$scope.go_manage=function()
	{
		$scope.show_manage=true;
		$scope.show_update=false;
	};

	$scope.updatesite =function()
	{
		gapi.client.siteApi.update({'token': sessionStorage.accessToken, 'site_key':site_key, 'site_location':$scope.u_site_location,'site_name':$scope.u_site_name,'number_of_shifts':$scope.u_number_of_shifts,'cityorTown':$scope.u_cityorTown,'address':$scope.u_address,'managerEmail':$scope.u_managerEmail}).execute(function(resp){
			$scope.$apply(function () {
				if(resp.error)
				{
					var exception = resp.message;
					$scope.show_manage=false;
					$scope.get_site_data();
					swal({
						  title: "Site Not Updated",
						  text: exception,
						  type: "error",
						  timer: 3000,
						  showConfirmButton: false
						});
				}
				else
				{  
					$scope.show_manage=true;
					$scope.get_site_data();
					swal({
						  title: "Site Updated Successfully",
						  type: "success",
						  timer: 3000,
						  showConfirmButton: false
						});
				}				
			});
		});
	};

	var pagination=function(data){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil(data.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};
	}
	NProgress.done();
}]);


app.controller("shift_controller",['$scope','$timeout', function ($scope,$timeout) {
	NProgress.start();
	var data=[];
	var site_data=[];
	$scope.get_shift_data=function(){
		$scope.show_manage=true;
		$scope.show_shift=true;
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			var org_key = response.websafeKey;
			gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {

				if(!response.error)
				{
					var shift=[];
					var k=response.items.length;
					var o=0;

					for(var i=0;i<k;i++)
					{  
						data[i]=response.items[i];
						gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key':data[i].websafeKey}).execute(function(resp){
							$scope.$apply(function () {
								if(!resp.error)
								{  if(resp.items!=null)
									for(var j=0;j<resp.items.length;j++)
									{
										shift[o]=resp.items[j];
										o++;
									}

								$scope.shifts=shift;
								pagination($scope.shifts);
								}
							});
						});
					}



				}


			});
		});


		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var org_key = response.websafeKey;

				gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {
					$scope.$apply(function () {
						site_data=response.items;
						var get_site=[];
						if (!response.error) { 
							for(var i=0;i<response.items.length;i++){
								get_site[i]=(response.items[i].site_name);
							}
							$scope.all_site=get_site;
						}
					});
				});
			});
		});

	};

	$scope.addshift=function(){
		var site_websafekey="";
		var i=0;
		var key;
		for(i=0;i<data.length;i++)
		{
			if(data[i].site_name==$scope.all_site_of_org)
			{
				site_websafekey=site_data[i].websafeKey;
				break;
			}

		}

		var date_f = new Date($scope.time_from);
		var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
		var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
		var  time_fs = hours_f + ":" + minutes_f;


		var date_f = new Date($scope.time_to);
		var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
		var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
		var  time_ts = hours_f + ":" + minutes_f;


		gapi.client.shiftApi.insert({'token': sessionStorage.accessToken, 'site_key':site_websafekey,'name':$scope.shift_name,'time_from':time_fs,'time_to':time_ts}).execute(function(resp){
			$scope.$apply(function () 
			{
				var exception="";
				if(resp.error)
				{
					if (resp.code==400)
					{
						exception = resp.message;
					}
					$scope.get_shift_data(); 
					$scope.show_manage=false;
					swal({
						  title: "Shift Not Added",
						  text: exception,
						  type: "error",
						  timer: 3000,
						  showConfirmButton: false
						});
				}
				else
				{
					swal({
						  title: "Shift Added Successfully",
						  type: "success",
						  timer: 3000,
						  showConfirmButton: false
						});
					$scope.get_shift_data();
					$scope.show_manage=true;
				}

			});
		});
	};

	var shift_key="",time_t="", time_f="";
	$scope.manageshift=function(shift){
		$scope.show_manage=false;
		$scope.show_update=true;
		$timeout(function(){

			$scope.u_shift_name=shift.name;			
			$scope.all_site_of_org=shift.siteName;			
			console.log(shift.time_from);
			var time_f=shift.time_from;
			var time_f_array=time_f.split(':');

			var time_t=shift.time_to;
			var time_t_array=time_t.split(':');



			$scope.u_time_from=new Date(1970, 0, 1, time_f_array[0], time_f_array[1], 0);
			console.log($scope.u_time_from);
			$scope.u_time_to=new Date(1970, 0, 1, time_t_array[0], time_t_array[1], 0);
			console.log($scope.u_time_to);

			shift_key=shift.websafeKey;

		},100);

	};

	$scope.go_manage=function(){
		$scope.show_manage=true;
		$scope.show_update=false;
	};

	$scope.updateshift=function(){


		var date_f = new Date($scope.u_time_from);
		var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
		var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
		var  time_fs = hours_f + ":" + minutes_f;


		var date_f = new Date($scope.u_time_to);
		var hours_f = date_f.getHours() < 10 ? "0" + date_f.getHours() : date_f.getHours();
		var minutes_f = date_f.getMinutes() < 10 ? "0" + date_f.getMinutes() : date_f.getMinutes();
		var  time_ts = hours_f + ":" + minutes_f;

		gapi.client.shiftApi.update({'token': sessionStorage.accessToken, 'shift_key':shift_key,'name':$scope.u_shift_name,'time_from':time_fs,'time_to':time_ts}).execute(function(resp){
			$scope.$apply(function () 
			{
				var exception="";
				if(resp.error)
				{
					if (resp.code==400)
					{
						exception = resp.message;
					}
					$scope.show_manage=false;
					$scope.get_shift_data();
					swal({
						  title: "Shift Not Updated",
						  text: exception,
						  type: "error",
						  timer: 3000,
						  showConfirmButton: false
						});
				}else
				{
					swal({
						  title: "Shift Updated Successfully",
						  type: "success",
						  timer: 3000,
						  showConfirmButton: false
						});
					$scope.get_shift_data();
					$scope.show_manage=true;
				}
			});
		});
	};

	$scope.go_manage_show_shift=function(){
		$scope.show_shift=true;
		$scope.show_emp_of_shift=false;

	}


	$scope.see_details_of_shift=function(shift){
		$scope.show_shift=false;
		$scope.show_emp_of_shift=true;


		gapi.client.employeeApi.employeelist({'token': sessionStorage.accessToken, 'shift_key':shift.websafeKey}).execute(function (response) {
			$scope.$apply(function () {
				if (!response.error) {
					if(response.items!=null)
					{
						$scope.employees = response.items;
						pagination($scope.employees);
					}else
					{
						$scope.employees=null;
					}
				}
			});
		});

	};

	$scope.delete_shift=function(index,key)
	{
		swal({
			  title: "Delete shift not allowed",
			  text: "Please add new shift if required",
			  timer: 3000,
			  showConfirmButton: false
			});
	};

	var pagination=function(data){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil(data.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};

	} 
	NProgress.done();
}]);


app.controller("attendance_details_controller", function ($scope) {
	NProgress.start();
	var data=[];
	var emp=[];
	$scope.get_attendance=function(){

		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var orgkey = response.websafeKey;

				gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': orgkey }).execute(function (resp) {
					$scope.$apply(function () {
						if (!resp.error) {

							if(resp.items!=null)
								for(var i=0;i<resp.items.length;i++)
								{ 
									get_attendance_of_emp(resp.items[i].websafeKey,resp.items[i],emp);
								}


						}
					});
				});
			});
		});	


		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			var org_key = response.websafeKey;
			gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {

				if(!response.error)
				{
					var k=response.items.length;
					var o=0;
					if(response.items!=null)
					{	
						for(var i=0;i<k;i++)
						{  
							data[i]=response.items[i];
							get_site_attendance_details(data[i].websafeKey,data[i],data);
							get_shift_details(data[i].websafeKey);
						}
					}
				}
			});
		});

	};

	var r=0;
	function get_attendance_of_emp(key, item,emp){
		var today = new Date();
		var dd = today.getDate(); 
		var yyyy = today.getFullYear();
		var mm=today.getMonth()+1;
		if(dd<10) {
			dd='0'+dd
		} 

		if(mm<10) {
			mm='0'+mm
		} 
		today = yyyy+'-'+mm+'-'+dd;

		gapi.client.attendanceApi.getAttendanceBySite({'token': sessionStorage.accessToken, 'site_key':key,'date':today}).execute(function(resp){
			$scope.$apply(function () {
				if(!resp.error)
				{     
					for(var h=0;h<resp.items.length;h++)
					{ 
						if(resp.items[h].absent!=null)
						{
							for(var l=0;l<resp.items[h].absent.length;l++)
							{
								emp[r]=resp.items[h].absent[l];
								angular.extend(emp[r],{"attendance_detail":"Absent"});
								r++;
							}
						}else if(resp.items[h].late!=null)
						{
							for(var l=0;l<resp.items[h].late.length;l++)
							{
								emp[r]=resp.items[h].late[l];

								angular.extend(emp[r],{"attendance_detail":"Late"});
								r++;
							}
						}else if(resp.items[h].ontime!=null)
						{
							for(var l=0;l<resp.items[h].ontime.length;l++)
							{
								emp[r]=resp.items[h].ontime[l];

								angular.extend(emp[r],{"attendance_detail":"Ontime"});
								r++;
							}
						}
					}
					$scope.attendance_details_of_emp=emp;
					console.log(emp);
					pagination($scope.attendance_details_of_emp);

				}
			});

		});


	};




	function get_site_attendance_details(key,item,data){
		var today = new Date();
		var dd = today.getDate(); 
		var yyyy = today.getFullYear();
		var mm=today.getMonth()+1;
		if(dd<10) {
			dd='0'+dd
		} 

		if(mm<10) {
			mm='0'+mm
		} 
		var present=0,no_of_emp=0,absent=0,late=0;
		today = yyyy+'-'+mm+'-'+dd;

		gapi.client.attendanceApi.getAttendanceBySite({'token': sessionStorage.accessToken, 'site_key':key,'date':today}).execute(function(resp){
			$scope.$apply(function () {
				if(!resp.error)
				{     for(var h=0;h<resp.items.length;h++)
				{ if(resp.items[h].absent!=null)
				{
					absent=absent+ resp.items[h].absent.length;

					no_of_emp=no_of_emp+resp.items[h].absent.length;
				}
				if(resp.items[h].late!=null)
				{
					late=late+ resp.items[h].late.length;

					no_of_emp=no_of_emp+resp.items[h].late.length;

				}
				if(resp.items[h].ontime!=null)
				{
					present=present+ resp.items[h].ontime.length;
					no_of_emp=no_of_emp+resp.items[h].ontime.length;

				}
				}
				angular.extend(item,{'no_of_present_today_emp':present});
				angular.extend(item,{'no_of_emp':no_of_emp});
				angular.extend(item,{'no_of_late_today_emp':late});
				angular.extend(item,{'no_of_absent_today_emp':absent});

				$scope.attendance_details_of_site=data;
				console.log(data);
				pagination($scope.attendance_details_of_site);
				}
			});
		});
	};







	var get_shift=[];
	var p=0;
	function get_shift_details(key){


		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key': key}).execute(function (response) {
			$scope.$apply(function () {


				if (!response.error) {
					if(response.items!=null)
						for(var i=0;i<response.items.length;i++){
							get_shift[p]=(response.items[i]);
							get_shift_attendance_details(get_shift[p].websafeKey,get_shift[p],get_shift);
							p++;

						}


				}
			});
		});



	};

	function get_shift_attendance_details(key,shift_item,get_shift){
		var today = new Date();
		var dd = today.getDate(); 
		var yyyy = today.getFullYear();
		var mm=today.getMonth()+1;
		if(dd<10) {
			dd='0'+dd
		} 

		if(mm<10) {
			mm='0'+mm
		} 
		var present=0,no_of_emp=0,absent=0,late=0;
		today = yyyy+'-'+mm+'-'+dd;


		gapi.client.attendanceApi.getAttendanceByShift({'token': sessionStorage.accessToken, 'shift_key':key,'date':today}).execute(function(resp){
			$scope.$apply(function () {
				if(!resp.error)
				{    	  if(resp.absent!=null)
				{
					no_of_emp=no_of_emp+resp.absent.length;
					absent=absent+resp.absent.length;
				}
				if(resp.late!=null)
				{
					no_of_emp=no_of_emp+resp.late.length;
					late=late+resp.late.length;
				}
				if(resp.ontime!=null)
				{
					present=present+ resp.ontime.length;
					no_of_emp=no_of_emp+resp.ontime.length;

				}

				angular.extend(shift_item,{'no_of_present_today_emp':present});
				angular.extend(shift_item,{'no_of_emp':no_of_emp});
				angular.extend(shift_item,{'no_of_late_today_emp':late});
				angular.extend(shift_item,{'no_of_absent_today_emp':absent});

				$scope.attendance_details_of_shift=get_shift;
				pagination($scope.attendance_details_of_shift);
				}
			});
		});

	};


	var pagination=function(detail){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil(detail.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};

	}    		

	NProgress.done();
});


app.controller("attendance_report_controller", function ($scope) {
	NProgress.start();
	var data=[];

	$scope.get_report_data=function(){

		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var org_key = response.websafeKey;

				gapi.client.organisationApi.getAllSites({'token': sessionStorage.accessToken, 'org_key': org_key }).execute(function (response) {
					$scope.$apply(function () {
						data=response.items;
						var get_site=[];
						if (!response.error) {
							if(response.items!=null)
								for(var i=0;i<response.items.length;i++){
									get_site[i]=(response.items[i].site_name);
								}
							$scope.all_site=get_site;


						}
					});
				});
			});
		});
	};

	$scope.show_report1=function(){

		$scope.site_atten_show=true;
		$scope.shifts_atten_show=true;
		var i=0;
		var key="";
		for(i=0;i<data.length;i++)
		{
			if(data[i].site_name==$scope.all_site_of_org)
			{
				key=data[i].websafeKey;
				break;
			}

		}

		var from_date=new Date($scope.date_from);
		var dd = from_date.getDate(); 
		var yyyy = from_date.getFullYear();
		var mm=from_date.getMonth()+1;
		if(dd<10) {
			dd='0'+dd;
		} 

		if(mm<10) {
			mm='0'+mm;
		} 
		from_date = yyyy+'-'+mm+'-'+dd;
		console.log(from_date);
		var to_date=new Date($scope.date_to);
		var dd_t = to_date.getDate(); 
		var yyyy_t = to_date.getFullYear();
		var mm_t=to_date.getMonth()+1;
		if(dd_t<10) {
			dd_t='0'+dd_t;
		} 

		if(mm_t<10) {
			mm_t='0'+mm_t;
		} 
		to_date = yyyy_t+'-'+mm_t+'-'+dd_t;
		var get_shift_chart=[],h=0;
		var y_no_of_absent_emp=0,y_no_of_ontime_emp=0,y_no_of_late_emp=0;

		console.log(key);
		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key': key}).execute(function (response) {
			$scope.$apply(function () {

				if (!response.error) {
					for(var i=0;i<response.items.length;i++){
						var shift_key=response.items[i].websafeKey;
						console.log(response.items[i]);
						gapi.client.attendanceApi.getAttendanceByShift({'token': sessionStorage.accessToken, 'shift_key':shift_key,'From_date':from_date,'To_date':to_date}).execute(function(resp){
							$scope.$apply(function () {
								if(!resp.error)

								{   
									var get_shift_chart_details={};  
									var no_of_absent_emp=0,no_of_late_emp=0,no_of_ontime_emp=0;

									if(resp.absent!=null)
									{
										no_of_absent_emp=resp.absent.length;
										y_no_of_absent_emp+=no_of_absent_emp;
										angular.extend(get_shift_chart_details,{'no_of_absent_emp':no_of_absent_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});

									}
									if(resp.late!=null)
									{
										no_of_late_emp=resp.late.length;
										angular.extend(get_shift_chart_details,{'no_of_late_emp':no_of_late_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});
										y_no_of_late_emp+=no_of_late_emp;
									}
									if(resp.ontime!=null)
									{
										no_of_ontime_emp=resp.ontime.length;
										angular.extend(get_shift_chart_details,{'no_of_ontime_emp':no_of_ontime_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});
										y_no_of_ontime_emp+=no_of_ontime_emp;
									}
									get_shift_chart[h]=get_shift_chart_details
									h++;
									$scope.shift_charts=get_shift_chart;
									console.log($scope.shift_charts);
									site_chart(no_of_ontime_emp,no_of_late_emp,no_of_absent_emp,i,resp.shiftName);
									y_get_chart(y_no_of_absent_emp,y_no_of_ontime_emp,y_no_of_late_emp);
								}
							});
						});

					}


				}
			});
		});






	};

	var e=0;
	function site_chart(no_of_ontime_emp,no_of_late_emp,no_of_absent_emp,i,shiftName){
		var chart = {};
		chart.type = "PieChart";
		chart.cssStyle = "height:400px; width:500px;";
		chart.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: no_of_ontime_emp}
					]},
					{c: [
						{v: "Absent"},
						{v: no_of_absent_emp}
						]},
						{c: [
							{v: "Late"},
							{v: no_of_late_emp}

							]}
						]};

		chart.options = {
				"title": shiftName+" Attendance Activity",
				"isStacked": "true",
				"fill": 20,
				"displayExactValues": true,
				"vAxis": {
					"title": "Number Of Employees", "gridlines": {"count": 6}
				},
				"hAxis": {
					"title": $scope.date_from+"  to "+$scope.date_to 
				}
		};

		chart.formatters = {};
		e++;
		if(e>i)
		{
			e=1;
		}
		var chart_name="charts"+e; 
		console.log(chart_name);
		$scope[chart_name] = chart;
	}

	function y_get_chart(y_no_of_absent_emp,y_no_of_ontime_emp,y_no_of_late_emp){
		var chart2 = {};
		chart2.type = "PieChart";
		chart2.cssStyle = "height:400px; width:500px;";
		chart2.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: y_no_of_ontime_emp}
					]},
					{c: [
						{v: "Absent"},
						{v: y_no_of_absent_emp}
						]},
						{c: [
							{v: "Late"},
							{v: y_no_of_late_emp}

							]}
						]};

		chart2.options = {
				"title": $scope.all_site_of_org+" Attendance Activity",
				"isStacked": "true",
				"fill": 20,
				"displayExactValues": true,
				"vAxis": {
					"title": "Number Of Employees", "gridlines": {"count": 6}
				},
				"hAxis": {
					"title": $scope.date_from+"  to "+$scope.date_to
				}
		};

		chart2.formatters = {};

		$scope.charts = chart2;

	}




	$scope.show_report2=function(){
		$scope.site_atten_show2=true;
		$scope.shifts_atten_show2=true;

		var i=0;
		var key="";
		for(i=0;i<data.length;i++)
		{
			if(data[i].site_name==$scope.all_site_of_org)
			{
				key=data[i].websafeKey;
				break;
			}

		}

		var date=new Date($scope.date);
		var dd = date.getDate(); 
		var yyyy = date.getFullYear();
		var mm=date.getMonth()+1;
		if(dd<10) {
			dd='0'+dd;
		} 

		if(mm<10) {
			mm='0'+mm;
		} 
		date = yyyy+'-'+mm+'-'+dd;

		var get_shift_chart=[],h=0;
		var y_no_of_absent_emp_d=0,y_no_of_ontime_emp_d=0,y_no_of_late_emp_d=0;

		console.log(key);
		gapi.client.shiftApi.getShiftBySite({'token': sessionStorage.accessToken, 'site_key': key}).execute(function (response) {
			$scope.$apply(function () {

				if (!response.error) {
					for(var i=0;i<response.items.length;i++){
						var shift_key=response.items[i].websafeKey;
						console.log(response.items[i]);
						gapi.client.attendanceApi.getAttendanceByShift({'token': sessionStorage.accessToken, 'shift_key':shift_key,'date':date}).execute(function(resp){
							$scope.$apply(function () {
								if(!resp.error)

								{   
									var get_shift_chart_details={};  
									var no_of_absent_emp=0,no_of_late_emp=0,no_of_ontime_emp=0;

									if(resp.absent!=null)
									{
										no_of_absent_emp=resp.absent.length;
										y_no_of_absent_emp_d+=no_of_absent_emp;
										angular.extend(get_shift_chart_details,{'no_of_absent_emp':no_of_absent_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});

									}
									if(resp.late!=null)
									{
										no_of_late_emp=resp.late.length;
										angular.extend(get_shift_chart_details,{'no_of_late_emp':no_of_late_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});
										y_no_of_late_emp_d+=no_of_late_emp;
									}
									if(resp.ontime!=null)
									{
										no_of_ontime_emp=resp.ontime.length;
										angular.extend(get_shift_chart_details,{'no_of_ontime_emp':no_of_ontime_emp});
										angular.extend(get_shift_chart_details,{'shift_name':resp.shiftName});
										y_no_of_ontime_emp_d+=no_of_ontime_emp;
									}
									get_shift_chart[h]=get_shift_chart_details
									h++;
									$scope.shift_date_chart=get_shift_chart;
									site_date_chart(no_of_ontime_emp,no_of_late_emp,no_of_absent_emp,i,resp.shiftName);
									y_get_chart_d(y_no_of_absent_emp_d,y_no_of_late_emp_d,y_no_of_ontime_emp_d);
								}
							});
						});

					}


				}
			});
		});






	};

	var f=0;
	function site_date_chart(no_of_ontime_emp,no_of_late_emp,no_of_absent_emp,i,shiftName){
		var chart = {};
		chart.type = "PieChart";
		chart.cssStyle = "height:400px; width:500px;";
		chart.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: no_of_ontime_emp}
					]},
					{c: [
						{v: "Absent"},
						{v: no_of_absent_emp}
						]},
						{c: [
							{v: "Late"},
							{v: no_of_late_emp}

							]}
						]};

		chart.options = {
				"title": shiftName+" Attendance Activity",
				"isStacked": "true",
				"fill": 20,
				"displayExactValues": true,
				"vAxis": {
					"title": "Number Of Employees", "gridlines": {"count": 6}
				},
				"hAxis": {
					"title": $scope.date_from+"  to "+$scope.date_to 
				}
		};

		chart.formatters = {};
		f++;
		if(f>i)
		{
			f=1;
		}
		var chart_name="charts_d"+f; 
		console.log(chart_name);
		$scope[chart_name] = chart;
	}

	function y_get_chart_d(y_no_of_absent_emp_d,y_no_of_late_emp_d,y_no_of_ontime_emp_d){
		var chart2 = {};
		chart2.type = "PieChart";
		chart2.cssStyle = "height:400px; width:500px;";
		chart2.data = {"cols": [
			{id: "Attendance", label: "Attendance", type: "string"},
			{id: "no_of_emp", label: "Number Of Employees", type: "number"}

			], "rows": [
				{c: [
					{v: "Ontime"},
					{v: y_no_of_ontime_emp_d}
					]},
					{c: [
						{v: "Absent"},
						{v: y_no_of_absent_emp_d}
						]},
						{c: [
							{v: "Late"},
							{v: y_no_of_late_emp_d}

							]}
						]};

		chart2.options = {
				"title": $scope.all_site_of_org+" Attendance Activity",
				"isStacked": "true",
				"fill": 20,
				"displayExactValues": true,
				"vAxis": {
					"title": "Number Of Employees", "gridlines": {"count": 6}
				},
				"hAxis": {
					"title": $scope.date
				}
		};

		chart2.formatters = {};

		$scope.charts_d = chart2;

	}


	NProgress.done();


});


app.controller("sitemanager_controller", function ($scope) {
	NProgress.start();

	$scope.get_site_manager_details=function(){
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			$scope.$apply(function () {
				var orgkey = response.websafeKey;
				var site_manager=[],j=0;
				gapi.client.employeeApi.employeelist({'token': sessionStorage.accessToken, 'org_key':orgkey}).execute(function (response) {
					$scope.$apply(function () {
						if (!response.error) {
							if(response.items!=null)
							{
								for(var i=0;i<response.items.length;i++)
								{
									if(response.items[i].siteManager){
										site_manager[j] = response.items[i];
										j++;
									}
									$scope.employees=site_manager;
									pagination();
								}
							}
						}
					});
				});
			});
		});
	}

	var pagination=function(){
		/**
		 * Namespace for the pagination.
		 * @type {{}|*}
		 */
		$scope.pagination = $scope.pagination || {};
		$scope.pagination.currentPage = 0;
		$scope.pagination.pageSize = 10;
		/**
		 * Returns the number of the pages in the pagination.
		 *
		 * @returns {number}
		 */
		$scope.pagination.numberOfPages = function () {
			return Math.ceil($scope.employees.length / $scope.pagination.pageSize);
		};

		/**
		 * Returns an array including the numbers from 1 to the number of the pages.
		 *
		 * @returns {Array}
		 */
		$scope.pagination.pageArray = function () {
			var pages = [];
			var numberOfPages = $scope.pagination.numberOfPages();
			for (var i = 0; i < numberOfPages; i++) {
				pages.push(i);
			}
			return pages;
		};
	}
	NProgress.done();

});