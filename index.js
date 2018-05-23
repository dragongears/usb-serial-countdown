var exports = {};

var SerialPort = require('serialport');
var jsonfile = require('jsonfile');

var colors = {
  white: [0xFF, 0xA0, 0xA0],
  red: [0xFF, 0x00, 0x00],
  orange: [0xFF, 0x20, 0x00],
  yellow: [0xFF, 0x80, 0x00],
  green: [0x00, 0xFF, 0x00],
  blue: [0x00, 0x00, 0xFF],
  purple: [0xFF, 0x00, 0xFF]
};

var eventsFilename = 'events.json';
var settingsFilename = 'settings.json';

var defaultSettings = {
  stop: false,
  speed: 3,
  color: 'white',
  port: "/dev/ttyACM0",
  baud: 115200
};

var events = [];
var settings = {};
var oldColor = [];

///////////////////////////////////////
function init() {
  events = readJsonFile(eventsFilename, []);
  settings = readJsonFile(settingsFilename, defaultSettings);
  oldColor = settings.color;

  // The stop flag in settings should not be set when starting up
  if (settings.stop) {
    settings.stop = false
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  }
}

///////////////////////////////////////
function readJsonFile(filename, defaults) {
  try {
    return jsonfile.readFileSync(filename);
  } catch (e) {
    jsonfile.writeFileSync(filename, defaults, {spaces: 2});
    return defaults
  }
}

///////////////////////////////////////
// Date Sorting functions /////////////
///////////////////////////////////////
function dayCompare(a, b) {
  if (a.dd < b.dd) {
    return -1;
  }
  if (a.dd > b.dd) {
    return 1;
  }
  return 0;

}

function monthCompare(a, b) {
  if (a.mm < b.mm) {
    return -1;
  }
  if (a.mm > b.mm) {
    return 1;
  }
  return 0;

}

function yearCompare(a, b) {
  if (a.yy < b.yy) {
    return -1;
  }
  if (a.yy > b.yy) {
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
var port = exports.port = function(serialPort, cb) {
  init();
  settings.serialPort = serialPort;
  jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  cb(null, 0);
}

  ///////////////////////////////////////
var baud = exports.baud = function(baudRate, cb) {
  init();
  settings.baudRate = Number(baudRate);
  jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  cb(null, 0);
}

///////////////////////////////////////
var color = exports.color = function(color, cb) {
  init();
  if (!colors[color]) {
    cb(new Error('Color must be white, red, orange, yellow, green, blue, or purple'));
  } else if (color === oldColor) {
    cb(new Error('Color is already ' + color));
  } else {
    settings.color = oldColor = color;
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
    cb(null, color);
  }
}

///////////////////////////////////////
var speed = exports.speed = function(speed, cb) {
  init();
  var match = speed.match(/(\d{1})/);
  if (match && (speed >= 1 && speed <=5)) {
    settings.speed = speed;
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
    cb(null, speed);
  } else {
    cb(new Error('Speed must be beween 1 -5'));
  }
}

///////////////////////////////////////
var add = exports.add = function(newEvent, cb) {
  init();
  events.push(newEvent);
  sortEvents();
  jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});
  list(()=>{});
  cb(null, newEvent);
}

///////////////////////////////////////
var remove = exports.remove = function(eventIndex, cb) {
  init();
  events.splice(eventIndex, 1);
  jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});
  list(()=>{});
  cb(null, eventIndex);
}

///////////////////////////////////////
var clear = exports.clear = function(cb) {
  init();
  events = [];
  jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});
  list(()=>{});
  cb(null, 0);
}

///////////////////////////////////////
var list = exports.list = function(cb) {
  init();
  events.forEach(function(event, idx) {
    console.log(idx + ') ' + event.event + ' ' + event.mm + '/' + event.dd + '/' + event.yy);
  });
  cb(null, 0);
}

///////////////////////////////////////
var stop = exports.stop = function(cb) {
  init();
  settings.stop = true
  jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  cb(null, 0);
}

///////////////////////////////////////
var start = exports.start = function(cb) {
  init();
  var DateDiff = require('date-diff');
  var next = 0;
  var sp = new SerialPort(
    settings.serialPort,
    {
      baudRate: settings.baudRate
    }, function (err) {
      if (err) {
        cb(err, 'Serial port open error');
      }
    }
  );

  function intervalFunc() {
    if (events.length !== 0) {
      var daysStr = [' day', ' days'];
      var date2 = new Date(); // Today

      var date1 = new Date(events[next].yy, events[next].mm - 1, events[next].dd); // Target date
      var diff = new DateDiff(date1, date2);
      var days = Math.ceil(diff.days());

      if (days < 0) {
        events.splice(next, 1);
        jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});
        next = 0;
        if (events.length === 0) {
          sp.write([0xFE, 0x58]);
          sp.write('No events', function () {
            stop();
          });
        }
      } else if (days == 0) {
        console.log(events[next].event);
        console.log(days.toString() + daysStr[+!!(days-1)]);
        sp.write([0xFE, 0x58]);
        sp.write(events[next].event.substr(0, 15));
        sp.write([0xFE, 0x47, 0x01, 0x02]);
        sp.write('Today!');
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

    events = readJsonFile(eventsFilename, []);

    if (next >= events.length) {
      next = 0;
    }

    settings = readJsonFile(settingsFilename, defaultSettings);

    if (settings.color !== oldColor) {
      oldColor = settings.color;
      sp.write([0xFE, 0xD0]);
      sp.write(colors[settings.color]);
    }

    if (settings.stop) {
      console.log('Stopping...')

      // Close serial
      sp.close(function (err) {

      });
      // Set stop in prefs to false
      settings.stop = false
      jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
    } else {
      setTimeout(intervalFunc, settings.speed * 1000);
    }
  }

  sp.on('error', function(err) {
    console.log(err.message)
  });

  // Open serial port
  sp.on('open', function() {

    sp.write([0xFE,0x58]);  // Clear screen
    sp.write("Countdown");

    // Data from serial (should never happen)
    sp.on('data', function(data) {
      console.log('>>>>>', data);
    });

    setTimeout(intervalFunc, settings.speed * 1000);
  });
}

module.exports = exports;
