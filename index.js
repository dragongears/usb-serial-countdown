#!/usr/bin/env node

console.log('Countdown');
console.log('---------');

var jsonfile = require('jsonfile');
var file = 'events.json';

var events;

readEventFile();

function readEventFile() {
  try {
    events = jsonfile.readFileSync(file);
  }

  catch (e) {
    jsonfile.writeFileSync(file, "[]");
  }
}

var cmds = {
  start: start,
  list: list,
  add: add,
  remove: remove,
  clear: clear,
  stop: function(){
    console.log('cmd: stop');
  }
};

var args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Commands:');
  console.log('List - List events');
  console.log('Add - Add an event ("Event title" 12/18/2018)');
  console.log('Remove - Remove an event (Specify index of event from List command)');
  console.log('Start - Start displaying event countdowns');
  console.log('Clear - Clear the list of events');
  console.log('');
}

args[0] && cmds[args[0]] && cmds[args[0]]();

function dayCompare(a, b) {
  if (parseInt(a.dd, 10) < parseInt(b.dd, 10)) {
    return -1;
  }
  if (parseInt(a.dd, 10) > parseInt(b.dd, 10)) {
    return 1;
  }
  return 0;

}

function monthCompare(a, b) {
  if (parseInt(a.mm, 10) < parseInt(b.mm, 10)) {
    return -1;
  }
  if (parseInt(a.mm, 10) > parseInt(b.mm, 10)) {
    return 1;
  }
  return 0;

}

function yearCompare(a, b) {
  if (parseInt(a.yy, 10) < parseInt(b.yy, 10)) {
    return -1;
  }
  if (parseInt(a.yy, 10) > parseInt(b.yy, 10)) {
    return 1;
  }
  return 0;

}

function sortEvents() {
  events = events.sort(dayCompare);
  events = events.sort(monthCompare);
  events = events.sort(yearCompare);
}


///////////////////////////////////////
function add() {
  var newEvent = {};
  var match = args[2].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    newEvent.mm = match[1];
    newEvent.dd = match[2];
    newEvent.yy = match[3];
    newEvent.event = args[1];
    events.push(newEvent);
  }

  sortEvents();

  jsonfile.writeFileSync(file, events, {spaces: 2});

  list();
}

///////////////////////////////////////
function remove() {
  events.splice(args[1], 1);

  jsonfile.writeFileSync(file, events, {spaces: 2});

  list();
}

///////////////////////////////////////
function clear() {
  events = [];

  jsonfile.writeFileSync(file, events, {spaces: 2});

  list();
}

///////////////////////////////////////
function list() {
  events.forEach(function(event, idx) {
    console.log(idx + ') ' + event.event + ' ' + event.mm + '/' + event.dd + '/' + event.yy);
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

  function intervalFunc() {
    if (events.length !== 0) {
      var daysStr = [' day', ' days'];
      var date2 = new Date(); // Today

      var date1 = new Date(events[next].yy, events[next].mm - 1, events[next].dd); // Target date
      var diff = new DateDiff(date1, date2);
      var days = Math.ceil(diff.days());

      if (days < 1) {
        events.splice(next, 1);
        jsonfile.writeFileSync(file, events, {spaces: 2});
        next = 0;
        if (events.length === 0) {
          sp.write([0xFE, 0x58]);
          sp.write('No events', function () {
            sp.close();
          });
        }
      } else {
        console.log(events[next].event);
        console.log(days.toString() + daysStr[+!!(days-1)]);
        sp.write([0xFE, 0x58]);
        sp.write(events[next].event.substr(0, 15));
        sp.write([0xFE, 0x47, 0x01, 0x02]);
        sp.write(days.toString() + daysStr[+!!(days-1)]);
      }

      if (++next >= events.length) {
        next = 0;
      }
    } else {
    sp.write([0xFE,0x58]);
    sp.write('No events');
  }

  readEventFile();

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

// TODO Color background?
// TODO Prefs: Cycle rate, Background color
