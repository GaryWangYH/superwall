const crypto = require('crypto');
const fs = require('fs');
const mysql = require('mysql');
const moment = require('moment');
const schedule = require('node-schedule');
const SMSClient = require('@alicloud/sms-sdk');
const async = require('async');
const request = require('request');
const strAuthorityPork = "zhegongda";
const path = require('path');
// 支付宝相关lib

const Alipay = require('./alipay/alipay');
const utl = require('./alipay/utl');

// var db = mysql.createPool({ host: "106.14.207.0", user: "root", password: "uAiqwVwjJ8-i", database: "superwall0711" });
// var db = mysql.createPool({ host: "localhost", user: "root", password: "weak", database: "superwall" });

var db = mysql.createPool({ host: "103.44.144.9", user: "zhiyu", password: "zhiyu@123", database: "superwall" });

module.exports = {
    MD5_SUFFIX: '****__智御SUPERWALL智御__****',
    strAuthorityPork: strAuthorityPork,
    IP: "103.44.144.9:8080",

    md5: function(str) {
        var obj = crypto.createHash('md5');

        obj.update(str);

        return obj.digest('hex');
    },

    db: function() {
        return db;
    },

    //处理无数据时崩溃bug
    debugData: function(data, res, next) {
        if (data.length == 0) {
            return false;
        } else {
            return true;
        }
    },

    ali: function(notifyUrl) {
        var ali = new Alipay({
            appId: '2016091700530706',
            notifyUrl: notifyUrl,
            rsaPrivate: path.resolve('./static/pem/private-key.pem'),
            rsaPublic: path.resolve('./static/pem/public-key.pem'),
            sandbox: true,
            signType: 'RSA2'
        });
        return ali;
    },

    //消息提醒
    //data为json对象格式 需有type类型 和消息内容
    //弹性每日结算模板：
    //尊敬的${name}用户，您的弹性服务器${order_name}当天防护流量为${flow}，费用为${price}，结算时间${date}
    info: function(data) {
        sendInfo(data);
    },

    code: function(data, res) {
        sendCode(data, res);
    },

    //日志
    //data格式
    //json 包含log_id user_id  action detail date
    log_user: function(user_id, action, detail) {

        db.query(`INSERT INTO log_user(log_id,user_id,action,detail,date) \
        VALUES(replace(UUID(),'-',''),'${user_id}','${action}',\
        "${detail}",'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
            if (err) {
                console.log(err);
            }
        })
    },

    //json 包含log_id admin_id  action detail date
    log_admin: function(admin_id, action, detail) {

        // var sql_r = sql.replace(/\s+/g, ' ');
        // var sql_r_t = sql_r.replace(/'/g,"\\\'")
        // var sql_r_t_t = sql_r.replace(/"/g,"\\\"")

        db.query(`INSERT INTO log_admin(log_id,admin_id,action,detail,date) \
        VALUES(replace(UUID(),'-',''),'${admin_id}','${action}',\
        "${detail}",'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
            if (err) {
                console.log(err);
            }
        })
    },

    test: function() {
        // console.log(moment("2018-07-03 23:55:10"));
        //月份减一
        // var date = new Date(2018, 6, 3, 23, 57, 10)
        // schedule.scheduleJob(date, function() {
        //     console.log("AAAAAAAAA");
        // })
        // getAttackLogByIP_elastic("zhegongda", "103.46.128.51", "2018-07-05 17:00:00", "2018-07-05 18:00:00");
        // var requestData = {
        //     "strAuthorityPork": "zhegongda",
        //     "ip": "103.46.128.51",
        //     "start_time": "2018-07-06 15:23:00",
        //     "end_time": "2018-07-06 16:23:00"
        // }
        // request({
        //     url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        //     method: "POST",
        //     json: true,
        //     headers: {
        //         "content-type": "application/json",
        //     },
        //     body: JSON.stringify(requestData)
        // }, function(error, response, body) {
        //     if (!error && response.statusCode == 200) {
        //         var data = JSON.parse(body).data;

        //         console.log(data.length)
        //         for (var i = 0; i < data.length; i++) {
        //             console.log(data[i])
        //         }
        //     }
        // });
        // console.log(msg_ctrl("user_deploy",msg_ctrl_callback));
        // console.log(msg_ctrl("user_end",msg_ctrl_callback));



    },

    //对弹性防护流量进行监控
    // 自动判断是否有新的服务器需要监控，并监控
    // 每小时获取该小时内弹性流量数据，储存在数据库
    // 每天获取该天内弹性流量，并根据价目表进行费用结算
    // - 如果欠费，关闭服务器监控，将订单状态改为欠费
    schedule_elastic: function() {

        //重启服务器时，重新监控所有弹性服务器
        // db.query(`UPDATE order_elastic SET isSchedule = 0`, (err, data) => {
        //     if (err) {
        //         console.log(err);
        //     }
        // })
        // db.query(`UPDATE order_ddos SET isSchedule = 0`, (err, data) => {
        //     if (err) {
        //         console.log(err);
        //     }
        // })
        // db.query(`UPDATE order_server SET isSchedule = 0`, (err, data) => {
        //     if (err) {
        //         console.log(err);
        //     }
        // })

        schedule.scheduleJob('30 * * * * *', function() {

            // 设置三种产品已完成状态
            // 高防服务器
            db.query(`SELECT order_id,user_id,clerk_id,order_enddate \
                    FROM order_server \
                    WHERE isSchedule = 1`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].order_enddate) {
                            var order_id = data[i].order_id;
                            var user_id = data[i].user_id;
                            var endTime = data[i].order_enddate;
                            var clerk_id = data[i].clerk_id;

                            schedule_hss_finish(endTime, order_id, user_id, clerk_id);
                            schedule_hss_finish_advance_day(endTime, order_id, user_id, clerk_id);

                        }
                    }
                }
            })
            // DDoS服务器
            db.query(`SELECT order_id,user_id,clerk_id,endtime \
                    FROM order_ddos \
                    WHERE isSchedule = 1`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].endtime) {
                            var order_id = data[i].order_id;
                            var user_id = data[i].user_id;
                            var endTime = data[i].endtime;
                            var clerk_id = data[i].clerk_id;

                            schedule_ddos_finish(endTime, order_id, user_id, clerk_id);
                            schedule_ddos_finish_advance_day(endTime, order_id, user_id, clerk_id);
                        }
                    }
                }
            })
            // 弹性防护服务器
            db.query(`SELECT order_elastic_id,user_id,admin_id,endTime \
                    FROM order_elastic \
                    WHERE isSchedule = 1`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].endTime) {
                            var order_id = data[i].order_elastic_id;
                            var user_id = data[i].user_id;
                            var endTime = data[i].endTime;
                            var clerk_id = data[i].admin_id;

                            schedule_elastic_finish(endTime, order_id, user_id, clerk_id);
                            schedule_elastic_finish_advance_day(endTime, order_id, user_id, clerk_id);
                        }
                    }
                }
            })
        })

        // // 每小时监控服务器状态
        // setTimeout(function() {
        //     schedule.scheduleJob('0 0 * * * *', function() {
        //         // 高防服务器
        //         db.query(`SELECT * FROM order_server WHERE order_state = 1002`, (err, data) => {
        //             if (err) {
        //                 console.log(err);
        //             } else {
        //                 if (data.length != 0) {
        //                     for (var i = 0; i < data.length; i++) {
        //                         var order_id = data[i].order_id;
        //                         var user_id = data[i].user_id;
        //                         var ip = data[i].ip;
        //                         var strAuthorityPork = data[i].strAuthorityPork;

        //                         // db.query(`UPDATE order_server SET isSchedule = 1 \
        //                         //     WHERE order_id = '${order_id}'`, (err, data1) => {
        //                         //     if (err) {
        //                         //         console.log(err);
        //                         //     }
        //                         // })

        //                         // 每小时防护状态
        //                         schedule_hss_hour(order_id, user_id, ip, strAuthorityPork);

        //                         // 每天防护状态
        //                         // schedule_hss_day(order_id, user_id, ip, strAuthorityPork);
        //                     }
        //                 }
        //             }
        //         })

        //         // DDoS服务器
        //         db.query(`SELECT * FROM order_ddos WHERE order_status = 1002`, (err, data) => {
        //             if (err) {
        //                 console.log(err);
        //             } else {
        //                 if (data.length != 0) {
        //                     for (var i = 0; i < data.length; i++) {
        //                         var order_id = data[i].order_id;
        //                         var user_id = data[i].user_id;
        //                         var ip = data[i].ip;
        //                         var strAuthorityPork = data[i].strAuthorityPork;

        //                         // db.query(`UPDATE order_ddos SET isSchedule = 1 \
        //                         //     WHERE order_id = '${order_id}'`, (err, data1) => {
        //                         //     if (err) {
        //                         //         console.log(err);
        //                         //     }
        //                         // })

        //                         // 每小时防护状态
        //                         schedule_ddos_hour(order_id, user_id, ip, strAuthorityPork);

        //                         // 每天防护状态
        //                         // schedule_ddos_day(order_id, user_id, ip, strAuthorityPork);
        //                     }
        //                 }
        //             }
        //         })


        //         // 弹性防护
        //         db.query(`SELECT * FROM order_elastic WHERE status = 1002 OR status = 1005`, (err, data) => {
        //             if (err) {
        //                 console.log(err);
        //             } else {
        //                 if (data.length != 0) {
        //                     for (var i = 0; i < data.length; i++) {
        //                         var order_elastic_id = data[i].order_elastic_id;
        //                         var user_id = data[i].user_id;
        //                         var ip = data[i].ip;
        //                         var strAuthorityPork = data[i].strAuthorityPork;

        //                         // db.query(`UPDATE order_elastic SET isSchedule = 1 \
        //                         //     WHERE order_elastic_id = '${order_elastic_id}'`, (err, data1) => {
        //                         //     if (err) {
        //                         //         console.log(err);
        //                         //     }
        //                         // })

        //                         // 每小时防护状态
        //                         schedule_elastic_hour(order_elastic_id, user_id, ip, strAuthorityPork);

        //                         //每天结算费用
        //                         // schedule_elastic_day(order_elastic_id, user_id, ip, strAuthorityPork);

        //                     }
        //                 }
        //             }
        //         })
        //     })
        // }, 10000);
        // 每天监控服务器状态
        // setTimeout(function() {

        // var rule1     = new schedule.RecurrenceRule();
        // var times1    = [1,6,11,16,21,26,31,36,41,46,51,56];
        // rule1.minute  = times1;
        // schedule.scheduleJob(rule1, function() {
        //console.log("监控hss，时间"+moment().format('HH:mm:ss'));

        schedule.scheduleJob('0 10 0 * * *', function() {
            // 高防服务器
            db.query(`SELECT * FROM order_server WHERE order_state = 1002`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    if (data.length != 0) {
                        for (var i = 0; i < data.length; i++) {
                            var order_id = data[i].order_id;
                            var user_id = data[i].user_id;
                            var ip = data[i].ip;
                            var strAuthorityPork = strAuthorityPork;

                            // db.query(`UPDATE order_server SET isSchedule = 1 \
                            //     WHERE order_id = '${order_id}'`, (err, data1) => {
                            //     if (err) {
                            //         console.log(err);
                            //     }
                            // })

                            // 每小时防护状态
                            // schedule_hss_hour(order_id, user_id, ip, strAuthorityPork);

                            // 每天防护状态
                            schedule_hss_day(order_id, user_id, ip, strAuthorityPork);
                        }
                    }
                }
            })
        });

        schedule.scheduleJob('0 20 0 * * *', function() {
            // DDoS服务器
            //console.log("监控ddos，时间"+moment().format('HH:mm:ss'));
            db.query(`SELECT * FROM order_ddos WHERE order_status = 1002`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    if (data.length != 0) {
                        for (var i = 0; i < data.length; i++) {
                            var order_id = data[i].order_id;
                            var user_id = data[i].user_id;
                            var ip = data[i].ip;
                            var strAuthorityPork = strAuthorityPork;

                            // db.query(`UPDATE order_ddos SET isSchedule = 1 \
                            //     WHERE order_id = '${order_id}'`, (err, data1) => {
                            //     if (err) {
                            //         console.log(err);
                            //     }
                            // })

                            // 每小时防护状态
                            // schedule_ddos_hour(order_id, user_id, ip, strAuthorityPork);

                            // 每天防护状态
                            schedule_ddos_day(order_id, user_id, ip, strAuthorityPork);
                        }
                    }
                }
            })
        });


        //console.log("监控elastic，时间"+moment().format('HH:mm:ss'));
        schedule.scheduleJob('0 30 0 * * *', function() {
            // 弹性防护
            db.query(`SELECT * FROM order_elastic WHERE status = 1002 OR status = 1005`, (err, data) => {
                if (err) {
                    console.log(err);
                } else {
                    if (data.length != 0) {
                        for (var i = 0; i < data.length; i++) {
                            var order_elastic_id = data[i].order_elastic_id;
                            var user_id = data[i].user_id;
                            var ip = data[i].ip;
                            var strAuthorityPork = strAuthorityPork;

                            // db.query(`UPDATE order_elastic SET isSchedule = 1 \
                            //     WHERE order_elastic_id = '${order_elastic_id}'`, (err, data1) => {
                            //     if (err) {
                            //         console.log(err);
                            //     }
                            // })

                            // 每小时防护状态
                            // schedule_elastic_hour(order_elastic_id, user_id, ip, strAuthorityPork);

                            //每天结算费用
                            schedule_elastic_day(order_elastic_id, user_id, ip, strAuthorityPork);

                        }
                    }
                }
            })
        })
        // }, 10000);
    },

    // //权限控制 这里是基于单个管理员的权限
    // permission: function(admin_id, permission_func_id, next, res) {
    //     db.query(`SELECT permission_role_id FROM admin WHERE admin_id = '${admin_id}'`, (err, data) => {
    //         if (err) {
    //             console.log(err);
    //             res.redirect('/error');
    //         } else {
    //             if (data[0].permission_role_id == "1001") {
    //                 next();
    //             } else {
    //                 db.query(`SELECT * FROM permission_admin_func WHERE admin_id = '${admin_id}' \
    //                     AND permission_func_id = ${permission_func_id}`, (err, data) => {
    //                     if (err) {
    //                         console.log(err);
    //                         res.redirect('/error');
    //                     } else {
    //                         if (data.length > 0) {
    //                             next();
    //                         } else {
    //                             res.redirect("/admingly/noPermission");
    //                         }
    //                     }
    //                 })
    //             }
    //         }
    //     })
    // },

    //权限控制 基于管理员等级
    permission: function(admin_id, permission_func_id, next, res) {
        db.query(`SELECT permission_role_id FROM admin WHERE admin_id = '${admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
            } else {
                // 一级管理员永远所有权限
                if (data[0].permission_role_id == "1001") {
                    next();
                } else {
                    db.query(`SELECT COUNT(*) AS num FROM permission_role_func \
                        WHERE permission_role_id = '${data[0].permission_role_id}' \
                        AND permission_func_id = '${permission_func_id}'`,(err,data)=>{
                            if (err) {
                                console.log(err);
                                res.redirect('/error');
                            } else {
                                if (data[0].num > 0) {
                                    next();
                                } else {
                                    res.redirect("/admingly/noPermission");
                                }
                            }
                        });
                }
            }
        })
    },

    //权限控制 检查管理员等级
    admin_level_check: function(next, res, my_admin_id, target_admin_id) {
        db.query(`SELECT level FROM admin,permission_role \
            WHERE admin.permission_role_id = permission_role.permission_role_id \
            AND admin_id = '${my_admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
                // res.status(500).send('database error').end();
            } else {
                if (data[0].level == 0) {
                    next()
                } else {
                    if (my_admin_id == target_admin_id) {
                        res.redirect("/admingly/noPermission");
                    } else {
                        db.query(`SELECT admin_id,level FROM admin, permission_role\ 
                                    WHERE admin.permission_role_id = permission_role.permission_role_id\
                                    AND (admin_id = '${my_admin_id}'\ 
                                    OR admin_id = '${target_admin_id}')`, (err, data) => {
                            if (err) {
                                console.log(err);
                                res.redirect('/error');
                                // res.status(500).send('database error').end();
                            } else {
                                if (data.length == 2) {
                                    var my_level;
                                    var target_level;
                                    if (data[0].admin_id == my_admin_id) {
                                        my_level = data[0].level;
                                        target_level = data[1].level;
                                    } else {
                                        my_level = data[1].level;
                                        target_level = data[0].level;
                                    }
                                    if (my_level == 0) {
                                        next()
                                    } else {
                                        if (my_level < target_level) {
                                            next();
                                        } else {
                                            res.redirect("/admingly/noPermission");
                                        }
                                    }
                                } else {
                                    res.redirect('/error');
                                }
                            }
                        })
                    }
                }
            }
        })
    },

    //权限控制 检查角色等级
    role_level_check: function(next, res, my_admin_id, target_role_level) {
        db.query(`SELECT level FROM admin, permission_role \
                    WHERE admin.permission_role_id = permission_role.permission_role_id\
                    AND admin_id = '${my_admin_id}'`, (err, data) => {
            if (err) {
                console.log(err);
                res.redirect('/error');
            } else {
                var my_level;
                my_level = data[0].level;
                if (my_level == 0) {
                    next()
                } else {
                    if (my_level < target_role_level) {
                        next();
                    } else {
                        res.redirect("/admingly/noPermission");
                    }
                }
            }
        })
    },

    //查询数据库，并返回符合规则的数据表格形式(含页码)
    //输入: response,表名，页号，每页显示数据量
    //返回：直接发送给页面符合layui数据表格格式的json类型(包含序号index)
    //date name:"date" format:"YYYY-MM-DD" 日期格式更改
    layui_table: function(res, tableName, page, limit, limits, date) {

        var query = `SELECT * FROM ${tableName}`
        if (limits.length != 0) {
            for (var i = 0; i < limits.length; i++) {
                if (i == 0) {
                    query += " WHERE " + limits[i].name + "=" + limits[i].value
                } else {
                    query += " AND " + limits[i].name + "=" + limits[i].value
                }
            }
        }

        var start = (page - 1) * limit;
        var end = page * limit;

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('database error').end();
            } else {
                if (data.length > 0) {
                    var array = [];
                    var attrs = Object.keys(data[0]);
                    for (var i = 0; i < data.length; i++) {
                        var item = {}
                        item.index = i + 1;
                        for (var a = 0; a < attrs.length; a++) {
                            if (date.length == 0) {
                                item[attrs[a]] = data[i][attrs[a]];
                            } else {
                                for (var b = 0; b < date.length; b++) {
                                    if (attrs[a] == date[b].name) {
                                        item[attrs[a]] = moment(data[i][attrs[a]]).format(date[b].format);
                                        break;
                                    } else {
                                        item[attrs[a]] = data[i][attrs[a]];
                                    }
                                }
                            }
                        }
                        array.push(item);
                    }
                    var arraySlice = array.slice(start, end);

                    var out = {
                        code: 0,
                        msg: "",
                        count: array.length,
                        data: arraySlice
                    }
                    res.status(200).send(JSON.stringify(out)).end();
                } else {
                    var out = {
                        code: 0,
                        msg: "",
                        count: 0,
                        data: []
                    }
                    res.status(200).send(JSON.stringify(out)).end();
                }
            }
        });
    },

    //查询数据库全部字段,含有限制条件
    //限制条件为对象数组,对象含有两个属性,限制名(name)和限制量(value)
    //e.g.
    //limit.name = "user_id"
    //limit.value = "123456"
    //输入 表名,需要执行的语句
    //others 为其余自定义参数
    db_getAll_limits: function(res, tableName, func, limits, others) {
        var query = `SELECT * FROM ${tableName}`
        if (limits.length != 0) {
            for (var i = 0; i < limits.length; i++) {
                if (i == 0) {
                    query += " WHERE " + limits[i].name + "=" + limits[i].value
                } else {
                    query += " AND " + limits[i].name + "=" + limits[i].value
                }
            }
        }

        var attrs = Object.keys(others);
        for (var i = 0; i < attrs.length; i++) {
            eval("var " + attrs[i] + "=" + others[attrs[i]]);
        }

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('database error').end();
            } else {
                var array = [];
                var attrs = Object.keys(data[0]);
                for (var i = 0; i < data.length; i++) {
                    var item = {}
                    item.index = i + 1;
                    for (var a = 0; a < attrs.length; a++) {
                        item[attrs[a]] = data[i][attrs[a]];
                    }
                    array.push(item);
                }
                eval(func);
            }
        });
    },

    db_getAll_limits_data: function(res, tableName, func, limits, others) {
        var query = `SELECT * FROM ${tableName}`
        if (limits.length != 0) {
            for (var i = 0; i < limits.length; i++) {
                if (i == 0) {
                    query += " WHERE " + limits[i].name + "=" + limits[i].value
                } else {
                    query += " AND " + limits[i].name + "=" + limits[i].value
                }
            }
        }

        var attrs = Object.keys(others);
        for (var i = 0; i < attrs.length; i++) {
            eval("var " + attrs[i] + "=" + others[attrs[i]]);
        }

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('database error').end();
            } else {
                eval(func);
            }
        });
    },

    //删除数据库字段
    db_delete: function(res, tableName, limits) {
        var query = `DELETE FROM ${tableName}`
        if (limits.length != 0) {
            for (var i = 0; i < limits.length; i++) {
                if (i == 0) {
                    query += " WHERE " + limits[i].name + "=" + limits[i].value
                } else {
                    query += " AND " + limits[i].name + "=" + limits[i].value
                }
            }
        }

        db.query(query, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('database error').end();
            } else {
                res.status(200).send({ msg: "删除成功" }).end();
            }
        });
    }
};




