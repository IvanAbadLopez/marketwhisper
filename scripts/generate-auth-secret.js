// Generate random NEXTAUTH_SECRET for production
console.log(require('crypto').randomBytes(32).toString('base64'));
