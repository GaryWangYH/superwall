const express = require('express');
const fs = require('fs');

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_admin_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "other_log", menuClick: 3, itemClick: 0 })
            });
        }
    });

    router.use("/admin", require('./admin_log.js')());
    router.use("/sys", require('./sys_log.js')());
    router.use("/user", require('./user_log.js')());
    router.use("/admin_login", require('./admin_login.js')());
    router.use("/user_login", require('./user_login.js')());

    return router;
}