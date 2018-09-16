const express = require('express');
const fs = require('fs');

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_order_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "trade", menuClick: 1 , itemClick: 0 });
            });
        }
    });

    router.use("/hss", require('./hss/hss.js')());
    router.use("/hss/delivery", require('./hss/hss_delivery.js')());
    router.use("/hss/detail", require('./hss/hss_detail.js')());
    router.use("/hss/discount", require('./hss/hss_discount.js')());
    router.use("/hss/discount/detail", require('./hss/hss_discount_detail.js')());

    router.use("/ddos", require('./ddos/ddos.js')());
    router.use("/ddos/detail", require('./ddos/ddos_detail.js')());
    router.use("/ddos/delivery", require('./ddos/ddos_delivery.js')());
   

    router.use("/elastic", require('./elastic/elastic.js')());
    router.use("/elastic/detail", require('./elastic/elastic_detail.js')());
    router.use("/elastic/delivery", require('./elastic/elastic_delivery.js')());
     
    router.use("/hss/control", require('./hss/hss_control.js')());
    router.use("/ddos/control", require('./ddos/ddos_control.js')());
    router.use("/elastic/control", require('./elastic/elastic_control.js')());

    return router;
}