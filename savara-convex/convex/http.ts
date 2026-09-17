import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const options = new Response(null, { status: 204, headers: cors });

http.route({ path: "/api/people/list", method: "GET", handler: httpAction(async ctx => json(await ctx.runQuery(api.people.list, {}))) });
http.route({ path: "/api/people/create", method: "POST", handler: httpAction(async (ctx,req) => { try { const b=await req.json(); await ctx.runMutation(api.people.create,{name:String(b.name||""),type:b.type}); return json({ok:true}); } catch(e){ return json({error:e instanceof Error?e.message:"Gagal"},400); } }) });
http.route({ path: "/api/people/update", method: "POST", handler: httpAction(async (ctx,req) => { try { const b=await req.json(); await ctx.runMutation(api.people.update,{id:b.id,name:String(b.name||"")}); return json({ok:true}); } catch(e){ return json({error:e instanceof Error?e.message:"Gagal"},400); } }) });
http.route({ path: "/api/people/delete", method: "POST", handler: httpAction(async (ctx,req) => { try { const b=await req.json(); await ctx.runMutation(api.people.remove,{id:b.id}); return json({ok:true}); } catch(e){ return json({error:e instanceof Error?e.message:"Gagal"},400); } }) });
http.route({ path: "/api/attendance/toggle", method: "POST", handler: httpAction(async (ctx,req) => { try { const b=await req.json(); await ctx.runMutation(api.attendance.toggle,{id:b.id,type:b.type}); return json({ok:true}); } catch(e){ return json({error:e instanceof Error?e.message:"Gagal"},400); } }) });

for (const path of ["/api/people/list","/api/people/create","/api/people/update","/api/people/delete","/api/attendance/toggle"]) http.route({ path, method: "OPTIONS", handler: httpAction(async ()=>options) });
export default http;
