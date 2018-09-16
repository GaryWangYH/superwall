const express = require('express');
const fs = require('fs');

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_user_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user", menuClick: 0, itemClick: 0})
            });
        }
    });

    router.use("/user", require('./user.js')());
    router.use("/admin", require('./admin.js')());

    router.use("/user_view", require('./user_view.js')());
    router.use("/admin/new", require('./admin_view.js')());

    router.use("/permission", require('./permission.js')());

    router.use("/service", require('./service.js')());

    return router;
}