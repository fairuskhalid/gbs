var TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');
var Datastore = require('nedb'); 

// set database
var tripdb = new Datastore({filename: 'data/tripdb', autoload: true});
var histdb = new Datastore({filename: 'data/histdb', autoload: true});

// if db not exist populate db
fs.stat('data/tripdb', function(err, stats) {
  if (err) {
	console.log('Populate database: ' + err);
        var trip_obj = JSON.parse(fs.readFileSync('data/trip.dat', 'utf8'));
	tripdb.insert(trip_obj);
  }
});

// set info and faq txt
var info = fs.readFileSync('data/info.txt', 'utf8');
var faq = fs.readFileSync('data/faq.txt', 'utf8');
var title_to = fs.readFileSync('data/title_to.txt', 'utf8');
var title_fr = fs.readFileSync('data/title_fr.txt', 'utf8');

var token = '164449121:AAGYsY6QyWDCcZ3ljI29q7CU62SLww-t9Rk';
// Setup polling way
var options = {
  polling: {
	timeout: 10,
  	interval: 100
  }
};

var bot = new TelegramBot(token, options);


// to log important activity
function log(action, msg) {
  var d = new Date();
  var doc = { date: d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear() + ', ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds(), user: msg.from, action: action };
  histdb.insert(doc);

};


// Help page
bot.onText(/\/help/, function (msg) {
  var chatId = msg.chat.id;
  var resp = "This is GBS bots V3. You can control me by sending these commands: \n\n" +
             "\/help   - to display this page\n" +
             "\/add    - to add student in the db\n" +
             "\/list   - to display your booking status\n" +
             "\/lts    - to display list to school\n" +
             "\/lfs    - to display list from school\n" +
             "\/ltsm   - to display list to school from muadz\n" +
             "\/ltss   - to display list to school from serdang\n" +
             "\/us     - to update student e.g. \/us fatini\n" +
             "\/search - search by first, last name & phone number\n" + 
             "\/setting - resetdb, change trip titles\n" + 
             "\/adminsearch - show more info"; 

  log('help', msg);
  bot.sendMessage(chatId, resp);
});


// Matches /info
bot.onText(/\/info/, function (msg) {
  var chatId= msg.chat.id;
  bot.sendMessage(chatId, info);
});

// Matches /faq
bot.onText(/\/faq/, function (msg) {
  var chatId = msg.chat.id;
  bot.sendMessage(chatId, faq);
});


// Matches /faq
bot.onText(/\/getdb/, function (msg) {
  var chatId = msg.chat.id;
  bot.sendDocument(chatId, 'data/tripdb');
});


bot.onText(/\/getcode/, function (msg) {
  var chatId = msg.chat.id;
  bot.sendDocument(chatId, 'mybot.js');
});


// Matches /update student for search
bot.onText(/\/search/, function (msg) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Search student by first name or last name or phone # only. Please enter your search text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
         var listout = '👉Search for: ' + msg1.text + ' 🚌\n';
         var regex = new RegExp(msg1.text, "i");
         tripdb.find({ $or: [{ fname: regex }, { lname: regex }, { phone: regex } , { status_to: regex }, { status_from: regex } ] }, function (err, docs) {
           if (docs.length == 0) listout += 'NO STUDENTS FOUND\n';
           var listout_to = ' 🚩 TO SCHOOL 🚩\n';
           var listout_from = '\n 🚩 FROM SCHOOL 🚩\n';
           var num_to = 0, num_fr = 0;

           for (idx = 0; idx < docs.length; idx++) {
             if (docs[idx].status_to != 'NONE') {
               listout_to += ++num_to + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + ' ' + docs[idx].loc_to + ' ' + docs[idx].status_to + '\n';
             }

             if (docs[idx].status_from != 'NONE') {
               listout_from += ++num_fr + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + ' ' + docs[idx].loc_from + ' ' + docs[idx].status_from + '\n';
             }
           }
           if (num_to == 0) { listout_to += '--- NONE ---\n'; }
           if (num_fr == 0) { listout_from += '--- NONE ---\n'; }
           bot.sendMessage(repChatId, listout + listout_to + listout_from);
         });
      });
  });
});


