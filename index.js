console.log('test');

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

function intervalFunc() {
  var date2 = new Date(); // Today

  events.forEach(function(item, index){
    var date1 = new Date(item.yy, item.mm-1, item.dd); // Target date
    var diff = new DateDiff(date1, date2);
    console.log(item.event);
    console.log(Math.ceil(diff.days()).toString() + ' days');
  });


}

setInterval(intervalFunc, 3000);