const express = require("express");
const app = express();
const cors = require("cors");

const mysql = require("mysql2/promise");
const CCTV = mysql.createPool({
  host: {handle},
  port: {handle},
  user: {handle},
  password: {handle},
  database: {handle},
  dateStrings: {handle},
});
app.use(cors());
app.use(express.json());

app.get("/CNN", async (req, res) => {
  const P_id = req.query.P_id;
  const S_id = req.query.S_id;
  const Exist = req.query.Exist;
  console.log(P_id, S_id, Exist);
  try {
    //const connection = await CCTV.getConnection();
    const insert = await CCTV.query(
      "INSERT INTO PARKING_2(P_id,S_id,Exist,DT) VALUES (?,?,?,now());",
      [P_id, S_id, Exist]
    );

    res.status(200).send({ Message: "yes" });
    //await connection.release.end();
  } catch (err) {
    res.status(400).json({
      message: err,
    });
  }
});
// error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//_________________________________________________________

//DB to WEB START

const SIZE = 11;

//가장 최근 변경
app.get("/inoutlast", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    const tmp = await CCTV.query("SELECT * FROM `CCTV`.`PARKING_2`");
    res.status(200).send({ Message: "yes" });
    //res.status(200).send(tmp[0][tmp[0].length - 1]);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//sid 로 0,1 반환
app.get("/inoutsid/:S_id", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    const tmp = await CCTV.query(
      "SELECT `Exist` FROM `CCTV`.`PARKING_2` WHERE S_id =" +
        req.params.S_id +
        " order by IDX DESC limit 1"
    );
    if (tmp[0][0] === undefined) {
      if (req.params.S_id < 1 || req.params.S_id > SIZE) {
        const nomatch = {
          Message: "nomatch sid",
        };
        res.status(200).send(nomatch);
      } else {
        const und = {
          Exist: 0,
        };
        res.status(200).send(und);
      }
    } else {
      res.status(200).send(tmp[0][0]);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//pid + sid 현재 상태
app.get("/inoutpidsid/:P_id/:S_id", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    const tmp = await CCTV.query(
      "SELECT *FROM `CCTV`.`PARKING_2` WHERE P_id ='" +
        req.params.P_id +
        "'AND S_id=" +
        req.params.S_id +
        " order by IDX DESC limit 1"
    );
    res.status(200).send(tmp[0][0]);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

// 9개 전부 010011010 반환
app.get("/inoutall", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    let tmpall = {};
    for (let S_id = 1; S_id < SIZE + 1; S_id++) {
      const tmp = await CCTV.query(
        "SELECT `Exist` FROM `CCTV`.`PARKING_2` WHERE S_id =" +
          S_id +
          " order by IDX DESC limit 1"
      );

      if (tmp[0][0] === undefined) {
        tmpall[`Exist${S_id}`] = 0;
      } else {
        tmpall[`Exist${S_id}`] = tmp[0][0].Exist;
      }
    }
    res.status(200).send(tmpall);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//pid + 날짜로 해당일
app.get("/inoutDate/:P_id/:DT", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    const tmp = await CCTV.query(
      "SELECT `S_id`,`Exist`,substr(DT,12,5) as DT FROM `CCTV`.`PARKING_2` WHERE P_id ='" +
        req.params.P_id +
        "'AND DT LIKE'" +
        req.params.DT +
        "%'"
    );

    res.status(200).send(tmp[0]);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//가능한 자리 able:4 unable:5
app.get("/ableSpot", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  try {
    let able = 0,
      unable = 0;
    for (let S_id = 1; S_id < SIZE + 1; S_id++) {
      const tmp = await CCTV.query(
        "SELECT `Exist` FROM `CCTV`.`PARKING_2` WHERE S_id =" +
          S_id +
          " order by IDX DESC limit 1"
      );
      if (tmp[0][0] === undefined) {
        able++;
      } else {
        if (tmp[0][0].Exist == 1) {
          unable++;
        } else {
          able++;
        }
      }
    }
    const ableSpot = {
      able: able + "대",
      unable: unable + "대",
    };
    res.status(200).send(ableSpot);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//CNN에서사용
app.get("/inout", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");

  try {
    let tmpall = {};
    for (let S_id = 1; S_id < SIZE + 1; S_id++) {
      const tmp = await CCTV.query(
        "SELECT `Exist` FROM `CCTV`.`PARKING_2` WHERE S_id =" +
          S_id +
          " order by IDX DESC limit 1"
      );

      if (tmp[0][0] === undefined) {
        tmpall[S_id] = 0;
      } else {
        tmpall[S_id] = tmp[0][0].Exist;
      }
    }
    res.status(200).send(tmpall);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      message: err,
    });
  }
});

//________________________________________________________________________
//DB to WEB END

app.listen((port = 3000), () => {
  console.log(`listing at http://localhost:${port}`);
});
module.exports = app;
