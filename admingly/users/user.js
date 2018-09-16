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
            nav = JSON.parse(data.toString());
            router.get('/', (req, res) => {
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user_user", menuClick: 0, itemClick: 0 })
            });
        }
    });
    router.get('/realName', (req, res) => {
        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user_user_realName", menuClick: 0, itemClick: 1 })
    })

    router.get('/realName/detail', (req, res) => {
        db.query(`SELECT * FROM view_user WHERE ID = '${req.query.id}'`,(err,data)=>{
            if(err){
                console.log(err);
                res.redirect('/error');
            }else{
                if (common.debugData(data)) {
                     res.render('admingly/web/admin_center.ejs', {data:data[0],id:req.query.id,type:req.query.type, nav, menu, content: "user_user_realName_detail", menuClick: 0, itemClick: 1 })
                } else {
                    res.redirect('/error');
                }
            }
        });
    })

    router.get('/edit', (req, res) => {
        res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user_user_realName", menuClick: 0, itemClick: 0 })
    })

    router.get('/realName/person',(req,res)=>{
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT * FROM view_user WHERE p_status = 2`,(err,data)=>{
            if (err) {
                console.log(err);
            }else{
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                }
                var arraySlice = data.slice(start, end);
                var out = {
                    code: 0,
                    msg: "",
                    count: data.length,
                    data: arraySlice
                }
                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    })

    router.get('/realName/enterprise',(req,res)=>{
        var page = req.query.page;
        var limit = req.query.limit;
        var start = (page - 1) * limit;
        var end = page * limit;
        db.query(`SELECT * FROM view_user WHERE e_status = 2`,(err,data)=>{
            if (err) {
                console.log(err);
            }else{
                for (var i = 0; i < data.length; i++) {
                    data[i].index = i + 1;
                }
                var arraySlice = data.slice(start, end);
                var out = {
                    code: 0,
                    msg: "",
                    count: data.length,
                    data: arraySlice
                }
                res.status(200).send(JSON.stringify(out)).end();
            }
        })
    })

    router.post('/realName/pass',urlencodedParser,(req,res)=>{

        var type = req.body.type;
        var ID = req.body.ID;
        var username = req.body.username;

        var detail;

        var query;
        if (type == "person") {
            query = `UPDATE user_realName SET p_status = 1 WHERE ID = '${ID}'`;
            detail=`同意用户${username}的个人实名验证`;
        }else{
            query = `UPDATE user_realName SET e_status = 1 WHERE ID = '${ID}'`;
            detail=`同意用户${username}的企业实名验证`;
        }

        db.query(query,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                db.query(`SELECT telephone FROM user WHERE ID = '${ID}'`,(err,data)=>{
                    if(err){
                        console.log(err);
                    }else{
                        var info = {
                            type: "user_realname_success",
                            telephone: data[0].telephone,
                            content: {}
                        }
                        //common.info(info);
                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"实名认证通过",detail);

                        res.status(200).send({msg:"修改成功"}).end();
                    }
                })
            }
        })
    })

    router.post('/realName/feedback',urlencodedParser,(req,res)=>{

        var type = req.body.type;
        var feedback = req.body.feedback;
        var ID = req.body.ID;
        var username = req.body.username;

        var detail;
        var query;
        if (type == "person") {
            query = `UPDATE user_realName SET p_status = 0, p_remark='${feedback}' WHERE ID = '${ID}'`;
            detail=`驳回用户${username}的个人实名验证`;
        }else{
            query = `UPDATE user_realName SET e_status = 0, e_remark='${feedback}' WHERE ID = '${ID}'`;
            detail=`驳回用户${username}的企业实名验证`;
        }

        db.query(query,(err,data)=>{
            if(err){
                console.log(err);
            }else{
                db.query(`SELECT telephone FROM user WHERE ID = '${ID}'`,(err,data)=>{
                    if(err){
                        console.log(err);
                    }else{
                        var info = {
                            type: "user_realname_fail",
                            telephone: data[0].telephone,
                            content: {}
                        }
                //common.info(info);
                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"实名认证驳回",detail);

                        res.status(200).send({msg:"修改成功"}).end();
                    }
                })
            }
        })
    })

    router.get('/detail', (req, res) => {
        db.query(`SELECT * FROM view_user WHERE ID = '${req.query.user_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
                // res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                    data[0].registerDate = moment(data[0].registerDate).format("YYYY-MM-DD HH:mm:ss");
                    res.render('admingly/web/admin_center.ejs', { nav, menu, content: "user_detail", data: data[0], menuClick: 0, itemClick: 0 });
                } else {
                    res.redirect('/error');
                }
            }
        });
    })

    router.use('/data', (req, res) => {

        var page = req.query.page;
        var limit = req.query.limit;

        var start = (page - 1) * limit;
        var end = page * limit;

        var telephone = req.query.telephone;
        var query;
        if (telephone == "undefined" || telephone == "") {
            query = `SELECT * FROM view_user`;
        } else {
            query = `SELECT * FROM view_user WHERE telephone = '${telephone}'`;
        }

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                    var array = [];
                    for (var i = 0; i < data.length; i++) {
                        var item = {};
                        item = {
                            id: i + 1,
                            user_id: data[i].ID,
                            username: data[i].username,
                            password: data[i].password,
                            QQ: data[i].QQ,
                            telephone: data[i].telephone,
                            registerDate: moment(data[i].registerDate).format("YYYY-MM-DD HH:mm:ss"),
                            email: data[i].email,
                            balance: data[i].balance,
                            p_name: data[i].p_name,
                            e_name: data[i].e_name
                        }
                        array.push(item);
                    }

                    var arraySlice = array.slice(start, end);

                    var users = {
                        code: 0,
                        msg: "",
                        count: array.length,
                        data: arraySlice
                    }

                    res.status(200).send(JSON.stringify(users)).end();
                }else {res.redirect('/error');}
            }
        });
    });
    router.use('/recharge', urlencodedParser, (req, res) => {
        var operator = req.session['admin_id'];
        var price = req.body.mod_amount;
        var user = req.body.mod_userid;
        var username = req.body.mod_username;
        var telephone = req.body.telephone;
            db.query(`CALL proc_recharge ('${user}',${price},'${operator}','${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                '人工充值','/center/moreOperation/balance?kind=recharge','充值到账${price}元',@status);`, function(err, rows, fields) {
                if (err) {
                    console.error(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    var status = rows[1][0].result;
                    if (status == 1) {
                        
                    res.status(200).send({ msg: "充值成功" }).end();
                            var info = {
                                type: "user_recharge",
                                telephone: telephone,
                                content:{
                                    money: price
                                }
                            }
                            //common.info(info); 
                        //** 添加日志 **
                    common.log_admin(operator,"人工充值",`为用户${username}充值${price}元`);

                    } else { res.status(200).send({ msg: "充值失败" }).end(); }
                }
            });
        

    });
    router.get("/edit", (req, res) => {
        var user_id = req.query.user_id;
        var membership = req.query.membership;
        db.query(`UPDATE user SET membership = '${membership}' \
            WHERE ID = '${user_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                //** 添加日志 **
                common.log_admin(req.session['admin_id'],"用户升级",`提升用户会员等级`);
                res.redirect("/admingly/user/user/detail?user_id=" + user_id)
            }
        });
    });
    router.use('/cashback', urlencodedParser, (req, res) => {
        var operator = req.session['admin_id'];
        var user_id = req.body.mod_userid;
        var telephone = req.body.telephone;
        var balance=req.body.balance;
        
        db.query(`UPDATE user SET balance = 0 \
            WHERE ID = '${user_id}'`, (err, data1) => {
            if (err) {
                console.log(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
             db.query(`INSERT INTO info_user \
                    (info_user_id,\
                    user_id,\
                    info_url,\
                    info_describe,\
                    info_status,\
                    buildTime)VALUES(replace(uuid(),'-',''),\
                    '${user_id}',\
                    '/center/moreOperation/balance?kind=cashback,\
                    '您成功取回现金${balance}元，获取时间以实际情况为准',\
                    1001,'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
                if (err) {
                    console.error(err);
                    res.redirect('/error');//res.status(500).send('database error').end();
                } else {
                    var info = {
                        type: "user_cashback",
                        telephone: telephone,
                        content:{
                            balance: balance
                            }
                        }
                        common.info(info);  
                    res.status(200).send({ msg: "操作成功" }).end();                                      
                }
            });   
            }
        });
                    
             
    });
    return router;
}