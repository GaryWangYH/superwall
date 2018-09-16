const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');
const moment = require('moment');
const bodyParser = require('body-parser');

const db = common.db();

module.exports = function() {
    var router = express.Router();

    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    var nav = {};

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
            nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                db.query(`SELECT * FROM admin_service`,(err,data)=>{
                    if(err){
                        console.log(err);
                        res.redirect('/error');
                    }else{
                        if (common.debugData(data)) {
                            res.render('admingly/web/admin_center.ejs', {data:data[0], nav, menu, content: "user_service", menuClick: 0, itemClick: 2 })
                        } else {
                            res.redirect('/error');
                        }
                    }
                })
            });
        }
    });

    router.get('/edit',(req,res)=>{
        var qq = req.query.qq;
        db.query(`UPDATE admin_service SET qq = '${qq}'`,(err,data)=>{
            if(err){
                console.log(err);
                res.status(500).send("修改失败").end();
            }else{
                
                //** 添加日志 **
                var detail=`修改首页客服QQ，新QQ为${qq}`;
                common.log_admin(req.session['admin_id'],"修改客服QQ",detail);

                res.status(200).send({msg:"修改成功"}).end();
            }
        })
    })

    return router;
}