function schedule_elastic_hour(order_elastic_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 * * * *', function() {
    var end_time = moment().format("YYYY-MM-DD HH:mm:ss");
    var start_time = moment().subtract(1, 'hours').format("YYYY-MM-DD HH:mm:ss");
    getAttackLogByIP_elastic(order_elastic_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

function schedule_hss_hour(order_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 * * * *', function() {
    var end_time = moment().format("YYYY-MM-DD HH:mm:ss");
    var start_time = moment().subtract(1, 'hours').format("YYYY-MM-DD HH:mm:ss");
    getAttackLogByIP_hss(order_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

function schedule_ddos_hour(order_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 * * * *', function() {
    var end_time = moment().format("YYYY-MM-DD HH:mm:ss");
    var start_time = moment().subtract(1, 'hours').format("YYYY-MM-DD HH:mm:ss");
    getAttackLogByIP_ddos(order_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

function schedule_ddos_day(order_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 0 * * *', function() {
    var end_time = moment().format("YYYY-MM-DD 00:00:00");
    var start_time = moment().subtract(1, 'days').format("YYYY-MM-DD 00:00:00");
    getAttackLogByIP_ddos_day(order_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

function schedule_hss_day(order_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 0 * * *', function() {
    var end_time = moment().format("YYYY-MM-DD 00:00:00");
    var start_time = moment().subtract(1, 'days').format("YYYY-MM-DD 00:00:00");
    getAttackLogByIP_hss_day(order_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

function schedule_elastic_day(order_elastic_id, user_id, ip, strAuthorityPork) {
    // schedule.scheduleJob('0 0 0 * * *', function() {
    var end_time = moment().format("YYYY-MM-DD 00:00:00");
    var start_time = moment().subtract(1, 'days').format("YYYY-MM-DD 00:00:00");
    getAttackLogByIP_elastic_day(order_elastic_id, user_id, strAuthorityPork, ip, start_time, end_time);
    // })
}

//输入 YYYY-MM-DD HH:mm:ss
//返回 Date对象
function convertDate(dateStr) {
    var em = moment(dateStr);
    var date = new Date(em.year(), em.month(), em.day() + 1, em.hour(), em.minute(), em.second());
    return date;
}

function insertMsgOrder(order_id, order_type, msg_name, day) {
    db.query(`INSERT INTO msg_order(msg_order_id, \
            order_id, order_type, msg_name, day, date) VALUES(\
            replace(UUID(),'-',''),\
            '${order_id}',\
            '${order_type}',\
            '${msg_name}',\
            '${day}',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
}

function schedule_hss_finish_advance_day(endTime, order_id, user_id, clerk_id) {
    db.query(`SELECT remark FROM msg_config WHERE msg_name = 'user_end_advance'`, (err, data1) => {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < data1.length; i++) {
                var r = /^[0-9]*[1-9][0-9]*$/;
                if (r.test(data1[i].remark)) {
                    if (moment().isAfter(moment(endTime).subtract(data1[i].remark, "days"))) {
                        var order_type = "hss";
                        var msg_name = "user_end_advance";
                        schedule_hss_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, data1[i].remark, order_type, msg_name)
                    }
                }
            }
        }
    })
}

function schedule_hss_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, day, order_type, msg_name) {
    db.query(`SELECT count(*) AS num FROM msg_order WHERE order_id='${order_id}' AND \
        order_type='${order_type}' AND msg_name='${msg_name}' AND day='${day}'`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data[0].num == "0") {
                insertMsgOrder(order_id, order_type, msg_name, day);
                schedule_hss_finish_advance(endTime, order_id, user_id, clerk_id, day);
            }
        }
    })
}

function schedule_hss_finish_advance(dateStr, order_id, user_id, admin_id, day) {

    db.query(`INSERT INTO info_user VALUES(\
            replace(UUID(),'-',''),\
            '${user_id}',\
            '/center/serverRental/detail?id=${order_id}',\
            '您有一个高防服务器将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`INSERT INTO info_admin VALUES(\
            replace(UUID(),'-',''),\
            '1004',\
            '${admin_id}',\
            '/admingly/order/hss/detail?id=${order_id}',\
            '您的用户有一个高防服务器将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`SELECT order_deploy,order_end,order_buyername,order_userphone,order_clerkphone FROM view_order_server WHERE order_id = '${order_id}'`, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            var info = {
                type: "user_end_advance",
                telephone: data[0].order_userphone,
                content: {
                    type: "高防服务器",
                    // deliveryTime: moment(data[0].order_deployd).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: moment(data[0].order_end).format("YYYY-MM-DD HH:mm:ss"),
                    day: day
                }
            }
            // console.log(info);
            sendInfo(info);
            // var info_admin = {
            //     type: "admin_end",
            //     telephone: data[0].order_clerkphone,
            //     content:{
            //         username: data[0].order_buyername,
            //         type: "高防服务器",
            //         deliveryTime: moment(data[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
            //         endTime: moment(data[0].order_end).format("YYYY-MM-DD HH:mm:ss")
            //         }
            //     }
            //     sendInfo(info_admin);
        }
    });
}

function schedule_ddos_finish_advance_day(endTime, order_id, user_id, clerk_id) {
    db.query(`SELECT remark FROM msg_config WHERE msg_name = 'user_end_advance'`, (err, data1) => {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < data1.length; i++) {
                var r = /^[0-9]*[1-9][0-9]*$/;
                if (r.test(data1[i].remark)) {
                    if (moment().isAfter(moment(endTime).subtract(data1[i].remark, "days"))) {
                        var order_type = "ddos";
                        var msg_name = "user_end_advance";
                        schedule_ddos_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, data1[i].remark, order_type, msg_name)
                    }
                }
            }
        }
    })
}

function schedule_ddos_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, day, order_type, msg_name) {
    db.query(`SELECT count(*) AS num FROM msg_order WHERE order_id='${order_id}' AND \
        order_type='${order_type}' AND msg_name='${msg_name}' AND day='${day}'`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data[0].num == "0") {
                insertMsgOrder(order_id, order_type, msg_name, day);
                schedule_ddos_finish_advance(endTime, order_id, user_id, clerk_id, day);
            }
        }
    })
}

function schedule_ddos_finish_advance(dateStr, order_id, user_id, admin_id, day) {

    db.query(`INSERT INTO info_user VALUES(\
            replace(UUID(),'-',''),\
            '${user_id}',\
            '/center/serverRental/detail?id=${order_id}',\
            '您有一个DDoS高防IP将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`INSERT INTO info_admin VALUES(\
            replace(UUID(),'-',''),\
            '1004',\
            '${admin_id}',\
            '/admingly/order/hss/detail?id=${order_id}',\
            '您的用户有一个DDoS高防IP将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`SELECT order_deploy,order_end,order_buyername,order_userphone,order_clerkphone FROM view_order_ddos WHERE order_id = '${order_id}'`, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            var info = {
                type: "user_end_advance",
                telephone: data[0].order_userphone,
                content: {
                    type: "DDoS高防IP",
                    // deliveryTime: moment(data[0].order_deployd).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: moment(data[0].order_end).format("YYYY-MM-DD HH:mm:ss"),
                    day: day
                }
            }
            // console.log(info);
            sendInfo(info);
            // var info_admin = {
            //     type: "admin_end",
            //     telephone: data[0].order_clerkphone,
            //     content:{
            //         username: data[0].order_buyername,
            //         type: "高防服务器",
            //         deliveryTime: moment(data[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
            //         endTime: moment(data[0].order_end).format("YYYY-MM-DD HH:mm:ss")
            //         }
            //     }
            //     sendInfo(info_admin);
        }
    });
}


