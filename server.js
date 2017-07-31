const fs = require("fs"),
  http = require("http"),
  url = require("url"),
  path = require("path");

let indexPage, movie_webm, movie_mp4, movie_png;

// load the video files and the index html page
fs.readFile(path.resolve(__dirname, "movie.webm"), function(err, data) {
  if (err) {
    throw err;
  }
  movie_webm = data;
});
fs.readFile(path.resolve(__dirname, "movie.mp4"), function(err, data) {
  if (err) {
    throw err;
  }
  movie_mp4 = data;
});
fs.readFile(path.resolve(__dirname, "movie.png"), function(err, data) {
  if (err) {
    throw err;
  }
  movie_png = data;
});

fs.readFile(path.resolve(__dirname, "index.html"), function(err, data) {
  if (err) {
    throw err;
  }
  indexPage = data;
});

const chunksize = 65536;

// create http server
http
  .createServer(function(req, res) {
    const reqResource = url.parse(req.url).pathname;
    if (reqResource == "/") {
      //console.log(req.headers)
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(indexPage);
      res.end();
    } else if (reqResource == "/movie.png") {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.write(movie_png);
      res.end();
    } else if (reqResource == "/favicon.ico") {
      res.writeHead(404);
      res.end();
    } else {
      let mimeType, content;
      if (reqResource == "/movie.mp4") {
        mimeType = "video/mp4";
        content = movie_mp4;
      } else if (reqResource == "/movie.webm") {
        content = movie_webm;
        mimeType = "video/webm";
      }
      const total = content.length;

      const range = req.headers.range;
      if (!range) {
        //First time, if no range, send the information Content-Length
        res.writeHead(200, {
          "Accept-Ranges": "bytes",
          "Content-Length": total,
          "Content-Type": mimeType
        });
        return;
      }
      const positions = range.replace(/bytes=/, "").split("-");
      const start = parseInt(positions[0], 10);

      let end;
      // if last byte position is not present then assign a chunksize
      if (!positions[1]) {
        end = start + chunksize - 1;
        if (start + chunksize > total) end = total - 1;
      } else {
        end = parseInt(positions[1], 10);
      }

      res.writeHead(206, {
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType
      });
      res.end(content.slice(start, end + 1), "binary");
    }
  })
  .listen(8888);
