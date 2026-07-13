const request=require('supertest');
const fs=require('fs');
const path=require('path');

const distPath=path.join(__dirname,'..','frontend','dist');
const indexPath=path.join(distPath,'index.html');
let createdFixture=false;

const loadApp=(enabled)=>{jest.resetModules();process.env.CORNEROPS_FRONTEND_SERVE_ENABLED=enabled?'true':'false';return require('../src/app');};

describe('frontend static serving v1.14',()=>{
  beforeAll(()=>{if(!fs.existsSync(indexPath)){fs.mkdirSync(distPath,{recursive:true});fs.writeFileSync(indexPath,'<!doctype html><html><body><div id="root"></div></body></html>');createdFixture=true;}});
  afterAll(()=>{if(createdFixture)fs.rmSync(distPath,{recursive:true,force:true});});
  afterEach(()=>{delete process.env.CORNEROPS_FRONTEND_SERVE_ENABLED;});
  test('serves SPA HTML only for non-API HTML GET routes when enabled',async()=>{const app=loadApp(true);await request(app).get('/authorized-sellers').set('Accept','text/html').expect(200).expect('Content-Type',/html/);await request(app).get('/authorized-sellers/seller-id').set('Accept','text/html').expect(200);await request(app).get('/seller-catalog').set('Accept','text/html').expect(200);await request(app).get('/seller-inventory').set('Accept','text/html').expect(200);await request(app).get('/seller-comparison').set('Accept','text/html').expect(200);});
  test('unknown API and non-HTML requests remain JSON 404',async()=>{const app=loadApp(true);await request(app).get('/api/not-a-real-route').expect(404).expect('Content-Type',/json/);await request(app).get('/not-a-real-route').set('Accept','application/json').expect(404).expect('Content-Type',/json/);});
  test('frontend kill switch fails safely',async()=>{const app=loadApp(false);await request(app).get('/authorized-sellers').set('Accept','text/html').expect(404).expect('Content-Type',/json/);});
});
