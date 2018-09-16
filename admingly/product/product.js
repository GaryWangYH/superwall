const express = require('express');
const fs = require('fs');

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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product", menuClick: 0, itemClick: 0  })
            });
        }
    });

    router.use("/hss", require('./hss.js')());
    router.use("/ddos", require('./ddos.js')());

    router.use("/elastic", require('./elastic/elastic.js')());

    router.use("/discount", require('./discount/discount.js')());

    router.use("/os", require('./os/os.js')());

    router.use("/agreement", require('./agreement/agreement.js')());

    return router;
}