// Matches /update student for search
bot.onText(/\/adminsearch/, function (msg) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Search student by first name or last name or phone # only. Please enter your search text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
         var listout = '👉Search for: ' + msg1.text + ' 🚌\n';
         var regex = new RegExp(msg1.text, "i");
         tripdb.find({ $or: [{ fname: regex }, { lname: regex }, { phone: regex } ] }, function (err, docs) {
           if (docs.length == 0) listout += 'NO STUDENTS FOUND\n';
           var listout_to = ' 🚩 TO SCHOOL 🚩\n';
           var listout_from = '\n 🚩 FROM SCHOOL 🚩\n';
           var num_to = 0, num_fr = 0;

           for (idx = 0; idx < docs.length; idx++) {
             if (docs[idx].status_to != 'NONE') {
               listout_to += ++num_to + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].class +  ' ' + docs[idx].phone + ' ' + docs[idx].loc_to + ' ' + docs[idx].status_to + '\n';
             }

             if (docs[idx].status_from != 'NONE') {
               listout_from += ++num_fr + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].class +  ' ' + docs[idx].phone + ' ' + docs[idx].loc_from + ' ' + docs[idx].status_from + '\n';
             }
           }
           if (num_to == 0) { listout_to += '--- NONE ---\n'; }
           if (num_fr == 0) { listout_from += '--- NONE ---\n'; }
           bot.sendMessage(repChatId, listout + listout_to + listout_from);
         });
      });
  });
});

// Matches /update student for search
bot.onText(/\/update student/, function (msg) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Search student by first name or last name or phone # only. Please enter your search text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
         var listout = '👉Search for: ' + msg1.text + ' 🚌\n';
         var regex = new RegExp(msg1.text, "i");
         tripdb.find({ $or: [{ fname: regex }, { lname: regex }, { phone: regex } ] }, function (err, docs) {
           if (docs.length == 0) listout += 'NO STUDENTS FOUND\n';
           for (idx = 0; idx < docs.length; idx++) {
             listout += '\/id' + docs[idx].sid + ' : ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
           }
           bot.sendMessage(repChatId, listout);
         });
      });
  });
});

// Matches /us  for update student e.g. /us fatini
bot.onText(/\/us (.+)/, function (msg, token) {
  var chatId = msg.chat.id;

  var listout = '👉Search for: ' + token[1] + ' 🚌\n';
  var regex = new RegExp(token[1], "i");
  tripdb.find({ $or: [{ fname: regex }, { lname: regex }, { phone: regex } ] }, function (err, docs) {
    if (docs.length == 0) listout += 'NO STUDENTS FOUND\n';
    for (idx = 0; idx < docs.length; idx++) {
      listout += '\/id' + docs[idx].sid + ' : ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
    }
    bot.sendMessage(chatId, listout);
  });
});


// Matches /setting only
bot.onText(/^\/setting$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/reset db'],
          ['/set trip to school'],
          ['/set trip from school']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'Choose what you want to set :', opts);
});


bot.onText(/^\/reset db$/, function (msg, token) {
  var chatId = msg.chat.id;
//    tripdb.update({ $or: [{ status_to: 'NONE' }, { status_from: 'NONE' }] }, { $set: { status_to: 'NONE', status_from: 'NONE' } }, function (err, numreplaced) {
    tripdb.update({}, { $set: { status_to: 'NONE', status_from: 'NONE' } }, { multi: true }, function (err, numreplaced) {
        if (err) {
          bot.sendMessage(chatId, 'failed to update ' + token[0]);
        } else {
          bot.sendMessage(chatId, 'sucessful update ' + numreplaced);
        }
   });

   tripdb.persistence.compactDatafile();
});


