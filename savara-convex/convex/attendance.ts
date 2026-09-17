import { mutation } from "./_generated/server";
import { v } from "convex/values";

function jakartaDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function weeklyKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(now);
  const y = Number(parts.find(p=>p.type === "year")!.value), m = Number(parts.find(p=>p.type === "month")!.value), d = Number(parts.find(p=>p.type === "day")!.value);
  const weekday = parts.find(p=>p.type === "weekday")!.value;
  const jsDay = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[weekday] ?? 0;
  const date = new Date(Date.UTC(y,m-1,d)); date.setUTCDate(date.getUTCDate() - (jsDay === 0 ? 6 : jsDay-1));
  return date.toISOString().slice(0,10);
}

export const toggle = mutation({ args: { id: v.id("people"), type: v.union(v.literal("admin"), v.literal("member")) }, handler: async (ctx,args) => {
  const person = await ctx.db.get(args.id); if (!person) throw new Error("Data tidak ditemukan");
  if (person.type !== args.type) throw new Error("Tipe data tidak cocok");
  const cycleKey = `${args.type}:${args.type === "admin" ? jakartaDateKey() : weeklyKey()}`;
  const existing = await ctx.db.query("attendance").withIndex("by_person_cycle", q=>q.eq("personId",args.id).eq("cycleKey",cycleKey)).unique();
  if (existing) await ctx.db.delete(existing._id);
  else await ctx.db.insert("attendance", { personId: args.id, cycleKey, status: "Hadir", markedAt: Date.now() });
}});
