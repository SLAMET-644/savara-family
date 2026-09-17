import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  people: defineTable({
    name: v.string(),
    type: v.union(v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),
  attendance: defineTable({
    personId: v.id("people"),
    cycleKey: v.string(),
    status: v.literal("Hadir"),
    markedAt: v.number(),
  }).index("by_person_cycle", ["personId", "cycleKey"]).index("by_cycle", ["cycleKey"]),
});