bot.onText(/^\/set trip to school/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Enter your trip to title text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
        title_to = msg1.text;
        fs.writeFileSync('data/title_to.txt', title_to, 'utf8');
        bot.sendMessage(repChatId, 'title to school has been updated');
      });
  });
});


bot.onText(/^\/set trip from school/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Enter your trip from title text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
        title_fr = msg1.text;
        fs.writeFileSync('data/title_fr.txt', title_fr, 'utf8');
        bot.sendMessage(repChatId, 'title from school has been updated');
      });
  });
});


// Matches /list only
bot.onText(/^\/list$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/list TO school'],
          ['/list FROM school']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'Choose Your  Trip:', opts);
});


// Matches /list only
bot.onText(/^\/list TO school$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/list TO school ALL'],
          ['/list TO school BANAT'],
          ['/list TO school BANIN']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'Choose Your  Trip:', opts);
});


// Matches /list only
bot.onText(/^\/list FROM school$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/list FROM school ALL'],
          ['/list FROM school BANAT'],
          ['/list FROM school BANIN']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'Choose Your  Trip:', opts);
});


// Matches /list from school
bot.onText(/\/list FROM school (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');
  var listout = '🚌 Student Trip ' + cmd[1] + ' ' + cmd[2] + ' PAID\n';

  var jsoncmd;
  if (cmd[3] == 'BANAT') {
    jsoncmd = { $and: [{ status_from: 'PAID' }, { gender: 'BANAT' }] };
  } else if (cmd[3] == 'BANIN') {
    jsoncmd = { $and: [{ status_from: 'PAID' }, { gender: 'BANIN' }] };
  } else {
    jsoncmd = { status_from: 'PAID' };
  }

    tripdb.find( jsoncmd ).sort({ loc_from: 1, gender: 1, fname: 1}).exec(function (err, docs) {
      var iniLoc = "whereever";
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniLoc != docs[idx].loc_from) {
           // new list reset
           num = 1;
           iniGender = "whatever";

           iniLoc = docs[idx].loc_from;
           listout += '\n  🚩🚩🚩 ' + iniLoc + ' 🚩🚩🚩\n';
        }
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});


// Matches /lts list to school
bot.onText(/^\/lts$/, function (msg, token) {
  var chatId = msg.chat.id;
  var listout = '🚌 Student Trip: ' + title_to + '\n';

    tripdb.find({ status_to: 'PAID' }).sort({ loc_to: 1, gender: 1, fname: 1 }).exec(function (err, docs) {
      var iniLoc = "whereever";
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniLoc != docs[idx].loc_to) {
           // new list reset
           num = 1;
           iniGender = "whatever";

           iniLoc = docs[idx].loc_to;
           listout += '\n  🚩🚩🚩 ' + iniLoc + ' 🚩🚩🚩\n';
        }
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});

// Matches /ltsm list to school
bot.onText(/^\/ltsm$/, function (msg, token) {
  var chatId = msg.chat.id;
  var listout = '🚌 Student Trip TO SCHOOL from MUADZ\n';

    tripdb.find({ $and: [{ status_to: 'PAID' }, { loc_to: 'MUADZ' }] }).sort({ gender: 1, fname: 1 }).exec(function (err, docs) {
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});

// Matches /ltss list to school
bot.onText(/^\/ltss$/, function (msg, token) {
  var chatId = msg.chat.id;
  var listout = '🚌 Student Trip TO SCHOOL from SERDANG\n';

    tripdb.find({ $and: [{ status_to: 'PAID' }, { loc_to: 'SERDANG' }] }).sort({ gender: 1, fname: 1 }).exec(function (err, docs) {
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});


// list from school
bot.onText(/^\/lfs$/, function (msg, token) {
  var chatId = msg.chat.id;
  var listout = '🚌 Student Trip: ' + title_fr + '\n';

    tripdb.find({ status_from: 'PAID' }).sort({ loc_from: 1, gender: 1, fname: 1}).exec(function (err, docs) {
      var iniLoc = "whereever";
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniLoc != docs[idx].loc_from) {
           // new list reset
           num = 1;
           iniGender = "whatever";

           iniLoc = docs[idx].loc_from;
           listout += '\n  🚩🚩🚩 ' + iniLoc + ' 🚩🚩🚩\n';
        }
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});


// Matches /list to or from school
bot.onText(/\/list TO school (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');
  var listout = '🚌 Student Trip ' + cmd[1] + ' ' + cmd[2] + ' PAID\n';

  var jsoncmd;
  if (cmd[3] == 'BANAT') {
    jsoncmd = { $and: [{ status_to: 'PAID' }, { gender: 'BANAT' }] };
  } else if (cmd[3] == 'BANIN') {
    jsoncmd = { $and: [{ status_to: 'PAID' }, { gender: 'BANIN' }] };
  } else {
    jsoncmd = { status_to: 'PAID' };
  }

    tripdb.find( jsoncmd ).sort({ loc_to: 1, gender: 1, fname: 1 }).exec(function (err, docs) {
      var iniLoc = "whereever";
      var iniGender = "whatever";
      var num = 1;

      if (docs.length == 0) listout = "NO Students for this trip\n";

      for (idx = 0; idx < docs.length; idx++) {
        if (iniLoc != docs[idx].loc_to) {
           // new list reset
           num = 1;
           iniGender = "whatever";

           iniLoc = docs[idx].loc_to;
           listout += '\n  🚩🚩🚩 ' + iniLoc + ' 🚩🚩🚩\n';
        }
        if (iniGender != docs[idx].gender) {
           num = 1;
           iniGender = docs[idx].gender;
           listout += '\n🐼 ' + iniGender + ' 🐼\n';
        }

        listout += num++ + '. ' + docs[idx].fname + ' ' + docs[idx].lname + ' ' + docs[idx].phone + '\n';
     }
     bot.sendMessage(chatId, listout);
   });
});


// Matches student id 
bot.onText(/^\/id\d+$/, function (msg, token) {
  var chatId = msg.chat.id;
  var sid = msg.text.substring(3);
  tripdb.find({ sid : Number(sid) }, function (err, docs) {
    if (docs.length == 0) {
      bot.sendMessage(chatId, 'STUDENTS with ID ' + sid + ' NOT FOUND\n');
    } else {
      var listout =  docs[0].fname + ' ' + docs[0].lname + ' ' + docs[0].class + ' ' + docs[0].gender  + ' ' + docs[0].phone + '\n';
      listout += '-- TO School   : ' + docs[0].loc_to + ' ' + docs[0].status_to + '\n';
      listout += '-- FROM School : ' + docs[0].loc_from + ' ' + docs[0].status_from + '\n';
      var opts = {
       reply_to_message_id: msg.message_id,
       reply_markup: JSON.stringify({
        keyboard: [
          ['/PAID to school id' + sid],
          ['/PAID from school id' + sid],
          ['/CANCELLED to school id' + sid],
          ['/CANCELLED from school id' + sid],
          ['/UNPAID to school id' + sid],
          ['/UNPAID from school id' + sid],
          ['/PICKUP point MUADZ to school id' + sid],
          ['/PICKUP point SERDANG to school id' + sid],
          ['/PHONE NUMBER changed id' + sid],
          ['/CLASS changed id' + sid],
          ['/FIRSTNAME changed id' + sid],
          ['/LASTNAME changed id' + sid]],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
       })
      };
      listout += 'What status do you want to update: \n';
      bot.sendMessage(chatId, listout, opts);
    }
  });
});


// Matches /PHONE e.g. /PHONE NUMBER changed id1
bot.onText(/\/PHONE (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');

  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
  };

  var phone;
  var msgtxt = 'Enter Phone Number: ';
  bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
    var rep1MessageId = sended.message_id;
    bot.onReplyToMessage(chatId, rep1MessageId, function (msg1) {
      phone = msg1.text;

      tripdb.update({ sid: Number(cmd[3].substring(2)) }, { $set: { phone: phone } }, function (err, numreplaced) {
        if (err) {
          bot.sendMessage(chatId, 'failed to update ' + token[0]);
        } else {
          bot.sendMessage(chatId, 'sucessful update ' + token[0]);
        }
      });
    });
  });
});


// /CLASS changed id9
bot.onText(/\/CLASS (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');

  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
  };

  var sclass;
  var msgtxt = 'Enter student class e.g (1F): ';
  bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
    var rep1MessageId = sended.message_id;
    bot.onReplyToMessage(chatId, rep1MessageId, function (msg1) {
      sclass = msg1.text;

      tripdb.update({ sid: Number(cmd[2].substring(2)) }, { $set: { class: sclass} }, function (err, numreplaced) {
        if (err) {
          bot.sendMessage(chatId, 'failed to update ' + token[0]);
        } else {
          bot.sendMessage(chatId, 'sucessful update ' + token[0]);
        }
      });
    });
  });
});

// /FIRSTNAME changed id9
bot.onText(/\/FIRSTNAME (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');

  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
  };

  var sclass;
  var msgtxt = 'Enter student first name: ';
  bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
    var rep1MessageId = sended.message_id;
    bot.onReplyToMessage(chatId, rep1MessageId, function (msg1) {
      sfn = msg1.text;

      tripdb.update({ sid: Number(cmd[2].substring(2)) }, { $set: { fname: sfn} }, function (err, numreplaced) {
        if (err) {
          bot.sendMessage(chatId, 'failed to update ' + token[0]);
        } else {
          bot.sendMessage(chatId, 'sucessful update ' + token[0]);
        }
      });
    });
  });
});

