import { render,screen,waitFor } from '@testing-library/react';
import { afterEach,describe,expect,test,vi } from 'vitest';
import App from './App';

const envelope={status:'success',sourceMode:'internal_postgresql',readOnly:true,dryRun:true,writesBlocked:true,externalSendsBlocked:true,approvalRequired:false,auditId:'audit-live-overview',warnings:[],data:{headline:'Live founder summary'}};
const wave1={status:'ready',sellerCount:14,sellers:[{productCount:489}],writesBlocked:true,externalContactBlocked:true,marketComparisonPerformed:false,marketCompletenessClaim:false,bestSupplierClaim:false,basketOptimizerStatus:'deferred'};
const inventory={productsWithInitializedInventory:489,physicallyVerifiedProducts:0,initialQuantityPerProduct:100,inventorySource:'founder_authorized_initialization',physicalCountVerified:false};
const originalMatchMedia=window.matchMedia;

describe('App',()=>{
  afterEach(()=>{
    vi.restoreAllMocks();
    Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:originalMatchMedia});
    sessionStorage.clear();
    window.history.pushState({},'', '/');
  });

  test('renders the public CornerOps landing at root',async()=>{
    render(<App/>);
    expect(await screen.findByRole('heading',{name:'Run the company from the signal, not the noise.'})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Operator sign in'})).toHaveAttribute('href','/login');
    expect(screen.getByText('PRODUCT PREVIEW')).toBeInTheDocument();
  });

  test('keeps the landing static when reduced motion is requested',async()=>{
    Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:vi.fn().mockReturnValue({
      matches:true,
      media:'(prefers-reduced-motion: reduce)',
      addEventListener:vi.fn(),
      removeEventListener:vi.fn(),
    })});
    const { container }=render(<App/>);
    await waitFor(()=>expect(container.querySelector('.co-public')).toHaveAttribute('data-motion','reduced'));
  });

  test('renders the truthful non-authenticated login gateway',async()=>{
    window.history.pushState({},'', '/login');
    render(<App/>);
    expect(await screen.findByRole('heading',{name:'Sign in to CornerOps'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Authentication pending gated integration'})).toBeDisabled();
    expect(screen.getByText(/No placeholder credential or fake login path is active/)).toBeInTheDocument();
  });

  test('preserves live Overview on its operational route without production fixtures',async()=>{
    window.history.pushState({},'', '/overview');
    sessionStorage.setItem('cornerops-console-token','test-token');
    vi.spyOn(globalThis,'fetch').mockImplementation(async input=>{
      const url=String(input);
      const body=url.endsWith('/health')?{status:'ok',service:'cornerops-ai',dataSource:{mode:'supabase'}}:url.includes('wave1-activation')?wave1:url.includes('inventory/initialization-status')?inventory:envelope;
      return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
    });
    render(<App/>);
    expect(await screen.findByRole('heading',{name:'Overview'})).toBeInTheDocument();
    await waitFor(()=>expect(screen.getAllByText('489')).toHaveLength(2));
    expect(screen.queryByText(/Data layer MOCK|Usuario 1|order #123/)).not.toBeInTheDocument();
    expect(screen.getByText('Writes blocked')).toBeInTheDocument();
  });
});