function schedule_elastic_finish_advance_day(endTime, order_id, user_id, clerk_id) {
    db.query(`SELECT remark FROM msg_config WHERE msg_name = 'user_end_advance'`, (err, data1) => {
        if (err) {
            console.log(err);
        } else {
            for (var i = 0; i < data1.length; i++) {
                var r = /^[0-9]*[1-9][0-9]*$/;
                if (r.test(data1[i].remark)) {
                    if (moment().isAfter(moment(endTime).subtract(data1[i].remark, "days"))) {
                        var order_type = "elastic";
                        var msg_name = "user_end_advance";
                        schedule_elastic_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, data1[i].remark, order_type, msg_name)
                    }
                }
            }
        }
    })
}

function schedule_elastic_finish_advance_day_callback(endTime, order_id, user_id, clerk_id, day, order_type, msg_name) {
    db.query(`SELECT count(*) AS num FROM msg_order WHERE order_id='${order_id}' AND \
        order_type='${order_type}' AND msg_name='${msg_name}' AND day='${day}'`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data[0].num == "0") {
                insertMsgOrder(order_id, order_type, msg_name, day);
                schedule_elastic_finish_advance(endTime, order_id, user_id, clerk_id, day);
            }
        }
    })
}

function schedule_elastic_finish_advance(dateStr, order_id, user_id, admin_id, day) {
    db.query(`INSERT INTO info_user VALUES(\
            replace(UUID(),'-',''),\
            '${user_id}',\
            '/center/serverRental/detail?id=${order_id}',\
            '您有一个弹性防护服务器将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`INSERT INTO info_admin VALUES(\
            replace(UUID(),'-',''),\
            '1004',\
            '${admin_id}',\
            '/admingly/order/hss/detail?id=${order_id}',\
            '您的用户有一个弹性防护服务器将于${day}后到期',\
            '1001',\
            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
            null\
            )`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
    db.query(`SELECT deliveryTime,endTime,user_name,admin_phone,user_phone FROM view_order_elastic WHERE id = '${order_id}'`, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            var info = {
                type: "user_end_advance",
                telephone: data[0].user_phone,
                content: {
                    type: "弹性防护",
                    // deliveryTime: moment(data[0].order_deployd).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: moment(data[0].endTime).format("YYYY-MM-DD HH:mm:ss"),
                    day: day
                }
            }
            // console.log(info);
            sendInfo(info);
            // var info_admin = {
            //     type: "admin_end",
            //     telephone: data[0].order_clerkphone,
            //     content:{
            //         username: data[0].order_buyername,
            //         type: "高防服务器",
            //         deliveryTime: moment(data[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
            //         endTime: moment(data[0].order_end).format("YYYY-MM-DD HH:mm:ss")
            //         }
            //     }
            //     sendInfo(info_admin);
        }
    });
}

function schedule_hss_finish(dateStr, order_id, user_id, admin_id) {

    //不设置新的计时器了 为了可以续费 也比较方便
    if (moment().isAfter(dateStr)) {
        db.query(`SELECT order_deploy,order_end,order_buyername,order_userphone,order_clerkphone,order_ip FROM view_order_server WHERE order_id = '${order_id}'`, (err, data9) => {
            if (err) {
                console.error(err);
            } else {
                async.parallel([
                        function(callback) {
                            db.query(`UPDATE order_server SET order_state = 1003, isSchedule=0 \
            WHERE order_id = '${order_id}'`, (err, data) => {
                                callback(err, data);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_user VALUES(\
                replace(UUID(),'-',''),\
                '${user_id}',\
                '/center/serverRental/detail?id=${order_id}',\
                '您有一个高防服务器已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data1) => {
                                callback(err, data1);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_admin VALUES(\
                replace(UUID(),'-',''),\
                '1004',\
                '${admin_id}',\
                '/admingly/order/hss/detail?id=${order_id}',\
                '您的用户有一个高防服务器已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data2) => {
                                callback(err, data2);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO log_system(log_id,user_id,admin_id,action,detail,date) \
        VALUES(replace(UUID(),'-',''),'${user_id}','${admin_id}','高防服务器IP已到期',\
        高防服务器IP${data9[0].order_ip}已到期,'${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data3) => {
                                if (err) {
                                    callback(err, data3);
                                }
                            });
                        }
                    ],
                    function(err, results) {
                        if (err == null) {
                            var info = {
                                type: "user_end",
                                telephone: data9[0].order_userphone,
                                content: {
                                    type: "高防服务器",
                                    deliveryTime: moment(data9[0].order_deployd).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].order_end).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info);
                            var info_admin = {
                                type: "admin_end",
                                telephone: data9[0].order_clerkphone,
                                content: {
                                    username: data9[0].order_buyername,
                                    type: "高防服务器",
                                    deliveryTime: moment(data9[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].order_end).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info_admin);
                        } else { console.log(err); }
                    });
            }
        });
    }
}

function schedule_ddos_finish(dateStr, order_id, user_id, admin_id) {
    if (moment().isAfter(dateStr)) {

        db.query(`SELECT order_deploy,order_end,order_buyername,order_userphone,order_clerkphone,order_ip FROM view_order_ddos WHERE order_id = '${order_id}'`, (err, data9) => {
            if (err) {
                console.error(err);
            } else {
                async.parallel([
                        function(callback) {
                            db.query(`UPDATE order_ddos SET order_status = 1003, isSchedule=0\
            WHERE order_id = '${order_id}'`, (err, data) => {
                                callback(err, data);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_user VALUES(\
                replace(UUID(),'-',''),\
                '${user_id}',\
                '/center/ddos/detail?id=${order_id}',\
                '您有一个DDoS高防IP已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data1) => {
                                callback(err, data1);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_admin VALUES(\
                replace(UUID(),'-',''),\
                '1004',\
                '${admin_id}',\
                '/admingly/order/ddos/detail?id=${order_id}',\
                '您的用户有一个DDoS高防IP已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data2) => {
                                if (err) {
                                    callback(err, data2);
                                }
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO log_system(log_id,user_id,admin_id,action,detail,date) \
        VALUES(replace(UUID(),'-',''),'${user_id}','${admin_id}','DDoS高防IP已到期',\
        'DDoS高防IP${data9[0].order_ip}已到期','${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data3) => {
                                if (err) {
                                    callback(err, data3);
                                }
                            });
                        }
                    ],
                    function(err, results) {
                        if (err == null) {
                            var info = {
                                type: "user_end",
                                telephone: data9[0].order_userphone,
                                content: {
                                    type: "DDoS高防IP",
                                    deliveryTime: moment(data9[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].order_end).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info);
                            var info_admin = {
                                type: "admin_end",
                                telephone: data9[0].order_clerkphone,
                                content: {
                                    username: data9[0].order_buyername,
                                    type: "DDoS高防IP",
                                    deliveryTime: moment(data9[0].order_deploy).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].order_end).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info_admin);
                        } else { console.log(err); }
                    });
            }
        })
    }
}

function schedule_elastic_finish(dateStr, order_id, user_id, admin_id) {
    if (moment().isAfter(dateStr)) {
        db.query(`SELECT deliveryTime,endTime,user_name,admin_phone,user_phone,ip FROM view_order_elastic WHERE id = '${order_id}'`, (err, data9) => {
            if (err) {
                console.error(err);
            } else {

                async.parallel([
                        function(callback) {
                            db.query(`UPDATE order_elastic SET status = 1003, isSchedule=0 \
            WHERE order_elastic_id = '${order_id}'`, (err, data) => {
                                if (err) {
                                    callback(err, data);
                                }
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_user VALUES(\
                replace(UUID(),'-',''),\
                '${user_id}',\
                '/center/elastic/detail?id=${order_id}',\
                '您有一个弹性防护服务器已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data1) => {
                                callback(err, data1);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO info_admin VALUES(\
                replace(UUID(),'-',''),\
                '1004',\
                '${admin_id}',\
                '/admingly/order/elastic/detail?id=${order_id}',\
                '您的用户有一个弹性防护服务器已到期',\
                '1001',\
                '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                null\
                )`, (err, data2) => {
                                callback(err, data2);
                            });
                        },
                        function(callback) {
                            db.query(`INSERT INTO log_system(log_id,user_id,admin_id,action,detail,date) \
        VALUES(replace(UUID(),'-',''),'${user_id}','${admin_id}','弹性防护IP已到期',\
        '弹性防护IP${data9[0].ip}已到期','${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data3) => {
                                if (err) {
                                    callback(err, data3);
                                }
                            });
                        }
                    ],
                    function(err, results) {
                        if (err == null) {

                            var info = {
                                type: "user_end",
                                telephone: data9[0].user_phone,
                                content: {
                                    type: "弹性防护",
                                    deliveryTime: moment(data9[0].deliveryTime).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].endTime).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info);
                            var info_admin = {
                                type: "admin_end",
                                telephone: data9[0].admin_phone,
                                content: {
                                    username: data9[0].user_name,
                                    type: "弹性防护",
                                    deliveryTime: moment(data9[0].deliveryTime).format("YYYY-MM-DD HH:mm:ss"),
                                    endTime: moment(data9[0].endTime).format("YYYY-MM-DD HH:mm:ss")
                                }
                            }
                            sendInfo(info_admin);

                        } else { console.log(err); }
                    });
            }
        })
    }
}

//data对象 包含 type, telephone, content
// user: deploy / end / arrear / recharge / refund_success / refund_fail

function sendInfo(data) {
    //短信控制
    db.query(`SELECT isOpen FROM msg_config WHERE msg_name = '${data.type}'`, (err, data1) => {
        if (err) {
            console.log(err);
        } else {
            if (data1[0].isOpen == "1") {
                sendMsg(data);
            }
        }
    })
}

function sendCode(data, response) {
    var type = data.type;
    var telephone = data.telephone;
    var content = JSON.stringify(data.content);
    var contentJson = data.content;

    var templateCode;
    var templateParam;

    switch (type) {
        case "user_code":
            // 您的验证码为：${code}，该验证码 5 分钟内有效，请勿泄漏于他人。
            templateCode = 'SMS_142383055';
            templateParam = content;
            break;
    }

    // 第二条到第一条间隔1分钟
    // 3 - 2 30min
    // 4 - 3 2h
    // 5 - 4 6h
    // 6 - 5 12h

    db.query(`SELECT * FROM msg_user_code WHERE msg_telephone = '${telephone}' \
        AND msg_date BETWEEN \
        '${moment().format("YYYY-MM-DD 00:00:00")}' AND \
        '${moment().format("YYYY-MM-DD HH:mm:ss")}' \
        ORDER BY msg_date DESC`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data.length == 0) {
                sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
            } else {
                var latestDate = data[0].msg_date;
                var diff = moment().diff(moment(latestDate), 'minutes');

                switch (data.length) {
                    case 1:
                        if (diff > 0) {
                            sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
                        } else {
                            response.status(500).send('该手机短信验证码发送过多，请1分钟后重试').end();
                        }
                        break;
                    case 2:
                        if (diff > 30 - 1) {
                            sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
                        } else {
                            response.status(500).send('该手机短信验证码发送过多，请'+ (30 - diff) +'分钟后重试').end();
                        }
                        break;
                    case 3:
                        if (diff > 2 * 60 - 1) {
                            sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
                        } else {
                            response.status(500).send('该手机短信验证码发送过多，请'+ (2 * 60 - diff) +'分钟后重试').end();
                        }
                        break;
                    case 4:
                        if (diff > 6 * 60 - 1) {
                            sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
                        } else {
                            response.status(500).send('该手机短信验证码发送过多，请'+ (6 * 60 - diff) +'分钟后重试').end();
                        }
                        break;
                    case 5:
                        if (diff > 12 * 60 - 1) {
                            sendCode_2(telephone, templateCode, templateParam, contentJson, type, response);
                        } else {
                            response.status(500).send('该手机短信验证码发送过多，请'+ (12 * 60 - diff) +'分钟后重试').end();
                        }
                        break;
                    default: 
                        response.status(500).send('今日发送短信验证码过多，请明天再试').end();
                }

            }
        }
    })

}

function sendCode_2(telephone, templateCode, templateParam, contentJson, type, response) {
    const accessKeyId = 'LTAIMwnfM3arX9du';
    const secretAccessKey = 'xtRv16TjG1iUdHbK120kZjBNfhdvsH';
    let smsClient = new SMSClient({ accessKeyId, secretAccessKey });
    smsClient.sendSMS({
        PhoneNumbers: telephone,
        SignName: 'SuperWall智御',
        TemplateCode: templateCode,
        TemplateParam: templateParam
    }).then(function(res) {
        let { Code } = res
        if (Code === 'OK') {
            response.status(200).send({ code: contentJson.code, msg: "发送成功" }).end();
            db.query(`INSERT INTO msg_user_code(msg_user_code_id,msg_type,\
                msg_telephone,msg_date) VALUES(replace(UUID(),'-',''),'${type}',\
                '${telephone}','${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    }, function(err) {
        switch (err.name) {
            case 'isv.BUSINESS_LIMIT_CONTROLError':
                response.status(500).send('该手机信息发送过多，请稍后再试').end();
                break;
            case 'isv.MOBILE_NUMBER_ILLEGALError':
                response.status(500).send('手机号码有误').end();
                break;
            default:
                response.status(500).send('发生错误').end();
        }
    })
}

