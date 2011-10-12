$(function() {
	/** 
	* A Pomodoro is one work period with one break period.
	* This counts down the work period, and fires "done:work"
	* Then immediately counts down the break period, and fires "done:break"
	*
	* It can be paused, or reset.
	*/
	var Pomodoro = Backbone.Model.extend({
		defaults: {
			seconds: 0,
			workLength: 25*60, // in seconds
			breakLength: 25*60, // in seconds
			inBreak: false,
			paused: true
		},
		
		initialize: function() {
			this.reset();
		},

		reset: function() {
			this.set({seconds: this.get("workLength"), paused: true, inBreak: false});
		},

		start: function() {
			this.set({paused: false});
			var doAgain = _.bind(this.tick, this);
			_.delay(doAgain, 1000);
		},
		
		pause: function() {
			this.set({paused: true});
		},

		tick: function() {
			if (this.get("paused"))
				return;
			
			var secondsLeft = this.get("seconds")-1;
			this.set({seconds: secondsLeft})
			
			if (secondsLeft <= 0) {
				if (this.get("inBreak")) {
					this.reset();
					this.trigger("done:break");
				} else {	
					this.set({seconds: this.get("breakLength"), inBreak: true});
					this.trigger("done:work");
					this.start();
				}
			} else {
				this.start();
			}
		}
	});
	
	// Display the current time left in #counter
	var PomodoroCounterView = Backbone.View.extend({
		el: $('#counter'),
		
		template: _.template($("#counter-template").html()),
		
		events: {
			"click": "toggle"
		},
		
		initialize: function() {
			if (!this.model) 
				throw "Cannot make a view without a model!";
				
			this.render();
			this.model.bind('change', this.render, this);
			this.model.bind('change:inBreak', this.toggleBreak, this);
		},
		
		render: function() {
			var minutes = Math.floor(this.model.get("seconds")/60);
			var seconds = this.model.get("seconds")%60;
			
			$(this.el).html(this.template({
				formattedTime: minutes + ":" + ((seconds < 10) ? "0" : "") + seconds,
				clickAction: (this.model.get("paused") ? "resume" : "pause")
			}))
			return this;
		},
		
		toggle: function() {
			if (this.model.get("paused")) {
				this.model.start();
			} else {
				this.model.pause();
			}
		},
		
		toggleBreak: function() {
			$(this.el).toggleClass("break");
		}
	});
	
	// Alert when any timer is done
	var PomodoroAlert = Backbone.View.extend({
		initialize: function() {
			if (!this.model) 
				throw "Cannot make a view without a model!";
				
			this.model.bind('done:break', this.doneBreak, this);	
			this.model.bind('done:work', this.doneWork, this);
		},
		
		doneBreak: function() {
			alert("Break is done! Hit the timer when you're ready for another");
		},

		doneWork: function() {
			alert("Time for a break!");
		}
	});
	
	var PomodoroApp = Backbone.View.extend({
		initialize: function() {
			this.model = new Pomodoro();
			new PomodoroCounterView({model: this.model});
			new PomodoroAlert({model: this.model});
		}
	});
	
	
	pomo = new PomodoroApp();
});

/**
* Call UseTestSettings(this.pomo)
* to set the Pomodoro to a short duration for testing
*/
function UseTestSettings(pomo) {
	pomo.model.set({workLength: 5, breakLength: 3, seconds: 2});
	pomo.model.reset();
}
