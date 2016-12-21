var express = require('express');
var app = express();

app.use(express.static('public'));

const server =  app.listen(process.env.PORT || 8080);


if (require.main === module) {
  runServer().catch(err => console.error(err));
};


module.exports = server;