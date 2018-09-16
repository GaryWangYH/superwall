const express = require('express');
const fs = require('fs');

module.exports = function() {
    var router = express.Router();

    var menu = {};
    fs.readFile('./static/txt/admin_center_view_menu.txt', function(err, data) {
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "view", menuClick: 0, itemClick: 0 })
            });
        }
    });

    router.use("/swiper", require('./swiper.js')());
    router.use("/partner", require('./partner.js')());
    router.use("/other", require('./other.js')());

    router.use("/nav_ddos", require('./nav_ddos.js')());
    router.use("/nav_plan", require('./nav_plan.js')());

    router.use("/officialAnnouncement", require('./news/officialAnnouncement.js')());
    router.use("/industryNews", require('./news/industryNews.js')());
    router.use("/news_view", require('./news/news_view.js')());

    //页面 高防服务器
    router.use("/hss/hss_nav", require('./hss/hss_nav.js')());
    router.use("/hss/hss_home", require('./hss/hss_home.js')());
    router.use("/hss/hss_machineRoom", require('./hss/hss_machineRoom.js')());

    router.use("/recentActivity/recentActivity", require('./recentActivity/recentActivity.js')());

    return router;
}