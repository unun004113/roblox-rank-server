/**
 * @main_library
 *    https://github.com/suufi/noblox.js/tree/master
 *
 * @author H_mzah
 *    https://github.com/Hamzah-z
 */

let roblox = require("noblox.js");
let express = require("express");
let BodyParser = require("body-parser");

let Utility = require("./utility/functions.js"); // 원래 있는 유틸 모듈
const { Promotions, SetRank, JoinRequests, GroupShouts, Validate } = require("./utility/validator.js");

let app = express();
let port = process.env.PORT || 8080;

app.set("env", "production");
app.use(BodyParser.json());
app.use(Utility.Authenticate);

let cookie = process.env.COOKIE; // ← Render 환경변수에서 쿠키 읽기

app.get("/", (req, res) => res.status(200).send("Server is online!"));

// 랭크 관련
app.post("/Promote", Promotions(), Validate, Utility.ChangeRank(1));
app.post("/Demote", Promotions(), Validate, Utility.ChangeRank(-1));
app.post("/SetRank", SetRank(), Validate, function (req, res, next) {
    let Group = req.body.Group;
    let Target = req.body.Target;
    let Rank = req.body.Rank;

    Utility.SetRank(res, Group, Target, Rank)
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message });
        });
});

// 그룹 가입 요청 처리
app.post("/HandleJoinRequest", JoinRequests(), Validate, function (req, res, next) {
    let Group = req.body.Group;
    let Username = req.body.Username;
    let Accept = req.body.Accept;

    roblox.handleJoinRequest({ group: Group, username: Username, accept: Accept })
        .then(() => {
            console.log(`Handled join request of user ${Username} successfully.`);
            res.status(200).send({
                error: null,
                message: `Handled join request of user ${Username} successfully.`
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message });
        });
});

// 그룹 샤우트
app.post("/GroupShout", GroupShouts(), Validate, function (req, res, next) {
    let Group = req.body.Group;
    let Message = req.body.Message;

    roblox.shout({ group: Group, message: Message })
        .then(() => {
            console.log(`Shouted to group ${Group} successfully.`);
            res.status(200).send({
                error: null,
                message: `Shouted to group ${Group} successfully.`
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send({ error: err.message });
        });
});

// 에러 핸들링
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(`Internal server error: ${err}`);
});

// 로그인 로직 수정 (환경변수 쿠키 사용)
async function login() {
    try {
        const current_user = await roblox.setCookie(cookie);
        console.log(`[✅] Logged in as ${current_user.UserName}`);
        app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    } catch (err) {
        console.error("[❌] Login failed:", err);
        let errorApp = express();
        errorApp.get("/*", (req, res) => {
            res.json({ error: "Server configuration error: " + err });
        });
        errorApp.listen(port, () => {
            console.log("Error running server:", err);
        });
    }
}

login();