function sendMsg(data) {
    var type = data.type;
    var telephone = data.telephone;
    var content = JSON.stringify(data.content);
    var contentJson = data.content;

    var templateCode;
    var templateParam;

    switch (type) {
        case "user_deploy":
            // 尊敬的用户，您的服务器已部署，服务器类型：${type}，部署时间：${deliveryTime}，到期时间：${endTime}，请及时查看。
            templateCode = 'SMS_139233947';
            templateParam = content;
            var msg = {
                msg_type: type,
                msg_content: `尊敬的用户，您的服务器已部署，服务器类型：${contentJson.type}，部署时间：${contentJson.deliveryTime}，到期时间：${contentJson.endTime}，请及时查看。`,
                msg_telephone: telephone
            }
            setMsg(msg);
            break;
        case "user_end":
            // 尊敬的用户，您的服务器已到期，服务器类型：${type}，部署时间：${deliveryTime}，到期时间：${endTime}，请及时查看。
            templateCode = 'SMS_139238998';
            templateParam = content;
            var msg = {
                msg_type: type,
                msg_content: `尊敬的用户，您的服务器已到期，服务器类型：${contentJson.type}，部署时间：${contentJson.deliveryTime}，到期时间：${contentJson.endTime}，请及时查看。`,
                msg_telephone: telephone
            }
            setMsg(msg);
            break;
        case "user_end_advance":
            // 尊敬的用户，您的服务器将于${day}天后到期，服务器类型：${type}，到期时间：${endTime}，请及时查看。
            templateCode = 'SMS_142148508';
            templateParam = content;
            var msg = {
                msg_type: type,
                msg_content: `尊敬的用户，您的服务器将于${contentJson.day}天后到期，服务器类型：${contentJson.type}，到期时间：${contentJson.endTime}，请及时查看。`,
                msg_telephone: telephone
            }
            setMsg(msg);
            break;
        case "user_arrear":
            // 尊敬的用户，您的弹性防护服务器已欠费，请及时查看。
            templateCode = 'SMS_139233949';
            templateParam = content;
            var msg = {
                msg_type: type,
                msg_content: `尊敬的用户，您的弹性防护服务器已欠费，请及时查看。`,
                msg_telephone: telephone
            }
            setMsg(msg);
            break;
        case "user_recharge":
            // 尊敬的用户，您已成功充值${money}元。
            templateCode = 'SMS_139238999';
            templateParam = content;
            var msg = {
                msg_type: type,
                msg_content: `尊敬的用户，您已成功充值${contentJson.money}元。`,
                msg_telephone: telephone
            }
            setMsg(msg);
            break;
        case "user_realname_success":
            // 尊敬的用户，您的实名认证已通过。
            templateCode = 'SMS_142383142';
            templateParam = content;
            break;
        case "user_realname_fail":
            // 尊敬的用户，您的实名认证未通过。
            templateCode = 'SMS_142388119';
            templateParam = content;
            break;
        case "user_refund_success":
            // 尊敬的用户，您的退款${money}元已成功退回您的账户。
            templateCode = 'SMS_139233954';
            templateParam = content;
            break;
        case "user_refund_fail":
            // 尊敬的用户，您的退款申请未能通过，请及时查看。
            templateCode = 'SMS_139243892';
            templateParam = content;
            break;

        case "admin_order_hss":
            // 您有客户${username}下单高防服务器，请及时查看。
            templateCode = 'SMS_139243889';
            templateParam = content;
            break;
        case "admin_buy":
            // 您有客户${username}付款购买服务器， 服务器类型：${type}，请及时查看部署。
            templateCode = 'SMS_139239000';
            templateParam = content;
            break;
        case "admin_end":
            // 您的客户${username}的服务器已到期，服务器类型：${type}，部署时间：${deliveryTime}，到期时间：${endTime}，请及时查看。
            templateCode = 'SMS_139233953';
            templateParam = content;
            break;
        case "admin_arrear":
            // 您的客户${username}的弹性防护服务器已欠费，请及时查看。
            templateCode = 'SMS_139243890';
            templateParam = content;
            break;
        case "admin_refund":
            // 您的客户${username}申请退款，服务器类型：${type}，请及时查看。
            templateCode = 'SMS_139229067';
            templateParam = content;
            break;
        case "admin_realName_e":
            // 您有客户申请企业实名认证，请及时查看。
            templateCode = 'SMS_142388178';
            templateParam = content;
            break;
        case "user_cashback":
            // 尊敬的用户，您已提现${balance}元，欢迎下次使用我们的产品。获取时间以实际情况为准。
            templateCode = 'SMS_139981089';
            templateParam = content;
            break;
    }

    const accessKeyId = 'LTAIMwnfM3arX9du';
    const secretAccessKey = 'xtRv16TjG1iUdHbK120kZjBNfhdvsH';
    let smsClient = new SMSClient({ accessKeyId, secretAccessKey });
    smsClient.sendSMS({
        PhoneNumbers: telephone,
        SignName: 'SuperWall智御',
        TemplateCode: templateCode,
        TemplateParam: templateParam
    }).then(function(res) {
        let { Code } = res
        if (Code === 'OK') {
            // console.log(res)
        }
    }, function(err) {
        console.log(err)
    })
}

