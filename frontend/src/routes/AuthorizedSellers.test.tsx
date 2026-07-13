import { render,screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach,beforeEach,describe,expect,test,vi } from 'vitest';
import { AuthorizedSellers } from './AuthorizedSellers';

const network={sellers:[
  {canonicalKey:'intermex-uae',canonicalName:'Intermex UAE',authorizationStatus:'founder_attested',sourceMode:'verified_public',captureStatus:'complete',catalogProductCount:190},
  {canonicalKey:'la-tiendita',canonicalName:'La Tiendita',authorizationStatus:'founder_attested',sourceMode:'verified_public',captureStatus:'complete',catalogProductCount:0},
]};
const wave1={status:'ready',sellerCount:14,sellers:[
  {sellerId:'one',canonicalKey:'intermex-uae',canonicalName:'Intermex UAE',activationOrder:3,pipelineScore:85,pipelinePriority:'A',sourceVerificationStatus:'source_verified',captureStatus:'complete',productCount:190,publicPriceCount:190,imageCount:0,inventoryProductCount:190,physicalCountVerifiedCount:0,catalogReady:true,comparisonReady:true},
  {sellerId:'two',canonicalKey:'la-tiendita',canonicalName:'La Tiendita',activationOrder:2,pipelineScore:90,pipelinePriority:'A',sourceVerificationStatus:'source_verified',captureStatus:'complete',productCount:299,publicPriceCount:299,imageCount:278,inventoryProductCount:299,physicalCountVerifiedCount:0,catalogReady:true,comparisonReady:true},
],writesBlocked:true,externalContactBlocked:true,marketComparisonPerformed:false,marketCompletenessClaim:false,bestSupplierClaim:false,basketOptimizerStatus:'not_implemented'};

describe('Authorized Sellers v1.14 totals',()=>{
  beforeEach(()=>{sessionStorage.setItem('cornerops-console-token','test-token');vi.spyOn(globalThis,'fetch').mockImplementation(async(input)=>{const url=String(input);const body=url.includes('wave1-activation')?wave1:url.includes('seller-readiness')?{sellers:wave1.sellers}:url.includes('seller-catalog-gaps')?{gaps:[]}:network;return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});});});
  afterEach(()=>{vi.restoreAllMocks();sessionStorage.clear();});
  test('uses persisted Wave 1 activation instead of stale registry totals',async()=>{render(<MemoryRouter><AuthorizedSellers/></MemoryRouter>);expect(await screen.findByText('489')).toBeInTheDocument();expect(screen.getByText('Verified catalog products')).toBeInTheDocument();});
});
