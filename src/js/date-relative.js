/**
* Returns a description of this date in relative terms.

* Examples, where new Date().toString() == "Mon Nov 23 2009 17:36:51 GMT-0500 (EST)":
*
* new Date().toRelativeTime()
* --> 'Just now'
*
* new Date("Nov 21, 2009").toRelativeTime()
* --> '2 days ago'
*
* new Date("Nov 25, 2009").toRelativeTime()
* --> '2 days from now'
*
* // One second ago
* new Date("Nov 23 2009 17:36:50 GMT-0500 (EST)").toRelativeTime()
* --> '1 second ago'
*
* toRelativeTime() takes an optional argument - a configuration object.
* It can have the following properties:
* - now - Date object that defines "now" for the purpose of conversion.
*         By default, current date & time is used (i.e. new Date())
* - nowThreshold - Threshold in milliseconds which is considered "Just now"
*                  for times in the past or "Right now" for now or the immediate future
* - smartDays - If enabled, dates within a week of now will use Today/Yesterday/Tomorrow
*               or weekdays along with time, e.g. "Thursday at 15:10:34"
*               rather than "4 days ago" or "Tomorrow at 20:12:01"
*               instead of "1 day from now"
* - texts - If provided it will be the source of all texts used for creation
*           of time difference text, it should also provide pluralization function
*           which will be feed up with time units 
*               
* If a single number is given as argument, it is interpreted as nowThreshold:
*
* // One second ago, now setting a now_threshold to 5 seconds
* new Date("Nov 23 2009 17:36:50 GMT-0500 (EST)").toRelativeTime(5000)
* --> 'Just now'
*
* // One second in the future, now setting a now_threshold to 5 seconds
* new Date("Nov 23 2009 17:36:52 GMT-0500 (EST)").toRelativeTime(5000)
* --> 'Right now'
*
* From: https://github.com/jherdman/javascript-relative-time-helpers
*/
Date.prototype.toRelativeTime = (function() {
  var _ = function(options) {
    var opts = processOptions(options);

    var now = opts.now || new Date();
    var texts = opts.texts || TEXTS;
    var delta = now - this;
    var future = (delta <= 0);
    delta = Math.abs(delta);

    // special cases controlled by options
    if (delta <= opts.nowThreshold) {
      return future ? texts.right_now : texts.just_now;
    }
    if (opts.smartDays && delta <= 6 * MS_IN_DAY) {
      return toSmartDays(this, now, texts);
    }

    var units = null;
    for (var key in CONVERSIONS) {
      if (delta < CONVERSIONS[key])
        break;
      units = key; // keeps track of the selected key over the iteration
      delta = delta / CONVERSIONS[key];
    }

    // pluralize a unit when the difference is greater than 1.
    delta = Math.floor(delta);
    units = texts.pluralize(delta, units);
    return [delta, units, future ? texts.from_now : texts.ago].join(" ");
  };

  var processOptions = function(arg) {
    if (!arg) arg = 0;
    if (typeof arg === 'string') {
      arg = parseInt(arg, 10);
    }
    if (typeof arg === 'number') {
      if (isNaN(arg)) arg = 0;
      return {nowThreshold: arg};
    }
    return arg;
  };

  var toSmartDays = function(date, now, texts) {
    var day;
    var weekday = date.getDay(),
        dayDiff = weekday - now.getDay();
    if (dayDiff == 0)       day = texts.today;
    else if (dayDiff == -1) day = texts.yesterday;
    else if (dayDiff == 1 && date > now)  
                            day = texts.tomorrow;
    else                    day = texts.days[weekday];
    return day + " " + texts.at + " " + date.toLocaleTimeString();
  };

  var CONVERSIONS = {
    millisecond: 1, // ms    -> ms
    second: 1000,   // ms    -> sec
    minute: 60,     // sec   -> min
    hour:   60,     // min   -> hour
    day:    24,     // hour  -> day
    month:  30,     // day   -> month (roughly)
    year:   12      // month -> year
  };

  var MS_IN_DAY = (CONVERSIONS.millisecond * CONVERSIONS.second * CONVERSIONS.minute * CONVERSIONS.hour * CONVERSIONS.day);

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var TEXTS = {today:        'Today', 
               yesterday:    'Yesterday', 
               tomorrow:     'Tomorrow',
               at:           'at',
               from_now:     'from now',
               ago:          'ago',
               right_now:    'Right now',
               just_now:     'Just now',
               days:         WEEKDAYS,
               pluralize:    function(val, text) {
                                if(val > 1)
                                    return text + "s";
                                return text;
                             }
               };
  return _;
})();

/*
* Wraps up a common pattern used with this plugin whereby you take a String
* representation of a Date, and want back a date object.
*/
Date.fromString = function(str) {
  return new Date(Date.parse(str));
};