// /LASTNAME changed id9
bot.onText(/\/LASTNAME (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');

  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
  };

  var sclass;
  var msgtxt = 'Enter student last name: ';
  bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
    var rep1MessageId = sended.message_id;
    bot.onReplyToMessage(chatId, rep1MessageId, function (msg1) {
      sfn = msg1.text;

      tripdb.update({ sid: Number(cmd[2].substring(2)) }, { $set: { lname: sfn} }, function (err, numreplaced) {
        if (err) {
          bot.sendMessage(chatId, 'failed to update ' + token[0]);
        } else {
          bot.sendMessage(chatId, 'sucessful update ' + token[0]);
        }
      });
    });
  });
});


// Matches /PICKUP e.g. /PICKUP point MUADZ to school id9
bot.onText(/\/PICKUP (.+)/, function (msg, token) {
  var chatId = msg.chat.id;

  var cmd = msg.text.split(' ');

  if (cmd[2] == 'MUADZ') {
    tripdb.update({ sid: Number(cmd[5].substring(2)) }, { $set: { loc_to : 'MUADZ' } }, function (err, numreplaced) {
      log(token[0] + ' Updated ', msg);
      if (err) {
        bot.sendMessage(chatId, 'failed to update ' + token[0]);
      } else {
        bot.sendMessage(chatId, 'sucessful update ' + token[0]);
      }
    });
  } else if (cmd[2] == 'SERDANG') {
    tripdb.update({ sid: Number(cmd[5].substring(2)) }, { $set: { loc_to : 'SERDANG' } }, function (err, numreplaced) {
      log(token[0] + ' Updated ', msg);
      if (err) {
        bot.sendMessage(chatId, 'failed to update ' + token[0]);
      } else {
        bot.sendMessage(chatId, 'sucessful update ' + token[0]);
      }
    });

  } else {
    bot.sendMessage(chatId, 'I don\'t recognized the command ' + token[0]);
  }

});


