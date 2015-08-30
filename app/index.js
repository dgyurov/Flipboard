var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var path = require('path');
var fs = require('fs');
var initPath, data, savedWidth, savedHeight, splashWindow, mainWindow, onlineStatusWindow, isOnline;

app.on('ready', function() {
    'use strict';
    initPath = path.join(app.getDataPath(), 'init.json');

    //Init the splash screen
    splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        resizable: false
    });

    //Load the splash.html into the splash Window
    splashWindow.loadUrl('file://' + __dirname + '/splash.html');

    //Init online status window
    onlineStatusWindow = new BrowserWindow({
        width: 0,
        height: 0,
        show: false
    });
    onlineStatusWindow.loadUrl('file://' + __dirname + '/online-status.html');

    //Try to load previous configurations
    try {
        data = JSON.parse(fs.readFileSync(initPath, 'utf8'));
    } catch (e) {
        console.log('Houston, we have a problem.');
    }

    //Determine the bounds of the main window
    savedWidth = (data && data.bounds) ? data.bounds.width : 1100;
    savedHeight = (data && data.bounds) ? data.bounds.height : 600;

    //Init the main window
    mainWindow = new BrowserWindow({
        width: savedWidth,
        height: savedHeight,
        title: 'Flipboard',
        icon: '/resources/logo.png',
        'web-preferences': {
            'web-security': false
        },
        'node-integration': false,
        show: false
    });

    //init isOnline to false
    isOnline = false;

    //Load Url into the main window
    mainWindow.loadUrl('http://flipboard.com/signin');
    mainWindow.webContents.on('did-finish-load', function() {
        if (isOnline) {
            if (splashWindow.isVisible()) {
                splashWindow.hide();
            }
            mainWindow.show();
        }
    });

    //Status event listener
    ipc.on('online-status-changed', function(event, status) {
        isOnline = (status === 'online') ? true : false;

        if (isOnline) {
            mainWindow.reload();
        } else {
            mainWindow.hide();
            splashWindow.show();
        }
    });

    //On close event listener
    mainWindow.on('close', function() {
        var data = {
            bounds: mainWindow.getBounds()
        };
        fs.writeFileSync(initPath, JSON.stringify(data));
    });
});