function setMsg(msg) {
    db.query(`INSERT INTO msg_user(msg_user_id,msg_type,msg_content,msg_telephone,msg_date) \
        VALUES(replace(UUID(),'-',''),'${msg.msg_type}','${msg.msg_content}'\
        ,'${msg.msg_telephone}','${moment().format("YYYY-MM-DD HH:mm:ss")}')`, (err, data) => {
        if (err) {
            console.log(err);
        }
    })
}

function msg_ctrl(type, callback) {
    db.query(`SELECT isOpen FROM msg_config WHERE msg_name = '${type}'`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data[0].isOpen == "1") {
                callback(data);
            }
        }
    })
}


function schedule_elastic_day_calculate(order_elastic_id, user_id, protective_flow_day, end_time) {

    var user_name;
    var admin_id;
    var admin_phone;
    var user_phone;
    var ip;

    db.query(`SELECT elastic_charge.item_ids, view_order_elastic.admin_id,\
            view_order_elastic.admin_phone,view_order_elastic.user_name,\
            view_order_elastic.user_phone,view_order_elastic.ip \
            FROM view_order_elastic,elastic_charge WHERE \
            view_order_elastic.id = '${order_elastic_id}' AND \
            view_order_elastic.charge_id = elastic_charge.id`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            if (data.length != 0) {
                user_name = data[0].user_name;
                admin_id = data[0].admin_id;
                admin_phone = data[0].admin_phone;
                user_phone = data[0].user_phone;
                ip = data[0].ip;
                var item_ids = data[0].item_ids.split(',');
                query = 'SELECT * FROM elastic_charge_item '
                for (var i = 0; i < item_ids.length; i++) {
                    if (i == 0) {
                        query += "WHERE item_id = '" + item_ids[i] + "'";
                    } else {
                        query += " OR item_id = '" + item_ids[i] + "'";
                    }
                }
                query += ' ORDER BY min ASC';
                db.query(query, (err, data1) => {
                    if (err) {
                        console.log(err);
                    } else {
                        var price = 0;
                        var detail;
                        for (var i = 0; i < data1.length; i++) {
                            if (protective_flow_day < data1[i].max) {
                                price = data1[i].price;
                                break;
                            } else {
                                continue;
                            }
                        }
                        detail = `用户${user_name}因弹性防护IP${ip}每日防护扣费${price}元`;
                        db.query(`CALL proc_schedule_elastic_day ('${order_elastic_id}','${user_id}',${protective_flow_day},${price},\
                '${moment(end_time).format("YYYY-MM-DD HH:mm:ss")}','${admin_id}','${user_name}','${detail}',@status);`, function(err, rows, fields) {
                            if (err) {
                                console.error(err);
                            } else {
                                var status = rows[1][0].result;
                                if (status == 1) {
                                    // var info = {
                                    //     type: "user_arrear",
                                    //     telephone: user_phone,
                                    //     content: {}
                                    // }
                                    // sendInfo(info);
                                    // var info_admin = {
                                    //     type: "admin_arrear",
                                    //     telephone: admin_phone,
                                    //     content: {
                                    //         username: user_name
                                    //     }
                                    // }
                                    // sendInfo(info_admin);
                                } else {
                                    // console.log("errer,status:"+status); 
                                }
                            }
                        });
                    }
                });
            } else { console.log("no data"); }
        }
    });
}

