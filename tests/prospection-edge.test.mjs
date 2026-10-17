import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('mail integration fails closed and MIME cannot inject recipients or headers',async()=>{
 let handler;let role='admin';let signedIn=true;const outgoing=[];
 const db={auth:{getUser:async()=>({data:{user:signedIn?{id:'admin-id'}:null},error:null})},from:table=>({select(){return this;},eq(){return this;},single:async()=>({data:table==='profiles'?{role,is_active:true}:{gemini_model:'gemini-3.8-flash'},error:null})})};
 const context=vm.createContext({Deno:{env:{get:key=>key==='SUPABASE_SERVICE_ROLE_KEY'?'server-only-test-key':''},serve:f=>{handler=f;}},createClient:()=>db,Response,Request,URL,URLSearchParams,TextEncoder,AbortSignal,Date,console,btoa,fetch:async(...args)=>{outgoing.push(args);return Response.json({error:'blocked'},{status:403});}});
 const source=readFileSync(new URL('../supabase/functions/prospection/index.ts',import.meta.url),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replace(/^import .*?;\s*/,'');
 vm.runInContext(js,context);
 const call=(action,token='user-token')=>handler(new Request('https://local.test',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({action})}));
 let r=await call('status');assert.equal(r.status,200);assert.deepEqual(await r.json(),{gemini:false,gmail:false,sender:'emprexagencia@gmail.com',scheduler:false});
 r=await call('enable');assert.equal(r.status,409);
 r=await call('dispatch','server-only-test-key');assert.equal(r.status,409);
 r=await call('analyze');assert.equal(r.status,400); // Missing audit log client path also cannot send mail.
 role='setter';r=await call('enable');assert.equal(r.status,403);
 role='technical_partner';r=await call('status');assert.equal(r.status,403);
 role='admin';signedIn=false;r=await call('status');assert.equal(r.status,401);
 assert.equal(outgoing.length,0,'no provider requests without configured connections');
 assert.throws(()=>vm.runInContext(`rawMail({id:'a',subject:'test\\r\\nBcc: other@example.test',body:'hello'},{email:'demo@example.test'})`,context),/inválido/);
 assert.throws(()=>vm.runInContext(`rawMail({id:'a',subject:'test',body:'hello'},{email:'name<demo@example.test>'})`,context),/inválido/);
 const raw=vm.runInContext(`rawMail({id:'11111111-1111-4111-8111-111111111111',subject:'Hola, José',body:'Contenido de prueba'},{email:'demo@example.test'})`,context);
 const decoded=Buffer.from(raw,'base64url').toString('utf8');assert.match(decoded,/To: demo@example.test\r\n/);assert.match(decoded,/Message-ID: <11111111-1111-4111-8111-111111111111@emprex-flow.vercel.app>/);
 await assert.rejects(vm.runInContext(`hasReply('token','demo@example.test','2026-10-01T00:00:00Z')`,context),/detuvieron los envíos/);
});

