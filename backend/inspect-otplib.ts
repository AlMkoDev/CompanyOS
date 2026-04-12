import * as otplib from 'otplib';
console.log(Object.keys(otplib));
if (otplib.authenticator) {
  console.log('authenticator keys:', Object.keys(otplib.authenticator));
}