// Matches /PAID to or from school e.g. /PAID to school id87
bot.onText(/\/PAID (.+)/, function (msg, token) {
  var chatId = msg.chat.id;

  var cmd = msg.text.split(' ');
  var jsonupdate;
  var valid = true;

  if (cmd[1] == 'to') {
     jsonupdate = {status_to : 'PAID'};
  } else if (cmd[1] == 'from') {
     jsonupdate = {status_from : 'PAID'};
  } else {
    valid = false;
  }

  if (valid) {
    tripdb.update({ sid: Number(cmd[3].substring(2)) }, { $set: jsonupdate }, function (err, numreplaced) {
      log(token[0] + ' Updated ', msg);
      if (err) {
        bot.sendMessage(chatId, 'failed to update ' + token[0]);
      } else {
        bot.sendMessage(chatId, 'sucessful update ' + token[0]);
      }
    });
  } else {
    bot.sendMessage(chatId, 'I don\'t recognized the command ' + token[0]);
  }

});

// Matches /UNPAID to or from school e.g. /UNPAID to school id87
bot.onText(/\/UNPAID (.+)/, function (msg, token) {
  var chatId = msg.chat.id;

  var cmd = msg.text.split(' ');
  var jsonupdate;
  var valid = true;

  if (cmd[1] == 'to') {
     jsonupdate = {status_to : 'NONE'};
  } else if (cmd[1] == 'from') {
     jsonupdate = {status_from : 'NONE'};
  } else {
    valid = false;
  }

  if (valid) {
    tripdb.update({ sid: Number(cmd[3].substring(2)) }, { $set: jsonupdate }, function (err, numreplaced) {
      log(token[0] + ' Updated ', msg);
      if (err) {
        bot.sendMessage(chatId, 'failed to update ' + token[0]);
      } else {
        bot.sendMessage(chatId, 'sucessful update ' + token[0]);
      }
    });
  } else {
    bot.sendMessage(chatId, 'I don\'t recognized the command ' + token[0]);
  }

});


