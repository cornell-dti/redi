const fs = require('fs');
const path = require('path');

// Read the response.json file
const dataPath = path.join(__dirname, '../response.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('Total emails before cleaning:', data.length);

// Filter out test/fake emails
const cleanedData = data.filter((item) => {
  const email = item.email.toLowerCase();

  // Remove obvious test emails
  const isTestEmail =
    email.includes('test') ||
    email.includes('hello@') ||
    !email.includes('@') ||
    email.endsWith('@cornell') ||
    email.endsWith('cornell.eduuuu');

  // Keep only valid Cornell emails and some legitimate external emails
  const isValidEmail =
    !isTestEmail && email.length > 10 && !email.includes('test');

  if (isTestEmail) {
    console.log('Removing test email:', email);
  }

  return isValidEmail;
});

// Remove duplicates based on email
const uniqueEmails = [];
const seenEmails = new Set();

cleanedData.forEach((item) => {
  if (!seenEmails.has(item.email.toLowerCase())) {
    seenEmails.add(item.email.toLowerCase());
    uniqueEmails.push(item);
  } else {
    console.log('Removing duplicate:', item.email);
  }
});

console.log('Total emails after cleaning:', uniqueEmails.length);
console.log('Removed:', data.length - uniqueEmails.length);

// Write cleaned data back to file
fs.writeFileSync(dataPath, JSON.stringify(uniqueEmails, null, 2));
console.log('Cleaned response.json saved!');