/*
function schedule_elastic_day_calculate(order_elastic_id, user_id, protective_flow_day, end_time) {
    db.query(`SELECT elastic_charge.item_ids, order_elastic.admin_id \
            FROM order_elastic,elastic_charge WHERE \
            order_elastic.order_elastic_id = '${order_elastic_id}' AND \
            order_elastic.elastic_charge_id = elastic_charge.id`, (err, data) => {
        var item_ids = data[0].item_ids.split(',');
        query = 'SELECT * FROM elastic_charge_item '
        for (var i = 0; i < item_ids.length; i++) {
            if (i == 0) {
                query += "WHERE item_id = '" + item_ids[i] + "'";
            } else {
                query += " OR item_id = '" + item_ids[i] + "'";
            }
        }
        query += ' ORDER BY min ASC'
        db.query(query, (err, data1) => {
            if (err) {
                console.log(err);
            } else {
                var price = 0;
                for (var i = 0; i < data1.length; i++) {
                    if (protective_flow_day < data1[i].max) {
                        price = data1[i].price;
                        break;
                    } else {
                        continue;
                    }
                }
                db.query(`INSERT INTO order_elastic_running_day VALUES(replace(UUID(),'-',''),\
                            '${order_elastic_id}',\
                            '${user_id}',\
                            '${protective_flow_day}',\
                            '${price}',\
                            '${moment(end_time).format('YYYY-MM-DD HH:mm:ss')}')`, (err, data2) => {
                    if (err) {
                        console.log(err);
                    } else {
                        db.query(`UPDATE user SET balance = balance - ${price} \
                                WHERE ID = '${user_id}'`, (err, data) => {
                            if (err) {
                                console.log(err);
                            } else {
                                db.query(`SELECT balance,telephone,username FROM user WHERE ID = '${user_id}'`, (err, data3) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (parseInt(data3[0].balance) < 0) {
                                            db.query(`UPDATE order_elastic SET isSchedule = 1, status = 1005 \
                                                    WHERE order_elastic_id = '${order_elastic_id}'`, (err, data4) => {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    db.query(`INSERT INTO record_pay_elastic VALUES(replace(UUID(),'-',''),\
                                                            '${order_elastic_id}',\
                                                            '${user_id}',\
                                                            '${price}',\
                                                            '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                                                            '流量防护费用')`, (err, data4) => {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            // console.log("欠费")
                                                            //停止计时器
                                                            // job_day[order_elastic_id].cancel();
                                                            db.query(`INSERT INTO info_user VALUES(\
                                                                    replace(UUID(),'-',''),\
                                                                    '${user_id}',\
                                                                    '/center/elastic/detail?id=${order_elastic_id}',\
                                                                    '您有一个弹性防护服务器已欠费',\
                                                                    '1001',\
                                                                    '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                                                                    null\
                                                                    )`, (err, data5) => {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            })
                                                            db.query(`INSERT INTO info_admin VALUES(\
                                                                    replace(UUID(),'-',''),\
                                                                    '1004',\
                                                                    '${data[0].admin_id}',\
                                                                    '/admingly/order/elastic/detail?id=${order_elastic_id}',\
                                                                    '您的客户${data3[0].username}的弹性防护服务器已欠费，请及时查看。',\
                                                                    '1001',\
                                                                    '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                                                                    null\
                                                                    )`, (err, data5) => {
                                                                if (err) {
                                                                    console.log(err);
                                                                }
                                                            })
                                                            var info = {
                                                                type: "user_arrear",
                                                                telephone: data3[0].telephone,
                                                                content: {}
                                                            }
                                                            sendInfo(info);
                                                            db.query(`SELECT telephone FROM admin WHERE admin_id='${data[0].admin_id}'`,(err,data55)=>{
                                                                if (err) {
                                                                    console.error(err);
                                                                } else {
                                                                    var info_admin = {
                                                                        type: "admin_arrear",
                                                                        telephone: data55[0].telephone,
                                                                        content:{
                                                                            username: data3[0].username
                                                                        }
                                                                    }
                                                                    sendInfo(info_admin);
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            db.query(`INSERT INTO record_pay_elastic VALUES(replace(UUID(),'-',''),\
                                                        '${order_elastic_id}',\
                                                        '${user_id}',\
                                                        '${price}',\
                                                        '${moment().format("YYYY-MM-DD HH:mm:ss")}',\
                                                        '流量防护费用')`, (err, data4) => {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    // db.query(`SELECT deliveryTime, endTime FROM order_elastic WHERE order_elastic_id = '${order_elastic_id}'`, (err, data5) => {
                                                    //     if (err) {
                                                    //         console.log(err);
                                                    //     } else {
                                                    //         // console.log("缴费")
                                                    //     }
                                                    // })
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })

    })
}
*/

