const fs = require('fs');
const editme = require('./editme.json');
try{
require('objects-to-csv');
} catch {
    const { exec } = require('child_process');
    exec('npm i', () => {
        exec('node .', () => {});
    });
};
const otc = require('objects-to-csv');
const INPUT = `./${editme.INPUT}`,
      OUTPUT = `./${editme.OUTPUT}`,
      FILES = fs.readdirSync(INPUT).filter(file => file.endsWith('.json'));
if(!fs.existsSync(INPUT)) {
    console.log('Rerun when JSON files are in the input folder.');
    return fs.mkdirSync(INPUT, { recursive: true });
};
if(!fs.existsSync(OUTPUT)) {
    fs.mkdirSync(OUTPUT, { recursive: true });
};

(function execute() {
    console.log('-----Starting');
        if(!FILES.length) return console.log('-----Stopping, no (JSON) files to read.')
        FILES.forEach((FILE) => {
            var data = fetchData(FILE);
            if(!data) return;
            if(!data.length) return;
            console.log('-------Fetched Data for ' + FILE);
            writeData(data[1], FILE, ' - Cards');
            writeData(data[0], FILE, ' - Board Info');
        });
})();

function fetchData(file) {
    console.log(`------Reading ${file}`);
    try {
        JSON.parse(fs.readFileSync(`${INPUT}/${file}`));
    } catch {
        return console.log(`------${file} can't be read.`);
    }
    const JSONFILE = JSON.parse(fs.readFileSync(`${INPUT}/${file}`));
        if(!verify(JSONFILE, ['id','name','desc','descData','closed','idOrganization','shortLink','powerUps','dateLastActivity','idTags','datePluginDisable','creationMethod','idBoardSource','idEnterprise','pinned','starred','url','subscribed','dateLastView','shortUrl','ixUpdate','limits','enterpriseOwned','templateGallery','premiumFeatures','prefs','labelNames','actions','cards','labels','lists','members','checklists','customFields','memberships','pluginData'])) return console.log(`------${file} is not a valid Trello File.`);
        const CARDS = JSONFILE.cards,
              ACTIONS = JSONFILE.actions,
              COMMENTS = JSONFILE.actions.filter(action => action.type === "commentCard"),
              MEMBERS = JSONFILE.members,
              LISTS = JSONFILE.lists,
              LABELS = JSONFILE.labels,
              DATA = [],
              INFO = [{
                "Title": JSONFILE.name,
                "Description": JSONFILE.desc,
                "Cards": CARDS.length,
                "Actions": ACTIONS.length,
                "Comments": COMMENTS.length,
                "Labels": `${LABELS.length}\nLabel(s) ${labelize(LABELS)}`,
                "Last Activity": JSONFILE.dateLastActivity,
                "URLs": `Long: ${JSONFILE.url}\nShort: ${JSONFILE.shortUrl}`,
                "Members": `${MEMBERS.length}\nMember(s) ${memberize(MEMBERS)}`,
            }];
        console.log(`------Processing ${CARDS.length} cards`)
        CARDS.forEach((CARD) => {
            var thisList = getList(CARD, LISTS),
                thisMemberList = getMember(CARD, MEMBERS),
                thisActions = getFromActions(CARD, ACTIONS),
                thisLabelList = getLabels(CARD);
            DATA.push({
                "Created On": getCreationDate(CARD, ACTIONS),
                "Latest Update": CARD.dateLastActivity,
                "Title": `${CARD.closed ? `[Archived] ` : ``}${CARD.name}`,
                "Info": `${CARD.desc}`,
                "Card Log": thisActions,
                "Labels": thisLabelList,
                "List": thisList,
                "URLs": `Long: ${CARD.url}\nShort: ${CARD.shortUrl}`,
                "Members": thisMemberList,
            })
        })
    console.log(`------Finished Reading ${file}`);
    return [INFO, DATA.sort((a,b) => new Date(a["Created On"]).getTime() - new Date(b["Created On"]).getTime())];
};

