var v = $("#details_form").validate({
	rules: {

		site_name: {
			required: true
		},
		site_manager_email: {
			required: true,
			email:true
		},
		site_no_of_shifts: {
			required: true,
			number:true
		},
		site_location: {
			required: true
		},
		site_address: {
			required: true
		},
		site_city_town: {
			required: true
		},
		mobileNummber: {
			required: true,
			number: true,
			maxlength: 10,
			minlength: 10
		},
		org_name: {
			required: true
		},
		org_location: {
			required: true
		},
		org_city: {
			required: true
		},
		org_number_of_Sites: {
			required: true
		},
		mobile_number:{
			required: true,
			number: true,
			maxlength: 10,
			minlength: 10
		},
		mobilenumber:{
			required: true,
			number: true,
			maxlength: 10,
			minlength: 10
		},
		card_holder_name:{
			required:true
		},

		card_number: {
			required: true
		},

		expiry_month: {
			required: true
		},

		expiry_year: {
			required: true
		},

		cvv: {
			required: true
		}


	}

});


function onSignIn(googleUser) {

	var profile = googleUser.getBasicProfile();
	var id_token = googleUser.getAuthResponse().id_token;

	if (id_token != null)
	{
		$("#signout").addClass("show");
		$("#signin").addClass("hide");
		Register(profile, id_token);
	}    
}

function Register(profile, id_token) 
{		
	gapi.client.accountsApi.getToken().execute(function(response)
	{
		if(response.token!=null)
		{
	        sessionStorage.accessToken = response.token;
	        console.log('TOKEN: ' + response.token);
	        
	        gapi.client.accountsApi.get({'token': sessionStorage.accessToken}).execute(function(response)
			{
	        	if (response.error)
        		{
        			if (response.code==404)
        			{
        				gapi.client.accountsApi.insert({ 'status': 'REGISTERED', 'email': profile.getEmail(), 'name': profile.getName() }).execute(function (response) 
						{
							console.log(response.code);
							console.log(response.error);
							if (response.error) 
							{
								if (response.code == 401) 
								{
									$("#googlesignin").modal("toggle");
								}
							} 
							else 
							{
								$("#registered_success").addClass("show");
							}
						});
        			}
        		}
	        	else if (!response.code)
        		{		  
    				var status=response.status;
    				var key=response.websafeKey;
    				
    				if(status=="ACTIVE")
					{
						gapi.client.accountsApi.update({ 'account_key': key, 'token': sessionStorage.accessToken, 'name': profile.getName(), 'email': response.email, 'mobileNumber': response.mobileNumber, 'plans':response.plans, 'status':'ACTIVE' }).execute(function (response) {
							console.log(response);
							if (response.error) 
							{
								console.log(response.error);
								if (response.code == 401)
								{
									$("#googlesignin").modal("toggle");
								}
							}
							else
							{
								$("#register_error_exist").addClass("show").text("Please wait, you will be automatically redirected to the Dashboard");
								$("#choosing_trial").addClass("hide");
								window.location.replace(deployUrl.url + '/Dashboard/dashboard.html');
							}
		
						});
		
					}
					else if(status=="TRIAL_STARTED")
					{
						gapi.client.accountsApi.update({ 'account_key': key, 'token': sessionStorage.accessToken,'name': profile.getName(), 'email': response.email, 'mobileNumber': response.mobileNumber, 'plans':response.plans, 'status':'TRIAL_STARTED' }).execute(function (response) {
							console.log(response);
							if (response.error) 
							{
								console.log(response.error);
								if (response.code == 401) 
								{
									$("#googlesignin").modal("toggle");
								}
							}
							else
							{
								$("#register_error_exist").addClass("show").text("Your Trial Period is already Started, You will be automatically redirected to the Dashboard");
								$("#choosing_trial").addClass("hide");
								window.location.replace(deployUrl.url + '/Dashboard/dashboard.html');
							}
						});
					}
					else if(status=="REGISTERED")
					{
						$("#register_error_exist").addClass("show").append(" <a id=\"start_trial_go\" class=\"btn btn-primary\" href=\"#\" onclick=\"go_to_trial()\"><span class=\"glyphicon glyphicon-level-up\">&nbsp;</span>Start Trial</a> ");
					}
        		}
			});
		}
	});

}

function signOut() {
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.disconnect().then(function () {
		$("#signout").removeClass("show");
		$("#signin").removeClass("hide");
		$("#register_error_exist").removeClass("show");
		$("#registered_success").removeClass("show");
		$("#start_trial_go").remove();
	});
}

/*
 * function evaluateUser() {
 * gapi.client.accountsApi.get().execute(function(response){ var
 * status=response.status; if (status == 'ACTIVE' || status == 'TRIAL_STARTED') {
 * document.getElementById("dashboard_btn_xl").href="Dashboard/dashboard.html"; }
 * else { alert("Please Buy a Plan or Start Trial to access DASHBOARD"); return
 * false; } }); }
 */

