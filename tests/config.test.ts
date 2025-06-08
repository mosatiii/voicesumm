import { app, auth } from '../config/config';

test('firebase initializes', () => {
  expect(app).toBeDefined();
  expect(auth).toBeDefined();
});
