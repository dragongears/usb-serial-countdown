console.log('Countdown');
console.log('---------');

var events = [
  {
    event: 'Gen Con 2018',
    dd: 1,
    mm: 8,
    yy: 2018
  },
  {
    event: 'HHN Orlando',
    dd: 23,
    mm: 9,
    yy: 2017
  },
  {
    event: 'NY Oct 2017',
    dd: 6,
    mm: 10,
    yy: 2017
  }
];

var cmds = {
  start: start,
  list: list,
  add: add,
  remove: remove,
  stop: function(){
    console.log('cmd: stop');
  }
};

var args = process.argv.slice(2);

args[0] && cmds[args[0]]();


///////////////////////////////////////
function add() {
  var newEvent = {};
  var match = args[2].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    newEvent.dd = match[1];
    newEvent.mm = match[2];
    newEvent.yy = match[3];
    newEvent.event = args[1];
    events.push(newEvent);
  }

  list();
}

///////////////////////////////////////
function remove() {
  events.splice(args[1], 1);

  list();
}

///////////////////////////////////////
function list() {
  events.forEach(function(event, idx) {
    console.log(idx + ') ' + event.event);
  });
}

///////////////////////////////////////
function start() {
  var SerialPort = require("serialport");

  var sp = new SerialPort("/dev/ttyACM0", {
    baudRate: 115200
  });

  var DateDiff = require('date-diff');

// diff.years(); // ===> 1.9
// diff.months(); // ===> 23
// diff.days(); // ===> 699
// diff.weeks(); // ===> 99.9
// diff.hours(); // ===> 16776
// diff.minutes(); // ===> 1006560
// diff.seconds(); // ===> 60393600

  var next = 0;
  var max = events.length;

  function intervalFunc() {
    var date2 = new Date(); // Today

    var date1 = new Date(events[next].yy, events[next].mm-1, events[next].dd); // Target date
    var diff = new DateDiff(date1, date2);
    console.log(events[next].event);
    console.log(Math.ceil(diff.days()).toString() + ' days');
    sp.write([0xFE,0x58]);
    sp.write(events[next].event.substr(0, 15));
    sp.write([0xFE,0x47,0x01,0x02]);
    sp.write(Math.ceil(diff.days()).toString() + ' days');

    // next = next < events.length - 1 ? next + 1 : 0;
    if (++next >= events.length) {
      next = 0;
    }
  }

// Open serial port
  sp.on('open',function() {

    sp.write([0xFE,0x58]);  // Clear screen
    sp.write("Countdown");

    // Data from serial (should never happen)
    sp.on('data', function(data) {
      console.log('>>>>>', data);
    });

    setInterval(intervalFunc, 3000);
  });
}

// TODO Sort dates
// TODO Persistent storage
