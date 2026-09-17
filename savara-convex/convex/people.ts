import { mutation, query } from "./_generated/server";
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

export const list = query({ args: {}, handler: async (ctx) => {
  const admins = await ctx.db.query("people").withIndex("by_type", q => q.eq("type", "admin")).collect();
  const members = await ctx.db.query("people").withIndex("by_type", q => q.eq("type", "member")).collect();
  const adminCycle = `admin:${jakartaDateKey()}`;
  const memberCycle = `member:${weeklyKey()}`;
  const attendance = await ctx.db.query("attendance").collect();
  const map = new Map(attendance.map(a => [`${a.personId}:${a.cycleKey}`, a.status]));
  const format = (p: any, cycle: string) => ({ id: p._id, name: p.name, type: p.type, status: map.get(`${p._id}:${cycle}`) || "Belum Absen" });
  return { admins: admins.map(p=>format(p,adminCycle)), members: members.map(p=>format(p,memberCycle)) };
}});

export const create = mutation({ args: { name: v.string(), type: v.union(v.literal("admin"), v.literal("member")) }, handler: async (ctx,args) => {
  const name = args.name.trim(); if (!name) throw new Error("Nama wajib diisi");
  return await ctx.db.insert("people", { name, type: args.type, createdAt: Date.now(), updatedAt: Date.now() });
}});

export const update = mutation({ args: { id: v.id("people"), name: v.string() }, handler: async (ctx,args) => {
  const name = args.name.trim(); if (!name) throw new Error("Nama wajib diisi");
  await ctx.db.patch(args.id, { name, updatedAt: Date.now() });
}});

export const remove = mutation({ args: { id: v.id("people") }, handler: async (ctx,args) => {
  const records = await ctx.db.query("attendance").filter(q => q.eq(q.field("personId"), args.id)).collect();
  for (const r of records) await ctx.db.delete(r._id);
  await ctx.db.delete(args.id);
}});
