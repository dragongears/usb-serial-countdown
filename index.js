/**
 *
 * USB Serial Countdown
 *
 * A Node application to count down the days to events on a USB serial LCD display.
 *
 */

var path = require('path');

var exports = {};

var SerialPort = require('serialport');
var jsonfile = require('jsonfile');

var colors = {
  white: [0xff, 0xa0, 0xa0],
  red: [0xff, 0x00, 0x00],
  orange: [0xff, 0x20, 0x00],
  yellow: [0xff, 0x80, 0x00],
  green: [0x00, 0xff, 0x00],
  blue: [0x00, 0x00, 0xff],
  purple: [0xff, 0x00, 0xff],
};

var eventsFilename = path.resolve(__dirname, 'events.json');
var settingsFilename = path.resolve(__dirname, 'settings.json');
console.log(settingsFilename);

var defaultSettings = {
  stop: false,
  speed: 3,
  color: 'white',
  serialPort: '/dev/ttyACM0',
  baudRate: 115200,
  serialGui: false,
};

var events = [];
var settings = {};
var oldColor = [];

///////////////////////////////////////
function readJsonFile(filename, defaults) {
  try {
    return jsonfile.readFileSync(filename);
  } catch (e) {
    jsonfile.writeFileSync(filename, defaults, {
      spaces: 2
    });
    return defaults;
  }
}

///////////////////////////////////////
// Date Sorting functions /////////////
///////////////////////////////////////
function dateCompare(a, b) {
  let aa = new Date(a.yy, a.mm, a.dd).getTime();
  let bb = new Date(b.yy, b.mm, b.dd).getTime();

  if (aa < bb) {
    return -1;
  }
  if (aa > bb) {
    return 1;
  }
  return 0;
}

function sortEvents() {
  events = events.sort(dateCompare);
}

///////////////////////////////////////
const port = (exports.port = function (serialPort, cb) {
  settings = readJsonFile(settingsFilename, defaultSettings);
  settings.serialPort = serialPort;
  jsonfile.writeFileSync(settingsFilename, settings, {
    spaces: 2
  });
  cb(null, 0);
});

///////////////////////////////////////
const baud = (exports.baud = function (baudRate, cb) {
  settings = readJsonFile(settingsFilename, defaultSettings);
  settings.baudRate = baudRate;
  jsonfile.writeFileSync(settingsFilename, settings, {
    spaces: 2
  });
  cb(null, 0);
});

///////////////////////////////////////
const color = (exports.color = function (color, cb) {
  settings = readJsonFile(settingsFilename, defaultSettings);
  oldColor = settings.color;

  if (!colors[color]) {
    cb(
      new Error(
        'Color must be white, red, orange, yellow, green, blue, or purple'
      )
    );
  } else if (color === oldColor) {
    cb(new Error('Color is already ' + color));
  } else {
    settings.color = oldColor = color;
    jsonfile.writeFileSync(settingsFilename, settings, {
      spaces: 2
    });
    cb(null, color);
  }
});

///////////////////////////////////////
const speed = (exports.speed = function (newSpeed, cb) {
  settings = readJsonFile(settingsFilename, defaultSettings);
  if (newSpeed >= 1 && newSpeed <= 5) {
    settings.speed = newSpeed;
    jsonfile.writeFileSync(settingsFilename, settings, {
      spaces: 2
    });
    cb(null, newSpeed);
  } else {
    cb(new Error('Speed must be beween 1 -5'));
  }
});

///////////////////////////////////////
const add = (exports.add = function (newEvent, cb) {
  events = readJsonFile(eventsFilename, []);
  events.push(newEvent);
  sortEvents();
  jsonfile.writeFileSync(eventsFilename, events, {
    spaces: 2
  });
  list(() => {});
  cb(null, newEvent);
});

///////////////////////////////////////
const remove = (exports.remove = function (eventIndex, cb) {
  events = readJsonFile(eventsFilename, []);
  events.splice(eventIndex, 1);
  jsonfile.writeFileSync(eventsFilename, events, {
    spaces: 2
  });
  list(() => {});
  cb(null, eventIndex);
});

