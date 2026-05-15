// Ten plik służy do testowania agenta w Thunder Client / Postman
// Skopiuj zawartość do body: { "code": "..." }

function processOrder(x) {
  console.log("processing");
  let total = 0;
  if (x > 0) {
    if (x > 100) {
      if (x > 500) {
        if (x > 1000) {
          total = x * 0.5;
        } else {
          total = x * 0.65;
        }
      } else {
        total = x * 0.8;
      }
    } else {
      total = x * 0.95;
    }
  }
  let tax = total * 0.23;
  let fee = total * 0.05;
  console.log("done:", total);
  return total + tax + fee + 99.99;
}
