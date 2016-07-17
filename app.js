var restify = require('restify');
var builder = require('botbuilder');
var util = require('util');
var http = require('http');
var emp = null;

var jsonAdherents = [
            {"nom":"Zielinski", "prenom":"Gilles", "licence":"5917952F", "adresse":"23, rue Racine 78114 Magny les Hameaux","datenaissance":"05/02/1973"},
            {"nom":"Toulalan", "prenom":"Eric", "licence":"1027450T", "adresse":"5 rue d Uzès 75002 Paris", "datenaissance":"23/10/1968"}
            ];

//http://api.openweathermap.org/data/2.5/weather?q=Bourges,France&lang=fr&units=metric&APPID=0e95c87e2d9dbba419f06b37f769102c
var OpenWeatherOptions = {
    host: 'api.openweathermap.org',
    port: '80',
    path: '/data/2.5/weather?q=%s,%s&lang=fr&units=metric&APPID=0e95c87e2d9dbba419f06b37f769102c',
    method: 'GET'
};

function GetMeteoData(err, city, country, temperature) {
    console.log('Before openweather call');
    OpenWeatherOptions.path = util.format(OpenWeatherOptions.path, city, country);
    http.request(OpenWeatherOptions, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            emp = JSON.parse(data);
            temperature(null, emp.main.temp);
            console.log('Temperature found %s', temperature);
        });
 
    }).end();    
};

//http://openweathermap.org/img/w/10d.png

var botMode = 'Chat'

if (botMode == 'Chat')
{
//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
// Create chat bot
//    <add key="MicrosoftAppId" value="904d56e0-9ba0-4474-9cea-df2f6fe90572" />
//    <add key="MicrosoftAppPassword" value="NiubOFNVodc5V1ObiJqYWWL" />
var connector = new builder.ChatConnector({
    appId: "6c34581c-87b1-4fca-b6fa-0556ae678fce", //process.env.BOT_APP_ID, //  "6c34581c-87b1-4fca-b6fa-0556ae678fce",
    appPassword: "1E0PVYEABGmmgdrGqwo7afW"//process.env.BOT_APP_PWD //"1E0PVYEABGmmgdrGqwo7afW"
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
}
else if (botMode == 'Console')
{
    var connector = new builder.ConsoleConnector().listen();
    var bot = new builder.UniversalBot(connector);
}
//=========================================================
// Bots Dialogs
//=========================================================
var intents = new builder.IntentDialog();
bot.dialog('/', intents);

intents.matches(/^meteo/i, [
    function (session) {
        session.beginDialog('/meteo');
    },
    function (session, results) {
        var retTemp ;
        session.send(util.format('Je consulte immédiatement la météo de %s, %s', session.userData.city, session.userData.country ));
        GetMeteoData(null, session.userData.city, session.userData.country , function(err, temperature){
            retTemp = temperature;
            session.send('La temperature est de %s', retTemp);
            session.send('http://openweathermap.org/img/w/10d.png');
        });
    }
]);

intents.matches(/^inscri/i, [
    function (session) {
        session.beginDialog('/registration');
    },
    function (session, results) {
        session.send('Merci %s, j\'ai tout noté', session.userData.prenom);
    }
]);


intents.matches(/^change name/i, [
    function (session) {
        session.beginDialog('/profile');
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.onDefault([
    function (session, args, next) {
        if (!session.userData.nom) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.userData.prenom);
    }
]);

/*bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s !', session.userData.name);
    }
]);*/

bot.dialog('/profile', [
    function (session) {
        session.userData = null;
        
        session.send("Bienvenue sur le BOT du Tennis Club de Magny les Hameaux");
        builder.Prompts.text(session,"Pouvez-vous me rappeler votre numéro de licence ?");
    },
    function (session, results) {
        session.send('Bonjour %s !', results.response);
        session.userData.licence = results.response;
        
        console.log('%s listening', results.response); 
        
        var myFilteredData = jsonAdherents.filter(function(obj) {
        return obj.licence === session.userData.licence;
        });
        
        session.userData.nom = myFilteredData[0].nom;
        session.userData.prenom = myFilteredData[0].prenom;
        session.userData.adresse = myFilteredData[0].adresse;
        session.userData.licence = myFilteredData[0].licence;
        session.userData.datenaissance = myFilteredData[0].datenaissance;
        session.userData.adresse = myFilteredData[0].adresse;
        
        session.endDialog();
    }
]);

bot.dialog('/meteo', [
    function (session) {
        builder.Prompts.text(session,"La météo, bien sûr... Dans quelle ville ?");
    },
    function (session, results) {
        //session.send('Bonjour %s !', results.response);
        session.userData.city = results.response;
        builder.Prompts.text(session,util.format('%s, dans quel pays ? Je ne suis pas fort en géographie', session.userData.city));
    },
    function (session, results) {
        //session.send('Bonjour %s !', results.response);
        session.userData.country = results.response;
        session.endDialog();
    }
]);

bot.dialog('/registration', [
    function (session) {
        session.send("Vous souhaitez vous réinscrire ? Merci de votre confiance");
        session.send("Commençons par quelques petits renseignements");
        builder.Prompts.text(session,util.format("Etes-vous bien %s %s", session.userData.nom, session.userData.prenom ));
    },
    function (session, results) {
        //session.send('Bonjour %s !', results.response);
        session.userData.city = results.response;
        builder.Prompts.text(session,util.format('Vous nous aviez communiqué cette adresse : %s \r\n Est-elle toujours valide ?', session.userData.adresse));
    },
    function (session, results) {
        //session.send('Bonjour %s !', results.response);
        session.userData.country = results.response;
        session.endDialog();
    }
]);

/*bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.send('Hello %s!', results.response);
    }
]);*/

