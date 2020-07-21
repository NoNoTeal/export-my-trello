console.log(`If board has a LOT of actions -- e.g. comments / a lot of cards, then you're going to wait for a while. So sit back, and get a cup of coffee, or play a game in the meantime...`);
const https = require('https');
const fs = require('fs');
const editme = require('./editme.json');
const INPUT = `./${editme.INPUT}`,
      OUTPUT = `./${editme.OUTPUT}`;
if(!fs.existsSync(INPUT)) {
    fs.mkdirSync(INPUT, { recursive: true });
};
if(!fs.existsSync(OUTPUT)) {
    fs.mkdirSync(OUTPUT, { recursive: true });
};
editme.lookFor.forEach(param => {
var trelloId = param[0],
    fileName = param[1],
    boardinfo= "";
console.log(`-Fetching board data from ${trelloId}`);
https.get({
    hostname: 'trello.com',
    path: `/b/${trelloId}.json`,
    headers: {'User-Agent': `${Math.random().toString(16).substring(2,16)}`}
}, (r) => {
    var data = "";
    r.on('data', (d) => {
        data+=d;
    })
    r.on('close', () => {
        console.log(`--Fetched board data, now attempting to fetch actions.`);
        boardinfo = JSON.parse(data);
        console.log(`---Fetching actions for ${trelloId}`);
        untilDeath(boardinfo, trelloId, null, fileName);
    });
});
});

var actions = [];

function untilDeath(info, id, beforeval, fileName) {
https.get({
    hostname: 'api.trello.com',
    path: `/1/boards/${id}/actions?limit=1000${beforeval ? `&before=${beforeval}` : ``}`,
    headers: {'User-Agent': `${Math.random().toString(16).substring(2,16)}`}
}, (r) => {
    var cmpdta = "";
    r.on('data', (d) => {
        cmpdta+=d;
    })
    r.on('close', () => {
        cmpdta = JSON.parse(cmpdta);
        if(cmpdta.length < 1000) {
            if(cmpdta.length) actions.push(cmpdta);
            return makeFile(info, [].concat.apply([], actions), fileName);
        } else
        untilDeath(info, id, cmpdta[999].date, fileName);
        cmpdta.pop();
        actions.push(cmpdta);
    });

    r.on('error', () => {
        throw new Error('-----HTTPS Error Occurred, Please retry :(');
    });
});
};

function makeFile(trelloBoard, actions, name) {
    console.log(`----Writing all actions and board info to a JSON file... (${name}.json)`);
    trelloBoard["actions"] = actions;
    fs.createWriteStream(`./${INPUT}/${name}.json`);
    fs.writeFile(`./${INPUT}/${name}.json`, JSON.stringify(trelloBoard), (c) => {
        if(c) console.log(c);
    })
    console.log(`-----Finished writing data to ${name}.json`);
}