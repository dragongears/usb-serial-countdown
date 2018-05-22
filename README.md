# USB Serial Countdown

A Node application to count down the days to events on a USB serial LCD display.

[YouTube video](https://www.youtube.com/watch?v=v6HfXb4BzYo)

[USB + SERIAL BACKPACK KIT WITH 16X2 RGB BACKLIGHT POSITIVE LCD](https://www.adafruit.com/products/782)

Run `npm link` in the root directory to symlink the binary file to the system path, making it accessible from anywhere by running `usb-countdown`

Run `npm run start` to start the app in the background

Command line options:
- List - List events
- Add - Add an event ("Event title" 12/18/2018)
- Remove - Remove an event (Specify index of event from List command)
- Start - Start displaying event countdown
- Stop - Stop displaying event countdown
- Clear - Clear the list of events
- Speed - Number of seconds to show each event (1-5)
- Color - Display background color (White, Red, Orange, Yellow, Green, Blue, Purple)
- Port - Serial port for display
- Baud - Serial port baud rate

