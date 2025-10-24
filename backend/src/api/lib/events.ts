import { EventEmitter } from 'events';

declare global {
  // eslint-disable-next-line no-var
  var __ee: EventEmitter | undefined;
}

let ee: EventEmitter;

if (process.env.NODE_ENV === 'production') {
  ee = new EventEmitter();
} else {
  if (!global.__ee) {
    global.__ee = new EventEmitter();
  }
  ee = global.__ee;
}

ee.setMaxListeners(50);

export { ee };

