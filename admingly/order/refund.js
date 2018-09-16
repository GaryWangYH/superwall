const express = require('express');
const fs = require('fs');
const common = require('../../../libs/common');
const moment = require('moment');
var db = common.db();
const bodyParser = require('body-parser');
const async =require('async');

module.exports = function() {
    var router = express.Router();
    var urlencodedParser = bodyParser.urlencoded({ extended: false });

    var menu = {};
    var order = {};
    var limitend = 0; //窗口右,页数范围
    var limitbegin = 0; //窗口左,窗口大小最大为十
    var limitlength = 500; //数据库一次搜索长度,limit*5
    var storedata = new Array(); //存放千条数据,limit*10
    var count = 0;
	var oldtype=-2;
    fs.readFile('./static/demo/order.txt', function(err, data) {
        if (err) {
            console.log('读取失败');
        } else {
            order = JSON.parse(data.toString());
        }
    });

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
                res.render('admingly/web/admin_center.ejs', { nav, menu, content: "order_refund", menuClick: 3, itemClick: 1 });
            });


            router.get('/table', function(req, res) {
                var page = req.query.page;
                var limit = req.query.limit;
                var range = req.query.range;
                var array = range.split("~");
                var left = array[0].trim() + ' 00:00:00';
                var right = array[1].trim() + ' 23:59:59';
                var start; // 
                var end; // 
                var begin; //数据库开始位置
                var querystring;
                var type = req.query.type; //日期变更重新加载
                if(type!=oldtype)           //日期变更
                {   
                    limitend=0;  
                    limitbegin=0; 
                    oldtype=type;
                }
                if(page==1&&type==-1)           //无换页
                {   
                    limitend=0;  
                    limitbegin=0; 
                }
                if (page > limitend) { //需要新增数据
                    limitend = parseInt((page - 1) / 5) * 5 + 5; //窗口右移
                    if (limitend <= limitbegin + 15) limitbegin = limitend - 10; //窗口右移 
                    else limitbegin = limitend - 5; //窗口右移        
                    begin = (limitend - 5) * limit;
                } else if (page <= limitbegin) {
                    limitbegin = parseInt((page - 1) / 5) * 5; //窗口左移
                    if (limitend <= limitbegin + 15) limitend = limitbegin + 10; //窗口左移 
                    else limitend = limitbegin + 5; //窗口左移    
                    begin = limitbegin * limit;
                } else {

                    start = parseInt((page - 1) % 10 * limit);
                    end = parseInt(start) + parseInt(limit);

                    if (page * limit > count) end = start + count % limit;

                    var arraySlice = storedata.slice(start, end);
                    var allItems = {
                        code: 0,
                        msg: "",
                        count: count,
                        data: arraySlice
                    }
                    res.status(200).send(JSON.stringify(allItems)).end();
                    return;
                }
                db.query(`SELECT permission_role_id FROM admin WHERE admin_id = '${req.session['admin_id']}'`, (err, data1) => {
           if (err) {
                        console.log(err);
                        res.redirect('/error');//res.status(500).send('database error').end();
           } else {
                        if (common.debugData(data)) {
                        var isclerk = ' ';
                        if (data1[0].permission_role_id == "1005") {
                            isclerk = `admin_id = '${req.session['admin_id']}' and `;
                            querystring = `SELECT refund_id,user_id,user_name,\
                        amount,apply_time,apply_reason,pay_status\
                        FROM view_apply_refund_balance WHERE admin_id = '${req.session['admin_id']}'\
                        and apply_time BETWEEN '${left}' AND '${right}' order by apply_time desc\
                        limit ${begin},${limitlength}`;
                        } else {
                            querystring = `SELECT refund_id,user_id,user_name,\
                        amount,apply_time,apply_reason,pay_status\
                        FROM view_apply_refund_balance WHERE apply_time BETWEEN '${left}' AND '${right}' order by apply_time desc\
                        limit ${begin},${limitlength}`;
                        }
                        db.query(`SELECT COUNT(1) as count FROM view_apply_refund_balance where ${isclerk} apply_time BETWEEN '${left}' AND '${right}'`, (err, data3) => {
                            if (err) {
                                console.error(err);
                                res.redirect('/error');//res.status(500).send('database error').end();
                            } else {
                                count = data3[0].count;
                                db.query(querystring, (err, data) => {
                                    if (err) {
                                        console.error(err);
                                        res.redirect('/error');//res.status(500).send('database error').end();
                                    } else {

                                        var flag = (page - 1) % 10 > 4 ? 5 * limit : 0; //改变数据的前五百十还是后五百十
                                        for (var i = 0; i < data.length; i++) {
                                            data[i].number = i + 1 + begin;
                                            storedata[i + flag] = data[i];
                                            data[i].apply_time = moment(data[i].apply_time).format('YYYY-MM-DD HH:mm');
                                        }
                                        start = parseInt((page - 1) % 10 * limit);
                                        end = parseInt(start) + parseInt(limit);
                                        if (page * limit > count) end = start + count % limit;
                                        var arraySlice = storedata.slice(start, end);
                                        var allItems = {
                                            code: 0,
                                            msg: "",
                                            count: count,
                                            data: arraySlice
                                        }
                                        res.status(200).send(JSON.stringify(allItems)).end();
                                    }
                                });
                            }
                        });
                    } else {
                        res.redirect('/error');
                        } 
                    }
                });
            });
            
            router.post('/agree', urlencodedParser, function(req, res) {
                var refund_id = req.body.refund_id;
                var amount = req.body.amount;
                var user_id = req.body.user_id;
                var user_name = req.body.user_name;
                var apply_reason = req.body.apply_reason;
                var admin_id=req.session['admin_id'];

             db.query(`CALL proc_apply_refund_balance ('${refund_id}','${user_id}','${admin_id}','${amount}',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}','${apply_reason}','余额退款',\
            '/center/moreOperation/balance?kind=cashback','你已成功退款${amount}元',\
            @status);`, function(err, rows, fields) {
            if (err) {
                console.error(err);
                res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                var status = rows[1][0].result;
                if (status == 1) {

                    var detail=`同意用户${user_name}退款,退款金额为${amount}元`;
                    common.log_admin(req.session['admin_id'],'同意退款',detail);
                        
                    var info_admin = {
                            type: "user_refund",
                            //telephone: telephone,
                            content:{
                                username: user_name,
                                type: "余额退款"
                            }
                        }
                        //common.info(info_admin);
                    //console.log(info_admin);
                    res.status(200).send({ msg: "支付成功" }).end();
                } else { res.status(200).send({ msg: "余额不足" }).end(); }
            }

        });
        });





            router.post('/refuse', urlencodedParser, function(req, res) {
                var refund_id = req.body.refund_id;
                
                    db.query(`UPDATE apply_refund_balance SET pay_status=1005\
                     WHERE refund_id = '${refund_id}'`, (err, data1) => {
                if (err) {
                    console.log(err);
                    res.redirect('/error');//res.status(500).send("database error").end();
                } else {
                    var detail=`不同意用户${user_name}退款`;
                    common.log_admin(req.session['admin_id'],'不同意退款',detail);
                    
                    res.status(200).send({ msg: "操作成功" }).end();
                    }
                })      
            });


        }
    });

    return router;
}