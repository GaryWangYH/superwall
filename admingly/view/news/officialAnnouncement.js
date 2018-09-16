const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const moment = require('moment');

var db = common.db();

module.exports = function() {
    var router = express.Router();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    var nav;

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
            nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "officialAnnouncement", menuClick: 1, itemClick: 0 });
            });
        }
    });

    router.use("/new", require('./news_view.js')(0, "new"));

    router.use("/edit", require('./news_view.js')(0, "edit"));

    router.post("/editSubmit", urlencodedParser, (req, res) => {
        var operation = req.body.operation;
        var type = req.body.type;
        var inHomePage;
        if (req.body.inHomePage == "on") {
            inHomePage = 1;
        } else {
            inHomePage = 0;
        }
        var title = req.body.title;
        var outline = req.body.outline;
        var content = req.body.content;
        var author = req.session['admin_id'];
        var news_id = req.body.news_id;

        if (operation == "new") {
            db.query(`INSERT INTO data_news VALUES \
                (replace(UUID(),'-',''), '${type}','${inHomePage}','${author}',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}','${title}','${outline}'\
                ,'${content}')`, (err, data) => {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {

                    //** 添加日志 **
                    common.log_admin(req.session['admin_id'],"新增公告",`新增一条公告`);

                    res.status(200).send({ msg: "新建成功", type: 0 }).end();
                }
            });
        } else if (operation == "edit") {
            db.query(`UPDATE data_news SET news_type = '${type}', news_inHomePage = '${inHomePage}',\
                news_title='${title}',news_outline='${outline}',news_main='${content}' WHERE news_id = '${news_id}'`,
                (err, data) => {
                    if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
                    } else {

                        //** 添加日志 **
                        common.log_admin(req.session['admin_id'],"修改公告",`修改一条公告`);

                        res.status(200).send({ msg: "修改成功", type: 0 }).end();
                    }
                });
        }
    });

    router.get('/delete',(req,res)=>{
        var news_id = req.query.news_id;
        db.query(`DELETE FROM data_news WHERE news_id = '${news_id}'`,(err,data)=>{
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {

                //** 添加日志 **
                    common.log_admin(req.session['admin_id'],"删除公告",`删除一条公告`);
                
                res.status(200).send({msg: "删除成功"}).end();
            }
        })
    })

    router.get('/data', (req, res) => {
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT data_news.*,admin.admin_name FROM data_news,admin WHERE news_type = 0 \
            AND admin.admin_id = data_news.news_author ORDER BY data_news.news_date DESC`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var array = [];
                for (var i = 0; i < data.length; i++) {
                    var item = {};
                    item = {
                        index: i + 1,
                        news_id: data[i].news_id,
                        news_inHomePage: data[i].news_inHomePage,
                        news_author: data[i].admin_name,
                        news_date: moment(data[i].news_date).format("YYYY年MM月DD日"),
                        news_title: data[i].news_title,
                        news_outline: data[i].news_outline,
                        news_main: data[i].news_main
                    }
                    array.push(item);
                }

                var arraySlice = array.slice(start, end);

                var news = {
                    code: 0,
                    msg: "",
                    count: array.length,
                    data: arraySlice
                }
                res.status(200).send(JSON.stringify(news)).end();
            }
        });
    });

    return router;
}