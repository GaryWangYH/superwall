const express = require('express');
const fs = require('fs');

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_center_menu.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            menu = JSON.parse(data.toString());
        }
    });

    fs.readFile('./static/txt/admin_center_nav.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            var nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "other", menuClick: 0, itemClick: 0  })
            });
        }
    });

    router.use("/bill", require('./bill/bill.js')());
    router.use("/report", require('./report.js')());
    router.use("/message", require('./message/message.js')());
    return router;
}