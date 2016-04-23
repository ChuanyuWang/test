module.exports = {
    //secret : 'e284d26a4c30dddb295b6dbade703732',
    port : 7004,
    log4js : {
        appenders : [{
                type : "console"
            }
        ],
        replaceConsole : true
    },
    mongodb : {
        uri : "mongodb://localhost/config?authSource=admin",
        options : {
            db : {
                native_parser : true,
                authSource : 'admin'
            },
            server : {
                poolSize : 3,
                socketOptions : {
                    keepAlive : 120
                }
            },
            user : 'admin',
            pass : '39fe4847-6ecb-431c-9647-23160a80db54'
        }
    },
    test : {
        appid : 'wxe5e454c5dff8c7b2',
        appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
        token : 'Hibanana',
        encodingAESKey : '',
        tenant : "test",
        name : '大Q小q'
    },
    bqsq : {
        appid : 'your appid',
        token : 'YOUR token',
        encodingAESKey : 'YOUR encodingAESKey',
    },
    mygirl : {
        appid : 'wx44ade48e4f86c081',
        token : 'Hibanana',
        encodingAESKey : 'SIA3ze7mGjCEpvTlhp5n3OjjRrD8QAPcHQDpklRp4uE'
    }
};
