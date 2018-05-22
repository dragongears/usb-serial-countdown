#!/usr/bin/env node

module.exports = () => {
  console.log('Countdown');
  console.log('---------');

  var colors = {
    white: [0xFF, 0xA0, 0xA0],
    red: [0xFF, 0x00, 0x00],
    orange: [0xFF, 0x20, 0x00],
    yellow: [0xFF, 0x80, 0x00],
    green: [0x00, 0xFF, 0x00],
    blue: [0x00, 0x00, 0xFF],
    purple: [0xFF, 0x00, 0xFF]
  }

  var SerialPort = require("serialport");

  var jsonfile = require('jsonfile');
  var eventsFilename = 'events.json';
  var settingsFilename = 'settings.json';

  var defaultSettings = {
    stop: false,
    speed: 3,
    port: "/dev/ttyACM0",
    baud: 115200
  };

  var events = readJsonFile(eventsFilename, []);
  var settings = readJsonFile(settingsFilename, defaultSettings);

  var oldColor = settings.color;

  var cmds = {
    start: start,
    list: list,
    add: add,
    remove: remove,
    clear: clear,
    stop: stop,
    speed: speed,
    color: color,
    port: port,
    baud, baud
  };

  var args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Commands:');
    console.log('--List commands--------------------------------------');
    console.log('List - List events');
    console.log('Add - Add an event ("Event title" 12/18/2018)');
    console.log('Remove - Remove an event (Specify index of event from List command)');
    console.log('Start - Start displaying event countdown');
    console.log('Stop - Stop displaying event countdown');
    console.log('Clear - Clear the list of events');
    console.log('--Settings-------------------------------------------');
    console.log('Speed - Number of seconds to show each event (1-5)');
    console.log('Color - Display background color');
    console.log('        (White, Red, Orange, Yellow, Green, Blue, Purple)');
    console.log('Port - Serial port for display');
    console.log('Baud - Serial port baud rate');
    console.log('');
  }

  // The stop flag in settings should not be set when starting up
  if (settings.stop) {
    settings.stop = false
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  }

  // Run the command in the command line args
  args[0] && cmds[args[0]] && cmds[args[0]]();

  ///////////////////////////////////////
  function readJsonFile(filename, defaults) {
    try {
      return jsonfile.readFileSync(filename);
    }

    catch (e) {
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
  // Commands ///////////////////////////
  ///////////////////////////////////////
  function port() {
    settings.serialPort = args[1];
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  }

  ///////////////////////////////////////
  function baud() {
    settings.baudRate = Number(args[1]);
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
  }

  ///////////////////////////////////////
  function color() {
    var color = args[1];

    if (!colors[color]) {
      console.log('Color must be white, red, orange, yellow, green, blue, or purple');
    } else if (color === oldColor) {
      console.log('Color is already ' + color)
    } else {
      console.log('Color set to ' + color)
      settings.color = oldColor = color;
      jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
    }
  }

  ///////////////////////////////////////
  function speed() {
    var match = args[1].match(/(\d{1})/);
    if (match) {
      var speed = Number(match[1]);
  
      if (speed >= 1 && speed <=5) {
        settings.speed = speed;
        jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
      } else {
        console.log('Speed must be beween 1 -5');
      }
    }

  }

  ///////////////////////////////////////
  function add() {
    var newEvent = {};
    var match = args[2].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      newEvent.mm = Number(match[1]);
      newEvent.dd = Number(match[2]);
      newEvent.yy = Number(match[3]);
      newEvent.event = args[1];
      events.push(newEvent);
    }

    sortEvents();

    jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});

    list();
  }

  ///////////////////////////////////////
  function remove() {
    events.splice(args[1], 1);

    jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});

    list();
  }

  ///////////////////////////////////////
  function clear() {
    events = [];

    jsonfile.writeFileSync(eventsFilename, events, {spaces: 2});

    list();
  }

  ///////////////////////////////////////
  function list() {
    events.forEach(function(event, idx) {
      console.log(idx + ') ' + event.event + ' ' + event.mm + '/' + event.dd + '/' + event.yy);
    });
  }

  ///////////////////////////////////////
  function stop() {
    settings.stop = true
    jsonfile.writeFileSync(settingsFilename, settings, {spaces: 2});
    console.log('settings.stop ' + settings.stop)
  }

  ///////////////////////////////////////
  function start() {
    var sp = new SerialPort(
      settings.serialPort,
      {
        baudRate: settings.baudRate
      }, function (err) {
        if (err) {
          console.log(err.message);
          process.exit(1);
        }
      }
    );

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
}