function check_login_and_plan() {
	var auth2 = gapi.auth2.getAuthInstance();
	googleUser = auth2.currentUser.get();
	if (googleUser.getAuthResponse().id_token == null) {
		$("#googlesignin").modal("toggle");



	} else {
		$("#buy_plan").addClass("show");
		$("#trial_version").removeClass("show");

		$("#bd-example-modal-lg").modal("toggle");


	}
}

// checking if user is not login so he/she will not able to buy now or start
// trial
function check_login_and_trial() {
	var auth2 = gapi.auth2.getAuthInstance();
	googleUser = auth2.currentUser.get();
	if (googleUser.getAuthResponse().id_token == null) {
		$("#googlesignin").modal("toggle");



	} else {
		$("#trial_version").addClass("show");
		$("#buy_plan").removeClass("show");
		$("#bd-example-modal-lg").modal("toggle");


	}
}


function go_to_trial()
{
	$("#googlesignin").modal("toggle");
	setTimeout(function(){
		$("#trial_version").addClass("show");
		$("#buy_plan").removeClass("show");
		$("#bd-example-modal-lg").modal("toggle");
	},1000);
}

// !checking if user is not login so he/she will not able to buy now or start
// trial

function choosed_trial() {

	if (v.form()) 
	{
		var $this = $("#load");
		$this.button('loading');
		setTimeout(function () 
		{
			$this.button('reset');
		}, 5000);
		gapi.client.accountsApi.get({'token': sessionStorage.accessToken}).execute(function (response) 
		{
			var key = response.websafeKey;
			if (!response.error) 
			{
				window.onbeforeunload = function() { return "Your work will be lost"; };
				gapi.client.accountsApi.update({ 'token': sessionStorage.accessToken, 'status': 'TRIAL_STARTED', 'account_key': key, 'email': response.email, 'mobileNumber': $("#mobileNumber").val() }).execute(function (response) 
				{
					if (response.error) 
					{
						console.log(response.error);
						if (response.code == 401) 
						{
							$("#googlesignin").modal("toggle");
						}
					} 
					else 
					{
						var parent_fieldset = $(".skip_payment").parents('fieldset');
						var skip_pay = true;
						// navigation steps / progress steps
						var current_active_step = $(".skip_payment").parents('.f1').find('.f1-step.active');
						var progress_line = $(".skip_payment").parents('.f1').find('.f1-progress-line');
						console.log(skip_pay);
						if (skip_pay) 
						{
							parent_fieldset.fadeOut(400, function () 
							{
								// change icons
								current_active_step.removeClass('active').addClass('activated').next().addClass('activated').next().addClass("active");
								// progress bar
								bar_progress(progress_line, 'skip-payment');
								// show next step
								parent_fieldset.next().next().fadeIn();
								// scroll window to beginning of the form
								scroll_to_class($('.f1'), 20);
							});
						}
					}
				});
			}
			else 
			{
				if (response.code == 409) 
				{
					$("#googlesignin").modal("toggle");
				}
			}
		});
	}
}


function add_org_details() {
	if (v.form()) {
		var $this = $("#add_org_process");
		$this.prop('disabled', 'true');
		gapi.client.organisationApi.insert({ 'token': sessionStorage.accessToken, 'name': $("#org_name").val(), 'location': $("#org_location").val(), 'city': $("#org_city").val() }).execute(function (response) {
			if (response.error) {
				console.log(response.error);
				if (response.code == 401) {
					$("#googlesignin").modal("toggle");
				}
			} else {
				num_of_site = $("#org_number_of_Sites").val()
				$("#org_success").addClass("show");
				$("#org_buttons").addClass("show");
			}
		});
	}
}


// adding site and shift details to the datastore
var initial = 1;
var num_of_site = 0;

