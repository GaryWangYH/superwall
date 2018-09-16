const express = require('express');
const common = require('../../../../libs/common');
const bodyParser = require('body-parser');
const moment = require('moment');
const fs = require('fs');

const db = common.db();

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });
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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "product_agreement", menuClick: 0, itemClick: 5  })
            });

            router.get('/detail', (req, res) => {
                res.render('admingly/web/admin_center.ejs', {id: req.query.id, nav, menu, content: "product_agreement_detail", menuClick: 0, itemClick: 5  })
            });
        }
    });

    router.get("/get_info",(req,res)=>{
        db.query(`SELECT id,type,title FROM data_agreement`,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                res.status(200).send(data).end();
            }
        })
    })

    router.get("/detail/get_info",(req,res)=>{
        db.query(`SELECT type,title,content FROM data_agreement WHERE id = "${req.query.id}"`,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                res.status(200).send(data).end();
            }
        })
    })

    router.post("/modify",(req,res)=>{
        var id = req.body.id;
        var title = req.body.title;
        var content = req.body.content;
        db.query(`UPDATE data_agreement \
            SET title = '${title}',\
            content = '${content}' \
            WHERE id = '${id}'`,(err,data)=>{
            if(err){
                console.log(err);
                res.status(500).send("修改失败").end();
            }else{

            //** 添加日志 **
            common.log_admin(req.session['admin_id'],"修改协议",`标题修改为'${title}',内容修改为'${content}'`);
            res.status(200).send({msg:"修改成功"}).end();
            }
        })
    })

    return router;
}