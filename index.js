console.log('Countdown');

var events = [
  {
    event: 'Gen Con 2018',
    dd: 1,
    mm: 8,
    yy: 2018
  },
  {
    event: 'Halloween Horror Nights 2017',
    dd: 23,
    mm: 9,
    yy: 2017
  },
  {
    event: 'NYC/Mini Retro WGGCON 2017',
    dd: 6,
    mm: 10,
    yy: 2017
  }
];

var DateDiff = require('date-diff');

// diff.years(); // ===> 1.9
// diff.months(); // ===> 23
// diff.days(); // ===> 699
// diff.weeks(); // ===> 99.9
// diff.hours(); // ===> 16776
// diff.minutes(); // ===> 1006560
// diff.seconds(); // ===> 60393600

var next = 0;
var max = events.length

function intervalFunc() {
  var date2 = new Date(); // Today

  var date1 = new Date(events[next].yy, events[next].mm-1, events[next].dd); // Target date
  var diff = new DateDiff(date1, date2);
  console.log(events[next].event);
  console.log(Math.ceil(diff.days()).toString() + ' days');

  // next = next < events.length - 1 ? next + 1 : 0;
  if (++next >= events.length) {
    next = 0;
  }
}

setInterval(intervalFunc, 3000);


// TODO Sort dates
// TODO Send to serial
// TODO Add/Remove dates
// TODO Persistant storage