function getAttackLogByIP_elastic_day(order_elastic_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_day = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_day += parseInt(attackLog[i].size);
            }
            schedule_elastic_day_calculate(order_elastic_id, user_id, protective_flow_day / 1024 / 1024 / 1024, end_time)
        }
    });
}

function getAttackLogByIP_ddos_day(order_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    // console.log("getAttackLogByIP_elastic_day")
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_day = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_day += parseInt(attackLog[i].size);
            }
            db.query(`INSERT INTO order_ddos_running_day VALUES(replace(UUID(),'-',''),\
                    '${order_id}',\
                    '${user_id}',\
                    '${protective_flow_day / 1024 / 1024 / 1024}',\
                    0,\
                    '${moment(end_time).format('YYYY-MM-DD HH:mm:ss')}')`, (err, data1) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    });
}

function getAttackLogByIP_hss_day(order_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    // console.log("getAttackLogByIP_elastic_day")
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_day = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_day += parseInt(attackLog[i].size);
            }
            db.query(`INSERT INTO order_hss_running_day VALUES(replace(UUID(),'-',''),\
                    '${order_id}',\
                    '${user_id}',\
                    '${protective_flow_day / 1024 / 1024 / 1024}',\
                    0,\
                    '${moment(end_time).format('YYYY-MM-DD HH:mm:ss')}')`, (err, data1) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    });
}