///////////////////////////////////////
const clear = (exports.clear = function (cb) {
  events = readJsonFile(eventsFilename, []);
  events = [];
  jsonfile.writeFileSync(eventsFilename, events, {
    spaces: 2
  });
  list(() => {});
  cb(null, 0);
});

///////////////////////////////////////
const list = (exports.list = function (cb) {
  events = readJsonFile(eventsFilename, []);
  events.forEach(function (event, idx) {
    console.log(
      idx +
      ') ' +
      event.event +
      ' ' +
      event.mm +
      '/' +
      event.dd +
      '/' +
      event.yy
    );
  });
  cb(null, 0);
});

///////////////////////////////////////
const stop = (exports.stop = function (cb) {
  settings = readJsonFile(settingsFilename, defaultSettings);
  settings.stop = true;
  jsonfile.writeFileSync(settingsFilename, settings, {
    spaces: 2
  });
  cb(null, 0);
});

///////////////////////////////////////
const start = (exports.start = function (cb) {
  events = readJsonFile(eventsFilename, []);
  settings = readJsonFile(settingsFilename, defaultSettings);
  oldColor = settings.color;
  var next = 0;

  // The stop flag in settings should not be set when starting up
  if (settings.stop) {
    settings.stop = false;
    jsonfile.writeFileSync(settingsFilename, settings, {
      spaces: 2
    });
  }

  var sp = new SerialPort(
    settings.serialPort, {
      baudRate: settings.baudRate,
    },
    function (err) {
      if (err) {
        cb(err, 'Serial port open error');
      }
    }
  );

  function intervalFunc() {
    if (events.length !== 0) {
      const daysStr = [' day', ' days'];

      let date1 = new Date(); // Today
      let date2 = new Date(
        events[next].yy,
        events[next].mm - 1,
        events[next].dd
      ); // Target date
      let timeDiff = date2.getTime() - date1.getTime();
      let days = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (days < 0) {
        events.splice(next, 1);
        jsonfile.writeFileSync(eventsFilename, events, {
          spaces: 2
        });
        next = 0;
        if (events.length === 0) {
          sp.write([0xfe, 0x58]);
          sp.write('No events', function () {
            stop();
          });
        }
      } else if (days === 0) {
        console.log(events[next].event);
        console.log(days.toString() + daysStr[+!!(days - 1)]);
        sp.write([0xfe, 0x58]);
        sp.write(events[next].event.substr(0, 15));
        sp.write([0xfe, 0x47, 0x01, 0x02]);
        sp.write('Today!');
      } else {
        console.log(events[next].event);
        console.log(days.toString() + daysStr[+!!(days - 1)]);
        sp.write([0xfe, 0x58]);
        sp.write(events[next].event.substr(0, 15));
        sp.write([0xfe, 0x47, 0x01, 0x02]);
        sp.write(days.toString() + daysStr[+!!(days - 1)]);
      }

      if (++next >= events.length) {
        next = 0;
      }
    } else {
      sp.write([0xfe, 0x58]);
      sp.write('No events');
    }

    events = readJsonFile(eventsFilename, []);

    if (next >= events.length) {
      next = 0;
    }

    settings = readJsonFile(settingsFilename, defaultSettings);

    if (settings.color !== oldColor) {
      oldColor = settings.color;
      sp.write([0xfe, 0xd0]);
      sp.write(colors[settings.color]);
    }

    if (settings.stop) {
      console.log('Stopping...');

      // Close serial
      sp.close(function (err) {});
      // Set stop in prefs to false
      settings.stop = false;
      jsonfile.writeFileSync(settingsFilename, settings, {
        spaces: 2
      });
    } else {
      setTimeout(intervalFunc, settings.speed * 1000);
    }
  }

  sp.on('error', function (err) {
    console.log(err.message);
  });

  // Open serial port
  sp.on('open', function () {
    sp.write([0xfe, 0x58]); // Clear screen
    sp.write('Countdown');

    // Data from serial (should never happen)
    sp.on('data', function (data) {
      console.log('>>>>>', data);
    });

    setTimeout(intervalFunc, settings.speed * 1000);
  });
});

module.exports = exports;