// Matches /CANCELLED to or from school e.g. /CANCELLED to school id87
bot.onText(/\/CANCELLED (.+)/, function (msg, token) {
  var chatId = msg.chat.id;

  var cmd = msg.text.split(' ');
  var jsonupdate;
  var valid = true;

  if (cmd[1] == 'to') {
     jsonupdate = {status_to : 'CANCELLED'};
  } else if (cmd[1] == 'from') {
     jsonupdate = {status_from : 'CANCELLED'};
  } else {
    valid = false;
  }

  if (valid) {
    tripdb.update({ sid: Number(cmd[3].substring(2)) }, { $set: jsonupdate }, function (err, numreplaced) {
      log(token[0] + ' Updated ', msg);
      if (err) {
        bot.sendMessage(chatId, 'failed to update ' + token[0]);
      } else {
        bot.sendMessage(chatId, 'sucessful update ' + token[0]);
      }
    });
  } else {
    bot.sendMessage(chatId, 'I don\'t recognized the command ' + token[0]);
  }

});


// Matches /add only
bot.onText(/^\/add/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
  };

  var fname, lname, phone, gender;
  var msgtxt = 'Enter student first name: ';
  bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
    var rep1MessageId = sended.message_id;
    bot.onReplyToMessage(chatId, rep1MessageId, function (msg1) {
      fname = msg1.text;

      msgtxt = 'Enter student last name: ';
      opts = {
        reply_to_message_id: msg1.message_id,
        reply_markup: JSON.stringify({
          force_reply: true,
          selective: true
        })
      };

      bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
        var rep2MessageId = sended.message_id;
        bot.onReplyToMessage(chatId, rep2MessageId, function (msg2) {
          lname = msg2.text;

          msgtxt = 'Enter student gender (BANIN/BANAT): ';
          opts = {
            reply_to_message_id: msg2.message_id,
            reply_markup: JSON.stringify({
              force_reply: true,
              selective: true
            })
          };

          bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
            var rep3MessageId = sended.message_id;
            bot.onReplyToMessage(chatId, rep3MessageId, function (msg3) {
              gender = msg3.text.toUpperCase();

              msgtxt = 'Enter phone number: ';
              opts = {
                reply_to_message_id: msg3.message_id,
                reply_markup: JSON.stringify({
                  force_reply: true,
                  selective: true
                })
              };

              bot.sendMessage(chatId, msgtxt, opts).then(function (sended) {
                var rep4MessageId = sended.message_id;
                bot.onReplyToMessage(chatId, rep4MessageId, function (msg4) {
                  phone = msg4.text;

                  tripdb.count({}, function (err, count) {
                    count = count + 5; // missing 4 id
                    var jsonadd = { sid: count, fname: fname, lname: lname, phone: phone, gender: gender, class: 'NONE', loc_to: 'MUADZ', status_to: 'NONE', loc_from: 'MUADZ', status_from: 'NONE' };
                    tripdb.insert(jsonadd, function (err, newDoc) {
                      if (err) {
                        bot.sendMessage(chatId, 'failed to add: ' + JSON.stringify(jsonadd));
                      } else {
                        bot.sendMessage(chatId, 'sucessful added: ' + JSON.stringify(newDoc));
                      }
                    });
                  });
                });
              });
            });
          });       
        });       
      });       
    });       
  });
});



