const reportModel = require('../models/reportModel');

async function getDoctorsReport(req, res) {
  res.json(await reportModel.getDoctorsReport());
}

async function getBusyDaysReport(req, res) {
  res.json(await reportModel.getBusyDaysReport());
}

module.exports = { getDoctorsReport, getBusyDaysReport };