function add_site_shift() {
	if (v.form()) {
		//getting org_key from getAdminOrganisation() method of organisationApi
		gapi.client.organisationApi.getAdminOrganisation({'token': sessionStorage.accessToken}).execute(function (response) {
			var org_key = response.websafeKey;
			if (!response.error) {  // Adding Site to the datastore
				gapi.client.siteApi.insert({ 'token': sessionStorage.accessToken, 'org_key': org_key, 'site_name': $("#site_name").val(), 'managerEmail': $("#site_manager_email").val(), 'number_of_shifts': $("#site_no_of_shifts option:selected").val(), 'site_location': $("#site_location").val(), 'address': $("#site_address").val(), 'cityOrTown': $("#site_city_town").val() }).execute(function (response) {
					if (!response.error) {
						var site_key = response.websafeKey;
						var num_of_shift = response.number_of_shifts;
						$("#site_shift_success").text("Site " + initial + " is added Sucessfully").addClass("show");
						initial++;
						for (var i = 1; i <= num_of_shift; i++) {
							gapi.client.shiftApi.insert({ 'token': sessionStorage.accessToken, 'site_key': site_key, 'name': $("#shift_name" + i).val(), 'time_from': $("#time_from" + i).val(), 'time_to': $("#time_to" + i).val() }).execute(function (response) {
								if (response.error) {
									if (response.code == 401) {
										$("#googlesignin").modal("toggle");
									}
								}
							});
						}
						if (initial > num_of_site) {
							gapi.client.accountsApi.get({'token': sessionStorage.accessToken}).execute(function (response) {
								var key = response.websafeKey;
								if (!response.error) {
									gapi.client.accountsApi.update({ 'token': sessionStorage.accessToken, 'account_key': key, 'email': response.email, 'mobileNumber': response.mobileNumber, 'plans': response.plans,'status': 'ACTIVE' }).execute(function (response) {

										if (response.error) {
											console.log(response.error);
											if (response.code == 401) {
												$("#googlesignin").modal("toggle");
											}
										} else {
											$("#add_site-shift").addClass("hide");
											$("#completed_form").addClass("show");
											window.location.replace(deployUrl.url + '/Dashboard/dashboard.html');
										}
									});
								}
							});
						} else {

							$("#site_name").val("");
							$("#site_manager_email").val("");
							$("#site_no_of_shifts").val("0").change();
							$("#site_location").val("");
							$("#site_address").val("");
							$("#site_city_town").val("");
							$("#shift_name" + i).val("");
							$("#time_from" + i).val("");
							$("#time_to" + i).val("");
							$("#site_form").text("Site " + initial);
						}
					} else {

						if (response.code == 401) {
							$("#googlesignin").modal("toggle");
						}
					}
				});
			} else {
				if (response.code == 401) {
					$("#googlesignin").modal("toggle");
				}
			}
		});
	} 
}


// select number of shifts
$('#site_no_of_shifts').change(function () {
	$("#shift_details").addClass("show");
	var sel_value = $('#site_no_of_shifts option:selected').val();

	console.log(sel_value);
	if (sel_value == 0) {
		$("#shift_details").removeClass("show");
		$("#shift_details").empty(); // Resetting Form
		$("#shift_details").css({
			'display': 'none'
		});
	} else {
		$("#shift_details").empty(); // Resetting Form
		// Below Function Creates Input Fields Dynamically
		create(sel_value);

	}
});
function create(sel_value) {
	for (var i = 1; i <= sel_value; i++) {
		$("div#shift_details").slideDown('slow');
		$("div#shift_details").append($("#shift_details").append($("<div/>", {
			id: 'head',
			class: 'row'
		}).append($("<h3/>").text("Class " + i + " Details")), $("<div/>", { class: 'row form-group'


		}).append($("<label/>", {
			text: 'Class Name',
			class: 'col-md-3 control-label'

		}), $("<input/>", {
			type: 'text',
			placeholder: 'Class Name',
			id: 'shift_name' + i,
			required: "required",
			class: 'col-md-9 form-control'
		})), $("<br/>"), $("<div/>", { class: 'row form-group'


		}).append($("<label/>", {
			text: 'Time from',
			class: 'col-md-3 control-label'

		}), $("<input/>", {
			type: 'time',
			placeholder: 'Time From',
			id: 'time_from' + i,
			required: "required",
			class: 'col-md-9 form-control'
		})), $("<br/>"), $("<div/>", { class: 'row form-group'


		}).append($("<label/>", {
			text: 'Time to',
			class: 'col-md-3 control-label'

		}), $("<input/>", {
			placeholder: 'Time To',
			type: 'time',
			id: 'time_to' + i,
			required: "required",
			class: 'col-md-9 form-control'
		})), $("<hr/>")))
	}
}
// !select shift


// Choosing plan
$("input[type='radio']").change(function () {

	$("#plan_ticked").addClass("show");


});

function choosed_plan(){
	var price = $("input[type='radio']:checked").val();
	console.log($("#mobile_number").val());
	if (v.form()){
		gapi.client.accountsApi.get({'token': sessionStorage.accessToken}).execute(function (response) {
			var key = response.websafeKey;
			if (!response.error) {
				gapi.client.accountsApi.update({ 'token': sessionStorage.accessToken, 'account_key': key, 'email': response.email, 'mobileNumber': $("#mobile_number").val(), 'plans':{'name':'plan'+price,'price':price,'validity':'1 month'}, 'status':'REGISTERED' }).execute(function (response) {
					console.log(response);
					if (response.error) {
						console.log(response.error);
						if (response.code == 401) {
							$("#googlesignin").modal("toggle");
						}

					}

				});

			}
		});


	}
}


// !choosing Plan

// payment Doing

function payment_doing() {

	if (v.form()) {
		gapi.client.accountsApi.get({'token': sessionStorage.accessToken}).execute(function (response) {
			var key = response.websafeKey;
			if (!response.error) {
				gapi.client.accountsApi.update({ 'token': sessionStorage.accessToken, 'account_key': key, 'email': response.email, 'mobileNumber': response.mobileNumber, 'plans': response.plans,'status': 'PAYMENT_DONE' }).execute(function (response) {

					if (response.error) {
						console.log(response.error);
						if (response.code == 401) {
							$("#googlesignin").modal("toggle");
						}

					} else {

						$("#pay_buttons").addClass("show");
					}

				});

			}
		});
	}

}