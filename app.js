// app.js
module.exports = () => {
  console.log('Countdown');
  console.log('---------');

  var countdown = require('./index.js');

  var cmds = {
    start: cmdStart,
    list: cmdList,
    add: cmdAdd,
    remove: cmdRemove,
    clear: cmdClear,
    stop: cmdStop,
    speed: cmdSpeed,
    color: cmdColor,
    port: cmdPort,
    baud: cmdBaud
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

  // Run the command in the command line args
  args[0] && cmds[args[0]] && cmds[args[0]]();

  ///////////////////////////////////////
  // Commands ///////////////////////////
  ///////////////////////////////////////
  function cmdPort() {
    countdown.port(args[1], (err, result) => {
      if (err) {
        process.exit(1);
      }
    });
  }

  ///////////////////////////////////////
  function cmdBaud() {
    countdown.baud(args[1], (err, result) => {
      if (err) {
        process.exit(1);
      }
    });
  }

  ///////////////////////////////////////
  function cmdColor() {
    var color = args[1];

    countdown.color(args[1], (err, result) => {
      if (err) {
        console.log(err);
        process.exit(1);
      } else {
        console.log('Color set to ' + result);
      }
    })
  }

  ///////////////////////////////////////
  function cmdSpeed() {
    countdown.speed(args[1], (err, result) => {
      if (err) {
        console.log(err);
        process.exit(1);
      } else {
        console.log('Speed set to ' + result);
      }
    });
  }

  ///////////////////////////////////////
  function cmdAdd() {
    var newEvent = {};
    var match = args[2].match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      newEvent.mm = Number(match[1]);
      newEvent.dd = Number(match[2]);
      newEvent.yy = Number(match[3]);
      newEvent.event = args[1];
      countdown.add(newEvent, (err, result) => {
        if (err) {
          process.exit(1);
        }
      })
    } else {
      console.log('Incorrect date format');
      process.exit(1);
    }
  }

  ///////////////////////////////////////
  function cmdRemove() {
    countdown.remove(args[1], (err, result) => {
      if (err) {
        process.exit(1);
      }
    })
  }

  ///////////////////////////////////////
  function cmdClear() {
    countdown.clear((err, result) => {
      if (err) {
        process.exit(1);
      }
    })
  }

  ///////////////////////////////////////
  function cmdList() {
    countdown.list((err, result) => {
        if (err) {
          process.exit(1);
        }
      })
  }

  ///////////////////////////////////////
  function cmdStop() {
    countdown.stop((err, result) => {
      if (err) {
        process.exit(1);
      } else {
        console.log('Countdown stop')
      }
    })
  }

  ///////////////////////////////////////
  function cmdStart() {
    countdown.start((err, result) => {
      if (err) {
        process.exit(1);
      } else {
        console.log('Countdown start');
      }
    })
  }
}