// 根据IP获取弹性防护攻击数据
function getAttackLogByIP_elastic(order_elastic_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    // console.log("getAttackLogByIP_elastic");
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_hour = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_hour += parseInt(attackLog[i].size);
            }
            db.query(`INSERT INTO order_elastic_running_hour VALUES(replace(UUID(),'-',''),\
                    '${order_elastic_id}',\
                    '${user_id}',\
                    '${protective_flow_hour}',\
                    '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (err, data1) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("hour: " + order_elastic_id + ":" + protective_flow_hour);
                    db.query(`SELECT balance FROM user WHERE ID = '${user_id}'`, (err, data3) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (parseInt(data3[0].balance) < 0) {
                                // 停止计时器
                                // job_hour[order_elastic_id].cancel();
                            }
                        }
                    });
                }
            })
        }
    });
}

// 根据IP获取高防服务器攻击数据
function getAttackLogByIP_hss(order_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    // console.log("getAttackLogByIP_elastic");
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_hour = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_hour += parseInt(attackLog[i].size);
            }
            db.query(`INSERT INTO order_hss_running_hour VALUES(replace(UUID(),'-',''),\
                    '${order_id}',\
                    '${user_id}',\
                    '${protective_flow_hour}',\
                    '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (err, data1) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("hour: " + order_elastic_id + ":" + protective_flow_hour);
                    db.query(`SELECT balance FROM user WHERE ID = '${user_id}'`, (err, data3) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (parseInt(data3[0].balance) < 0) {
                                // 停止计时器
                                // job_hour[order_elastic_id].cancel();
                            }
                        }
                    });
                }
            })
        }
    });
}

// 根据IP获取DDoS服务器攻击数据
function getAttackLogByIP_ddos(order_id, user_id, strAuthorityPork, ip, start_time, end_time) {
    // console.log("getAttackLogByIP_elastic");
    var requestData = {
        "strAuthorityPork": strAuthorityPork,
        "ip": ip,
        "start_time": start_time,
        "end_time": end_time
    }
    request({
        url: "http://103.44.147.57:5544/api/getAttackLogByIP",
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(requestData)
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            var attackLog = content.data;
            // 添加攻击记录-elastic
            var protective_flow_hour = 0;
            for (var i = 0; i < attackLog.length; i++) {
                protective_flow_hour += parseInt(attackLog[i].size);
            }
            db.query(`INSERT INTO order_ddos_running_hour VALUES(replace(UUID(),'-',''),\
                    '${order_id}',\
                    '${user_id}',\
                    '${protective_flow_hour}',\
                    '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (err, data1) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("hour: " + order_elastic_id + ":" + protective_flow_hour);
                    db.query(`SELECT balance FROM user WHERE ID = '${user_id}'`, (err, data3) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if (parseInt(data3[0].balance) < 0) {
                                // 停止计时器
                                // job_hour[order_elastic_id].cancel();
                            }
                        }
                    });
                }
            })
        }
    });
}