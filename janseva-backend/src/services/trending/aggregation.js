const { Report } = require("../../models/report.model");

const SEVERITY_MAP = {
  critical: 40,
  high: 20,
  medium: 10,
  low: 5,
};

const CATEGORY_RISK_MAP = {
  women_safety: 15,
  pilgrimage: 12,
  wildlife: 10,
  road_damage: 8,
  water: 8,
  electricity: 6,
  sanitation: 5,
  other: 3,
};

function getPriorityScore(report) {
  const r = report || {};

  const votes         = Number(r.votes) || 0;
  const severityPts   = SEVERITY_MAP[r.severity] || 0;
  const categoryRisk  = CATEGORY_RISK_MAP[r.category] ?? CATEGORY_RISK_MAP.other;

  const createdAt     = r.createdAt ? new Date(r.createdAt) : null;
  const createdAtMs   = createdAt instanceof Date && !isNaN(createdAt) ? createdAt.getTime() : Date.now();
  const ageInDays     = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));
  const ageScore      = Math.min(Math.floor(ageInDays * 1.5), 30); // capped at 30

  const month         = new Date().getUTCMonth(); // 0-indexed
  const monsoonBonus  = month >= 5 && month <= 8 ? 10 : 0;

  return votes * 2 + severityPts + ageScore + categoryRisk + monsoonBonus;
}

async function getTrendingDistricts(days = 7, limit = 13) {
  const safeDays  = Number.isFinite(Number(days))  && Number(days)  > 0 ? Math.floor(Number(days))  : 7;
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : 13;

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - safeDays);

  const pipeline = [
    // 1. Only active, located reports within window
    {
      $match: {
        createdAt: { $gte: sinceDate },
        status:    { $nin: ["resolved", "closed"] },
        district:  { $exists: true, $ne: null, $ne: "" },
      },
    },

    // 2. Group by district + category, collect votes too
    {
      $group: {
        _id: {
          district: "$district",
          category: "$category",
        },
        count: { $sum: 1 },
        totalVotes: { $sum: "$votes" },           // ← was missing before
        severityScore: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ["$severity", "critical"] }, then: 40 },
                { case: { $eq: ["$severity", "high"] },     then: 20 },
                { case: { $eq: ["$severity", "medium"] },   then: 10 },
                { case: { $eq: ["$severity", "low"] },      then: 5  },
              ],
              default: 0,
            },
          },
        },
      },
    },

    // 3. Sort within district so topCategory = highest-count category
    {
      $sort: { "_id.district": 1, count: -1 },
    },

    // 4. Collapse to one doc per district
    {
      $group: {
        _id:          "$_id.district",
        totalReports: { $sum: "$count" },
        totalVotes:   { $sum: "$totalVotes" },    // ← carry votes forward
        severityScore:{ $sum: "$severityScore" },
        topCategory:  { $first: "$_id.category" },
      },
    },

    // 5. Compute priorityScore inside the pipeline
    {
      $addFields: {
        priorityScore: {
          $add: [
            { $multiply: ["$totalVotes", 2] },    // votes × 2
            "$severityScore",                      // severity points
            // age bonus not feasible in pure aggregation — added in JS below
            { $cond: [
                { $in: ["$topCategory", ["women_safety", "pilgrimage"]] },
                12, // rough category risk for top 2 high-risk categories
                5,
            ]},
          ],
        },
      },
    },

    {
      $project: {
        _id:          0,
        district:     "$_id",
        totalReports: 1,
        totalVotes:   1,
        severityScore:1,
        topCategory:  1,
        priorityScore:1,
      },
    },

    { $sort: { priorityScore: -1, totalReports: -1 } },
    { $limit: safeLimit },
  ];

  const results = await Report.aggregate(pipeline).exec();
  const month = new Date().getUTCMonth();
  const monsoonBonus = month >= 5 && month <= 8 ? 10 : 0;

  return results
    .map((d) => ({
      ...d,
      priorityScore:
        d.totalVotes * 2 +
        d.severityScore +
        (CATEGORY_RISK_MAP[d.topCategory] ?? CATEGORY_RISK_MAP.other) +
        monsoonBonus,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

async function getReportsWithPriority(filter = {}, limit = 20) {
  const reports = await Report.find({
    status: { $nin: ["resolved", "closed"] },
    ...filter,
  })
    .limit(limit)
    .lean();

  return reports
    .map((r) => ({ ...r, priorityScore: getPriorityScore(r) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

module.exports = { getTrendingDistricts, getPriorityScore, getReportsWithPriority };