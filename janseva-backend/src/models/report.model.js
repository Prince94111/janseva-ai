const mongoose = require("mongoose");

const { Schema } = mongoose;

const REPORT_CATEGORIES = {
  ROAD_DAMAGE: "road_damage",
  WOMEN_SAFETY: "women_safety",
  WILDLIFE: "wildlife",
  PILGRIMAGE: "pilgrimage",
  WATER: "water",
  ELECTRICITY: "electricity",
  SANITATION: "sanitation",
  OTHER: "other",
};

const REPORT_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

const REPORT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

const UTTARAKHAND_DISTRICTS = [
  "Almora",
  "Bageshwar",
  "Chamoli",
  "Champawat",
  "Dehradun",
  "Haridwar",
  "Nainital",
  "Pauri Garhwal",
  "Pithoragarh",
  "Rudraprayag",
  "Tehri Garhwal",
  "Udham Singh Nagar",
  "Uttarkashi",
];

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
  },
  { _id: false }
);

const governmentResponseSchema = new Schema(
  {
    message: {
      type: String,
      trim: true,
    },
    officerName: {
      type: String,
      trim: true,
    },
    updatedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const reportSchema = new Schema(
  {
    reportId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(REPORT_CATEGORIES),
      required: true,
    },
    severity: {
      type: String,
      enum: Object.values(REPORT_SEVERITY),
      default: REPORT_SEVERITY.LOW,
    },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
    },
    district: {
      type: String,
      enum: UTTARAKHAND_DISTRICTS,
      required: true,
    },
    location: {
      type: locationSchema,
    },
    address: {
      type: String,
      trim: true,
    },
    photos: [
      {
        type: String,
        trim: true,
      },
    ],
    votes: {
      type: Number,
      default: 0,
      min: 0,
    },
    voterIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    aiInsights: {
      type: String,
      trim: true,
    },
    aiCategory: {
      type: String,
      trim: true,
    },
    suggestedDepartment: {
      type: String,
      trim: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    governmentResponse: governmentResponseSchema,
    cluster: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.pre("save", async function() {
  if (this.reportId) return;
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  this.reportId = `JS-${year}-${randomNumber}`;
});

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ district: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ severity: 1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = {
  Report,
  REPORT_CATEGORIES,
  REPORT_SEVERITY,
  REPORT_STATUS,
  UTTARAKHAND_DISTRICTS,
};

