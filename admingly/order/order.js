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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "order", menuClick: 0 , itemClick: 0 });
            });
        }
    });
    router.use("/hssapply/detail",require('./hss/hssapply_detail.js')());
    router.use("/hssapply",require('./hss/hssapply.js')());
    router.use("/hss", require('./hss/hss.js')());
    router.use("/hss/detail", require('./hss/hss_detail.js')());
    router.use("/hss/reset", require('./hss/hss_reset.js')());

    router.use("/ddos", require('./ddos/ddos.js')());
    router.use("/ddos/detail", require('./ddos/ddos_detail.js')());
    router.use("/ddosapply/detail",require('./ddos/ddosapply_detail.js')());
    router.use("/ddosapply",require('./ddos/ddosapply.js')());
    router.use("/ddos/reset", require('./ddos/ddos_reset.js')());

    router.use("/elastic", require('./elastic/elastic.js')());
    router.use("/elastic/detail", require('./elastic/detail.js')());
    router.use("/recharge", require('./recharge.js')());
    router.use("/refund", require('./refund.js')());
    router.use("/elastic/reset", require('./elastic/elastic_reset.js')());

    router.use("/run/ddos", require('./run/ddos_run.js')());
    router.use("/run/elastic", require('./run/elastic_run.js')());
    router.use("/run/hss", require('./run/hss_run.js')());
    
    return router;
}