function getFromActions(card, actions) {
    var newActions = actions.filter(action => action.data.card ? action.data.card.id === card.id : false).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    var cardActions = [];
    newActions.forEach(action => {
        switch(action.type.toLowerCase()) {
        case 'commentcard':
            cardActions.push(`### ${action.data.text} - ${showMember(action)} on ${action.date}`);
        break;         
        case 'addattachmenttocard':
            cardActions.push(`### ${action.data.attachment.name} - ${action.data.attachment.url} added by ${showMember(action)} on ${action.date}`);
        break;            
        case 'createcard':
            cardActions.push(`### Added by ${showMember(action)} on ${action.date}`);
        break;  
        case 'updatecard':
            if(action.data.listBefore) {
                cardActions.push(`### Moved from ${action.data.listBefore.name} to ${action.data.listAfter.name} by ${showMember(action)} on ${action.date}`);
            } else
            if(typeof action.data.old.closed === "boolean") {
                cardActions.push(`### ${action.data.old.closed ? `Unarchived` : `Archived`} by ${showMember(action)} on ${action.date}`);
            }
        break;
        case 'movecardtoboard':
            if(action.data.board && action.data.boardSource) {
                cardActions.push(`### Imported from https://trello.com/b/${action.data.boardSource.id} by ${showMember(action)} on ${action.date}`);
            }
        break;
        }
    })
    if(!cardActions.length) return 'None'
    return cardActions.join('\n\n\n');
}

function getCreationDate(card, actions) {
    var newActions = actions.filter(action => action.data.card ? action.data.card.id === card.id : false).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    var info = "Unknown";
    newActions.forEach(action => {     
        if(action.type === `createCard`) {
            info = action.date;
        };
    });
    return info;
};

function showMember(action) {
    if(action.memberCreator) {
        if(action.memberCreator.fullName) { 
            return action.memberCreator.fullName; 
    } else if(action.memberCreator.username) {
            return action.memberCreator.username;
    }} else return 'Unknown';
}

function verify(obj, arr) {
    return Object.keys(obj).length ? Object.keys(obj).every(id => arr.includes(id)) : false;
}

function getList(card, lists) {
    return lists.filter(LIST => card.idList === LIST.id)[0].name;
};

function labelize(labels) {
    if(!labels.length) return 'No Labels';
    var labelList = [];
    for(var l in labels) {
        labelList.push(`${labels[l].name}`);
    }
    return labelList.join('\n')
}

function memberize(members) {
    if(!members.length) return 'No Members';
    var memberList = [];
    for(var m in members) {
        memberList.push(`${members[m].fullName} (${members[m].url}) ${setBio(members[m])}`);
    }
    return memberList.join('\n')
}

function getMember(card, members) {
    if(!card.idMembers.length) return 'None';
    const MEMBERLIST = [];
    for(var iM in card.idMembers) {
        var member = members.filter(member => card.idMembers[iM] === member.id)[0];
        MEMBERLIST.push(`${card.idMembers.fullName || `Unknown User`} (${member.url}) ${setBio(member)}`)
    }
    return MEMBERLIST.join('\n');
};

function setBio(member) {
    return member.bio.length ? `- "${member.bio}"` : `- No Bio`;
}

function getLabels(card) {
    var labels = card.labels
    if(!labels.length) return 'None';
    var names = [];
    for(var l in labels) {
        names.push(`${labels[l].name}`);
    }
    return names.join(',\n');
};

async function writeData(string, file, comment) {
        console.log(`--------Converting ${file} -> ${file.split('.json').join('')}${comment || ''}.csv`);
    const csvData = new otc(string);
    const csv = await csvData.toString();
    const makeStream = fs.createWriteStream(`${OUTPUT}/${file.split('.json').join('')}${comment || ''}.csv`);
    makeStream.write(csv);
    makeStream.on('finish', () => {
        console.log(`--------Finished Converting ${file} -> ${file.split('.json').join('')}${comment || ''}.csv`);
    })
    makeStream.close();
};