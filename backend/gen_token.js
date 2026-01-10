const jwt = require('jsonwebtoken');
const secret = 'supersecretkey'; // From .env
const payload = {
    sub: 'test-user-id',
    email: 'test@test.com',
    role: 'ADMIN',
    tenantId: 'default'
};
const token = jwt.sign(payload, secret);
console.log(token);
