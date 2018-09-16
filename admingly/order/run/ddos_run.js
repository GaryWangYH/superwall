const express = require('express');
const fs = require('fs');
const common = require('../../../../libs/common');
const moment =  require('moment');
const async = require('async');
const db = common.db();
const bodyParser = require('body-parser');
const request = require('request');

module.exports = function() {
    var router = express.Router();

    router.get("/data_time", (req, res) => {
        var day = req.query.day;
        var start_time = moment().subtract(day, 'days').format("YYYY-MM-DD HH:00:00");
        var end_time = moment().format("YYYY-MM-DD HH:00:00");

        db.query(`SELECT ip \
                FROM order_ddos \
                WHERE order_id = '${req.query.id}'`, (err, data) => {
            if (err) {
                console.log(err);
                 // res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                        var requestData = {
                    "strAuthorityPork": common.strAuthorityPork,
                    "ip": data[0].ip,
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

                        attackLog_hours = divideByTime(attackLog,start_time,end_time);

                        for (var i = 0; i < attackLog.length; i++) {
                            attackLog[i].size = Math.round((attackLog[i].size / 1024 / 1024) * 100) / 100;
                            attackLog[i].start_time = moment(attackLog[i].start_time).format("MM-DD HH:mm:ss");
                            attackLog[i].end_time = moment(attackLog[i].end_time).format("MM-DD HH:mm:ss");
                            attackLog[i].index = i+1;
                        }

                        res.status(200).send({ data: JSON.stringify(attackLog_hours), attackLog: JSON.stringify(attackLog) }).end();
                    }
                });
            } else {
                        res.redirect('/error');
                    }
            }
        })
    })

    router.get("/data_time_date", (req, res) => {
        var start_time = req.query.start_time;
        var end_time = req.query.end_time;

        db.query(`SELECT ip \
                FROM order_ddos \
                WHERE order_id = '${req.query.id}'`, (err, data) => {
            if (err) {
                console.log(err);
                 // res.redirect('/error');//res.status(500).send('database error').end();
            } else {
                if (common.debugData(data)) {
                        var requestData = {
                    "strAuthorityPork": common.strAuthorityPork,
                    "ip": data[0].ip,
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

                        attackLog_hours = divideByTime(attackLog,start_time,end_time);

                        for (var i = 0; i < attackLog.length; i++) {
                            attackLog[i].size = Math.round((attackLog[i].size / 1024 / 1024) * 100) / 100;
                            attackLog[i].start_time = moment(attackLog[i].start_time).format("MM-DD HH:mm:ss");
                            attackLog[i].end_time = moment(attackLog[i].end_time).format("MM-DD HH:mm:ss");
                            attackLog[i].index = i+1;
                        }

                        res.status(200).send({ data: JSON.stringify(attackLog_hours), attackLog: JSON.stringify(attackLog) }).end();
                    }
                });
            } else {
                        res.redirect('/error');
                    }
            }
        })
    })
    
    function divideByTime(attackLog,start_time,end_time) {
        var attackLog_hours = [];

        var duration = moment(end_time).diff(moment(start_time));

        var divide = duration / 24;

        for (var i = 23; i >= 0; i--) {

            var start = moment(start_time).add(divide * i,'ms').format("YYYY-MM-DD HH:00:00");
            var end = moment(start_time).add(divide * (i+1),'ms').format("YYYY-MM-DD HH:00:00");

            var attackLog_hour = {}
            var size_sum = 0;
            var attack_sum = 0;
            for (var a = 0; a < attackLog.length; a++) {
                if (moment(attackLog[a].start_time, "YYYY-MM-DD HH:mm:ss").isBetween(start,end)) {
                    size_sum += parseInt(attackLog[a].size);
                    attack_sum += 1;
                }
            }
            attackLog_hour = {
                date: moment(end).format("MM-DD HH:mm"),
                protective_flow: Math.round((size_sum / 1024 / 1024) * 100) / 100
            }
            attackLog_hours.push(attackLog_hour);
        }

        return attackLog_hours;
    }
    
    return router;
}