// Matches /update faq only
bot.onText(/^\/update faq/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Enter your FAQ text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
        faq = msg1.text;
        fs.writeFileSync('data/faq.txt', faq, 'utf8');
        bot.sendMessage(repChatId, 'FAQ has been updated');
      });
  });
});

// Matches /update only
bot.onText(/^\/u$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/update info'],
          ['/update faq'],
          ['/update student']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'What do you want to update:', opts);
});


// Matches /update info only
bot.onText(/^\/update info/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        force_reply: true,
        selective: true
      })
    };
  var msgtxt = 'Enter your info text: ';
  bot.sendMessage(chatId, msgtxt, opts)
    .then(function (sended) {
      var repChatId = sended.chat.id;
      var repMessageId = sended.message_id;
      bot.onReplyToMessage(repChatId, repMessageId, function (msg1) {
        info = msg1.text;
        fs.writeFileSync('data/info.txt', info, 'utf8');
        bot.sendMessage(repChatId, 'INFO has been updated');
      });
  });
});



// Matches /hist
bot.onText(/\/hist/, function (msg) {
  var fromId = msg.from.id;
  var user =  msg.from.username;
  histdb.find({}, function (err, docs) {
  // docs is an array containing documents Mars, Earth, Jupiter
  // If no document is found, docs is equal to []
	var histout = '👮Actions issued by:  ' + user + '👮\n';
        for (idx = 0; idx < docs.length; idx++) {
		histout += docs[idx].date + ' ' + docs[idx].action + '\n';
        }
        bot.sendMessage(fromId, histout);
  });
});


// Matches /update only
bot.onText(/^\/stat$/, function (msg, token) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['/stat TO school'],
          ['/stat FROM school']],
        resize_keyboard: true,
        one_time_keyboard: true,
        selective: true
      })
    };

  bot.sendMessage(chatId, 'What stat you want to see:', opts);
});


