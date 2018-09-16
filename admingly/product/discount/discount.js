const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_product_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_discount", menuClick: 0, itemClick: 3  })
            });
        }
    });

    router.use("/hss", require('./hss.js')());
    router.use("/ddos", require('./ddos.js')());
    router.use("/elastic", require('./elastic.js')());

    return router;
}