// Matches /stat
// "sid":19,"fname":"Nur Diana","lname":"Mohd Zul","phone":192285627,"gender":"BANAT","class":"2H","loc_to":"MUADZ","status_to":"NONE","loc_from":"MUADZ","status_from":"NONE"
bot.onText(/\/stat (.+)/, function (msg, token) {
  var chatId = msg.chat.id;
  var cmd = msg.text.split(' ');

  var listout = '📊 Statistics 📊\n';
  tripdb.find({ }).exec(function (err, docs) {
    var numToMuadzBaninPaid = 0, numToMuadzBaninCancel = 0, numToMuadzBanatPaid = 0, numToMuadzBanatCancel = 0;
    var numFrMuadzBaninPaid = 0, numFrMuadzBaninCancel = 0, numFrMuadzBanatPaid = 0, numFrMuadzBanatCancel = 0;
    var numToSerBaninPaid = 0, numToSerBaninCancel = 0, numToSerBanatPaid = 0, numToSerBanatCancel = 0; 
    for (idx = 0; idx < docs.length; idx++) {
      if (docs[idx].loc_to == 'MUADZ') {
        if (docs[idx].gender == 'BANIN') {
          if (docs[idx].status_to == 'PAID') {
            numToMuadzBaninPaid++;
          } else if (docs[idx].status_to == 'CANCELLED') {
            numToMuadzBaninCancel++;
          }
        } else if (docs[idx].gender == 'BANAT'){
          if (docs[idx].status_to == 'PAID') {
            numToMuadzBanatPaid++;
          } else if (docs[idx].status_to == 'CANCELLED') {
            numToMuadzBanatCancel++;
          }
        }
      } else if (docs[idx].loc_to == 'SERDANG') {
        if (docs[idx].gender == 'BANIN') {
          if (docs[idx].status_to == 'PAID') {
            numToSerBaninPaid++;
          } else if (docs[idx].status_to == 'CANCELLED') {
            numToSerBaninCancel++;
          }
        } else if (docs[idx].gender == 'BANAT'){
          if (docs[idx].status_to == 'PAID') {
            numToSerBanatPaid++;
          } else if (docs[idx].status_to == 'CANCELLED') {
            numToSerBanatCancel++;
          }
        }
      } // end if i.e TO 

      if (docs[idx].loc_from == 'MUADZ') {
        if (docs[idx].gender == 'BANIN') {
          if (docs[idx].status_from == 'PAID') {
            numFrMuadzBaninPaid++;
          } else if (docs[idx].status_from == 'CANCELLED') {
            numFrMuadzBaninCancel++;
          }
        } else if (docs[idx].gender == 'BANAT'){
          if (docs[idx].status_from == 'PAID') {
            numFrMuadzBanatPaid++;
          } else if (docs[idx].status_from == 'CANCELLED') {
            numFrMuadzBanatCancel++;
          }
        }
      } // end from

    } // end for

    if (cmd[1] == 'TO') {
      listout += '🚌 TRIP TO SCHOOL \n';
      listout += '1. MUADZ \n';
      listout += '   a. Banat \n';
      listout += '      - PAID: ' + numToMuadzBanatPaid + '\n';
      listout += '      - CANCELLED: ' + numToMuadzBanatCancel + '\n';
      listout += '   b. Banin \n';
      listout += '      - PAID: ' + numToMuadzBaninPaid + '\n';
      listout += '      - CANCELLED: ' + numToMuadzBaninCancel + '\n\n';
      listout += '2. SERDANG \n';
      listout += '   a. Banat \n';
      listout += '      - PAID: ' + numToSerBanatPaid + '\n';
      listout += '      - CANCELLED: ' + numToSerBanatCancel + '\n';
      listout += '   b. Banin \n';
      listout += '      - PAID: ' + numToSerBaninPaid + '\n';
      listout += '      - CANCELLED: ' + numToSerBaninCancel;

    } else if (cmd[1] == 'FROM') {
      listout += '🚌 TRIP FROM SCHOOL \n';
      listout += '1. MUADZ \n';
      listout += '   a. Banat \n';
      listout += '      - PAID: ' + numFrMuadzBanatPaid + '\n';
      listout += '      - CANCELLED: ' + numFrMuadzBanatCancel + '\n';
      listout += '   b. Banin \n';
      listout += '      - PAID: ' + numFrMuadzBaninPaid + '\n';
      listout += '      - CANCELLED: ' + numFrMuadzBaninCancel + '\n\n';
    }

    bot.sendMessage(chatId, listout);
  });
});


// Matches /love
bot.onText(/\/love/, function (msg) {
  var chatId = msg.chat.id;
  var opts = {
      reply_to_message_id: msg.message_id,
      reply_markup: JSON.stringify({
        keyboard: [
          ['Yes, you are the bot of my life ❤'],
          ['No, sorry there is another one...']],
	one_time_keyboard: true
      })
    };
    bot.sendMessage(chatId, 'Do you love me?', opts);
});


